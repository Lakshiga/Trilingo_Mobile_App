import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService, { User, LoginRequest, RegisterRequest, UserProfileData } from '../services/api';
import { NetworkDiagnostics } from './networkDiagnostics';

interface UserData {
  id?: string;  // Add optional id property
  username: string;
  name: string;
  age: string;
  email: string;
  password: string;
  nativeLanguage: string;
  learningLanguage: string;
  isAdmin: boolean;
  isGuest: boolean;
  profileImageUrl?: string;
}

const USER_DATA_KEY = '@trilingo_user_data';
const USER_PREFERENCES_PREFIX = '@trilingo_user_prefs_';

interface UserLanguagePreferences {
  nativeLanguage: string;
  learningLanguage: string;
}

export class UserStorage {
  // Save user language preferences by username
  static async saveUserLanguagePreferences(username: string, preferences: UserLanguagePreferences): Promise<void> {
    try {
      const key = `${USER_PREFERENCES_PREFIX}${username}`;
      await AsyncStorage.setItem(key, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user language preferences:', error);
    }
  }

  // Get user language preferences by username
  static async getUserLanguagePreferences(username: string): Promise<UserLanguagePreferences | null> {
    try {
      const key = `${USER_PREFERENCES_PREFIX}${username}`;
      const prefs = await AsyncStorage.getItem(key);
      return prefs ? JSON.parse(prefs) : null;
    } catch (error) {
      console.error('Error getting user language preferences:', error);
      return null;
    }
  }
  // Save current user session
  static async saveCurrentUser(userData: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      // Also save language preferences separately for persistence across logouts
      if (userData.username && !userData.isGuest) {
        await this.saveUserLanguagePreferences(userData.username, {
          nativeLanguage: userData.nativeLanguage,
          learningLanguage: userData.learningLanguage,
        });
      }
      
      // Special handling for admin user profile image
      if (userData.username === 'Admin' && userData.profileImageUrl) {
        await AsyncStorage.setItem('admin_profile_image', userData.profileImageUrl);
      }
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Get current user session
  static async getCurrentUser(): Promise<UserData | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Login user with backend
  static async loginUser(identifier: string, password: string): Promise<UserData | null> {
    try {
      // Check for admin first
      if (identifier === 'Admin' && password === 'Admin@123') {
        // Load admin profile image from AsyncStorage if it exists
        let adminProfileImage: string | undefined;
        try {
          const savedImage = await AsyncStorage.getItem('admin_profile_image');
          if (savedImage) {
            adminProfileImage = savedImage;
          }
        } catch (error) {
          console.error('Failed to load admin profile image:', error);
        }

        // Try to restore saved language preferences for admin
        const savedPreferences = await this.getUserLanguagePreferences('Admin');
        
        const adminUser: UserData = {
          id: 'admin', // Add ID for admin user
          username: 'Admin',
          name: 'Administrator',
          age: '',
          email: 'admin@trilingo.com',
          password: 'Admin@123',
          nativeLanguage: savedPreferences?.nativeLanguage || 'English',
          learningLanguage: savedPreferences?.learningLanguage || 'All',
          isAdmin: true,
          isGuest: false,
          profileImageUrl: adminProfileImage,
        };
        await this.saveCurrentUser(adminUser);
        return adminUser;
      }

      // Try backend login
      const loginRequest: LoginRequest = {
        identifier,
        password,
      };

      const response = await apiService.login(loginRequest);
      
      if (response.isSuccess) {
        const username = response.username || identifier;
        
        // Try to restore saved language preferences for this user
        let savedPreferences = await this.getUserLanguagePreferences(username);
        
        // If no saved preferences, try to fetch from backend profile
        if (!savedPreferences) {
          try {
            const profileResponse = await apiService.getUserProfile();
            if (profileResponse.isSuccess && profileResponse.data) {
              const profileData = profileResponse.data;
              if (profileData.nativeLanguage && profileData.learningLanguage) {
                savedPreferences = {
                  nativeLanguage: profileData.nativeLanguage,
                  learningLanguage: profileData.learningLanguage,
                };
                // Save the preferences for future logins
                await this.saveUserLanguagePreferences(username, savedPreferences);
              }
            }
          } catch (error) {
            // If profile fetch fails, continue with defaults
            console.warn('Could not fetch user profile:', error);
          }
        }
        
        // Get user ID from backend
        let userId: string | undefined;
        try {
          const currentUser = await apiService.getCurrentUser();
          userId = currentUser?.id;
        } catch (error) {
          console.warn('Could not fetch user ID:', error);
        }
        
        const userData: UserData = {
          id: userId, // Add ID to user data
          username: username,
          name: response.username || identifier, // Use username as name
          age: '',
          email: response.email || '',
          password: '',
          nativeLanguage: savedPreferences?.nativeLanguage || 'English', // Use saved preferences or defaults
          learningLanguage: savedPreferences?.learningLanguage || 'Tamil',
          isAdmin: response.role === 'Admin',
          isGuest: false,
          profileImageUrl: response.profileImageUrl,
        };
        await this.saveCurrentUser(userData);
        return userData;
      }

      return null;
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      
      // Network / connection errors - run diagnostics
      if (errorMessage.includes('Network error') || errorMessage.includes('Connection')) {
        const diagnostic = await NetworkDiagnostics.testConnection();
        
        // If CloudFront works, tell the user to use production URL
        if (diagnostic.success && diagnostic.message.includes('https://')) {
          throw new Error(
            'Backend is reachable via CloudFront. Please update the API configuration or disable EXPO_PUBLIC_ENABLE_LOCAL.'
          );
        }
        
        throw new Error(`Backend connection failed: ${diagnostic.message}. Please check if the backend server is running and accessible.`);
      }
      
      throw error;
    }
  }

  // Register user with backend
  static async registerUser(userData: Omit<UserData, 'isAdmin' | 'isGuest'>): Promise<UserData> {
    try {
      // Only send the fields that backend expects
      const registerRequest: RegisterRequest = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
      };

      const response = await apiService.register(registerRequest);
      
      // Primary success check - API indicates success
      if (response.isSuccess) {
        const username = response.username || userData.username;
        const nativeLanguage = userData.nativeLanguage || 'English';
        const learningLanguage = userData.learningLanguage || 'Tamil';
        
        // Save language preferences for this user
        await this.saveUserLanguagePreferences(username, {
          nativeLanguage,
          learningLanguage,
        });
        
        // Get user ID from backend
        let userId: string | undefined;
        try {
          const currentUser = await apiService.getCurrentUser();
          userId = currentUser?.id;
        } catch (error) {
          console.warn('Could not fetch user ID:', error);
        }
        
        const newUserData: UserData = {
          id: userId, // Add ID to user data
          username: username,
          name: userData.name || response.username || userData.username,
          age: userData.age || '',
          email: response.email || userData.email,
          password: userData.password,
          nativeLanguage: nativeLanguage,
          learningLanguage: learningLanguage,
          isAdmin: false,
          isGuest: false,
          profileImageUrl: response.profileImageUrl,
        };
        await this.saveCurrentUser(newUserData);
        return newUserData;
      }

      // Secondary success check - message indicates success but isSuccess might be false
      if (response.message && (
        response.message.includes('successful') || 
        response.message.includes('Login successful') ||
        response.message.includes('Registration successful') ||
        response.message.includes('Account created')
      )) {
        // Registration was successful despite the confusing message format
        const username = userData.username;
        const nativeLanguage = userData.nativeLanguage || 'English';
        const learningLanguage = userData.learningLanguage || 'Tamil';
        
        // Save language preferences for this user
        await this.saveUserLanguagePreferences(username, {
          nativeLanguage,
          learningLanguage,
        });
        
        // Get user ID from backend
        let userId: string | undefined;
        try {
          const currentUser = await apiService.getCurrentUser();
          userId = currentUser?.id;
        } catch (error) {
          console.warn('Could not fetch user ID:', error);
        }
        
        const newUserData: UserData = {
          id: userId, // Add ID to user data
          username: username,
          name: userData.name || userData.username,
          age: userData.age || '',
          email: userData.email,
          password: userData.password,
          nativeLanguage: nativeLanguage,
          learningLanguage: learningLanguage,
          isAdmin: false,
          isGuest: false,
        };
        await this.saveCurrentUser(newUserData);
        return newUserData;
      }

      // If we get here, it's a genuine error
      throw new Error(response.message || 'Registration failed');
    } catch (error: any) {
      console.error('Registration error:', error.message);
      
      // Check if it's a network error and provide helpful message
      if (error.message.includes('Network error') || error.message.includes('Connection')) {
        const diagnostic = await NetworkDiagnostics.testConnection();
        throw new Error(`Backend connection failed: ${diagnostic.message}. Please check if the backend server is running and accessible.`);
      }
      
      throw error;
    }
  }

  // Clear current user session (logout)
  static async logout(): Promise<void> {
    try {
      await apiService.logout();
      await AsyncStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Error logging out:', error);
      // Still clear local data even if backend logout fails
      await AsyncStorage.removeItem(USER_DATA_KEY);
    }
  }

  // Validate user login (legacy method for compatibility)
  static async validateUser(username: string, password: string): Promise<UserData | null> {
    return this.loginUser(username, password);
  }

  // Save user to database (legacy method for compatibility)
  static async saveUserToDatabase(userData: Omit<UserData, 'isAdmin' | 'isGuest'>): Promise<void> {
    try {
      await this.registerUser(userData);
    } catch (error) {
      console.error('Error saving user to database:', error);
      throw error;
    }
  }

  // Check if username already exists
  static async usernameExists(username: string): Promise<boolean> {
    // This would need a backend endpoint to check username availability
    // For now, return false and let the backend handle validation
    return false;
  }

  // Check if email already exists
  static async emailExists(email: string): Promise<boolean> {
    // This would need a backend endpoint to check email availability
    // For now, return false and let the backend handle validation
    return false;
  }
}
