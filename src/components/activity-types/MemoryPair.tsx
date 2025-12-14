import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';

import { ActivityComponentProps, MultiLingualText } from './types';
import { useResponsive } from '../../utils/responsive';
import { useTheme } from '../../theme/ThemeContext';
import { getCloudFrontUrl, getImageUrl as getImageUrlHelper } from '../../utils/awsUrlHelper';
import apiService from '../../services/api';

const { width } = Dimensions.get('window');

// --- Interfaces ---
interface DataCard {
  id: string;
  contentType: 'word' | 'text' | 'image' | 'audio';
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
  animValue: Animated.Value; 
}

const MemoryPair: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
  activityId,
  currentExerciseIndex = 0,
  onExerciseComplete,
}) => {
  const responsive = useResponsive();
  
  // State
  const [loading, setLoading] = useState(true);
  const [allExercises, setAllExercises] = useState<MemoryPairContent[]>([]);
  const [gameCards, setGameCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<GameCard[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchesFound, setMatchesFound] = useState(0);
  
  // Game Status
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Animation refs
  const modalAnimRef = useRef<LottieView>(null);

  // Sound states
  const [correctSound, setCorrectSound] = useState<Audio.Sound | null>(null);
  const [wrongSound, setWrongSound] = useState<Audio.Sound | null>(null);
  const [congratulationSound, setCongratulationSound] = useState<Audio.Sound | null>(null);

  const memoryData = allExercises[currentExerciseIndex] || (content as MemoryPairContent);
  const totalPairs = memoryData?.answerPairs?.length || 0;
  const isLastExercise = currentExerciseIndex >= (allExercises.length - 1);

  // --- Fetch Exercises ---
  useEffect(() => {
    const fetchExercises = async () => {
      if (!activityId) {
        if (content) setAllExercises([content as MemoryPairContent]);
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
        const exerciseContents: MemoryPairContent[] = [];
        sortedExercises.forEach((exercise) => {
          try {
            if (exercise.jsonData) {
              exerciseContents.push(JSON.parse(exercise.jsonData));
            }
          } catch (e) {}
        });
        if (exerciseContents.length > 0) setAllExercises(exerciseContents);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
    
    // Cleanup sounds
    return () => {
      if (correctSound) correctSound.unloadAsync();
      if (wrongSound) wrongSound.unloadAsync();
      if (congratulationSound) congratulationSound.unloadAsync();
    };
  }, [activityId]);

  // --- Initialize Game ---
  useEffect(() => {
    if (memoryData?.cards && memoryData?.answerPairs) {
      initializeGame();
    }
  }, [memoryData, currentExerciseIndex]);

  // --- Game Logic ---

  const shuffle = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const initializeGame = () => {
    if (!memoryData?.cards || !memoryData?.answerPairs) {
      return;
    }

    const preparedCards: GameCard[] = shuffle(
      memoryData.cards.map(card => ({
        ...card,
        isFlipped: false, // Start Hidden (Face Down)
        isMatched: false,
        animValue: new Animated.Value(0), // 0 degrees (Back showing)
      }))
    );

    setGameCards(preparedCards);
    setFlippedCards([]);
    setMatchesFound(0);
    setIsProcessing(false);
    setGameWon(false);
    setGameOver(false);
    setShowModal(false);
  };

  // Check for Match
  useEffect(() => {
    if (flippedCards.length === 2 && !isProcessing) {
      checkMatch();
    }
  }, [flippedCards]);

  const flipCard = (index: number) => {
    // Block if: Processing, Card already flipped, Card matched, or Game Over
    if (isProcessing || gameCards[index].isFlipped || gameCards[index].isMatched || gameOver) {
      return;
    }
    if (flippedCards.length >= 2) return;

    // Animate Flip to Front (180 deg)
    Animated.spring(gameCards[index].animValue, {
      toValue: 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    const updatedCards = [...gameCards];
    updatedCards[index].isFlipped = true;
    setGameCards(updatedCards);
    setFlippedCards(prev => [...prev, updatedCards[index]]);
  };

  const checkMatch = () => {
    setIsProcessing(true);
    const [card1, card2] = flippedCards;

    const isMatch = memoryData.answerPairs.some(
      pair =>
        (pair.card1 === card1.id && pair.card2 === card2.id) ||
        (pair.card1 === card2.id && pair.card2 === card1.id)
    );

    if (isMatch) {
      handleMatch(card1, card2);
    } else {
      handleMismatch(card1, card2);
    }
  };

  const handleMatch = (card1: GameCard, card2: GameCard) => {
    // Play Correct Sound
    playCorrectSound();
    
    setTimeout(() => {
      setGameCards(prev =>
        prev.map(card =>
          card.id === card1.id || card.id === card2.id
            ? { ...card, isMatched: true } // Keep them face up
            : card
        )
      );
      setMatchesFound(prev => prev + 1);
      setFlippedCards([]);
      setIsProcessing(false);

      const updatedMatches = matchesFound + 1;
      if (updatedMatches >= totalPairs) {
        playCongratulationSound();
        setGameWon(true);
        setShowModal(true);
        
        // Auto-exit for last exercise after animation
        if (isLastExercise) {
          setTimeout(() => {
            setShowModal(false);
            if (onComplete) onComplete();
          }, 3500); // 3.5 seconds for animation
        }
      }
    }, 500);
  };

  const handleMismatch = (card1: GameCard, card2: GameCard) => {
    // Play Wrong Sound
    playWrongSound();

    setTimeout(() => {
      // Flip Both Back to 0 degrees (Face Down)
      Animated.parallel([
        Animated.spring(card1.animValue, { toValue: 0, friction: 8, tension: 10, useNativeDriver: true }),
        Animated.spring(card2.animValue, { toValue: 0, friction: 8, tension: 10, useNativeDriver: true }),
      ]).start();

      setGameCards(prev =>
        prev.map(card =>
          card.id === card1.id || card.id === card2.id
            ? { ...card, isFlipped: false }
            : card
        )
      );
      setFlippedCards([]);
      setIsProcessing(false);
    }, 1000); // 1 Second Delay
  };

  const handleRestart = () => {
    initializeGame();
  };

  const handleModalAction = () => {
    setShowModal(false);
    if (gameWon) {
      if (isLastExercise) {
        if (onComplete) onComplete();
      } else {
        if (onExerciseComplete) onExerciseComplete();
      }
    } else {
      // Restart game
      handleRestart();
    }
  };

  // --- Sound Functions ---
  const playCorrectSound = async () => {
    try {
      if (correctSound) {
        await correctSound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/correct.wav')
      );
      setCorrectSound(newSound);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync();
          setCorrectSound(null);
        }
      });
    } catch (err) {}
  };

  const playWrongSound = async () => {
    try {
      if (wrongSound) {
        await wrongSound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/wrong.mp3')
      );
      setWrongSound(newSound);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync();
          setWrongSound(null);
        }
      });
    } catch (err) {}
  };

  const playCongratulationSound = async () => {
    try {
      if (congratulationSound) {
        await congratulationSound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/congratulation.wav')
      );
      setCongratulationSound(newSound);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync();
          setCongratulationSound(null);
        }
      });
    } catch (err) {}
  };

  // --- Rendering Helpers ---
  const getText = (text: MultiLingualText | undefined | null) => {
    if (!text) return '';
    // @ts-ignore
    return text[currentLang] || text.en || '';
  };

  const getMediaUrl = (obj: MultiLingualText | undefined) => {
    if (!obj) return null;
    try {
      const url = getImageUrlHelper(obj, currentLang as 'en' | 'ta' | 'si');
      if (url) return url;
    } catch (e) {}
    const pathFromText = getText(obj);
    if (pathFromText && (pathFromText.includes('/') || pathFromText.includes('.'))) {
      return pathFromText.startsWith('http') ? pathFromText : getCloudFrontUrl(pathFromText);
    }
    return null;
  };

  const renderCardContent = (card: GameCard) => {
    const textContent = getText(card.content);
    const mediaUrl = getMediaUrl(card.content);

    if (card.contentType === 'image' && mediaUrl) {
      return <Image source={{ uri: mediaUrl }} style={styles.cardImage} resizeMode="contain" />;
    } 
    if (card.contentType === 'audio') {
      return (
        <View style={styles.contentContainer}>
          <MaterialIcons name="volume-up" size={24} color="#FF6B6B" />
        </View>
      );
    }
    return (
      <View style={styles.contentContainer}>
        <Text style={styles.cardText} numberOfLines={2} adjustsFontSizeToFit>{textContent}</Text>
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" color="#FF6B6B" style={styles.centered} />;

  return (
    <View style={styles.mainContainer}>
      
      {/* --- HEADER (Instruction Only) --- */}
      {getText(memoryData?.instruction) ? (
        <View style={styles.header}>
          <Text style={styles.instructionText}>
            {getText(memoryData.instruction)}
          </Text>
        </View>
      ) : null}

      {/* --- GRID (3 Columns - 3x4) --- */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {gameCards.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>No cards available</Text>
            </View>
          ) : (
            gameCards.map((card, index) => {
            const frontInterpolate = card.animValue.interpolate({
              inputRange: [0, 180],
              outputRange: ['180deg', '0deg'], // Front is hidden at 0, visible at 180
            });
            const backInterpolate = card.animValue.interpolate({
              inputRange: [0, 180],
              outputRange: ['0deg', '180deg'], // Back is visible at 0, hidden at 180
            });

            return (
              <TouchableOpacity
                key={`${card.id}-${index}`}
                activeOpacity={0.9}
                onPress={() => flipCard(index)}
                style={styles.cardWrapper}
                disabled={isProcessing || card.isMatched || gameOver}
              >
                {/* Back Face (Visible Initially) - Blue Theme */}
                <Animated.View style={[styles.cardFace, styles.cardBack, { transform: [{ rotateY: backInterpolate }] }]}>
                  <LinearGradient 
                    colors={['#1976D2', '#1565C0', '#0D47A1']} 
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                  >
                    <MaterialCommunityIcons name="cards" size={40} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.cardBackText}>?</Text>
                  </LinearGradient>
                </Animated.View>

                {/* Front Face (Hidden Initially) */}
                <Animated.View style={[styles.cardFace, styles.cardFront, { transform: [{ rotateY: frontInterpolate }] }]}>
                  {card.isMatched ? (
                    <View style={styles.matchedContainer}>
                        <MaterialIcons name="check" size={24} color="#4CAF50" />
                    </View>
                  ) : (
                    renderCardContent(card)
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
            })
          )}
        </View>
      </ScrollView>

      {/* --- MODAL (WIN or TIME UP) --- */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LottieView
              ref={modalAnimRef}
              source={gameWon 
                ? require('../../../assets/animations/Happy boy.json') 
                : require('../../../assets/animations/wrong.json')}
              autoPlay loop={false} style={styles.modalAnim}
            />
            
            <Text style={[styles.modalTitle, { color: gameWon ? '#4CAF50' : '#F44336' }]}>
              {gameWon ? 'Awesome!' : 'Try Again!'}
            </Text>
            
            <Text style={styles.modalMessage}>
              {gameWon ? 'You found all pairs!' : 'Keep trying!'}
            </Text>

            <View style={styles.modalButtonsContainer}>
              {gameWon ? (
                <>
                  {!isLastExercise && (
                    <TouchableOpacity 
                      style={[styles.modalButton, { backgroundColor: '#4CAF50' }]} 
                      onPress={handleModalAction}
                    >
                      <Text style={styles.modalButtonText}>Continue</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#F44336' }]} 
                  onPress={handleModalAction}
                >
                  <Text style={styles.modalButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFF0F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#999', textAlign: 'center' },
  
  // Header (Simple like Flashcard and TripleBlast)
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#E1F5FE',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#039BE5',
    textAlign: 'center',
  },

  // Grid
  scrollContent: { padding: 10, paddingBottom: 40 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  cardWrapper: {
    width: '30%', // Same as TripleBlast - 3 Columns (3x4 grid)
    aspectRatio: 0.75, // Taller cards (height is 1.33x width)
    marginBottom: 10,
    minHeight: 100,
    minWidth: 60,
  },
  cardFace: {
    width: '100%', height: '100%', borderRadius: 16, position: 'absolute', // Same borderRadius as TripleBlast
    backfaceVisibility: 'hidden', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FFF', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 4, // Same shadow as TripleBlast
    borderWidth: 2, borderColor: 'transparent', // Border like TripleBlast
  },
  cardBack: {
    // Styling handled by gradient
  },
  cardGradient: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardBackText: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: '#FFF',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  cardFront: { 
    borderWidth: 2, 
    borderColor: 'transparent', // Same as TripleBlast
    padding: 5, // Same padding as TripleBlast
    backgroundColor: '#FFFFFF',
  },
  
  // Content
  contentContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  cardText: { fontSize: 11, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  cardImage: { width: '90%', height: '90%', borderRadius: 4 },
  matchedContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 30, alignItems: 'center', width: width * 0.8, elevation: 10 },
  modalAnim: { width: 150, height: 150 },
  modalTitle: { fontSize: 26, fontWeight: 'bold', marginVertical: 10 },
  modalMessage: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 20 },
  modalButtonsContainer: { flexDirection: 'row', gap: 15, width: '100%', justifyContent: 'center' },
  modalButton: { paddingVertical: 12, paddingHorizontal: 40, borderRadius: 25 },
  modalButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default MemoryPair;