import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigation';
import SplashScreen from './src/screens/SplashScreen';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { UserProvider, useUser } from './src/context/UserContext';
import { useFonts } from 'expo-font';
import { BackgroundAudioProvider } from './src/context/BackgroundAudioContext';

// Sync User → Theme context
const UserThemeSync: React.FC = () => {
  const { currentUser } = useUser();
  const { setCurrentUsername } = useTheme();

  useEffect(() => {
    setCurrentUsername(currentUser?.username || null);
  }, [currentUser]);

  return null;
};

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded] = useFonts({
    'SpicyRice-Regular': require('./assets/fonts/SpicyRice-Regular.ttf'),
  });
  
  if (!fontsLoaded) return null;
  
  // Show Splash Screen then render main navigator (Welcome is initial route)
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // After splash show the app navigator which starts at Welcome
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
        <BackgroundAudioProvider>
          <AppContent />
        </BackgroundAudioProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
