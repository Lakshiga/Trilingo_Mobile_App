import * as React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import { Image, TouchableOpacity, Animated, StyleSheet, View, Text } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import { useUser } from '../context/UserContext';

import { useNavigation } from '@react-navigation/native';

import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';

import { resolveImageUri, isEmojiLike } from '../utils/imageUtils';

import HomeScreen from '../screens/HomeScreen';

import ExerciseScreen from '../screens/ExerciseScreen';

import ProfileScreen from '../screens/ProfileScreen';

import EditProfileScreen from '../screens/EditProfileScreen';

import LoginScreen from '../screens/LoginScreen';

import RegisterScreen from '../screens/RegisterScreen';

import VideosScreen from '../screens/VideosScreen';

import SongsScreen from '../screens/SongsScreen';

import StoriesScreen from '../screens/StoriesScreen';

import ActivitiesScreen from '../screens/ActivitiesScreen';

import DynamicActivityScreen from '../screens/DynamicActivityScreen';

import LevelsScreen from '../screens/LevelsScreen';

import LessonsScreen from '../screens/LessonsScreen';

import LessonActivitiesScreen from '../screens/LessonActivitiesScreen';

import ConversationScreen from '../screens/ConversationScreen';
import StepsAnimationScreen from '../screens/StepsAnimationScreen';

// Create stack navigator
const Stack = createStackNavigator();

// Login Screen wrapper for stack navigation
const LoginScreenWrapper = () => {
  const { login } = useUser();
  const navigation = useNavigation<any>();
  
  const handleLogin = async (userData: any) => {
    try {
      await login(userData);
      // Navigate to home after login
      navigation.navigate('Home');
    } catch (error) {
      // Re-throw error so LoginScreen can catch it and show modal
      throw error;
    }
  };

  const handleRegister = () => {
    // Navigate to register screen
    navigation.navigate('Register');
  };

  const handleGuest = async () => {
    try {
      await handleLogin({ isGuest: true });
    } catch (error) {
      // Silent error handling - no logging
    }
  };

  return (
    <LoginScreen
      onLogin={handleLogin}
      onRegister={handleRegister}
      onGuest={handleGuest}
    />
  );
};

// Register Screen wrapper for stack navigation
const RegisterScreenWrapper = () => {
  const { register } = useUser();
  const navigation = useNavigation<any>();
  
  const handleRegisterComplete = async (userData: any) => {
    try {
      await register(userData);
      // Navigate to home after registration
      navigation.navigate('Home');
    } catch (error) {
      console.error('Registration error:', error);
      throw error; // Let the RegisterScreen handle the error display
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <RegisterScreen
      onRegisterComplete={handleRegisterComplete}
      onBack={handleBack}
    />
  );
};

// Main App Navigator - stack-based navigation without bottom tabs
export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Login" component={LoginScreenWrapper} />
      <Stack.Screen name="Register" component={RegisterScreenWrapper} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Videos" component={VideosScreen} />
      <Stack.Screen name="Songs" component={SongsScreen} />
      <Stack.Screen name="Stories" component={StoriesScreen} />
      <Stack.Screen name="Activities" component={ActivitiesScreen} />
      <Stack.Screen name="Exercise" component={ExerciseScreen} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <Stack.Screen name="DynamicActivity" component={DynamicActivityScreen} />
      <Stack.Screen name="Levels" component={LevelsScreen} />
      <Stack.Screen name="Lessons" component={LessonsScreen} />
      <Stack.Screen name="LessonActivities" component={LessonActivitiesScreen} />
      <Stack.Screen name="Conversation" component={ConversationScreen} />
      <Stack.Screen name="StepsAnimation" component={StepsAnimationScreen} />
    </Stack.Navigator>
  );
}

// Styles for tab navigation
const tabStyles = StyleSheet.create({
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusedIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 1.1 }],
  },
});