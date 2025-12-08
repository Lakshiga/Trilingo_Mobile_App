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
import LottieView from 'lottie-react-native';
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

interface ActivityWithType {
  activity: ActivityDto;
  activityType: ActivityTypeDto;
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

  const [activities, setActivities] = useState<ActivityWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        
        // Fetch activities for this lesson (stage)
        const fetchedActivities = await apiService.getActivitiesByStage(lessonId);
        
        // Fetch all activity types to get activity type info for navigation
        const activityTypes = await apiService.getAllActivityTypes();
        
        // Create activity type map for quick lookup
        const activityTypeMap = new Map<number, ActivityTypeDto>();
        activityTypes.forEach(type => {
          activityTypeMap.set(type.id, type);
        });
        
        // Combine activities with their activity types
        const activitiesWithTypes: ActivityWithType[] = fetchedActivities
          .map(activity => {
            const activityType = activityTypeMap.get(activity.activityTypeId);
            if (!activityType) return null;
            return {
              activity,
              activityType,
            };
          })
          .filter((item): item is ActivityWithType => item !== null);
        
        // Sort all activities by sequenceOrder
        activitiesWithTypes.sort((a, b) => a.activity.sequenceOrder - b.activity.sequenceOrder);
        
        setActivities(activitiesWithTypes);
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
    // Get activityTypeId and jsonMethod from activityType (already available)
    // Pass directly to DynamicActivityScreen so it doesn't need to fetch again
    (navigation as any).navigate('DynamicActivity', {
      activityId: activity.id,
      activityTypeId: activityType.id,
      jsonMethod: activityType.jsonMethod,
      activityTitle: getLearningLanguageField(learningLanguage, activity),
    });
  };

  const getActivityName = (activity: ActivityDto) => {
    return getLearningLanguageField(learningLanguage, activity);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../assets/animations/Loading animation.json')}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
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
            {activities.length > 0 ? (
              activities.map((item, index) => {
                const activityName = getActivityName(item.activity);
                const gradients: readonly [string, string, ...string[]][] = [
                  ['#FF9A8B', '#FF6B9D'] as const,
                  ['#43BCCD', '#5DD3A1'] as const,
                  ['#6A8EFF', '#8A6BFF'] as const,
                  ['#FFB366', '#FF8C42'] as const,
                  ['#A77BCA', '#BA91DA'] as const,
                ];
                const activityGradient = gradients[index % gradients.length];
                
                return (
                  <TouchableOpacity
                    key={item.activity.id}
                    style={styles.activityCard}
                    onPress={() => handleActivityPress(item.activity, item.activityType)}
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
  loadingAnimation: {
    width: 200,
    height: 200,
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

