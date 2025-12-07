import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { getTranslation, Language } from '../utils/translations';
import apiService, { ExerciseDto, ActivityDto } from '../services/api';
import { extractExerciseMediaInfo, parseExerciseJson } from '../utils/exerciseHelpers';

const { width, height } = Dimensions.get('window');
const ITEMS_PER_PAGE = 5;

type ExerciseScreenRouteParams = {
  activityId?: number;
  activity?: {
    id: number;
    title: string;
    description: string;
  };
  activityTypeId?: number;
  jsonMethod?: string;
};

const ExerciseScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: ExerciseScreenRouteParams }, 'params'>>();
  const { theme, isDarkMode } = useTheme();
  const { currentUser } = useUser();
  const nativeLanguage: Language = (currentUser?.nativeLanguage as Language) || 'English';
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  
  // Extract parameters from route
  const { activityId, activityTypeId, jsonMethod } = route.params || {};
  const activity = route.params?.activity || { id: activityId || 0, title: 'Activity', description: '' };

  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [activityData, setActivityData] = useState<ActivityDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    fetchExercises();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activity.id, activityId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activity.id, activityId]);

  const fetchActivityData = async () => {
    try {
      const activityIdToUse = activity.id || activityId;
      if (activityIdToUse) {
        const fetchedActivity = await apiService.getActivityById(activityIdToUse);
        setActivityData(fetchedActivity);
        return fetchedActivity;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching activity data:', error);
      return null;
    }
  };

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const activityIdToUse = activity.id || activityId;
      if (!activityIdToUse) {
        throw new Error('No activity ID provided');
      }
      
      // First, fetch the activity to get its stageId (lessonId)
      const fetchedActivity = await fetchActivityData();
      const stageId = fetchedActivity?.stageId;
      
      if (!stageId) {
        // Fallback: if no stageId, fetch exercises for this activity only
        const fetchedExercises = await apiService.getExercisesByActivityId(activityIdToUse);
        
        // Ensure we have a valid array
        if (Array.isArray(fetchedExercises) && fetchedExercises.length > 0) {
          const sortedExercises = fetchedExercises.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
          setExercises(sortedExercises);
        } else {
          setExercises([]);
        }
        setCurrentPage(1);
        return;
      }
      
      // Fetch all activities in this lesson (stage)
      const activitiesInLesson = await apiService.getActivitiesByStage(stageId);
      
      // Fetch exercises for all activities in this lesson
      const allExercisesPromises = activitiesInLesson.map(act => 
        apiService.getExercisesByActivityId(act.id).catch(() => [])
      );
      
      const allExercisesArrays = await Promise.all(allExercisesPromises);
      
      // Combine all exercises into a single array
      const allExercises = allExercisesArrays.flat();
      
      // Ensure we have a valid array and sort by sequence order
      if (Array.isArray(allExercises) && allExercises.length > 0) {
        const sortedExercises = allExercises.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        setExercises(sortedExercises);
      } else {
        setExercises([]);
      }
      setCurrentPage(1);
    } catch (error: any) {
      console.error('Error fetching exercises:', error);
      // Set empty array on error so empty state shows
      setExercises([]);
      Alert.alert(
        'Error',
        'Could not load exercises. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const openExerciseDetail = (startIndex: number) => {
    navigation.navigate('ExerciseDetail' as never, {
      activity,
      exercises,
      startIndex,
      activityTypeId,
      jsonMethod,
    } as never);
  };

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(exercises.length / ITEMS_PER_PAGE));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [exercises, currentPage]);

  const totalPages = Math.max(1, Math.ceil(exercises.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedExercises = exercises.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  // Handle different activity types based on JSON method
  const handleActivityTypeNavigation = () => {
    if (jsonMethod) {
      // Navigate to DynamicActivity screen
      (navigation as any).navigate('DynamicActivity', {
        activityTypeId: activityTypeId,
        jsonMethod: jsonMethod,
        activityId: activity.id || activityId,
        activityTitle: activity.title,
      });
    } else {
      // Default behavior
      openExerciseDetail(0);
    }
  };

  const handleShowJson = () => {
    setShowJsonModal(true);
  };

  const handleViewExercises = () => {
    // Already on exercise list, just scroll to top or ensure exercises are visible
    if (exercises.length > 0) {
      // Exercises are already showing, no action needed
    }
  };

  const ExerciseCard = ({ exercise, index }: { exercise: ExerciseDto; index: number }) => {
    const exerciseData = parseExerciseJson(exercise.jsonData);
    const { imageUrl, audioUrl, title, description } = extractExerciseMediaInfo(exerciseData);
    const cardAnim = useRef(new Animated.Value(0)).current;
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    // Cleanup audio on unmount
    useEffect(() => {
      return () => {
        if (sound) {
          sound.unloadAsync().catch(console.error);
        }
      };
    }, [sound]);

    const handlePlayAudio = async () => {
      if (!audioUrl) return;

      try {
        if (sound) {
          // If sound is already loaded, toggle play/pause
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            if (status.isPlaying) {
              await sound.pauseAsync();
              setIsPlaying(false);
            } else {
              await sound.playAsync();
              setIsPlaying(true);
            }
          }
        } else {
          // Load and play new audio
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true }
          );
          setSound(newSound);
          setIsPlaying(true);

          // Handle playback finish
          newSound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
            }
          });
        }
      } catch (error) {
        console.error('Error playing audio:', error);
        Alert.alert('Error', 'Could not play audio. Please try again.');
      }
    };

    const gradients: readonly [string, string, ...string[]][] = [
      ['#FF6B9D', '#C06C84'] as const,
      ['#4ECDC4', '#44A08D'] as const,
      ['#FFD93D', '#F9A826'] as const,
      ['#A8E6CF', '#56C596'] as const,
      ['#B4A7D6', '#8E7CC3'] as const,
      ['#FFDAB9', '#FFC09F'] as const,
    ];

    const gradient = gradients[index % gradients.length];

    return (
      <Animated.View
        style={[
          styles.exerciseCard,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => openExerciseDetail(startIndex + index)}
          activeOpacity={0.8}
        >
          <LinearGradient colors={gradient} style={styles.cardGradient}>
            <View style={styles.cardContent}>
              {imageUrl && !imageError ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.exerciseImage}
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.placeholderIcon}>
                  <MaterialIcons name="image" size={40} color="rgba(255,255,255,0.7)" />
                </View>
              )}
              
              <View style={styles.textContainer}>
                <Text style={styles.exerciseTitle} numberOfLines={2}>
                  {title || `Exercise ${startIndex + index + 1}`}
                </Text>
                {description ? (
                  <Text style={styles.exerciseDescription} numberOfLines={2}>
                    {description}
                  </Text>
                ) : null}
              </View>
              
              {audioUrl && (
                <TouchableOpacity
                  style={styles.audioButton}
                  onPress={handlePlayAudio}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons
                    name={isPlaying ? "pause" : "play-arrow"}
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background[0] }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Loading...
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../../assets/animations/Loading animation.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background[0] }]}>
      {/* Header */}
      <LinearGradient
        colors={theme.headerGradient}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]} numberOfLines={1}>
            {activity.title || (activityData ? activityData.name_en : 'Activity')}
          </Text>
        </View>
      </LinearGradient>

      {/* Exercises List */}
      <Animated.View 
        style={[
          styles.content, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        {!loading && exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="library-books" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              No Exercises Available
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
              This activity doesn't have any exercises yet.
            </Text>
          </View>
        ) : exercises.length > 0 ? (
          <>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {paginatedExercises.map((exercise, index) => (
                <ExerciseCard 
                  key={exercise.id} 
                  exercise={exercise} 
                  index={index} 
                />
              ))}
            </ScrollView>

            {/* Pagination */}
            {totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
                  onPress={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <MaterialIcons 
                    name="chevron-left" 
                    size={24} 
                    color={currentPage === 1 ? '#CCCCCC' : theme.headerGradient[0]} 
                  />
                </TouchableOpacity>
                
                <Text style={[styles.pageIndicator, { color: theme.textPrimary }]}>
                  {currentPage} of {totalPages}
                </Text>
                
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
                  onPress={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <MaterialIcons 
                    name="chevron-right" 
                    size={24} 
                    color={currentPage === totalPages ? '#CCCCCC' : theme.headerGradient[0]} 
                  />
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : null}
      </Animated.View>

      {/* JSON Modal */}
      {showJsonModal && activityData && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Activity JSON Data</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowJsonModal(false)}
              >
                <MaterialIcons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.jsonText, { color: theme.textPrimary }]}>
                {JSON.stringify(activityData.details_JSON ? JSON.parse(activityData.details_JSON) : activityData, null, 2)}
              </Text>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 20,
    zIndex: 20,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  activityTypeBanner: {
    backgroundColor: '#43BCCD',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  activityTypeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bannerButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  bannerButton: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    gap: 6,
  },
  showJsonButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  viewExercisesButton: {
    backgroundColor: '#FFFFFF',
  },
  bannerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  scrollContent: {
    padding: 20,
  },
  exerciseCard: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 17,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseImage: {
    width: 65,
    height: 65,
    borderRadius: 25,
    marginRight: 25,
  },
  placeholderIcon: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  exerciseDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  audioButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  paginationButton: {
    padding: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageIndicator: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
    maxHeight: '70%',
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});

export default ExerciseScreen;