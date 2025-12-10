import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  PanResponder,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';
import { ActivityComponentProps, MultiLingualText } from './types';
import apiService from '../../services/api';
import { getCloudFrontUrl } from '../../utils/awsUrlHelper';

interface Card {
  id: string;
  matchId: string;
  side: 'A' | 'B';
  type: 'text' | 'image' | 'audio';
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

// User's temporary selection
interface UserMatch {
  cardAId: string;
  cardBId: string;
}

const Matching: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
  activityId,
  currentExerciseIndex = 0,
  onExerciseComplete,
  onExit,
}) => {
  const [allExercises, setAllExercises] = useState<MatchingContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<{ sideA: Card[]; sideB: Card[] }>({ sideA: [], sideB: [] });
  
  // Selection States
  const [selectedCardA, setSelectedCardA] = useState<string | null>(null);
  const [userMatches, setUserMatches] = useState<UserMatch[]>([]); // Stores user's proposed matches
  
  // Validation States
  const [isChecked, setIsChecked] = useState(false); // True when checking starts
  const [showResultModal, setShowResultModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [score, setScore] = useState(0);
  const [isPassed, setIsPassed] = useState(false);
  const successAnimationRef = useRef<LottieView>(null);
  const errorAnimationRef = useRef<LottieView>(null);

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  // Animations
  const shakeAnims = useRef<{ [key: string]: Animated.Value }>({});
  
  // Refs
  const containerRef = useRef<View | null>(null);
  
  // Data
  const matchingData = allExercises[currentExerciseIndex] || (content as MatchingContent);
  const isLastExercise = currentExerciseIndex >= allExercises.length - 1;

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    const result = text[currentLang] || text.en || text.ta || text.si || '';
    return typeof result === 'string' ? result : String(result || '');
  };

  const getCardContent = (card: Card): string | null => {
    if (card.type === 'text' || card.type === 'audio') {
      return card.content[currentLang] || card.content.en || card.content.ta || card.content.si || null;
    }
    const imagePath = card.content.default || null;
    if (imagePath) {
      return getCloudFrontUrl(imagePath);
    }
    return null;
  };

  const shuffleCards = (cards: Card[]): { sideA: Card[]; sideB: Card[] } => {
    const sideA = cards.filter(c => c.side === 'A');
    const sideB = cards.filter(c => c.side === 'B');
    // Shuffle logic
    const shuffledA = [...sideA].sort(() => Math.random() - 0.5);
    const shuffledB = [...sideB].sort(() => Math.random() - 0.5);
    return { sideA: shuffledA, sideB: shuffledB };
  };

  // Fetch Exercises
  useEffect(() => {
    const fetchExercises = async () => {
      if (!activityId) {
        if (content) setAllExercises([content as MatchingContent]);
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
        const exerciseContents: MatchingContent[] = [];

        sortedExercises.forEach((exercise) => {
          try {
            if (exercise.jsonData) {
              const parsedData = JSON.parse(exercise.jsonData);
              const title = parsedData.title || { ta: '', en: '', si: '' };
              const instruction = parsedData.instruction || { ta: '', en: '', si: '' };
              const cards = Array.isArray(parsedData.cards) ? parsedData.cards : [];
              if (cards.length > 0) {
                exerciseContents.push({ title, instruction, cards });
              }
            }
          } catch (parseError) {
            console.error('Error parsing exercise JSON:', parseError);
          }
        });
        if (exerciseContents.length > 0) setAllExercises(exerciseContents);
      } catch (error) {
        console.error('Error fetching Matching exercises:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, [activityId]);

  // Init Exercise
  useEffect(() => {
    resetGame();
  }, [matchingData, currentExerciseIndex]);

  const resetGame = () => {
    if (matchingData?.cards && matchingData.cards.length > 0) {
      const shuffled = shuffleCards(matchingData.cards);
      setShuffledCards(shuffled);
      setUserMatches([]);
      setSelectedCardA(null);
      setIsChecked(false);
      setShowResultModal(false);
      setShowSuccessModal(false);
      setScore(0);
      setIsPassed(false);
      
      [...shuffled.sideA, ...shuffled.sideB].forEach(card => {
        if (!shakeAnims.current[card.id]) shakeAnims.current[card.id] = new Animated.Value(0);
      });
    }
  };

  const playAudio = async (audioUrl: string, cardId: string) => {
    try {
      if (sound) await sound.unloadAsync();
      setPlayingAudioId(cardId);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setPlayingAudioId(null);
      });
    } catch (error) {
      setPlayingAudioId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync().catch(console.warn);
    };
  }, [sound]);

  // Play success animation when modal opens
  useEffect(() => {
    if (showSuccessModal && successAnimationRef.current) {
      successAnimationRef.current.play();
    }
  }, [showSuccessModal]);

  // Play error animation when modal opens
  useEffect(() => {
    if (showResultModal && errorAnimationRef.current) {
      errorAnimationRef.current.play();
    }
  }, [showResultModal]);

  // --- Game Logic ---

  const checkResultsWithMatches = (matchesToCheck: UserMatch[]) => {
    setIsChecked(true);
    let calculatedScore = 0;
    let correctCount = 0;
    const totalPairs = shuffledCards.sideA.length;

    // Ensure we have the right number of matches
    if (matchesToCheck.length !== totalPairs) {
        setScore(0);
        setIsPassed(false);
        setTimeout(() => {
            setShowResultModal(true);
        }, 1000);
        return;
    }

    matchesToCheck.forEach(match => {
        const cardA = shuffledCards.sideA.find(c => c.id === match.cardAId);
        const cardB = shuffledCards.sideB.find(c => c.id === match.cardBId);
        
        if (cardA && cardB) {
            const isCorrect = cardA.matchId === cardB.matchId;
            if (isCorrect) {
                calculatedScore += 2; // 2 Points per correct pair
                correctCount++;
            } else {
                // Shake effect for wrong ones
                if (shakeAnims.current[match.cardAId]) startShake(match.cardAId);
                if (shakeAnims.current[match.cardBId]) startShake(match.cardBId);
            }
        }
    });

    const maxScore = totalPairs * 2;
    const passed = calculatedScore === maxScore && correctCount === totalPairs;
    
    setScore(calculatedScore);
    setIsPassed(passed);
    
    if (passed) {
        // All correct - show success animation popup, then auto-navigate
        setTimeout(() => {
            setShowSuccessModal(true);
            // Auto-navigate after animation (2.5 seconds)
            setTimeout(() => {
                setShowSuccessModal(false);
                if (onExerciseComplete) {
                    onExerciseComplete();
                } else if (!isLastExercise && onComplete) {
                    onComplete();
                } else if (isLastExercise && onExit) {
                    onExit();
                } else if (onComplete) {
                    onComplete();
                }
            }, 2500);
        }, 1000);
    } else {
        // Has mistakes - show retry modal with animation
        setTimeout(() => {
            setShowResultModal(true);
        }, 1000);
    }
  };

  const checkResults = () => {
    checkResultsWithMatches(userMatches);
  };

  const startShake = (id: string) => {
    Animated.sequence([
        Animated.timing(shakeAnims.current[id], { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnims.current[id], { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnims.current[id], { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnims.current[id], { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleCardPress = (cardId: string, side: 'A' | 'B') => {
    if (isChecked) return; // Disable interaction after checking

    // Handle Audio Play
    const card = side === 'A' ? shuffledCards.sideA.find(c => c.id === cardId) : shuffledCards.sideB.find(c => c.id === cardId);
    if (card?.type === 'audio') {
        const content = getCardContent(card);
        if (content) playAudio(content, cardId);
        // We still allow selection for audio cards in this logic if needed, 
        // but typically audio is just for playing. 
        // If it's pure audio matching, remove the return.
        if (side === 'A') {
             // Continue to selection
        } else {
             // For Side B audio, we might just play it. 
             // But if it's an audio card to be matched, we need to allow selection.
        }
    }

    if (side === 'A') {
        // If Side A is tapped
        // If already matched, remove the match (Unselect)
        const existingMatchIndex = userMatches.findIndex(m => m.cardAId === cardId);
        if (existingMatchIndex !== -1) {
            const newMatches = [...userMatches];
            newMatches.splice(existingMatchIndex, 1);
            setUserMatches(newMatches);
        }
        
        setSelectedCardA(cardId);
    } else {
        // If Side B is tapped
        if (!selectedCardA) return; // Must select A first

        // Remove any existing match for this Card B (if re-selecting)
        const matchesCleaned = userMatches.filter(m => m.cardBId !== cardId && m.cardAId !== selectedCardA);
        
        const newMatches = [...matchesCleaned, { cardAId: selectedCardA, cardBId: cardId }];
        setUserMatches(newMatches);
        setSelectedCardA(null);

        // Check if all pairs are done
        if (newMatches.length === shuffledCards.sideA.length) {
            // All matched! Trigger validation after a short delay
            // Use the newMatches array directly for validation
            setTimeout(() => {
                checkResultsWithMatches(newMatches);
            }, 500);
        }
    }
  };

  const handleNext = () => {
      setShowResultModal(false);
      setShowSuccessModal(false);
      if (onExerciseComplete) {
          onExerciseComplete();
      } else if (!isLastExercise && onComplete) {
          onComplete();
      } else if (isLastExercise && onExit) {
          onExit();
      } else if (onComplete) {
          onComplete();
      }
  };

  const handleSuccessNext = () => {
      setShowSuccessModal(false);
      if (onExerciseComplete) {
          onExerciseComplete();
      } else if (!isLastExercise && onComplete) {
          onComplete();
      } else if (isLastExercise && onExit) {
          onExit();
      } else if (onComplete) {
          onComplete();
      }
  };

  const handleRetry = () => {
      resetGame();
  };

  // --- Rendering ---

  const renderCard = (card: Card, side: 'A' | 'B') => {
    const isSelected = side === 'A' && selectedCardA === card.id;
    
    // Find if this card is in userMatches
    const match = userMatches.find(m => (side === 'A' ? m.cardAId : m.cardBId) === card.id);
    const isMatched = !!match;

    // Determine status for coloring
    let statusStyle = {};
    let icon = null;

    if (isChecked && isMatched) {
        // Validation Phase
        const fullMatch = userMatches.find(m => m.cardAId === match?.cardAId);
        const cardA = shuffledCards.sideA.find(c => c.id === fullMatch?.cardAId);
        const cardB = shuffledCards.sideB.find(c => c.id === fullMatch?.cardBId);
        
        const isCorrect = cardA && cardB && cardA.matchId === cardB.matchId;

        if (isCorrect) {
            statusStyle = styles.cardCorrect;
            icon = <MaterialIcons name="check-circle" size={24} color="#4CAF50" />;
        } else {
            statusStyle = styles.cardWrong;
            icon = <MaterialIcons name="cancel" size={24} color="#F44336" />;
        }
    } else if (isMatched) {
        // Pending Phase (Matched but not checked)
        statusStyle = styles.cardPending;
    } else if (isSelected) {
        // Selected Phase
        statusStyle = styles.cardSelected;
    }

    const content = getCardContent(card);
    const isPlaying = playingAudioId === card.id;
    const shakeAnim = shakeAnims.current[card.id] || new Animated.Value(0);
    const isImage = card.type === 'image';

    const cardBaseStyle = isImage ? styles.cardImageContainer : styles.card;

    return (
      <Animated.View
        key={card.id}
        style={[styles.cardWrapper, { transform: [{ translateX: shakeAnim }] }]}
      >
        <TouchableOpacity
          style={[cardBaseStyle, statusStyle]}
          onPress={() => handleCardPress(card.id, side)}
          activeOpacity={0.8}
          disabled={isChecked}
        >
          {card.type === 'text' && (
            <Text style={styles.cardText}>{content || ''}</Text>
          )}

          {card.type === 'image' && content ? (
            <View style={styles.imageInnerContainer}>
                <Image 
                    source={{ uri: content }} 
                    style={[styles.cardImage]} 
                    resizeMode="contain"
                />
            </View>
          ) : card.type === 'image' ? (
             <MaterialIcons name="image" size={30} color="#ccc" />
          ) : null}

          {card.type === 'audio' && (
            <View style={styles.audioContainer}>
              <MaterialIcons 
                name={isPlaying ? "volume-up" : "play-circle-filled"} 
                size={32} 
                color={isChecked ? "#555" : (isPlaying ? "#4CAF50" : "#6C63FF")} 
              />
            </View>
          )}

          {/* Status Icon Overlay */}
          {icon && (
            <View style={styles.matchOverlay}>
               {icon}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) return <ActivityIndicator size="large" color="#6C63FF" style={styles.center} />;
  if (!matchingData?.cards?.length) return <Text style={styles.errorText}>No content available</Text>;

  // Calculate max score
  const maxScore = shuffledCards.sideA.length * 2;

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>{getText(matchingData.instruction)}</Text>
      
      <View style={styles.cardsContainer} ref={containerRef}>
        <View style={styles.column}>
          {shuffledCards.sideA.map(card => renderCard(card, 'A'))}
        </View>
        <View style={styles.column}>
          {shuffledCards.sideB.map(card => renderCard(card, 'B'))}
        </View>
      </View>

      {/* SUCCESS MODAL - Congratulations with Animation (Auto-navigate) */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.successModalContent}>
                <LottieView
                    ref={successAnimationRef}
                    source={require('../../../assets/animations/Happy boy.json')}
                    autoPlay={false}
                    loop={false}
                    style={styles.successAnimation}
                />
                <Text style={styles.successTitle}>Congratulations! 🎉</Text>
                <Text style={styles.successMessage}>Perfect Match!</Text>
            </View>
        </View>
      </Modal>

      {/* ERROR MODAL - Keep Trying with Animation and Retry */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.errorModalContent}>
                <LottieView
                    ref={errorAnimationRef}
                    source={require('../../../assets/animations/Sad - Failed.json')}
                    autoPlay={false}
                    loop={false}
                    style={styles.errorAnimation}
                />
                <Text style={styles.errorTitle}>Keep Trying! 💪</Text>
                <Text style={styles.errorMessage}>You have some mistakes.</Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                        <MaterialIcons name="refresh" size={24} color="#FFF" />
                        <Text style={styles.buttonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instruction: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  cardsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  cardWrapper: {
    width: '90%',
    marginBottom: 12,
  },
  // Base Styles
  card: {
    height: 90,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  cardImageContainer: {
    height: 90,
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 0, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    position: 'relative',
  },
  
  // STATE STYLES
  cardSelected: {
    borderColor: '#6C63FF', // Active selection (Blue)
    borderWidth: 2,
    backgroundColor: '#F0F0FF',
  },
  cardPending: {
    borderColor: '#9C27B0', // Paired but waiting for check (Purple)
    borderWidth: 2,
    backgroundColor: '#F3E5F5',
  },
  cardCorrect: {
    borderColor: '#4CAF50', // Correct (Green)
    borderWidth: 2,
    backgroundColor: '#E8F5E9',
  },
  cardWrong: {
    borderColor: '#F44336', // Wrong (Red)
    borderWidth: 2,
    backgroundColor: '#FFEBEE',
  },

  cardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  imageInnerContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 8,
  },
  cardImage: {
    width: '95%',
    height: '95%',
  },
  audioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    elevation: 4,
  },
  
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  successModalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 4,
    borderColor: '#4CAF50',
  },
  successAnimation: {
    width: 180,
    height: 180,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 15,
    marginBottom: 8,
    textShadowColor: 'rgba(76, 175, 80, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  successMessage: {
    fontSize: 20,
    color: '#66BB6A',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorModalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 4,
    borderColor: '#2196F3',
  },
  errorAnimation: {
    width: 180,
    height: 180,
  },
  errorTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 15,
    marginBottom: 8,
    textShadowColor: 'rgba(33, 150, 243, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  errorMessage: {
    fontSize: 20,
    color: '#64B5F6',
    marginBottom: 25,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 5,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginVertical: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    gap: 10,
    elevation: 5,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
});

export default Matching;