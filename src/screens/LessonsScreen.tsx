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
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService, { StageDto } from '../services/api';
import { getLearningLanguageField } from '../utils/languageUtils';
import { Language } from '../utils/translations';

interface RouteParams {
  levelId: number;
  levelName?: string;
}

const LessonsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { currentUser } = useUser();
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  
  const params = route.params as RouteParams;
  const levelId = params?.levelId || 1;
  const levelName = params?.levelName || 'Level 01';

  const [lessons, setLessons] = useState<StageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lockedLessons, setLockedLessons] = useState<Set<number>>(new Set());
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const modalScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        console.log(`📚 Fetching lessons for levelId: ${levelId}`);
        
        // Fetch all lessons (stages) for this level
        const allLessons = await apiService.getStagesByLevelId(levelId);
        
        if (allLessons.length === 0) {
          console.warn(`⚠️ No lessons found for level ${levelId}. This could mean:`);
          console.warn('   1. No lessons exist for this level in database');
          console.warn('   2. User does not have permission (check console for 403 errors)');
          console.warn('   3. Authentication token is missing or invalid');
        } else {
          console.log(`✅ Found ${allLessons.length} lessons for level ${levelId}`);
        }
        
        // Sort by ID (since sequenceOrder is not in backend DTO)
        const sortedLessons = allLessons.sort((a, b) => a.id - b.id);
        
        setLessons(sortedLessons);

        // Check activities count for each lesson to determine if it should be locked
        const lockedSet = new Set<number>();
        for (const lesson of sortedLessons) {
          try {
            const activities = await apiService.getActivitiesByStage(lesson.id);
            if (activities.length === 0) {
              lockedSet.add(lesson.id);
            }
          } catch (error) {
            // If error fetching activities, consider lesson locked
            console.warn(`Failed to fetch activities for lesson ${lesson.id}, locking it`);
            lockedSet.add(lesson.id);
          }
        }
        setLockedLessons(lockedSet);
      } catch (error: any) {
        // Log error details for debugging
        console.error('❌ Error fetching lessons:', error);
        console.error('   Error message:', error.message);
        console.error('   Check console above for detailed API error information');
        setLessons([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    if (levelId) {
      fetchLessons();
    }

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
  }, [levelId]);

  // Handle modal animation when it becomes visible
  useEffect(() => {
    if (showComingSoonModal) {
      modalScaleAnim.setValue(0);
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      modalScaleAnim.setValue(0);
    }
  }, [showComingSoonModal]);

  const handleLessonPress = (lesson: StageDto) => {
    // Check if lesson is locked (has 0 activities)
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

  const getLessonName = (lesson: StageDto) => {
    return getLearningLanguageField(learningLanguage, lesson);
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
          Loading lessons...
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
              <Text style={styles.headerTitle}>{levelName}</Text>
              <Text style={styles.headerEmoji}>🎓</Text>
            </View>
            <Text style={styles.headerSubtitle}>Select a lesson to begin</Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.lessonsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {lessons.length > 0 ? (
              lessons.map((lesson, index) => {
                const lessonName = getLessonName(lesson);
                const isLocked = lockedLessons.has(lesson.id);
                const gradients = [
                  ['#FF9A8B', '#FF6B9D'] as const,
                  ['#43BCCD', '#5DD3A1'] as const,
                  ['#6A8EFF', '#8A6BFF'] as const,
                  ['#FFB366', '#FF8C42'] as const,
                  ['#A77BCA', '#BA91DA'] as const,
                  ['#FF6B6B', '#FF4757'] as const,
                  ['#4ECDC4', '#44A08D'] as const,
                  ['#FFD93D', '#F9A826'] as const,
                  ['#A8E6CF', '#56C596'] as const,
                  ['#B4A7D6', '#8E7CC3'] as const,
                ];
                const gradient = isLocked ? ['#9CA3AF', '#6B7280'] as const : gradients[index % gradients.length];
                const emojis = ['📖', '🔤', '🔢', '🎨', '🌍', '🎵', '📚', '✏️', '🎯', '🌟'];
                const emoji = emojis[index % emojis.length];
                
                return (
                  <TouchableOpacity
                    key={lesson.id}
                    style={[styles.lessonCard, isLocked && styles.lessonCardLocked]}
                    onPress={() => handleLessonPress(lesson)}
                    activeOpacity={isLocked ? 1 : 0.8}
                  >
                    <LinearGradient
                      colors={gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.lessonGradient}
                    >
                      <View style={styles.lessonContent}>
                        <View style={styles.lessonIconContainer}>
                          <Text style={styles.lessonEmoji}>
                            {emoji}
                          </Text>
                        </View>
                        <View style={styles.lessonTextContainer}>
                          <Text style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]} numberOfLines={2}>
                            {lessonName || `Lesson ${lesson.id}`}
                          </Text>
                        </View>
                        {isLocked ? (
                          <MaterialIcons name="lock" size={32} color="rgba(255, 255, 255, 0.7)" />
                        ) : (
                          <MaterialIcons name="chevron-right" size={32} color="#fff" />
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No lessons available for this level.</Text>
                <Text style={styles.emptySubtext}>Lessons will appear here once they are added in the admin panel.</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </LinearGradient>

      {/* Coming Soon Modal */}
      <Modal
        visible={showComingSoonModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          Animated.timing(modalScaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowComingSoonModal(false);
            modalScaleAnim.setValue(0);
          });
        }}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: modalScaleAnim }],
              },
            ]}
          >
            <View style={styles.modalContent}>
              {/* Heading */}
              <Text style={styles.comingSoonTitle}>Coming Soon</Text>

              {/* Lottie Animation */}
              <View style={styles.lottieContainer}>
                <LottieView
                  source={require('../../assets/animations/comming soon.json')}
                  autoPlay
                  loop
                  style={styles.lottieAnimation}
                />
              </View>

              {/* Message */}
              <Text style={styles.comingSoonMessage}>
                Lessons will be available soon!
              </Text>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  Animated.timing(modalScaleAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }).start(() => {
                    setShowComingSoonModal(false);
                    modalScaleAnim.setValue(0);
                  });
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF6B9D', '#FFB366']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
    fontSize: 32,
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
  lessonsContainer: {
    width: '100%',
  },
  lessonCard: {
    marginBottom: 18,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  lessonGradient: {
    padding: 20,
  },
  lessonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  lessonEmoji: {
    fontSize: 36,
  },
  lessonTextContainer: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  lessonCardLocked: {
    opacity: 0.7,
    elevation: 4,
  },
  lessonTitleLocked: {
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  lottieContainer: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  comingSoonMessage: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '600',
  },
  modalButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default LessonsScreen;



