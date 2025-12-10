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
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService, { LevelDto } from '../services/api';
import { getLearningLanguageField } from '../utils/languageUtils';
import { Language } from '../utils/translations';
import { useResponsive } from '../utils/responsive';

const { width } = Dimensions.get('window');

const LevelsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme(); // You can keep this or ignore if fully overriding
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
  const slideAnim = useRef(new Animated.Value(30)).current;
  const modalScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setLoading(true);
        const allLevels = await apiService.getAllLevels();
        const sortedLevels = allLevels.sort((a, b) => a.id - b.id);
        setLevels(sortedLevels);

        const lockedSet = new Set<number>();
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
        } else {
          Alert.alert('Error', 'Failed to load levels.');
        }
        setLevels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLevels();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (showComingSoonModal) {
      modalScaleAnim.setValue(0);
      Animated.spring(modalScaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
    }
  }, [showComingSoonModal]);

  const handleLevelPress = (level: LevelDto) => {
    if (lockedLevels.has(level.id)) {
      setShowComingSoonModal(true);
      return;
    }
    (navigation as any).navigate('Lessons', {
      levelId: level.id,
      levelName: getLearningLanguageField(learningLanguage, level)
    });
  };

  const getLevelName = (level: LevelDto) => getLearningLanguageField(learningLanguage, level);

  const styles = getStyles(responsive);

  // --- LOADING STATE ---
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LottieView
          source={require('../../assets/animations/Loading animation.json')}
          autoPlay loop style={styles.loadingAnimation}
        />
        <Text style={styles.loadingText}>Loading Path...</Text>
      </View>
    );
  }

  // --- PERMISSION DENIED ---
  if (permissionDenied) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#002D62" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Access Denied</Text>
        </View>
        <View style={styles.centerContainer}>
          <MaterialIcons name="lock-outline" size={64} color="#94A3B8" />
          <Text style={styles.emptyText}>Restricted Area</Text>
          <Text style={styles.emptySubtext}>You don't have permission to view this content.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#002D62" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Levels</Text>
          <Text style={styles.headerSubtitle}>Select a level to continue</Text>
        </View>
        <View style={{ width: 40 }} />{/* Spacer for alignment */}
      </View>

      {/* --- CONTENT --- */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {levels.map((level, index) => {
            const levelName = getLevelName(level);
            const isLocked = lockedLevels.has(level.id);
            
            return (
              <TouchableOpacity
                key={level.id}
                style={[styles.levelCard, isLocked && styles.levelCardLocked]}
                onPress={() => handleLevelPress(level)}
                activeOpacity={0.8}
              >
                {/* Left Icon Box */}
                <View style={[styles.iconBox, isLocked ? styles.iconBoxLocked : styles.iconBoxActive]}>
                  {isLocked ? (
                    <MaterialIcons name="lock" size={24} color="#94A3B8" />
                  ) : (
                    <Text style={styles.levelNumber}>{index + 1}</Text>
                  )}
                </View>

                {/* Middle Text */}
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, isLocked && styles.cardTitleLocked]}>
                    {levelName}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {isLocked ? 'Locked' : 'Start Learning'}
                  </Text>
                </View>

                {/* Right Action Icon */}
                <View style={styles.actionIcon}>
                   {isLocked ? (
                     <MaterialIcons name="lock-outline" size={20} color="#CBD5E1" />
                   ) : (
                     <View style={styles.playButton}>
                        <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
                     </View>
                   )}
                </View>

              </TouchableOpacity>
            );
          })}
        </Animated.View>
        
        {/* Bottom Padding */}
        <View style={{height: responsive.hp(5)}} />
      </ScrollView>

      {/* --- MODAL --- */}
      <Modal
        visible={showComingSoonModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowComingSoonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalScaleAnim }] }]}>
            <View style={styles.modalIconContainer}>
               <MaterialCommunityIcons name="timer-sand" size={40} color="#FFFFFF" />
            </View>
            
            <Text style={styles.modalTitle}>Coming Soon!</Text>
            
            <View style={styles.lottieWrapper}>
               <LottieView
                  source={require('../../assets/animations/coming soon.json')}
                  autoPlay loop style={{ width: '100%', height: '100%' }}
                />
            </View>
            
            <Text style={styles.modalMessage}>This level is currently under construction.</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowComingSoonModal(false)}
            >
              <Text style={styles.modalButtonText}>Okay</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (responsive: ReturnType<typeof useResponsive>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Professional Light Gray
  },
  
  // --- HEADER ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsive.wp(5),
    paddingTop: responsive.hp(6), // Safe area
    paddingBottom: responsive.hp(2),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: responsive.wp(5),
    fontWeight: '800',
    color: '#002D62', // Brand Blue
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: responsive.wp(3.5),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },

  // --- CONTENT ---
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsive.wp(5),
    paddingTop: responsive.hp(3),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  // --- LEVEL CARDS ---
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: responsive.hp(2),
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    // Soft Shadow
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  levelCardLocked: {
    backgroundColor: '#F8FAFC', // Slightly darker for locked
    borderColor: '#E2E8F0',
    elevation: 0,
  },
  
  // Left Icon Box
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconBoxActive: {
    backgroundColor: '#E0F2FE', // Light Blue bg
    borderWidth: 1,
    borderColor: '#002D62',
  },
  iconBoxLocked: {
    backgroundColor: '#E2E8F0', // Gray bg
  },
  levelNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#002D62',
  },

  // Middle Text
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: responsive.wp(4.5),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardTitleLocked: {
    color: '#94A3B8',
  },
  cardSubtitle: {
    fontSize: responsive.wp(3.2),
    color: '#64748B',
    fontWeight: '500',
  },

  // Right Action
  actionIcon: {
    marginLeft: 10,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#002D62',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#002D62",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // --- LOADING / EMPTY ---
  loadingAnimation: {
    width: 150,
    height: 150,
  },
  loadingText: {
    marginTop: 20,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 20,
  },
  emptySubtext: {
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // --- MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Darker overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF6B6B', // Red accent for "Stop/Wait"
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -50, // Floating effect
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
  },
  lottieWrapper: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#002D62',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LevelsScreen;