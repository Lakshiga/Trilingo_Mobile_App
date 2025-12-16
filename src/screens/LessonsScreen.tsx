import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  StatusBar,
  Dimensions,
  Image,
  ImageBackground,
  Alert,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService, { StageDto } from '../services/api';
import { getLearningLanguageField } from '../utils/languageUtils';
import { Language } from '../utils/translations';
import { loadStudentLanguagePreference, languageCodeToLanguage } from '../utils/studentLanguage';
import { useResponsive } from '../utils/responsive';
import { findMainActivityIds, LEARNING_MAIN_ACTIVITY_NAMES, filterActivitiesByIds } from '../utils/activityMappings';

const { width } = Dimensions.get('window');

interface RouteParams {
  levelId: number;
  levelName?: string;
  refreshPaymentStatus?: boolean;
}

const LessonsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { currentUser } = useUser();
  const responsive = useResponsive();
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  const [nativeLanguage, setNativeLanguage] = useState<Language>('English');
  
  const params = route.params || {};
  const levelId = params.levelId || 1;
  const levelName = params.levelName || 'Level 01';
  const refreshPaymentStatus = params.refreshPaymentStatus || false;

  const [lessons, setLessons] = useState<StageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lockedLessons, setLockedLessons] = useState<Set<number>>(new Set());
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current; // Increased for bounce effect
  const modalScaleAnim = useRef(new Animated.Value(0)).current;

  // --- KIDS THEME COLORS - Matching Home Page Blue Theme ---
  const THEME_COLOR = '#0284C7'; // Blue (matching home page)
  const ACCENT_COLOR = '#0EA5E9'; // Light Blue
  const TEXT_COLOR = '#0369A1'; // Dark Blue
  const BG_COLOR = '#E0F2FE'; // Light blue bg (matching home page)

  useEffect(() => {
    const fetchLessons = async () => {
      if (!currentUser) {
        setLoading(false);
        return; // Don't fetch if no user
      }
      
      setLoading(true);
      try {
        const allLessons = await apiService.getStagesByLevelId(levelId);
        const sortedLessons = allLessons.sort((a, b) => a.id - b.id);
        
        const mainActivities = await apiService.getAllMainActivities();
        const learningMainActivityIds = findMainActivityIds(
          mainActivities,
          LEARNING_MAIN_ACTIVITY_NAMES
        );
        
        const validLessons: StageDto[] = [];
        const lockedSet = new Set<number>();
        
        for (const lesson of sortedLessons) {
          try {
            const allActivities = await apiService.getActivitiesByStage(lesson.id);
            const filteredActivities = learningMainActivityIds.size > 0
              ? filterActivitiesByIds(allActivities, learningMainActivityIds)
              : allActivities;
            
            if (filteredActivities.length > 0) {
              validLessons.push(lesson);
            } else {
              lockedSet.add(lesson.id);
            }
          } catch (error) {
            lockedSet.add(lesson.id);
          }
        }
        
        // Check if user has paid for this level
        let hasPaidAccess = false;
        if (currentUser && !currentUser.isGuest) {
          try {
            // If refreshPaymentStatus flag is true, force a fresh check
            if (refreshPaymentStatus) {
              // Force a fresh check by calling the API directly
              const accessResponse = await apiService.checkLevelAccess(levelId);
              if (accessResponse && accessResponse.isSuccess) {
                hasPaidAccess = accessResponse.hasAccess;
              }
            } else {
              // Normal check
              const accessResponse = await apiService.checkLevelAccess(levelId);
              if (accessResponse && accessResponse.isSuccess) {
                hasPaidAccess = accessResponse.hasAccess;
              }
            }
          } catch (error) {
            console.error('Error checking payment access:', error);
            // If error, assume no access (will show payment modal)
            hasPaidAccess = false;
          }
        }
        
        // For new users, first 2 lessons should be free
        // Lessons in Level 1 are always free (handled by backend)
        // For Level 2 and above, check payment status
        const isFirstTwoLessonsFree = levelId === 1; // Only Level 1 has free lessons
        
        // Lock lessons based on payment status and free lesson rules
        if (hasPaidAccess || isFirstTwoLessonsFree) {
          // User has paid or is accessing free level
          // Unlock first 2 lessons for free, rest based on payment
          if (isFirstTwoLessonsFree) {
            // For Level 1, all lessons are free
            // Don't add any lessons to lockedSet
          } else {
            // For paid levels, unlock all lessons
            // Don't add any lessons to lockedSet
          }
        } else {
          // User hasn't paid and not accessing free level
          // Lock all lessons except first 2
          for (let i = 2; i < validLessons.length; i++) {
            lockedSet.add(validLessons[i].id);
          }
        }
        
        setLessons(validLessons);
        setLockedLessons(lockedSet);
      } catch (error: any) {
        console.error('Error fetching lessons:', error);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    const loadLangAndFetch = async () => {
      const pref = await loadStudentLanguagePreference();
      const native = languageCodeToLanguage(pref.nativeLanguageCode);
      setNativeLanguage(native);
      if (currentUser) {
        await fetchLessons();
      }
    };

    loadLangAndFetch();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [levelId, currentUser, refreshPaymentStatus]);

  // Refresh lessons when screen comes into focus (e.g., after payment)
  useFocusEffect(
    useCallback(() => {
      const refreshLessons = async () => {
        if (!currentUser) return; // Don't refresh if no user
        
        try {
          const allLessons = await apiService.getStagesByLevelId(levelId);
          const sortedLessons = allLessons.sort((a, b) => a.id - b.id);

          const mainActivities = await apiService.getAllMainActivities();
          const learningMainActivityIds = findMainActivityIds(
            mainActivities,
            LEARNING_MAIN_ACTIVITY_NAMES
          );

          const validLessons: StageDto[] = [];
          const lockedSet = new Set<number>();
          
          for (const lesson of sortedLessons) {
            try {
              const allActivities = await apiService.getActivitiesByStage(lesson.id);
              const filteredActivities = learningMainActivityIds.size > 0
                ? filterActivitiesByIds(allActivities, learningMainActivityIds)
                : allActivities;
              
              if (filteredActivities.length > 0) {
                validLessons.push(lesson);
              } else {
                lockedSet.add(lesson.id);
              }
            } catch (error) {
              lockedSet.add(lesson.id);
            }
          }
          
          // Check if user has paid for this level
          let hasPaidAccess = false;
          if (currentUser && !currentUser.isGuest) {
            try {
              // Force a fresh check when refreshing
              const accessResponse = await apiService.checkLevelAccess(levelId);
              if (accessResponse && accessResponse.isSuccess) {
                hasPaidAccess = accessResponse.hasAccess;
              }
            } catch (error) {
              console.error('Error checking payment access:', error);
              // If error, assume no access (will show payment modal)
              hasPaidAccess = false;
            }
          }
          
          // For new users, first 2 lessons should be free
          // Lessons in Level 1 are always free (handled by backend)
          // For Level 2 and above, check payment status
          const isFirstTwoLessonsFree = levelId === 1; // Only Level 1 has free lessons
          
          // Lock lessons based on payment status and free lesson rules
          if (hasPaidAccess || isFirstTwoLessonsFree) {
            // User has paid or is accessing free level
            // Unlock first 2 lessons for free, rest based on payment
            if (isFirstTwoLessonsFree) {
              // For Level 1, all lessons are free
              // Don't add any lessons to lockedSet
            } else {
              // For paid levels, unlock all lessons
              // Don't add any lessons to lockedSet
            }
          } else {
            // User hasn't paid and not accessing free level
            // Lock all lessons except first 2
            for (let i = 2; i < validLessons.length; i++) {
              lockedSet.add(validLessons[i].id);
            }
          }
          
          setLessons(validLessons);
          setLockedLessons(lockedSet);
        } catch (error) {
          console.error('Error refreshing lessons:', error);
        }
      };

      refreshLessons();
    }, [levelId, currentUser, refreshPaymentStatus])
  );

  useEffect(() => {
    if (showComingSoonModal) {
      modalScaleAnim.setValue(0);
      Animated.spring(modalScaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    }
  }, [showComingSoonModal]);

  const handleLessonPress = async (lesson: StageDto) => {
    try {
      // Check if lesson is locked
      if (lockedLessons.has(lesson.id)) {
        // For levels >= 2, check if user has paid (only if user is logged in)
        if (levelId >= 2 && currentUser && !currentUser.isGuest) {
          try {
            const accessResponse = await apiService.checkLevelAccess(levelId);
            if (accessResponse && accessResponse.isSuccess && accessResponse.hasAccess) {
              // User has paid, allow access to the lesson
              (navigation as any).navigate('LessonActivities', { 
                lessonId: lesson.id, 
                lessonName: getLessonName(lesson),
                levelId: levelId 
              });
              return;
            }
          } catch (error: any) {
            console.error('Error checking level access:', error);
            // If API call fails, show modal (payment might be required)
            // Don't throw, just continue to show modal
          }
        }
        // Show modal for locked lessons
        setShowComingSoonModal(true);
        return;
      }

      // Lesson is unlocked, navigate to it
      (navigation as any).navigate('LessonActivities', { 
        lessonId: lesson.id, 
        lessonName: getLessonName(lesson),
        levelId: levelId 
      });
    } catch (error: any) {
      console.error('Error in handleLessonPress:', error);
      // Show modal as fallback if any error occurs
      setShowComingSoonModal(true);
    }
  };

  const handlePaymentButtonPress = () => {
    try {
      console.log('Payment button pressed, navigating to Payment screen...');
      console.log('Level ID:', levelId, 'Level Name:', levelName);
      setShowComingSoonModal(false);
      // Small delay to ensure modal closes before navigation
      setTimeout(() => {
        try {
          (navigation as any).navigate('Payment', {
            levelId: levelId,
            levelName: levelName,
            nextLevelId: levelId,
          });
          console.log('Navigation to Payment screen successful');
        } catch (navError: any) {
          console.error('Navigation error:', navError);
          Alert.alert('Error', 'Failed to open payment screen. Please try again.');
        }
      }, 100);
    } catch (error: any) {
      console.error('Error in handlePaymentButtonPress:', error);
      Alert.alert('Error', 'Failed to open payment screen. Please try again.');
    }
  };

  const getLessonName = (lesson: StageDto) => {
    // Use student's native language for list/UI; fallback to learning language if missing
    switch (nativeLanguage) {
      case 'Tamil':
        return lesson.name_ta || getLearningLanguageField(learningLanguage, lesson);
      case 'Sinhala':
        return lesson.name_si || getLearningLanguageField(learningLanguage, lesson);
      case 'English':
      default:
        return lesson.name_en || getLearningLanguageField(learningLanguage, lesson);
    }
  };

  const styles = getStyles(responsive, THEME_COLOR, ACCENT_COLOR, TEXT_COLOR, BG_COLOR);

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
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />

      {/* --- FUN HEADER (Curved) --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{levelName}</Text>
        </View>
        <View style={{ width: 45 }} /> 
      </View>

      {/* --- CONTENT --- */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mascotContainer}>
            <Text style={styles.welcomeText}>
              Choose a lesson to play! 🗺️
            </Text>
        </View>

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
                  activeOpacity={isLocked ? 1 : 0.9}
                >
                  {/* Left Bubble Number */}
                  <View style={[styles.numberBubble, isLocked ? styles.numberBubbleLocked : styles.numberBubbleActive]}>
                    {isLocked ? (
                      <Feather name="lock" size={22} color="#A0AEC0" />
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
                      {isLocked ? 'Locked' : 'Tap to start!'}
                    </Text>
                  </View>

                  {/* Right Action Button */}
                  {!isLocked && (
                    <View style={styles.playButton}>
                       <MaterialIcons name="play-arrow" size={28} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="treasure-chest" size={80} color="#CBD5E1" />
              <Text style={styles.emptyText}>No lessons found!</Text>
              <Text style={styles.emptySubtext}>We are building this map.</Text>
            </View>
          )}
        </Animated.View>
        
        <View style={{height: responsive.hp(5)}} />
      </ScrollView>

      {/* --- MODAL (Fun Style) --- */}
      <Modal
        visible={showComingSoonModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowComingSoonModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowComingSoonModal(false)}
        >
          <Animated.View 
            style={[styles.modalCard, { transform: [{ scale: modalScaleAnim }] }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalIconContainer}>
              <MaterialCommunityIcons name="lock" size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.comingSoonTitle}>
              Unlock All Lessons
            </Text>
            
            <Text style={styles.comingSoonMessage}>
              Complete the first 2 lessons to unlock more! Payment required to access this lesson and unlock all remaining lessons in this level.
            </Text>

            {/* Amount Display */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amountValue}>350 LKR</Text>
            </View>

            {/* Pay to Unlock Button */}
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={() => {
                console.log('Payment button clicked! Level:', levelId);
                handlePaymentButtonPress();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#43BCCD', '#FF6B9D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.paymentButtonGradient}
              >
                <MaterialCommunityIcons name="lock-open" size={20} color="#fff" />
                <Text style={styles.paymentButtonText}>Pay to Unlock</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setShowComingSoonModal(false)}
            >
              <Text style={styles.modalButtonTextSecondary}>
                Cancel
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
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
    letterSpacing: 0.5,
  },

  // --- LOADING ---
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
    fontSize: 20,
  },

  // --- CONTENT ---
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsive.wp(5),
    paddingTop: responsive.hp(2),
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: responsive.hp(3),
    marginTop: responsive.hp(1),
  },
  welcomeText: {
    fontSize: responsive.wp(4.5),
    fontWeight: '700',
    color: '#636e72',
    textAlign: 'center',
  },

  // --- LESSON CARD ---
  lessonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // Very rounded
    marginBottom: responsive.hp(2.5),
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    // 3D Shadow Effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderBottomWidth: 4,
    borderBottomColor: '#E2E8F0',
  },
  lessonCardLocked: {
    backgroundColor: '#F7FAFC',
    borderBottomColor: '#EDF2F7',
    opacity: 0.9,
  },
  
  // Bubble Number (Left)
  numberBubble: {
    width: 55,
    height: 55,
    borderRadius: 27.5, // Circle
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  numberBubbleActive: {
    backgroundColor: '#DEF7FF', // Light Cyan
    borderWidth: 2,
    borderColor: themeColor,
  },
  numberBubbleLocked: {
    backgroundColor: '#EDF2F7',
    borderWidth: 2,
    borderColor: '#CBD5E0',
  },
  lessonNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: themeColor,
  },

  // Text Content (Middle)
  textContainer: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: responsive.wp(4.8),
    fontWeight: '800',
    color: textColor,
    marginBottom: 4,
  },
  lessonTitleLocked: {
    color: '#A0AEC0',
  },
  lessonSubtitle: {
    fontSize: responsive.wp(3.5),
    color: '#7F8C8D',
    fontWeight: '600',
  },

  // Play Button (Right) - More vibrant
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B9D', // Pink
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#FF6B9D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // --- EMPTY STATE ---
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '900',
    color: themeColor,
    marginTop: 20,
  },
  emptySubtext: {
    color: '#7F8C8D',
    marginTop: 10,
    fontSize: 16,
  },

  // --- MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: accentColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -60,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: textColor,
    marginTop: 10,
    marginBottom: 10,
  },
  lottieContainer: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  comingSoonMessage: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '500',
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: themeColor,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25, // Pill shape
    width: '80%',
    alignItems: 'center',
    shadowColor: themeColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    borderBottomWidth: 4,
    borderBottomColor: '#2879C9', // Darker blue for 3D
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  modalButtonSecondary: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#CBD5E0',
    marginTop: 12,
  },
  modalButtonTextSecondary: {
    color: '#374151',
  },
  paymentButton: {
    width: '80%',
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#43BCCD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  paymentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 40,
    gap: 8,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  amountContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '600',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '900',
    color: themeColor,
    letterSpacing: 1,
  },
});

export default LessonsScreen;