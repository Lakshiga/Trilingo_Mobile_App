import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Animated,
  Platform,
  Switch,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';
import apiService from '../services/api';
import { resolveImageUri, isEmojiLike } from '../utils/imageUtils';
import { getTranslation, Language } from '../utils/translations';

interface SettingItem {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  type: 'toggle' | 'navigate' | 'action';
  value?: boolean;
  subtitle?: string;
}

const AVATAR_CHOICES = ['👤', '😊', '🎓', '🌟', '⭐', '🦄', '🎨', '🚀', '💫', '🐱', '🦊', '🐼'] as const;

type ProfileUserLike = {
  id?: string | null;
  username?: string | null;
  isAdmin?: boolean;
  isGuest?: boolean;
};

const getProfileStorageKey = (user?: ProfileUserLike | null) => {
  if (!user) {
    return 'guest_profile_image';
  }
  if (user.isGuest) {
    return 'guest_profile_image';
  }
  if (user.isAdmin) {
    return `admin_profile_image_${user.id || 'admin'}`;
  }
  return `profile_image_${user.id || user.username || 'user'}`;
};

// Helper function to validate profile image URL
const isValidProfileImage = (imageUrl: string): boolean => {
  if (!imageUrl || imageUrl.length === 0) return false;
  if (imageUrl === '[object Object]') return false;
  
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
  const { isDarkMode, theme, setDarkMode } = useTheme();
  const { currentUser, logout, updateUser } = useUser();
  const navigation = useNavigation();
  const nativeLanguage: Language = (currentUser?.nativeLanguage as Language) || 'English';
  const [notifications, setNotifications] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const profileScale = useRef(new Animated.Value(0)).current;

  const saveImageToStorage = async (value: string) => {
    try {
      await AsyncStorage.setItem(getProfileStorageKey(currentUser), value);
    } catch (error) {
      console.warn('Failed to cache profile image', error);
    }
  };

  const loadProfileImageFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(getProfileStorageKey(currentUser));
      if (stored && isValidProfileImage(stored)) {
        setProfileImage(stored);
        if (currentUser && currentUser.profileImageUrl !== stored) {
          await updateUser({ profileImageUrl: stored });
        }
        return true;
      }
    } catch (error) {
      console.warn('Failed to load cached profile image', error);
    }
    return false;
  };

  const initializeProfileImage = async () => {
    const loadedFromCache = await loadProfileImageFromStorage();
    if (!loadedFromCache && currentUser?.profileImageUrl) {
      setProfileImage(currentUser.profileImageUrl);
    }
  };

  const uploadProfileImageToServer = async (imageUri: string) => {
    if (!currentUser || currentUser.isGuest) {
      await saveImageToStorage(imageUri);
      Alert.alert('Saved', 'Profile image saved on this device.');
      return;
    }

    try {
      const response = await apiService.uploadProfileImage(imageUri);
      if (response.isSuccess && response.profileImageUrl) {
        const serverUrl = response.profileImageUrl;
        await saveImageToStorage(serverUrl);
        setProfileImage(serverUrl);
        await updateUser({ profileImageUrl: serverUrl });
        Alert.alert('Success', 'Profile image uploaded successfully!');
      } else {
        throw new Error(response.message || 'Failed to upload image.');
      }
    } catch (error: any) {
      console.error('Failed to upload profile image:', error);
      Alert.alert('Upload Error', error.message || 'Failed to upload image. Please try again.');
    }
  };

  const handleAvatarSave = async (avatar: string) => {
    setProfileImage(avatar);
    await saveImageToStorage(avatar);
    if (currentUser && !currentUser.isGuest) {
      try {
        const response = await apiService.updateProfile({ profileImageUrl: avatar });
        if (!response.isSuccess) {
          throw new Error(response.message || 'Failed to save avatar.');
        }
        await updateUser({ profileImageUrl: avatar });
        Alert.alert('Success', 'Avatar saved successfully!');
      } catch (error: any) {
        console.error('Failed to save avatar:', error);
        Alert.alert('Error', error.message || 'Failed to save avatar. Please try again.');
      }
    } else {
      Alert.alert('Saved', 'Avatar updated!');
    }
  };

  const handleAvatarSelect = async (avatar: string) => {
    setAvatarModalVisible(false);
    await handleAvatarSave(avatar);
  };

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
      await initializeProfileImage();
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
        
        if (!imageUri || !isValidProfileImage(imageUri)) {
          Alert.alert('Error', 'Invalid image selected. Please try again.');
          return;
        }
        setProfileImage(imageUri);
        await uploadProfileImageToServer(imageUri);
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
        
        if (!imageUri || !isValidProfileImage(imageUri)) {
          Alert.alert('Error', 'Invalid photo captured. Please try again.');
          return;
        }
        
        setProfileImage(imageUri);
        await uploadProfileImageToServer(imageUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access camera. Please try again.');
    }
  };

  const selectAvatar = () => {
    setAvatarModalVisible(true);
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
      id: 'edit-profile',
      title: 'Edit Profile',
      icon: 'edit',
      type: 'navigate',
    },
    {
      id: 'language',
      title: getTranslation(nativeLanguage, 'changeLanguage'),
      icon: 'language',
      type: 'navigate',
      subtitle: nativeLanguage,
    },
    {
      id: 'dark-mode',
      title: getTranslation(nativeLanguage, 'darkMode'),
      icon: 'dark-mode',
      type: 'toggle',
      value: isDarkMode,
    },
    {
      id: 'notifications',
      title: getTranslation(nativeLanguage, 'notifications'),
      icon: 'notifications',
      type: 'toggle',
      value: notifications,
    },
    {
      id: 'change-password',
      title: getTranslation(nativeLanguage, 'changePassword'),
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
      if (item.id === 'edit-profile') {
        (navigation as any).navigate('EditProfile');
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
                if (item.id === 'dark-mode') setDarkMode(value);
                if (item.id === 'notifications') setNotifications(value);
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
      edit: '#3B82F6',
      language: '#3B82F6',
      'dark-mode': '#6366F1',
      notifications: '#8B5CF6',
      lock: '#EC4899',
    };
    return colors[icon] || '#6B7280';
  };

  const getIconEmoji = (icon: string) => {
    const emojis: { [key: string]: string } = {
      edit: '✏️',
      language: '🌍',
      'dark-mode': '🌙',
      notifications: '🔔',
      lock: '🔒',
    };
    return emojis[icon] || '';
  };

  const resolvedImageUri = resolveImageUri(profileImage);
  const emojiProfile = profileImage && isEmojiLike(profileImage) ? profileImage : null;

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
        <View style={styles.contentWrapper}>
          <ScrollView 
            style={styles.scrollableContent}
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
                {resolvedImageUri && !imageLoadError ? (
                  <Image
                    source={{ uri: resolvedImageUri }}
                    style={styles.profilePictureImage}
                    resizeMode="cover"
                    onError={(error) => {
                      console.warn('Profile image load error:', error.nativeEvent?.error);
                      setImageLoadError(true);
                    }}
                  />
                ) : emojiProfile ? (
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.profilePicture}
                  >
                    <Text style={styles.profileAvatar}>{emojiProfile}</Text>
                  </LinearGradient>
                ) : (
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.profilePicture}
                  >
                    <Text style={styles.profileInitial}>
                      {currentUser?.name?.charAt(0).toUpperCase() ||
                        currentUser?.username?.charAt(0).toUpperCase() ||
                        'U'}
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
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{getTranslation(nativeLanguage, 'settings')}</Text>
            <View style={[styles.settingsCard, { backgroundColor: theme.settingsCard }]}>
              {settingsData.map((item, index) => (
                <View key={item.id}>
                  <SettingRow item={item} />
                  {index < settingsData.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </Animated.View>
          </ScrollView>
          {/* Logout Button - Fixed at bottom */}
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
              <Text style={styles.logoutText}>{getTranslation(nativeLanguage, 'logout')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>

      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.avatarModal}>
            <Text style={styles.avatarModalTitle}>Choose an avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_CHOICES.map((avatar) => (
                <TouchableOpacity
                  key={avatar}
                  style={styles.avatarOption}
                  onPress={() => handleAvatarSelect(avatar)}
                >
                  <Text style={styles.avatarOptionText}>{avatar}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setAvatarModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileHeader: {
    paddingHorizontal: 20,
    paddingTop: 40,
    marginBottom: 12,
  },
  profileCard: {
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 12,
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
    marginBottom: 0,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
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
    paddingVertical: 12,
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
    paddingBottom: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  avatarModal: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarOptionText: {
    fontSize: 30,
  },
  modalCloseButton: {
    marginTop: 8,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#1F2937',
    borderRadius: 24,
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
