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
import { ActivityComponentProps, Language, MultiLingualText } from './types';
// import { useResponsive } from '../../utils/responsive'; // Disabled to fix TS2339 rem error
import { useTheme } from '../../theme/ThemeContext';
import { CLOUDFRONT_URL } from '../../config/apiConfig';

interface SongLyric {
  content: MultiLingualText;
  timestamp: { [key in Language]?: number } | number;
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

// Helper to extract the correct timestamp for the current language
const getLyricTimestamp = (lyric: SongLyric, currentLang: Language): number => {
  if (typeof lyric.timestamp === 'number') {
    return lyric.timestamp;
  }
  return (
    lyric.timestamp[currentLang] || 
    lyric.timestamp.en || 
    lyric.timestamp.ta || 
    lyric.timestamp.si || 
    0
  );
};


const SongPlayer: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
}) => {
  // const responsive = useResponsive(); // Disabled to fix TS2339 rem error
  const { theme } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const scrollViewRef = useRef<ScrollView>(null);
  const lyricRefs = useRef<Array<View | null>>([]);
  const isSeeking = useRef(false);

  const songData = (content as SongPlayerContent)?.songData;

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  const resolveAssetUrl = (url?: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${CLOUDFRONT_URL}${url}`;
    return `${CLOUDFRONT_URL}/${url}`;
  };

  const getAudioUrl = (): string | null => {
    if (!songData?.audioUrl) return null;
    const picked =
      songData.audioUrl[currentLang] ||
      songData.audioUrl.en ||
      songData.audioUrl.ta ||
      songData.audioUrl.si ||
      null;
    return resolveAssetUrl(picked);
  };

  const resetPlayerState = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentLyricIndex(-1);
  };

  // Stop/unload audio whenever sound changes or component unmounts (e.g., exiting the screen)
  useEffect(() => {
    return () => {
      if (sound) {
        sound.stopAsync().catch(() => null);
        sound.unloadAsync().catch(() => null);
      }
    };
  }, [sound]);

  useEffect(() => {
    loadAudio();
    return () => {
      // Unload audio and reset state when component unmounts or currentLang changes (song change)
      if (sound) {
        sound.unloadAsync().catch(console.warn);
      }
      resetPlayerState();
    };
  }, [currentLang]);

  const loadAudio = async () => {
    const audioUrl = getAudioUrl();
    if (!audioUrl) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }
      resetPlayerState(); // Reset state before loading new audio

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false }
      );

      setSound(newSound);
      const status: any = await newSound.getStatusAsync(); // Use 'any' to avoid TS2339 AVPlaybackStatus error
      if (status.isLoaded) {
        setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
      }

      // Use 'any' for status to resolve TS2339 (positionMillis)
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          const newTime = status.positionMillis / 1000;
          setCurrentTime(newTime);
          setIsPlaying(status.isPlaying);

          if (!isSeeking.current) {
             syncLyrics(newTime);
          }

          if (status.didJustFinish) {
            resetPlayerState();
            newSound.setPositionAsync(0); // Reset position to 0
            if (onComplete) onComplete();
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
    
    // Find the current lyric index based on the time
    let newIndex = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
        const lyricTimestamp = getLyricTimestamp(lyrics[i], currentLang);
        // Compare in milliseconds for better precision
        if (time * 1000 >= lyricTimestamp * 1000) { 
            newIndex = i;
            break;
        }
    }

    if (newIndex !== currentLyricIndex) {
        setCurrentLyricIndex(newIndex);
        scrollToCurrentLyric(newIndex);
    }
  };
  
  // Added index parameter back to fix TS2554 (Expected 0 arguments, but got 1)
  const scrollToCurrentLyric = (index: number) => { 
    if (index === -1) return;
    
    const currentRef = lyricRefs.current[index];
    if (currentRef && scrollViewRef.current) {
      currentRef.measureLayout(
        scrollViewRef.current as any,
        (x, y, width, height) => {
          // Center the active line or place it near the top
          scrollViewRef.current?.scrollTo({ y: y - 50, animated: true }); 
        },
        () => console.log('Measure layout failed')
      );
    }
  };

  const togglePlay = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        const status: any = await sound.getStatusAsync();
        const currentTimeInSeconds = (status.positionMillis / 1000) || 0;
        syncLyrics(currentTimeInSeconds); 
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const seek = async (value: number) => {
    if (!sound) return;
    isSeeking.current = true;
    try {
      await sound.setPositionAsync(value * 1000);
      syncLyrics(value); // Immediately update lyrics after seeking
    } catch (error) {
      console.error('Error seeking:', error);
    } finally {
      isSeeking.current = false;
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
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent} 
        ref={scrollViewRef}
      >
        {/* Song Info at Top */}
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>{getText(songData.title)}</Text>
          {songData.artist && <Text style={styles.artist}>{songData.artist}</Text>}
          {/* Instruction Text */}
          <Text style={styles.instructionText}>{getText(content.instruction)}</Text>
        </View>

        {/* Player Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.playButton} onPress={togglePlay} disabled={!sound}>
            <MaterialIcons
              name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
              size={60} // Fixed size to avoid TS2339 rem error
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
              onSlidingStart={() => isSeeking.current = true}
              onSlidingComplete={seek}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="#FFFFFF"
              disabled={!sound}
            />
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
        
        {/* Lyrics - Placed immediately after controls with no extra gap */}
        {songData.lyrics && songData.lyrics.length > 0 && (
          <View style={styles.lyricsContainer}>
            {(() => {
              // Show only the active lyric; before play, default to first line
              const activeIndex = currentLyricIndex >= 0 ? currentLyricIndex : 0;
              const lyric = songData.lyrics[activeIndex];
              if (!lyric) return null;
              return (
                <View
                  key={activeIndex}
                  ref={(el: View | null) => { lyricRefs.current[activeIndex] = el; }} 
                  style={[
                    styles.lyricRow,
                    styles.lyricRowActive,
                  ]}
                >
                  <Text style={styles.lyricTimestamp}>{formatTime(getLyricTimestamp(lyric, currentLang))}</Text>
                  <Text
                    style={[
                      styles.lyricLine,
                      styles.lyricLineActive,
                    ]}
                  >
                    {getText(lyric.content)}
                  </Text>
                </View>
              );
            })()}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0F172A', // Plain dark background (no gradient)
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  artist: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controls: {
    marginBottom: 10,
  },
  playButton: {
    alignItems: 'center',
    marginBottom: 15,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    minWidth: 40,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  slider: {
    flex: 1,
    height: 40,
  },
  lyricsContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  lyricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  lyricRowActive: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  lyricTimestamp: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    width: 72,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    marginRight: 10,
  },
  lyricLine: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'left',
    lineHeight: 26,
    flex: 1,
  },
  lyricLineActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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