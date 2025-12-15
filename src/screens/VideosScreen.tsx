import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
  Animated
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
        
        // Animate entrance
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
        ]).start();
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [langKey]);

  return (
    <LinearGradient
      colors={['#E0F2FE', '#DBEAFE', '#E0E7FF']}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#E0F2FE" />

      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <MaterialCommunityIcons name="youtube-tv" size={28} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Cartoons 🎬</Text>
        </View>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Loading */}
      {loading ? (
        <View style={styles.center}>
          <LottieView
            source={require('../../assets/animations/Loading animation.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {videos.length > 0 ? (
            videos.map((item, index) => (
              <Animated.View
                key={item.id}
                style={{
                  opacity: fadeAnim,
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, 50 - (index * 10)],
                    }),
                  }],
                }}
              >
              <TouchableOpacity
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
                      <MaterialIcons name="play-arrow" size={36} color="#FFF" />
                    </View>
                  </View>
                </View>

                {/* Text Content */}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                </View>
              </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
            <View style={styles.center}>
              <MaterialCommunityIcons name="video-off" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No videos found yet! 🎥</Text>
              <Text style={styles.emptySubtext}>Check back later for fun cartoons!</Text>
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#0284C7',
    fontWeight: '700',
  },
  // Header - More colorful
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#0284C7',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  // List
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E0E7FF',
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
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#0EA5E9',
    marginTop: 8,
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