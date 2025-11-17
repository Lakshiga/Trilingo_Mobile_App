import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Animated,
  Platform,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService from '../services/api';
import { API_BASE_URL } from '../config/apiConfig';

interface SettingItem {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  type: 'toggle' | 'navigate' | 'action';
  value?: boolean;
  subtitle?: string;
}

// Helper function to convert server path to full URL
const getFullImageUrl = (imageUrl: string): string | null => {
  if (!imageUrl || imageUrl.trim().length === 0) {
    return null;
  }

  // If it's already a full URL or local file, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || 
      imageUrl.startsWith('file://') || imageUrl.startsWith('data:') || 
      imageUrl.startsWith('content://') || imageUrl.startsWith('asset://')) {
    return imageUrl;
  }
  
  // If it's a server path like "/uploads/profiles/image.jpg", construct full URL
  if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/profiles/')) {
    // Remove /api from base URL and append the path
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${imageUrl}`;
  }
  
  // Check if it's an emoji or invalid text (emojis are typically 1-4 characters, but can be longer)
  // If it doesn't look like a valid path, return null
  if (imageUrl.length <= 10 && !imageUrl.includes('.') && !imageUrl.includes('/')) {
    // Likely an emoji or invalid text
    return null;
  }
  
  // If it looks like a relative path, try to construct full URL
  if (imageUrl.startsWith('/')) {
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${imageUrl}`;
  }
  
  // Unknown format, return null to prevent invalid URL
  return null;
};

// Helper function to validate profile image URL
const isValidProfileImage = (imageUrl: string): boolean => {
  if (!imageUrl || imageUrl.length === 0) return false;
  
  // Check if it's a URI with protocol (http, https, file, data, content, asset, ph, etc.)
  // Mobile URIs can have various formats
  if (imageUrl.includes('://') || imageUrl.startsWith('/')) {
    // It's likely a URI - allow it
    // Block only obviously invalid text (contains spaces but not a data URI)
    if (imageUrl.includes(' ') && !imageUrl.startsWith('data:')) {
      return false;
    }
    return true;
  }
  
  // Check if it's an emoji or short text (emojis are typically 1-4 characters)
  if (imageUrl.length <= 5) {
    return true;
  }
  
  // Block anything else (likely invalid text)
  return false;
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { isDarkMode, theme, setDarkMode } = useTheme();
  const { currentUser, logout, updateUser } = useUser();
  const [notifications, setNotifications] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const profileScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(profileScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Request camera permissions and load profile image on mount
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Sorry, we need camera roll permissions to upload a profile picture.'
          );
        }
      }
      
      // Load user's profile image from currentUser or AsyncStorage (for admin)
      if (currentUser?.isAdmin) {
        try {
          const adminImage = await AsyncStorage.getItem('admin_profile_image');
          if (adminImage && isValidProfileImage(adminImage)) {
            setProfileImage(adminImage);
            // Update context if not already set
            if (currentUser.profileImageUrl !== adminImage) {
              await updateUser({ profileImageUrl: adminImage });
            }
          }
        } catch (error) {
          console.error('Failed to load admin image:', error);
        }
      } else if (currentUser?.profileImageUrl && isValidProfileImage(currentUser.profileImageUrl)) {
        setProfileImage(currentUser.profileImageUrl);
      }
    })();
  }, [currentUser]);

  // Reset error state when profile image changes
  useEffect(() => {
    setImageLoadError(false);
  }, [profileImage]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        
        // Validate the image URI before setting
        if (!imageUri || !isValidProfileImage(imageUri)) {
          Alert.alert('Error', 'Invalid image selected. Please try again.');
          return;
        }
        
        setProfileImage(imageUri);
        
        // Upload to backend if user is logged in and not a guest
        if (currentUser && !currentUser.isGuest) {
          // For admin users, store in AsyncStorage separately
          if (currentUser.isAdmin) {
            try {
              await AsyncStorage.setItem('admin_profile_image', imageUri);
              await updateUser({ profileImageUrl: imageUri });
              Alert.alert('Success', 'Profile image saved successfully!');
            } catch (error) {
              console.error('Failed to save admin image:', error);
            }
          } else {
            // For regular users, upload to backend first
            try {
              const response = await apiService.uploadProfileImage(imageUri);
              if (response.isSuccess && response.profileImageUrl) {
                // Update context with SERVER URL from backend (not local file URI)
                const serverUrl = response.profileImageUrl;
                await updateUser({ profileImageUrl: serverUrl });
                setProfileImage(serverUrl); // Update local state with server URL
                Alert.alert('Success', 'Profile image uploaded successfully!');
              }
            } catch (error: any) {
              console.error('Failed to upload profile image:', error);
              Alert.alert('Error', 'Failed to upload image. Please try again.');
            }
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take a photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        
        // Validate the image URI before setting
        if (!imageUri || !isValidProfileImage(imageUri)) {
          Alert.alert('Error', 'Invalid photo captured. Please try again.');
          return;
        }
        
        setProfileImage(imageUri);
        
        // Upload to backend if user is logged in and not a guest
        if (currentUser && !currentUser.isGuest) {
          // For admin users, store in AsyncStorage separately
          if (currentUser.isAdmin) {
            try {
              await AsyncStorage.setItem('admin_profile_image', imageUri);
              await updateUser({ profileImageUrl: imageUri });
              Alert.alert('Success', 'Profile image saved successfully!');
            } catch (error) {
              console.error('Failed to save admin image:', error);
            }
          } else {
            // For regular users, upload to backend first
            try {
              console.log('Uploading image to backend...', imageUri);
              const response = await apiService.uploadProfileImage(imageUri);
              console.log('Upload response:', response);
              
              if (response.isSuccess && response.profileImageUrl) {
                // Update context with SERVER URL from backend (not local file URI)
                const serverUrl = response.profileImageUrl;
                await updateUser({ profileImageUrl: serverUrl });
                setProfileImage(serverUrl); // Update local state with server URL
                Alert.alert('Success', 'Profile image uploaded successfully!');
              } else {
                Alert.alert('Error', response.message || 'Failed to upload image. Please try again.');
              }
            } catch (error: any) {
              console.error('Failed to upload profile image:', error);
              const errorMessage = error.message || 'Failed to upload image. Please check your connection and try again.';
              Alert.alert('Upload Error', errorMessage);
            }
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access camera. Please try again.');
    }
  };

  const selectAvatar = () => {
    // Predefined avatar options
    const avatars = ['👤', '😊', '🎓', '🌟', '⭐', '🦄', '🎨', '🚀', '💫'];
    
    Alert.alert(
      'Select Avatar',
      'Choose an avatar for your profile',
      avatars.map((avatar, index) => ({
        text: avatar,
        onPress: async () => {
          setProfileImage(avatar);
          // Update user context and backend with selected avatar
          if (currentUser && !currentUser.isGuest) {
            // For admin users, store in AsyncStorage
            if (currentUser.isAdmin) {
              try {
                await AsyncStorage.setItem('admin_profile_image', avatar);
                await updateUser({ profileImageUrl: avatar });
                Alert.alert('Success', 'Avatar saved successfully!');
              } catch (error) {
                console.error('Failed to save admin avatar:', error);
                Alert.alert('Error', 'Failed to save avatar. Please try again.');
              }
            } else {
              // For regular users, update via backend API
              try {
                const response = await apiService.updateProfile({ profileImageUrl: avatar });
                if (response.isSuccess) {
                  await updateUser({ profileImageUrl: avatar });
                  Alert.alert('Success', 'Avatar saved successfully!');
                } else {
                  Alert.alert('Error', response.message || 'Failed to save avatar.');
                }
              } catch (error: any) {
                console.error('Failed to save avatar:', error);
                Alert.alert('Error', 'Failed to save avatar. Please try again.');
              }
            }
          }
        },
      })),
      { cancelable: true }
    );
  };

  const handleProfilePicturePress = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        {
          text: 'Select Avatar',
          onPress: selectAvatar,
        },
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const settingsData: SettingItem[] = [
    {
      id: '0',
      title: 'Edit Profile',
      icon: 'edit',
      type: 'navigate',
      subtitle: 'Update your information',
    },
    {
      id: '1',
      title: 'Change Language',
      icon: 'language',
      type: 'navigate',
      subtitle: 'English',
    },
    {
      id: '2',
      title: 'Dark Mode',
      icon: 'dark-mode',
      type: 'toggle',
      value: isDarkMode,
    },
    {
      id: '3',
      title: 'Notifications',
      icon: 'notifications',
      type: 'toggle',
      value: notifications,
    },
    {
      id: '4',
      title: 'Change Password',
      icon: 'lock',
      type: 'navigate',
    },
  ];

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
              // Show success message
              Alert.alert(
                'Success',
                'Logged out successfully.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // The app will automatically redirect to login screen
                      // due to the UserContext state change in App.tsx
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSettingPress = (item: SettingItem) => {
    if (item.type === 'navigate') {
      if (item.id === '0') {
        // Navigate to Edit Profile screen
        navigation.navigate('EditProfile' as never);
      } else {
        console.log(`Navigate to ${item.title}`);
      }
    } else if (item.type === 'action') {
      handleLogout();
    }
  };

  const SettingRow = ({ item }: { item: SettingItem }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => handleSettingPress(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          disabled={item.type === 'toggle'}
        >
          <View style={styles.settingLeft}>
            <LinearGradient
              colors={[getIconColor(item.icon), getIconColor(item.icon) + 'CC']}
              style={styles.iconContainer}
            >
              <Text style={styles.settingEmoji}>{getIconEmoji(item.icon)}</Text>
            </LinearGradient>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>{item.title}</Text>
              {item.subtitle && (
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
              )}
            </View>
          </View>
          {item.type === 'toggle' ? (
            <Switch
              value={item.value}
              onValueChange={(value) => {
                if (item.id === '2') setDarkMode(value);
                if (item.id === '3') setNotifications(value);
              }}
              trackColor={{ false: '#D1D5DB', true: '#43BCCD' }}
              thumbColor={item.value ? '#fff' : '#f4f3f4'}
            />
          ) : (
            <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getIconColor = (icon: string) => {
    const colors: { [key: string]: string } = {
      language: '#3B82F6',
      'dark-mode': '#6366F1',
      notifications: '#8B5CF6',
      lock: '#EC4899',
    };
    return colors[icon] || '#6B7280';
  };

  const getIconEmoji = (icon: string) => {
    const emojis: { [key: string]: string } = {
      language: '🌍',
      'dark-mode': '🌙',
      notifications: '🔔',
      lock: '🔒',
    };
    return emojis[icon] || '';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.profileBackground} style={styles.gradient}>
        {/* Decorative elements */}
        <View style={[styles.decorativeCircle1, { backgroundColor: theme.decorativeCircle1 }]} />
        <View style={[styles.decorativeCircle2, { backgroundColor: theme.decorativeCircle2 }]} />
        <View style={[styles.decorativeCircle3, { backgroundColor: theme.decorativeCircle3 }]} />
        <View style={styles.decorativeStar1}>
          <Text style={styles.starText}>⭐</Text>
        </View>
        <View style={styles.decorativeStar2}>
          <Text style={styles.starText}>✨</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <Animated.View
            style={[
              styles.profileHeader,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={theme.profileGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCard}
            >
              {/* Profile Picture */}
              <Animated.View
                style={[
                  styles.profilePictureContainer,
                  { transform: [{ scale: profileScale }] },
                ]}
              >
                {profileImage ? (
                  // Check if profileImage is a URI or an emoji
                  (profileImage.includes('://') || profileImage.startsWith('/')) && profileImage.length > 5 ? (
                    // It's a URI - display as image
                    imageLoadError ? (
                      // Fallback if image fails to load
                      <LinearGradient
                        colors={['#FFD700', '#FFA500']}
                        style={styles.profilePicture}
                      >
                        <Text style={styles.profileInitial}>
                          {currentUser?.name?.charAt(0).toUpperCase() || currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </LinearGradient>
                    ) : (
                      (() => {
                        const imageUri = getFullImageUrl(profileImage);
                        return imageUri ? (
                          <Image
                            source={{ uri: imageUri }}
                            style={styles.profilePictureImage}
                            resizeMode="cover"
                            onError={(error) => {
                              console.error('Image load error:', error);
                              setImageLoadError(true);
                            }}
                          />
                        ) : (
                          <LinearGradient
                            colors={['#FFD700', '#FFA500']}
                            style={styles.profilePicture}
                          >
                            <Text style={styles.profileInitial}>
                              {currentUser?.name?.charAt(0).toUpperCase() || currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                          </LinearGradient>
                        );
                      })()
                    )
                  ) : (
                    // It's an emoji - display as text
                    <LinearGradient
                      colors={['#FFD700', '#FFA500']}
                      style={styles.profilePicture}
                    >
                      <Text style={styles.profileAvatar}>{profileImage}</Text>
                    </LinearGradient>
                  )
                ) : (
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.profilePicture}
                  >
                    <Text style={styles.profileInitial}>
                      {currentUser?.name?.charAt(0).toUpperCase() || currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </LinearGradient>
                )}
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleProfilePicturePress}
                >
                  <MaterialIcons name="camera-alt" size={18} color="#fff" />
                </TouchableOpacity>
              </Animated.View>

              {/* User Info */}
              <View style={styles.userInfoContainer}>
                <Text style={styles.userName}>
                  {currentUser?.name || currentUser?.username || 'User'}
                </Text>
                <Text style={styles.welcomeEmoji}>👋</Text>
              </View>
              <Text style={styles.userEmail}>
                {currentUser?.email || 'user@example.com'}
              </Text>

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <LinearGradient
                    colors={['#FF6B9D', '#FF8FAB']}
                    style={styles.statBubble}
                  >
                    <Text style={styles.statEmoji}>📚</Text>
                    <Text style={styles.statValue}>24</Text>
                    <Text style={styles.statLabel}>Lessons</Text>
                  </LinearGradient>
                </View>
                <View style={styles.statItem}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.statBubble}
                  >
                    <Text style={styles.statEmoji}>🏆</Text>
                    <Text style={styles.statValue}>156</Text>
                    <Text style={styles.statLabel}>Points</Text>
                  </LinearGradient>
                </View>
                <View style={styles.statItem}>
                  <LinearGradient
                    colors={['#667EEA', '#7A8EFC']}
                    style={styles.statBubble}
                  >
                    <Text style={styles.statEmoji}>🔥</Text>
                    <Text style={styles.statValue}>12</Text>
                    <Text style={styles.statLabel}>Days</Text>
                  </LinearGradient>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Settings Section */}
          <Animated.View
            style={[
              styles.settingsSection,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Settings</Text>
            <View style={[styles.settingsCard, { backgroundColor: theme.settingsCard }]}>
              {settingsData.map((item, index) => (
                <View key={item.id}>
                  <SettingRow item={item} />
                  {index < settingsData.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Logout Button */}
          <Animated.View
            style={[
              styles.logoutContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Version */}
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 200,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: 100,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  decorativeStar1: {
    position: 'absolute',
    top: 120,
    right: 30,
  },
  decorativeStar2: {
    position: 'absolute',
    top: 180,
    left: 40,
  },
  starText: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    marginBottom: 20,
  },
  profileCard: {
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePicture: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profilePictureImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 5,
    borderColor: '#fff',
    backgroundColor: '#f0f0f0',
  },
  profileInitial: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileAvatar: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B9D',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  welcomeEmoji: {
    fontSize: 28,
  },
  userEmail: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  statItem: {
    flex: 1,
  },
  statBubble: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  settingEmoji: {
    fontSize: 26,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 3,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 80,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 10,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#95A5A6',
    marginTop: 12,
    fontWeight: '500',
  },
});