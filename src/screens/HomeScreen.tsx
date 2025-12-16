import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, 
  StatusBar, ActivityIndicator, Alert, Animated, Easing, Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { resolveImageUri, isEmojiLike } from '../utils/imageUtils';
import { useResponsive } from '../utils/responsive';
import { useBackgroundAudio } from '../context/BackgroundAudioContext';
import apiService, { ProgressSummaryDto, ActivityDto, ActivityTypeDto } from '../services/api';
import { loadStudentLanguagePreference, languageCodeToLanguage } from '../utils/studentLanguage';
import { Language, getTranslations } from '../utils/translations';
import { getLanguageTextStyle } from '../utils/languageUtils';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

// --- 1. BOUNCY BUTTON COMPONENT (Animation) ---
// குழந்தைகள் பட்டனை தொடும்போது அது "Spring" போல இயங்கும்
const BouncyButton = ({ onPress, children, style, scaleTo = 0.95 }: any) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      style={{ width: '100%' }} // Ensure it fills container
    >
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- 2. ANIMATED BACKGROUND DOODLES (Bold top-to-bottom loop animation with blue theme) ---
const BackgroundDoodles: React.FC = () => {
  const { width, height } = Dimensions.get('window');
  
  // Create multiple animation refs for different elements moving from top to bottom
  const anim1 = useRef(new Animated.Value(-100)).current;
  const anim2 = useRef(new Animated.Value(-150)).current;
  const anim3 = useRef(new Animated.Value(-200)).current;
  const anim4 = useRef(new Animated.Value(-120)).current;
  const anim5 = useRef(new Animated.Value(-180)).current;
  const anim6 = useRef(new Animated.Value(-130)).current;
  const anim7 = useRef(new Animated.Value(-160)).current;
  const anim8 = useRef(new Animated.Value(-90)).current;
  const anim9 = useRef(new Animated.Value(-110)).current;
  const anim10 = useRef(new Animated.Value(-140)).current;
  const anim11 = useRef(new Animated.Value(-170)).current;
  const anim12 = useRef(new Animated.Value(-125)).current;

  useEffect(() => {
    // Continuous top-to-bottom loop animations
    const createLoopAnimation = (animValue: Animated.Value, delay: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: height + 200, // Move from top to bottom
            duration: duration,
            useNativeDriver: true,
            easing: Easing.linear,
          }),
          Animated.timing(animValue, {
            toValue: -200, // Reset to top
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start all animations with varied speeds
    createLoopAnimation(anim1, 0, 8000).start();
    createLoopAnimation(anim2, 1000, 10000).start();
    createLoopAnimation(anim3, 2000, 12000).start();
    createLoopAnimation(anim4, 500, 9000).start();
    createLoopAnimation(anim5, 1500, 11000).start();
    createLoopAnimation(anim6, 300, 8500).start();
    createLoopAnimation(anim7, 1800, 10500).start();
    createLoopAnimation(anim8, 700, 9500).start();
    createLoopAnimation(anim9, 1200, 10200).start();
    createLoopAnimation(anim10, 400, 8800).start();
    createLoopAnimation(anim11, 1600, 10800).start();
    createLoopAnimation(anim12, 600, 9200).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Bold blue-themed icons and shapes moving from top to bottom */}
      <Animated.View style={{ 
        position: 'absolute', 
        left: '8%', 
        transform: [{ translateY: anim1 }] 
      }}>
        <MaterialCommunityIcons name="star" size={60} color="#0EA5E9" style={{ opacity: 0.25 }} />
      </Animated.View>
      
      <Animated.View style={{ 
        position: 'absolute', 
        left: '22%', 
        transform: [{ translateY: anim2 }] 
      }}>
        <MaterialCommunityIcons name="shape-circle-plus" size={70} color="#0284C7" style={{ opacity: 0.2 }} />
      </Animated.View>
      
      <Animated.View style={{ 
        position: 'absolute', 
        right: '12%', 
        transform: [{ translateY: anim3 }] 
      }}>
        <MaterialCommunityIcons name="book-open-page-variant" size={80} color="#0369A1" style={{ opacity: 0.22 }} />
      </Animated.View>
      
      <Animated.View style={{ 
        position: 'absolute', 
        right: '28%', 
        transform: [{ translateY: anim4 }] 
      }}>
        <MaterialCommunityIcons name="music-note" size={65} color="#0EA5E9" style={{ opacity: 0.23 }} />
      </Animated.View>
      
      <Animated.View style={{ 
        position: 'absolute', 
        left: '48%', 
        transform: [{ translateY: anim5 }] 
      }}>
        <MaterialCommunityIcons name="alphabetical" size={75} color="#0284C7" style={{ opacity: 0.2 }} />
      </Animated.View>

      {/* Additional shapes */}
      <Animated.View style={{ 
        position: 'absolute', 
        left: '15%', 
        transform: [{ translateY: anim6 }] 
      }}>
        <MaterialCommunityIcons name="hexagon" size={55} color="#0EA5E9" style={{ opacity: 0.22 }} />
      </Animated.View>

      <Animated.View style={{ 
        position: 'absolute', 
        right: '20%', 
        transform: [{ translateY: anim7 }] 
      }}>
        <MaterialCommunityIcons name="triangle" size={68} color="#0369A1" style={{ opacity: 0.21 }} />
      </Animated.View>

      <Animated.View style={{ 
        position: 'absolute', 
        left: '35%', 
        transform: [{ translateY: anim8 }] 
      }}>
        <MaterialCommunityIcons name="square" size={58} color="#0284C7" style={{ opacity: 0.24 }} />
      </Animated.View>

      <Animated.View style={{ 
        position: 'absolute', 
        right: '8%', 
        transform: [{ translateY: anim9 }] 
      }}>
        <MaterialCommunityIcons name="pentagon" size={62} color="#0EA5E9" style={{ opacity: 0.23 }} />
      </Animated.View>

      <Animated.View style={{ 
        position: 'absolute', 
        left: '5%', 
        transform: [{ translateY: anim10 }] 
      }}>
        <MaterialCommunityIcons name="diamond" size={64} color="#0284C7" style={{ opacity: 0.2 }} />
      </Animated.View>

      <Animated.View style={{ 
        position: 'absolute', 
        right: '35%', 
        transform: [{ translateY: anim11 }] 
      }}>
        <MaterialCommunityIcons name="octagon" size={72} color="#0369A1" style={{ opacity: 0.22 }} />
      </Animated.View>

      <Animated.View style={{ 
        position: 'absolute', 
        left: '60%', 
        transform: [{ translateY: anim12 }] 
      }}>
        <MaterialCommunityIcons name="heart" size={56} color="#0EA5E9" style={{ opacity: 0.25 }} />
      </Animated.View>
      
      {/* Additional static decorative elements */}
      <MaterialCommunityIcons name="circle" size={100} color="#0EA5E9" style={{ position: 'absolute', top: '20%', right: '5%', opacity: 0.08 }} />
      <MaterialCommunityIcons name="circle" size={120} color="#0284C7" style={{ position: 'absolute', bottom: '15%', left: '8%', opacity: 0.06 }} />
      <MaterialCommunityIcons name="circle" size={90} color="#0369A1" style={{ position: 'absolute', top: '60%', left: '3%', opacity: 0.07 }} />
      <MaterialCommunityIcons name="circle" size={110} color="#0EA5E9" style={{ position: 'absolute', bottom: '30%', right: '2%', opacity: 0.06 }} />
    </View>
  );
};

// --- ANIMATED CATEGORY CARD COMPONENT (With Cartoon Images) ---
const AnimatedCategoryCard = ({ item, index, onPress, nativeLanguage }: { item: CategoryItem; index: number; onPress: () => void; nativeLanguage: Language }) => {
  const cardAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: 1,
      delay: index * 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };
  
  return (
    <Animated.View 
      style={[
        { width: '48%', marginBottom: 15 },
        {
          opacity: cardAnim,
          transform: [{
            scale: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Animated.View
          style={{
            transform: [{ scale: pressAnim }],
          }}
        >
          <LinearGradient colors={item.colors} style={{
            borderRadius: 28,
            padding: 16,
            minHeight: 160,
            justifyContent: 'flex-start',
            alignItems: 'center',
            elevation: 8,
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 8 }, 
            shadowOpacity: 0.25,
            shadowRadius: 12,
            borderWidth: 3,
            borderColor: 'rgba(255, 255, 255, 0.4)',
            overflow: 'hidden',
          }}>
            {/* Cartoon/Anime Image */}
            <View style={{
              width: 90, 
              height: 90, 
              borderRadius: 45,
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 5,
              borderWidth: 3,
              borderColor: 'rgba(255, 255, 255, 0.5)',
            }}>
              <Image
                source={item.imagePath}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  resizeMode: 'contain',
                }}
              />
            </View>

            {/* Title and Subtitle */}
            <Text style={[
              {
                fontWeight: '900', 
                color: '#FFF', 
                textAlign: 'center',
                marginBottom: 4,
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              },
              getLanguageTextStyle(nativeLanguage, 18),
            ]}>{item.title}</Text>
            <Text style={[
              {
                fontWeight: '700', 
                color: 'rgba(255,255,255,0.95)', 
                marginTop: 2,
                textAlign: 'center',
              },
              getLanguageTextStyle(nativeLanguage, 13),
            ]}>{item.subtitle}</Text>

            {/* Clickable Indicator - Arrow Icon */}
            <View style={{
              marginTop: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: 15,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}>
              <MaterialCommunityIcons name="arrow-right-circle" size={20} color="#FFF" />
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- CONFIGURATION ---
interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  icon: any;
  colors: readonly [string, string];
  imagePath: any; // Image source for cartoon/anime image
}

// Progress data interface
interface ProgressData {
  totalActivitiesCompleted: number;
  totalActivitiesAttempted: number;
  averageScore: number;
  totalXpPoints: number;
  totalTimeSpentSeconds: number;
  level: number;
  nextLevelXp: number;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentUser } = useUser();
  const responsive = useResponsive();
  const { resumeBackground, disableBackground } = useBackgroundAudio();
  
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData | null>({
    totalActivitiesCompleted: 0,
    totalActivitiesAttempted: 0,
    averageScore: 0,
    totalXpPoints: 0,
    totalTimeSpentSeconds: 0,
    level: 1,
    nextLevelXp: 300,
  });
  const [summary, setSummary] = useState<ProgressSummaryDto | null>(null);
  const [continueTarget, setContinueTarget] = useState<{
    activityId: number;
    activityTypeId: number;
    title: string;
  } | null>(null);
  const [profileImageError, setProfileImageError] = useState(false);
  const [profileImageLocal, setProfileImageLocal] = useState<string | null>(null);
  const [cachedStudentProfile, setCachedStudentProfile] = useState<{ id?: string; nickname?: string; avatar?: string } | null>(null);
  const [nativeLanguage, setNativeLanguage] = useState<Language>('English');
  
  // Animation refs for entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const categoriesAnim = useRef(new Animated.Value(0)).current;

  // DATA definition inside component - Blue/Teal theme matching admin dashboard with cartoon images
  const t = getTranslations(nativeLanguage);
  const categories: CategoryItem[] = [
    { id: 'stories', title: t.homeStoryTitle, subtitle: t.homeStorySubtitle, type: 'stories', icon: 'book-open-page-variant', colors: ['#0EA5E9', '#0284C7'], imagePath: require('../../assets/story-play.png') },
    { id: 'videos', title: t.homeVideosTitle, subtitle: t.homeVideosSubtitle, type: 'videos', icon: 'youtube-tv', colors: ['#0369A1', '#075985'], imagePath: require('../../assets/watching-video.png') },
    { id: 'songs', title: t.homeSongsTitle, subtitle: t.homeSongsSubtitle, type: 'songs', icon: 'music-circle', colors: ['#0284C7', '#0EA5E9'], imagePath: require('../../assets/listen-song.png') },
    { id: 'conversation', title: t.homeConversationTitle, subtitle: t.homeConversationSubtitle, type: 'conversation', icon: 'microphone', colors: ['#075985', '#0369A1'], imagePath: require('../../assets/conversation.png') }
  ];

  // Get activity/lesson names in student's native language; fall back gracefully
  const getActivityNameForLang = (item: { name_en?: string; name_ta?: string; name_si?: string }) => {
    switch (nativeLanguage) {
      case 'Tamil':
        return item.name_ta || item.name_en || item.name_si || 'Activity';
      case 'Sinhala':
        return item.name_si || item.name_en || item.name_ta || 'Activity';
      case 'English':
      default:
        return item.name_en || item.name_ta || item.name_si || 'Activity';
    }
  };

  const getProfileStorageKey = (user: any) => {
    if (!user) return 'guest_profile_image';
    if ((user as any).isGuest) return 'guest_profile_image';
    return `profile_image_${user.id || user.username || 'user'}`;
  };

  useEffect(() => {
    const loadProfileImageFromStorage = async () => {
      try {
        const key = getProfileStorageKey(currentUser);
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          setProfileImageLocal(stored);
        } else {
          setProfileImageLocal(null);
        }
      } catch {
        setProfileImageLocal(null);
      }
    };
    loadProfileImageFromStorage();
  }, [currentUser]);

  // Load native language preference - reload on focus to pick up changes
  useFocusEffect(
    useCallback(() => {
      const loadLang = async () => {
        const pref = await loadStudentLanguagePreference();
        const native = languageCodeToLanguage(pref.nativeLanguageCode);
        setNativeLanguage(native);
      };
      loadLang();
    }, [])
  );

  useEffect(() => {
    // Entrance animations
    Animated.stagger(200, [
      Animated.spring(headerAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
      Animated.spring(progressAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
      Animated.spring(categoriesAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Prefer cached student profile id (child), fallback to currentUser.id
      const studentId = cachedStudentProfile?.id || currentUser?.id;
      if (studentId) {
        try {
          const s = await apiService.getStudentSummary(studentId);
          setSummary(s || null);

          if (s) {
            setProgressData({
              totalActivitiesCompleted: s.totalActivitiesCompleted,
              totalActivitiesAttempted: s.totalActivitiesAttempted,
              averageScore: s.averageScore,
              totalXpPoints: s.totalXpPoints,
              totalTimeSpentSeconds: s.totalTimeSpentSeconds,
              level: Math.floor(s.totalXpPoints / 300) + 1,
              nextLevelXp: ((Math.floor(s.totalXpPoints / 300) + 1) * 300)
            });
          }

          // Determine continue target from most recent completed activity -> move to the next one if available
          const recent = s?.recentActivities?.[0];
          if (recent?.activityId) {
            try {
              // Try to derive next activity: current activity + 1 (sequence-based)
              const currentActivity = await apiService.getActivityById(recent.activityId);
              if (currentActivity) {
                // heuristic: fetch the list for the same stage and pick the next by sequenceOrder
                const siblings = await apiService.getActivitiesByStage(currentActivity.stageId);
                const sorted = siblings.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
                const idx = sorted.findIndex(a => a.id === currentActivity.id);
                const next = idx >= 0 && idx + 1 < sorted.length ? sorted[idx + 1] : currentActivity;
                const activityType: ActivityTypeDto | null = await apiService.getActivityTypeById(next.activityTypeId);
                if (activityType) {
                  setContinueTarget({
                    activityId: next.id,
                    activityTypeId: activityType.id,
                    title: getActivityNameForLang(next),
                  });
                } else {
                  setContinueTarget(null);
                }
              }
            } catch {
              setContinueTarget(null);
            }
          } else {
            setContinueTarget(null);
          }
        } catch (error) {
          console.warn('Failed to fetch progress data:', error);
          setProgressData(prev => prev || {
            totalActivitiesCompleted: 0,
            totalActivitiesAttempted: 0,
            averageScore: 0,
            totalXpPoints: 0,
            totalTimeSpentSeconds: 0,
            level: 1,
            nextLevelXp: 300
          });
          setSummary(null);
          setContinueTarget(null);
        }
      } else {
        setSummary(null);
        setContinueTarget(null);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }, [currentUser?.id, cachedStudentProfile?.id, nativeLanguage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    // Load cached student profile (nickname) saved after child creation
    const loadCachedStudent = async () => {
      try {
        const raw = await AsyncStorage.getItem('@trilingo_student_profile');
        if (raw) {
          setCachedStudentProfile(JSON.parse(raw));
        }
      } catch {
        setCachedStudentProfile(null);
      }
    };
    loadCachedStudent();
  }, []);

  useEffect(() => {
    if (currentUser) {
      resumeBackground().catch(() => null);
    } else {
      disableBackground().catch(() => null);
    }
    setProfileImageError(false);
  }, [currentUser]);

  const handleNavigation = (categoryType: string) => {
    // Mapping Logic...
    const routeMap: Record<string, string> = {
      learning: 'Lessons',
      songs: 'Songs',
      music: 'Songs', // alias to ensure Music card always opens songs list
      videos: 'Videos',
      stories: 'Stories',
      conversation: 'Conversation',
    };

    const route = routeMap[categoryType];
    if (route) {
      navigation.navigate(route as never);
    }
  };

  const renderProfileImage = () => {
    if (!currentUser) {
      return (
        <View style={styles.profilePlaceholder}>
          <MaterialCommunityIcons name="account" size={24} color="#0284C7" />
        </View>
      );
    }
    
    const raw = profileImageLocal || currentUser.profileImageUrl;
    if (raw && isEmojiLike(raw)) {
      return (
        <View style={[styles.profilePlaceholder, styles.emojiContainer]}>
          <Text style={{ fontSize: 18 }}>{raw}</Text>
        </View>
      );
    }

    const imageUri = resolveImageUri(raw);
    if (imageUri && !profileImageError) {
      return (
        <Image
          source={{ uri: imageUri }}
          style={styles.profileImage}
          onError={() => setProfileImageError(true)}
        />
      );
    }

    return (
      <View style={styles.profilePlaceholder}>
        <MaterialCommunityIcons name="account" size={24} color="#0284C7" />
      </View>
    );
  };

  const calculateProgress = () => {
    if (!progressData) return 0;
    const currentLevelXp = (progressData.level - 1) * 300;
    const xpInCurrentLevel = progressData.totalXpPoints - currentLevelXp;
    const xpNeededForNextLevel = progressData.nextLevelXp - currentLevelXp;
    return Math.min(Math.max((xpInCurrentLevel / xpNeededForNextLevel) * 100, 0), 100);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleContinue = () => {
    if (continueTarget) {
      (navigation as any).navigate('PlayScreen', {
        activityId: continueTarget.activityId,
        activityTypeId: continueTarget.activityTypeId,
        activityTitle: continueTarget.title,
      });
    } else {
      (navigation as any).navigate('Lessons');
    }
  };

  const styles = getStyles(responsive);
  // Always prefer student nickname; fallback to cached nickname, then neutral label
  const displayName = String(summary?.studentNickname || cachedStudentProfile?.nickname || 'Student');

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#924DBF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3846" />
      
      {/* Background Pattern */}
      <BackgroundDoodles />

      {/* --- HEADER (Animated) - Compact with Profile on Top Right --- */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-30, 0],
              }),
            }],
          },
        ]}
      >
        <View style={styles.headerTextContainer}>
          <Text style={[styles.greetingText, getLanguageTextStyle(nativeLanguage, 18)]}>{t.homeHello},</Text>
          <Text style={[styles.appName, getLanguageTextStyle(nativeLanguage, 20)]}>
            {displayName}{' '}
            <Text>👋</Text>
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => (navigation as any).navigate('Profile')}
          style={styles.profileButton}
          activeOpacity={0.7}
        >
          {renderProfileImage()}
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* --- WELCOME TO Q-BIT TEXT --- */}
        <Animated.View 
          style={[
            styles.welcomeContainer,
            {
              opacity: headerAnim,
              transform: [{
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={[styles.welcomeText, getLanguageTextStyle(nativeLanguage, 20)]}>Welcome to</Text>
          <View style={styles.qbitContainer}>
            <Text style={[styles.qbitText, getLanguageTextStyle(nativeLanguage, 28)]}>✨Q-Bit</Text>
            <Text style={styles.sparkleEmoji}>✨</Text>
          </View>
        </Animated.View>

        {/* --- JOY IN EDUCATION ANIMATION --- */}
        <View style={styles.heroCard}>
          <LottieView
            source={require('../../assets/animations/Joy in Education.json')}
            autoPlay
            loop
            style={styles.heroAnimation}
          />
        </View>
        
        {/* --- PROGRESS SUMMARY (Animated) --- */}
        {progressData && (
          <Animated.View 
            style={[
              {
                opacity: progressAnim,
                transform: [{
                  scale: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                }],
              },
            ]}
          >
            <View
              style={styles.progressContainer}
            >
              <View style={styles.progressHeader}>
                <Text style={[styles.progressTitle, getLanguageTextStyle(nativeLanguage, 18)]}>{t.homeProgressTitle}</Text>
                <Text style={[styles.levelText, getLanguageTextStyle(nativeLanguage, 14)]}>{t.homeLevelLabel} {String(progressData.level || 1)}</Text>
              </View>
              
              <View style={styles.xpContainer}>
                <Text style={[styles.xpText, getLanguageTextStyle(nativeLanguage, 16)]}>{String(progressData.totalXpPoints || 0)} XP</Text>
                <Text style={[styles.nextLevelText, getLanguageTextStyle(nativeLanguage, 12)]}>{t.homeNextLevel} {String(progressData.nextLevelXp || 300)} XP</Text>
              </View>
              
              <View style={styles.progressBarBackground}>
                <Animated.View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${calculateProgress()}%`,
                      backgroundColor: calculateProgress() === 100 ? '#0284C7' : '#0284C7'
                    }
                  ]} 
                />
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <MaterialCommunityIcons name="star" size={24} color="#0284C7" />
                  <Text style={[styles.statValue, getLanguageTextStyle(nativeLanguage, 18)]}>{String(progressData.totalActivitiesCompleted || 0)}</Text>
                  <Text style={[styles.statLabel, getLanguageTextStyle(nativeLanguage, 12)]}>{t.homeStarsLabel}</Text>
                </View>
                
                <View style={styles.statBox}>
                  <MaterialCommunityIcons name="trophy" size={24} color="#0369A1" />
                  <Text style={[styles.statValue, getLanguageTextStyle(nativeLanguage, 18)]}>{String(progressData.level || 1)}</Text>
                  <Text style={[styles.statLabel, getLanguageTextStyle(nativeLanguage, 12)]}>{t.homeLevelLabel}</Text>
                </View>
                
                <View style={styles.statBox}>
                  <MaterialCommunityIcons name="chart-line" size={24} color="#0EA5E9" />
                  <Text style={[styles.statValue, getLanguageTextStyle(nativeLanguage, 18)]}>{String(Math.round(progressData.averageScore || 0))}%</Text>
                  <Text style={[styles.statLabel, getLanguageTextStyle(nativeLanguage, 12)]}>{t.homeAccuracyLabel}</Text>
                </View>
                
                <View style={styles.statBox}>
                  <MaterialCommunityIcons name="clock-outline" size={24} color="#0284C7" />
                  <Text style={[styles.statValue, getLanguageTextStyle(nativeLanguage, 18)]}>{String(formatTime(progressData.totalTimeSpentSeconds || 0))}</Text>
                  <Text style={[styles.statLabel, getLanguageTextStyle(nativeLanguage, 12)]}>{t.homeTimeLabel}</Text>
                </View>
              </View>

              {continueTarget && (
                <TouchableOpacity style={styles.continueButton} activeOpacity={0.9} onPress={handleContinue}>
                  <Text style={[styles.continueButtonText, getLanguageTextStyle(nativeLanguage, 16)]}>{t.continue}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={22} color="#fff" />
                </TouchableOpacity>
              )}
              {!continueTarget && (
                <TouchableOpacity style={styles.continueButton} activeOpacity={0.9} onPress={handleContinue}>
                  <Text style={[styles.continueButtonText, getLanguageTextStyle(nativeLanguage, 16)]}>{t.start}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={22} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
           </Animated.View>
         )}


        {/* --- ACTIVITY CATEGORIES (Animated) --- */}
        <Animated.View
          style={[
            styles.categoriesSection,
            {
              opacity: categoriesAnim,
              transform: [{
                translateY: categoriesAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, getLanguageTextStyle(nativeLanguage, 20)]}>{t.homeCategoriesTitle} 🎨</Text>
          
          <View style={styles.gridContainer}>
            {categories.map((item, index) => (
              <AnimatedCategoryCard
                key={item.id}
                item={item}
                index={index}
                onPress={() => handleNavigation(item.type)}
                nativeLanguage={nativeLanguage}
              />
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

// --- STYLES ---
const getStyles = (responsive: ReturnType<typeof useResponsive>) => StyleSheet.create({
  // Light blue background matching admin dashboard theme
  container: { flex: 1, backgroundColor: '#E0F2FE' }, 
  centerContainer: { justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    // Use symmetric vertical padding so text + profile icon sit exactly in the center
    paddingVertical: 12,
    marginTop: 12,
    marginBottom: 15,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 15,
  },
  greetingText: { 
    fontSize: 18, 
    color: '#0284C7', 
    fontWeight: '700',
    lineHeight: 22,
  },
  appName: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#0369A1', 
    marginTop: 2,
    lineHeight: 34,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0284C7',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: { 
    width: 46, 
    height: 46, 
    borderRadius: 23, 
    resizeMode: 'cover',
  },
  profilePlaceholder: { 
    width: 46, 
    height: 46, 
    borderRadius: 23,
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
  },
  emojiContainer: { 
    justifyContent: 'center', 
    alignItems: 'center',
    width: 46,
    height: 46,
  },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },

  // Welcome to Q-Bit text - Kid-friendly attractive UI
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  welcomeText: {
    fontSize:38,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 4,
    textShadowColor: 'rgba(2, 132, 199, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  qbitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qbitText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0284C7',
    letterSpacing: 2,
    textShadowColor: 'rgba(2, 132, 199, 0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  sparkleEmoji: {
    fontSize: 36,
    marginLeft: 8,
  },

  // Hero animation card - White background with increased border radius
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 85,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  heroAnimation: {
    width: '100%',
    height: responsive.width >= 600 ? 220 : 180,
  },

  // Progress Section - Solid background without glass effect
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 28,
    padding: responsive.width >= 600 ? 24 : 18,
    marginBottom: 18,
    borderWidth: 2.5,
    borderColor: 'rgba(2, 132, 199, 0.3)',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0284C7',
  },
  levelText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  xpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  xpText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0284C7',
  },
  nextLevelText: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 16,
    backgroundColor: '#BFDBFE',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0284C7',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 13,
    color: '#0369A1',
    marginTop: 3,
    fontWeight: '600',
  },
  continueButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#0EA5E9',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  categoriesSection: {
    marginTop: 25,
    marginBottom: 10,
  },
  sectionTitle: { 
    fontSize: responsive.width >= 600 ? 26 : 22, 
    fontWeight: '900', 
    color: '#0369A1', 
    marginBottom: 16, 
    marginLeft: 5,
    textShadowColor: 'rgba(2, 132, 199, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // Quick Actions
  quickActionsContainer: {
    marginBottom: 25,
  },
  actionCard: {
    borderRadius: 24,
    padding: 24,
    minHeight: 110,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },

  // GRID STYLES
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemWrapper: {
    width: '48%', // 2 columns
    marginBottom: 15,
  },
  gridItem: {
    borderRadius: 24,
    padding: 18,
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.2,
    shadowRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridIconContainer: {
    width: 60, 
    height: 60, 
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gridTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#FFF', 
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  gridSubtitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: 'rgba(255,255,255,0.95)', 
    marginTop: 2,
    textAlign: 'center',
  },
});

export default HomeScreen;