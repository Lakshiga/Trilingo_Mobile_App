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
  activity: {
    id: number;
    title: string;
    description: string;
  };
};

const ExerciseScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: ExerciseScreenRouteParams }, 'params'>>();
  const { theme, isDarkMode } = useTheme();
  const { currentUser } = useUser();
  const nativeLanguage: Language = (currentUser?.nativeLanguage as Language) || 'English';
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  const { activity } = route.params || { activity: { id: 0, title: 'Activity', description: '' } };

  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
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
  }, [activity.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activity.id]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const fetchedExercises = await apiService.getExercisesByActivityId(activity.id);
      
      // Sort by sequence order
      const sortedExercises = fetchedExercises.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
      setExercises(sortedExercises);
      setCurrentPage(1);
    } catch (error: any) {
      console.error('Error fetching exercises:', error);
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
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={() => openExerciseDetail(index)}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.exerciseGradient}
          >
            <View style={styles.exerciseContent}>
              <View style={styles.exerciseNumber}>
                <Text style={styles.exerciseNumberText}>{index + 1}</Text>
              </View>
              
              {/* Image Display */}
              {imageUrl && !imageError && (
                <View style={styles.exerciseImageContainer}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.exerciseImage}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                  />
                </View>
              )}
              
              <View style={styles.exerciseTextContainer}>
                <Text style={styles.exerciseTitle}>
                  {title || `Exercise ${index + 1}`}
                </Text>
                <Text style={styles.exerciseDescription} numberOfLines={2}>
                  {description || 'Complete this exercise to continue'}
                </Text>
              </View>
              
              {/* Audio Play Button */}
              {audioUrl ? (
                <TouchableOpacity
                  onPress={handlePlayAudio}
                  style={styles.audioButton}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={isPlaying ? 'pause' : 'play-arrow'}
                    size={32}
                    color="#fff"
                  />
                </TouchableOpacity>
              ) : (
                <MaterialIcons name="play-arrow" size={32} color="#fff" />
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#111827', '#0F172A'] : ['#E8F5E9', '#F1F8E9', '#FFF9C4']}
        style={styles.gradient}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.emoji}>📝</Text>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{activity.title}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {activity.description || getTranslation(nativeLanguage, 'completeExercisesBelow')}
            </Text>
          </Animated.View>

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.textPrimary || '#4ECDC4'} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading exercises...
              </Text>
            </View>
          )}

          {/* Exercises List */}
          {!loading && (
            <View style={styles.exercisesContainer}>
              {exercises.length > 0 ? (
                paginatedExercises.map((exercise, index) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    index={startIndex + index}
                  />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No exercises available for this activity yet.
                  </Text>
                  <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                    Check back later!
                  </Text>
                </View>
              )}
            </View>
          )}

          {!loading && totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  currentPage === 1 && styles.paginationButtonDisabled,
                ]}
                onPress={handlePrevPage}
                disabled={currentPage === 1}
              >
                <MaterialIcons name="chevron-left" size={20} color="#fff" />
                <Text style={styles.paginationButtonText}>
                  {getTranslation(nativeLanguage, 'previousPage')}
                </Text>
              </TouchableOpacity>

              <Text style={styles.paginationText}>
                {`${getTranslation(nativeLanguage, 'pageLabel')} ${currentPage} ${getTranslation(
                  nativeLanguage,
                  'of'
                )} ${totalPages}`}
              </Text>

              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  currentPage === totalPages && styles.paginationButtonDisabled,
                ]}
                onPress={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <Text style={styles.paginationButtonText}>
                  {getTranslation(nativeLanguage, 'nextPage')}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
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
  backButton: {
    position: 'absolute',
    top: Math.max(40, height * 0.05),
    left: Math.max(12, width * 0.04),
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: Math.max(8, width * 0.025),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Math.max(70, height * 0.08),
    paddingBottom: 30,
    paddingHorizontal: Math.max(12, width * 0.04),
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  emoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: Math.max(26, width * 0.075),
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Math.max(14, width * 0.04),
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  exercisesContainer: {
    paddingHorizontal: 0,
  },
  exerciseCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  exerciseGradient: {
    padding: 20,
  },
  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseNumber: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  exerciseNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  exerciseImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  exerciseTextContainer: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  audioButton: {
    padding: 4,
    marginLeft: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: Math.max(4, width * 0.01),
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginHorizontal: 4,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ExerciseScreen;


