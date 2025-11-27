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

interface HintData {
  hintText: MultiLingualText;
  hintImageUrl?: string;
  hintAudioUrl?: MultiLingualText;
}

interface TaskData {
  taskId: string;
  type: string;
  hint: HintData;
  scrambled: MultiLingualText;
  answer: MultiLingualText;
}

interface ScrambleContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  taskData: TaskData;
}

interface Tile {
  letter: string;
  originalIndex: number;
}

interface Slot {
  letter: string | null;
  tileOriginalIndex: number | null;
}

const ScrambleActivity: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
}) => {
  const responsive = useResponsive();
  const { theme } = useTheme();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [availableTiles, setAvailableTiles] = useState<Tile[]>([]);
  const [feedback, setFeedback] = useState<'default' | 'correct' | 'incorrect'>('default');
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const scrambleData = content as ScrambleContent;

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  const getScrambledLetters = (): string[] => {
    const scrambled = scrambleData?.taskData?.scrambled;
    if (!scrambled) return [];
    const lettersString = scrambled[currentLang] || scrambled.ta || '';
    if (Array.isArray(lettersString)) {
      return lettersString as string[];
    }
    return lettersString.split(/[\s,]+/).filter(Boolean);
  };

  useEffect(() => {
    if (scrambleData?.taskData) {
      initializeGame();
    }
  }, [scrambleData, currentLang]);

  const initializeGame = () => {
    setFeedback('default');
    const answerText = getText(scrambleData.taskData.answer).toUpperCase();
    const scrambledLetters = getScrambledLetters();

    const initialSlots: Slot[] = Array(answerText.length)
      .fill(0)
      .map(() => ({
        letter: null,
        tileOriginalIndex: null,
      }));

    const initialTiles: Tile[] = scrambledLetters.map((letter, index) => ({
      letter: letter.toUpperCase(),
      originalIndex: index,
    }));

    setSlots(initialSlots);
    setAvailableTiles(initialTiles);
  };

  const placeTile = (slotIndex: number, letter: string, originalIndex: number) => {
    if (slots[slotIndex].letter !== null || feedback !== 'default') return;

    setSlots(slots.map((slot, index) =>
      index === slotIndex ? { letter, tileOriginalIndex: originalIndex } : slot
    ));

    setAvailableTiles(availableTiles.filter(t => t.originalIndex !== originalIndex));
  };

  const removeTile = (slotIndex: number) => {
    const removedSlot = slots[slotIndex];
    if (removedSlot.letter === null || feedback !== 'default') return;

    setAvailableTiles([
      ...availableTiles,
      { letter: removedSlot.letter!, originalIndex: removedSlot.tileOriginalIndex! },
    ].sort((a, b) => a.originalIndex - b.originalIndex));

    setSlots(slots.map((slot, index) =>
      index === slotIndex ? { letter: null, tileOriginalIndex: null } : slot
    ));
  };

  const checkAnswer = () => {
    if (feedback !== 'default' || !slots.every(s => s.letter !== null)) return;

    const currentWord = slots.map(s => s.letter).join('');
    const correctAnswer = getText(scrambleData.taskData.answer).toUpperCase();

    if (currentWord === correctAnswer) {
      setFeedback('correct');
      setTimeout(() => {
        Alert.alert('Correct!', 'You solved it!', [
          { text: 'OK', onPress: onComplete },
        ]);
      }, 500);
    } else {
      setFeedback('incorrect');
      setTimeout(() => {
        setFeedback('default');
      }, 2000);
    }
  };

  const playHintAudio = async () => {
    const audioUrl = scrambleData?.taskData?.hint?.hintAudioUrl;
    if (!audioUrl) return;

    const path = audioUrl[currentLang] || audioUrl.en || audioUrl.ta;
    if (!path) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: path },
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

  if (!scrambleData || !scrambleData.taskData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No scramble content available</Text>
      </View>
    );
  }

  const hintImageUrl = scrambleData.taskData.hint?.hintImageUrl;
  const hintText = getText(scrambleData.taskData.hint?.hintText);

  return (
    <LinearGradient colors={theme.headerGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getText(scrambleData.title)}</Text>
        <Text style={styles.instruction}>{getText(scrambleData.instruction)}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hint Section */}
        {(hintText || hintImageUrl) && (
          <View style={styles.hintContainer}>
            {hintImageUrl && (
              <Image source={{ uri: hintImageUrl }} style={styles.hintImage} resizeMode="contain" />
            )}
            {hintText && <Text style={styles.hintText}>{hintText}</Text>}
            {scrambleData.taskData.hint?.hintAudioUrl && (
              <TouchableOpacity style={styles.hintAudioButton} onPress={playHintAudio}>
                <MaterialIcons name="volume-up" size={24} color="#FFFFFF" />
                <Text style={styles.hintAudioLabel}>Play Hint</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Answer Slots */}
        <View style={styles.slotsContainer}>
          <Text style={styles.slotsLabel}>Answer:</Text>
          <View style={styles.slotsRow}>
            {slots.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.slot,
                  slot.letter && styles.slotFilled,
                  feedback === 'correct' && styles.slotCorrect,
                  feedback === 'incorrect' && styles.slotIncorrect,
                ]}
                onPress={() => slot.letter && removeTile(index)}
              >
                {slot.letter ? (
                  <View style={styles.slotContent}>
                    <Text style={styles.slotText}>{slot.letter}</Text>
                    {feedback === 'default' && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeTile(index)}
                      >
                        <MaterialIcons name="close" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <Text style={styles.slotPlaceholder}>_</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Available Tiles */}
        <View style={styles.tilesContainer}>
          <Text style={styles.tilesLabel}>Available Letters:</Text>
          <View style={styles.tilesRow}>
            {availableTiles.map((tile) => (
              <TouchableOpacity
                key={tile.originalIndex}
                style={styles.tile}
                onPress={() => {
                  const nextEmptyIndex = slots.findIndex(s => s.letter === null);
                  if (nextEmptyIndex !== -1) {
                    placeTile(nextEmptyIndex, tile.letter, tile.originalIndex);
                  }
                }}
              >
                <Text style={styles.tileText}>{tile.letter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback */}
        {feedback !== 'default' && (
          <Text
            style={[
              styles.feedbackText,
              feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackIncorrect,
            ]}
          >
            {feedback === 'correct' ? 'Correct! 🎉' : 'Incorrect. Try again.'}
          </Text>
        )}

        {/* Check Button */}
        <TouchableOpacity
          style={[
            styles.checkButton,
            !slots.every(s => s.letter !== null) && styles.checkButtonDisabled,
          ]}
          onPress={checkAnswer}
          disabled={!slots.every(s => s.letter !== null) || feedback !== 'default'}
        >
          <Text style={styles.checkButtonText}>Check Answer</Text>
        </TouchableOpacity>
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
  hintContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  hintImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  hintText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  hintAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  hintAudioLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  slotsContainer: {
    marginBottom: 20,
  },
  slotsLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  slot: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotFilled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  slotCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76,175,80,0.3)',
  },
  slotIncorrect: {
    borderColor: '#F44336',
    backgroundColor: 'rgba(244,67,54,0.3)',
  },
  slotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  slotText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  slotPlaceholder: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.5)',
  },
  removeButton: {
    backgroundColor: 'rgba(244,67,54,0.7)',
    borderRadius: 10,
    padding: 2,
  },
  tilesContainer: {
    marginBottom: 20,
  },
  tilesLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  tilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  tile: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(63,81,181,0.4)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3F51B5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  feedbackText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  feedbackCorrect: {
    color: '#4CAF50',
  },
  feedbackIncorrect: {
    color: '#F44336',
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

export default ScrambleActivity;

