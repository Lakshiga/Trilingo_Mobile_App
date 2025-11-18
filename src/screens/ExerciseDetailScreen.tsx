import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ExerciseDto, ActivityDto } from '../services/api';
import {
  extractExerciseMediaInfo,
  getLocalizedValue,
  parseExerciseJson,
  SupportedLanguage,
} from '../utils/exerciseHelpers';

type ExerciseDetailRouteParams = {
  params: {
    activity: ActivityDto;
    exercises: ExerciseDto[];
    startIndex: number;
  };
};

const languages: SupportedLanguage[] = ['ta', 'en', 'si'];
const { width } = Dimensions.get('window');

const ExerciseDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ExerciseDetailRouteParams, 'params'>>();
  const { activity, exercises, startIndex } = route.params || {
    activity: {
      id: 0,
      name_en: 'Activity',
      name_ta: '',
      name_si: '',
      stageId: 0,
      mainActivityId: 0,
      activityTypeId: 0,
      sequenceOrder: 1,
    },
    exercises: [],
    startIndex: 0,
  };

  const [currentIndex, setCurrentIndex] = useState(startIndex || 0);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentExercise = exercises[currentIndex] || exercises[0];

  const mediaInfo = useMemo(() => {
    if (!currentExercise) {
      return null;
    }
    const data = parseExerciseJson(currentExercise.jsonData);
    return extractExerciseMediaInfo(data, selectedLanguage);
  }, [currentExercise, selectedLanguage]);

  useEffect(() => {
    setIsPlaying(false);
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.warn);
      }
    };
  }, [currentExercise, sound]);

  const playAudio = async () => {
    if (!mediaInfo?.audioUrl) {
      return;
    }

    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
            setIsPlaying(true);
          }
          return;
        }
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: mediaInfo.audioUrl },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.warn('Failed to play audio', error);
    }
  };

  const goToNext = () => {
    if (exercises.length === 0) {
      return;
    }
    setCurrentIndex((prev) => (prev + 1) % exercises.length);
  };

  const goToPrev = () => {
    if (exercises.length === 0) {
      return;
    }
    setCurrentIndex((prev) =>
      prev === 0 ? exercises.length - 1 : prev - 1
    );
  };

  const closeScreen = () => {
    navigation.goBack();
  };

  if (!currentExercise || !mediaInfo) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No exercises available</Text>
        <TouchableOpacity style={styles.emptyButton} onPress={closeScreen}>
          <Text style={styles.emptyButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headline =
    getLocalizedValue(mediaInfo.word, selectedLanguage) || mediaInfo.title;

  const description =
    getLocalizedValue(mediaInfo?.label, selectedLanguage) ||
    getLocalizedValue(mediaInfo?.referenceTitle, selectedLanguage) ||
    getLocalizedValue(mediaInfo?.instruction, selectedLanguage) ||
    mediaInfo.description;

  return (
    <LinearGradient colors={['#F7FFF7', '#E0F7FA']} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.navButton} onPress={closeScreen}>
          <MaterialIcons name="arrow-back" size={26} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {exercises.length}
          </Text>
        </View>
        <TouchableOpacity style={styles.navButton} onPress={closeScreen}>
          <MaterialIcons name="close" size={26} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <View style={styles.headerText}>
        <Text style={styles.activityTitle}>
          {activity?.name_en || activity?.name_ta || activity?.name_si || 'Activity'}
        </Text>
        <Text style={styles.activitySubtitle}>Fun activity</Text>
      </View>

      <View style={styles.languageRow}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[
              styles.languageChip,
              selectedLanguage === lang && styles.languageChipActive,
            ]}
            onPress={() => setSelectedLanguage(lang)}
          >
            <Text
              style={[
                styles.languageChipText,
                selectedLanguage === lang && styles.languageChipTextActive,
              ]}
            >
              {lang.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.imageWrapper}>
          {mediaInfo.imageUrl ? (
            <Image
              source={{ uri: mediaInfo.imageUrl }}
              style={styles.exerciseImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.placeholderEmoji}>🎨</Text>
          )}
        </View>

        <Text style={styles.wordText}>{headline}</Text>
        {!!description && (
          <Text style={styles.translationText}>{description}</Text>
        )}

        {mediaInfo.audioUrl && (
          <TouchableOpacity style={styles.audioButton} onPress={playAudio}>
            <MaterialIcons
              name={isPlaying ? 'pause-circle-filled' : 'volume-up'}
              size={36}
              color="#1F2937"
            />
            <Text style={styles.audioButtonText}>
              {isPlaying ? 'Pause' : 'Listen'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.navigationRow}>
        <TouchableOpacity style={styles.navAction} onPress={goToPrev}>
          <MaterialIcons name="chevron-left" size={24} color="#1F2937" />
          <Text style={styles.navActionText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navAction} onPress={goToNext}>
          <Text style={styles.navActionText}>Next</Text>
          <MaterialIcons name="chevron-right" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerText: {
    alignItems: 'center',
    marginBottom: 10,
  },
  activityTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 10,
  },
  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  languageChipActive: {
    backgroundColor: '#1F2937',
  },
  languageChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  languageChipTextActive: {
    color: '#FFFFFF',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  imageWrapper: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: (width * 0.55) / 2,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 6,
    borderColor: '#E0F2FE',
  },
  exerciseImage: {
    width: '85%',
    height: '85%',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  wordText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  translationText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#E0F2FE',
    borderRadius: 30,
  },
  audioButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  navAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  navActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FFF7',
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 16,
    color: '#1F2937',
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#1F2937',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default ExerciseDetailScreen;

