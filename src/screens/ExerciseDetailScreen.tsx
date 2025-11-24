import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
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
import { useResponsive } from '../utils/responsive';

type ExerciseDetailRouteParams = {
  params: {
    activity: ActivityDto;
    exercises: ExerciseDto[];
    startIndex: number;
    activityTypeId?: number;
    jsonMethod?: string;
  };
};

const languages: SupportedLanguage[] = ['ta', 'en', 'si'];

const ExerciseDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ExerciseDetailRouteParams, 'params'>>();
  const responsive = useResponsive();
  const { activity, exercises, startIndex, activityTypeId, jsonMethod } = route.params || {
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
    activityTypeId: undefined,
    jsonMethod: undefined,
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
    const emptyStyles = getStyles(responsive);
    return (
      <View style={emptyStyles.emptyState}>
        <Text style={emptyStyles.emptyText}>No exercises available</Text>
        <TouchableOpacity style={emptyStyles.emptyButton} onPress={closeScreen}>
          <Text style={emptyStyles.emptyButtonText}>Back</Text>
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

  const styles = getStyles(responsive);

  return (
    <LinearGradient colors={['#F7FFF7', '#E0F7FA']} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.navButton} onPress={closeScreen}>
          <MaterialIcons name="arrow-back" size={responsive.wp(6.5)} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {exercises.length}
          </Text>
        </View>
        <TouchableOpacity style={styles.navButton} onPress={closeScreen}>
          <MaterialIcons name="close" size={responsive.wp(6.5)} color="#1F2937" />
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
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderEmoji}>🎨</Text>
            </View>
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
              size={responsive.wp(9)}
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
          <MaterialIcons name="chevron-left" size={responsive.wp(6)} color="#1F2937" />
          <Text style={styles.navActionText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navAction} onPress={goToNext}>
          <Text style={styles.navActionText}>Next</Text>
          <MaterialIcons name="chevron-right" size={responsive.wp(6)} color="#1F2937" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: responsive.wp(5),
    paddingTop: responsive.hp(6),
    paddingBottom: responsive.hp(4),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsive.hp(2.5),
  },
  navButton: {
    width: responsive.wp(12),
    height: responsive.wp(12),
    borderRadius: responsive.wp(6),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.25) },
    shadowOpacity: 0.1,
    shadowRadius: responsive.wp(1),
    elevation: 4,
  },
  progressContainer: {
    paddingHorizontal: responsive.wp(5),
    paddingVertical: responsive.hp(1),
    borderRadius: responsive.wp(5),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.1) },
    shadowOpacity: 0.05,
    shadowRadius: responsive.wp(0.8),
    elevation: 2,
  },
  progressText: {
    fontSize: responsive.wp(4),
    fontWeight: '600',
    color: '#1F2937',
  },
  headerText: {
    alignItems: 'center',
    marginBottom: responsive.hp(1.2),
  },
  activityTitle: {
    fontSize: responsive.wp(5.5),
    fontWeight: '700',
    color: '#1F2937',
  },
  activitySubtitle: {
    fontSize: responsive.wp(3.5),
    color: '#6B7280',
    marginTop: responsive.hp(0.5),
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: responsive.hp(2),
    gap: responsive.wp(2.5),
  },
  languageChip: {
    paddingHorizontal: responsive.wp(4),
    paddingVertical: responsive.hp(1),
    borderRadius: responsive.wp(5),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  languageChipActive: {
    backgroundColor: '#1F2937',
  },
  languageChipText: {
    fontSize: responsive.wp(3.5),
    fontWeight: '600',
    color: '#1F2937',
  },
  languageChipTextActive: {
    color: '#FFFFFF',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: responsive.wp(7),
    padding: responsive.wp(6),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.75) },
    shadowOpacity: 0.08,
    shadowRadius: responsive.wp(3),
    elevation: 6,
  },
  imageWrapper: {
    width: responsive.wp(50),
    height: responsive.wp(50),
    borderRadius: responsive.wp(25),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsive.hp(3),
    borderWidth: responsive.wp(1.5),
    borderColor: '#E0F2FE',
    overflow: 'hidden',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: responsive.wp(16),
  },
  wordText: {
    fontSize: responsive.wp(9),
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  translationText: {
    fontSize: responsive.wp(4),
    color: '#4B5563',
    textAlign: 'center',
    marginTop: responsive.hp(1),
    marginBottom: responsive.hp(2.5),
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive.wp(2),
    paddingHorizontal: responsive.wp(4.5),
    paddingVertical: responsive.hp(1.2),
    backgroundColor: '#E0F2FE',
    borderRadius: responsive.wp(7.5),
  },
  audioButtonText: {
    fontSize: responsive.wp(4),
    fontWeight: '600',
    color: '#1F2937',
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: responsive.hp(3),
  },
  navAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive.wp(1.5),
    paddingHorizontal: responsive.wp(5),
    paddingVertical: responsive.hp(1.5),
    backgroundColor: '#FFFFFF',
    borderRadius: responsive.wp(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.25) },
    shadowOpacity: 0.1,
    shadowRadius: responsive.wp(1),
    elevation: 4,
  },
  navActionText: {
    fontSize: responsive.wp(4),
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
    fontSize: responsive.wp(4.5),
    marginBottom: responsive.hp(2),
    color: '#1F2937',
  },
  emptyButton: {
    paddingHorizontal: responsive.wp(6),
    paddingVertical: responsive.hp(1.5),
    borderRadius: responsive.wp(6),
    backgroundColor: '#1F2937',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: responsive.wp(4),
  },
});

export default ExerciseDetailScreen;

