import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

const SongsStoriesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.lessonsBackground || ['#FFF9E6', '#FFE5CC', '#FFD9B3']}
        style={styles.gradient}
      >
        {/* Decorative elements */}
        <View style={[styles.decorativeCircle1, { backgroundColor: theme.decorativeCircle1 || 'rgba(255, 182, 193, 0.3)' }]} />
        <View style={[styles.decorativeCircle2, { backgroundColor: theme.decorativeCircle2 || 'rgba(173, 216, 230, 0.3)' }]} />

        {/* Header */}
        <LinearGradient colors={theme.headerGradient || ['#FF9A8B', '#FF6B9D', '#FF8C94']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerEmoji}>🎵</Text>
              <Text style={styles.headerTitle}>Pop Pop</Text>
              <Text style={styles.headerEmoji}>📖</Text>
            </View>
            <Text style={styles.headerSubtitle}>Choose Songs or Stories</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Animated.View
            style={[
              styles.optionsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Songs Option */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => navigation.navigate('Songs' as never)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF9A8B', '#FF6B9D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionIconContainer}>
                  <MaterialIcons name="library-music" size={48} color="#fff" />
                </View>
                <Text style={styles.optionTitle}>Songs</Text>
                <Text style={styles.optionSubtitle}>Listen and learn with music</Text>
                <MaterialIcons name="chevron-right" size={32} color="#fff" style={styles.arrowIcon} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Stories Option */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => navigation.navigate('Stories' as never)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6A8EFF', '#8A6BFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionIconContainer}>
                  <MaterialIcons name="menu-book" size={48} color="#fff" />
                </View>
                <Text style={styles.optionTitle}>Stories</Text>
                <Text style={styles.optionSubtitle}>Read and listen to stories</Text>
                <MaterialIcons name="chevron-right" size={32} color="#fff" style={styles.arrowIcon} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 200,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 45,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    padding: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerEmoji: {
    fontSize: 32,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  optionsContainer: {
    width: '100%',
  },
  optionCard: {
    marginBottom: 24,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  optionGradient: {
    padding: 30,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  optionIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  optionSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  arrowIcon: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});

export default SongsStoriesScreen;







