import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService, { LevelDto } from '../services/api';
import { getLearningLanguageField, getLanguageKey } from '../utils/languageUtils';
import { Language } from '../utils/translations';
import { useResponsive } from '../utils/responsive';

const LevelsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { currentUser } = useUser();
  const responsive = useResponsive();
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setLoading(true);
        const allLevels = await apiService.getAllLevels();
        // Sort by ID
        const sortedLevels = allLevels.sort((a, b) => a.id - b.id);
        setLevels(sortedLevels);
      } catch (error: any) {
        // Check if it's a permissions error
        if (error.name === 'PermissionDeniedError' || 
            (error.message && error.message.includes('403')) || 
            (error.message && error.message.includes('PERMISSION_DENIED'))) {
          console.log('User does not have permission to access learning levels');
          Alert.alert('Access Denied', 'You do not have permission to access the learning levels. Please contact an administrator.');
          setPermissionDenied(true);
        } else {
          console.error('Error fetching levels:', error);
          Alert.alert('Error', 'Failed to load levels. Please try again.');
        }
        setLevels([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchLevels();

    // Animate header
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

  const handleLevelPress = (level: LevelDto) => {
    if (level.id === 1) {
      // Only Level 01 is active
      (navigation as any).navigate('Lessons', { 
        levelId: level.id, 
        levelName: getLearningLanguageField(learningLanguage, level) 
      });
    } else {
      // Other levels are locked
      Alert.alert(
        'Coming Soon',
        'This level will be available in a future update. Stay tuned!',
        [{ text: 'OK' }]
      );
    }
  };

  const getLevelName = (level: LevelDto) => {
    return getLearningLanguageField(learningLanguage, level);
  };

  const styles = getStyles(responsive);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.textPrimary || '#43BCCD'} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading levels...
        </Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={theme.lessonsBackground || ['#FFF9E6', '#FFE5CC', '#FFD9B3']}
          style={styles.gradient}
        >
          {/* Decorative elements */}
          <View style={[styles.decorativeCircle1, { backgroundColor: theme.decorativeCircle1 || 'rgba(255, 182, 193, 0.3)' }]} />
          <View style={[styles.decorativeCircle2, { backgroundColor: theme.decorativeCircle2 || 'rgba(173, 216, 230, 0.3)' }]} />
          <View style={[styles.decorativeCircle3, { backgroundColor: theme.decorativeCircle3 || 'rgba(255, 218, 185, 0.3)' }]} />

          {/* Header */}
          <LinearGradient colors={theme.headerGradient || ['#FF9A8B', '#FF6B9D', '#FF8C94']} style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerEmoji}>📚</Text>
                <Text style={styles.headerTitle}>Levels</Text>
                <Text style={styles.headerEmoji}>🎓</Text>
              </View>
              <Text style={styles.headerSubtitle}>Choose your learning level</Text>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Access Denied</Text>
              <Text style={styles.emptySubtext}>
                You do not have permission to access the learning levels. 
                Please contact an administrator or upgrade your account to access this content.
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.lessonsBackground || ['#FFF9E6', '#FFE5CC', '#FFD9B3']}
        style={styles.gradient}
      >
        {/* Decorative elements */}
        <View style={[styles.decorativeCircle1, { backgroundColor: theme.decorativeCircle1 || 'rgba(255, 182, 193, 0.3)' }]} />
        <View style={[styles.decorativeCircle2, { backgroundColor: theme.decorativeCircle2 || 'rgba(173, 216, 230, 0.3)' }]} />
        <View style={[styles.decorativeCircle3, { backgroundColor: theme.decorativeCircle3 || 'rgba(255, 218, 185, 0.3)' }]} />

        {/* Header */}
        <LinearGradient colors={theme.headerGradient || ['#FF9A8B', '#FF6B9D', '#FF8C94']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={responsive.wp(7.5)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerEmoji}>📚</Text>
              <Text style={styles.headerTitle}>Levels</Text>
              <Text style={styles.headerEmoji}>🎓</Text>
            </View>
            <Text style={styles.headerSubtitle}>Choose your learning level</Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.levelsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {levels.map((level, index) => {
              const isLocked = level.id !== 1;
              const levelName = getLevelName(level);
              
              return (
                <TouchableOpacity
                  key={level.id}
                  style={[styles.levelCard, isLocked && styles.lockedCard]}
                  onPress={() => handleLevelPress(level)}
                  activeOpacity={0.8}
                  disabled={isLocked}
                >
                  <LinearGradient
                    colors={isLocked 
                      ? ['#E5E7EB', '#D1D5DB'] 
                      : ['#43BCCD', '#5DD3A1']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.levelGradient}
                  >
                    <View style={styles.levelContent}>
                      <View style={styles.levelIconContainer}>
                        {isLocked ? (
                          <MaterialIcons name="lock" size={responsive.wp(10.5)} color="#9CA3AF" />
                        ) : (
                          <Text style={styles.levelNumber}>{level.id}</Text>
                        )}
                      </View>
                      <View style={styles.levelTextContainer}>
                        <Text style={[styles.levelTitle, isLocked && styles.lockedText]}>
                          {levelName}
                        </Text>
                        {isLocked && (
                          <Text style={styles.lockedSubtext}>Coming Soon</Text>
                        )}
                      </View>
                      {!isLocked && (
                        <MaterialIcons name="chevron-right" size={responsive.wp(8.5)} color="#fff" />
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) => StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: responsive.hp(-7.5),
    right: responsive.wp(-10),
    width: responsive.wp(37),
    height: responsive.wp(37),
    borderRadius: responsive.wp(18.5),
  },
  decorativeCircle2: {
    position: 'absolute',
    top: responsive.hp(18),
    left: responsive.wp(-13),
    width: responsive.wp(27),
    height: responsive.wp(27),
    borderRadius: responsive.wp(13.5),
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: responsive.hp(25),
    right: responsive.wp(-8),
    width: responsive.wp(32),
    height: responsive.wp(32),
    borderRadius: responsive.wp(16),
  },
  header: {
    paddingTop: responsive.hp(6),
    paddingBottom: responsive.hp(3),
    paddingHorizontal: responsive.wp(5),
  },
  backButton: {
    position: 'absolute',
    top: responsive.hp(5.5),
    left: responsive.wp(5),
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: responsive.wp(6.5),
    padding: responsive.wp(3.2),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.4) },
    shadowOpacity: 0.3,
    shadowRadius: responsive.wp(1),
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsive.hp(1),
  },
  headerEmoji: {
    fontSize: responsive.wp(8.5),
    marginHorizontal: responsive.wp(2),
  },
  headerTitle: {
    fontSize: responsive.wp(8.5),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: responsive.wp(0.5), height: responsive.hp(0.25) },
    textShadowRadius: responsive.wp(1),
  },
  headerSubtitle: {
    fontSize: responsive.wp(4.2),
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: responsive.wp(0.25), height: responsive.hp(0.12) },
    textShadowRadius: responsive.wp(0.5),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: responsive.hp(1.8),
    paddingHorizontal: responsive.wp(5),
    paddingBottom: responsive.hp(3.5),
  },
  levelsContainer: {
    width: '100%',
  },
  levelCard: {
    marginBottom: responsive.hp(2.2),
    borderRadius: responsive.wp(5),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.5) },
    shadowOpacity: 0.3,
    shadowRadius: responsive.wp(2),
    overflow: 'hidden',
  },
  lockedCard: {
    opacity: 0.7,
  },
  levelGradient: {
    padding: responsive.wp(5),
  },
  levelContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelIconContainer: {
    width: responsive.wp(18.5),
    height: responsive.wp(18.5),
    borderRadius: responsive.wp(9.25),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsive.wp(4),
  },
  levelNumber: {
    fontSize: responsive.wp(8.5),
    fontWeight: 'bold',
    color: '#fff',
  },
  levelTextContainer: {
    flex: 1,
  },
  levelTitle: {
    fontSize: responsive.wp(6.4),
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: responsive.wp(0.25), height: responsive.hp(0.12) },
    textShadowRadius: responsive.wp(0.5),
  },
  lockedText: {
    color: '#6B7280',
  },
  lockedSubtext: {
    fontSize: responsive.wp(3.7),
    color: '#9CA3AF',
    marginTop: responsive.hp(0.5),
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
  },
  loadingText: {
    marginTop: responsive.hp(2),
    fontSize: responsive.wp(4.2),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsive.hp(6),
  },
  emptyText: {
    fontSize: responsive.wp(4.8),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: responsive.hp(1),
  },
  emptySubtext: {
    fontSize: responsive.wp(3.7),
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default LevelsScreen;



