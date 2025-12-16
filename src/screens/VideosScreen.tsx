import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Animated,
  Alert
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import apiService from '../services/api';
import { CLOUDFRONT_URL } from '../config/apiConfig';
import { getLanguageKey } from '../utils/languageUtils';
import { getTranslations, Language } from '../utils/translations';
import { loadStudentLanguagePreference, languageCodeToLanguage } from '../utils/studentLanguage';
import VideoPlayer from '../components/activity-types/VideoPlayer';

const { width, height } = Dimensions.get('window');

// --- Helper Functions for Filtering Activities ---
const VIDEO_MAIN_ACTIVITY_NAMES = ['Video', 'Videos', 'video', 'videos'];
const VIDEO_ACTIVITY_TYPE_NAMES = ['VideoPlayer', 'video player', 'Video Player', 'video', 'Video'];

const findMainActivityIds = (
  mainActivities: any[],
  namesToMatch: string[]
): Set<number> => {
  const ids = new Set<number>();
  mainActivities.forEach((ma) => {
    const nameMatch = namesToMatch.some(
      (name) =>
        ma.name_en?.toLowerCase().includes(name.toLowerCase()) ||
        ma.name_ta?.toLowerCase().includes(name.toLowerCase()) ||
        ma.name_si?.toLowerCase().includes(name.toLowerCase())
    );
    if (nameMatch) {
      ids.add(ma.id);
    }
  });
  return ids;
};

const findActivityTypeIds = (
  activityTypes: any[],
  namesToMatch: string[]
): Set<number> => {
  const ids = new Set<number>();
  activityTypes.forEach((at) => {
    const nameMatch = namesToMatch.some(
      (name) =>
        at.name_en?.toLowerCase().includes(name.toLowerCase()) ||
        at.name_ta?.toLowerCase().includes(name.toLowerCase()) ||
        at.name_si?.toLowerCase().includes(name.toLowerCase()) ||
        at.jsonMethod?.toLowerCase().includes(name.toLowerCase())
    );
    if (nameMatch) {
      ids.add(at.id);
    }
  });
  return ids;
};

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

// --- Helper to extract thumbnail from YouTube ID ---
const getYoutubeThumbnail = (youtubeId: string): string => {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
};

// --- Helper to get localized text ---
const getLocalized = (value: any, langKey: string): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[langKey] || value.en || value.ta || value.si || '';
};

interface VideoItem {
  id: string;
  title: string;
  description: string;
  youtubeId?: string;
  fallbackUrl?: string;
  thumbnailUrl?: string;
  rawJson: any;
}

const VideosScreen: React.FC = () => {
  const navigation = useNavigation();
  const { learningLanguage } = useUser();
  const langKey = getLanguageKey(learningLanguage);
  const [nativeLanguage, setNativeLanguage] = useState<Language>('English');
  const t = useMemo(() => getTranslations(nativeLanguage), [nativeLanguage]);

  useEffect(() => {
    const loadLang = async () => {
      const pref = await loadStudentLanguagePreference();
      const native = languageCodeToLanguage(pref.nativeLanguageCode);
      setNativeLanguage(native);
    };
    loadLang();
  }, []);

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        console.log('Fetching all activities, activity types, and main activities...');
        
        // Fetch all required data in parallel
        const [allActivities, activityTypes, mainActivities] = await Promise.all([
          apiService.getAllActivities(),
          apiService.getAllActivityTypes(),
          apiService.getAllMainActivities(),
        ]);
        
        console.log(`Found ${allActivities.length} activities, ${activityTypes.length} activity types, ${mainActivities.length} main activities`);

        // Find video-related main activity IDs
        const videoMainIds = findMainActivityIds(mainActivities, VIDEO_MAIN_ACTIVITY_NAMES);
        console.log('Video main activity IDs:', Array.from(videoMainIds));

        // Find video player activity type IDs
        const videoPlayerTypeIds = findActivityTypeIds(activityTypes, VIDEO_ACTIVITY_TYPE_NAMES);
        console.log('Video player type IDs:', Array.from(videoPlayerTypeIds));

        // Filter activities that are video-related
        const videoActivities = allActivities.filter(activity => {
          const hasVideoMainId = videoMainIds.size === 0 || videoMainIds.has(activity.mainActivityId);
          const hasVideoTypeId = videoPlayerTypeIds.size === 0 || videoPlayerTypeIds.has(activity.activityTypeId);
          return hasVideoMainId && hasVideoTypeId;
        });
        
        console.log(`Found ${videoActivities.length} video activities`);

        const videoList: VideoItem[] = [];

        videoActivities.forEach((activity) => {
          console.log(`Processing video activity ID: ${activity.id}, Type: ${activity.jsonMethod}`);
          if (!activity.details_JSON) {
            console.log(`Skipping activity ${activity.id} - no details_JSON`);
            return;
          }
          try {
            let parsed: any = activity.details_JSON;
            // Handle double-encoded JSON
            if (typeof parsed === 'string') {
              try {
                parsed = JSON.parse(parsed);
                console.log(`Parsed JSON for activity ${activity.id}`);
              } catch (_e) {
                console.log(`Failed to parse JSON for activity ${activity.id}`);
              }
            }
            if (typeof parsed === 'string') {
              try {
                parsed = JSON.parse(parsed);
                console.log(`Double parsed JSON for activity ${activity.id}`);
              } catch (_e) {
                console.log(`Failed to double parse JSON for activity ${activity.id}`);
              }
            }

            // Extract video info
            let youtubeId: string | null = null;
            let fallbackUrl: string | null = null;
            let thumbnailUrl: string | null = null;
            let title = '';
            let description = '';

            // Try different structures
            const candidates = [
              parsed,
              parsed.videoData,
              parsed.storyData,
              parsed.conversationData,
              parsed.songData,
            ].filter(Boolean);

            console.log(`Activity ${activity.id} candidates:`, candidates.length);

            for (const item of candidates) {
              console.log(`Checking item:`, item);
              // Try to extract YouTube ID
              const idCandidates = [
                item.videoId,
                item.youtubeId,
                item.youtubeUrl,
                item.videoUrl,
                item.mediaUrl,
              ].filter(Boolean);

              for (const idCandidate of idCandidates) {
                const localizedCandidate = getLocalized(idCandidate, langKey);
                console.log(`Checking ID candidate:`, localizedCandidate);
                const ytId = extractYoutubeId(localizedCandidate);
                if (ytId) {
                  youtubeId = ytId;
                  thumbnailUrl = getYoutubeThumbnail(ytId);
                  console.log(`Found YouTube ID: ${youtubeId}`);
                  break;
                }
              }

              // Try to extract fallback URL
              if (!youtubeId) {
                const urlCandidates = [
                  item.videoUrl,
                  item.mediaUrl,
                  item.fallbackUrl,
                ].filter(Boolean);

                for (const urlCandidate of urlCandidates) {
                  const url = getLocalized(urlCandidate, langKey);
                  console.log(`Checking URL candidate:`, url);
                  if (url && (url.startsWith('http') || url.startsWith('/'))) {
                    fallbackUrl = url.startsWith('/') ? `${CLOUDFRONT_URL}${url}` : url;
                    console.log(`Found fallback URL: ${fallbackUrl}`);
                    break;
                  }
                }
              }

              // Extract title and description with proper localization
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
              
              console.log(`Extracted title: ${title}, description: ${description.substring(0, 50)}...`);
              break;
            }

            if (!youtubeId && !fallbackUrl) {
              console.log(`Activity ${activity.id} has no valid video source`);
              return;
            }

            if (!title) {
              title =
                activity.name_en ||
                activity.name_ta ||
                activity.name_si ||
                'Video';
            }

            console.log(`Adding video to list:`, { id: activity.id, title, youtubeId, fallbackUrl });
            videoList.push({
              id: activity.id.toString(),
              title,
              description,
              youtubeId: youtubeId || undefined,
              fallbackUrl: fallbackUrl || undefined,
              thumbnailUrl: thumbnailUrl || undefined,
              rawJson: parsed,
            });
          } catch (e) {
            console.error(`Error processing activity ${activity.id}:`, e);
          }
        });

        console.log(`Final video list has ${videoList.length} videos`);
        setVideos(videoList);
        
        // Animate entrance
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
        ]).start();
      } catch (error) {
        console.error('Error fetching videos:', error);
        Alert.alert('Error', 'Failed to load videos. Please try again later.');
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
          <Text style={styles.headerTitle}>{t.homeVideosTitle} 🎬</Text>
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
          <Text style={styles.loadingText}>{t.loadingVideos}</Text>
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
                  {item.thumbnailUrl || item.youtubeId ? (
                    <Image
                      source={{ uri: item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg` }}
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
              <Text style={styles.emptyText}>{t.noVideosAvailable}</Text>
              <Text style={styles.emptySubtext}>{t.checkBackLater}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  // Force refresh
                  setLoading(true);
                  setTimeout(() => {
                    setLoading(false);
                  }, 1000);
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
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
                  title: selectedVideo.title,
                  description: selectedVideo.description,
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
  // Retry Button
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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