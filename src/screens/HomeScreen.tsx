import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { resolveImageUri, isEmojiLike } from '../utils/imageUtils';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { currentUser, login } = useUser();
  const isGuest = currentUser?.isGuest || !currentUser;
  
  // Button data with vibrant, child-friendly colors and images
  const buttons = [
    { 
      id: 'songs', 
      title: 'Songs', 
      image: require('../../assets/Gemini_Generated_Image_46vxlk46vxlk46vx.png'),
      color: ['#FF9A8B', '#FF6B9D'] 
    },
    { 
      id: 'activities', 
      title: 'Activities', 
      image: require('../../assets/Gemini_Generated_Image_uhk48suhk48suhk4.png'), // Using Stories picture
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
      image: require('../../assets/Gemini_Generated_Image_p6f4grp6f4grp6f4.png'), // Using Videos picture
      color: ['#FFB366', '#FF8C42'] 
    },
  ];

  const handleSongsPress = () => {
    if (isGuest) {
      // Show guest limitation message
      alert('Guest users can access limited content. Please login or register to unlock all features!');
    }
    // Navigate to the Songs screen
    navigation.navigate('Songs' as never);
  };

  const handleActivitiesPress = () => {
    if (isGuest) {
      // Show guest limitation message
      alert('Guest users can access limited content. Please login or register to unlock all features!');
    }
    // Navigate to the Activities screen
    navigation.navigate('Activities' as never);
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
    // Navigate to the Stories screen
    navigation.navigate('Stories' as never);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }]}>
      {/* Top Bar with Icons */}
      <View style={[styles.topBar, { backgroundColor: isDarkMode ? '#374151' : '#FFFFFF' }]}>
        <View style={styles.leftIcon}>
          <Ionicons name="book-outline" size={36} color={isDarkMode ? '#FF8C9D' : "#FF6B6B"} />
        </View>
        <View style={styles.centerAnimation}>
          {/* This is where you can add your animation component */}
          <Text style={[styles.animationPlaceholder, { color: isDarkMode ? '#F9FAFB' : '#FF6B9D' }]}>✨Trilingo✨ </Text>
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
                    <Ionicons name="person-circle-outline" size={44} color={isDarkMode ? '#60D4CD' : "#4ECDC4"} />
                  );
                })()
              ) : (
                <Ionicons name="person-circle-outline" size={44} color={isDarkMode ? '#60D4CD' : "#4ECDC4"} />
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
            <Ionicons name="log-in-outline" size={24} color={isDarkMode ? '#60D4CD' : "#4ECDC4"} />
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
                  ? `Welcome to ${currentUser.name || currentUser.username}!` 
                  : 'Welcome to Trilingo!'}
              </Text>
              <Text style={styles.subtitleText}>Learn with Fun & Creativity</Text>
            </View>
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
          
          <View style={styles.bottomSection}>
            <Text style={styles.bottomText}>🌟 Start your learning adventure today! 🌟</Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingBottom: -15,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 2,
    borderBottomColor: '#EDEDED',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1,
  },
  leftIcon: {
    flex: 1,
  },
  centerAnimation: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  animationPlaceholder: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
  },
  rightIcon: {
    flex: 1,
    alignItems: 'flex-end',
    marginTop: 10,
  },
  rightIconContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  profileSection: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFD700',
  },
  emojiAvatar: {
    fontSize: 24,
    textAlign: 'center',
  },
  profileName: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 80,
    textAlign: 'center',
    marginTop: 2,
  },
  loginTopButton: {
    flex: 1,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  loginTopButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 5,
  },
  headerText: {
    marginBottom: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  guestBadge: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 'normal',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitleText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  buttonWrapper: {
    width: '45%',
    aspectRatio: 1,
  },
  button: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fullButtonImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bottomSection: {
    marginTop: 15,
    marginBottom: 25,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(19, 206, 29, 0.9)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bottomText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
});

export default HomeScreen;
