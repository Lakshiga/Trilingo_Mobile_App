import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityComponentProps, Language, MultiLingualText } from './types';
import { useResponsive } from '../../utils/responsive';
import { useTheme } from '../../theme/ThemeContext';

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
}) => {
  const responsive = useResponsive();
  const { theme } = useTheme();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [options, setOptions] = useState<{ word: string; available: boolean }[]>([]);
  const [activeBlankIndex, setActiveBlankIndex] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  const fillData = content as FillInTheBlanksContent;
  const currentQuestion = fillData?.questions?.[0];

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  useEffect(() => {
    if (currentQuestion) {
      initializeActivity();
    }
  }, [currentQuestion, currentLang]);

  const initializeActivity = () => {
    if (!currentQuestion) return;

    const initialSegments: Segment[] = currentQuestion.segments.map((s, index) => ({
      ...s,
      status: 'default',
      userAnswer: undefined,
      id: `${currentQuestion.sentenceId}-${index}`,
    }));

    const shuffledOptions = shuffle(
      currentQuestion.options.map(opt => ({
        word: getText(opt),
        available: true,
      }))
    );

    setSegments(initialSegments);
    setOptions(shuffledOptions);
    setIsFinished(false);
    setActiveBlankIndex(null);
    setMessage('Fill in the blanks to complete the sentence.');
  };

  const shuffle = (array: any[]): any[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const setActiveBlank = (index: number) => {
    if (isFinished) return;
    setActiveBlankIndex(index);
    setMessage(getText(segments[index].hint) || 'Select an option to fill the blank.');
  };

  const selectOption = (optionIndex: number) => {
    if (activeBlankIndex === null) {
      setMessage('Please select a blank first.');
      return;
    }

    const selectedOption = options[optionIndex];
    if (!selectedOption.available) return;

    // Free up old option if blank already has answer
    const currentSegments = [...segments];
    const targetSegment = currentSegments[activeBlankIndex];
    if (targetSegment.userAnswer) {
      setOptions(options.map(opt =>
        opt.word === targetSegment.userAnswer ? { ...opt, available: true } : opt
      ));
    }

    // Place new option
    setSegments(segments.map((s, i) =>
      i === activeBlankIndex ? { ...s, userAnswer: selectedOption.word, status: 'default' } : s
    ));

    setOptions(options.map((opt, i) =>
      i === optionIndex ? { ...opt, available: false } : opt
    ));

    setActiveBlankIndex(null);
    setMessage('Answer placed.');
  };

  const removeAnswer = (index: number) => {
    if (isFinished) return;
    const segment = segments[index];
    if (segment.userAnswer) {
      setOptions(options.map(opt =>
        opt.word === segment.userAnswer ? { ...opt, available: true } : opt
      ));
    }
    setSegments(segments.map((s, i) =>
      i === index ? { ...s, userAnswer: undefined, status: 'default' } : s
    ));
    setActiveBlankIndex(null);
    setMessage('Answer removed.');
  };

  const checkAnswers = () => {
    const blankSegments = segments.filter(s => s.type === 'BLANK');
    if (!blankSegments.every(s => s.userAnswer)) {
      setMessage('Please fill all blanks.');
      return;
    }

    let allCorrect = true;
    const updatedSegments = segments.map(s => {
      if (s.type === 'BLANK' && s.userAnswer) {
        const isCorrect = s.userAnswer === getText(s.content);
        if (!isCorrect) allCorrect = false;
        return { ...s, status: isCorrect ? 'correct' : 'incorrect' };
      }
      return s;
    });

    setSegments(updatedSegments);
    setIsFinished(true);

    if (allCorrect) {
      setMessage('All correct! Congratulations! 🎉');
      setTimeout(() => {
        Alert.alert('Congratulations!', 'All answers are correct!', [
          { text: 'OK', onPress: onComplete },
        ]);
      }, 1000);
    } else {
      setMessage('Some answers are incorrect. Remove incorrect answers and try again.');
    }
  };

  const isComplete = segments.filter(s => s.type === 'BLANK').every(s => s.userAnswer);

  if (!fillData || !currentQuestion) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No fill-in-the-blanks content available</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={theme.headerGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getText(fillData.title)}</Text>
        <Text style={styles.instruction}>{getText(fillData.instruction)}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Sentence with blanks */}
        <View style={styles.sentenceContainer}>
          <View style={styles.sentenceRow}>
            {segments.map((segment, index) => {
              if (segment.type === 'TEXT') {
                return (
                  <Text key={segment.id || index} style={styles.textSegment}>
                    {getText(segment.content)}
                  </Text>
                );
              } else {
                const isActive = activeBlankIndex === index;
                const hasAnswer = !!segment.userAnswer;
                const status = segment.status;

                return (
                  <TouchableOpacity
                    key={segment.id || index}
                    style={[
                      styles.blankSegment,
                      isActive && styles.blankActive,
                      hasAnswer && styles.blankFilled,
                      status === 'correct' && styles.blankCorrect,
                      status === 'incorrect' && styles.blankIncorrect,
                    ]}
                    onPress={() => setActiveBlank(index)}
                  >
                    {hasAnswer ? (
                      <View style={styles.blankContent}>
                        <Text style={styles.blankText}>{segment.userAnswer}</Text>
                        {!isFinished && (
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeAnswer(index)}
                          >
                            <MaterialIcons name="close" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.blankPlaceholder}>___</Text>
                    )}
                  </TouchableOpacity>
                );
              }
            })}
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>Options:</Text>
          <View style={styles.optionsGrid}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionChip,
                  !option.available && styles.optionUsed,
                  activeBlankIndex !== null && option.available && styles.optionAvailable,
                ]}
                onPress={() => selectOption(index)}
                disabled={!option.available || isFinished}
              >
                <Text style={styles.optionText}>{option.word}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Check button */}
        {!isFinished && (
          <TouchableOpacity
            style={[styles.checkButton, !isComplete && styles.checkButtonDisabled]}
            onPress={checkAnswers}
            disabled={!isComplete}
          >
            <Text style={styles.checkButtonText}>Check Answers</Text>
          </TouchableOpacity>
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
  sentenceContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sentenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  textSegment: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 5,
  },
  blankSegment: {
    minWidth: 80,
    minHeight: 40,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 5,
    marginVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blankActive: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.2)',
  },
  blankFilled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  blankCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76,175,80,0.3)',
  },
  blankIncorrect: {
    borderColor: '#F44336',
    backgroundColor: 'rgba(244,67,54,0.3)',
  },
  blankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  blankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  blankPlaceholder: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  removeButton: {
    backgroundColor: 'rgba(244,67,54,0.7)',
    borderRadius: 10,
    padding: 2,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  optionAvailable: {
    backgroundColor: 'rgba(63,81,181,0.4)',
    borderColor: '#3F51B5',
  },
  optionUsed: {
    opacity: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  message: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  checkButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  checkButtonDisabled: {
    opacity: 0.5,
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

export default FillInTheBlanks;

