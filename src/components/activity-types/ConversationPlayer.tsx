import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityComponentProps, Language, MultiLingualText } from './types';
import { useTheme } from '../../theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { CLOUDFRONT_URL } from '../../config/apiConfig';

// --- Interface Definitions (Kept as in your code) ---

interface Speaker {
    id: string;
    name: MultiLingualText;
    avatarUrl: string;
    position: 'left' | 'right';
}

interface DialogueLine {
    speakerId: string;
    content: MultiLingualText;
    timestamp: { [key in Language]?: number }; 
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

// --- Utility Functions (Kept as in your code) ---

const normalizeConversationPayload = (raw: any): ConversationData | null => {
    if (!raw) return null;
    const base = raw.conversationData || raw.conversation || raw.data || raw;
    if (!base) return null;
    const normalized: any = { ...base };
    if (!normalized.dialogues) {
        if (Array.isArray(base.dialogues)) normalized.dialogues = base.dialogues;
        else if (Array.isArray(base.dialogs)) normalized.dialogues = base.dialogs;
        else if (Array.isArray(base.dialogue)) normalized.dialogues = base.dialogue;
        else if (Array.isArray(base.lines)) normalized.dialogues = base.lines;
    }
    if (!normalized.audioUrl && base.audio_url) {
        normalized.audioUrl = base.audio_url;
    }
    if (!normalized.dialogues || !Array.isArray(normalized.dialogues)) return null;
    return normalized as ConversationData;
};

const safeJsonParse = (value: any): any => {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

// --- Main Component ---

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
    const [currentDialogueIndex, setCurrentDialogueIndex] = useState(-1);
    const scrollViewRef = useRef<ScrollView>(null);
    const dialogueRefs = useRef<Array<View | null>>([]);
    const isSeeking = useRef(false);

    let parsedContent = safeJsonParse(content);
    if (Array.isArray(parsedContent)) {
        parsedContent = parsedContent[0];
    }

    const rawConversationData = (parsedContent as ConversationPlayerContent)?.conversationData as
        | ConversationData
        | { conversationData?: ConversationData }
        | any;

    const conversationData: ConversationData | null =
        normalizeConversationPayload(rawConversationData) ||
        normalizeConversationPayload(parsedContent);

    const getText = (text: MultiLingualText | undefined | null): string => {
        if (!text) return '';
        return text[currentLang] || text.en || text.ta || text.si || '';
    };

    const resolveAssetUrl = (url?: string | null): string | null => {
        if (!url) return null;
        // Check if URL is absolute (http/https)
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        // Check if URL is relative (starts with /) and prefix CloudFront
        if (url.startsWith('/')) return `${CLOUDFRONT_URL}${url}`;
        // If it's a relative path without a leading slash (like "level-01/img/...")
        return `${CLOUDFRONT_URL}/${url}`;
    };

    const getAudioUrl = (): string | null => {
        if (!conversationData?.audioUrl) return null;
        const picked = 
            conversationData.audioUrl[currentLang] || 
            conversationData.audioUrl.en || 
            conversationData.audioUrl.ta || 
            null;
        return resolveAssetUrl(picked);
    };

    const getDialogueTime = (dialogue: DialogueLine): number => {
        if (!dialogue?.timestamp) return 0;
        return dialogue.timestamp[currentLang] || dialogue.timestamp.en || 0;
    };

    const resetPlayerState = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentDialogueIndex(-1);
    };

    const stopAndUnload = async () => {
        try {
            if (sound) {
                await sound.stopAsync().catch(() => null);
                await sound.unloadAsync().catch(() => null);
            }
        } catch {
            // ignore audio stop errors
        } finally {
            resetPlayerState();
        }
    };

    useEffect(() => {
        loadAudio();
        return () => {
            stopAndUnload();
        };
    }, [currentLang]);

    useFocusEffect(
        React.useCallback(() => {
            // on focus do nothing special
            return () => {
                // on blur/back/exit stop and unload
                stopAndUnload();
            };
        }, [sound])
    );

    const loadAudio = async () => {
        const audioUrl = getAudioUrl();
        if (!audioUrl) return;

        try {
            if (sound) {
                await sound.unloadAsync();
            }
            resetPlayerState(); 

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: false }
            );

            setSound(newSound);
            const status: any = await newSound.getStatusAsync();
            if (status.isLoaded) {
                const dur = typeof status.durationMillis === 'number' ? status.durationMillis / 1000 : 0;
                setDuration(dur);
            }

            newSound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded) {
                    const newTime = status.positionMillis / 1000;
                    setCurrentTime(newTime);
                    setIsPlaying(status.isPlaying);
                    
                    if (!isSeeking.current) {
                        syncDialogues(newTime);
                    }
                    
                     if (status.didJustFinish) {
                        resetPlayerState();
                        newSound.setPositionAsync(0);
                        if (onComplete) onComplete();
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
        let newIndex = -1;
        
        for (let i = dialogues.length - 1; i >= 0; i--) {
            const dialogueTime = getDialogueTime(dialogues[i]);
            // Highlight when current time is >= dialogue start time (with a tiny buffer)
            if (time >= dialogueTime - 0.1) { 
                newIndex = i;
                break;
            }
        }

        if (newIndex !== currentDialogueIndex) {
            setCurrentDialogueIndex(newIndex);
            if (newIndex !== -1) {
                scrollToCurrentDialogue(newIndex);
            }
        }
    };
    
    const scrollToCurrentDialogue = (index: number) => {
        if (index === -1) return;
        
        const currentRef = dialogueRefs.current[index];
        if (currentRef && scrollViewRef.current) {
            currentRef.measureLayout(
                scrollViewRef.current as any,
                (x, y, width, height) => {
                    scrollViewRef.current?.scrollTo({ y: y - 80, animated: true }); 
                },
        () => {}
            );
        }
    };

    const togglePlay = async () => {
        if (!sound) return;

        try {
            if (isPlaying) {
                await sound.pauseAsync();
            } else {
                const status: any = await sound.getStatusAsync();
                const currentTimeInSeconds = (status.positionMillis / 1000) || 0;
                syncDialogues(currentTimeInSeconds); 
                await sound.playAsync();
            }
        } catch (error) {
            console.error('Error toggling playback:', error);
        }
    };

    const seek = async (value: number) => {
        if (!sound) return;
        isSeeking.current = true;
        try {
            await sound.setPositionAsync(value * 1000);
            syncDialogues(value); 
        } catch (error) {
            console.error('Error seeking:', error);
        } finally {
            isSeeking.current = false;
        }
    };

    const formatTime = (seconds: number): string => {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const getSpeaker = (id: string): Speaker | undefined => {
        if (!conversationData?.speakers) return undefined;
        return conversationData.speakers.find(s => s.id === id);
    };

    const dialogues = Array.isArray(conversationData?.dialogues)
        ? conversationData!.dialogues
        : [];

    if (!conversationData || dialogues.length === 0) {
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
                <View style={styles.dialoguesContainer}>
                    {dialogues.map((dialogue, index) => {
                        const speaker = getSpeaker(dialogue.speakerId);
                        const isActive = index === currentDialogueIndex;

                        const avatarUri = speaker?.avatarUrl ? resolveAssetUrl(speaker.avatarUrl) : null;
                        const isRight = speaker?.position === 'right';

                        return (
                            <View
                                key={index}
                                ref={(el: View | null) => { dialogueRefs.current[index] = el; }}
                                style={[
                                    styles.dialogueRow,
                                    isRight ? styles.dialogueRight : styles.dialogueLeft,
                                    isActive && styles.dialogueActive,
                                ]}
                            >
                                {avatarUri && (
                                    <Image source={{ uri: avatarUri }} style={styles.avatar} resizeMode="cover" />
                                )}
                                <View style={styles.dialogueContent}>
                                    {speaker && (
                                        <Text style={[styles.speakerName, isRight && styles.speakerNameRight]}>
                                            {getText(speaker.name)}
                                        </Text>
                                    )}
                                    <Text 
                                        style={[
                                            styles.dialogueText,
                                            isActive && styles.dialogueTextActive,
                                            isRight && styles.dialogueTextRight // Text alignment for right messages
                                        ]}
                                    >
                                        {getText(dialogue.content)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Player Controls */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.playButton} onPress={togglePlay} disabled={!sound}>
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
                        onSlidingStart={() => isSeeking.current = true}
                        onSlidingComplete={seek}
                        minimumTrackTintColor="#FFFFFF"
                        maximumTrackTintColor="rgba(255,255,255,0.3)"
                        thumbTintColor="#FFFFFF"
                        disabled={!sound}
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
        backgroundColor: '#0F172A',
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
    // General row style for dialogue bubble
    dialogueRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 15,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.12)',
        maxWidth: '90%', // Limit bubble width
    },
    // Alignment for left-positioned speakers
    dialogueLeft: {
        alignSelf: 'flex-start',
    },
    // Alignment for right-positioned speakers (reverses avatar and text order)
    dialogueRight: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    // Highlight style for the current dialogue bubble
    dialogueActive: {
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderWidth: 2,
        borderColor: '#FFD700', // Gold/Yellow border for visibility
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
        textAlign: 'left',
    },
    speakerNameRight: {
        textAlign: 'right', // Align speaker name to the right for right-positioned bubbles
    },
    dialogueText: {
        fontSize: 16,
        color: '#FFFFFF',
        lineHeight: 22,
        textAlign: 'left',
    },
    dialogueTextRight: {
        textAlign: 'right', // Align text to the right for right-positioned bubbles
    },
    dialogueTextActive: {
        fontWeight: 'bold',
        fontSize: 17,
        color: '#FFD700', // Highlight text color
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