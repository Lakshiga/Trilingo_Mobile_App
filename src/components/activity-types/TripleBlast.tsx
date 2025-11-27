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
import { useTheme } from '../../theme/ThemeContext';

interface Tile {
  id: string;
  content: { [key: string]: string | null };
}

interface AnswerGroup {
  groupId: string;
  tileIds: string[];
}

interface TripleBlastContent {
  activityId: string;
  title: MultiLingualText;
  instruction: MultiLingualText;
  contentType: string;
  data: Tile[];
  answers: AnswerGroup[];
}

interface GameTile extends Tile {
  status: 'default' | 'selected' | 'hidden' | 'matched_temp' | 'incorrect_temp';
}

const TripleBlast: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
}) => {
  const { theme } = useTheme();
  const [tiles, setTiles] = useState<GameTile[]>([]);
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const tripleBlastData = content as TripleBlastContent;

  const getText = (content: { [key: string]: string | null } | MultiLingualText | undefined): string => {
    if (!content) return 'N/A';
    if (typeof content === 'object') {
      return content[currentLang] || content.en || content.ta || content.si || 'N/A';
    }
    return '';
  };

  const shuffle = (array: GameTile[]): GameTile[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (tripleBlastData?.data) {
      initializeGame();
    }
  }, [tripleBlastData, currentLang]);

  useEffect(() => {
    if (selectedTileIds.length === 3) {
      checkMatch();
    }
  }, [selectedTileIds]);

  const initializeGame = () => {
    const initialTiles: GameTile[] = tripleBlastData.data.map(tile => ({
      ...tile,
      status: 'default',
    }));

    setTiles(shuffle(initialTiles));
    setSelectedTileIds([]);
    setScore(0);
    setFeedbackMessage('Select three tiles to form a group.');
  };

  const selectTile = (tile: GameTile) => {
    if (tile.status === 'hidden' || selectedTileIds.length >= 3) return;

    if (tile.status === 'selected') {
      setSelectedTileIds(selectedTileIds.filter(id => id !== tile.id));
      setTiles(tiles.map(t => (t.id === tile.id ? { ...t, status: 'default' } : t)));
    } else {
      setSelectedTileIds([...selectedTileIds, tile.id]);
      setTiles(tiles.map(t => (t.id === tile.id ? { ...t, status: 'selected' } : t)));
      setFeedbackMessage('Tile selected...');
    }
  };

  const checkMatch = () => {
    const answers = tripleBlastData.answers;
    const matchingGroup = answers.find(group =>
      selectedTileIds.every(id => group.tileIds.includes(id))
    );

    if (matchingGroup) {
      handleSuccess(selectedTileIds);
    } else {
      const firstTileContent = getText(tiles.find(t => t.id === selectedTileIds[0])?.content);
      const contentMatch = selectedTileIds.every(id => {
        const tile = tiles.find(t => t.id === id);
        return getText(tile?.content) === firstTileContent;
      });

      if (contentMatch) {
        handleSuccess(selectedTileIds);
      } else {
        handleFailure(selectedTileIds);
      }
    }
  };

  const handleSuccess = (matchedIds: string[]) => {
    setFeedbackMessage('Blast! Group successfully removed! 🎉');

    setTiles(tiles.map(t =>
      matchedIds.includes(t.id) ? { ...t, status: 'matched_temp' } : t
    ));

    setTimeout(() => {
      setTiles(tiles.map(t =>
        matchedIds.includes(t.id) ? { ...t, status: 'hidden' } : t
      ));
      setScore(score + 3);
      setSelectedTileIds([]);

      if (tiles.every(t => matchedIds.includes(t.id) || t.status === 'hidden')) {
        setFeedbackMessage('All done! Game won! 🏆');
        setTimeout(() => {
          Alert.alert('Congratulations!', 'You completed the game!', [
            { text: 'OK', onPress: onComplete },
          ]);
        }, 1000);
      } else {
        setFeedbackMessage('Select the next group.');
      }
    }, 500);
  };

  const handleFailure = (selectedIds: string[]) => {
    setFeedbackMessage('Mismatch! Not the same group. Try again.');

    setTiles(tiles.map(t =>
      selectedIds.includes(t.id) ? { ...t, status: 'incorrect_temp' } : t
    ));

    setTimeout(() => {
      setTiles(tiles.map(t =>
        t.status === 'incorrect_temp' ? { ...t, status: 'default' } : t
      ));
      setSelectedTileIds([]);
      setFeedbackMessage('Select three tiles.');
    }, 1000);
  };

  if (!tripleBlastData || !tripleBlastData.data) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No triple blast content available</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={theme.headerGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getText(tripleBlastData.title)}</Text>
        <Text style={styles.instruction}>{getText(tripleBlastData.instruction)}</Text>
        <Text style={styles.score}>Score: {score}</Text>
      </View>

      <Text style={styles.feedback}>{feedbackMessage}</Text>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.tilesGrid}>
          {tiles.map(tile => {
            if (tile.status === 'hidden') return null;

            const content = getText(tile.content);
            const isSelected = tile.status === 'selected';
            const isMatched = tile.status === 'matched_temp';
            const isIncorrect = tile.status === 'incorrect_temp';

            return (
              <TouchableOpacity
                key={tile.id}
                style={[
                  styles.tile,
                  isSelected && styles.tileSelected,
                  isMatched && styles.tileMatched,
                  isIncorrect && styles.tileIncorrect,
                ]}
                onPress={() => selectTile(tile)}
              >
                {tripleBlastData.contentType === 'image' && content ? (
                  <Image source={{ uri: content }} style={styles.tileImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.tileText}>{content}</Text>
                )}
              </TouchableOpacity>
            );
          })}
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
  feedback: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 15,
  },
  tile: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  tileSelected: {
    backgroundColor: 'rgba(63,81,181,0.4)',
    borderColor: '#3F51B5',
    transform: [{ scale: 1.1 }],
  },
  tileMatched: {
    backgroundColor: 'rgba(76,175,80,0.4)',
    borderColor: '#4CAF50',
  },
  tileIncorrect: {
    backgroundColor: 'rgba(244,67,54,0.4)',
    borderColor: '#F44336',
  },
  tileText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

export default TripleBlast;

