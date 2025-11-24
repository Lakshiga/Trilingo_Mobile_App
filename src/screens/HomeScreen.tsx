import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
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
  
  // Button data with vibrant, child-friendly colors and images
  const buttons = [
    { 
      id: 'songs', 
      title: 'Songs', 
      image: require('../../assets/Listening.png'),
      color: ['#FF9A8B', '#FF6B9D'] 
    },
    { 
      id: 'activities', 
      title: 'Activities', 
      image: require('../../assets/Gemini_Generated_Learning.png'), // Using Stories picture
      color: ['#43BCCD', '#5DD3A1'] 
    },
    { 
      id: 'videos', 
      title: 'Videos', 
      image: require('../../assets/Gemini_Generated_Image_4g1pdr4g1pdr4g1p.png'), // Using Activities picture
      color: ['#6A8EFF', '#8A6BFF'] 
    },
    { 
      id: 'stories', 
      title: 'Stories', 
      image: require('../../assets/Conversation.png'), // Using Videos picture
      color: ['#FFB366', '#FF8C42'] 
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
    // Navigate to Pop Pop screen (Songs and Stories selection)
    navigation.navigate('SongsStories' as never);
  };

  const handleActivitiesPress = () => {
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
    // Navigate to Conversation screen
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

  const styles = getStyles(responsive);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1F2937' : '#FF8FAB' }]}>
      {/* Top Bar with Icons */}
      <View style={[styles.topBar, { backgroundColor: isDarkMode ? '#374151' : '#FFFFFF' }]}>
        <View style={styles.leftIcon}>
          <Image 
            source={require('../../assets/Q-Bit icon .png')} 
            style={{ 
              width: responsive.wp(23), 
              height: responsive.hp(10.5),
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
        colors={isDarkMode ? ['#0F766E', '#7C3AED', '#EA580C'] : ['#43BCCD', '#FF6B9D', '#FFB366']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.content}>
          <View style={styles.headerText}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>
                {currentUser && !currentUser.isGuest 
                  ? `${getTranslation(nativeLanguage, 'welcomeTo')} ${currentUser.name || currentUser.username}!` 
                  : getTranslation(nativeLanguage, 'welcome')}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {statsCards.map((card) => (
              <View key={card.id} style={styles.statCard}>
                <LinearGradient
                  colors={card.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statGradient}
                >
                  <Text style={styles.statIcon}>{card.icon}</Text>
                  <Text style={styles.statValue}>{card.value}</Text>
                  <Text style={styles.statLabel}>{card.label}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.buttonWrapper}
              onPress={handleSongsPress}
            >
              <View style={[styles.button, { 
                backgroundColor: buttons[0].color[0],
                borderColor: buttons[0].color[1],
                borderWidth: 3,
              }]}>
                <Image 
                  source={buttons[0].image} 
                  style={styles.fullButtonImage} 
                />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.buttonWrapper}
              onPress={handleActivitiesPress}
            >
              <View style={[styles.button, { 
                backgroundColor: buttons[1].color[0],
                borderColor: buttons[1].color[1],
                borderWidth: 3,
              }]}>
                <Image 
                  source={buttons[1].image} 
                  style={styles.fullButtonImage} 
                />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.buttonWrapper}
              onPress={handleVideosPress}
            >
              <View style={[styles.button, { 
                backgroundColor: buttons[2].color[0],
                borderColor: buttons[2].color[1],
                borderWidth: 3,
              }]}>
                <Image 
                  source={buttons[2].image} 
                  style={styles.fullButtonImage} 
                />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.buttonWrapper}
              onPress={handleStoriesPress}
            >
              <View style={[styles.button, { 
                backgroundColor: buttons[3].color[0],
                borderColor: buttons[3].color[1],
                borderWidth: 3,
              }]}>
                <Image 
                  source={buttons[3].image} 
                  style={styles.fullButtonImage} 
                />
              </View>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.bottomSection}
            onPress={handleStartLearningPress}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomText}>
              ✨ {getTranslation(nativeLanguage, 'startLearningAdventure')} ✨
            </Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsive.wp(4),
    paddingTop: responsive.hp(2),
    paddingBottom: responsive.hp(1),
  },
  headerText: {
    marginBottom: responsive.hp(2),
    width: '100%',
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  guestBadge: {
    fontSize: responsive.wp(3.2),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 'normal',
  },
  welcomeText: {
    fontSize: responsive.wp(7),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: responsive.hp(0.6),
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: responsive.wp(0.25), height: responsive.hp(0.12) },
    textShadowRadius: responsive.wp(0.5),
    paddingHorizontal: responsive.wp(2),
  },
  subtitleText: {
    fontSize: responsive.wp(4.5),
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: responsive.wp(0.25), height: responsive.hp(0.12) },
    textShadowRadius: responsive.wp(0.5),
    paddingHorizontal: responsive.wp(2),
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: responsive.hp(2.5),
    paddingHorizontal: responsive.wp(1),
  },
  statCard: {
    flex: 1,
    marginHorizontal: responsive.wp(0.8),
    maxWidth: '32%',
  },
  statGradient: {
    borderRadius: responsive.wp(4),
    paddingVertical: responsive.hp(1.2),
    paddingHorizontal: responsive.wp(1.5),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.4) },
    shadowOpacity: 0.2,
    shadowRadius: responsive.wp(1.3),
    elevation: 4,
    minHeight: responsive.hp(9),
  },
  statIcon: {
    fontSize: responsive.wp(5),
    marginBottom: responsive.hp(0.5),
  },
  statValue: {
    fontSize: responsive.wp(5),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: responsive.hp(0.25),
  },
  statLabel: {
    fontSize: responsive.wp(3),
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: responsive.hp(1),
    gap: responsive.wp(2),
  },
  buttonWrapper: {
    width: '45%',
    maxWidth: responsive.wp(45),
    aspectRatio: 1,
    minHeight: responsive.hp(15),
  },
  button: {
    flex: 1,
    borderRadius: responsive.wp(6),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.5) },
    shadowOpacity: 0.3,
    shadowRadius: responsive.wp(1.5),
    minHeight: responsive.hp(15),
  },
  fullButtonImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bottomSection: {
    marginTop: responsive.hp(1.5),
    marginBottom: responsive.hp(2.5),
    paddingVertical: responsive.hp(1.2),
    paddingHorizontal: responsive.wp(3),
    backgroundColor: 'rgba(19, 206, 29, 0.9)',
    borderRadius: responsive.wp(5),
    borderWidth: responsive.hp(0.25),
    borderColor: '#FFFFFF',
    width: '100%',
  },
  bottomButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomText: {
    fontSize: responsive.wp(4.2),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: responsive.wp(0.1),
  },
});

export default HomeScreen;
