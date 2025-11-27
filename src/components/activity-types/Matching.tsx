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

type CardType = 'text' | 'image' | 'audio';

interface Card {
  id: string;
  matchId: string;
  side: 'A' | 'B';
  type: CardType;
  content: {
    default?: string | null;
    ta?: string | null;
    en?: string | null;
    si?: string | null;
  };
}

interface MatchingContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  cards: Card[];
}

const Matching: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
}) => {
  const responsive = useResponsive();
  const { theme } = useTheme();
  const [selectedCardA, setSelectedCardA] = useState<string | null>(null);
  const [selectedCardB, setSelectedCardB] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const matchingData = content as MatchingContent;

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  const getCardContent = (card: Card): string | null => {
    if (card.type === 'text' || card.type === 'audio') {
      return card.content[currentLang] || card.content.en || card.content.ta || null;
    }
    return card.content.default || card.content[currentLang] || null;
  };

  const sideACards = matchingData?.cards?.filter(c => c.side === 'A') || [];
  const sideBCards = matchingData?.cards?.filter(c => c.side === 'B') || [];

  const handleCardSelect = (cardId: string, side: 'A' | 'B') => {
    if (matchedPairs.has(cardId)) return; // Already matched

    if (side === 'A') {
      if (selectedCardA === cardId) {
        setSelectedCardA(null);
      } else {
        setSelectedCardA(cardId);
        if (selectedCardB) {
          checkMatch(cardId, selectedCardB);
        }
      }
    } else {
      if (selectedCardB === cardId) {
        setSelectedCardB(null);
      } else {
        setSelectedCardB(cardId);
        if (selectedCardA) {
          checkMatch(selectedCardA, cardId);
        }
      }
    }
  };

  const checkMatch = (cardAId: string, cardBId: string) => {
    const cardA = sideACards.find(c => c.id === cardAId);
    const cardB = sideBCards.find(c => c.id === cardBId);

    if (cardA && cardB && cardA.matchId === cardB.matchId) {
      // Match found!
      setMatchedPairs(new Set([...matchedPairs, cardAId, cardBId]));
      setSelectedCardA(null);
      setSelectedCardB(null);

      // Check if all pairs are matched
      const totalPairs = new Set(sideACards.map(c => c.matchId)).size;
      if (matchedPairs.size + 2 >= totalPairs * 2) {
        setTimeout(() => {
          Alert.alert('Congratulations!', 'All pairs matched!', [
            { text: 'OK', onPress: onComplete },
          ]);
        }, 500);
      }
    } else {
      // No match - reset selection after a delay
      setTimeout(() => {
        setSelectedCardA(null);
        setSelectedCardB(null);
      }, 1000);
    }
  };

  const playAudio = async (audioUrl: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
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

  const renderCard = (card: Card, side: 'A' | 'B') => {
    const isSelected = (side === 'A' ? selectedCardA : selectedCardB) === card.id;
    const isMatched = matchedPairs.has(card.id);
    const content = getCardContent(card);

    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          isMatched && styles.cardMatched,
          side === 'A' ? styles.cardSideA : styles.cardSideB,
        ]}
        onPress={() => handleCardSelect(card.id, side)}
        disabled={isMatched}
      >
        {card.type === 'text' && (
          <Text style={styles.cardText}>{content || 'Text'}</Text>
        )}
        {card.type === 'image' && content && (
          <Image source={{ uri: content }} style={styles.cardImage} resizeMode="cover" />
        )}
        {card.type === 'audio' && content && (
          <TouchableOpacity
            style={styles.audioButton}
            onPress={() => playAudio(content)}
          >
            <MaterialIcons name="volume-up" size={24} color="#FFFFFF" />
            <Text style={styles.audioLabel}>Play</Text>
          </TouchableOpacity>
        )}
        {isMatched && (
          <View style={styles.checkmark}>
            <MaterialIcons name="check-circle" size={30} color="#4CAF50" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!matchingData || !matchingData.cards) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No matching content available</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={theme.headerGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getText(matchingData.title)}</Text>
        <Text style={styles.instruction}>{getText(matchingData.instruction)}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.sidesContainer}>
          {/* Side A */}
          <View style={styles.sideContainer}>
            <Text style={styles.sideTitle}>Side A</Text>
            {sideACards.map(card => renderCard(card, 'A'))}
          </View>

          {/* Side B */}
          <View style={styles.sideContainer}>
            <Text style={styles.sideTitle}>Side B</Text>
            {sideBCards.map(card => renderCard(card, 'B'))}
          </View>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sidesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 15,
  },
  sideContainer: {
    flex: 1,
    gap: 10,
  },
  sideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  card: {
    minHeight: 100,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardSideA: {
    borderColor: '#3F51B5',
  },
  cardSideB: {
    borderColor: '#4CAF50',
  },
  cardSelected: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
  },
  cardMatched: {
    backgroundColor: 'rgba(76,175,80,0.3)',
    opacity: 0.7,
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cardImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

export default Matching;

