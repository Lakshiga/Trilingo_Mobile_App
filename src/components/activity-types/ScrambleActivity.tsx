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
  Animated,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { ActivityComponentProps, MultiLingualText } from './types';
import { useResponsive } from '../../utils/responsive';
import { useTheme } from '../../theme/ThemeContext';
import { getCloudFrontUrl, getImageUrl as getImageUrlHelper } from '../../utils/awsUrlHelper';
import apiService from '../../services/api';

const { width } = Dimensions.get('window');

// --- INTERFACES ---

interface HintData {
  hintText: MultiLingualText;
  hintImageUrl?: string;
  hintAudioUrl?: MultiLingualText;
}

interface TaskData {
  taskId: string;
  type: string;
  hint: HintData;
  scrambled: { [key: string]: string[] }; // Array of strings for each lang
  answer: MultiLingualText;
}

interface ScrambleContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  taskData: TaskData;
}

interface Tile {
  id: number; // Unique ID for every tile
  letter: string;
  isSelected: boolean;
}

const ScrambleActivity: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
  activityId,
  currentExerciseIndex = 0,
  onExerciseComplete,
}) => {
  const responsive = useResponsive();
  const { theme } = useTheme();

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [allExercises, setAllExercises] = useState<ScrambleContent[]>([]);
  
  // Game State
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [answerSlots, setAnswerSlots] = useState<(Tile | null)[]>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  
  // Media State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [congratulationSound, setCongratulationSound] = useState<Audio.Sound | null>(null);
  const [wrongSound, setWrongSound] = useState<Audio.Sound | null>(null);
  const [correctSound, setCorrectSound] = useState<Audio.Sound | null>(null);

  // Refs
  const winAnimationRef = useRef<LottieView>(null);
  const errorAnimationRef = useRef<LottieView>(null);
  const autoCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get Current Data
  const scrambleData = allExercises[currentExerciseIndex] || (content as ScrambleContent);
  const isLastExercise = currentExerciseIndex >= (allExercises.length - 1);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchExercises = async () => {
      if (!activityId) {
        if (content) setAllExercises([content as ScrambleContent]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const exercises = await apiService.getExercisesByActivityId(activityId);
        
        if (exercises && exercises.length > 0) {
          const sorted = exercises.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
          const parsedExercises: ScrambleContent[] = [];
          
          sorted.forEach(ex => {
            try {
              if (ex.jsonData) parsedExercises.push(JSON.parse(ex.jsonData));
            } catch (e) { console.error("JSON Parse Error", e); }
          });
          
          setAllExercises(parsedExercises);
        }
      } catch (error) {
        console.error("Fetch Error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
    
    return () => {
      if (sound) sound.unloadAsync();
      if (congratulationSound) congratulationSound.unloadAsync();
      if (wrongSound) wrongSound.unloadAsync();
      if (correctSound) correctSound.unloadAsync();
      if (autoCheckTimeout.current) clearTimeout(autoCheckTimeout.current);
    };
  }, [activityId]);

  // Auto-check whenever all slots are filled and status is idle
  useEffect(() => {
    const allFilled = answerSlots.length > 0 && !answerSlots.some(slot => slot === null);
    if (status === 'idle' && allFilled) {
      if (autoCheckTimeout.current) clearTimeout(autoCheckTimeout.current);
      autoCheckTimeout.current = setTimeout(() => {
        checkAnswer();
      }, 200);
    }
    return () => {
      if (autoCheckTimeout.current) clearTimeout(autoCheckTimeout.current);
    };
  }, [answerSlots, status]);

  // --- 2. GAME INITIALIZATION ---
  useEffect(() => {
    if (scrambleData?.taskData) {
      initializeGame();
    }
  }, [scrambleData, currentLang]);

  const initializeGame = () => {
    setStatus('idle');
    setShowWinModal(false);
    setShowErrorModal(false);

    // 1. Get Answer String
    const answerText = getText(scrambleData.taskData.answer);
    
    // 2. Get Scrambled Array (Handle Tamil array correctly)
    const scrambledObj = scrambleData.taskData.scrambled;
    // @ts-ignore - Dynamic key access
    let scrambledArr: string[] = scrambledObj[currentLang] || scrambledObj.en || [];
    
    // Fallback if scrambled is not an array but a string (legacy data)
    if (typeof scrambledArr === 'string') {
        scrambledArr = (scrambledArr as string).split('');
    }

    // If scrambled letters are missing, fall back to answer text
    if (!scrambledArr || scrambledArr.length === 0) {
      scrambledArr = answerText ? answerText.split('') : [];
    }

    // Slots should match exactly the scrambled letters count; if still empty, use answer length
    const slotsLength = scrambledArr.length > 0
      ? scrambledArr.length
      : (answerText ? answerText.length : 0);

    // 3. Create Tiles (Unique IDs are crucial for duplicates like "P", "P")
    const newTiles: Tile[] = scrambledArr.map((char, index) => ({
      id: index,
      letter: char,
      isSelected: false,
    }));

    // 4. Create Empty Slots (Length based on Answer or Scrambled count)
    // Prefer answer length to ensure auto-correction triggers
    setTiles(newTiles);
    setAnswerSlots(Array(slotsLength).fill(null));
  };

  // --- 3. HELPER FUNCTIONS ---

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    // @ts-ignore
    return text[currentLang] || text.en || text.ta || '';
  };

  const getMediaUrl = (obj: any): string | null => {
    if (!obj) return null;
    try {
      const url = getImageUrlHelper(obj, currentLang as 'en' | 'ta' | 'si');
      if (url) return url;
    } catch (e) {}
    
    // Fallback for direct string paths in JSON
    if (typeof obj === 'string') {
        return obj.startsWith('http') ? obj : getCloudFrontUrl(obj);
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
        require('../../../assets/sounds/wrong.wav')
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

  const playHintAudio = async () => {
    const audioObj = scrambleData.taskData.hint.hintAudioUrl;
    // @ts-ignore
    const audioUrl = audioObj ? (audioObj[currentLang] || audioObj.en) : null;
    
    if (!audioUrl) return;

    const finalUrl = getCloudFrontUrl(audioUrl);
    try {
      if (sound) await sound.unloadAsync();
      if (!finalUrl) return;
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: finalUrl });
      setSound(newSound);
      await newSound.playAsync();
    } catch (e) {}
  };

  // --- 4. GAME LOGIC ---

  const handleTilePress = (tile: Tile) => {
    if (tile.isSelected || status === 'correct') return;

    // Find first empty slot
    const emptyIndex = answerSlots.findIndex(slot => slot === null);
    
    if (emptyIndex !== -1) {
      // Update Slots
      const newSlots = [...answerSlots];
      newSlots[emptyIndex] = tile;
      setAnswerSlots(newSlots);

      // Mark Tile as Selected
      setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, isSelected: true } : t));
      
      // Reset Error Status if they start typing again
      if (status === 'wrong') {
        setStatus('idle');
        setShowErrorModal(false);
      }

      // Auto-check when all slots are filled
      const allFilled = !newSlots.some(slot => slot === null);
      if (allFilled) {
        setTimeout(() => {
          checkAnswer();
        }, 300); // Small delay for smooth UX
      }
    }
  };

  const handleSlotPress = (index: number) => {
    if (status === 'correct') return;
    const tileToRemove = answerSlots[index];
    
    if (tileToRemove) {
      // Clear Slot
      const newSlots = [...answerSlots];
      newSlots[index] = null;
      setAnswerSlots(newSlots);

      // Mark Tile as Available
      setTiles(prev => prev.map(t => t.id === tileToRemove.id ? { ...t, isSelected: false } : t));
      
      if (status === 'wrong') {
        setStatus('idle');
        setShowErrorModal(false);
      }
    }
  };

  const checkAnswer = () => {
    // 1. Check if all slots filled
    if (answerSlots.some(slot => slot === null)) return;

    // 2. Build User Word
    const userWord = answerSlots.map(t => t?.letter || '').join('');
    const correctWord = getText(scrambleData.taskData.answer); // Case sensitive? Usually logic handles casing

    // 3. Compare (Normalize if needed)
    if (userWord.trim().toLowerCase() === correctWord.trim().toLowerCase()) {
      setStatus('correct');
      if (isLastExercise) {
        // Last exercise: Happy boy + congratulation.wav
        playCongratulationSound();
        setShowWinModal(true);
        setTimeout(() => {
          if(winAnimationRef.current) winAnimationRef.current.play();
        }, 100);
        setTimeout(() => {
          setShowWinModal(false);
          if (onComplete) onComplete && onComplete();
          else if (onExerciseComplete) onExerciseComplete();
        }, 3500);
      } else {
        // Other exercises: Confetti + correct.wav
        playCorrectSound();
        setShowWinModal(true);
        setTimeout(() => {
          if(winAnimationRef.current) winAnimationRef.current.play();
        }, 100);
        setTimeout(() => {
          setShowWinModal(false);
          if (onExerciseComplete) onExerciseComplete();
          else if (onComplete) onComplete();
        }, 2500);
      }
    } else {
      setStatus('wrong');
      playWrongSound();
      setShowErrorModal(true);
      setTimeout(() => {
        if(errorAnimationRef.current) errorAnimationRef.current.play();
      }, 100);
    }
  };

  const handleNext = () => {
    setShowWinModal(false);
    if (isLastExercise) {
      if (onComplete) onComplete();
    } else {
      if (onExerciseComplete) onExerciseComplete();
    }
  };

  const handleRetry = () => {
    setShowErrorModal(false);
    setStatus('idle');
    initializeGame();
  };

  // --- RENDER ---

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#FFCA28" /></View>;
  }

  if (!scrambleData) {
    return <View style={styles.centered}><Text>No data available</Text></View>;
  }

  const hintImg = getMediaUrl(scrambleData.taskData.hint.hintImageUrl);
  const hintText = getText(scrambleData.taskData.hint.hintText);

  return (
    <View style={styles.container}>
      {/* Instruction Header (like Flashcard) */}
      {getText(scrambleData.instruction) ? (
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            {getText(scrambleData.instruction)}
          </Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Hint Card */}
        <View style={styles.hintCard}>
          {hintImg && (
            <Image 
              source={{ uri: hintImg }} 
              style={styles.hintImage} 
              resizeMode="contain" 
            />
          )}
          
          <View style={styles.hintContent}>
             <Text style={styles.hintText}>{hintText}</Text>
             {scrambleData.taskData.hint.hintAudioUrl && (
               <TouchableOpacity style={styles.audioBtn} onPress={playHintAudio}>
                 <MaterialIcons name="volume-up" size={24} color="#FFF" />
               </TouchableOpacity>
             )}
          </View>
        </View>

        {/* Answer Slots Area */}
        <View style={styles.slotsContainer}>
          {answerSlots.map((slot, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={() => handleSlotPress(index)}
              style={[
                styles.slot,
                slot ? styles.slotFilled : styles.slotEmpty,
                status === 'correct' && styles.slotCorrect,
                status === 'wrong' && styles.slotWrong
              ]}
            >
              <Text style={[
                styles.slotText,
                status === 'correct' && { color: '#FFF' }
              ]}>
                {slot?.letter || ''}
              </Text>
              
              {/* Underline for empty slots */}
              {!slot && <View style={styles.slotLine} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Available Tiles Area */}
        <View style={styles.tilesContainer}>
          {tiles.map((tile) => (
            <TouchableOpacity
              key={tile.id}
              activeOpacity={0.8}
              onPress={() => handleTilePress(tile)}
              disabled={tile.isSelected}
              style={[
                styles.tile,
                tile.isSelected && styles.tileHidden // Visually hide but keep layout
              ]}
            >
              <LinearGradient
                colors={['#E3F2FD', '#64B5F6', '#1E88E5']}
                style={styles.tileGradient}
              >
                <Text style={styles.tileText}>{tile.letter}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showWinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LottieView
              ref={winAnimationRef}
              source={
                isLastExercise
                  ? require('../../../assets/animations/Happy boy.json')
                  : require('../../../assets/animations/Confetti.json')
              }
              autoPlay={false}
              loop={false}
              style={styles.lottie}
            />
            <Text style={styles.modalTitle}>Great Job!</Text>
            <Text style={styles.modalSub}>You spelled it correctly.</Text>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={showErrorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LottieView
              ref={errorAnimationRef}
              source={require('../../../assets/animations/wrong.json')}
              autoPlay={false}
              loop={false}
              style={styles.lottie}
            />
            <Text style={styles.modalTitleError}>Try Again!</Text>
            <Text style={styles.modalSub}>That's not quite right.</Text>
            
            <TouchableOpacity style={styles.modalButton} onPress={handleRetry}>
              <Text style={styles.modalBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E1', // Light Amber BG
  },
  centered: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Instruction Header (like Flashcard/FillInTheBlanks)
  instructionContainer: {
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

  // Hint Section
  hintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width:0, height:2},
  },
  hintImage: {
    width: 150,
    height: 150,
    marginBottom: 15,
  },
  hintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  hintText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  audioBtn: {
    backgroundColor: '#FFCA28',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },

  // Slots (Answer Area)
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 40,
    minHeight: 60,
  },
  slot: {
    width: 50,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#FFF', // Default empty bg
  },
  slotEmpty: {
    backgroundColor: 'transparent',
  },
  slotFilled: {
    backgroundColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width:0, height:2},
    borderWidth: 2,
    borderColor: '#FFCA28',
  },
  slotLine: {
    position: 'absolute',
    bottom: 5,
    width: 40,
    height: 3,
    backgroundColor: '#CCC',
    borderRadius: 2,
  },
  slotText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  slotCorrect: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  slotWrong: {
    borderColor: '#F44336',
    borderWidth: 2,
    backgroundColor: '#FFEBEE',
  },

  // Tiles (Jumbled Area)
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  tile: {
    width: 55,
    height: 55,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width:0, height:3},
  },
  tileHidden: {
    opacity: 0, // Keeps layout space but invisible
  },
  tileGradient: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E88E5',
  },
  tileText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0D47A1',
  },


  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: width * 0.85,
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
  },
  lottie: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  modalTitleError: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 5,
  },
  modalSub: {
    fontSize: 16,
    color: '#555',
    marginBottom: 25,
  },
  modalButton: {
    backgroundColor: '#FFCA28',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 3,
  },
  modalBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default ScrambleActivity;