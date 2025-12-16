import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { getImageUrl, getAudioUrl } from '../../utils/awsUrlHelper';
import { ActivityComponentProps, Language, MultiLingualText } from './types';
import { useTheme } from '../../theme/ThemeContext';

// --- TYPES (Kept same as your code) ---
interface TaskContent {
  word: MultiLingualText;
  audioUrl: MultiLingualText;
  imageUrl: MultiLingualText | string;
}

interface Task {
  taskId: string;
  taskType: 'pronunciation';
  content: TaskContent;
}

interface PronunciationContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  task: Task;
}

interface PronunciationResult {
  recognizedText: string;
  isCorrect: boolean;
  accuracyScore: number;
  feedback: string;
}

const PronunciationActivity: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
}) => {
  const { theme } = useTheme();
  
  // Audio & Recording State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  
  // UI State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // Safely extract data
  const pronunciationData = content as PronunciationContent | undefined;
  const task = pronunciationData?.task;

  // --- HELPER FUNCTIONS ---
  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  const getResolvedAudioUrl = (): string | null => {
    if (!task?.content?.audioUrl) return null;
    return getAudioUrl(task.content.audioUrl, currentLang as 'en' | 'ta' | 'si');
  };

  const getResolvedImageUrl = (): string | null => {
    if (!task?.content?.imageUrl) return null;
    return getImageUrl(task.content.imageUrl, currentLang as 'en' | 'ta' | 'si');
  };

  // --- AUDIO LOGIC ---

  // 1. Play the Target Word Audio
  const playTargetAudio = async () => {
    if (!task?.content) return;
    const audioUrl = getResolvedAudioUrl();
    if (!audioUrl) return;

    try {
      // Stop any existing sound
      if (sound) {
        await sound.unloadAsync();
      }

      // Configure audio for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Audio Error', 'Could not play the pronunciation audio.');
    }
  };

  // 2. Start Recording Microphone
  const startRecording = async () => {
    try {
      // Check Permissions
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        const perm = await requestPermission();
        if (perm.status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow microphone access to practice pronunciation.');
          return;
        }
      }

      setRecordingError(null);
      setHasRecorded(false);
      setResult(null);

      // Stop playback if running
      if (sound) {
        await sound.stopAsync();
        setIsPlaying(false);
      }

      // Configure audio for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
      
    } catch (err) {
      console.error('Failed to start recording', err);
      setRecordingError('Could not access microphone.');
    }
  };

  // 3. Stop Recording & Trigger Evaluation
  const stopRecording = async () => {
    console.log('Stopping recording..');
    setRecording(null);
    setIsRecording(false);
    
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI(); 
        console.log('Recording stopped and stored at', uri);
        
        // Once stopped, we evaluate
        evaluatePronunciation(uri);
      }
    } catch (error) {
      console.error('Error stopping recording', error);
      // Even if error, try to evaluate (simulation fallback)
      evaluatePronunciation(null);
    }
  };

  // 4. Evaluation Logic (Mocked for now, ready for API)
  const evaluatePronunciation = async (audioUri: string | null) => {
    setIsChecking(true);
    setHasRecorded(true);

    // --- REAL API INTEGRATION NOTE ---
    // Here you would upload `audioUri` to your backend using FormData.
    // const formData = new FormData();
    // formData.append('file', { uri: audioUri, type: 'audio/m4a', name: 'audio.m4a' });
    // const response = await api.checkPronunciation(formData);

    // --- MOCK SIMULATION ---
    setTimeout(() => {
      const targetWord = getText(task?.content.word);
      
      // Random Logic for Demo Purposes
      const randomScore = Math.floor(Math.random() * (100 - 60 + 1) + 60); // Random 60-100
      const isSuccess = randomScore > 75;

      const mockResult: PronunciationResult = {
        recognizedText: targetWord, // Simulating they said it right
        isCorrect: isSuccess,
        accuracyScore: randomScore,
        feedback: isSuccess 
          ? "Perfect! You sounded just like a native speaker." 
          : "Good try! Listen closely to the audio and try to shape your mouth the same way."
      };

      setResult(mockResult);
      setIsChecking(false);
    }, 2000); // 2 second delay to feel like "Thinking"
  };

  const retryPronunciation = () => {
    setResult(null);
    setHasRecorded(false);
    setRecordingError(null);
    setIsChecking(false);
  };

  const handleContinue = () => {
    if (onComplete) onComplete();
  };

  // Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
      if (recording) recording.stopAndUnloadAsync();
    };
  }, [sound, recording]);


  // --- RENDER ---
  if (!pronunciationData || !task || !task.content) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Activity content unavailable</Text>
      </View>
    );
  }

  const imageUrl = getResolvedImageUrl();
  const imageSource = imageUrl ? { uri: imageUrl } : null;

  return (
    <LinearGradient colors={theme.headerGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getText(pronunciationData.title)}</Text>
        <Text style={styles.instruction}>{getText(pronunciationData.instruction)}</Text>
      </View>

      <View style={styles.content}>
        
        {/* IMAGE */}
        <View style={styles.imageContainer}>
          {imageSource ? (
            <Image source={imageSource} style={styles.wordImage} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="image" size={50} color="rgba(255,255,255,0.5)" />
            </View>
          )}
        </View>

        {/* TARGET WORD */}
        <Text style={styles.targetWord}>{getText(task.content.word)}</Text>

        {/* PLAY BUTTON */}
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={playTargetAudio}
          disabled={isRecording || isChecking}
        >
          <MaterialIcons
            name={isPlaying ? 'pause' : 'volume-up'}
            size={32}
            color="#0066CC" // Blue icon
          />
          <Text style={styles.playButtonText}>
            {isPlaying ? 'Listening...' : 'Listen First'}
          </Text>
        </TouchableOpacity>

        {/* --- DYNAMIC BOTTOM SECTION --- */}
        <View style={styles.actionArea}>
          
          {/* STATE 1: LOADING / CHECKING */}
          {isChecking && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.checkingText}>Analyzing your voice...</Text>
            </View>
          )}

          {/* STATE 2: SHOW RESULTS */}
          {!isChecking && hasRecorded && result && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <MaterialIcons 
                  name={result.isCorrect ? "check-circle" : "info"} 
                  size={40} 
                  color={result.isCorrect ? "#4CAF50" : "#FF9800"} 
                />
                <Text style={[styles.resultTitle, {color: result.isCorrect ? "#4CAF50" : "#FF9800"}]}>
                  {result.isCorrect ? "Great Job!" : "Nice Try!"}
                </Text>
              </View>

              <Text style={styles.accuracyText}>Score: {result.accuracyScore}%</Text>
              
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackText}>{result.feedback}</Text>
              </View>

              <View style={styles.resultButtons}>
                <TouchableOpacity style={styles.retryBtn} onPress={retryPronunciation}>
                   <MaterialIcons name="refresh" size={20} color="#FFF" />
                   <Text style={styles.btnText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
                   <Text style={styles.btnText}>Continue</Text>
                   <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STATE 3: RECORDING INTERFACE (Default) */}
          {!isChecking && !hasRecorded && (
            <View style={styles.micContainer}>
               <TouchableOpacity
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonActive
                ]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <MaterialIcons
                  name={isRecording ? 'stop' : 'mic'}
                  size={48}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <Text style={styles.micLabel}>
                {isRecording ? 'Tap to Stop' : 'Tap Mic & Speak'}
              </Text>
            </View>
          )}

          {recordingError && (
            <Text style={styles.errorText}>{recordingError}</Text>
          )}

        </View>
      </View>
    </LinearGradient>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  imageContainer: {
    height: 180,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  wordImage: {
    width: 200,
    height: 180,
    borderRadius: 15,
    backgroundColor: '#FFF',
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetWord: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 40,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
    marginLeft: 10,
  },
  
  // ACTION AREA (Bottom part)
  actionArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
  },
  
  // MIC STYLES
  micContainer: {
    alignItems: 'center',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B', // Standard Red
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 4},
    marginBottom: 10,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  micButtonActive: {
    backgroundColor: '#D32F2F', // Darker red when recording
    transform: [{ scale: 1.1 }],
  },
  micLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // RESULT STYLES
  resultCard: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  accuracyText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
    marginBottom: 10,
  },
  feedbackBox: {
    backgroundColor: '#F0F4F8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  feedbackText: {
    color: '#334155',
    textAlign: 'center',
    lineHeight: 20,
  },
  resultButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#94A3B8',
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  continueBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0066CC',
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // LOADING
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  checkingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
  },
  
  errorText: {
    color: '#FFCDD2',
    marginTop: 15,
    textAlign: 'center',
  }
});

export default PronunciationActivity;