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
  Modal, // Added Modal
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { ActivityComponentProps, MultiLingualText } from './types';
import { useResponsive } from '../../utils/responsive';
import { getCloudFrontUrl, getImageUrl as getImageUrlHelper } from '../../utils/awsUrlHelper';
import apiService from '../../services/api';

const { width, height } = Dimensions.get('window');

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

// --- INTERFACES ---
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
  const [totalExercises, setTotalExercises] = useState(0);
  
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [congratulationSound, setCongratulationSound] = useState<Audio.Sound | null>(null);
  const [sadSound, setSadSound] = useState<Audio.Sound | null>(null);
  const [correctSound, setCorrectSound] = useState<Audio.Sound | null>(null);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showConfettiOverlay, setShowConfettiOverlay] = useState(false);

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<LottieView>(null);
  const happyBoyRef = useRef<LottieView>(null);

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      if (!activityId) return;
      
      try {
        setLoading(true);
        // Reset state when exercise changes
        setSelectedOptionIndex(null);
        setStatus('idle');
        setShowModal(false);
        setShowConfettiOverlay(false);
        
        const exercises = await apiService.getExercisesByActivityId(activityId);
        
        if (exercises && exercises.length > 0) {
          const sorted = exercises.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
          setTotalExercises(sorted.length);
          const currentExercise = sorted[currentExerciseIndex];

          if (currentExercise && currentExercise.jsonData) {
            const parsed: MCQData = JSON.parse(currentExercise.jsonData);
            setInstruction(getText(parsed.instruction));

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
    
    // Cleanup sounds
    return () => {
      if (sound) sound.unloadAsync();
      if (congratulationSound) congratulationSound.unloadAsync();
      if (sadSound) sadSound.unloadAsync();
      if (correctSound) correctSound.unloadAsync();
    };
  }, [activityId, currentExerciseIndex]);

  // --- Modal Animation Effect ---
  useEffect(() => {
    if (showModal) {
      modalScaleAnim.setValue(0);
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true
      }).start();
    }
  }, [showModal]);

  // --- 2. HELPER FUNCTIONS ---
  
  const getText = (obj: MultiLingualText | undefined): string => {
    if (!obj) return '';
    // @ts-ignore
    return obj[currentLang] || obj.en || obj.ta || '';
  };

  const getMediaUrl = (obj: MultiLingualText | undefined | { [key: string]: any }): string | null => {
    if (!obj) return null;
    try {
      const url = getImageUrlHelper(obj, currentLang as 'en' | 'ta' | 'si');
      if (url) return url;
    } catch (error) {
      console.error('MCQ Image URL resolution error:', error);
    }
    const pathFromText = getText(obj as MultiLingualText | undefined);
    if (pathFromText && (pathFromText.includes('/') || pathFromText.includes('.'))) {
      return pathFromText.startsWith('http') ? pathFromText : getCloudFrontUrl(pathFromText);
    }
    return null;
  };

  const playSound = async (url: string) => {
    try {
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: url });
      setSound(newSound);
      await newSound.playAsync();
    } catch (err) {}
  };

  const playCongratulationSound = async () => {
    try {
      // Stop and unload previous sound if exists
      if (congratulationSound) {
        await congratulationSound.unloadAsync();
      }
      
      // Load and play congratulation sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/congratulation.wav')
      );
      setCongratulationSound(newSound);
      await newSound.playAsync();
      
      // Clean up after sound finishes
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync();
          setCongratulationSound(null);
        }
      });
    } catch (err) {}
  };

  const playSadSound = async () => {
    try {
      // Stop and unload previous sound if exists
      if (sadSound) {
        await sadSound.unloadAsync();
      }
      
      // Load and play sad sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/sad.wav')
      );
      setSadSound(newSound);
      await newSound.playAsync();
      
      // Clean up after sound finishes
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync();
          setSadSound(null);
        }
      });
    } catch (err) {}
  };

  const playCorrectSound = async () => {
    try {
      // Stop and unload previous sound if exists
      if (correctSound) {
        await correctSound.unloadAsync();
      }
      
      // Load and play correct sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/correct.wav')
      );
      setCorrectSound(newSound);
      await newSound.playAsync();
      
      // Clean up after sound finishes
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync();
          setCorrectSound(null);
        }
      });
    } catch (err) {}
  };

  // --- 3. HANDLERS ---

  const handleSelect = (index: number) => {
    // If modal is already open or already correct, ignore clicks
    if (showModal || showConfettiOverlay || status === 'correct') return;
    if (!questionData) return;
    
    setSelectedOptionIndex(index);
    
    const isCorrect = questionData.options[index].isCorrect;
    const isLastExercise = currentExerciseIndex >= totalExercises - 1;
    
    if (isCorrect) {
      setStatus('correct');
      // Play congratulation sound
      playCongratulationSound();
      
      // Click Animation
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
      ]).start();

      if (isLastExercise) {
        // Last exercise: Show Happy Boy animation in popup modal
        setShowModal(true);
        if (happyBoyRef.current) {
          happyBoyRef.current.play();
        }
        // Auto exit after animation finishes (approximately 3-4 seconds)
        setTimeout(() => {
          setShowModal(false);
          if (onComplete) onComplete();
        }, 3500);
      } else {
        // Not last exercise: Show Confetti full screen transparent overlay
        playCorrectSound();
        setShowConfettiOverlay(true);
        if (confettiRef.current) {
          confettiRef.current.play();
        }
        // Auto move to next exercise after animation
        setTimeout(() => {
          setShowConfettiOverlay(false);
          if (onExerciseComplete) onExerciseComplete();
        }, 2500);
      }
    } else {
      setStatus('wrong');
      // Play sad sound for wrong answer
      playSadSound();
      // Wrong answer: Show modal with Sad animation
      setShowModal(true);
    }
  };

  const handleModalAction = () => {
    // Close modal first
    setShowModal(false);

    if (status === 'correct') {
      // Last exercise completed, exit
      if (onComplete) onComplete();
    } else {
      // Reset selection so they can try again
      setSelectedOptionIndex(null);
      setStatus('idle');
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
            <Image source={{ uri: mediaUrl }} style={styles.questionImage} resizeMode="contain" />
          </View>
        ) : null;
      case 'audio':
        return (
          <TouchableOpacity style={styles.bigAudioButton} onPress={() => mediaUrl && playSound(mediaUrl)}>
            <MaterialIcons name="volume-up" size={40} color="#FFF" />
            <Text style={styles.audioText}>Listen</Text>
          </TouchableOpacity>
        );
      case 'text':
      default:
        return <Text style={styles.questionText}>{getText(content)}</Text>;
    }
  };

  const renderOptionItem = (option: Option, index: number, answerType: string) => {
    const isSelected = selectedOptionIndex === index;
    // Highlight immediately if selected
    let borderColor = COLORS.optionBorder;
    let bgColor = COLORS.card;

    if (isSelected) {
      if (status === 'correct') {
        borderColor = COLORS.success;
        bgColor = '#E8F5E9';
      } else if (status === 'wrong') {
        borderColor = COLORS.error;
        bgColor = '#FFEBEE';
      } else {
        borderColor = COLORS.primary; // While processing
      }
    }

    const mediaUrl = getMediaUrl(option.content);

    return (
      <TouchableOpacity
        key={index}
        activeOpacity={0.9}
        style={[
          styles.optionCard, 
          { borderColor, backgroundColor: bgColor, borderWidth: isSelected ? 3 : 1 }
        ]}
        onPress={() => handleSelect(index)}
      >
        <View style={styles.optionContentWrapper}>
          {answerType === 'image' && mediaUrl ? (
            <Image source={{ uri: mediaUrl }} style={styles.optionImage} resizeMode="contain" />
          ) : answerType === 'audio' ? (
            <View style={styles.optionAudioRow}>
               <TouchableOpacity style={styles.miniPlayBtn} onPress={() => mediaUrl && playSound(mediaUrl)}>
                 <MaterialIcons name="play-arrow" size={24} color="#FFF" />
               </TouchableOpacity>
               <Text style={styles.optionTextLabel}>Option {index + 1}</Text>
            </View>
          ) : (
            <Text style={[styles.optionText, isSelected && { fontWeight: 'bold' }]}>
              {getText(option.content)}
            </Text>
          )}
        </View>
        
        {/* Simple radio circle */}
        {isSelected ? (
           status === 'correct' ? <MaterialIcons name="check-circle" size={24} color={COLORS.success} /> :
           status === 'wrong' ? <MaterialIcons name="cancel" size={24} color={COLORS.error} /> :
           <View style={styles.radioSelected} />
        ) : (
           <View style={styles.radioUnselected} />
        )}
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {instruction ? (
          <View style={styles.instructionBadge}>
            <MaterialIcons name="lightbulb-outline" size={18} color="#F57C00" />
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>
        ) : null}

        <View style={styles.questionContainer}>
          {renderQuestionContent()}
        </View>

        <View style={styles.optionsContainer}>
          {questionData?.options.map((opt, i) => 
            renderOptionItem(opt, i, questionData.answerType)
          )}
        </View>

      </ScrollView>

      {/* --- FULL SCREEN CONFETTI OVERLAY (For non-last exercises) --- */}
      {showConfettiOverlay && (
        <View style={styles.confettiOverlay} pointerEvents="none">
          <LottieView
            ref={confettiRef}
            source={require('../../../assets/animations/Confetti.json')}
            autoPlay={true}
            loop={false}
            style={styles.confettiFullScreen}
          />
        </View>
      )}

      {/* --- POPUP MODAL (For last exercise correct or wrong answers) --- */}
      <Modal
        transparent
        visible={showModal}
        animationType="none"
        onRequestClose={() => {}} // Prevent hardware back button closing it unexpectedly
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: modalScaleAnim }] }]}>
            
            {/* Animation Icon */}
            <View style={styles.modalIconContainer}>
              {status === 'correct' ? (
                 <LottieView
                  ref={happyBoyRef}
                  source={require('../../../assets/animations/Happy boy.json')}
                  autoPlay={false}
                  loop={false}
                  style={styles.modalLottie}
                />
              ) : (
                <LottieView
                  source={require('../../../assets/animations/Sad - Failed.json')}
                  autoPlay
                  loop={false}
                  style={styles.modalLottie}
                />
              )}
            </View>

            {/* Title & Message */}
            <Text style={[styles.modalTitle, { color: status === 'correct' ? COLORS.success : COLORS.error }]}>
              {status === 'correct' ? 'Congratulations!' : 'Oops!'}
            </Text>
            <Text style={styles.modalMessage}>
              {status === 'correct' ? 'You completed all exercises!' : 'That answer is incorrect.'}
            </Text>

            {/* Action Button - Show Try Again for wrong answers */}
            {status === 'wrong' && (
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
                  onPress={handleModalAction}
                >
                  <Text style={styles.modalButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

          </Animated.View>
        </View>
      </Modal>

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
    paddingBottom: 50,
  },
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
    flex: 1,
  },
  questionContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
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

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
  },
  modalIconContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalLottie: {
    width: 120,
    height: 120,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalButtonsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 3,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Full screen confetti overlay
  confettiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confettiFullScreen: {
    width: width,
    height: height,
  },
});

export default MCQActivity;