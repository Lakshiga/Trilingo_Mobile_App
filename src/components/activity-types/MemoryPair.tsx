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

interface DataCard {
  id: string;
  contentType: string;
  content: MultiLingualText;
}

interface AnswerPair {
  card1: string;
  card2: string;
}

interface MemoryPairContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  cards: DataCard[];
  answerPairs: AnswerPair[];
}

interface GameCard extends DataCard {
  isFlipped: boolean;
  isMatched: boolean;
}

const MemoryPair: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
}) => {
  const responsive = useResponsive();
  const { theme } = useTheme();
  const [gameCards, setGameCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<GameCard[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [score, setScore] = useState(0);

  const memoryData = content as MemoryPairContent;

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  const shuffle = (array: GameCard[]): GameCard[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (memoryData?.cards) {
      initializeGame();
    }
  }, [memoryData, currentLang]);

  useEffect(() => {
    if (flippedCards.length === 2 && !isLocked) {
      checkMatch();
    }
  }, [flippedCards, isLocked]);

  const initializeGame = () => {
    const initialCards: GameCard[] = shuffle(
      memoryData.cards.map(card => ({
        ...card,
        isFlipped: false,
        isMatched: false,
      }))
    );
    setGameCards(initialCards);
    setFlippedCards([]);
    setScore(0);
    setIsLocked(false);
  };

  const flipCard = (cardId: string) => {
    if (isLocked) return;

    setGameCards(cards =>
      cards.map(card => {
        if (card.id === cardId && !card.isMatched && !card.isFlipped) {
          const flipped = { ...card, isFlipped: true };
          setFlippedCards([...flippedCards, flipped]);
          return flipped;
        }
        return card;
      })
    );
  };

  const checkMatch = () => {
    if (flippedCards.length !== 2) return;

    setIsLocked(true);
    const [card1, card2] = flippedCards;
    const isMatch = memoryData.answerPairs.some(
      pair =>
        (pair.card1 === card1.id && pair.card2 === card2.id) ||
        (pair.card1 === card2.id && pair.card2 === card1.id)
    );

    if (isMatch) {
      setTimeout(() => {
        setGameCards(cards =>
          cards.map(card =>
            card.id === card1.id || card.id === card2.id
              ? { ...card, isMatched: true }
              : card
          )
        );
        setScore(score + 1);
        setFlippedCards([]);
        setIsLocked(false);

        // Check if all pairs matched
        const allMatched = gameCards.every(
          card => card.id === card1.id || card.id === card2.id || card.isMatched
        );
        if (allMatched) {
          setTimeout(() => {
            Alert.alert('Congratulations!', 'All pairs matched!', [
              { text: 'OK', onPress: onComplete },
            ]);
          }, 500);
        }
      }, 600);
    } else {
      setTimeout(() => {
        setGameCards(cards =>
          cards.map(card =>
            card.id === card1.id || card.id === card2.id
              ? { ...card, isFlipped: false }
              : card
          )
        );
        setFlippedCards([]);
        setIsLocked(false);
      }, 1100);
    }
  };

  const renderCard = (card: GameCard) => {
    const content = getText(card.content);
    const isFlipped = card.isFlipped || card.isMatched;

    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.card,
          isFlipped && styles.cardFlipped,
          card.isMatched && styles.cardMatched,
        ]}
        onPress={() => !isFlipped && flipCard(card.id)}
        disabled={isLocked || card.isMatched}
      >
        {isFlipped ? (
          <View style={styles.cardContent}>
            {card.contentType === 'text' && (
              <Text style={styles.cardText}>{content}</Text>
            )}
            {card.contentType === 'image' && content && (
              <Image source={{ uri: content }} style={styles.cardImage} resizeMode="cover" />
            )}
            {card.contentType === 'audio' && (
              <View style={styles.audioContainer}>
                <MaterialIcons name="volume-up" size={30} color="#FFFFFF" />
                <Text style={styles.audioLabel}>Audio</Text>
              </View>
            )}
            {card.isMatched && (
              <View style={styles.checkmark}>
                <MaterialIcons name="check-circle" size={40} color="#4CAF50" />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.cardBack}>
            <MaterialIcons name="help-outline" size={50} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!memoryData || !memoryData.cards) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No memory pair content available</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={theme.headerGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getText(memoryData.title)}</Text>
        <Text style={styles.instruction}>{getText(memoryData.instruction)}</Text>
        <Text style={styles.score}>Score: {score}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {gameCards.map(card => renderCard(card))}
        </View>
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
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 15,
  },
  card: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardFlipped: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  cardMatched: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    opacity: 0.7,
  },
  cardBack: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(63,81,181,0.5)',
  },
  cardContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  audioContainer: {
    alignItems: 'center',
    gap: 5,
  },
  audioLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkmark: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

export default MemoryPair;

