import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityComponentProps, Language, MultiLingualText } from './types';
import { useResponsive } from '../../utils/responsive';
import { useTheme } from '../../theme/ThemeContext';

interface Question {
  questionId: string;
  questionType: 'trueFalse';
  statement: MultiLingualText;
  options: { label: MultiLingualText; value: boolean }[];
  correctAnswer: boolean;
}

interface TrueFalseContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  questions: Question[];
}

const TrueFalse: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
}) => {
  const responsive = useResponsive();
  const { theme } = useTheme();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userSelection, setUserSelection] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<'default' | 'correct' | 'incorrect' | 'completed'>('default');

  const trueFalseData = content as TrueFalseContent;
  const currentQuestion = trueFalseData?.questions?.[currentQuestionIndex];

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  const selectAnswer = (value: boolean) => {
    if (feedback !== 'default') return;

    setUserSelection(value);
    const isCorrect = value === currentQuestion?.correctAnswer;

    if (isCorrect) {
      setScore(score + 1);
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }
  };

  const goToNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < (trueFalseData?.questions?.length || 0)) {
      setCurrentQuestionIndex(nextIndex);
      setUserSelection(null);
      setFeedback('default');
    } else {
      setFeedback('completed');
    }
  };

  const restartGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setUserSelection(null);
    setFeedback('default');
  };

  if (!trueFalseData || !currentQuestion) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No True/False content available</Text>
      </View>
    );
  }

  if (feedback === 'completed') {
    return (
      <LinearGradient colors={theme.headerGradient} style={styles.container}>
        <View style={styles.completedContainer}>
          <Text style={styles.completedTitle}>Game Completed!</Text>
          <Text style={styles.completedScore}>
            Your Score: {score} / {trueFalseData.questions.length}
          </Text>
          <TouchableOpacity style={styles.restartButton} onPress={restartGame}>
            <MaterialIcons name="refresh" size={24} color="#FFFFFF" />
            <Text style={styles.restartButtonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.headerGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getText(trueFalseData.title)}</Text>
        <Text style={styles.instruction}>{getText(trueFalseData.instruction)}</Text>
        <Text style={styles.counter}>
          Question {currentQuestionIndex + 1} of {trueFalseData.questions.length} | Score: {score}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statementContainer}>
          <Text style={styles.statementLabel}>Statement:</Text>
          <Text style={styles.statementText}>{getText(currentQuestion.statement)}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = userSelection === option.value;
            const showFeedback = feedback !== 'default';
            const isCorrect = option.value === currentQuestion.correctAnswer;

            let optionStyle = styles.option;
            if (isSelected && showFeedback) {
              optionStyle = isCorrect ? styles.optionCorrect : styles.optionIncorrect;
            } else if (isSelected) {
              optionStyle = styles.optionSelected;
            }

            return (
              <TouchableOpacity
                key={index}
                style={optionStyle}
                onPress={() => selectAnswer(option.value)}
                disabled={feedback !== 'default'}
              >
                <Text style={styles.optionText}>{getText(option.label)}</Text>
                {isSelected && showFeedback && (
                  <MaterialIcons
                    name={isCorrect ? 'check-circle' : 'cancel'}
                    size={30}
                    color={isCorrect ? '#4CAF50' : '#F44336'}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {feedback !== 'default' && (
          <View style={styles.feedbackContainer}>
            <Text
              style={[
                styles.feedbackText,
                feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackIncorrect,
              ]}
            >
              {feedback === 'correct' ? 'Correct Answer! 🎉' : 'Incorrect Answer. Try again.'}
            </Text>
            <TouchableOpacity style={styles.nextButton} onPress={goToNextQuestion}>
              <Text style={styles.nextButtonText}>
                {currentQuestionIndex + 1 < trueFalseData.questions.length ? 'Next Question' : 'Finish'}
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
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
    marginBottom: 10,
  },
  counter: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  statementContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  statementLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  statementText: {
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 28,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 20,
    marginBottom: 20,
  },
  option: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: 'rgba(63,81,181,0.4)',
    borderColor: '#3F51B5',
  },
  optionCorrect: {
    backgroundColor: 'rgba(76,175,80,0.4)',
    borderColor: '#4CAF50',
  },
  optionIncorrect: {
    backgroundColor: 'rgba(244,67,54,0.4)',
    borderColor: '#F44336',
  },
  optionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  feedbackContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  feedbackText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  feedbackCorrect: {
    color: '#4CAF50',
  },
  feedbackIncorrect: {
    color: '#F44336',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#3F51B5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
  },
  completedScore: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 30,
  },
  restartButton: {
    flexDirection: 'row',
    backgroundColor: '#FF9800',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    gap: 10,
  },
  restartButtonText: {
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

export default TrueFalse;

