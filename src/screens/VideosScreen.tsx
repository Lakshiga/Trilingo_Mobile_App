import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService, { ActivityDto } from '../services/api';
import { CLOUDFRONT_URL } from '../config/apiConfig';
import { getTranslation, Language } from '../utils/translations';
import { getLearningLanguageField, getLanguageKey } from '../utils/languageUtils';
import { Dimensions } from 'react-native';
import {
  findActivityTypeIds,
  findMainActivityIds,
  VIDEO_MAIN_ACTIVITY_NAMES,
  VIDEO_PLAYER_ACTIVITY_TYPE_NAMES,
} from '../utils/activityMappings';

const { width, height } = Dimensions.get('window');

type Video = {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl?: string;
  emoji: string;
  gradient: readonly [string, string];
  category: string;
};

const VideosScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { currentUser } = useUser();
  const nativeLanguage: Language = (currentUser?.nativeLanguage as Language) || 'English';
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch videos from backend (Activities with Video main activity or YouTube links)
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        
        // Fetch all activities, activity types, and main activities
        const [allActivities, activityTypes, mainActivities] = await Promise.all([
          apiService.getAllActivities(),
          apiService.getAllActivityTypes(),
          apiService.getAllMainActivities(),
        ]);
        
        const videoMainActivityIds = findMainActivityIds(
          mainActivities,
          VIDEO_MAIN_ACTIVITY_NAMES
        );
        const videoPlayerActivityTypeIds = findActivityTypeIds(
          activityTypes,
          VIDEO_PLAYER_ACTIVITY_TYPE_NAMES
        );

        let videoActivities = allActivities.filter(
          (activity) =>
            (videoMainActivityIds.size === 0 ||
              videoMainActivityIds.has(activity.mainActivityId)) &&
            (videoPlayerActivityTypeIds.size === 0 ||
              videoPlayerActivityTypeIds.has(activity.activityTypeId))
        );

        if (videoActivities.length === 0) {
          console.warn(
            'Video Player mapping not found. Falling back to YouTube detection.'
          );
          videoActivities = allActivities.filter((activity) => {
            if (
              videoMainActivityIds.size > 0 &&
              videoMainActivityIds.has(activity.mainActivityId)
            ) {
              return true;
            }

            if (activity.details_JSON) {
              try {
                const parsed = JSON.parse(activity.details_JSON);
                const videoUrl =
                  parsed.videoUrl || parsed.mediaUrl || parsed.youtubeUrl;
                if (
                  videoUrl &&
                  (videoUrl.includes('youtube.com') ||
                    videoUrl.includes('youtu.be'))
                ) {
                  return true;
                }
              } catch (e) {
                return false;
              }
            }
            return false;
          });
        }
        
        // Map activities to videos
        const mappedVideos: Video[] = videoActivities.map((activity, index) => {
          let videoData: any = {};
          
          // Parse Details_JSON to get video data
          if (activity.details_JSON) {
            try {
              const parsed = JSON.parse(activity.details_JSON);
              videoData = parsed;
            } catch (e) {
              console.error('Error parsing video JSON:', e);
            }
          }

          // Get video URL (YouTube or CloudFront)
          let videoUrl = '';
          const urlSource = videoData.videoUrl || videoData.mediaUrl || videoData.youtubeUrl;
          if (urlSource) {
            videoUrl = urlSource;
            // If it's not a YouTube URL and doesn't start with http, prepend CloudFront URL
            if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be') && !videoUrl.startsWith('http')) {
              videoUrl = videoUrl.startsWith('/')
                ? `${CLOUDFRONT_URL}${videoUrl}`
                : `${CLOUDFRONT_URL}/${videoUrl}`;
            }
          }

          // Get title in learning language
          const title = videoData.title 
            ? (typeof videoData.title === 'object' 
                ? (videoData.title[getLanguageKey(learningLanguage)] || 
                   videoData.title.en || 
                   getLearningLanguageField(learningLanguage, activity))
                : videoData.title)
            : getLearningLanguageField(learningLanguage, activity) || 'Video';

          // Get description in learning language
          const description = videoData.instruction || videoData.description
            ? (typeof (videoData.instruction || videoData.description) === 'object'
                ? ((videoData.instruction || videoData.description)[getLanguageKey(learningLanguage)] || 
                   (videoData.instruction || videoData.description).en || 
                   getTranslation(learningLanguage, 'educationalVideo'))
                : (videoData.instruction || videoData.description))
            : getTranslation(learningLanguage, 'educationalVideo');

          // Gradients for videos
          const gradients: readonly [string, string][] = [
            ['#667EEA', '#764BA2'] as const,
            ['#F093FB', '#F5576C'] as const,
            ['#4FACFE', '#00F2FE'] as const,
            ['#43E97B', '#38F9D7'] as const,
            ['#FA709A', '#FEE140'] as const,
            ['#30CFD0', '#330867'] as const,
          ];

          return {
            id: activity.id.toString(),
            title: title,
            description: description,
            duration: '0:00', // Duration can be calculated from video if needed
            videoUrl: videoUrl,
            emoji: '📹',
            gradient: gradients[index % gradients.length],
            category: 'Education',
          };
        });

        setVideos(mappedVideos);
      } catch (error: any) {
        console.error('Error fetching videos:', error);
        Alert.alert(
          'Error',
          'Could not load videos. Please try again.',
          [{ text: 'OK' }]
        );
        // Use empty array on error
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [learningLanguage]);

  return (
    <LinearGradient colors={theme.videosBackground} style={styles.container}>
      {/* Decorative circles */}
      <View style={[styles.decorativeCircle1, { backgroundColor: theme.decorativeCircle1 }]} />
      <View style={[styles.decorativeCircle2, { backgroundColor: theme.decorativeCircle2 }]} />
      <View style={[styles.decorativeCircle3, { backgroundColor: theme.decorativeCircle3 }]} />

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerEmoji}>📹</Text>
            <Text style={styles.headerTitle}>{getTranslation(nativeLanguage, 'educationalVideos')}</Text>
            <Text style={styles.headerEmoji}>🎬</Text>
          </View>
          <Text style={styles.headerSubtitle}>{getTranslation(nativeLanguage, 'learnThroughEngagingContent')}</Text>
        </View>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../../assets/animations/Loading animation.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
          <Text style={styles.loadingText}>{getTranslation(nativeLanguage, 'loadingVideos')}</Text>
        </View>
      )}

      {/* Videos List */}
      {!loading && (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {videos.length > 0 ? (
            videos.map((video, index) => (
              <TouchableOpacity key={video.id} activeOpacity={0.8} style={styles.videoCard}>
            <LinearGradient
              colors={video.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.videoGradient}
            >
              {/* Thumbnail with play button */}
              <View style={styles.thumbnail}>
                <Text style={styles.thumbnailEmoji}>{video.emoji}</Text>
                <View style={styles.playButtonOverlay}>
                  <View style={styles.playButton}>
                    <MaterialIcons name="play-arrow" size={40} color="#fff" />
                  </View>
                </View>
                
                {/* Duration badge */}
                <View style={styles.durationBadge}>
                  <MaterialIcons name="access-time" size={14} color="#fff" />
                  <Text style={styles.durationText}>{video.duration}</Text>
                </View>

                {/* Category badge */}
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{video.category}</Text>
                </View>
              </View>

              {/* Video Info */}
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={1}>
                  {video.title}
                </Text>
                <Text style={styles.videoDescription} numberOfLines={2}>
                  {video.description}
                </Text>
              </View>
              </LinearGradient>
            </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{getTranslation(nativeLanguage, 'noVideosAvailable')}</Text>
              <Text style={styles.emptySubtext}>{getTranslation(nativeLanguage, 'checkBackLater')}</Text>
            </View>
          )}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 100,
    right: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: 150,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  header: {
    paddingTop: Math.max(45, height * 0.06),
    paddingBottom: Math.max(20, height * 0.025),
    paddingHorizontal: Math.max(16, width * 0.04),
    backgroundColor: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: Math.max(40, height * 0.05),
    left: Math.max(16, width * 0.04),
    zIndex: 10,
    backgroundColor: 'rgba(67, 188, 205, 0.9)',
    borderRadius: 25,
    padding: Math.max(10, width * 0.03),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerEmoji: {
    fontSize: 32,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: Math.max(22, width * 0.07),
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: Math.max(14, width * 0.04),
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: Math.max(16, width * 0.04),
  },
  scrollContent: {
    paddingTop: 10,
  },
  videoCard: {
    marginBottom: Math.max(16, height * 0.02),
  },
  videoGradient: {
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    height: Math.max(160, height * 0.22),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbnailEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  playButtonOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  categoryText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  videoInfo: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  videoTitle: {
    fontSize: Math.max(18, width * 0.05),
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 6,
  },
  videoDescription: {
    fontSize: Math.max(13, width * 0.035),
    color: '#7F8C8D',
    lineHeight: Math.max(18, width * 0.05),
  },
  bottomSpacing: {
    height: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default VideosScreen;