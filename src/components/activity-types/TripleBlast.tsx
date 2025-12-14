import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';
import { ActivityComponentProps, MultiLingualText } from './types';
import { useResponsive } from '../../utils/responsive';
import { getCloudFrontUrl, getImageUrl as getImageUrlHelper } from '../../utils/awsUrlHelper';
import apiService from '../../services/api';

const { width } = Dimensions.get('window');

// --- THEME CONSTANTS ---
const COLORS = {
  bg: '#E0F7FA', 
  cardBase: '#FFFFFF',
  cardSelected: '#FFF9C4', 
  cardMatched: '#C8E6C9', 
  cardError: '#FFCDD2', 
  text: '#37474F',
  primary: '#039BE5',
  accent: '#FFB300',
  success: '#43A047',
  error: '#E53935',
};

interface Tile {
  id: string;
  content: MultiLingualText | { [key: string]: string | null };
  imageUrl?: any | null;
}

interface AnswerGroup {
  groupId: string;
  tileIds: string[];
}

interface TripleBlastContent {
  contentType: 'word' | 'image';
  instruction: MultiLingualText;
  tiles: Tile[];
  answers: AnswerGroup[];
}

interface GameTile extends Tile {
  status: 'default' | 'selected' | 'hidden' | 'matched_temp' | 'incorrect_temp';
}

const TripleBlast: React.FC<ActivityComponentProps> = ({
  currentLang = 'ta',
  activityId,
  onComplete,
  currentExerciseIndex: propExerciseIndex = 0,
  onExerciseComplete,
}) => {
  const responsive = useResponsive();
  const [loading, setLoading] = useState(true);
  const [allExercises, setAllExercises] = useState<TripleBlastContent[]>([]);
  const [tiles, setTiles] = useState<GameTile[]>([]);
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [showTimeout, setShowTimeout] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  
  // Animation Refs
  const confettiRef = useRef<LottieView>(null);
  const failRef = useRef<LottieView>(null);
  const congratulationsRef = useRef<LottieView>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sound states
  const [congratulationSound, setCongratulationSound] = useState<Audio.Sound | null>(null);
  const [sadSound, setSadSound] = useState<Audio.Sound | null>(null);
  const [correctSound, setCorrectSound] = useState<Audio.Sound | null>(null);

  // Helper: Get text
  const getText = (content: any): string => {
    if (!content) return '';
    if (typeof content === 'object') {
      return content[currentLang] || content.en || content.ta || content.si || '';
    }
    return String(content);
  };

  // Helper: Get image URL
  const getTileImageUrl = (tile: Tile): string | null => {
    if (tile.imageUrl) {
        const urlData = typeof tile.imageUrl === 'string' ? tile.imageUrl : (tile.imageUrl as any);
        const url = getImageUrlHelper(urlData, currentLang);
        if (url) return url;
    }
    const contentStr = getText(tile.content);
    if (contentStr && (contentStr.includes('/') || contentStr.includes('.'))) {
        return getCloudFrontUrl(contentStr);
    }
    return null;
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

  const playWrongSound = async () => {
    try {
      if (sadSound) {
        await sadSound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/wrong.mp3')
      );
      setSadSound(newSound);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync();
          setSadSound(null);
        }
      });
    } catch (err) {}
  };

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

  // 1. Fetch Data
  useEffect(() => {
    const fetchExercises = async () => {
      if (!activityId) { setLoading(false); return; }
      try {
        setLoading(true);
        const exercises = await apiService.getExercisesByActivityId(activityId);
        if (exercises && exercises.length > 0) {
           const sorted = exercises.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
           const processedContent: TripleBlastContent[] = sorted.map(ex => {
               try {
                   const data = JSON.parse(ex.jsonData);
                   return {
                       contentType: (data.contentType || 'word').toLowerCase(),
                       instruction: data.instruction || {},
                       tiles: data.data || data.tiles || [],
                       answers: data.answers || data.answerGroups || []
                   } as TripleBlastContent;
               } catch(e) { return null; }
           }).filter((item): item is TripleBlastContent => item !== null);
           if (processedContent.length > 0) setAllExercises(processedContent);
        }
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    fetchExercises();
  }, [activityId]);

  // 2. Game Logic
  const currentContent = allExercises[propExerciseIndex];

  const startGame = () => {
    if (!currentContent) return;

    // Setup Tiles
    const gameTiles: GameTile[] = currentContent.tiles.map((t, i) => ({
        ...t,
        id: `${t.id || i}-${propExerciseIndex}`, 
        status: 'default'
    }));

    // Shuffle
    for (let i = gameTiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameTiles[i], gameTiles[j]] = [gameTiles[j], gameTiles[i]];
    }

    setTiles(gameTiles);
    setSelectedTileIds([]);
    setScore(0);
    setTimeRemaining(60); 
    setExerciseCompleted(false);
    setShowTimeout(false);

    // Start Timer
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
            if (prev <= 1) {
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                setShowTimeout(true);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
  };

  // Initial Start
  useEffect(() => {
    startGame();
    return () => { 
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (congratulationSound) congratulationSound.unloadAsync();
      if (sadSound) sadSound.unloadAsync();
      if (correctSound) correctSound.unloadAsync();
    };
  }, [propExerciseIndex, currentContent]);

  // Handle Retry Button Click
  const handleRetry = () => {
      startGame(); // Resets timer, shuffles tiles, clears score
  };

  // 3. Interactions
  const handleTilePress = (tile: GameTile) => {
      if (tile.status === 'hidden' || tile.status === 'matched_temp' || selectedTileIds.length >= 3) return;

      if (tile.status === 'selected') {
          setSelectedTileIds(prev => prev.filter(id => id !== tile.id));
          setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, status: 'default' } : t));
      } else {
          const newSelection = [...selectedTileIds, tile.id];
          setSelectedTileIds(newSelection);
          setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, status: 'selected' } : t));
          
          if (newSelection.length === 3) {
              checkMatch(newSelection);
          }
      }
  };

  const checkMatch = (selection: string[]) => {
      if (!currentContent) return;
      const answers = currentContent.answers || [];
      const isCorrectGroup = answers.some(group => 
          selection.every(id => group.tileIds.includes(id))
      );

      let isIdenticalMatch = false;
      if (!isCorrectGroup) {
          const firstTile = tiles.find(t => t.id === selection[0]);
          if (currentContent.contentType === 'image') {
               const firstImg = getTileImageUrl(firstTile!);
               isIdenticalMatch = selection.every(id => getTileImageUrl(tiles.find(t => t.id === id)!) === firstImg);
          } else {
               const firstTxt = getText(firstTile?.content);
               isIdenticalMatch = selection.every(id => getText(tiles.find(t => t.id === id)?.content) === firstTxt);
          }
      }

      if (isCorrectGroup || isIdenticalMatch) {
          handleMatchSuccess(selection);
      } else {
          handleMatchFailure(selection);
      }
  };

  const handleMatchSuccess = (selection: string[]) => {
      playCongratulationSound();
      playCorrectSound();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      if (confettiRef.current) confettiRef.current.play();

      setTiles(prev => prev.map(t => selection.includes(t.id) ? { ...t, status: 'matched_temp' } : t));
      setScore(prev => prev + 10);

      setTimeout(() => {
          setTiles(prev => prev.map(t => selection.includes(t.id) ? { ...t, status: 'hidden' } : t));
          setSelectedTileIds([]);
          checkCompletion();
      }, 1000);
  };

  const handleMatchFailure = (selection: string[]) => {
      playWrongSound();
      setShowFail(true);
      setTimeout(() => setShowFail(false), 1500);
      if (failRef.current) failRef.current.play();

      setTiles(prev => prev.map(t => selection.includes(t.id) ? { ...t, status: 'incorrect_temp' } : t));

      setTimeout(() => {
          setTiles(prev => prev.map(t => selection.includes(t.id) ? { ...t, status: 'default' } : t));
          setSelectedTileIds([]);
      }, 1000);
  };

  const checkCompletion = () => {
      setTiles(currentTiles => {
          const visible = currentTiles.filter(t => t.status !== 'hidden' && t.status !== 'matched_temp');
          if (visible.length === 0) {
              if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
              setExerciseCompleted(true);
              playCongratulationSound();
              setShowCongratulations(true);
              if (congratulationsRef.current) congratulationsRef.current.play();

              setTimeout(() => {
                  setShowCongratulations(false);
                  if (onExerciseComplete) onExerciseComplete();
                  else if (onComplete) onComplete();
              }, 3000);
          }
          return currentTiles;
      });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Game...</Text>
      </View>
    );
  }

  if (!currentContent) {
      return <View style={styles.errorContainer}><Text>No Content Available</Text></View>;
  }

  const isImageMode = currentContent.contentType === 'image';

  return (
    <View style={styles.container}>
      
      {/* --- HEADER (Simple Instruction) --- */}
      {getText(currentContent.instruction) ? (
        <View style={styles.header}>
          <Text style={styles.instructionText}>
            {getText(currentContent.instruction)}
          </Text>
        </View>
      ) : null}

      {/* --- GAME GRID --- */}
      <View style={styles.gridContainer}>
         {!exerciseCompleted && (
            <View style={styles.grid}>
                {tiles.map((tile) => {
                    if (tile.status === 'hidden') return <View key={tile.id} style={styles.hiddenTile} />;

                    const imgUrl = isImageMode ? getTileImageUrl(tile) : null;
                    const txtContent = !isImageMode ? getText(tile.content) : null;

                    return (
                        <TouchableOpacity
                            key={tile.id}
                            style={[
                                styles.card,
                                tile.status === 'selected' && styles.cardSelected,
                                tile.status === 'matched_temp' && styles.cardMatched,
                                tile.status === 'incorrect_temp' && styles.cardError,
                            ]}
                            onPress={() => handleTilePress(tile)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardInnerContent}>
                                {isImageMode && imgUrl ? (
                                    <Image source={{ uri: imgUrl }} style={styles.cardImage} resizeMode="contain" />
                                ) : (
                                    <Text 
                                        style={styles.cardText} 
                                        adjustsFontSizeToFit 
                                        numberOfLines={2}
                                        minimumFontScale={0.5} // Helps long text fit
                                    >
                                        {txtContent}
                                    </Text>
                                )}
                            </View>
                            
                            {/* Checkmark */}
                            {tile.status === 'selected' && (
                                <View style={styles.checkBadge}>
                                    <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
         )}
      </View>

      {/* --- OVERLAYS --- */}
      {showConfetti && (
        <View style={styles.overlay} pointerEvents="none">
           <LottieView
             ref={confettiRef}
             source={require('../../../assets/animations/Confetti.json')}
             autoPlay loop={false}
             style={styles.fullScreenAnim}
           />
        </View>
      )}

      {showFail && (
          <View style={styles.overlay} pointerEvents="none">
             <LottieView
               ref={failRef}
               source={require('../../../assets/animations/wrong.json')}
               autoPlay loop={false}
               style={{ width: 400, height: 400 }}
             />
          </View>
      )}

      {/* --- TIMEOUT MODAL (Retry Only) --- */}
      <Modal visible={showTimeout} transparent animationType="fade">
          <View style={styles.modalBg}>
              <View style={styles.modalCard}>
                  <Text style={{ fontSize: 50 }}>⏰</Text>
                  <Text style={styles.modalTitle}>Time's Up!</Text>
                  <Text style={styles.modalSub}>Don't give up, try again!</Text>
                  
                  {/* Single Retry Button */}
                  <TouchableOpacity 
                    style={[styles.modalBtn, { backgroundColor: COLORS.accent }]} 
                    onPress={handleRetry}
                  >
                      <Text style={styles.modalBtnText}>Retry 🔄</Text>
                  </TouchableOpacity>

              </View>
          </View>
      </Modal>

      {/* --- CONGRATULATIONS MODAL --- */}
      <Modal visible={showCongratulations} transparent animationType="slide">
          <View style={styles.modalBg}>
             <View style={styles.modalCard}>
                <LottieView
                  ref={congratulationsRef}
                  source={require('../../../assets/animations/Happy boy.json')}
                  autoPlay loop
                  style={{ width: 150, height: 150 }}
                />
                <Text style={[styles.modalTitle, { color: COLORS.success }]}>Awesome! 🎉</Text>
                <Text style={styles.modalSub}>Level Complete!</Text>
             </View>
          </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  // Header (Simple like Flashcard - one line)
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
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  hiddenTile: {
    width: '30%',
    aspectRatio: 1, 
  },
  card: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.cardBase,
    borderRadius: 16,
    padding: 5, // Reduced padding to give text more room
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardInnerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  cardSelected: {
    backgroundColor: COLORS.cardSelected,
    borderColor: COLORS.accent,
    transform: [{ scale: 1.05 }],
    elevation: 6,
  },
  cardMatched: {
    backgroundColor: COLORS.cardMatched,
    borderColor: COLORS.success,
    transform: [{ scale: 1.1 }],
  },
  cardError: {
    backgroundColor: COLORS.cardError,
    borderColor: COLORS.error,
  },
  // TEXT CENTERING FIX
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    textAlignVertical: 'center', // Helps on Android
    includeFontPadding: false, // Helps centering
  },
  cardImage: {
    width: '90%',
    height: '90%',
  },
  checkBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Utils & Modals
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.primary, fontWeight: 'bold' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  fullScreenAnim: { width: '100%', height: '100%' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#FFF', width: '80%', padding: 30, borderRadius: 25, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginVertical: 10 },
  modalSub: { color: '#78909C', textAlign: 'center', marginBottom: 20 },
  modalBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  modalBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});

export default TripleBlast;