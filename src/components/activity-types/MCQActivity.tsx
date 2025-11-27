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
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityComponentProps, Language, MultiLingualText } from './types';
import { useResponsive } from '../../utils/responsive';
import { useTheme } from '../../theme/ThemeContext';

type ContentType = 'text' | 'image' | 'audio';

interface QuestionItem {
  type: ContentType;
  content: {
    ta?: string;
    en?: string;
    si?: string;
    default?: string;
  };
}

interface Option {
  content: {
    ta?: string;
    en?: string;
    si?: string;
    default?: string;
  };
  isCorrect: boolean;
}

interface Question {
  questionId: string;
  question: QuestionItem;
  answerType: ContentType;
  options: Option[];
}

interface MCQContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  questions: Question[];
}

const MCQActivity: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
}) => {
  const responsive = useResponsive();
  const { theme } = useTheme();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userSelection, setUserSelection] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'default' | 'correct' | 'incorrect' | 'completed'>('default');
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const mcqData = content as MCQContent;

  const getText = (text: MultiLingualText | { [key: string]: string | undefined } | undefined): string => {
    if (!text) return '';
    if (typeof text === 'object') {
      return text[currentLang] || text.en || text.ta || text.si || '';
    }
    return '';
  };

  const currentQuestion = mcqData?.questions?.[currentQuestionIndex];

  const selectOption = (optionIndex: number) => {
    if (feedback !== 'default') return;

    setUserSelection(optionIndex);
    const selectedOption = currentQuestion?.options[optionIndex];

    if (selectedOption?.isCorrect) {
      setScore(score + 1);
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }
  };

  const goToNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < (mcqData?.questions?.length || 0)) {
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

  const playSound = async (content: { [key: string]: string | undefined }) => {
    const audioPath = content[currentLang] || content.en || content.ta;
    if (!audioPath) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioPath },
        { shouldPlay: true }
      );
      setSound(newSound);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.warn);
      }
    };
  }, [sound]);

  const renderQuestionContent = (questionItem: QuestionItem) => {
    const content = getText(questionItem.content);

    if (questionItem.type === 'text') {
      return <Text style={styles.questionText}>{content}</Text>;
    } else if (questionItem.type === 'image') {
      return (
        <Image
          source={{ uri: content }}
          style={styles.questionImage}
          resizeMode="contain"
        />
      );
    } else if (questionItem.type === 'audio') {
      return (
        <TouchableOpacity
          style={styles.audioButton}
          onPress={() => playSound(questionItem.content)}
        >
          <MaterialIcons name="volume-up" size={40} color="#FFFFFF" />
          <Text style={styles.audioLabel}>Play Question</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderOption = (option: Option, index: number) => {
    const content = getText(option.content);
    const isSelected = userSelection === index;
    const showFeedback = feedback !== 'default';

    let optionStyle = styles.option;
    if (isSelected && showFeedback) {
      optionStyle = option.isCorrect ? styles.optionCorrect : styles.optionIncorrect;
    } else if (isSelected) {
      optionStyle = styles.optionSelected;
    }

    return (
      <TouchableOpacity
        key={index}
        style={[optionStyle, currentQuestion?.answerType === 'text' ? styles.optionText : styles.optionMedia]}
        onPress={() => selectOption(index)}
        disabled={feedback !== 'default'}
      >
        {currentQuestion?.answerType === 'text' && (
          <Text style={styles.optionTextContent}>{content}</Text>
        )}
        {currentQuestion?.answerType === 'image' && (
          <Image source={{ uri: content }} style={styles.optionImage} resizeMode="cover" />
        )}
        {currentQuestion?.answerType === 'audio' && (
          <TouchableOpacity
            style={styles.optionAudioButton}
            onPress={() => playSound(option.content)}
          >
            <MaterialIcons name="volume-up" size={30} color="#FFFFFF" />
            <Text style={styles.optionAudioLabel}>Play</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (!mcqData || !currentQuestion) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No MCQ content available</Text>
      </View>
    );
  }

  if (feedback === 'completed') {
    return (
      <LinearGradient colors={theme.headerGradient} style={styles.container}>
        <View style={styles.completedContainer}>
          <Text style={styles.completedTitle}>Game Completed!</Text>
          <Text style={styles.completedScore}>
            Your Score: {score} / {mcqData.questions.length}
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
        <Text style={styles.title}>{getText(mcqData.title)}</Text>
        <Text style={styles.instruction}>{getText(mcqData.instruction)}</Text>
        <Text style={styles.counter}>
          Question {currentQuestionIndex + 1} of {mcqData.questions.length} | Score: {score}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionLabel}>Question:</Text>
          <View style={styles.questionContent}>
            {renderQuestionContent(currentQuestion.question)}
          </View>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => renderOption(option, index))}
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
                {currentQuestionIndex + 1 < mcqData.questions.length ? 'Next Question' : 'Finish'}
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
  questionContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  questionContent: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  questionImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 15,
  },
  audioLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionsContainer: {
    gap: 15,
    marginBottom: 20,
  },
  option: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    minHeight: 60,
  },
  optionMedia: {
    minHeight: 120,
  },
  optionTextContent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  optionImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  optionAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  optionAudioLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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

export default MCQActivity;

