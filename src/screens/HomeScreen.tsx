import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, 
  StatusBar, ActivityIndicator, Alert, Animated, Easing, Dimensions 
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { resolveImageUri, isEmojiLike } from '../utils/imageUtils';
import { useResponsive } from '../utils/responsive';
import { useBackgroundAudio } from '../context/BackgroundAudioContext';
import apiService from '../services/api'; 

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

// --- 2. BACKGROUND DOODLES (To fill white space) ---
const BackgroundDoodles = () => {
  // Random icons scattered in the background with low opacity
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <MaterialCommunityIcons name="star" size={40} color="#59A4C6" style={{ position: 'absolute', top: 50, left: 20, opacity: 0.1 }} />
      <MaterialCommunityIcons name="shape-circle-plus" size={50} color="#4289BA" style={{ position: 'absolute', top: 150, right: -10, opacity: 0.05 }} />
      <MaterialCommunityIcons name="balloon" size={60} color="#2D4F9C" style={{ position: 'absolute', top: 300, left: -20, opacity: 0.05 }} />
      <MaterialCommunityIcons name="music-note" size={40} color="#0D5B81" style={{ position: 'absolute', bottom: 100, right: 30, opacity: 0.1 }} />
      <MaterialCommunityIcons name="pencil" size={50} color="#59A4C6" style={{ position: 'absolute', bottom: 250, left: 50, opacity: 0.05 }} />
      <MaterialCommunityIcons name="alphabetical" size={80} color="#2D4F9C" style={{ position: 'absolute', top: '50%', right: '40%', opacity: 0.03 }} />
    </View>
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
  const isGuest = currentUser?.isGuest || !currentUser;
  const { resumeBackground, disableBackground } = useBackgroundAudio();
  
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);

  // DATA definition inside component to control order
  const categories: CategoryItem[] = [
    { id: 'letters', title: 'ABC & 123', subtitle: 'Basics', type: 'letters', icon: 'alphabetical-variant', colors: ['#59A4C6', '#4289BA'] },
    { id: 'stories', title: 'Story Time', subtitle: 'Read', type: 'stories', icon: 'book-open-page-variant', colors: ['#749FCD', '#2D4F9C'] },
    { id: 'videos', title: 'Cartoons', subtitle: 'Watch', type: 'videos', icon: 'youtube-tv', colors: ['#4289BA', '#0D5B81'] },
    { id: 'songs', title: 'Music', subtitle: 'Dance', type: 'songs', icon: 'music-circle', colors: ['#59A4C6', '#2D4F9C'] },
    { id: 'conversation', title: 'Speak Up', subtitle: 'Talk', type: 'conversation', icon: 'microphone', colors: ['#59A4C6', '#0D5B81'] }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (currentUser?.id) {
          // Fetch progress data from backend
          try {
            const summary = await apiService.getStudentSummary(currentUser.id);
            if (summary) {
              setProgressData({
                totalActivitiesCompleted: summary.totalActivitiesCompleted,
                totalActivitiesAttempted: summary.totalActivitiesAttempted,
                averageScore: summary.averageScore,
                totalXpPoints: summary.totalXpPoints,
                totalTimeSpentSeconds: summary.totalTimeSpentSeconds,
                level: Math.floor(summary.totalXpPoints / 300) + 1, // Simple level calculation
                nextLevelXp: ((Math.floor(summary.totalXpPoints / 300) + 1) * 300) // Next level requirement
              });
            }
          } catch (error) {
            console.warn('Failed to fetch progress data:', error);
            // Set default values if fetch fails
            setProgressData({
              totalActivitiesCompleted: 0,
              totalActivitiesAttempted: 0,
              averageScore: 0,
              totalXpPoints: 0,
              totalTimeSpentSeconds: 0,
              level: 1,
              nextLevelXp: 300
            });
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      resumeBackground().catch(() => null);
    } else {
      disableBackground().catch(() => null);
    }
  }, [currentUser]);

  const handleNavigation = (categoryType: string) => {
    if (isGuest && categoryType !== 'learning') {
      Alert.alert('Locked!', 'Ask your parents to log in!');
      return;
    }
    // Mapping Logic...
    const routeMap: Record<string, string> = {
      learning: 'Lessons',
      letters: 'LetterSelection',
      songs: 'Songs',
      videos: 'Videos',
      stories: 'Stories',
      conversation: 'Conversation',
    };
    navigation.navigate(routeMap[categoryType] as never);
  };

  const renderProfileImage = () => {
    if (!currentUser || currentUser.isGuest) {
      return (
        <View style={styles.profilePlaceholder}>
          <MaterialIcons name="person" size={24} color="#FFF" />
        </View>
      );
    }
    
    const imageUri = resolveImageUri(currentUser.profileImageUrl);
    if (imageUri) {
      return <Image source={{ uri: imageUri }} style={styles.profileImage} />;
    }
    
    return (
      <View style={[styles.profileImage, styles.emojiContainer]}>
        <Text style={{fontSize: 20}}>😊</Text>
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
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const styles = getStyles(responsive);

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

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greetingText}>Hello,</Text>
          <Text style={styles.appName}>
            {isGuest ? 'Little Star!' : (currentUser?.name || 'Dilu')}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => (navigation as any).navigate('Profile')}
          style={styles.profileButton}
        >
          {renderProfileImage()}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- PROGRESS SUMMARY --- */}
        {!isGuest && progressData && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.levelText}>Level {progressData.level}</Text>
            </View>
            
            <View style={styles.xpContainer}>
              <Text style={styles.xpText}>{progressData.totalXpPoints} XP</Text>
              <Text style={styles.nextLevelText}>Next level: {progressData.nextLevelXp} XP</Text>
            </View>
            
            <View style={styles.progressBarBackground}>
              <Animated.View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${calculateProgress()}%`,
                    backgroundColor: calculateProgress() === 100 ? '#4CAF50' : '#59A4C6'
                  }
                ]} 
              />
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
                <Text style={styles.statValue}>{progressData.totalActivitiesCompleted}</Text>
                <Text style={styles.statLabel}>Stars</Text>
              </View>
              
              <View style={styles.statBox}>
                <MaterialCommunityIcons name="trophy" size={24} color="#9E72C3" />
                <Text style={styles.statValue}>{progressData.level}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
              
              <View style={styles.statBox}>
                <MaterialCommunityIcons name="chart-line" size={24} color="#4CAF50" />
                <Text style={styles.statValue}>{Math.round(progressData.averageScore)}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              
              <View style={styles.statBox}>
                <MaterialCommunityIcons name="clock-outline" size={24} color="#2196F3" />
                <Text style={styles.statValue}>{formatTime(progressData.totalTimeSpentSeconds)}</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
            </View>
          </View>
        )}

        {/* --- QUICK ACTIONS --- */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.quickActionsContainer}>
          <BouncyButton onPress={() => handleNavigation('learning')}>
            <LinearGradient 
              colors={['#59A4C6', '#2D4F9C']} 
              style={styles.actionCard}
            >
              <MaterialCommunityIcons name="map-marker-path" size={32} color="#FFF" />
              <Text style={styles.actionTitle}>Adventure Map</Text>
              <Text style={styles.actionSubtitle}>Continue your journey</Text>
            </LinearGradient>
          </BouncyButton>
        </View>

        {/* --- ACTIVITY CATEGORIES --- */}
        <Text style={styles.sectionTitle}>Learning Categories</Text>
        
        <View style={styles.gridContainer}>
          {categories.map((item) => (
            <View key={item.id} style={styles.gridItemWrapper}>
              <BouncyButton onPress={() => handleNavigation(item.type)}>
                <LinearGradient colors={item.colors} style={styles.gridItem}>
                  <View style={styles.gridIconContainer}>
                    <MaterialCommunityIcons name={item.icon} size={32} color="#FFF" />
                  </View>
                  <Text style={styles.gridTitle}>{item.title}</Text>
                  <Text style={styles.gridSubtitle}>{item.subtitle}</Text>
                </LinearGradient>
              </BouncyButton>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// --- STYLES ---
const getStyles = (responsive: ReturnType<typeof useResponsive>) => StyleSheet.create({
  // Dark blue background
  container: { flex: 1, backgroundColor: '#0D3846' }, 
  centerContainer: { justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: responsive.hp(6),
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  greetingText: { fontSize: 16, color: '#59A4C6', fontWeight: '600' },
  appName: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginTop: 5 },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileImage: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, borderColor: '#59A4C6' },
  profilePlaceholder: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#2D4F9C', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 3, 
    borderColor: '#59A4C6'
  },
  emojiContainer: { backgroundColor: '#59A4C6', justifyContent: 'center', alignItems: 'center' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },

  // Progress Section
  progressContainer: {
    backgroundColor: 'rgba(66, 137, 186, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(89, 164, 198, 0.3)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  levelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#59A4C6',
    backgroundColor: 'rgba(89, 164, 198, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  xpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#59A4C6',
  },
  nextLevelText: {
    fontSize: 14,
    color: '#A3C4DD',
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: 'rgba(66, 137, 186, 0.3)',
    borderRadius: 6,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#59A4C6',
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#A3C4DD',
    marginTop: 3,
  },

  sectionTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#FFFFFF', 
    marginBottom: 15, 
    marginLeft: 5,
    marginTop: 10,
  },

  // Quick Actions
  quickActionsContainer: {
    marginBottom: 25,
  },
  actionCard: {
    borderRadius: 20,
    padding: 20,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
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
    borderRadius: 20,
    padding: 15,
    minHeight: 130,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1,
  },
  gridIconContainer: {
    width: 50, 
    height: 50, 
    borderRadius: 25,
    backgroundColor: 'rgba(89,164,198,0.25)',
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 10,
  },
  gridTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#FFF', 
    textAlign: 'center',
    marginBottom: 5,
  },
  gridSubtitle: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: 'rgba(255,255,255,0.8)', 
    marginTop: 2,
    textAlign: 'center',
  },
});

export default HomeScreen;