import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useExerciseScoring } from '../../hooks/useExerciseScoring';
import apiService, { ExerciseDto } from '../../services/api';
import { getText } from '../../utils/translations';
import { useUser } from '../../context/UserContext';

const { width } = Dimensions.get('window');

// --- CONSTANTS ---
const COLORS = {
  primary: '#0284C7',
  secondary: '#0EA5E9',
  success: '#10B981',
  error: '#EF4444',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  disabled: '#CBD5E1',
};

// --- TYPES ---
interface Option {
  id: string;
  text: {
    en: string;
    ta: string;
    si: string;
  };
}

interface Question {
  id: string;
  text: {
    en: string;
    ta: string;
    si: string;
  };
  options: Option[];
  correctOptionId: string;
  explanation?: {
    en: string;
    ta: string;
    si: string;
  };
}

interface MCQData {
  instruction?: {
    en: string;
    ta: string;
    si: string;
  };
  questions: Question[];
}

interface ActivityComponentProps {
  activityId?: number;
  currentLang: string;
  onComplete: () => void;
  exerciseId?: number;
}

const MCQActivity: React.FC<ActivityComponentProps> = ({
  activityId,
  currentLang,
  onComplete,
  exerciseId,
}) => {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [instruction, setInstruction] = useState('');
  const [questionData, setQuestionData] = useState<Question | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'correct' | 'wrong'>('idle');
  const [showModal, setShowModal] = useState(false);
  const [totalExercises, setTotalExercises] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [attemptCount, setAttemptCount] = useState(1);
  
  // --- HOOKS ---
  const { submitExerciseAttempt, isSubmitting } = useExerciseScoring();
  const { currentUser } = useUser();
  
  // --- REFS ---
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<LottieView>(null);
  const happyBoyRef = useRef<LottieView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        console.error('Error fetching MCQ data:', error);
        Alert.alert('Error', 'Failed to load exercise. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Start timer
    timerRef.current = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activityId, currentExerciseIndex]);

  // --- 2. OPTION SELECTION ---
  const handleSelectOption = (index: number) => {
    if (status !== 'idle') return;
    setSelectedOptionIndex(index);
  };

  // --- 3. CHECK ANSWER ---
  const checkAnswer = async () => {
    if (selectedOptionIndex === null || !questionData) return;
    
    setStatus('checking');
    
    // Simple animation
    // In a real app, you might want to add more sophisticated animations
    
    // Check if answer is correct
    const selectedOption = questionData.options[selectedOptionIndex];
    const isCorrect = selectedOption.id === questionData.correctOptionId;
    
    // Set status and show modal
    setStatus(isCorrect ? 'correct' : 'wrong');
    setShowModal(true);
    
    // Play appropriate animation
    setTimeout(() => {
      if (isCorrect) {
        confettiRef.current?.play();
        happyBoyRef.current?.play();
      }
    }, 100);
    
    // For correct answers, submit the score
    if (isCorrect && exerciseId) {
      // Calculate score based on performance
      // This is a simple example - you might want to make this more sophisticated
      const timeBonus = Math.max(0, 10 - Math.floor(timeSpent / 10)); // Up to 10 points for speed
      const attemptPenalty = Math.max(0, attemptCount - 1) * 2; // 2 points penalty per attempt after first
      const baseScore = 10;
      const finalScore = Math.max(0, baseScore + timeBonus - attemptPenalty);
      
      try {
        await submitExerciseAttempt({
          exerciseId,
          userId: currentUser?.id,
          score: finalScore,
          timeSpent,
          attemptCount,
        });
      } catch (error) {
        console.error('Error submitting exercise attempt:', error);
        Alert.alert('Error', 'Failed to submit your score. Please try again.');
      }
    }
  };

  // --- 4. MODAL ACTIONS ---
  const handleModalAction = () => {
    setShowModal(false);
    if (status === 'correct') {
      onComplete();
    } else {
      setSelectedOptionIndex(null);
      setStatus('idle');
      setAttemptCount(prev => prev + 1);
    }
  };

  // --- 5. RENDERERS ---
  const renderQuestionContent = () => {
    if (!questionData) return null;
    return <Text style={styles.questionText}>{getText(questionData.text)}</Text>;
  };

  const renderOptionItem = (option: Option, index: number) => {
    const isSelected = selectedOptionIndex === index;
    // Highlight immediately if selected
    let borderColor = COLORS.border;
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

    return (
      <TouchableOpacity
        key={index}
        activeOpacity={0.9}
        style={[
          styles.optionCard, 
          { borderColor, backgroundColor: bgColor, borderWidth: isSelected ? 3 : 1 }
        ]}
        onPress={() => handleSelectOption(index)}
      >
        <View style={styles.optionContentWrapper}>
          <Text style={[styles.optionText, isSelected && { fontWeight: 'bold' }]}>
            {getText(option.text)}
          </Text>
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
            renderOptionItem(opt, i)
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.checkButton,
            status === 'idle' && { backgroundColor: COLORS.primary },
            status === 'checking' && { backgroundColor: COLORS.disabled },
            status === 'correct' && { backgroundColor: COLORS.success },
            status === 'wrong' && { backgroundColor: COLORS.error },
          ]}
          onPress={checkAnswer}
          disabled={status !== 'idle'}
        >
          <Text style={styles.checkButtonText}>
            {status === 'idle' && 'Check Answer'}
            {status === 'checking' && 'Checking...'}
            {status === 'correct' && 'Correct!'}
            {status === 'wrong' && 'Wrong!'}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* --- FULL SCREEN CONFETTI OVERLAY (For non-last exercises) --- */}
      {status === 'correct' && (
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
  checkButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 5,
  },
  checkButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
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
    height: '100%',
  },
});

export default MCQActivity;