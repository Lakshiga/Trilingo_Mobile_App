import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityComponentProps, Language, MultiLingualText } from './types';
import { useResponsive } from '../../utils/responsive';
import { useTheme } from '../../theme/ThemeContext';

interface Scene {
  imageUrl: string;
  content: MultiLingualText;
  timestamp: number;
}

interface StoryData {
  title: MultiLingualText;
  audioUrl: MultiLingualText;
  scenes: Scene[];
}

interface StoryPlayerContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  storyData: StoryData;
}

const StoryPlayer: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
}) => {
  const responsive = useResponsive();
  const { theme } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  const storyData = (content as StoryPlayerContent)?.storyData;

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  const getAudioUrl = (): string | null => {
    if (!storyData?.audioUrl) return null;
    return storyData.audioUrl[currentLang] || storyData.audioUrl.en || storyData.audioUrl.ta || null;
  };

  useEffect(() => {
    loadAudio();
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.warn);
      }
    };
  }, [currentLang]);

  const loadAudio = async () => {
    const audioUrl = getAudioUrl();
    if (!audioUrl) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false }
      );

      setSound(newSound);
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
      }

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setCurrentTime(status.positionMillis / 1000);
          setIsPlaying(status.isPlaying);
          syncScenes(status.positionMillis / 1000);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setCurrentTime(0);
            setCurrentSceneIndex(0);
          }
        }
      });
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const syncScenes = (time: number) => {
    if (!storyData?.scenes) return;

    const scenes = storyData.scenes;
    const nextScene = scenes[currentSceneIndex + 1];

    if (nextScene && time >= nextScene.timestamp) {
      setCurrentSceneIndex(currentSceneIndex + 1);
    } else if (currentSceneIndex > 0) {
      const currentScene = scenes[currentSceneIndex];
      if (time < currentScene.timestamp) {
        for (let i = currentSceneIndex - 1; i >= 0; i--) {
          if (time >= scenes[i].timestamp) {
            setCurrentSceneIndex(i);
            return;
          }
        }
        setCurrentSceneIndex(0);
      }
    }
  };

  const togglePlay = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const seek = async (value: number) => {
    if (!sound) return;
    try {
      await sound.setPositionAsync(value * 1000);
      syncScenes(value);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (!storyData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No story content available</Text>
      </View>
    );
  }

  const currentScene = storyData.scenes[currentSceneIndex];

  return (
    <LinearGradient colors={theme.headerGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getText((content as StoryPlayerContent).title)}</Text>
        <Text style={styles.instruction}>{getText((content as StoryPlayerContent).instruction)}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Current Scene */}
        {currentScene && (
          <View style={styles.sceneContainer}>
            {currentScene.imageUrl && (
              <Image source={{ uri: currentScene.imageUrl }} style={styles.sceneImage} resizeMode="cover" />
            )}
            <Text style={styles.sceneText}>{getText(currentScene.content)}</Text>
          </View>
        )}

        {/* Player Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
            <MaterialIcons
              name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
              size={60}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration || 1}
              value={currentTime}
              onValueChange={seek}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="#FFFFFF"
            />
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Scene Navigation */}
        <View style={styles.sceneNav}>
          <Text style={styles.sceneCounter}>
            Scene {currentSceneIndex + 1} of {storyData.scenes.length}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sceneContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  sceneImage: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    marginBottom: 15,
  },
  sceneText: {
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 28,
    textAlign: 'center',
  },
  controls: {
    marginBottom: 20,
  },
  playButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    minWidth: 50,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sceneNav: {
    alignItems: 'center',
  },
  sceneCounter: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

export default StoryPlayer;

