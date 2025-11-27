import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Slider,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityComponentProps, Language, MultiLingualText } from './types';
import { useResponsive } from '../../utils/responsive';
import { useTheme } from '../../theme/ThemeContext';

interface SongLyric {
  content: MultiLingualText;
  timestamp: number;
}

interface SongData {
  title: MultiLingualText;
  artist: string;
  albumArtUrl: string;
  audioUrl: MultiLingualText;
  lyrics: SongLyric[];
}

interface SongPlayerContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  songData: SongData;
}

const SongPlayer: React.FC<ActivityComponentProps> = ({
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
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const songData = (content as SongPlayerContent)?.songData;

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  const getAudioUrl = (): string | null => {
    if (!songData?.audioUrl) return null;
    return songData.audioUrl[currentLang] || songData.audioUrl.en || songData.audioUrl.ta || null;
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
        setDuration(status.durationMillis / 1000);
      }

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setCurrentTime(status.positionMillis / 1000);
          setIsPlaying(status.isPlaying);
          syncLyrics(status.positionMillis / 1000);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setCurrentTime(0);
            setCurrentLyricIndex(0);
          }
        }
      });
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const syncLyrics = (time: number) => {
    if (!songData?.lyrics) return;

    const lyrics = songData.lyrics;
    const nextLyric = lyrics[currentLyricIndex + 1];

    if (nextLyric && time >= nextLyric.timestamp) {
      setCurrentLyricIndex(currentLyricIndex + 1);
      scrollToCurrentLyric();
    } else if (currentLyricIndex > 0) {
      const currentLyric = lyrics[currentLyricIndex];
      if (time < currentLyric.timestamp) {
        for (let i = currentLyricIndex - 1; i >= 0; i--) {
          if (time >= lyrics[i].timestamp) {
            setCurrentLyricIndex(i);
            scrollToCurrentLyric();
            return;
          }
        }
        setCurrentLyricIndex(0);
      }
    }
  };

  const scrollToCurrentLyric = () => {
    // Scroll to current lyric (simplified - would need proper refs in real implementation)
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

  if (!songData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No song content available</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={theme.headerGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getText((content as SongPlayerContent).title)}</Text>
        <Text style={styles.instruction}>{getText((content as SongPlayerContent).instruction)}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} ref={scrollViewRef}>
        {/* Album Art */}
        {songData.albumArtUrl && (
          <Image source={{ uri: songData.albumArtUrl }} style={styles.albumArt} resizeMode="cover" />
        )}

        {/* Song Info */}
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>{getText(songData.title)}</Text>
          {songData.artist && <Text style={styles.artist}>{songData.artist}</Text>}
        </View>

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

        {/* Lyrics */}
        {songData.lyrics && songData.lyrics.length > 0 && (
          <View style={styles.lyricsContainer}>
            <Text style={styles.lyricsTitle}>Lyrics:</Text>
            {songData.lyrics.map((lyric, index) => (
              <Text
                key={index}
                style={[
                  styles.lyricLine,
                  index === currentLyricIndex && styles.lyricLineActive,
                ]}
              >
                {getText(lyric.content)}
              </Text>
            ))}
          </View>
        )}
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
  albumArt: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    marginBottom: 20,
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  artist: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  controls: {
    marginBottom: 30,
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
  lyricsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
  },
  lyricsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  lyricLine: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
    lineHeight: 24,
  },
  lyricLineActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

export default SongPlayer;

