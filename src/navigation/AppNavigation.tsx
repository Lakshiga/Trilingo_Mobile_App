import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Image, TouchableOpacity, Animated, StyleSheet, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../config/apiConfig';

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
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${imageUrl}`;
  }
  
  // Check if it's an emoji or invalid text
  if (imageUrl.length <= 10 && !imageUrl.includes('.') && !imageUrl.includes('/')) {
    return null;
  }
  
  // If it looks like a relative path, try to construct full URL
  if (imageUrl.startsWith('/')) {
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${imageUrl}`;
  }
  
  return null;
};

import HomeScreen from '../screens/HomeScreen';
import ExerciseScreen from '../screens/ExerciseScreen';
import LessonScreen from '../screens/LessonScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VideosScreen from '../screens/VideosScreen';
import SongsScreen from '../screens/SongsScreen';
import StoriesScreen from '../screens/StoriesScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';

// Create both tab and stack navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom Tab Button with Press Effect
const CustomTabButton = ({ children, onPress }: any) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
      style={tabStyles.tabButton}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Tab Navigator - includes only Home, Lessons, and Profile (or Login for guests)
function TabNavigator() {
  const { currentUser } = useUser();
  const isGuest = currentUser?.isGuest || !currentUser;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return (
              <Animated.View style={focused ? tabStyles.focusedIcon : tabStyles.icon}>
                <Image 
                  source={require('../../assets/home.webp')} 
                  style={{ 
                    width: size, 
                    height: size,
                    opacity: focused ? 1 : 0.6,
                  }} 
                />
              </Animated.View>
            );
          } else if (route.name === 'Lessons') {
            return (
              <Animated.View style={focused ? tabStyles.focusedIcon : tabStyles.icon}>
                <Image 
                  source={require('../../assets/lessons.png')} 
                  style={{ 
                    width: size, 
                    height: size,
                    opacity: focused ? 1 : 0.6,
                  }} 
                />
              </Animated.View>
            );
          } else if (route.name === 'Profile' || route.name === 'Login') {
            if (isGuest) {
              // Show login arrow for guest users
              return (
                <Animated.View style={focused ? tabStyles.focusedIcon : tabStyles.icon}>
                  <MaterialIcons 
                    name="login" 
                    size={size} 
                    color={focused ? '#43BCCD' : 'gray'}
                  />
                </Animated.View>
              );
            } else {
              // Show profile image or default icon for logged-in users
              return (
                <Animated.View style={focused ? tabStyles.focusedIcon : tabStyles.icon}>
                  {currentUser?.profileImageUrl ? (
                    (() => {
                      const imageUri = getFullImageUrl(currentUser.profileImageUrl);
                      return imageUri ? (
                        <Image 
                          source={{ uri: imageUri }} 
                          style={{ 
                            width: size, 
                            height: size,
                            borderRadius: size / 2,
                            borderWidth: focused ? 2 : 0,
                            borderColor: '#43BCCD',
                            opacity: focused ? 1 : 0.6,
                            backgroundColor: '#f0f0f0',
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={{ 
                          width: size, 
                          height: size,
                          borderRadius: size / 2,
                          backgroundColor: '#FFD700',
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: focused ? 2 : 0,
                          borderColor: '#43BCCD',
                          opacity: focused ? 1 : 0.6,
                        }}>
                          <Text style={{ fontSize: size * 0.6 }}>{currentUser.profileImageUrl}</Text>
                        </View>
                      );
                    })()
                  ) : (
                    <Image 
                      source={require('../../assets/profile.png')} 
                      style={{ 
                        width: size, 
                        height: size,
                        opacity: focused ? 1 : 0.6,
                      }} 
                    />
                  )}
                </Animated.View>
              );
            }
          }
        },
        tabBarActiveTintColor: '#43BCCD',
        tabBarInactiveTintColor: 'gray',
        tabBarButton: (props) => <CustomTabButton {...props} />,
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Lessons" component={LessonScreen} />
      {isGuest ? (
        <Tab.Screen 
          name="Login" 
          component={LoginScreenWrapper}
          options={{
            tabBarLabel: 'Login',
          }}
        />
      ) : (
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profile',
          }}
        />
      )}
    </Tab.Navigator>
  );
}

// Login Screen wrapper for tab navigation
const LoginScreenWrapper = () => {
  const { login } = useUser();
  const navigation = useNavigation<any>();
  
  const handleLogin = async (userData: any) => {
    try {
      await login(userData);
      // Navigation will automatically update due to user context change
    } catch (error) {
      console.error('Login error:', error);
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
      console.error('Guest login error:', error);
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
      // Navigation will automatically update due to user context change
    } catch (error) {
      console.error('Registration error:', error);
      throw error; // Let the RegisterScreen handle the error display
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return React.createElement(RegisterScreen, {
    onRegisterComplete: handleRegisterComplete,
    onBack: handleBack,
  });
};

// Main App Navigator - combines tab navigator with all feature screens
export default function AppNavigator() {
  return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Register" component={RegisterScreenWrapper} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Videos" component={VideosScreen} />
        <Stack.Screen name="Songs" component={SongsScreen} />
        <Stack.Screen name="Stories" component={StoriesScreen} />
        <Stack.Screen name="Activities" component={ActivitiesScreen} />
        <Stack.Screen name="Exercise" component={ExerciseScreen} />
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