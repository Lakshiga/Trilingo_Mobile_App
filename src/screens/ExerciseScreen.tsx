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
import apiService, { ExerciseDto, ActivityDto } from '../services/api';
import { extractExerciseMediaInfo, parseExerciseJson } from '../utils/exerciseHelpers';

const { width } = Dimensions.get('window');

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
  const { activity } = route.params || { activity: { id: 0, title: 'Activity', description: '' } };

  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    fetchExercises();
    
    // Header animation
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

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const fetchedExercises = await apiService.getExercisesByActivityId(activity.id);
      
      // Sort by sequence order
      const sortedExercises = fetchedExercises.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
      setExercises(sortedExercises);
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
              {activity.description || 'Complete the exercises below'}
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
                exercises.map((exercise, index) => (
                  <ExerciseCard key={exercise.id} exercise={exercise} index={index} />
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
    top: 45,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 10,
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
    paddingTop: 100,
    paddingBottom: 30,
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
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
    paddingHorizontal: 16,
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


