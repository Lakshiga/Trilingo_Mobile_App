import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { resolveImageUri, isEmojiLike } from '../utils/imageUtils';
import { getTranslation, Language } from '../utils/translations';
import { useResponsive } from '../utils/responsive';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { currentUser } = useUser();
  const responsive = useResponsive();
  const isGuest = currentUser?.isGuest || !currentUser;
  const nativeLanguage: Language = (currentUser?.nativeLanguage as Language) || 'English';
  
  // Button data with vibrant, child-friendly colors and images - now with emojis and fun descriptions
  const buttons = [
    { 
      id: 'learning', 
      title: 'Learning', 
      emoji: '🎮',
      description: 'Play & Practice',
      image: require('../../assets/Gemini_Generated_Learning.png'),
      color: ['#43BCCD', '#5DD3A1', '#E0F7F4'] 
    },
    { 
      id: 'songs', 
      title: 'Songs', 
      emoji: '🎵',
      description: 'Sing & Learn',
      image: require('../../assets/Listening.png'),
      color: ['#FF9A8B', '#FF6B9D', '#FFE5E1'] 
    },
    
    { 
      id: 'videos', 
      title: 'Videos', 
      emoji: '📺',
      description: 'Watch & Learn',
      image: require('../../assets/Gemini_Generated_Image_4g1pdr4g1pdr4g1p.png'),
      color: ['#6A8EFF', '#8A6BFF', '#E8E5FF'] 
    },
    { 
      id: 'stories', 
      title: 'Stories', 
      emoji: '📖',
      description: 'Magic Tales',
      image: require('../../assets/Gemini_Generated_Image_46vxlk46vxlk46vx.png'),
      color: ['#FFB366', '#FF8C42', '#FFF4E6'] 
    },
    { 
      id: 'conversation', 
      title: 'Conversation', 
      emoji: '💬',
      description: 'Chat & Speak',
      image: require('../../assets/Conversation.png'),
      color: ['#AEE6FF' , '#6EC9FF', '#E6F7FF'] 
    },
  ];

  type StatCard = {
    id: string;
    label: string;
    value: string;
    colors: [string, string];
    icon: string;
  };

  const statsCards: StatCard[] = React.useMemo(() => [
    {
      id: 'lessons',
      label: getTranslation(nativeLanguage, 'lessons'),
      value: '24',
      colors: ['#FF6B9D', '#FF8FAB'],
      icon: '📚',
    },
    {
      id: 'points',
      label: getTranslation(nativeLanguage, 'points'),
      value: '156',
      colors: ['#FFD700', '#FFA500'],
      icon: '🏆',
    },
    {
      id: 'days',
      label: getTranslation(nativeLanguage, 'days'),
      value: '12',
      colors: ['#667EEA', '#7A8EFC'],
      icon: '🔥',
    },
  ], [nativeLanguage]);

  const handleSongsPress = () => {
    if (isGuest) {
      // Show guest limitation message
      alert('Guest users can access limited content. Please login or register to unlock all features!');
    }
    // Navigate directly to Songs screen instead of SongsStories screen
    navigation.navigate('Songs' as never);
  };

  const handleLearningPress = () => {
    if (isGuest) {
      // Show guest limitation message
      alert('Guest users can access limited content. Please login or register to unlock all features!');
    }
    // Navigate to Levels screen (Learning flow)
    navigation.navigate('Levels' as never);
  };

  const handleVideosPress = () => {
    if (isGuest) {
      // Show guest limitation message
      alert('Guest users can access limited content. Please login or register to unlock all features!');
    }
    // Navigate to the Videos screen
    navigation.navigate('Videos' as never);
  };

  const handleStoriesPress = () => {
    if (isGuest) {
      // Show guest limitation message
      alert('Guest users can access limited content. Please login or register to unlock all features!');
    }
    // Navigate directly to Stories screen instead of SongsStories screen
    navigation.navigate('Stories' as never);
  };

  const handleConversationPress = () => {
    if (isGuest) {
      alert('Guest users can access limited content. Please login or register to unlock all features!');
    }
    navigation.navigate('Conversation' as never);
  };

  const handleStartLearningPress = () => {
    if (isGuest) {
      // Show guest limitation message
      alert('Guest users can access limited content. Please login or register to unlock all features!');
    }
    // Navigate to the Activities screen (which shows Learning activities)
    navigation.navigate('Activities' as never);
  };

  const buttonHandlers: Record<string, () => void> = {
    learning: handleLearningPress,
    songs: handleSongsPress,
    videos: handleVideosPress,
    stories: handleStoriesPress,
    conversation: handleConversationPress,
  };

  const styles = getStyles(responsive);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1F2937' : '#FF8FAB' }]}>
      {/* Top Bar with Icons */}
      <View style={[styles.topBar, { backgroundColor: isDarkMode ? '#374151' : '#AEE6FF' }]}>
        <View style={styles.leftIcon}>
          <Image 
            source={require('../../assets/Q-Bit_icon_bg.png')} 
            style={{ 
              width: responsive.wp(20), 
              height: responsive.hp(8.5),
            }} 
          />
        </View>
        <View style={styles.centerAnimation}>
          {/* This is where you can add your animation component */}
          {/* <Text style={[styles.animationPlaceholder, { color: isDarkMode ? '#F9FAFB' : '#FF6B9D' }]}>✨Q-Bit✨ </Text> */}
          {/* Removed the image from here */}
        </View>
        {!isGuest ? (
          <TouchableOpacity 
            style={styles.rightIconContainer}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <View style={styles.profileSection}>
              {currentUser?.profileImageUrl ? (
                (() => {
                  const imageUri = resolveImageUri(currentUser.profileImageUrl);
                  const emojiValue = isEmojiLike(currentUser.profileImageUrl)
                    ? currentUser.profileImageUrl
                    : null;

                  if (imageUri) {
                    return (
                      <Image 
                        source={{ uri: imageUri }} 
                        style={styles.profileImage}
                        resizeMode="cover"
                      />
                    );
                  }

                  if (emojiValue) {
                    return (
                      <View style={styles.profileImage}>
                        <Text style={styles.emojiAvatar}>{emojiValue}</Text>
                      </View>
                    );
                  }

                  return (
                    <MaterialIcons name="account-circle" size={responsive.wp(11.5)} color={isDarkMode ? '#60D4CD' : "#4ECDC4"} />
                  );
                })()
              ) : (
                <MaterialIcons name="account-circle" size={responsive.wp(11.5)} color={isDarkMode ? '#60D4CD' : "#4ECDC4"} />
              )}
              <Text style={[styles.profileName, { color: isDarkMode ? '#F9FAFB' : '#374151' }]}>
                {currentUser?.name || currentUser?.username}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.loginTopButton}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <MaterialIcons name="login" size={responsive.wp(6.5)} color={isDarkMode ? '#60D4CD' : "#4ECDC4"} />
            <Text style={[styles.loginTopButtonText, { color: isDarkMode ? '#60D4CD' : "#4ECDC4" }]}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content with Gradient Background */}
      <LinearGradient
        colors={isDarkMode ? ['#0F766E', '#7C3AED', '#EA580C'] : ['#43BCCD', '#FF6B9D', '#FFB366', '#FFD93D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Welcome Header */}
            <View style={styles.headerText}>
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeText}>
                  {currentUser && !currentUser.isGuest 
                    ? `👋 ${getTranslation(nativeLanguage, 'welcomeTo')} ${currentUser.name || currentUser.username}!` 
                    : `👋 ${getTranslation(nativeLanguage, 'welcome')}`}
                </Text>
              </View>
            </View>

            {/* Stats Cards - Horizontal Row */}
            <View style={styles.statsContainer}>
              {statsCards.map((card, index) => (
                <TouchableOpacity 
                  key={card.id} 
                  style={styles.statCardHorizontal}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={card.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statGradientHorizontal}
                  >
                    <Text style={styles.statIconHorizontal}>{card.icon}</Text>
                    <Text style={styles.statValueHorizontal}>{card.value}</Text>
                    <View style={styles.statLabelContainer}>
                      <Text style={styles.statLabelHorizontal}>{card.label}</Text>
                      <MaterialIcons name="info-outline" size={14} color="rgba(255,255,255,0.8)" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Activity Cards - All Vertical */}
            <View style={styles.activitiesContainer}>
              {buttons.map((button) => (
                <TouchableOpacity 
                  key={button.id}
                  style={styles.activityCard}
                  onPress={() => buttonHandlers[button.id]?.()}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={button.color as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.activityCardGradient}
                  >
                    <View style={styles.activityCardContent}>
                      <View style={styles.activityCardLeft}>
                        <Text style={styles.activityEmoji}>{button.emoji}</Text>
                        <Text style={styles.activityTitle}>{button.title}</Text>
                        <Text style={styles.activityDescription}>{button.description}</Text>
                        <View style={styles.tapIndicator}>
                          <MaterialIcons name="touch-app" size={16} color="rgba(255,255,255,0.9)" />
                          <Text style={styles.tapText}>Tap to explore</Text>
                        </View>
                      </View>
                      <View style={styles.activityCardRight}>
                        <Image 
                          source={button.image} 
                          style={styles.activityCardImage} 
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                    <View style={styles.activityCardArrow}>
                      <MaterialIcons name="arrow-forward" size={28} color="#FFFFFF" />
                    </View>
                    <View style={styles.clickableIndicator}>
                      <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.8)" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Start Learning Button */}
            <TouchableOpacity 
              style={styles.bottomSection}
              onPress={handleStartLearningPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#47C268', '#2ECC71', '#27AE60']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bottomGradient}
              >
                <Text style={styles.bottomText}>
                {getTranslation(nativeLanguage, 'startLearningAdventure')}
                </Text>
                <MaterialIcons name="rocket-launch" size={28} color="#FFFFFF" style={styles.rocketIcon} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingBottom: responsive.hp(-2),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsive.wp(4),
    paddingVertical: responsive.hp(1.8),
    backgroundColor: 'white',
    borderBottomWidth: responsive.hp(0.25),
    borderBottomColor: '#EDEDED',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.25) },
    shadowOpacity: 0.1,
    shadowRadius: responsive.wp(1),
    zIndex: 1,
    minHeight: responsive.hp(7),
  },
  leftIcon: {
    flex: 1,
  },
  centerAnimation: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsive.hp(1.2),
  },
  animationPlaceholder: {
    fontSize: responsive.wp(6.5),
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
  },
  rightIcon: {
    flex: 1,
    alignItems: 'flex-end',
    marginTop: responsive.hp(1.2),
  },
  rightIconContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  profileSection: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: responsive.hp(0.5),
  },
  profileImage: {
    width: responsive.wp(11),
    height: responsive.wp(11),
    borderRadius: responsive.wp(5.5),
    borderWidth: responsive.hp(0.25),
    borderColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFD700',
  },
  emojiAvatar: {
    fontSize: responsive.wp(6.5),
    textAlign: 'center',
  },
  profileName: {
    fontSize: responsive.wp(3),
    fontWeight: '600',
    maxWidth: responsive.wp(20),
    textAlign: 'center',
    marginTop: responsive.hp(0.25),
  },
  loginTopButton: {
    flex: 1,
    alignItems: 'center',
    marginTop: responsive.hp(1.2),
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  loginTopButtonText: {
    fontSize: responsive.wp(3.8),
    fontWeight: '600',
    marginLeft: responsive.wp(1),
  },
  gradientBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: responsive.hp(3),
  },
  content: {
    paddingHorizontal: responsive.wp(4),
    paddingTop: responsive.hp(2),
    paddingBottom: responsive.hp(1),
  },
  headerText: {
    marginBottom: responsive.hp(3),
    width: '100%',
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: responsive.wp(7.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: responsive.hp(0.8),
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: responsive.wp(0.5), height: responsive.hp(0.2) },
    textShadowRadius: responsive.wp(1),
    paddingHorizontal: responsive.wp(2),
  },
  subtitleText: {
    fontSize: responsive.wp(5),
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: responsive.wp(0.3), height: responsive.hp(0.15) },
    textShadowRadius: responsive.wp(0.8),
    paddingHorizontal: responsive.wp(2),
  },
  // Stats - Horizontal Row Layout (Small Cards)
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: responsive.hp(3),
    gap: responsive.wp(2.5),
    justifyContent: 'space-between',
  },
  statCardHorizontal: {
    flex: 1,
    minWidth: 0,
  },
  statGradientHorizontal: {
    borderRadius: responsive.wp(5),
    paddingVertical: responsive.hp(1.5),
    paddingHorizontal: responsive.wp(2.5),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.5) },
    shadowOpacity: 0.25,
    shadowRadius: responsive.wp(2),
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    minHeight: responsive.hp(10),
  },
  statIconHorizontal: {
    fontSize: responsive.wp(6),
    marginBottom: responsive.hp(0.5),
  },
  statValueHorizontal: {
    fontSize: responsive.wp(6),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: responsive.hp(0.3),
    textAlign: 'center',
  },
  statLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsive.wp(1),
  },
  statLabelHorizontal: {
    fontSize: responsive.wp(3.2),
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '700',
    textAlign: 'center',
  },
  // Activities - Vertical Layout
  activitiesContainer: {
    width: '100%',
    marginBottom: responsive.hp(2),
  },
  sectionTitle: {
    fontSize: responsive.wp(6.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: responsive.hp(2.5),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: responsive.wp(0.3), height: responsive.hp(0.2) },
    textShadowRadius: responsive.wp(1),
  },
  activityCard: {
    width: '100%',
    marginBottom: responsive.hp(2),
    borderRadius: responsive.wp(8),
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(1) },
    shadowOpacity: 0.4,
    shadowRadius: responsive.wp(3),
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.6)',
    // Add a subtle glow effect to suggest interactivity
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activityCardGradient: {
    padding: responsive.wp(5),
    minHeight: responsive.hp(18),
    justifyContent: 'center',
  },
  activityCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityCardLeft: {
    flex: 1,
    paddingRight: responsive.wp(3),
  },
  activityCardRight: {
    width: responsive.wp(25),
    height: responsive.wp(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: responsive.wp(12),
    marginBottom: responsive.hp(1),
  },
  activityTitle: {
    fontSize: responsive.wp(7),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: responsive.hp(0.5),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: responsive.wp(0.2), height: responsive.hp(0.15) },
    textShadowRadius: responsive.wp(0.8),
  },
  activityDescription: {
    fontSize: responsive.wp(4.5),
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: responsive.wp(0.15), height: responsive.hp(0.1) },
    textShadowRadius: responsive.wp(0.5),
  },
  activityCardImage: {
    width: '100%',
    height: '100%',
  },
  activityCardArrow: {
    position: 'absolute',
    right: responsive.wp(4),
    top: '50%',
    marginTop: responsive.hp(-1.5),
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: responsive.wp(5),
    padding: responsive.wp(2.5),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.3) },
    shadowOpacity: 0.3,
    shadowRadius: responsive.wp(1.5),
  },
  clickableIndicator: {
    position: 'absolute',
    right: responsive.wp(1),
    top: responsive.hp(1),
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: responsive.wp(3),
    padding: responsive.wp(1.5),
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: responsive.hp(1),
    gap: responsive.wp(1.5),
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: responsive.hp(0.5),
    paddingHorizontal: responsive.wp(3),
    borderRadius: responsive.wp(4),
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  tapText: {
    fontSize: responsive.wp(3.5),
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '700',
    letterSpacing: responsive.wp(0.1),
  },
  bottomSection: {
    marginTop: responsive.hp(2),
    marginBottom: responsive.hp(2),
    borderRadius: responsive.wp(8),
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    width: '100%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(1) },
    shadowOpacity: 0.4,
    shadowRadius: responsive.wp(3),
  },
  bottomGradient: {
    paddingVertical: responsive.hp(2),
    paddingHorizontal: responsive.wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsive.wp(2),
  },
  bottomText: {
    fontSize: responsive.wp(6),
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: responsive.wp(0.2),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: responsive.wp(0.2), height: responsive.hp(0.15) },
    textShadowRadius: responsive.wp(0.8),
  },
  rocketIcon: {
    marginLeft: responsive.wp(1),
  },
});

export default HomeScreen;
