import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityComponentProps, Language, MultiLingualText } from './types';
import { useTheme } from '../../theme/ThemeContext';

interface TaskContent {
  word: MultiLingualText;
  audioUrl: MultiLingualText;
  imageUrl: string;
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

const PronunciationActivity: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
}) => {
  const { theme } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);

  const pronunciationData = content as PronunciationContent;
  const task = pronunciationData?.task;

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  const getAudioUrl = (): string | null => {
    if (!task?.content?.audioUrl) return null;
    return task.content.audioUrl[currentLang] || task.content.audioUrl.en || task.content.audioUrl.ta || null;
  };

  const playTargetAudio = async () => {
    const audioUrl = getAudioUrl();
    if (!audioUrl) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const startRecording = async () => {
    try {
      // Note: In a real implementation, you would use expo-av's Recording API
      // For now, this is a placeholder
      setIsRecording(true);
      setHasRecorded(false);
      
      // Simulate recording
      setTimeout(() => {
        setIsRecording(false);
        setHasRecorded(true);
        Alert.alert('Recording Complete', 'Your pronunciation has been recorded. In a full implementation, this would be sent to a pronunciation checking API.');
      }, 2000);
    } catch (error) {
      console.error('Error recording:', error);
      Alert.alert('Error', 'Could not start recording. Please check microphone permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setHasRecorded(true);
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.warn);
      }
    };
  }, [sound]);

  if (!pronunciationData || !task) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No pronunciation content available</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={theme.headerGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getText(pronunciationData.title)}</Text>
        <Text style={styles.instruction}>{getText(pronunciationData.instruction)}</Text>
      </View>

      <View style={styles.content}>
        {/* Word Image */}
        {task.content.imageUrl && (
          <Image source={{ uri: task.content.imageUrl }} style={styles.wordImage} resizeMode="contain" />
        )}

        {/* Target Word */}
        <Text style={styles.targetWord}>{getText(task.content.word)}</Text>

        {/* Play Audio Button */}
        <TouchableOpacity style={styles.playButton} onPress={playTargetAudio}>
          <MaterialIcons
            name={isPlaying ? 'pause-circle-filled' : 'volume-up'}
            size={50}
            color="#FFFFFF"
          />
          <Text style={styles.playButtonText}>Listen to Pronunciation</Text>
        </TouchableOpacity>

        {/* Recording Section */}
        <View style={styles.recordingSection}>
          {!hasRecorded ? (
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <MaterialIcons
                name={isRecording ? 'stop-circle' : 'mic'}
                size={40}
                color="#FFFFFF"
              />
              <Text style={styles.recordButtonText}>
                {isRecording ? 'Stop Recording' : 'Record Your Pronunciation'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>Recording Complete!</Text>
              <Text style={styles.resultSubtext}>
                In a full implementation, your pronunciation would be checked here.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => setHasRecorded(false)}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordImage: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginBottom: 30,
  },
  targetWord: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginBottom: 40,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordingSection: {
    width: '100%',
    alignItems: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F44336',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  recordButtonActive: {
    backgroundColor: '#D32F2F',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 15,
    width: '100%',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  resultSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

export default PronunciationActivity;

