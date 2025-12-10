import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { ActivityComponentProps, Language, MultiLingualText } from './types';
import { useResponsive } from '../../utils/responsive';
import { useTheme } from '../../theme/ThemeContext';
import apiService from '../../services/api';
import { getCloudFrontUrl } from '../../utils/awsUrlHelper';

type SegmentType = 'TEXT' | 'BLANK';

interface Segment {
  id?: string;
  type: SegmentType;
  content: MultiLingualText;
  hint?: MultiLingualText;
  status?: 'correct' | 'incorrect' | 'default';
  userAnswer?: string;
}

interface Question {
  sentenceId: string;
  mediaUrl?: { default: string };
  segments: Segment[];
  options: MultiLingualText[];
}

interface FillInTheBlanksContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  questions: Question[];
}

const FillInTheBlanks: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
  activityId,
  currentExerciseIndex = 0,
  onExerciseComplete,
  onExit,
}) => {
  const responsive = useResponsive();
  const { theme } = useTheme();
  const [allExercises, setAllExercises] = useState<FillInTheBlanksContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [options, setOptions] = useState<{ word: string; available: boolean }[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showErrorAnimation, setShowErrorAnimation] = useState(false);
  const [exerciseResult, setExerciseResult] = useState<'correct' | 'wrong' | null>(null);
  const successAnimationRef = useRef<LottieView>(null);
  const errorAnimationRef = useRef<LottieView>(null);

  // Get current exercise data
  const fillData = allExercises[currentExerciseIndex] || (content as FillInTheBlanksContent);
  const currentQuestion = fillData?.questions?.[0];

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    const result = text[currentLang] || text.en || text.ta || text.si || '';
    return typeof result === 'string' ? result : String(result || '');
  };

  // Get image URL from mediaUrl
  const getImageUrl = (): string | null => {
    if (!currentQuestion?.mediaUrl?.default) return null;
    const imagePath = currentQuestion.mediaUrl.default;
    return getCloudFrontUrl(imagePath);
  };

  // Fetch all exercises for the activity
  useEffect(() => {
    const fetchExercises = async () => {
      if (!activityId) {
        // If no activityId, use content prop (backward compatibility)
        if (content) {
          setAllExercises([content as FillInTheBlanksContent]);
        }
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const exercises = await apiService.getExercisesByActivityId(activityId);

        if (!exercises || exercises.length === 0) {
          setLoading(false);
          return;
        }

        const sortedExercises = exercises.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        const exerciseContents: FillInTheBlanksContent[] = [];

        sortedExercises.forEach((exercise) => {
          try {
            if (exercise.jsonData) {
              const parsedData = JSON.parse(exercise.jsonData);
              
              // Parse FillInTheBlanksContent structure
              const title: MultiLingualText = parsedData.title || { ta: '', en: '', si: '' };
              const instruction: MultiLingualText = parsedData.instruction || { ta: '', en: '', si: '' };
              const questions: Question[] = [];

              // Helper function to filter segments with empty content
              // Only include segments that have content for the current learning language
              const filterValidSegments = (segments: any[]): any[] => {
                const filtered = segments.filter((seg: any) => {
                  if (!seg || !seg.content) return false;
                  
                  // Check if current learning language has content
                  const currentLangContent = seg.content[currentLang]?.trim();
                  // Only include segment if it has content for the current learning language
                  if (!currentLangContent || currentLangContent.length === 0) {
                    return false;
                  }
                  
                  return true;
                });
                return filtered;
              };

              // Handle questions array or single question
              if (parsedData.questions && Array.isArray(parsedData.questions)) {
                // Validate and normalize each question
                parsedData.questions.forEach((q: any) => {
                  if (q && Array.isArray(q.segments) && Array.isArray(q.options)) {
                    const validSegments = filterValidSegments(q.segments);
                    if (validSegments.length > 0) {
                      questions.push({
                        sentenceId: q.sentenceId || `exercise-${exercise.id}`,
                        mediaUrl: q.mediaUrl,
                        segments: validSegments,
                        options: q.options,
                      });
                    }
                  }
                });
              } else if (parsedData.question) {
                const q = parsedData.question;
                if (q && Array.isArray(q.segments) && Array.isArray(q.options)) {
                  const validSegments = filterValidSegments(q.segments);
                  if (validSegments.length > 0) {
                    questions.push({
                      sentenceId: q.sentenceId || `exercise-${exercise.id}`,
                      mediaUrl: q.mediaUrl,
                      segments: validSegments,
                      options: q.options,
                    });
                  }
                }
              } else if (parsedData.segments && Array.isArray(parsedData.segments)) {
                // If segments are at root level, create a question
                const validSegments = filterValidSegments(parsedData.segments);
                
                // Handle different options formats
                let optionsArray: MultiLingualText[] = [];
                
                if (Array.isArray(parsedData.options)) {
                  // Standard format: array of MultiLingualText objects
                  optionsArray = parsedData.options;
                } else if (parsedData.options && typeof parsedData.options === 'object') {
                  // Alternative format: object with language keys containing arrays
                  // e.g., { "en": ["L", "V"], "ta": ["தி", "ன்"], "si": ["කො", "ට"] }
                  const langKeys = ['en', 'ta', 'si'];
                  const maxLength = Math.max(
                    ...langKeys.map(lang => 
                      Array.isArray(parsedData.options[lang]) ? parsedData.options[lang].length : 0
                    )
                  );
                  
                  // Convert to array of MultiLingualText objects
                  for (let i = 0; i < maxLength; i++) {
                    const option: MultiLingualText = {};
                    langKeys.forEach(lang => {
                      if (Array.isArray(parsedData.options[lang]) && parsedData.options[lang][i]) {
                        option[lang] = parsedData.options[lang][i];
                      }
                    });
                    // Only add if at least one language has a value
                    if (Object.keys(option).length > 0) {
                      optionsArray.push(option);
                    }
                  }
                }
                
                if (validSegments.length > 0) {
                  questions.push({
                    sentenceId: parsedData.sentenceId || `exercise-${exercise.id}`,
                    mediaUrl: parsedData.mediaUrl,
                    segments: validSegments,
                    options: optionsArray,
                  });
                }
              }

              if (questions.length > 0) {
                exerciseContents.push({
                  title,
                  instruction,
                  questions,
                });
              } else {
                console.warn('FillInTheBlanks: No valid questions found in exercise', exercise.id);
              }
            }
          } catch (parseError) {
            console.error('Error parsing exercise JSON:', parseError);
          }
        });

        if (exerciseContents.length > 0) {
          setAllExercises(exerciseContents);
        }
      } catch (error) {
        console.error('Error fetching FillInTheBlanks exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [activityId]);

  // Initialize activity when exercise changes
  useEffect(() => {
    if (currentQuestion) {
      initializeActivity();
    }
  }, [currentQuestion, currentLang, currentExerciseIndex]);

  const initializeActivity = () => {
    if (!currentQuestion) {
      console.warn('FillInTheBlanks: No current question available');
      return;
    }

    // Validate segments
    if (!currentQuestion.segments || !Array.isArray(currentQuestion.segments)) {
      console.error('Invalid question: segments is missing or not an array', currentQuestion);
      return;
    }

    // Validate options
    if (!currentQuestion.options || !Array.isArray(currentQuestion.options)) {
      console.error('Invalid question: options is missing or not an array', currentQuestion);
      return;
    }

    // Filter out segments with empty content and map to initial segments
    // Only include segments that have content for the current learning language
    const initialSegments: Segment[] = currentQuestion.segments
      .filter((s, index) => {
        if (!s || !s.content) return false;
        
        // Check if current learning language has content
        const currentLangContent = s.content[currentLang]?.trim();
        // Only include segment if it has content for the current learning language
        if (!currentLangContent || currentLangContent.length === 0) {
          console.warn(`Skipping segment ${index} - empty content for language ${currentLang}`);
          return false;
        }
        
        return true;
      })
      .map((s, index) => ({
        ...s,
        status: 'default',
        userAnswer: undefined,
        id: `${currentQuestion.sentenceId || 'question'}-${index}`,
      }));

    // Validate and process options
    if (!currentQuestion.options || !Array.isArray(currentQuestion.options) || currentQuestion.options.length === 0) {
      console.error('FillInTheBlanks: No options available in question', {
        hasOptions: !!currentQuestion.options,
        isArray: Array.isArray(currentQuestion.options),
        length: currentQuestion.options?.length,
        options: currentQuestion.options,
        currentLang,
      });
      return;
    }

    const processedOptions = currentQuestion.options
      .filter(opt => opt != null) // Filter out null/undefined options
      .map((opt, idx) => {
        const word = getText(opt);
        if (!word || word.trim().length === 0) {
          console.warn(`FillInTheBlanks: Option ${idx} is empty for language ${currentLang}`, opt);
        }
        return {
          word: word || '',
          available: true,
        };
      })
      .filter(opt => opt.word && opt.word.trim().length > 0); // Filter out empty words

    if (processedOptions.length === 0) {
      console.error('FillInTheBlanks: All options are empty after processing', {
        originalOptions: currentQuestion.options,
        currentLang,
        allOptionTexts: currentQuestion.options.map(opt => getText(opt)),
      });
      return;
    }

    const shuffledOptions = shuffle(processedOptions);

    setSegments(initialSegments);
    setOptions(shuffledOptions);
    setIsChecked(false);
    setShowSuccessAnimation(false);
    setShowErrorAnimation(false);
    setExerciseResult(null);
  };

  const shuffle = (array: any[]): any[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Auto-fill: When option is tapped, fill the first empty blank
  const selectOption = (optionIndex: number) => {
    const selectedOption = options[optionIndex];
    if (!selectedOption.available || isChecked) return;

    // Find first empty blank
    const firstEmptyBlankIndex = segments.findIndex(
      s => s.type === 'BLANK' && !s.userAnswer
    );

    if (firstEmptyBlankIndex === -1) return;

    // Create updated segments with the new answer
    const updatedSegments: Segment[] = segments.map((s, i) =>
      i === firstEmptyBlankIndex 
        ? { ...s, userAnswer: selectedOption.word, status: 'default' as const } 
        : s
    );
    
    // Mark option as used
    setOptions(options.map((opt, i) =>
      i === optionIndex ? { ...opt, available: false } : opt
    ));

    // Check if all blanks are filled
    const allBlanksFilled = updatedSegments.filter(s => s.type === 'BLANK').every(s => s.userAnswer);
    
    if (allBlanksFilled) {
      // Auto-check answers
      const checkedSegments: Segment[] = updatedSegments.map(s => {
        if (s.type === 'BLANK' && s.userAnswer) {
          const userAnswer = s.userAnswer.trim();
          const correctAnswer = getText(s.content).trim();
          const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
          return { ...s, status: (isCorrect ? 'correct' : 'incorrect') as 'correct' | 'incorrect' };
        }
        return s;
      });
      setSegments(checkedSegments);
      setIsChecked(true);

      // Check if all correct
      const allCorrect = checkedSegments
        .filter(s => s.type === 'BLANK')
        .every(s => s.status === 'correct');

      if (allCorrect) {
        setExerciseResult('correct');
        setShowSuccessAnimation(true);
        // Auto play animation
        setTimeout(() => {
          successAnimationRef.current?.play();
        }, 100);
        // Auto move to next exercise after showing popup (2.5 seconds)
        setTimeout(() => {
          setShowSuccessAnimation(false);
          // Always try onExerciseComplete first for multi-exercise navigation
          if (onExerciseComplete) {
            onExerciseComplete();
          } else if (onComplete) {
            onComplete();
          }
        }, 2500);
      } else {
        setExerciseResult('wrong');
        setShowErrorAnimation(true);
        // Auto play animation
        setTimeout(() => {
          errorAnimationRef.current?.play();
        }, 100);
        // Keep error popup visible for user to choose retry/exit
      }
    } else {
      // Update segments even if not all blanks are filled
      setSegments(updatedSegments);
    }
  };

  // Remove answer from blank
  const removeAnswer = (index: number) => {
    if (isChecked) return;
    const segment = segments[index];
    if (segment.userAnswer) {
      setOptions(options.map(opt =>
        opt.word === segment.userAnswer ? { ...opt, available: true } : opt
      ));
    }
    setSegments(segments.map((s, i) =>
      i === index ? { ...s, userAnswer: undefined, status: 'default' } : s
    ));
  };

  if (loading) {
    return (
      <LinearGradient colors={theme.headerGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!fillData || !currentQuestion) {
    return (
      <LinearGradient colors={theme.headerGradient} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No fill-in-the-blanks content available</Text>
        </View>
      </LinearGradient>
    );
  }

  // Validate that we have valid segments and options before rendering
  if (!Array.isArray(segments) || segments.length === 0) {
    return (
      <LinearGradient colors={theme.headerGradient} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: No segments available for this exercise</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!Array.isArray(options) || options.length === 0) {
    return (
      <LinearGradient colors={theme.headerGradient} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: No options available for this exercise</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, styles.containerWhite]}>
      {/* Success Popup Modal */}
      <Modal
        visible={showSuccessAnimation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessAnimation(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.successPopupContainer}>
            <LottieView
              ref={successAnimationRef}
              source={require('../../../assets/animations/Happy boy.json')}
              autoPlay={false}
              loop={false}
              style={styles.popupAnimation}
            />
            <Text style={styles.successTitle}>Well Done! 🎉</Text>
            <Text style={styles.successMessage}>All answers are correct!</Text>
          </View>
        </View>
      </Modal>

      {/* Error Popup Modal */}
      <Modal
        visible={showErrorAnimation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorAnimation(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.errorPopupContainer}>
            <LottieView
              ref={errorAnimationRef}
              source={require('../../../assets/animations/Paul R. Bear Fail.json')}
              autoPlay={false}
              loop={false}
              style={styles.popupAnimation}
            />
            <Text style={styles.errorTitle}>Try Again!</Text>
            <Text style={styles.errorMessage}>Some answers are incorrect.</Text>
            <View style={styles.popupButtonsContainer}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setShowErrorAnimation(false);
                  initializeActivity();
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Instruction only - no title */}
      {fillData?.instruction && (
        <View style={styles.instructionContainer}>
          <Text style={styles.instruction}>
            {getText(fillData.instruction) || ''}
          </Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Image at the top */}
        {getImageUrl() && (
          <Image
            source={{ uri: getImageUrl()! }}
            style={styles.questionImage}
            resizeMode="contain"
            onError={(error) => {
              console.error('Image load error:', error.nativeEvent.error);
            }}
          />
        )}

        {/* Sentence with blanks */}
        <View style={styles.sentenceContainer}>
          <View style={styles.sentenceRow}>
            {segments.map((segment, index) => {
              if (segment.type === 'TEXT') {
                const textContent = getText(segment.content);
                if (!textContent) return null;
                return (
                  <Text key={segment.id || index} style={styles.textSegment}>
                    {textContent}
                  </Text>
                );
              } else {
                const hasAnswer = !!segment.userAnswer;
                const status = segment.status;

                return (
                  <TouchableOpacity
                    key={segment.id || index}
                    style={[
                      styles.blankSegment,
                      hasAnswer && styles.blankFilled,
                      status === 'correct' && styles.blankCorrect,
                      status === 'incorrect' && styles.blankIncorrect,
                    ]}
                    onPress={() => !isChecked && hasAnswer && removeAnswer(index)}
                    disabled={isChecked}
                  >
                    {hasAnswer && segment.userAnswer ? (
                      <Text style={[
                        styles.blankText,
                        status === 'correct' && styles.blankTextCorrect,
                        status === 'incorrect' && styles.blankTextIncorrect,
                      ]}>
                        {segment.userAnswer}
                      </Text>
                    ) : (
                      <View style={styles.blankBox} />
                    )}
                  </TouchableOpacity>
                );
              }
            })}
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <View style={styles.optionsGrid}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  !option.available && styles.optionUsed,
                ]}
                onPress={() => selectOption(index)}
                disabled={!option.available || isChecked}
              >
                <Text style={[
                  styles.optionText,
                  !option.available && styles.optionTextUsed,
                ]}>
                  {option.word || ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  containerWhite: {
    backgroundColor: '#FFFFFF',
  },
  instructionContainer: {
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  instruction: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  questionImage: {
    width: '100%',
    height: 200,
    marginBottom: 24,
    alignSelf: 'center',
  },
  sentenceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sentenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSegment: {
    fontSize: 20,
    fontWeight: '500',
    color: '#2C3E50',
    marginHorizontal: 3,
    marginVertical: 2,
  },
  blankSegment: {
    minWidth: 45,
    minHeight: 35,
    borderWidth: 2,
    borderColor: '#3498DB',
    borderRadius: 8,
    padding: 6,
    marginHorizontal: 3,
    marginVertical: 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  blankFilled: {
    backgroundColor: '#ECF0F1',
    borderColor: '#95A5A6',
  },
  blankCorrect: {
    borderColor: '#27AE60',
    backgroundColor: '#D5F4E6',
  },
  blankIncorrect: {
    borderColor: '#E74C3C',
    backgroundColor: '#FADBD8',
  },
  blankBox: {
    width: 35,
    height: 20,
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: '#3498DB',
    borderRadius: 3,
  },
  blankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  blankTextCorrect: {
    color: '#27AE60',
  },
  blankTextIncorrect: {
    color: '#E74C3C',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#3498DB',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  optionUsed: {
    backgroundColor: '#BDC3C7',
    opacity: 0.5,
    shadowOpacity: 0.1,
  },
  optionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  optionTextUsed: {
    color: '#7F8C8D',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successPopupContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '85%',
    maxWidth: 400,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#27AE60',
  },
  errorPopupContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '85%',
    maxWidth: 400,
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#E74C3C',
  },
  popupAnimation: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 18,
    color: '#2C3E50',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 18,
    color: '#2C3E50',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 25,
  },
  popupButtonsContainer: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: '#3498DB',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exitButton: {
    backgroundColor: '#95A5A6',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#95A5A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FillInTheBlanks;

