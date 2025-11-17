import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

type LoadingScreenProps = {
  onFinish: () => void;
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    // Show loading screen for 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/App_IconTransparent_512.png.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Trilingual Text */}
      <View style={styles.textContainer}>
        <Text style={styles.englishText}>Trilingo</Text>
        <Text style={styles.sinhalaText}>ත්‍රිලිංගෝ</Text>
        <Text style={styles.tamilText}>டிரிலிங்கோ</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9FE6E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 50,
  },
  logo: {
    width: 160,
    height: 160,
  },
  textContainer: {
    alignItems: 'center',
    gap: 10,
  },
  englishText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3498DB',
    letterSpacing: 1,
  },
  sinhalaText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  tamilText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9B59B6',
  },
});

export default LoadingScreen;