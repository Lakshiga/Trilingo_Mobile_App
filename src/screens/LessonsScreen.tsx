import React, { useEffect, useState, useRef } from 'react';
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
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
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
  const slideAnim = useRef(new Animated.Value(50)).current; // Increased for bounce effect
  const modalScaleAnim = useRef(new Animated.Value(0)).current;

  // --- KIDS THEME COLORS - Matching Home Page Blue Theme ---
  const THEME_COLOR = '#0284C7'; // Blue (matching home page)
  const ACCENT_COLOR = '#0EA5E9'; // Light Blue
  const TEXT_COLOR = '#0369A1'; // Dark Blue
  const BG_COLOR = '#E0F2FE'; // Light blue bg (matching home page)

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
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
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [levelId]);

  useEffect(() => {
    if (showComingSoonModal) {
      modalScaleAnim.setValue(0);
      Animated.spring(modalScaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
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
        animationType="none"
        onRequestClose={() => setShowComingSoonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalScaleAnim }] }]}>
            <View style={styles.modalIconContainer}>
               <MaterialCommunityIcons name="hammer-wrench" size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.comingSoonTitle}>Under Construction!</Text>
            
            <View style={styles.lottieContainer}>
              <LottieView
                source={require('../../assets/animations/comming soon.json')} // Ensure path is correct
                autoPlay loop style={styles.lottieAnimation}
              />
            </View>

            <Text style={styles.comingSoonMessage}>
              We are building this lesson for you! Check back soon.
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowComingSoonModal(false)}
            >
              <Text style={styles.modalButtonText}>Okay!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
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
});

export default LessonsScreen;