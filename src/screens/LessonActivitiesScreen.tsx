import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService, { ActivityDto, ActivityTypeDto, ProgressDto } from '../services/api';
import { getLearningLanguageField } from '../utils/languageUtils';
import { Language } from '../utils/translations';
import { useResponsive } from '../utils/responsive';

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
  const { currentUser } = useUser();
  const responsive = useResponsive();
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  
  const params = route.params as RouteParams;
  const lessonId = params?.lessonId || 1;
  const lessonName = params?.lessonName || 'Activities';

  const [activities, setActivities] = useState<ActivityWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedActivities, setCompletedActivities] = useState<Set<number>>(new Set());
  const [exerciseCountMap, setExerciseCountMap] = useState<Map<number, number>>(new Map());
  const [completedCountMap, setCompletedCountMap] = useState<Map<number, number>>(new Map());
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // --- KIDS THEME COLORS ---
  const THEME_COLOR = '#4FACFE'; // Sky Blue
  const ACCENT_COLOR = '#FFB75E'; // Golden Yellow
  const TEXT_COLOR = '#2C3E50'; // Dark Blue
  const BG_COLOR = '#E6F7FF'; // Light Background

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      
      const fetchedActivities = await apiService.getActivitiesByStage(lessonId);
      const activityTypes = await apiService.getAllActivityTypes();
      // Fetch completed progress for this student
      const studentId = currentUser?.id; // adjust if you store selected student separately
      let completedSet = new Set<number>();
      const completedMap = new Map<number, number>();
      if (studentId) {
        const progress = await apiService.getStudentProgress(studentId);
        progress.forEach((p: ProgressDto) => {
          if (p.activityId) {
            completedSet.add(p.activityId);
            const prev = completedMap.get(p.activityId) || 0;
            completedMap.set(p.activityId, prev + 1);
          }
        });
      }
      setCompletedActivities(completedSet);
      setCompletedCountMap(completedMap);
      
      const activityTypeMap = new Map<number, ActivityTypeDto>();
      activityTypes.forEach(type => {
        activityTypeMap.set(type.id, type);
      });
      
      const activitiesWithTypes: ActivityWithType[] = fetchedActivities
        .map(activity => {
          const activityType = activityTypeMap.get(activity.activityTypeId);
          if (!activityType) return null;
          return { activity, activityType };
        })
        .filter((item): item is ActivityWithType => item !== null);
      
      activitiesWithTypes.sort((a, b) => a.activity.sequenceOrder - b.activity.sequenceOrder);

      // Fetch exercise counts per activity for percentage display
      const countEntries = await Promise.all(
        activitiesWithTypes.map(async ({ activity }) => {
          try {
            const exercises = await apiService.getExercisesByActivityId(activity.id);
            return [activity.id, exercises.length] as [number, number];
          } catch {
            return [activity.id, 0] as [number, number];
          }
        })
      );
      setExerciseCountMap(new Map(countEntries));

      setActivities(activitiesWithTypes);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      Alert.alert('Oops!', 'Could not load the games.');
    } finally {
      setLoading(false);
    }
  }, [lessonId, currentUser?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
      ]).start();
      return () => {};
    }, [fetchActivities])
  );

  const handleActivityPress = (activity: ActivityDto, activityType: ActivityTypeDto) => {
    (navigation as any).navigate('PlayScreen', {
      activityId: activity.id,
      activityTypeId: activityType.id,
      activityTitle: getLearningLanguageField(learningLanguage, activity),
      jsonMethod: activityType.jsonMethod,
    });
  };

  const getActivityName = (activity: ActivityDto) => {
    return getLearningLanguageField(learningLanguage, activity);
  };

  // Helper to get icon based on name/type
  const getActivityIcon = (name: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('puzzle')) return 'puzzle'; // Puzzle piece
    if (lowerName.includes('quiz')) return 'lightbulb-on';
    if (lowerName.includes('match')) return 'cards';
    if (lowerName.includes('video')) return 'youtube-tv';
    if (lowerName.includes('listen')) return 'headphones';
    if (lowerName.includes('speak')) return 'microphone';
    if (lowerName.includes('write') || lowerName.includes('draw')) return 'pencil';
    return 'gamepad-variant'; // Default
  };

  const styles = getStyles(responsive, THEME_COLOR, ACCENT_COLOR, TEXT_COLOR, BG_COLOR);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LottieView
          source={require('../../assets/animations/Loading animation.json')}
          autoPlay loop style={styles.loadingAnimation}
        />
        <Text style={styles.loadingText}>Loading Activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />

      {/* --- CURVED HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{lessonName}</Text>
        </View>
        <View style={{ width: 45 }} /> 
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Helper Text */}
        <View style={styles.mascotContainer}>
            <Text style={styles.welcomeText}>
              Complete all activities to win! 🏆
            </Text>
        </View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {activities.length > 0 ? (
            activities.map((item, index) => {
              const activityName = getActivityName(item.activity);
              const iconName = getActivityIcon(activityName); // Get dynamic icon
              
              // Alternating colors for bubbles
              const bubbleColors = ['#4FACFE', '#FF9F43', '#FF6B6B', '#1DD1A1', '#5F27CD'];
              const currentBubbleColor = bubbleColors[index % bubbleColors.length];

              const isCompleted = completedActivities.has(item.activity.id);
              const totalExercises = exerciseCountMap.get(item.activity.id) || 0;
              const completedExercises = isCompleted ? totalExercises : (completedCountMap.get(item.activity.id) || 0);
              const completionPercent = totalExercises > 0 ? Math.min(100, Math.round((completedExercises / totalExercises) * 100)) : (isCompleted ? 100 : 0);
              return (
                <TouchableOpacity
                  key={item.activity.id}
                  style={[
                    styles.activityCard,
                    isCompleted && { backgroundColor: '#E8F7FF', borderColor: ACCENT_COLOR, borderWidth: 1 }
                  ]}
                  onPress={() => handleActivityPress(item.activity, item.activityType)}
                  activeOpacity={0.9}
                >
                  {/* Progress fill overlay */}
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${completionPercent}%`, opacity: completionPercent === 0 ? 0 : 0.25 },
                    ]}
                  />
                  {/* Left Icon Bubble */}
                  <View style={[styles.iconBubble, { borderColor: currentBubbleColor }]}>
                     <View style={[styles.iconInner, { backgroundColor: currentBubbleColor + '20' }]}>
                        <MaterialCommunityIcons name={iconName} size={24} color={currentBubbleColor} />
                     </View>
                  </View>

                  {/* Text Content */}
                  <View style={styles.textContainer}>
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {activityName}
                    </Text>
                    <Text style={styles.activitySubtitle}>
                      {isCompleted ? 'Completed' : completionPercent > 0 ? 'In progress' : 'Tap to play'}
                    </Text>
                  </View>

                  {/* Right Play Button */}
                  <View style={[styles.playButton, isCompleted && { backgroundColor: '#34D399' }]}>
                     <Ionicons name="play" size={24} color="#FFFFFF" style={{marginLeft: 2}} />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="emoticon-sad-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No games here yet!</Text>
            </View>
          )}
        </Animated.View>
        
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const getStyles = (
  responsive: ReturnType<typeof useResponsive>,
  themeColor: string,
  accentColor: string,
  textColor: string,
  bgColor: string
) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bgColor,
  },
  
  // --- HEADER ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsive.wp(5),
    paddingTop: responsive.hp(6),
    paddingBottom: responsive.hp(3),
    backgroundColor: themeColor,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: themeColor,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: responsive.wp(5),
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // --- CONTENT ---
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: responsive.wp(5),
    paddingTop: responsive.hp(2),
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: responsive.hp(2.5),
    marginTop: responsive.hp(1),
  },
  welcomeText: {
    fontSize: responsive.wp(4),
    fontWeight: '700',
    color: '#7F8C8D',
    textAlign: 'center',
  },

  // --- ACTIVITY CARD (3D Style) ---
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: responsive.hp(2),
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    overflow: 'hidden',
    // 3D Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderBottomWidth: 4,
    borderBottomColor: '#E2E8F0',
  },
  
  // Icon Bubble
  iconBubble: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    padding: 3, // Gap between border and inner fill
  },
  iconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Text
  textContainer: { flex: 1 },
  activityTitle: {
    fontSize: responsive.wp(4.5),
    fontWeight: '800',
    color: textColor,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: responsive.wp(3.2),
    color: '#95A5A6',
    fontWeight: '600',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#4FACFE',
  },

  // Play Button
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF9F43', // Orange
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#FF9F43",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  // --- LOADING / EMPTY ---
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: bgColor,
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 10,
    color: themeColor,
    fontWeight: '800',
    fontSize: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#95A5A6',
    marginTop: 10,
  },
});

export default LessonActivitiesScreen;