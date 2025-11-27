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

interface Bubble {
  id: string;
  content: MultiLingualText;
}

interface FixedBubble extends Bubble {
  isExploded: boolean;
}

interface ShootableBubble extends Bubble {
  isAvailable: boolean;
}

interface AnswerPair {
  shootableId: string;
  fixedId: string;
}

interface BubbleBlastContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  contentType: 'word' | 'letter' | 'image';
  fixedBubbles: Bubble[];
  shootableBubbles: Bubble[];
  answerPairs: AnswerPair[];
}

const BubbleBlast: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
}) => {
  const { theme } = useTheme();
  const [fixedBubbles, setFixedBubbles] = useState<FixedBubble[]>([]);
  const [shootableBubbles, setShootableBubbles] = useState<ShootableBubble[]>([]);
  const [shooterBubble, setShooterBubble] = useState<ShootableBubble | null>(null);
  const [score, setScore] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const bubbleBlastData = content as BubbleBlastContent;

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return 'N/A';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  useEffect(() => {
    if (bubbleBlastData?.fixedBubbles) {
      initializeGame();
    }
  }, [bubbleBlastData, currentLang]);

  const initializeGame = () => {
    const initialFixed: FixedBubble[] = bubbleBlastData.fixedBubbles.map(b => ({
      ...b,
      isExploded: false,
    }));

    const initialShootable: ShootableBubble[] = bubbleBlastData.shootableBubbles.map(b => ({
      ...b,
      isAvailable: true,
    }));

    setFixedBubbles(initialFixed);
    setShootableBubbles(initialShootable);
    setShooterBubble(null);
    setScore(0);
    setFeedbackMessage('Select a bubble to shoot.');
  };

  const loadShooter = (bubble: ShootableBubble) => {
    if (isChecking || !bubble.isAvailable) return;
    setShooterBubble(bubble);
    setFeedbackMessage(`'${getText(bubble.content)}' ready to shoot.`);
  };

  const shoot = (fixedBubble: FixedBubble) => {
    if (isChecking || fixedBubble.isExploded || !shooterBubble) return;

    setIsChecking(true);

    const fixedContent = getText(fixedBubble.content);
    const shooterContent = getText(shooterBubble.content);
    const isAnswerPair = bubbleBlastData.answerPairs.some(
      pair => pair.shootableId === shooterBubble.id && pair.fixedId === fixedBubble.id
    );

    if (fixedContent === shooterContent && isAnswerPair) {
      handleMatch(fixedBubble, shooterBubble);
    } else {
      handleMiss();
    }
  };

  const handleMatch = (fixedBubble: FixedBubble, shooter: ShootableBubble) => {
    setFeedbackMessage('Success! Bubble exploded! 🎉');

    setFixedBubbles(bubbles =>
      bubbles.map(b => (b.id === fixedBubble.id ? { ...b, isExploded: true } : b))
    );

    setShootableBubbles(bubbles =>
      bubbles.map(b => (b.id === shooter.id ? { ...b, isAvailable: false } : b))
    );

    setShooterBubble(null);
    setScore(score + 1);

    setTimeout(() => {
      setIsChecking(false);
      if (fixedBubbles.every(b => b.id === fixedBubble.id || b.isExploded)) {
        setFeedbackMessage('All done! Game won! 🏆');
        setTimeout(() => {
          Alert.alert('Congratulations!', 'You completed the game!', [
            { text: 'OK', onPress: onComplete },
          ]);
        }, 1000);
      } else {
        setFeedbackMessage('Select the next bubble.');
      }
    }, 500);
  };

  const handleMiss = () => {
    setFeedbackMessage('Miss! Try again.');

    setTimeout(() => {
      setIsChecking(false);
      setFeedbackMessage('Select a bubble to shoot.');
    }, 1000);
  };

  if (!bubbleBlastData || !bubbleBlastData.fixedBubbles) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No bubble blast content available</Text>
      </View>
    );
  }

  const availableProjectiles = shootableBubbles.filter(b => b.isAvailable);

  return (
    <LinearGradient colors={theme.headerGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getText(bubbleBlastData.title)}</Text>
        <Text style={styles.instruction}>{getText(bubbleBlastData.instruction)}</Text>
        <Text style={styles.score}>Score: {score}</Text>
      </View>

      <Text style={styles.feedback}>{feedbackMessage}</Text>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Fixed Bubbles (Targets) */}
        <View style={styles.fixedBubblesContainer}>
          <Text style={styles.sectionTitle}>Targets:</Text>
          <View style={styles.bubblesGrid}>
            {fixedBubbles.map(bubble => {
              if (bubble.isExploded) return null;

              const content = getText(bubble.content);
              return (
                <TouchableOpacity
                  key={bubble.id}
                  style={styles.fixedBubble}
                  onPress={() => shoot(bubble)}
                  disabled={!shooterBubble || isChecking}
                >
                  {bubbleBlastData.contentType === 'image' && content ? (
                    <Image source={{ uri: content }} style={styles.bubbleImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.bubbleText}>{content}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Shooter */}
        {shooterBubble && (
          <View style={styles.shooterContainer}>
            <Text style={styles.sectionTitle}>Ready to Shoot:</Text>
            <View style={styles.shooterBubble}>
              {bubbleBlastData.contentType === 'image' ? (
                <Image
                  source={{ uri: getText(shooterBubble.content) }}
                  style={styles.bubbleImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.bubbleText}>{getText(shooterBubble.content)}</Text>
              )}
            </View>
          </View>
        )}

        {/* Available Projectiles */}
        <View style={styles.projectilesContainer}>
          <Text style={styles.sectionTitle}>Available Bubbles:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.projectilesRow}>
              {availableProjectiles.map(bubble => (
                <TouchableOpacity
                  key={bubble.id}
                  style={[
                    styles.projectileBubble,
                    shooterBubble?.id === bubble.id && styles.projectileBubbleSelected,
                  ]}
                  onPress={() => loadShooter(bubble)}
                  disabled={isChecking}
                >
                  {bubbleBlastData.contentType === 'image' ? (
                    <Image
                      source={{ uri: getText(bubble.content) }}
                      style={styles.bubbleImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.bubbleText}>{getText(bubble.content)}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  fixedBubblesContainer: {
    marginBottom: 30,
  },
  bubblesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  fixedBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  shooterContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  shooterBubble: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,215,0,0.3)',
    borderWidth: 3,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  projectilesContainer: {
    marginBottom: 20,
  },
  projectilesRow: {
    flexDirection: 'row',
    gap: 15,
  },
  projectileBubble: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(63,81,181,0.4)',
    borderWidth: 2,
    borderColor: '#3F51B5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  projectileBubbleSelected: {
    backgroundColor: 'rgba(255,215,0,0.4)',
    borderColor: '#FFD700',
  },
  bubbleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bubbleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

export default BubbleBlast;

