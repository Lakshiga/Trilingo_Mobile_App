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
  StatusBar,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';
import apiService from '../services/api';
import { ProgressSummaryDto } from '../services/api';
import { resolveImageUri, isEmojiLike } from '../utils/imageUtils';
import { getTranslation, Language } from '../utils/translations';
import { useBackgroundAudio } from '../context/BackgroundAudioContext';
// Assuming useResponsive exists based on previous context, otherwise standard dimensions work
const { width } = Dimensions.get('window');

interface SettingItem {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  type: 'toggle' | 'navigate' | 'action';
  value?: boolean;
  subtitle?: string;
  color: string; // Add color for kids theme
}

const AVATAR_CHOICES = ['👤', '😊', '🎓', '🌟', '⭐', '🦄', '🎨', '🚀', '💫', '🐱', '🦊', '🐼'] as const;

type ProfileUserLike = {
  id?: string | null;
  username?: string | null;
  isAdmin?: boolean;
  isGuest?: boolean;
};

const getProfileStorageKey = (user?: ProfileUserLike | null) => {
  if (!user) return 'guest_profile_image';
  if (user.isGuest) return 'guest_profile_image';
  return `profile_image_${user.id || user.username || 'user'}`;
};

const isValidProfileImage = (imageUrl: string): boolean => {
  if (!imageUrl || imageUrl.length === 0) return false;
  if (imageUrl === '[object Object]') return false;
  if (imageUrl.includes('://') || imageUrl.startsWith('/')) {
    if (imageUrl.includes(' ') && !imageUrl.startsWith('data:')) return false;
    return true;
  }
  if (imageUrl.length <= 5) return true;
  return false;
};

export default function ProfileScreen() {
  const { isDarkMode, setDarkMode } = useTheme();
  const { currentUser, logout, updateUser } = useUser();
  const [summary, setSummary] = useState<ProgressSummaryDto | null>(null);
  const [cachedStudentProfile, setCachedStudentProfile] = useState<{ id?: string; nickname?: string; avatar?: string } | null>(null);
  // Always prefer student nickname; fallback to cached nickname; avoid parent name
  const displayName = summary?.studentNickname || cachedStudentProfile?.nickname || 'Student';
  const navigation = useNavigation();
  const nativeLanguage: Language = (currentUser?.nativeLanguage as Language) || ('English' as Language);
  const tx = (key: string): string => getTranslation(nativeLanguage, key as any);
  const { isBackgroundEnabled, enableBackground, disableBackground } = useBackgroundAudio();
  
  const [notifications, setNotifications] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [stars, setStars] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  
  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // --- KIDS THEME CONSTANTS ---
  const BG_COLOR = '#E0F7FA'; // Soft Sky
  const CARD_BG = '#FFFFFF';
  
  // Storage & API Logic (Kept mostly same, just cleaner)
  const saveImageToStorage = async (value: string) => {
    try { await AsyncStorage.setItem(getProfileStorageKey(currentUser), value); } 
    catch (e) { console.warn('Cache error', e); }
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
    } catch (e) { console.warn('Load error', e); }
    return false;
  };

  const initializeProfileImage = async () => {
    const loaded = await loadProfileImageFromStorage();
    if (!loaded && currentUser?.profileImageUrl) {
      setProfileImage(currentUser.profileImageUrl);
    }
  };

  const uploadProfileImageToServer = async (imageUri: string) => {
    if (!currentUser || currentUser.isGuest) {
      await saveImageToStorage(imageUri);
      Alert.alert(tx('cool'), tx('pictureSaved'));
      return;
    }
    try {
      const response = await apiService.uploadProfileImage(imageUri);
      if (response.isSuccess && response.profileImageUrl) {
        const serverUrl = response.profileImageUrl;
        await saveImageToStorage(serverUrl);
        setProfileImage(serverUrl);
        await updateUser({ profileImageUrl: serverUrl });
        Alert.alert(tx('awesome'), tx('profileUpdated'));
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      // If upload fails, save locally as fallback
      console.warn('Server upload failed, saving locally:', error.message);
      await saveImageToStorage(imageUri);
      setProfileImage(imageUri);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Could not upload to server';
      if (errorMessage.includes('Session expired')) {
        Alert.alert(tx('sessionExpired'), tx('pleaseLoginAgain'));
      } else if (errorMessage.includes('blocked') || errorMessage.includes('403')) {
        Alert.alert(tx('uploadBlocked'), tx('serverUnavailable'));
      } else {
        Alert.alert(tx('saveLocally'), tx('savedLocally'));
      }
    }
  };

  const handleAvatarSelect = async (avatar: string) => {
    setAvatarModalVisible(false);
    setProfileImage(avatar);
    await saveImageToStorage(avatar);
    if (currentUser && !currentUser.isGuest) {
      try {
        await apiService.updateProfile({ profileImageUrl: avatar });
        await updateUser({ profileImageUrl: avatar });
      } catch (e) { console.error(e); }
    }
  };

  const handleProfilePicturePress = () => {
    Alert.alert(
      tx('newLook'),
      tx('howWantToLook'),
      [
        { text: tx('pickAvatar'), onPress: () => setAvatarModalVisible(true) },
        { text: tx('takePhoto'), onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(tx('ohNo'), tx('needCameraPermission'));
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
            });
            if (!result.canceled) {
              const uri = result.assets[0].uri;
              setProfileImage(uri);
              uploadProfileImageToServer(uri);
            }
          } 
        },
        { text: tx('gallery'), onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(tx('ohNo'), tx('needGalleryPermission'));
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled) {
              const uri = result.assets[0].uri;
              setProfileImage(uri);
              uploadProfileImageToServer(uri);
            }
          } 
        },
        { text: tx('cancel'), style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
    initializeProfileImage();
  }, [currentUser]);

  // Fetch summary for stars/completed
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const studentId = currentUser?.id; // replace if selected child stored elsewhere
        if (!studentId) return;
        const summaryData: ProgressSummaryDto | null = await apiService.getStudentSummary(studentId);
        if (summaryData) {
          setSummary(summaryData);
          setCompletedCount(summaryData.totalActivitiesCompleted);
          setStars(summaryData.totalActivitiesCompleted * 10);
        }
      } catch (e) {
        // ignore summary errors
      }
    };
    fetchSummary();
  }, [currentUser]);

  useEffect(() => {
    // Load cached student profile (nickname) saved after child creation
    const loadCachedStudent = async () => {
      try {
        const raw = await AsyncStorage.getItem('@trilingo_student_profile');
        if (raw) setCachedStudentProfile(JSON.parse(raw));
      } catch {
        setCachedStudentProfile(null);
      }
    };
    loadCachedStudent();
  }, []);

  // --- SETTINGS CONFIG ---
  const settingsData: SettingItem[] = [
    {
      id: 'edit-profile',
      title: tx('myDetails') || 'My Details',
      icon: 'pencil',
      type: 'navigate',
      color: '#4FACFE', // Blue
    },
    {
      id: 'bg-music',
      title: tx('backgroundMusic') || 'Background Music',
      icon: 'music',
      type: 'toggle',
      value: isBackgroundEnabled,
      color: '#7C3AED', // Purple
    },
    {
      id: 'dark-mode',
      title: tx('nightMode') || 'Night Mode',
      icon: 'weather-night',
      type: 'toggle',
      value: isDarkMode,
      color: '#5F27CD', // Purple
    },
  ];

  const handleLogout = () => {
    Alert.alert(tx('leaving'), tx('seeYou'), [
      { text: tx('stay'), style: 'cancel' },
      { text: tx('byeBye'), onPress: () => {
          logout().then(() => (navigation as any).reset({ index: 0, routes: [{ name: 'Welcome' }] }));
        }, style: 'destructive' 
      },
    ]);
  };

  const handleSettingPress = (item: SettingItem) => {
    if (item.type === 'navigate') {
      if (item.id === 'edit-profile') (navigation as any).navigate('EditProfile');
      // Add other navigations here
    } else if (item.type === 'action') {
      if (item.id === 'bg-music') {
        if (isBackgroundEnabled) {
          disableBackground();
        } else {
          enableBackground();
        }
      }
    }
  };

  const resolvedImageUri = resolveImageUri(profileImage);
  const emojiProfile = profileImage && isEmojiLike(profileImage) ? profileImage : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />
      
      {/* Background Shapes */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* --- HEADER TITLE --- */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => (navigation as any).navigate('Home')}>
            <MaterialIcons name="arrow-back" size={24} color="#006064" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{tx('myProfile') || 'My Profile'}</Text>
          <View style={{ width: 40 }} /> {/* Spacer for alignment */}
        </View>

        {/* --- HERO CARD (Passport Style) --- */}
        <Animated.View style={[styles.heroCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleProfilePicturePress} activeOpacity={0.9}>
             {resolvedImageUri && !imageLoadError ? (
               <Image 
                 source={{ uri: resolvedImageUri }} 
                 style={styles.avatarImage} 
                 onError={() => setImageLoadError(true)}
               />
             ) : (
               <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                 <Text style={{ fontSize: 45 }}>
                   {emojiProfile ? String(emojiProfile) : (summary?.studentNickname?.charAt(0) || cachedStudentProfile?.nickname?.charAt(0) || '👤')}
                 </Text>
               </View>
             )}
             <View style={styles.cameraBadge}>
                <MaterialIcons name="camera-alt" size={16} color="#FFF" />
             </View>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{String(displayName || 'Student')}</Text>
              {currentUser && !currentUser.isGuest && (
                 <MaterialIcons name="verified" size={20} color="#4FACFE" style={{marginLeft: 4}}/>
              )}
            </View>
            <Text style={styles.userRole}>{currentUser?.email ? String(currentUser.email) : String(tx('ready') || 'Ready')}</Text>
            
            {/* Gamification Badge */}
            <View style={styles.levelBadge}>
               <Text style={styles.levelText}>{tx('level1Explorer') || 'Level 1 Explorer'}</Text>
            </View>
            {!currentUser?.isGuest && (
              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <MaterialIcons name="star" size={16} color="#FFD700" />
                  <Text style={styles.statText}>{String(stars || 0)} {tx('stars') || 'Stars'}</Text>
                </View>
                <View style={styles.statPill}>
                  <MaterialIcons name="check-circle" size={16} color="#34D399" />
                  <Text style={styles.statText}>{String(completedCount || 0)} {tx('completed') || 'Completed'}</Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* --- SETTINGS BUBBLES --- */}
        <Text style={styles.sectionTitle}>{tx('settings') || 'Settings'}</Text>
        
        <View style={styles.settingsGrid}>
          {settingsData.map((item) => {
            const titleText = item.title ? String(item.title) : '';
            const subtitleText = item.subtitle && String(item.subtitle).trim() ? String(item.subtitle) : '';
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.settingBubble]}
                onPress={() => handleSettingPress(item)}
                activeOpacity={0.7}
                disabled={item.type === 'toggle'}
              >
                <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}> 
                  <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
                </View>
                
                <View style={styles.settingContent}>
                  {titleText ? <Text style={styles.settingLabel}>{titleText}</Text> : null}
                  {subtitleText ? <Text style={styles.settingSubLabel}>{subtitleText}</Text> : null}
                </View>

                {item.type === 'toggle' ? (
                  <Switch
                    value={item.value}
                    onValueChange={(val) => {
                       if (item.id === 'dark-mode') setDarkMode(val);
                       if (item.id === 'notifications') setNotifications(val);
                       if (item.id === 'bg-music') {
                         if (val) {
                           enableBackground();
                         } else {
                           disableBackground();
                         }
                       }
                    }}
                    trackColor={{ false: '#E2E8F0', true: item.color }}
                    thumbColor={'#FFF'}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* --- LOGOUT BUTTON --- */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#FF6B6B" />
          <Text style={styles.logoutText}>{tx('logout') || 'Logout'}</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>{tx('version') || 'Version'}</Text>
        <View style={{height: 30}} />
      </ScrollView>

      {/* --- AVATAR MODAL (Sticker Sheet) --- */}
      <Modal visible={avatarModalVisible} transparent animationType="slide" onRequestClose={() => setAvatarModalVisible(false)}>
        <View style={styles.modalOverlay}>
           <View style={styles.stickerSheet}>
              <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>{tx('pickSticker') || 'Pick a Sticker'}</Text>
                 <TouchableOpacity onPress={() => setAvatarModalVisible(false)}>
                    <Ionicons name="close-circle" size={30} color="#94A3B8" />
                 </TouchableOpacity>
              </View>
              <View style={styles.stickerGrid}>
                 {AVATAR_CHOICES.map((avatar) => (
                    <TouchableOpacity key={avatar} style={styles.sticker} onPress={() => handleAvatarSelect(avatar)}>
                       <Text style={{fontSize: 40}}>{avatar}</Text>
                    </TouchableOpacity>
                 ))}
              </View>
           </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F7FA', // Sky Blue Background
  },
  bgCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#B2EBF2',
    opacity: 0.5,
  },
  bgCircle2: {
    position: 'absolute',
    top: 100,
    left: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#80DEEA',
    opacity: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#E0F7FA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#006064',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },

  // HERO CARD
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0097A7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E0F7FA',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#4DD0E1',
  },
  avatarPlaceholder: {
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00BCD4',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C3E50',
  },
  userRole: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: '#FFF9C4', // Pale Yellow
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFF176',
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FBC02D',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: {
    marginLeft: 6,
    color: '#006064',
    fontWeight: '600',
    fontSize: 12,
  },

  // SETTINGS
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#37474F',
    marginBottom: 15,
    marginLeft: 4,
  },
  settingsGrid: {
    gap: 12,
  },
  settingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#455A64',
  },
  settingSubLabel: {
    fontSize: 12,
    color: '#90A4AE',
  },

  // LOGOUT
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  logoutText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    color: '#B0BEC5',
    fontSize: 12,
    marginTop: 20,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  stickerSheet: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2C3E50',
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  sticker: {
    width: 60,
    height: 60,
    backgroundColor: '#F7F9FA',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});