import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityComponentProps, Language, MultiLingualText, ImageUrl } from './types';
import { useResponsive } from '../../utils/responsive';
import { useTheme } from '../../theme/ThemeContext';

const { width } = Dimensions.get('window');

interface FlashcardWord {
  id: string;
  label?: MultiLingualText | null;
  referenceTitle?: MultiLingualText | null;
  imageUrl?: ImageUrl | null;
  word: MultiLingualText;
  audioUrl: MultiLingualText;
}

interface FlashcardContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  words: FlashcardWord[];
}

const Flashcard: React.FC<ActivityComponentProps> = ({ 
  content, 
  currentLang = 'ta',
  onComplete 
}) => {
  const responsive = useResponsive();
  const { theme } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Parse content - handle both FlashcardContent and single FlashcardWord
  const getContent = (): FlashcardContent | null => {
    if (!content) return null;
    
    // If content has words array, it's FlashcardContent
    if (content.words && Array.isArray(content.words)) {
      return content as FlashcardContent;
    }
    
    // If content has word property, it's a single FlashcardWord
    if (content.word) {
      return {
        title: { ta: '', en: '', si: '' },
        instruction: { ta: '', en: '', si: '' },
        words: [content as FlashcardWord]
      };
    }
    
    return null;
  };

  const flashcardData = getContent();
  const currentWord = flashcardData?.words[currentIndex];

  // Check if detailed design (has label)
  const isDetailedDesign = currentWord?.label && 
    currentWord.label[currentLang];

  // Get text helper
  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  // Get image URL
  const getImageUrl = (): string | null => {
    if (!currentWord?.imageUrl) return null;
    const imageUrl = currentWord.imageUrl;
    return imageUrl[currentLang] || imageUrl.default || imageUrl.en || imageUrl.ta || null;
  };

  // Get audio URL
  const getAudioUrl = (): string | null => {
    if (!currentWord?.audioUrl) return null;
    return currentWord.audioUrl[currentLang] || currentWord.audioUrl.en || currentWord.audioUrl.ta || null;
  };

  // Play audio
  const playAudio = async () => {
    const audioUrl = getAudioUrl();
    if (!audioUrl) return;

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
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // Auto-play audio on word change
  useEffect(() => {
    if (currentWord) {
      setTimeout(() => {
        playAudio();
      }, 300);
    }
  }, [currentIndex]);

  // Cleanup audio
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.warn);
      }
    };
  }, [sound]);

  // Navigation
  const goToNext = () => {
    if (flashcardData && currentIndex < flashcardData.words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!flashcardData || !currentWord) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No flashcard content available</Text>
      </View>
    );
  }

  const imageUrl = getImageUrl();
  const mainWord = getText(currentWord.word);
  const label = getText(currentWord.label);
  const referenceTitle = getText(currentWord.referenceTitle);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.headerGradient}
        style={styles.gradient}
      >
        {/* Simple Design (Vowel/Simple Look) */}
        {!isDetailedDesign && (
          <View style={styles.simpleContainer}>
            <Text style={styles.largeWord}>{mainWord}</Text>
            {getAudioUrl() && (
              <TouchableOpacity
                style={styles.audioButtonLarge}
                onPress={playAudio}
              >
                <MaterialIcons
                  name={isPlaying ? "pause-circle-filled" : "volume-up"}
                  size={responsive.wp(15)}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Detailed Design */}
        {isDetailedDesign && (
          <View style={styles.detailedContainer}>
            {referenceTitle && (
              <Text style={styles.referenceTitle}>{referenceTitle}</Text>
            )}
            
            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            )}

            <View style={styles.contentContainer}>
              {label && (
                <Text style={styles.label}>{label}</Text>
              )}
              
              <View style={styles.wordContainer}>
                <Text style={styles.word}>{mainWord}</Text>
                {getAudioUrl() && (
                  <TouchableOpacity
                    style={styles.audioButton}
                    onPress={playAudio}
                  >
                    <MaterialIcons
                      name={isPlaying ? "pause-circle-filled" : "volume-up"}
                      size={responsive.wp(8)}
                      color="#1F2937"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={goToPrev}
            disabled={currentIndex === 0}
          >
            <MaterialIcons name="chevron-left" size={24} color={currentIndex === 0 ? "#999" : "#FFFFFF"} />
          </TouchableOpacity>
          
          <Text style={styles.counter}>
            {currentIndex + 1} / {flashcardData.words.length}
          </Text>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={goToNext}
          >
            <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  largeWord: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  audioButtonLarge: {
    padding: 15,
  },
  detailedContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  referenceTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 15,
    marginBottom: 20,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  word: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 10,
  },
  audioButton: {
    padding: 10,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 20,
  },
  navButton: {
    padding: 10,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  counter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

export default Flashcard;

