import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService from '../services/api';

interface EditProfileScreenProps {
  navigation: any;
}

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { theme, isDarkMode } = useTheme();
  const { currentUser, updateUser } = useUser();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [age, setAge] = useState(currentUser?.age || '');
  const [nativeLanguage, setNativeLanguage] = useState(currentUser?.nativeLanguage || 'English');
  const [learningLanguage, setLearningLanguage] = useState(currentUser?.learningLanguage || 'Tamil');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    setLoading(true);
    try {
      if (currentUser?.isAdmin) {
        // For admin, save to local context only
        await updateUser({
          name,
          email,
          age,
          nativeLanguage,
          learningLanguage,
        });
        Alert.alert('Success', 'Profile updated successfully');
        navigation.goBack();
      } else {
        // For regular users, update on backend
        const response = await apiService.updateProfile({
          name,
          email,
          age,
          nativeLanguage,
          learningLanguage,
        });

        if (response.isSuccess) {
          await updateUser({
            name,
            email,
            age,
            nativeLanguage,
            learningLanguage,
          });
          Alert.alert('Success', 'Profile updated successfully');
          navigation.goBack();
        } else {
          Alert.alert('Error', response.message || 'Failed to update profile');
        }
      }
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
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
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#F9FAFB' : '#1F2937' }]}>
          Edit Profile
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDarkMode ? '#F9FAFB' : '#374151' }]}>Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#374151' : '#fff',
                  color: isDarkMode ? '#F9FAFB' : '#1F2937',
                  borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDarkMode ? '#F9FAFB' : '#374151' }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#374151' : '#fff',
                  color: isDarkMode ? '#F9FAFB' : '#1F2937',
                  borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDarkMode ? '#F9FAFB' : '#374151' }]}>Age</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#374151' : '#fff',
                  color: isDarkMode ? '#F9FAFB' : '#1F2937',
                  borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                },
              ]}
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDarkMode ? '#F9FAFB' : '#374151' }]}>
              Native Language
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#374151' : '#fff',
                  color: isDarkMode ? '#F9FAFB' : '#1F2937',
                  borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                },
              ]}
              value={nativeLanguage}
              onChangeText={setNativeLanguage}
              placeholder="Enter your native language"
              placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDarkMode ? '#F9FAFB' : '#374151' }]}>
              Learning Language
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#374151' : '#fff',
                  color: isDarkMode ? '#F9FAFB' : '#1F2937',
                  borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                },
              ]}
              value={learningLanguage}
              onChangeText={setLearningLanguage}
              placeholder="Enter language you're learning"
              placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9CA3AF'}
            />
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
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
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
});
