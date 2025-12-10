import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { resolveImageUri, isEmojiLike } from '../utils/imageUtils';
import { getTranslation, Language } from '../utils/translations';
import { useResponsive } from '../utils/responsive';

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { currentUser } = useUser();
  const responsive = useResponsive();
  const isGuest = currentUser?.isGuest || !currentUser;
  const nativeLanguage: Language = (currentUser?.nativeLanguage as Language) || 'English';

  // colors for the icon backgrounds (Pastel versions for clean look)
  const categoryColors = {
    learning: '#E0F2FE', // Light Blue
    letters: '#FEF3C7', // Light Yellow
    songs: '#FCE7F3',   // Light Pink
    videos: '#E0E7FF',  // Light Indigo
    stories: '#FFEDD5', // Light Orange
    conversation: '#CCFBF1', // Light Teal
  };

  const iconColors = {
    learning: '#0284C7',
    letters: '#D97706',
    songs: '#DB2777',
    videos: '#4F46E5',
    stories: '#EA580C',
    conversation: '#0D9488',
  };

  const buttons = [
    { id: 'learning', title: 'Learning', icon: 'gamepad-variant-outline', type: 'learning' },
    { id: 'letters', title: 'Letters', icon: 'alphabetical-variant', type: 'letters' },
    { id: 'songs', title: 'Songs', icon: 'music-note-outline', type: 'songs' },
    { id: 'videos', title: 'Videos', icon: 'youtube-tv', type: 'videos' },
    { id: 'stories', title: 'Stories', icon: 'book-open-page-variant-outline', type: 'stories' },
    { id: 'conversation', title: 'Speaking', icon: 'account-voice', type: 'conversation' },
  ];

  const statsCards = React.useMemo(() => [
    { id: 'lessons', label: getTranslation(nativeLanguage, 'lessons'), value: '24', icon: 'book-check-outline' },
    { id: 'points', label: getTranslation(nativeLanguage, 'points'), value: '156', icon: 'trophy-outline' },
    { id: 'days', label: getTranslation(nativeLanguage, 'days'), value: '12', icon: 'fire' },
  ], [nativeLanguage]);

  const handleNavigation = (route: string) => {
    if (isGuest) {
      alert('Guest users can access limited content. Please login to unlock all features!');
    }
    // Map IDs to Route Names
    const routes: Record<string, string> = {
      learning: 'Levels',
      letters: 'LetterSelection',
      songs: 'Songs',
      videos: 'Videos',
      stories: 'Stories',
      conversation: 'Conversation',
    };
    navigation.navigate(routes[route] as never);
  };

  const styles = getStyles(responsive, isDarkMode);

  // --- COMPONENT: Header Profile ---
  const renderProfile = () => {
    if (isGuest) {
      return (
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login' as never)}>
          <Text style={styles.loginBtnText}>Log In</Text>
        </TouchableOpacity>
      );
    }

    if (currentUser?.profileImageUrl) {
      const imageUri = resolveImageUri(currentUser.profileImageUrl);
      if (imageUri) return <Image source={{ uri: imageUri }} style={styles.profileImage} />;
      if (isEmojiLike(currentUser.profileImageUrl)) {
        return <View style={[styles.profileImage, styles.emojiContainer]}><Text style={{fontSize: 20}}>{currentUser.profileImageUrl}</Text></View>;
      }
    }
    return <View style={[styles.profileImage, styles.defaultAvatar]}><MaterialIcons name="person" size={24} color="#FFF" /></View>;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? '#0F172A' : '#F8FAFC'} />

      {/* --- HEADER SECTION --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {isGuest ? 'Hello, Guest' : `Hi, ${currentUser?.name || currentUser?.username}`}
          </Text>
          <Text style={styles.subGreeting}>{getTranslation(nativeLanguage, 'welcomeTo')} Q-bit</Text>
        </View>
        <TouchableOpacity onPress={() => !isGuest && navigation.navigate('Profile' as never)}>
          {renderProfile()}
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- STATS ROW --- */}
        <View style={styles.statsRow}>
          {statsCards.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={styles.statIconCircle}>
                <MaterialCommunityIcons name={stat.icon as any} size={20} color="#002D62" />
              </View>
              <View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* --- BANNER (Start Learning) --- */}
        <TouchableOpacity 
          style={styles.banner}
          activeOpacity={0.9}
          
        >
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>{getTranslation(nativeLanguage, 'startLearningAdventure')}</Text>
            <Text style={styles.bannerSubtitle}>Continue your daily progress!</Text>
          </View>
          <View style={styles.bannerIcon}>
             <MaterialCommunityIcons name="rocket-launch" size={40} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* --- SECTION TITLE --- */}
        <Text style={styles.sectionTitle}>Explore Categories</Text>

        {/* --- GRID MENU --- */}
        <View style={styles.gridContainer}>
          {buttons.map((btn) => (
            <TouchableOpacity 
              key={btn.id} 
              style={styles.gridCard}
              onPress={() => handleNavigation(btn.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: categoryColors[btn.type as keyof typeof categoryColors] }]}>
                <MaterialCommunityIcons 
                  name={btn.icon as any} 
                  size={32} 
                  color={iconColors[btn.type as keyof typeof iconColors]} 
                />
              </View>
              <Text style={styles.cardTitle}>{btn.title}</Text>
              <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" style={styles.cardArrow} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{height: 20}} /> 
      </ScrollView>
    </View>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0F172A' : '#F8FAFC', // Very light gray-blue background
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsive.wp(6),
    paddingTop: responsive.hp(6), // Safe area
    paddingBottom: responsive.hp(2),
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#F1F5F9',
  },
  greeting: {
    fontSize: responsive.wp(6),
    fontWeight: '800',
    color: isDark ? '#F8FAFC' : '#002D62', // Brand Blue
    letterSpacing: 0.5,
  },
  subGreeting: {
    fontSize: responsive.wp(3.5),
    color: isDark ? '#94A3B8' : '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  emojiContainer: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatar: {
    backgroundColor: '#002D62',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtn: {
    backgroundColor: '#002D62',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loginBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },

  // Content
  scrollContent: {
    paddingHorizontal: responsive.wp(6),
    paddingTop: responsive.hp(3),
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: responsive.hp(3),
  },
  statCard: {
    flex: 1,
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 4,
    // Soft Shadow
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? '#334155' : '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statValue: {
    fontSize: responsive.wp(4),
    fontWeight: 'bold',
    color: isDark ? '#F8FAFC' : '#0F172A',
  },
  statLabel: {
    fontSize: responsive.wp(2.5),
    color: isDark ? '#94A3B8' : '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
  },

  // Banner
  banner: {
    backgroundColor: '#002D62', // Brand Color
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsive.hp(4),
    // Deep Shadow
    shadowColor: "#002D62",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: responsive.wp(5),
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: responsive.wp(3.5),
  },
  bannerIcon: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Grid
  sectionTitle: {
    fontSize: responsive.wp(4.5),
    fontWeight: '700',
    color: isDark ? '#E2E8F0' : '#1E293B',
    marginBottom: responsive.hp(2),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16, // Works in newer RN, otherwise use margin in card
  },
  gridCard: {
    width: '47%', // 2 columns with spacing
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    // Card Shadow
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: responsive.wp(4),
    fontWeight: '600',
    color: isDark ? '#F1F5F9' : '#334155',
    marginBottom: 4,
  },
  cardArrow: {
    marginTop: 4,
    opacity: 0.5,
  },
});

export default HomeScreen;