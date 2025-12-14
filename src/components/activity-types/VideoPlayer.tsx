import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { Video, ResizeMode } from 'expo-av';
import { ActivityComponentProps, Language, MultiLingualText } from './types';
import { useBackgroundAudio } from '../../context/BackgroundAudioContext';

interface VideoData {
  videoId?: MultiLingualText | string;
  youtubeUrl?: MultiLingualText | string;
  videoUrl?: MultiLingualText | string;
  mediaUrl?: MultiLingualText | string;
}

interface VideoPlayerContent {
  title?: MultiLingualText;
  description?: MultiLingualText;
  videoData?: VideoData;
}

const { width } = Dimensions.get('window');

const getLocalized = (value: MultiLingualText | string | undefined, lang: Language): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  // @ts-ignore
  return value[lang] || value.en || value.ta || value.si || '';
};

const extractYoutubeId = (input?: string | null): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  const patterns = [
    /youtu\.be\/([^?&/]+)/i,
    /youtube\.com\/watch\?v=([^?&/]+)/i,
    /youtube\.com\/embed\/([^?&/]+)/i,
    /youtube\.com\/shorts\/([^?&/]+)/i,
    /youtube\.com\/live\/([^?&/]+)/i,
    /(v=)([\w-]{11})/i,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m?.[1] || m?.[2]) return m[1] || m[2];
  }
  return null;
};

const VideoPlayer: React.FC<ActivityComponentProps> = ({
  content,
  currentLang = 'ta',
  onComplete,
}) => {
  const [playing, setPlaying] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const releaseFocusRef = useRef<(() => void) | null>(null);
  const { requestAudioFocus, resumeBackground } = useBackgroundAudio();

  const videoContent = content as VideoPlayerContent;
  const vd = videoContent?.videoData || {};

  const title = getLocalized(videoContent?.title as any, currentLang);
  const description = getLocalized(videoContent?.description as any, currentLang);

  // Collect possible sources
  const candidates = [
    getLocalized(vd.videoId as any, currentLang),
    getLocalized(vd.youtubeUrl as any, currentLang),
    getLocalized(vd.videoUrl as any, currentLang),
    getLocalized(vd.mediaUrl as any, currentLang),
  ];

  const youtubeId = useMemo(() => {
    for (const c of candidates) {
      const yt = extractYoutubeId(c);
      if (yt) return yt;
    }
    return null;
  }, [candidates.join('|')]);

  const fallbackUrl = useMemo(() => {
    if (youtubeId) return null;
    for (const c of candidates) {
      if (c && typeof c === 'string' && !extractYoutubeId(c)) {
        return c;
      }
    }
    return null;
  }, [candidates.join('|'), youtubeId]);

  if (!youtubeId && !fallbackUrl) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Video not found</Text>
      </View>
    );
  }

  useEffect(() => {
    releaseFocusRef.current = requestAudioFocus();
    return () => {
      releaseFocusRef.current?.();
      releaseFocusRef.current = null;
      resumeBackground().catch(() => null);
    };
  }, [requestAudioFocus, resumeBackground]);

  return (
    <View style={styles.container}>
      <View style={styles.playerWrapper}>
        {youtubeId ? (
          <YoutubeIframe
            height={width * 0.5625}
            width={width}
            videoId={youtubeId}
            play={playing}
            onChangeState={(state: any) => {
              if (state === 'ended') {
                setPlaying(false);
                onComplete?.();
              }
            }}
            initialPlayerParams={{
              modestbranding: true,
              rel: false,
              showinfo: false,
              playsinline: true,
            }}
            webViewProps={{
              androidLayerType: 'hardware',
            }}
          />
        ) : (
          <>
            {videoLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
            <Video
              source={{ uri: fallbackUrl! }}
              style={{ width: '100%', height: width * 0.5625 }}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay
              onLoadStart={() => setVideoLoading(true)}
              onLoad={() => setVideoLoading(false)}
              onPlaybackStatusUpdate={(status: any) => {
                if (status?.isLoaded && status?.didJustFinish) {
                  onComplete?.();
                }
              }}
              onError={(err) => {
                console.warn('Video playback error', err);
                setVideoLoading(false);
              }}
            />
          </>
        )}
      </View>

      <ScrollView style={styles.infoContainer}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.divider} />
        <Text style={styles.description}>{description}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerWrapper: {
    backgroundColor: '#000000',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  infoContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800', // Extra bold
    color: '#1E293B', // Dark Slate
    marginBottom: 10,
    lineHeight: 28,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 15,
  },
  description: {
    fontSize: 16,
    color: '#64748B', // Cool Gray
    lineHeight: 24,
  },
});

export default VideoPlayer;