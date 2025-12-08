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
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
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
  const [lockedLevels, setLockedLevels] = useState<Set<number>>(new Set());
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const modalScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setLoading(true);
        const allLevels = await apiService.getAllLevels();
        // Sort by ID
        const sortedLevels = allLevels.sort((a, b) => a.id - b.id);
        setLevels(sortedLevels);

        // Check lessons count for each level to determine if it should be locked
        const lockedSet = new Set<number>();
        for (const level of sortedLevels) {
          try {
            const lessons = await apiService.getStagesByLevelId(level.id);
            if (lessons.length === 0) {
              lockedSet.add(level.id);
            }
          } catch (error) {
            // If error fetching lessons, consider level locked
            console.warn(`Failed to fetch lessons for level ${level.id}, locking it`);
            lockedSet.add(level.id);
          }
        }
        setLockedLevels(lockedSet);
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

  // Handle modal animation when it becomes visible
  useEffect(() => {
    if (showComingSoonModal) {
      modalScaleAnim.setValue(0);
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      modalScaleAnim.setValue(0);
    }
  }, [showComingSoonModal]);

  const handleLevelPress = (level: LevelDto) => {
    // Check if level is locked (has 0 lessons)
    if (lockedLevels.has(level.id)) {
      setShowComingSoonModal(true);
      return;
    }
  
    // Navigate to lessons if level is not locked
    (navigation as any).navigate('Lessons', {
      levelId: level.id,
      levelName: getLearningLanguageField(learningLanguage, level)
    });
  };

  const getLevelName = (level: LevelDto) => {
    return getLearningLanguageField(learningLanguage, level);
  };

  const styles = getStyles(responsive);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../assets/animations/Loading animation.json')}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
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
              const levelName = getLevelName(level);
              const isLocked = lockedLevels.has(level.id);
              
              return (
                <TouchableOpacity
                  key={level.id}
                  style={[styles.levelCard, isLocked && styles.levelCardLocked]}
                  onPress={() => handleLevelPress(level)}
                  activeOpacity={isLocked ? 1 : 0.8}
                  disabled={false}
                >
                  <LinearGradient
                    colors={isLocked ? ['#9CA3AF', '#6B7280'] : ['#43BCCD', '#5DD3A1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.levelGradient}
                  >
                    <View style={styles.levelContent}>
                      <View style={styles.levelTextContainer}>
                        <Text style={[styles.levelTitle, isLocked && styles.levelTitleLocked]}>
                          {levelName}
                        </Text>
                      </View>
                      {isLocked ? (
                        <MaterialIcons name="lock" size={responsive.wp(8.5)} color="rgba(255, 255, 255, 0.7)" />
                      ) : (
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

      {/* Coming Soon Modal */}
      <Modal
        visible={showComingSoonModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          Animated.timing(modalScaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowComingSoonModal(false);
            modalScaleAnim.setValue(0);
          });
        }}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: modalScaleAnim }],
              },
            ]}
          >
            <View style={styles.modalContent}>
              {/* Heading */}
              <Text style={styles.comingSoonTitle}>Coming Soon</Text>

              {/* Lottie Animation */}
              <View style={styles.lottieContainer}>
                <LottieView
                  source={require('../../assets/animations/comming soon.json')}
                  autoPlay
                  loop
                  style={styles.lottieAnimation}
                />
              </View>

              {/* Message */}
              <Text style={styles.comingSoonMessage}>
                Level will be available soon!
              </Text>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  Animated.timing(modalScaleAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }).start(() => {
                    setShowComingSoonModal(false);
                    modalScaleAnim.setValue(0);
                  });
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF6B9D', '#FFB366']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  levelCardLocked: {
    opacity: 0.7,
    elevation: 4,
  },
  
  levelGradient: {
    padding: responsive.wp(5),
  },
  
  levelContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  levelTitleLocked: {
    opacity: 0.8,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
  },
  loadingAnimation: {
    width: responsive.wp(40),
    height: responsive.wp(40),
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsive.wp(5),
  },
  modalContainer: {
    width: '85%',
    maxWidth: responsive.wp(90),
    borderRadius: responsive.wp(7.5),
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.6) },
    shadowOpacity: 0.3,
    shadowRadius: responsive.wp(2.5),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: responsive.wp(7.5),
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: responsive.wp(8),
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginTop: responsive.hp(1),
    marginBottom: responsive.hp(2.5),
  },
  lottieContainer: {
    width: responsive.wp(62.5),
    height: responsive.wp(62.5),
    marginBottom: responsive.hp(2.5),
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  comingSoonMessage: {
    fontSize: responsive.wp(4.5),
    color: '#666666',
    textAlign: 'center',
    marginBottom: responsive.hp(3),
    fontWeight: '600',
  },
  modalButton: {
    borderRadius: responsive.wp(6.25),
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: responsive.hp(0.4) },
    shadowOpacity: 0.3,
    shadowRadius: responsive.wp(1.25),
  },
  modalButtonGradient: {
    paddingVertical: responsive.hp(1.5),
    paddingHorizontal: responsive.wp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: responsive.wp(4.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: responsive.wp(0.25), height: responsive.hp(0.12) },
    textShadowRadius: responsive.wp(0.5),
  },
});

export default LevelsScreen;



