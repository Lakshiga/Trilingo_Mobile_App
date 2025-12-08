import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityComponentProps, Language, MultiLingualText, ImageUrl } from './types';
import { useResponsive } from '../../utils/responsive';
import { useTheme } from '../../theme/ThemeContext';
import { getCloudFrontUrl } from '../../utils/awsUrlHelper';
import apiService from '../../services/api';

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
  content: initialContent, 
  currentLang = 'ta',
  onComplete,
  activityId
}) => {
  const responsive = useResponsive();
  const { theme } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [content, setContent] = useState<any>(initialContent);
  const [loading, setLoading] = useState<boolean>(!!activityId); // Always fetch if activityId exists

  // Fetch exercises data if activityId is provided
  // Priority: Always fetch from exercises if activityId exists (exercises have full data)
  useEffect(() => {
    const fetchFlashcardData = async () => {
      if (!activityId) return; // Skip if no activityId
      
      // If we have activityId, always fetch exercises (they contain all 28 items)
      // Don't rely on initialContent from activity.details_JSON (which only has 2 sample items)
      
      try {
        setLoading(true);
        
        // Fetch all exercises for this activity
        const exercises = await apiService.getExercisesByActivityId(activityId);
        
        if (exercises && exercises.length > 0) {
          // Sort by sequenceOrder
          const sortedExercises = exercises.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
          
          // Parse each exercise's jsonData and combine into words array
          const wordsArray: FlashcardWord[] = [];
          let title = { ta: '', en: '', si: '' };
          let instruction = { ta: '', en: '', si: '' };
          
          sortedExercises.forEach((exercise, index) => {
            try {
              if (exercise.jsonData) {
                const parsedData = JSON.parse(exercise.jsonData);
                
                // First exercise might have title/instruction
                if (index === 0) {
                  if (parsedData.title) title = parsedData.title;
                  if (parsedData.instruction) instruction = parsedData.instruction;
                }
                
                // Extract word data from exercise
                // Handle different structures
                if (parsedData.word) {
                  wordsArray.push(parsedData as FlashcardWord);
                } else if (parsedData.words && Array.isArray(parsedData.words)) {
                  wordsArray.push(...parsedData.words);
                } else if (parsedData.id || parsedData.word) {
                  wordsArray.push(parsedData as FlashcardWord);
                }
              }
            } catch (parseError) {
              // Silently skip invalid exercise data
            }
          });
          
          // Create content structure with all words
          const combinedContent = {
            title: title,
            instruction: instruction,
            words: wordsArray,
            ...Object.fromEntries(
              wordsArray.map((word, idx) => [idx.toString(), word])
            )
          };
          
          setContent(combinedContent);
        }
      } catch (error) {
        // Error handled silently, loading state will be set to false
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcardData();
  }, [activityId]);

  // Parse content - handle multiple content structures
  const getContent = (): FlashcardContent | null => {
    if (!content) {
      return null;
    }
    
    // Case 1: Content has words array directly (most common)
    if (content.words && Array.isArray(content.words) && content.words.length > 0) {
      return {
        title: content.title || { ta: '', en: '', si: '' },
        instruction: content.instruction || { ta: '', en: '', si: '' },
        words: content.words,
      } as FlashcardContent;
    }
    
    // Case 2: Content has numeric keys (e.g., "0", "1", "2") - convert to array
    // This happens when JSON objects with numeric keys are parsed
    const keys = Object.keys(content);
    const numericKeys = keys.filter(key => /^\d+$/.test(key));
    
    if (numericKeys.length > 0) {
      const wordsArray: FlashcardWord[] = [];
      
      // Sort numeric keys numerically (0, 1, 2, ... 27, 28)
      numericKeys
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        .forEach(key => {
          const wordObj = content[key];
          // Check if it's a valid word object
          if (wordObj && typeof wordObj === 'object') {
            // More lenient validation - if it's an object, include it
            // (word property might be nested or have different structure)
            wordsArray.push(wordObj as FlashcardWord);
          }
        });
      
      if (wordsArray.length > 0) {
        return {
          title: content.title || { ta: '', en: '', si: '' },
          instruction: content.instruction || { ta: '', en: '', si: '' },
          words: wordsArray,
        } as FlashcardContent;
      }
    }
    
    // Case 3: Content is nested under flashcardData
    if (content.flashcardData && content.flashcardData.words && Array.isArray(content.flashcardData.words)) {
      return {
        title: content.title || content.flashcardData.title || { ta: '', en: '', si: '' },
        instruction: content.instruction || content.flashcardData.instruction || { ta: '', en: '', si: '' },
        words: content.flashcardData.words,
      } as FlashcardContent;
    }
    
    // Case 4: Content is nested under data
    if (content.data && content.data.words && Array.isArray(content.data.words)) {
      return {
        title: content.title || content.data.title || { ta: '', en: '', si: '' },
        instruction: content.instruction || content.data.instruction || { ta: '', en: '', si: '' },
        words: content.data.words,
      } as FlashcardContent;
    }
    
    // Case 5: Check for other possible nested keys
    const possibleKeys = ['flashcards', 'items', 'cards', 'flashcardWords', 'wordsList'];
    for (const key of possibleKeys) {
      if (content[key] && Array.isArray(content[key]) && content[key].length > 0) {
        return {
          title: content.title || { ta: '', en: '', si: '' },
          instruction: content.instruction || { ta: '', en: '', si: '' },
          words: content[key],
        } as FlashcardContent;
      }
    }
    
    // Case 6: Content itself is an array (treat as words array)
    if (Array.isArray(content) && content.length > 0) {
      return {
        title: { ta: '', en: '', si: '' },
        instruction: { ta: '', en: '', si: '' },
        words: content as FlashcardWord[],
      };
    }
    
    // Case 7: Single word object (has word property)
    if (content.word && typeof content.word === 'object') {
      return {
        title: content.title || { ta: '', en: '', si: '' },
        instruction: content.instruction || { ta: '', en: '', si: '' },
        words: [content as FlashcardWord],
      };
    }
    
    // Case 8: Check if content has properties that suggest it's a word object
    // (has word property with multilingual text structure)
    if (content.word && (
      content.word.en || content.word.ta || content.word.si ||
      (typeof content.word === 'object' && Object.keys(content.word).length > 0)
    )) {
      return {
        title: content.title || { ta: '', en: '', si: '' },
        instruction: content.instruction || { ta: '', en: '', si: '' },
        words: [content as FlashcardWord],
      };
    }
    
    return null;
  };

  const flashcardData = getContent();
  
  // Ensure currentIndex is within bounds
  useEffect(() => {
    if (flashcardData && flashcardData.words && flashcardData.words.length > 0) {
      if (currentIndex >= flashcardData.words.length) {
        setCurrentIndex(0);
      }
    }
  }, [flashcardData, currentIndex]);

  const currentWord = flashcardData?.words[currentIndex];

  // Check if detailed design (has label)
  const isDetailedDesign = currentWord?.label && 
    currentWord.label[currentLang] &&
    currentWord.label[currentLang].trim().length > 0;

  // Get text helper
  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  // Get image URL with CloudFront base URL
  const getImageUrl = (): string | null => {
    if (!currentWord?.imageUrl) return null;
    const imageUrl = currentWord.imageUrl;
    const relativePath = imageUrl[currentLang] || imageUrl.default || imageUrl.en || imageUrl.ta || null;
    if (!relativePath) return null;
    
    // Convert relative path to full CloudFront URL
    return getCloudFrontUrl(relativePath);
  };

  // Get audio URL with CloudFront base URL
  const getAudioUrl = (): string | null => {
    if (!currentWord?.audioUrl) return null;
    const relativePath = currentWord.audioUrl[currentLang] || currentWord.audioUrl.en || currentWord.audioUrl.ta || null;
    if (!relativePath) return null;
    
    // Convert relative path to full CloudFront URL
    return getCloudFrontUrl(relativePath);
  };

  // Play audio
  const playAudio = async () => {
    const audioUrl = getAudioUrl();
    if (!audioUrl) {
      return;
    }

    try {
      // Always unload previous sound before loading new one (ensures fresh audio for each word)
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {
          // Ignore errors when unloading
        }
        setSound(null);
        setIsPlaying(false);
      }

      // Create and play new sound
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
    } catch (error) {
      setIsPlaying(false);
      setSound(null);
    }
  };

  // Reset sound when word changes (so new audio can play)
  useEffect(() => {
    // Stop and unload previous sound when word changes
    if (sound) {
      sound.stopAsync().catch(() => {});
      sound.unloadAsync().catch(() => {});
      setSound(null);
      setIsPlaying(false);
    }
  }, [currentIndex]); // Reset when index changes

  // Auto-play audio whenever word changes (next/back click or initial load)
  useEffect(() => {
    if (currentWord && getAudioUrl()) {
      // Auto-play after a short delay when word changes
      const timer = setTimeout(() => {
        playAudio();
      }, 300);
      
      return () => clearTimeout(timer); // Cleanup timer if component unmounts or word changes quickly
    }
  }, [currentIndex, currentWord]); // Auto-play when index or word changes

  // Cleanup audio
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
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

  // Responsive styles for loading and error states
  const responsiveErrorStyles = {
    errorText: {
      ...styles.errorText,
      fontSize: responsive.moderateScale(16),
      padding: responsive.wp(5),
    },
    errorSubtext: {
      ...styles.errorSubtext,
      fontSize: responsive.moderateScale(14),
      paddingTop: responsive.hp(1.2),
    },
    loadingText: {
      ...styles.loadingText,
      fontSize: responsive.moderateScale(16),
      marginTop: responsive.hp(2),
    },
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={responsiveErrorStyles.loadingText}>Loading flashcards...</Text>
      </View>
    );
  }

  if (!flashcardData || !currentWord) {
    return (
      <View style={styles.container}>
        <Text style={responsiveErrorStyles.errorText}>No flashcard content available</Text>
        {activityId && (
          <Text style={responsiveErrorStyles.errorSubtext}>
            Activity ID: {activityId}
          </Text>
        )}
      </View>
    );
  }

  const imageUrl = getImageUrl();
  const mainWord = getText(currentWord.word) || '';
  const label = getText(currentWord.label) || '';
  const referenceTitle = getText(currentWord.referenceTitle) || '';

  // Create responsive styles dynamically
  const responsiveStyles = {
    gradient: {
      ...styles.gradient,
      padding: responsive.wp(5),
      paddingBottom: responsive.hp(12),
    },
    flashcardCard: {
      ...styles.flashcardCard,
      borderRadius: responsive.moderateScale(24),
      padding: responsive.wp(6),
      maxWidth: responsive.wp(90),
      marginBottom: responsive.hp(2.5),
      shadowRadius: responsive.moderateScale(8),
      elevation: 5,
    },
    cardHeading: {
      ...styles.cardHeading,
      fontSize: responsive.moderateScale(18),
      marginBottom: responsive.hp(2.5),
    },
    imageContainer: {
      ...styles.imageContainer,
      width: responsive.wp(55),
      height: responsive.wp(55),
      borderRadius: responsive.wp(27.5),
      marginBottom: responsive.hp(2.5),
      borderWidth: responsive.moderateScale(3),
    },
    imagePlaceholder: {
      ...styles.imagePlaceholder,
      width: responsive.wp(55),
      height: responsive.wp(55),
      borderRadius: responsive.wp(27.5),
      marginBottom: responsive.hp(2.5),
      borderWidth: responsive.moderateScale(3),
    },
    cardImage: styles.cardImage,
    cardWord: {
      ...styles.cardWord,
      fontSize: responsive.moderateScale(28),
      marginBottom: responsive.hp(1),
    },
    cardLabel: {
      ...styles.cardLabel,
      fontSize: responsive.moderateScale(16),
      marginBottom: responsive.hp(2.5),
    },
    listenButton: {
      ...styles.listenButton,
      paddingHorizontal: responsive.wp(5),
      paddingVertical: responsive.hp(1.5),
      borderRadius: responsive.moderateScale(20),
    },
    listenButtonText: {
      ...styles.listenButtonText,
      fontSize: responsive.moderateScale(16),
    },
    navigationFooter: {
      ...styles.navigationFooter,
      paddingHorizontal: responsive.wp(5),
      paddingVertical: responsive.hp(2),
      paddingBottom: Math.max(responsive.hp(2.5), responsive.hp(3.5)),
    },
    footerButton: {
      ...styles.footerButton,
      paddingHorizontal: responsive.wp(5),
      paddingVertical: responsive.hp(1.5),
      borderRadius: responsive.moderateScale(20),
    },
    footerButtonText: {
      ...styles.footerButtonText,
      fontSize: responsive.moderateScale(16),
    },
    footerCounter: {
      ...styles.footerCounter,
      fontSize: responsive.moderateScale(18),
      paddingHorizontal: responsive.wp(4),
      paddingVertical: responsive.hp(1),
      borderRadius: responsive.moderateScale(20),
    },
  };

  const iconSize = responsive.moderateScale(24);
  const placeholderIconSize = responsive.moderateScale(60);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E3F2FD', '#BBDEFB', '#90CAF9']}
        style={responsiveStyles.gradient}
      >
        {/* Flashcard Card Design */}
        <View style={responsiveStyles.flashcardCard}>
          {/* Reference Title as Heading (Center) */}
          {referenceTitle && referenceTitle.trim() ? (
            <Text style={responsiveStyles.cardHeading}>{referenceTitle}</Text>
          ) : null}
          
          {/* Image in Center (Circular) */}
          {imageUrl ? (
            <View style={responsiveStyles.imageContainer}>
              <Image
                source={{ uri: imageUrl }}
                style={responsiveStyles.cardImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={responsiveStyles.imagePlaceholder}>
              <MaterialIcons name="image" size={placeholderIconSize} color="#BBDEFB" />
            </View>
          )}

          {/* Word Text */}
          {mainWord && mainWord.trim() ? (
            <Text style={responsiveStyles.cardWord}>{mainWord}</Text>
          ) : null}

          {/* Label (if exists) */}
          {label && label.trim() ? (
            <Text style={responsiveStyles.cardLabel}>{label}</Text>
          ) : null}

          {/* Listen Button */}
          {getAudioUrl() && (
            <TouchableOpacity
              style={responsiveStyles.listenButton}
              onPress={playAudio}
            >
              <MaterialIcons
                name={isPlaying ? "pause-circle-filled" : "volume-up"}
                size={iconSize}
                color="#1976D2"
              />
              <View style={{ width: responsive.wp(2) }} />
              <Text style={responsiveStyles.listenButtonText}>Listen</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Navigation Footer - Fixed at Bottom */}
      <View style={responsiveStyles.navigationFooter}>
        <TouchableOpacity
          style={[responsiveStyles.footerButton, currentIndex === 0 && styles.footerButtonDisabled]}
          onPress={goToPrev}
          disabled={currentIndex === 0}
        >
          <MaterialIcons name="chevron-left" size={iconSize} color={currentIndex === 0 ? "#999" : "#1976D2"} />
          <View style={{ width: responsive.wp(2) }} />
          <Text style={[responsiveStyles.footerButtonText, currentIndex === 0 && styles.footerButtonTextDisabled]}>Back</Text>
        </TouchableOpacity>
        
        <Text style={responsiveStyles.footerCounter}>
          {String(currentIndex + 1)} / {String(flashcardData.words.length)}
        </Text>
        
        <TouchableOpacity
          style={responsiveStyles.footerButton}
          onPress={goToNext}
        >
          <Text style={responsiveStyles.footerButtonText}>Next</Text>
          <View style={{ width: responsive.wp(2) }} />
          <MaterialIcons name="chevron-right" size={iconSize} color="#1976D2" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Flashcard Card Styles - Base styles (responsive values applied in component)
  flashcardCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
  },
  cardHeading: {
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: 'System',
  },
  imageContainer: {
    overflow: 'hidden',
    borderColor: '#E3F2FD',
    backgroundColor: '#F9FAFB',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWord: {
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: 'System',
  },
  cardLabel: {
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
  },
  listenButtonText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  // Navigation Footer Styles - Fixed at Bottom
  navigationFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'transparent',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  footerButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
  footerButtonText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  footerButtonTextDisabled: {
    color: '#9CA3AF',
  },
  footerCounter: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Error & Loading Styles
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  errorSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    paddingTop: 10,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
});

export default Flashcard;

