import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityComponentProps, Language, MultiLingualText } from './types'; // Ensure types exist
import { useResponsive } from '../../utils/responsive';
import { useTheme } from '../../theme/ThemeContext';
import { getCloudFrontUrl } from '../../utils/awsUrlHelper';
import apiService from '../../services/api';

const { width } = Dimensions.get('window');

// --- KID FRIENDLY THEME CONSTANTS ---
const CARD_BG = '#FFFFFF';
const BORDER_COLOR = '#E0F7FA';
const PRIMARY_COLOR = '#4FACFE'; // Sky Blue
const ACCENT_COLOR = '#FFB75E'; // Golden Yellow
const TEXT_COLOR = '#2C3E50';

interface FlashcardWord {
  id: string;
  label?: MultiLingualText | null;
  referenceTitle?: MultiLingualText | null;
  imageUrl?: any | null; // Typed loosely to handle various backend responses
  word: MultiLingualText;
  audioUrl: MultiLingualText;
}

const Flashcard: React.FC<ActivityComponentProps> = ({ 
  currentLang = 'ta',
  activityId,
  currentExerciseIndex = 0,
}) => {
  const responsive = useResponsive();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentData, setCurrentData] = useState<FlashcardWord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Animation ref for the card pop effect
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // 1. Fetch Data specific to the Current Exercise Index
  useEffect(() => {
    const fetchExerciseData = async () => {
      if (!activityId) return;
      
      try {
        setLoading(true);
        // Reset animation
        scaleAnim.setValue(0.9);

        const exercises = await apiService.getExercisesByActivityId(activityId);
        
        if (exercises && exercises.length > 0) {
          const sortedExercises = exercises.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
          // Get the specific exercise based on the Parent's progress index
          const targetExercise = sortedExercises[currentExerciseIndex];

          if (targetExercise && targetExercise.jsonData) {
            const parsed = JSON.parse(targetExercise.jsonData);
            
            // Normalize data: Handle various JSON structures from backend
            let wordData: FlashcardWord | null = null;

            if (parsed.word && (parsed.word.en || parsed.word.ta)) {
               wordData = parsed;
            } else if (parsed.words && Array.isArray(parsed.words) && parsed.words.length > 0) {
               wordData = parsed.words[0]; // Take first word if array
            } else if (parsed.id || parsed.word) {
               wordData = parsed;
            }

            setCurrentData(wordData);
          }
        }
      } catch (error) {
        console.error("Error fetching flashcard:", error);
      } finally {
        setLoading(false);
        // Play pop animation when loaded
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }
    };

    fetchExerciseData();
  }, [activityId, currentExerciseIndex]);

  // 2. Audio Handling
  const getAudioUrl = (): string | null => {
    if (!currentData?.audioUrl) return null;
    // @ts-ignore
    const path = currentData.audioUrl[currentLang] || currentData.audioUrl.en || currentData.audioUrl.ta;
    return path ? getCloudFrontUrl(path) : null;
  };

  const playAudio = async () => {
    const uri = getAudioUrl();
    if (!uri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      setIsPlaying(false);
    }
  };

  // Auto-play audio when data loads (optional, nice for kids)
  useEffect(() => {
    if (currentData && !loading) {
      setTimeout(() => playAudio(), 400);
    }
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [currentData, loading]);


  // 3. Render Helpers
  const getImageUrl = (): string | null => {
    if (!currentData?.imageUrl) return null;
    // @ts-ignore
    const path = currentData.imageUrl[currentLang] || currentData.imageUrl.default || currentData.imageUrl.en;
    return path ? getCloudFrontUrl(path) : null;
  };

  const getText = (obj: MultiLingualText | undefined | null): string => {
    if (!obj) return '';
    // @ts-ignore
    return obj[currentLang] || obj.en || obj.ta || '';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!currentData) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="broken-image" size={50} color="#BDC3C7" />
        <Text style={styles.errorText}>No card found!</Text>
      </View>
    );
  }

  const imageUrl = getImageUrl();
  const mainWord = getText(currentData.word);
  const secondaryLabel = getText(currentData.label);
  const refTitle = getText(currentData.referenceTitle);

  return (
    <View style={styles.container}>
      {/* 
        Note: No ScrollView here. 
        We rely on the Parent Screen to handle scrolling or safe areas.
        This component fills the "Center Content" area.
      */}
      
      {/* --- Reference Title (Top - Outside Card) --- */}
      {refTitle ? (
        <View style={styles.referenceTitleContainer}>
          <Text style={styles.referenceTitleText}>{refTitle}</Text>
        </View>
      ) : null}

      <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>

        {/* --- Image Area --- */}
        <View style={styles.imageWrapper}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.mainImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialCommunityIcons name="image-outline" size={60} color="#E0F7FA" />
            </View>
          )}
        </View>

        {/* --- Word Area --- */}
        <View style={styles.textWrapper}>
          <Text style={styles.mainWord}>{mainWord}</Text>
          {secondaryLabel ? (
            <Text style={styles.subWord}>{secondaryLabel}</Text>
          ) : null}
        </View>

        {/* --- Audio Interaction --- */}
        <TouchableOpacity 
          style={[styles.audioButton, isPlaying && styles.audioButtonPlaying]} 
          onPress={playAudio}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name={isPlaying ? "volume-up" : "volume-up"} 
            size={32} 
            color="#FFF" 
          />
          <Text style={styles.audioText}>
            {isPlaying ? "Playing..." : "Listen"}
          </Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // --- CARD DESIGN ---
  cardContainer: {
    backgroundColor: CARD_BG,
    width: '100%',
    maxWidth: 350,
    borderRadius: 30,
    padding: 20,
    alignItems: 'center',
    // 3D Shadow Effect
    shadowColor: "#4FACFE",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderBottomWidth: 6,
    borderBottomColor: '#E1F5FE',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  // Reference Title (Top - Outside Card)
  referenceTitleContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#E1F5FE',
  },
  referenceTitleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    textAlign: 'center',
  },

  // Badge
  badgeContainer: {
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 20,
  },
  badgeText: {
    color: '#0288D1',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
  },

  // Image
  imageWrapper: {
    width: 220,               // கொஞ்சம் பெரிதாக்கியுள்ளேன்
    height: 220,
    borderRadius: 110,        // width-ல் பாதி (Perfect Circle)
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 5,
    borderColor: '#E1F5FE',
    overflow: 'hidden',       
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Text
  textWrapper: {
    alignItems: 'center',
    marginBottom: 25,
  },
  mainWord: {
    fontSize: 32,
    fontWeight: '900', // Heavy font for kids
    color: TEXT_COLOR,
    textAlign: 'center',
    marginBottom: 5,
  },
  subWord: {
    fontSize: 18,
    color: '#95A5A6',
    fontWeight: '500',
  },

  // Audio Button
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 50,
    gap: 10,
    // Button Shadow
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  audioButtonPlaying: {
    backgroundColor: ACCENT_COLOR, // Changes color when playing
    transform: [{ scale: 1.05 }],
  },
  audioText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Loading/Error
  loadingText: {
    marginTop: 10,
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 10,
    color: '#95A5A6',
    fontSize: 16,
  },
});

export default Flashcard;