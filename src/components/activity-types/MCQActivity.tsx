import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { ActivityComponentProps, MultiLingualText } from './types';
import { useResponsive } from '../../utils/responsive';
import { getCloudFrontUrl, getImageUrl as getImageUrlHelper } from '../../utils/awsUrlHelper';
import apiService from '../../services/api';

const { width } = Dimensions.get('window');

// --- THEME COLORS ---
const COLORS = {
  bg: '#E3F2FD',
  card: '#FFFFFF',
  primary: '#1565C0',
  accent: '#FFCA28',
  success: '#4CAF50',
  error: '#F44336',
  text: '#37474F',
  optionBorder: '#BBDEFB',
};

// --- INTERFACES MATCHING YOUR JSON ---
interface QuestionItem {
  type: 'text' | 'image' | 'audio';
  content: MultiLingualText;
}

interface Option {
  content: MultiLingualText;
  isCorrect: boolean;
}

interface QuestionObj {
  questionId: string;
  question: QuestionItem;
  answerType: 'text' | 'image' | 'audio';
  options: Option[];
}

interface MCQData {
  title: MultiLingualText;
  instruction: MultiLingualText;
  questions: QuestionObj[];
}

const MCQActivity: React.FC<ActivityComponentProps> = ({
  currentLang = 'ta',
  activityId,
  onComplete,
  currentExerciseIndex = 0,
  onExerciseComplete,
}) => {
  const responsive = useResponsive();
  
  const [loading, setLoading] = useState(true);
  const [questionData, setQuestionData] = useState<QuestionObj | null>(null);
  const [instruction, setInstruction] = useState<string>('');
  
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  // Animation for feedback
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      if (!activityId) return;
      
      try {
        setLoading(true);
        const exercises = await apiService.getExercisesByActivityId(activityId);
        
        if (exercises && exercises.length > 0) {
          const sorted = exercises.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
          const currentExercise = sorted[currentExerciseIndex];

          if (currentExercise && currentExercise.jsonData) {
            const parsed: MCQData = JSON.parse(currentExercise.jsonData);
            
            // Set Instruction
            setInstruction(getText(parsed.instruction));

            // Extract the question (Assuming 1 question per exercise step for simplicity)
            if (parsed.questions && parsed.questions.length > 0) {
              setQuestionData(parsed.questions[0]);
            }
          }
        }
      } catch (error) {
        console.error("MCQ Load Error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Cleanup Sound
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [activityId, currentExerciseIndex]);

  // --- 2. HELPER FUNCTIONS ---
  
  const getText = (obj: MultiLingualText | undefined): string => {
    if (!obj) return '';
    // @ts-ignore
    return obj[currentLang] || obj.en || obj.ta || '';
  };

  const getMediaUrl = (obj: MultiLingualText | undefined | { [key: string]: any }): string | null => {
    if (!obj) return null;
    
    // Use the robust getImageUrlHelper function that handles multilingual objects properly
    try {
      const url = getImageUrlHelper(obj, currentLang as 'en' | 'ta' | 'si');
      if (url) {
        console.log('MCQ Image URL resolved:', url);
        return url;
      }
    } catch (error) {
      console.error('MCQ Image URL resolution error:', error);
    }
    
    // Fallback: try direct text extraction
    const pathFromText = getText(obj as MultiLingualText | undefined);
    if (pathFromText && (pathFromText.includes('/') || pathFromText.includes('.'))) {
      const fallbackUrl = pathFromText.startsWith('http') ? pathFromText : getCloudFrontUrl(pathFromText);
      console.log('MCQ Image URL fallback:', fallbackUrl);
      return fallbackUrl;
    }

    console.warn('MCQ Image URL not found for:', obj);
    return null;
  };

  const playSound = async (url: string) => {
    try {
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: url });
      setSound(newSound);
      await newSound.playAsync();
    } catch (err) {
      console.log("Audio Error", err);
    }
  };

  // --- 3. HANDLERS ---

  const handleSelect = (index: number) => {
    if (status === 'correct') return; // Prevent changing if already correct
    setSelectedOptionIndex(index);
    setStatus('idle'); // Reset status on new selection
  };

  const handleCheck = () => {
    if (selectedOptionIndex === null || !questionData) return;

    const isCorrect = questionData.options[selectedOptionIndex].isCorrect;

    if (isCorrect) {
      setStatus('correct');
      // Success Animation
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
      ]).start();

      // Navigate after delay
      setTimeout(() => {
        if (onExerciseComplete) onExerciseComplete();
        else if (onComplete) onComplete();
      }, 1500);
    } else {
      setStatus('wrong');
      // Simple shake or vibration could go here
    }
  };

  // --- 4. RENDERERS ---

  const renderQuestionContent = () => {
    if (!questionData) return null;
    const { type, content } = questionData.question;
    const mediaUrl = getMediaUrl(content);

    switch (type) {
      case 'image':
        return mediaUrl ? (
          <View style={styles.questionImageContainer}>
            <Image 
              source={{ uri: mediaUrl }} 
              style={styles.questionImage} 
              resizeMode="contain"
              onError={(error) => {
                console.error('MCQ Question Image Error:', error.nativeEvent.error, 'URL:', mediaUrl);
              }}
              onLoad={() => {
                console.log('MCQ Question Image Loaded:', mediaUrl);
              }}
            />
          </View>
        ) : (
          <View style={styles.questionImageContainer}>
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="broken-image" size={40} color="#B0BEC5" />
              <Text style={styles.imageErrorText}>Image not available</Text>
            </View>
          </View>
        );
      
      case 'audio':
        return (
          <TouchableOpacity 
            style={styles.bigAudioButton} 
            onPress={() => mediaUrl && playSound(mediaUrl)}
          >
            <MaterialIcons name="volume-up" size={40} color="#FFF" />
            <Text style={styles.audioText}>Listen to Question</Text>
          </TouchableOpacity>
        );

      case 'text':
      default:
        return (
          <Text style={styles.questionText}>
            {getText(content)}
          </Text>
        );
    }
  };

  const renderOptionItem = (option: Option, index: number, answerType: string) => {
    const isSelected = selectedOptionIndex === index;
    let borderColor = COLORS.optionBorder;
    let bgColor = COLORS.card;
    let icon = null;

    if (isSelected) {
      if (status === 'idle') {
        borderColor = COLORS.primary;
        bgColor = '#E3F2FD';
      } else if (status === 'correct') {
        borderColor = COLORS.success;
        bgColor = '#E8F5E9';
        icon = <MaterialIcons name="check-circle" size={24} color={COLORS.success} />;
      } else if (status === 'wrong') {
        borderColor = COLORS.error;
        bgColor = '#FFEBEE';
        icon = <MaterialIcons name="cancel" size={24} color={COLORS.error} />;
      }
    }

    const mediaUrl = getMediaUrl(option.content);

    return (
      <TouchableOpacity
        key={index}
        activeOpacity={0.8}
        style={[
          styles.optionCard, 
          { borderColor, backgroundColor: bgColor, borderWidth: isSelected ? 3 : 1 }
        ]}
        onPress={() => handleSelect(index)}
      >
        {/* Render Option Content based on Answer Type */}
        <View style={styles.optionContentWrapper}>
          {answerType === 'image' && mediaUrl ? (
            <Image 
              source={{ uri: mediaUrl }} 
              style={styles.optionImage} 
              resizeMode="contain"
              onError={(error) => {
                console.error('MCQ Option Image Error:', error.nativeEvent.error, 'URL:', mediaUrl);
              }}
              onLoad={() => {
                console.log('MCQ Option Image Loaded:', mediaUrl);
              }}
            />
          ) : answerType === 'image' && !mediaUrl ? (
            <View style={styles.optionImagePlaceholder}>
              <MaterialIcons name="image" size={24} color="#B0BEC5" />
            </View>
          ) : answerType === 'audio' ? (
            <View style={styles.optionAudioRow}>
               <TouchableOpacity 
                 style={styles.miniPlayBtn} 
                 onPress={() => mediaUrl && playSound(mediaUrl)}
               >
                 <MaterialIcons name="play-arrow" size={24} color="#FFF" />
               </TouchableOpacity>
               <Text style={styles.optionTextLabel}>Option {index + 1}</Text>
            </View>
          ) : (
            <Text style={[styles.optionText, isSelected && { fontWeight: 'bold', color: COLORS.primary }]}>
              {getText(option.content)}
            </Text>
          )}
        </View>

        {/* Selection/Status Indicator */}
        {icon || (isSelected && <View style={styles.radioSelected} />) || <View style={styles.radioUnselected} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!questionData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No Question Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* --- INSTRUCTION --- */}
        {instruction ? (
          <View style={styles.instructionBadge}>
            <MaterialIcons name="lightbulb-outline" size={18} color="#F57C00" />
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>
        ) : null}

        {/* --- QUESTION AREA --- */}
        <View style={styles.questionContainer}>
          {renderQuestionContent()}
        </View>

        {/* --- OPTIONS GRID --- */}
        <View style={styles.optionsContainer}>
          {questionData.options.map((opt, i) => 
            renderOptionItem(opt, i, questionData.answerType)
          )}
        </View>

      </ScrollView>

      {/* --- FOOTER ACTIONS --- */}
      <View style={styles.footer}>
        {status === 'wrong' && (
          <View style={styles.feedbackContainer}>
            <LottieView
              source={require('../../../assets/animations/Paul R. Bear Fail.json')} // Ensure you have this or remove
              autoPlay loop={false}
              style={{ width: 60, height: 60 }}
            />
            <Text style={styles.feedbackText}>Oops! Try again.</Text>
          </View>
        )}

        {status === 'correct' && (
          <View style={styles.feedbackContainer}>
             <LottieView
              source={require('../../../assets/animations/Confetti.json')}
              autoPlay loop={false}
              style={{ width: 80, height: 80, position: 'absolute', top: -40 }}
            />
            <Text style={[styles.feedbackText, { color: COLORS.success }]}>Great Job!</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.checkButton,
            selectedOptionIndex === null ? styles.checkButtonDisabled : {}
          ]}
          onPress={handleCheck}
          disabled={selectedOptionIndex === null || status === 'correct'}
        >
          <Text style={styles.checkButtonText}>
            {status === 'correct' ? 'Correct!' : status === 'wrong' ? 'Try Again' : 'Check Answer'}
          </Text>
          <Feather name="arrow-right" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for footer
  },
  
  // Instruction
  instructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  instructionText: {
    marginLeft: 8,
    color: '#F57C00',
    fontWeight: '600',
    fontSize: 14,
  },

  // Question
  questionContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    // 3D Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  questionImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 15,
    overflow: 'hidden',
  },
  questionImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
  },
  imageErrorText: {
    marginTop: 8,
    color: '#B0BEC5',
    fontSize: 14,
  },
  bigAudioButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 5,
  },
  audioText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
  },

  // Options
  optionsContainer: {
    gap: 15,
  },
  optionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  optionContentWrapper: {
    flex: 1,
    marginRight: 10,
  },
  optionText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionTextLabel: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 10,
  },
  optionImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  optionImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionAudioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Radios
  radioUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CFD8DC',
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 6,
    borderColor: COLORS.primary,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  checkButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  checkButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  checkButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
    marginLeft: 5,
  },
  errorText: {
    color: '#B0BEC5',
    fontSize: 16,
  }
});

export default MCQActivity;