import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  StatusBar,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import apiService from '../services/api';
import { CLOUDFRONT_URL } from '../config/apiConfig';
import { getLanguageKey } from '../utils/languageUtils';
import { Language } from '../utils/translations';
import VideoPlayer from '../components/activity-types/VideoPlayer';

const { width, height } = Dimensions.get('window');

// --- Helper to extract YouTube ID from ID or URL ---
const extractYoutubeId = (input: string): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed; // already an ID
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

// Multi-lang helper
const getLocalized = (value: any, langKey: string): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return value[langKey] || value.en || value.ta || value.si || '';
};

const normalizeUrl = (raw?: string | null): string | null => {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${CLOUDFRONT_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
};

type VideoItem = {
  id: string;
  title: string;
  description: string;
  youtubeId?: string;
  fallbackUrl?: string; // AWS/CloudFront or direct MP4
  rawJson: any; // Store raw for player
};

const VideosScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentUser } = useUser();
  // @ts-ignore
  const learningLanguage: Language = currentUser?.learningLanguage || 'Tamil';
  const langKey = getLanguageKey(learningLanguage);

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const allActivities = await apiService.getAllActivities();

        const videoList: VideoItem[] = [];

        allActivities.forEach((activity) => {
          if (!activity.details_JSON) return;
          try {
            let parsed: any = activity.details_JSON;
            // Handle double-encoded JSON
            if (typeof parsed === 'string') {
              try {
                parsed = JSON.parse(parsed);
              } catch (_e) {}
            }
            if (typeof parsed === 'string') {
              try {
                parsed = JSON.parse(parsed);
              } catch (_e) {}
            }
            if (!parsed || typeof parsed !== 'object') {
              return;
            }

            // Normalise: some activities send an array of items, each with mediaUrl/videoUrl, etc.
            const items = Array.isArray(parsed) ? parsed : [parsed];

            let youtubeId: string | null = null;
            let fallbackUrl: string | null = null;
            let title = '';
            let description = '';

            for (const item of items) {
              const vd = item.videoData || {};
              const candidates = [
                vd.videoId,
                vd.youtubeUrl,
                vd.videoUrl,
                vd.mediaUrl,
                item.videoUrl,
                item.youtubeUrl,
                item.mediaUrl,
                vd.mediaUrl,
                item.videoUrl,
                item.youtubeUrl,
                item.mediaUrl,
              ];

              for (const c of candidates) {
                const raw = getLocalized(c, langKey);
                const yt = extractYoutubeId(raw);
                if (yt) {
                  youtubeId = yt;
                  break;
                }
                if (!fallbackUrl && raw && typeof raw === 'string') {
                  // treat as AWS/direct url if not youtube
                  if (!raw.includes('youtube.com') && !raw.includes('youtu.be')) {
                    fallbackUrl = normalizeUrl(raw) || raw;
                  }
                }
              }
              if (youtubeId || fallbackUrl) {
                title =
                  getLocalized(item.title, langKey) ||
                  getLocalized(parsed.title, langKey) ||
                  activity.name_en ||
                  activity.name_ta ||
                  activity.name_si ||
                  'Video';
                description =
                  getLocalized(item.description, langKey) ||
                  getLocalized(parsed.description, langKey) ||
                  '';
                break;
              }
            }

            if (!youtubeId && !fallbackUrl) {
              return;
            }

            if (!title) {
              title =
                activity.name_en ||
                activity.name_ta ||
                activity.name_si ||
                'Video';
            }

            videoList.push({
              id: activity.id.toString(),
              title,
              description,
              youtubeId: youtubeId || undefined,
              fallbackUrl: fallbackUrl || undefined,
              rawJson: parsed,
            });
          } catch (e) {
          }
        });

        setVideos(videoList);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [langKey]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Library</Text>
      </View>

      {/* Loading */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#002D62" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {videos.length > 0 ? (
            videos.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => setSelectedVideo(item)}
              >
                {/* Thumbnail Image */}
                <View style={styles.thumbnailWrapper}>
                  {item.youtubeId ? (
                    <Image
                      source={{ uri: `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg` }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.thumbnail, { backgroundColor: '#E2E8F0' }]}>
                      <MaterialIcons name="videocam" size={48} color="#64748B" />
                    </View>
                  )}
                  {/* Play Overlay */}
                  <View style={styles.playOverlay}>
                    <View style={styles.playBtn}>
                      <MaterialIcons name="play-arrow" size={32} color="#FFF" />
                    </View>
                  </View>
                </View>

                {/* Text Content */}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.center}>
              <Text style={{color: '#999'}}>No videos found.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Full Screen Player Modal */}
      <Modal visible={!!selectedVideo} animationType="slide" onRequestClose={() => setSelectedVideo(null)}>
        <View style={{flex: 1, backgroundColor: '#000'}}>
          {selectedVideo && (
            <>
              <TouchableOpacity 
                style={styles.closeBtn} 
                onPress={() => setSelectedVideo(null)}
              >
                <MaterialIcons name="close" size={30} color="#FFF" />
              </TouchableOpacity>
              
              <VideoPlayer
                content={{
                  ...selectedVideo.rawJson,
                  videoData: {
                    ...(selectedVideo.rawJson?.videoData || {}),
                    videoId: selectedVideo.youtubeId,
                    videoUrl: selectedVideo.fallbackUrl,
                    mediaUrl: selectedVideo.fallbackUrl,
                  },
                }}
                // @ts-ignore
                currentLang={langKey}
                onComplete={() => {}}
              />
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Light Gray-Blue background
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  backBtn: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#002D62',
  },
  // List
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    // Soft Shadow
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnailWrapper: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 45, 98, 0.8)', // Brand Blue, semi-transparent
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  // Modal Close
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  }
});

export default VideosScreen;