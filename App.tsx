import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigation';
import SplashScreen from './src/screens/SplashScreen';
import LoadingScreen from './src/screens/LoadingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { UserProvider, useUser } from './src/context/UserContext';

// Component to sync current user to theme context for user-specific preferences
const UserThemeSync: React.FC = () => {
  const { currentUser } = useUser();
  const { setCurrentUsername } = useTheme();

  useEffect(() => {
    // Update theme context when user changes
    setCurrentUsername(currentUser?.username || null);
  }, [currentUser, setCurrentUsername]);

  return null;
};

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { currentUser, isLoading, login, register } = useUser();

  useEffect(() => {
    // Show splash screen for 2 seconds, then check auth
    const timer = setTimeout(() => {
      setShowSplash(false);
      if (!currentUser && !isLoading) {
        setShowLogin(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentUser, isLoading]);

  const handleLogin = async (userData: any) => {
    try {
      await login(userData);
      setShowLogin(false);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleGuest = () => {
    handleLogin({ isGuest: true });
  };

  const handleRegisterComplete = async (userData: any) => {
    try {
      await register(userData);
      setShowRegister(false);
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen onFinish={() => {}} />;
  }

  // Show login screen
  if (showLogin && !currentUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGuest={handleGuest}
      />
    );
  }

  // Show register screen
  if (showRegister && !currentUser) {
    return (
      <RegisterScreen
        onRegisterComplete={handleRegisterComplete}
        onBack={handleBackToLogin}
      />
    );
  }

  // Show main app
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <UserThemeSync />
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
}