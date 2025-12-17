import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Modal,
  StatusBar,
  Dimensions,
  ImageBackground
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService, { LevelDto } from '../services/api';
import { getLearningLanguageField } from '../utils/languageUtils';
import { Language } from '../utils/translations';
import { useResponsive } from '../utils/responsive';

const LevelsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentUser } = useUser();
  const responsive = useResponsive();
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [lockedLevels, setLockedLevels] = useState<Set<number>>(new Set());
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const modalScaleAnim = useRef(new Animated.Value(0)).current;

  // Kids Theme Colors - Matching Home Page Blue Theme
  const THEME_COLOR = '#0284C7'; // Blue (matching home page)
  const ACCENT_COLOR = '#0EA5E9'; // Light Blue
  const TEXT_COLOR = '#0369A1'; // Dark Blue
  const BG_COLOR = '#E0F2FE'; // Light blue bg (matching home page)

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setLoading(true);
        const allLevels = await apiService.getAllLevels();
        const sortedLevels = allLevels.sort((a, b) => a.id - b.id);
        setLevels(sortedLevels);

        const lockedSet = new Set<number>();
        // Logic remains same, but visual representation changes
        for (const level of sortedLevels) {
          try {
            const lessons = await apiService.getStagesByLevelId(level.id);
            if (lessons.length === 0) lockedSet.add(level.id);
          } catch (error) {
            lockedSet.add(level.id);
          }
        }
        setLockedLevels(lockedSet);
      } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('PERMISSION')) {
          setPermissionDenied(true);
        }
        setLevels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLevels();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (showComingSoonModal) {
      modalScaleAnim.setValue(0);
      Animated.spring(modalScaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    }
  }, [showComingSoonModal]);

  const handleLevelPress = async (level: LevelDto) => {
    if (lockedLevels.has(level.id)) {
      setShowComingSoonModal(true);
      return;
    }

    // Check payment access for levels >= 3 (after completing level 2)
    if (level.id >= 3) {
      try {
        const accessResponse = await apiService.checkLevelAccess(level.id);
        if (!accessResponse.isSuccess || !accessResponse.hasAccess) {
          // Payment required
          (navigation as any).navigate('Payment', {
            levelId: level.id,
            levelName: getLearningLanguageField(learningLanguage, level),
            nextLevelId: level.id,
          });
          return;
        }
      } catch (error) {
        console.error('Error checking level access:', error);
        // Continue to level if check fails
      }
    }

    (navigation as any).navigate('Lessons', {
      levelId: level.id,
      levelName: getLearningLanguageField(learningLanguage, level)
    });
  };

  const styles = getStyles(responsive, THEME_COLOR, ACCENT_COLOR, TEXT_COLOR, BG_COLOR);

  // --- LOADING STATE ---
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LottieView
          source={require('../../assets/animations/Loading animation.json')} // Ensure this exists or use a fun alternative
          autoPlay loop style={styles.loadingAnimation}
        />
        <Text style={styles.loadingText}>Getting Ready...</Text>
      </View>
    );
  }

  // --- PERMISSION DENIED (Kid Friendly) ---
  if (permissionDenied) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={28} color={TEXT_COLOR} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="robot-confused" size={80} color="#FF6B6B" />
          <Text style={styles.emptyText}>Oops!</Text>
          <Text style={styles.emptySubtext}>We can't open this right now.</Text>
          <TouchableOpacity style={styles.modalButton} onPress={() => navigation.goBack()}>
            <Text style={styles.modalButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />

      {/* --- FUN HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Adventure Map</Text>
        </View>
        <View style={{ width: 45 }} /> 
      </View>

      {/* --- LEVEL CONTENT --- */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mascotContainer}>
            <Text style={styles.welcomeText}>
              Pick a level to start! 🚀
            </Text>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {levels.map((level, index) => {
            const levelName = getLearningLanguageField(learningLanguage, level);
            const isLocked = lockedLevels.has(level.id);
            
            return (
              <TouchableOpacity
                key={level.id}
                style={[styles.levelCard, isLocked && styles.levelCardLocked]}
                onPress={() => handleLevelPress(level)}
                activeOpacity={0.9}
              >
                {/* Level Number Bubble */}
                <View style={[styles.numberBubble, isLocked ? styles.numberBubbleLocked : styles.numberBubbleActive]}>
                  {isLocked ? (
                    <Feather name="lock" size={22} color="#A0AEC0" />
                  ) : (
                    <Text style={styles.levelNumber}>{index + 1}</Text>
                  )}
                </View>

                {/* Level Info */}
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, isLocked && styles.cardTitleLocked]}>
                    {levelName}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {isLocked ? 'Unlock me!' : 'Let\'s Play!'}
                  </Text>
                </View>

                {/* Action Button */}
                {!isLocked && (
                    <View style={styles.playButton}>
                       <MaterialIcons name="play-arrow" size={28} color="#FFFFFF" />
                    </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
        
        <View style={{height: responsive.hp(10)}} />
      </ScrollView>

      {/* --- FUN MODAL --- */}
      <Modal
        visible={showComingSoonModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowComingSoonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalScaleAnim }] }]}>
            <View style={styles.modalStarContainer}>
               <MaterialCommunityIcons name="star-face" size={50} color="#FFF" />
            </View>
            
            <Text style={styles.modalTitle}>Coming Soon!</Text>
            
            <View style={styles.lottieWrapper}>
               <LottieView
                  source={require('../../assets/animations/coming soon.json')} // Ensure this path is correct
                  autoPlay loop style={{ width: '100%', height: '100%' }}
                />
            </View>
            
            <Text style={styles.modalMessage}>
              We are building this level!{"\n"}Check back later, friend!
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowComingSoonModal(false)}
            >
              <Text style={styles.modalButtonText}>Okay!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

// --- STYLES FOR KIDS APP ---
const getStyles = (
  responsive: ReturnType<typeof useResponsive>,
  themeColor: string,
  accentColor: string,
  textColor: string,
  bgColor: string
) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bgColor,
  },
  
  // --- HEADER ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsive.wp(5),
    paddingTop: responsive.hp(6),
    paddingBottom: responsive.hp(3),
    backgroundColor: themeColor,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: themeColor,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: responsive.wp(5),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  
  // --- CONTENT ---
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsive.wp(5),
    paddingTop: responsive.hp(2),
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: responsive.hp(3),
    marginTop: responsive.hp(1),
  },
  welcomeText: {
    fontSize: responsive.wp(4.5),
    fontWeight: '700',
    color: '#636e72',
    textAlign: 'center',
  },

  // --- LOADING ---
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: bgColor,
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 10,
    color: themeColor,
    fontWeight: '800',
    fontSize: 20,
  },

  // --- LEVEL CARDS ---
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // Very rounded
    marginBottom: responsive.hp(2.5),
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderBottomWidth: 4, // 3D Effect
    borderBottomColor: '#E2E8F0',
  },
  levelCardLocked: {
    backgroundColor: '#F7FAFC',
    borderBottomColor: '#EDF2F7',
    opacity: 0.9,
  },
  
  // Number Bubble
  numberBubble: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  numberBubbleActive: {
    backgroundColor: '#DEF7FF', // Light cyan
    borderWidth: 2,
    borderColor: themeColor,
  },
  numberBubbleLocked: {
    backgroundColor: '#EDF2F7',
    borderWidth: 2,
    borderColor: '#CBD5E0',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: themeColor,
  },

  // Text
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: responsive.wp(4.8),
    fontWeight: '800',
    color: textColor,
    marginBottom: 4,
  },
  cardTitleLocked: {
    color: '#A0AEC0',
  },
  cardSubtitle: {
    fontSize: responsive.wp(3.5),
    color: '#7F8C8D',
    fontWeight: '600',
  },

  // Play Button - More vibrant
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B9D', // Pink
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#FF6B9D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // --- EMPTY / ERROR ---
  emptyText: {
    fontSize: 24,
    fontWeight: '900',
    color: themeColor,
    marginTop: 20,
  },
  emptySubtext: {
    color: '#7F8C8D',
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },

  // --- MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalStarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: accentColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -60,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: textColor,
    marginTop: 10,
    marginBottom: 10,
  },
  lottieWrapper: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '500',
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: themeColor,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25, // Pill shape
    width: '80%',
    alignItems: 'center',
    shadowColor: themeColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    borderBottomWidth: 4,
    borderBottomColor: '#2879C9', // Darker blue for 3D
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
});

export default LevelsScreen;