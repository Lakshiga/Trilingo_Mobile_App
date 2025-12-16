import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService from '../services/api';
import { getTranslation, Language } from '../utils/translations';
import { UserStorage } from '../utils/UserStorage';
import { getLanguageTextStyle } from '../utils/languageUtils';

// Map labels to locale codes for API
const LANGUAGE_MAP: { [key: string]: string } = {
  'English': 'en-US',
  'Tamil': 'ta-LK',
  'Sinhala': 'si-LK'
};

const NATIVE_LANGUAGE_OPTIONS: Language[] = ['English', 'Tamil', 'Sinhala'];

interface EditProfileScreenProps {
  navigation: any;
}

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const { currentUser, updateUser } = useUser();
  
  const nativeLanguage: Language = (currentUser?.nativeLanguage as Language) || ('English' as Language);
  const tx = (key: string): string => getTranslation(nativeLanguage, key as any);
  
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [age, setAge] = useState<string>('');
  const [nativeLanguageState, setNativeLanguageState] = useState<Language>((currentUser?.nativeLanguage as Language) || 'English');
  const [learningLanguage] = useState(currentUser?.learningLanguage || 'Tamil'); // Read-only
  const [loading, setLoading] = useState(false);
  const [languageDropdownVisible, setLanguageDropdownVisible] = useState(false);

  // Fetch age from user profile
  useEffect(() => {
    const fetchAge = async () => {
      // First try to get from currentUser
      if (currentUser?.age) {
        setAge(String(currentUser.age));
      } else if (currentUser) {
        // If currentUser exists but doesn't have age, try to fetch from UserStorage
        try {
          const storedUser = await UserStorage.getCurrentUser();
          if (storedUser?.age && storedUser.age !== currentUser.age) {
            setAge(String(storedUser.age));
            // Update currentUser context with age only if it's different
            await updateUser({
              ...currentUser,
              age: storedUser.age,
            });
          } else {
            setAge('');
          }
        } catch (error) {
          console.error('Error fetching age from storage:', error);
          setAge('');
        }
      } else {
        setAge('');
      }
    };
    
    fetchAge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.username]);

  // Save native language preference to AsyncStorage
  const saveNativeLanguagePreference = async (language: Language) => {
    try {
      const languageCode = LANGUAGE_MAP[language] || 'en-US';
      
      // Save to student profile in AsyncStorage
      const studentProfile = await UserStorage.getStudentProfile();
      await UserStorage.saveStudentProfile({
        ...studentProfile,
        nativeLanguageCode: languageCode,
      });
      
      // Also save to user preferences if user exists
      if (currentUser && !currentUser.isAdmin) {
        const prefsKey = `@trilingo_user_prefs_${currentUser.id || currentUser.username || 'user'}`;
        await AsyncStorage.setItem(prefsKey, JSON.stringify({
          nativeLanguage: language,
          learningLanguage: learningLanguage,
        }));
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const handleLanguageSelect = async (language: Language) => {
    setNativeLanguageState(language);
    setLanguageDropdownVisible(false);
    
    // Save language preference immediately
    await saveNativeLanguagePreference(language);
    
    // Update user context
    await updateUser({
      ...currentUser,
      nativeLanguage: language,
    });
  };

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert(tx('error'), tx('nameAndEmailRequired'));
      return;
    }

    setLoading(true);
    try {
      if (currentUser?.isAdmin) {
        // For admin, save to local context only
        await updateUser({
          name,
          email,
          age: currentUser.age, // Keep existing age (read-only)
          nativeLanguage: nativeLanguageState,
          learningLanguage,
        });
        Alert.alert(tx('success'), tx('profileUpdatedSuccessfully'));
        navigation.goBack();
      } else {
        // For regular users, update on backend
        const response = await apiService.updateProfile({
          name,
          email,
          age: currentUser?.age, // Keep existing age (read-only)
          nativeLanguage: nativeLanguageState,
          learningLanguage,
        });

        if (response.isSuccess) {
          await updateUser({
            name,
            email,
            age: currentUser?.age, // Keep existing age (read-only)
            nativeLanguage: nativeLanguageState,
            learningLanguage,
          });
          
          // Save language preference
          await saveNativeLanguagePreference(nativeLanguageState);
          
          Alert.alert(tx('success'), tx('profileUpdatedSuccessfully'));
          navigation.goBack();
        } else {
          Alert.alert(tx('error'), response.message || tx('failedToUpdateProfile'));
        }
      }
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert(tx('error'), error.message || tx('failedToUpdateProfile'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#111827' : '#F9FAFB' }]}>
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#111827'] : ['#E0F2FE', '#F0F9FF']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={isDarkMode ? '#F9FAFB' : '#1F2937'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }, getLanguageTextStyle(nativeLanguage, 24)]}>
          {tx('editProfile')}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDarkMode ? '#F9FAFB' : '#374151' }, getLanguageTextStyle(nativeLanguage, 16)]}>{tx('name')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#374151' : '#fff',
                  color: isDarkMode ? '#F9FAFB' : '#1F2937',
                  borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                },
                getLanguageTextStyle(nativeLanguage, 16),
              ]}
              value={name}
              onChangeText={setName}
              placeholder={tx('enterYourName')}
              placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDarkMode ? '#F9FAFB' : '#374151' }, getLanguageTextStyle(nativeLanguage, 16)]}>{tx('email')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#374151' : '#fff',
                  color: isDarkMode ? '#F9FAFB' : '#1F2937',
                  borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                },
                getLanguageTextStyle(nativeLanguage, 16),
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder={tx('enterYourEmail')}
              placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDarkMode ? '#F9FAFB' : '#374151' }, getLanguageTextStyle(nativeLanguage, 16)]}>{tx('age')}</Text>
            <View
              style={[
                styles.input,
                styles.readOnlyInput,
                {
                  backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                  borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                },
              ]}
            >
              <Text style={[styles.readOnlyText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }, getLanguageTextStyle(nativeLanguage, 16)]}>
                {age || tx('ageNotAvailable') || 'Age not available'}
              </Text>
              <MaterialCommunityIcons name="lock" size={18} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </View>
            <Text style={[styles.helperText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }, getLanguageTextStyle(nativeLanguage, 12)]}>
              {tx('ageReadOnly') || 'Age cannot be changed'}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDarkMode ? '#F9FAFB' : '#374151' }, getLanguageTextStyle(nativeLanguage, 16)]}>
              {tx('nativeLanguage')}
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.dropdownButton,
                {
                  backgroundColor: isDarkMode ? '#374151' : '#fff',
                  borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                },
              ]}
              onPress={() => setLanguageDropdownVisible(true)}
            >
              <Text style={[styles.dropdownText, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }, getLanguageTextStyle(nativeLanguage, 16)]}>
                {nativeLanguageState}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={isDarkMode ? '#F9FAFB' : '#1F2937'} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDarkMode ? '#F9FAFB' : '#374151' }, getLanguageTextStyle(nativeLanguage, 16)]}>
              {tx('learningLanguage')}
            </Text>
            <View
              style={[
                styles.input,
                styles.readOnlyInput,
                {
                  backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6',
                  borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                },
              ]}
            >
              <Text style={[styles.readOnlyText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }, getLanguageTextStyle(nativeLanguage, 16)]}>
                {learningLanguage}
              </Text>
              <MaterialCommunityIcons name="lock" size={18} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </View>
            <Text style={[styles.helperText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }, getLanguageTextStyle(nativeLanguage, 12)]}>
              {tx('learningLanguageReadOnly') || 'Learning language cannot be changed'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#9CA3AF', '#6B7280'] : ['#43BCCD', '#FF6B9D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <MaterialIcons name="save" size={24} color="#fff" />
              <Text style={[styles.saveButtonText, getLanguageTextStyle(nativeLanguage, 18)]}>
                {loading ? tx('saving') : tx('saveChanges')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Dropdown Modal */}
      <Modal
        visible={languageDropdownVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageDropdownVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? '#1F2937' : '#fff' },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }, getLanguageTextStyle(nativeLanguage, 20)]}>
                {tx('selectNativeLanguage') || 'Select Native Language'}
              </Text>
              <TouchableOpacity onPress={() => setLanguageDropdownVisible(false)}>
                <MaterialIcons name="close" size={24} color={isDarkMode ? '#F9FAFB' : '#1F2937'} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.languageList}>
              {NATIVE_LANGUAGE_OPTIONS.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageOption,
                    nativeLanguageState === lang && styles.languageOptionSelected,
                    {
                      backgroundColor:
                        nativeLanguageState === lang
                          ? isDarkMode ? '#0284C7' : '#E0F2FE'
                          : isDarkMode ? '#374151' : '#F9FAFB',
                    },
                  ]}
                  onPress={() => handleLanguageSelect(lang)}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      {
                        color:
                          nativeLanguageState === lang
                            ? '#fff'
                            : isDarkMode ? '#F9FAFB' : '#1F2937',
                        fontWeight: nativeLanguageState === lang ? '700' : '500',
                      },
                      getLanguageTextStyle(nativeLanguage, 16),
                    ]}
                  >
                    {lang}
                  </Text>
                  {nativeLanguageState === lang && (
                    <MaterialIcons name="check-circle" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
    textAlign: 'left',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlign: 'left',
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.7,
  },
  readOnlyText: {
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  languageList: {
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  languageOptionSelected: {
    borderColor: '#0284C7',
  },
  languageOptionText: {
    fontSize: 16,
  },
});