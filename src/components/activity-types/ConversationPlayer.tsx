import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Slider,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityComponentProps, Language, MultiLingualText } from './types';
import { useTheme } from '../../theme/ThemeContext';

interface Speaker {
  id: string;
  name: MultiLingualText;
  avatarUrl: string;
  position: 'left' | 'right';
}

interface DialogueLine {
  speakerId: string;
  content: MultiLingualText;
  timestamp: { [key: string]: number };
}

interface ConversationData {
  title: MultiLingualText;
  audioUrl: MultiLingualText;
  speakers: Speaker[];
  dialogues: DialogueLine[];
}

interface ConversationPlayerContent {
  title: MultiLingualText;
  instruction: MultiLingualText;
  conversationData: ConversationData;
}

const ConversationPlayer: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
}) => {
  const { theme } = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const conversationData = (content as ConversationPlayerContent)?.conversationData;

  const getText = (text: MultiLingualText | undefined | null): string => {
    if (!text) return '';
    return text[currentLang] || text.en || text.ta || text.si || '';
  };

  const getAudioUrl = (): string | null => {
    if (!conversationData?.audioUrl) return null;
    return conversationData.audioUrl[currentLang] || conversationData.audioUrl.en || conversationData.audioUrl.ta || null;
  };

  const getDialogueTime = (dialogue: DialogueLine): number => {
    if (!dialogue?.timestamp) return 0;
    return dialogue.timestamp[currentLang] || dialogue.timestamp.en || 0;
  };

  useEffect(() => {
    loadAudio();
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.warn);
      }
    };
  }, [currentLang]);

  const loadAudio = async () => {
    const audioUrl = getAudioUrl();
    if (!audioUrl) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false }
      );

      setSound(newSound);
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis / 1000);
      }

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setCurrentTime(status.positionMillis / 1000);
          setIsPlaying(status.isPlaying);
          syncDialogues(status.positionMillis / 1000);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setCurrentTime(0);
            setCurrentDialogueIndex(0);
          }
        }
      });
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const syncDialogues = (time: number) => {
    if (!conversationData?.dialogues) return;

    const dialogues = conversationData.dialogues;
    const nextDialogue = dialogues[currentDialogueIndex + 1];

    if (nextDialogue) {
      const nextTime = getDialogueTime(nextDialogue);
      if (time >= nextTime) {
        setCurrentDialogueIndex(currentDialogueIndex + 1);
      }
    }

    const currentMsgTime = getDialogueTime(dialogues[currentDialogueIndex]);
    if (time < currentMsgTime && currentDialogueIndex > 0) {
      for (let i = currentDialogueIndex - 1; i >= 0; i--) {
        const thisMsgTime = getDialogueTime(dialogues[i]);
        if (time >= thisMsgTime) {
          setCurrentDialogueIndex(i);
          return;
        }
      }
      setCurrentDialogueIndex(0);
    }
  };

  const togglePlay = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const seek = async (value: number) => {
    if (!sound) return;
    try {
      await sound.setPositionAsync(value * 1000);
      syncDialogues(value);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const getSpeaker = (id: string): Speaker | undefined => {
    return conversationData?.speakers.find(s => s.id === id);
  };

  if (!conversationData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No conversation content available</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={theme.headerGradient} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getText((content as ConversationPlayerContent).title)}</Text>
        <Text style={styles.instruction}>{getText((content as ConversationPlayerContent).instruction)}</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Dialogues */}
        <View style={styles.dialoguesContainer}>
          {conversationData.dialogues.map((dialogue, index) => {
            const speaker = getSpeaker(dialogue.speakerId);
            const isActive = index === currentDialogueIndex;

            return (
              <View
                key={index}
                style={[
                  styles.dialogueRow,
                  speaker?.position === 'left' ? styles.dialogueLeft : styles.dialogueRight,
                  isActive && styles.dialogueActive,
                ]}
              >
                {speaker?.avatarUrl && (
                  <Image source={{ uri: speaker.avatarUrl }} style={styles.avatar} resizeMode="cover" />
                )}
                <View style={styles.dialogueContent}>
                  {speaker && (
                    <Text style={styles.speakerName}>{getText(speaker.name)}</Text>
                  )}
                  <Text style={styles.dialogueText}>{getText(dialogue.content)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Player Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
          <MaterialIcons
            name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
            size={50}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={currentTime}
            onValueChange={seek}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="rgba(255,255,255,0.3)"
            thumbTintColor="#FFFFFF"
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
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
  dialoguesContainer: {
    gap: 15,
  },
  dialogueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 15,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dialogueLeft: {
    alignSelf: 'flex-start',
  },
  dialogueRight: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  dialogueActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  dialogueContent: {
    flex: 1,
  },
  speakerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  dialogueText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  controls: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  playButton: {
    alignItems: 'center',
    marginBottom: 15,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    minWidth: 50,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

export default ConversationPlayer;

