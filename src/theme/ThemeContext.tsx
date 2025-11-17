import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  background: readonly [string, string, ...string[]];
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  settingsCard: string;
  divider: string;
  profileGradient: readonly [string, string, ...string[]];
  // Kid-friendly screen backgrounds
  songsBackground: readonly [string, string, ...string[]];
  videosBackground: readonly [string, string, ...string[]];
  lessonsBackground: readonly [string, string, ...string[]];
  profileBackground: readonly [string, string, ...string[]];
  // Header gradients
  headerGradient: readonly [string, string, ...string[]];
  // Decorative colors
  decorativeCircle1: string;
  decorativeCircle2: string;
  decorativeCircle3: string;
}

export const lightTheme: ThemeColors = {
  background: ['#E0F2FE', '#F0F9FF', '#FFFFFF'] as const,
  cardBackground: '#fff',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  settingsCard: '#fff',
  divider: '#F3F4F6',
  profileGradient: ['#43BCCD', '#667EEA', '#FF6B9D'] as const,
  // Kid-friendly light mode backgrounds
  songsBackground: ['#FFF0F5', '#FFE4E1', '#E6E6FA'] as const,
  videosBackground: ['#FFE5B4', '#FFDAB9', '#FFB6C1'] as const,
  lessonsBackground: ['#A8E6CF', '#FFE5B4', '#FFDAB9'] as const,
  profileBackground: ['#FFE5E5', '#FFF5E6', '#E6F7FF'] as const,
  headerGradient: ['#43BCCD', '#FF6B9D', '#FFB366'] as const,
  decorativeCircle1: 'rgba(255, 193, 7, 0.25)',
  decorativeCircle2: 'rgba(139, 195, 74, 0.25)',
  decorativeCircle3: 'rgba(103, 58, 183, 0.25)',
};

export const darkTheme: ThemeColors = {
  background: ['#1F2937', '#111827', '#0F172A'] as const,
  cardBackground: '#1F2937',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  settingsCard: '#374151',
  divider: '#4B5563',
  profileGradient: ['#0F766E', '#1E40AF', '#7C3AED'] as const,
  // Kid-friendly dark mode backgrounds
  songsBackground: ['#1F2937', '#374151', '#4B5563'] as const,
  videosBackground: ['#1F2937', '#374151', '#4B5563'] as const,
  lessonsBackground: ['#1F2937', '#374151', '#4B5563'] as const,
  profileBackground: ['#1F2937', '#374151', '#4B5563'] as const,
  headerGradient: ['#0F766E', '#7C3AED', '#DB2777'] as const,
  decorativeCircle1: 'rgba(251, 191, 36, 0.15)',
  decorativeCircle2: 'rgba(74, 222, 128, 0.15)',
  decorativeCircle3: 'rgba(168, 85, 247, 0.15)',
};

interface ThemeContextType {
  isDarkMode: boolean;
  theme: ThemeColors;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void;
  setCurrentUsername: (username: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentUsername, setUsername] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Load dark mode preference when username changes
  useEffect(() => {
    const loadThemePreference = async () => {
      if (!currentUsername) {
        setIsLoaded(true);
        return;
      }
      
      try {
        const savedTheme = await AsyncStorage.getItem(`theme_preference_${currentUsername}`);
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          // Default to light mode if no preference saved
          setIsDarkMode(false);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadThemePreference();
  }, [currentUsername]);

  // Save dark mode preference whenever it changes (user-specific)
  useEffect(() => {
    const saveThemePreference = async () => {
      if (isLoaded && currentUsername) {
        try {
          await AsyncStorage.setItem(`theme_preference_${currentUsername}`, isDarkMode ? 'dark' : 'light');
        } catch (error) {
          console.error('Failed to save theme preference:', error);
        }
      }
    };
    saveThemePreference();
  }, [isDarkMode, isLoaded, currentUsername]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
  };

  const setCurrentUsername = (username: string | null) => {
    setUsername(username);
    setIsLoaded(false); // Reset loaded state to trigger preference reload
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme, setDarkMode, setCurrentUsername }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
