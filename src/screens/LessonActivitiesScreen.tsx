import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService, { ActivityDto, ActivityTypeDto } from '../services/api';
import { getLearningLanguageField, getLanguageKey } from '../utils/languageUtils';
import { Language } from '../utils/translations';

interface RouteParams {
  lessonId: number;
  lessonName?: string;
  levelId?: number;
}

interface GroupedActivity {
  activityType: ActivityTypeDto;
  activities: ActivityDto[];
}

const LessonActivitiesScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { currentUser } = useUser();
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  
  const params = route.params as RouteParams;
  const lessonId = params?.lessonId || 1;
  const lessonName = params?.lessonName || 'Lesson';

  const [groupedActivities, setGroupedActivities] = useState<GroupedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        
        // Fetch activities for this lesson (stage)
        const activities = await apiService.getActivitiesByStage(lessonId);
        
        // Fetch all activity types
        const activityTypes = await apiService.getAllActivityTypes();
        
        // Fetch main activities to identify Learning
        const mainActivities = await apiService.getAllMainActivities();
        const learningMainActivity = mainActivities.find(ma => 
          ma.name_en.toLowerCase() === 'learning'
        );
        
        // Group activities by activity type
        const grouped: GroupedActivity[] = [];
        const activityTypeMap = new Map<number, ActivityTypeDto>();
        
        activityTypes.forEach(type => {
          activityTypeMap.set(type.id, type);
        });
        
        // Create groups
        const typeGroups = new Map<number, ActivityDto[]>();
        activities.forEach(activity => {
          if (!typeGroups.has(activity.activityTypeId)) {
            typeGroups.set(activity.activityTypeId, []);
          }
          typeGroups.get(activity.activityTypeId)!.push(activity);
        });
        
        // Sort activities within each group by sequenceOrder
        typeGroups.forEach((acts, typeId) => {
          acts.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        });
        
        // Separate Learning activity types from others
        const learningGroups: GroupedActivity[] = [];
        const otherGroups: GroupedActivity[] = [];
        
        typeGroups.forEach((acts, typeId) => {
          const activityType = activityTypeMap.get(typeId);
          if (!activityType) return;
          
          // Check if this activity type belongs to Learning main activity
          const isLearning = learningMainActivity && 
            activityType.mainActivityId === learningMainActivity.id;
          
          const group: GroupedActivity = {
            activityType,
            activities: acts,
          };
          
          if (isLearning) {
            learningGroups.push(group);
          } else {
            otherGroups.push(group);
          }
        });
        
        // Sort Learning groups by activity type name for consistency
        learningGroups.sort((a, b) => {
          const nameA = getLearningLanguageField(learningLanguage, a.activityType) || '';
          const nameB = getLearningLanguageField(learningLanguage, b.activityType) || '';
          return nameA.localeCompare(nameB);
        });
        
        // Sort other groups by activity type name
        otherGroups.sort((a, b) => {
          const nameA = getLearningLanguageField(learningLanguage, a.activityType) || '';
          const nameB = getLearningLanguageField(learningLanguage, b.activityType) || '';
          return nameA.localeCompare(nameB);
        });
        
        // Add Learning groups first, then other groups
        grouped.push(...learningGroups);
        grouped.push(...otherGroups);
        
        setGroupedActivities(grouped);
      } catch (error: any) {
        console.error('Error fetching activities:', error);
        Alert.alert('Error', 'Failed to load activities. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Animate header
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [lessonId]);

  const handleActivityPress = (activity: ActivityDto, activityType: ActivityTypeDto) => {
    // Navigate based on activity type JSON method
    if (activityType.jsonMethod) {
      (navigation as any).navigate('DynamicActivity', {
        activityTypeId: activityType.id,
        jsonMethod: activityType.jsonMethod,
        activityId: activity.id,
        activityTitle: getLearningLanguageField(learningLanguage, activity),
      });
    } else {
      // Default navigation to exercise screen
      (navigation as any).navigate('Exercise', {
        activityId: activity.id,
        activity: {
          id: activity.id,
          title: getLearningLanguageField(learningLanguage, activity),
        },
      });
    }
  };

  const getActivityTypeName = (activityType: ActivityTypeDto) => {
    return getLearningLanguageField(learningLanguage, activityType);
  };

  const getActivityName = (activity: ActivityDto) => {
    return getLearningLanguageField(learningLanguage, activity);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.textPrimary || '#43BCCD'} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading activities...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.lessonsBackground || ['#FFF9E6', '#FFE5CC', '#FFD9B3']}
        style={styles.gradient}
      >
        {/* Decorative elements */}
        <View style={[styles.decorativeCircle1, { backgroundColor: theme.decorativeCircle1 || 'rgba(255, 182, 193, 0.3)' }]} />
        <View style={[styles.decorativeCircle2, { backgroundColor: theme.decorativeCircle2 || 'rgba(173, 216, 230, 0.3)' }]} />
        <View style={[styles.decorativeCircle3, { backgroundColor: theme.decorativeCircle3 || 'rgba(255, 218, 185, 0.3)' }]} />

        {/* Header */}
        <LinearGradient colors={theme.headerGradient || ['#FF9A8B', '#FF6B9D', '#FF8C94']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerEmoji}>📚</Text>
              <Text style={styles.headerTitle}>{lessonName}</Text>
              <Text style={styles.headerEmoji}>🎓</Text>
            </View>
            <Text style={styles.headerSubtitle}>Choose an activity to start</Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.activitiesContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {groupedActivities.length > 0 ? (
              groupedActivities.map((group, groupIndex) => {
                const activityTypeName = getActivityTypeName(group.activityType);
                const gradients: readonly [string, string, ...string[]][] = [
                  ['#FF9A8B', '#FF6B9D'] as const,
                  ['#43BCCD', '#5DD3A1'] as const,
                  ['#6A8EFF', '#8A6BFF'] as const,
                  ['#FFB366', '#FF8C42'] as const,
                  ['#A77BCA', '#BA91DA'] as const,
                ];
                const sectionGradient = gradients[groupIndex % gradients.length];
                
                return (
                  <View key={group.activityType.id} style={styles.activityGroup}>
                    <View style={styles.sectionHeader}>
                      <LinearGradient
                        colors={sectionGradient}
                        style={styles.sectionHeaderGradient}
                      >
                        <Text style={styles.sectionTitle}>{activityTypeName}</Text>
                        <Text style={styles.sectionSubtitle}>
                          {group.activities.length} {group.activities.length === 1 ? 'activity' : 'activities'}
                        </Text>
                      </LinearGradient>
                    </View>
                    
                    {group.activities.map((activity, activityIndex) => {
                      const activityName = getActivityName(activity);
                      const activityGradient = gradients[activityIndex % gradients.length];
                      
                      return (
                        <TouchableOpacity
                          key={activity.id}
                          style={styles.activityCard}
                          onPress={() => handleActivityPress(activity, group.activityType)}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={activityGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.activityGradient}
                          >
                            <View style={styles.activityContent}>
                              <View style={styles.activityIconContainer}>
                                <MaterialIcons name="extension" size={32} color="#fff" />
                              </View>
                              <View style={styles.activityTextContainer}>
                                <Text style={styles.activityTitle} numberOfLines={2}>
                                  {activityName}
                                </Text>
                              </View>
                              <MaterialIcons name="chevron-right" size={28} color="#fff" />
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No activities available for this lesson.</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 150,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: 200,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 45,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    padding: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerEmoji: {
    fontSize: 32,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  activitiesContainer: {
    width: '100%',
  },
  activityGroup: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sectionHeaderGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  activityCard: {
    marginBottom: 12,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  activityGradient: {
    padding: 16,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default LessonActivitiesScreen;

