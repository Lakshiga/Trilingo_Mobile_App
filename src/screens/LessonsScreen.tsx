import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Modal,
  StatusBar,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService, { StageDto } from '../services/api';
import { getLearningLanguageField } from '../utils/languageUtils';
import { Language } from '../utils/translations';
import { useResponsive } from '../utils/responsive';
import { findMainActivityIds, LEARNING_MAIN_ACTIVITY_NAMES, filterActivitiesByIds } from '../utils/activityMappings';

const { width } = Dimensions.get('window');

interface RouteParams {
  levelId: number;
  levelName?: string;
}

const LessonsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme(); // Optional if fully overriding
  const { currentUser } = useUser();
  const responsive = useResponsive();
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  
  const params = route.params as RouteParams;
  const levelId = params?.levelId || 1;
  const levelName = params?.levelName || 'Level 01';

  const [lessons, setLessons] = useState<StageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lockedLessons, setLockedLessons] = useState<Set<number>>(new Set());
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const modalScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        const allLessons = await apiService.getStagesByLevelId(levelId);
        const sortedLessons = allLessons.sort((a, b) => a.id - b.id);

        // Fetch main activities to filter Learning, Practice, and Game only
        const mainActivities = await apiService.getAllMainActivities();
        const learningMainActivityIds = findMainActivityIds(
          mainActivities,
          LEARNING_MAIN_ACTIVITY_NAMES
        );

        // Filter lessons to only show those with Learning/Practice/Game activities
        const validLessons: StageDto[] = [];
        const lockedSet = new Set<number>();
        
        for (const lesson of sortedLessons) {
          try {
            const allActivities = await apiService.getActivitiesByStage(lesson.id);
            
            // Filter activities to only include Learning, Practice, and Game
            // Exclude Conversation, Listening, Video activities
            const filteredActivities = learningMainActivityIds.size > 0
              ? filterActivitiesByIds(allActivities, learningMainActivityIds)
              : allActivities;
            
            // Only show lessons that have Learning/Practice/Game activities
            if (filteredActivities.length > 0) {
              validLessons.push(lesson);
            } else {
              // Hide lessons that only have Conversation/Listening/Video activities
              lockedSet.add(lesson.id);
            }
          } catch (error) {
            // If error, hide the lesson
            lockedSet.add(lesson.id);
          }
        }
        
        // Set only lessons with Learning/Practice/Game activities
        setLessons(validLessons);
        setLockedLessons(lockedSet);
      } catch (error: any) {
        console.error('Error fetching lessons:', error);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    if (levelId) fetchLessons();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [levelId]);

  useEffect(() => {
    if (showComingSoonModal) {
      modalScaleAnim.setValue(0);
      Animated.spring(modalScaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
    }
  }, [showComingSoonModal]);

  const handleLessonPress = (lesson: StageDto) => {
    if (lockedLessons.has(lesson.id)) {
      setShowComingSoonModal(true);
      return;
    }
    (navigation as any).navigate('LessonActivities', { 
      lessonId: lesson.id, 
      lessonName: getLearningLanguageField(learningLanguage, lesson),
      levelId: levelId 
    });
  };

  const getLessonName = (lesson: StageDto) => getLearningLanguageField(learningLanguage, lesson);

  const styles = getStyles(responsive);

  // --- LOADING STATE ---
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LottieView
          source={require('../../assets/animations/Loading animation.json')}
          autoPlay loop style={styles.loadingAnimation}
        />
        <Text style={styles.loadingText}>Loading Lessons...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#002D62" />
        </TouchableOpacity>
        <View style={{alignItems: 'center'}}>
          <Text style={styles.headerTitle}>{levelName}</Text>
          <Text style={styles.headerSubtitle}>Select a lesson to begin</Text>
        </View>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      {/* --- CONTENT --- */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {lessons.length > 0 ? (
            lessons.map((lesson, index) => {
              const lessonName = getLessonName(lesson);
              const isLocked = lockedLessons.has(lesson.id);
              
              return (
                <TouchableOpacity
                  key={lesson.id}
                  style={[styles.lessonCard, isLocked && styles.lessonCardLocked]}
                  onPress={() => handleLessonPress(lesson)}
                  activeOpacity={isLocked ? 1 : 0.8}
                >
                  {/* Left Icon / Number */}
                  <View style={[styles.iconBox, isLocked ? styles.iconBoxLocked : styles.iconBoxActive]}>
                    {isLocked ? (
                      <MaterialIcons name="lock" size={24} color="#94A3B8" />
                    ) : (
                      <Text style={styles.lessonNumber}>{index + 1}</Text>
                    )}
                  </View>

                  {/* Text Content */}
                  <View style={styles.textContainer}>
                    <Text style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]} numberOfLines={1}>
                      {lessonName || `Lesson ${lesson.id}`}
                    </Text>
                    <Text style={styles.lessonSubtitle}>
                      {isLocked ? 'Not Available' : 'Tap to start'}
                    </Text>
                  </View>

                  {/* Right Action Icon */}
                  <View style={styles.actionIcon}>
                    {isLocked ? (
                       <MaterialIcons name="lock-outline" size={20} color="#CBD5E1" />
                    ) : (
                       <View style={styles.playButton}>
                          <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
                       </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="menu-book" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>No lessons available</Text>
              <Text style={styles.emptySubtext}>Check back later for updates.</Text>
            </View>
          )}
        </Animated.View>
        
        <View style={{height: responsive.hp(5)}} />
      </ScrollView>

      {/* --- MODAL --- */}
      <Modal
        visible={showComingSoonModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowComingSoonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalScaleAnim }] }]}>
            <View style={styles.modalIconContainer}>
               <MaterialCommunityIcons name="clock-alert-outline" size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            
            <View style={styles.lottieContainer}>
              <LottieView
                source={require('../../assets/animations/comming soon.json')}
                autoPlay loop style={styles.lottieAnimation}
              />
            </View>

            <Text style={styles.comingSoonMessage}>
              We are working on this lesson!
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowComingSoonModal(false)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Professional Light Gray
  },
  
  // --- HEADER ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsive.wp(5),
    paddingTop: responsive.hp(6), // Safe area
    paddingBottom: responsive.hp(2),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: responsive.wp(5),
    fontWeight: '800',
    color: '#002D62', // Brand Blue
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: responsive.wp(3.5),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },

  // --- LOADING ---
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingAnimation: {
    width: 150,
    height: 150,
  },
  loadingText: {
    marginTop: 20,
    color: '#64748B',
    fontWeight: '600',
  },

  // --- CONTENT ---
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsive.wp(5),
    paddingTop: responsive.hp(3),
  },

  // --- LESSON CARD ---
  lessonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: responsive.hp(2),
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    // Soft Shadow
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  lessonCardLocked: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    elevation: 0,
  },
  
  // Icon Box (Left)
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconBoxActive: {
    backgroundColor: '#E0F2FE', // Very Light Blue
    borderWidth: 1,
    borderColor: '#002D62',
  },
  iconBoxLocked: {
    backgroundColor: '#E2E8F0',
  },
  lessonNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#002D62',
  },

  // Text Content (Middle)
  textContainer: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: responsive.wp(4.5),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  lessonTitleLocked: {
    color: '#94A3B8',
  },
  lessonSubtitle: {
    fontSize: responsive.wp(3.2),
    color: '#64748B',
    fontWeight: '500',
  },

  // Action Icon (Right)
  actionIcon: {
    marginLeft: 10,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#002D62',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#002D62",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // --- EMPTY STATE ---
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 20,
  },
  emptySubtext: {
    color: '#94A3B8',
    marginTop: 8,
  },

  // --- MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F59E0B', // Amber for "Coming Soon"
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
  },
  lottieContainer: {
    width: 150,
    height: 150,
    marginBottom: 15,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  comingSoonMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalButton: {
    backgroundColor: '#002D62',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LessonsScreen;