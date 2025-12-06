import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useResponsive } from '../utils/responsive';
import { Language } from '../utils/translations';

// Letter data for each language
const LETTERS = {
  English: [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ],
  Tamil: [
    'அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ',
    'க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன'
  ],
  Sinhala: [
    'අ', 'ආ', 'ඇ', 'ඈ', 'ඉ', 'ඊ', 'උ', 'ඌ', 'ඍ', 'ඎ', 'ඏ', 'ඐ',
    'එ', 'ඒ', 'ඓ', 'ඔ', 'ඕ', 'ඖ', 'ක', 'ඛ', 'ග', 'ඝ', 'ඞ', 'ඟ',
    'ච', 'ඡ', 'ජ', 'ඣ', 'ඤ', 'ඥ', 'ට', 'ඨ', 'ඩ', 'ඪ', 'ණ', 'ඬ'
  ],
};

const LetterSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const responsive = useResponsive();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('English');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

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

  const handleLetterPress = (letter: string) => {
    (navigation as any).navigate('LetterTracking', {
      letter,
      language: selectedLanguage,
    });
  };

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

  const styles = getStyles(responsive, isDarkMode);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#374151'] : ['#43BCCD', '#FF6B9D', '#FFB366']}
        style={styles.gradient}
      >
        {/* Header */}
        <LinearGradient
          colors={['#FF9A8B', '#FF6B9D', '#FF8C94']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={responsive.wp(7.5)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerEmoji}>✏️</Text>
              <Text style={styles.headerTitle}>Learn Letters</Text>
              <Text style={styles.headerEmoji}>📚</Text>
            </View>
            <Text style={styles.headerSubtitle}>Choose a language and letter to practice</Text>
          </View>
        </LinearGradient>

        {/* Language Selection */}
        <View style={styles.languageContainer}>
          <Text style={styles.sectionTitle}>Select Language</Text>
          <View style={styles.languageButtons}>
            {(['English', 'Tamil', 'Sinhala'] as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageButton,
                  selectedLanguage === lang && styles.languageButtonActive,
                ]}
                onPress={() => handleLanguageSelect(lang)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    selectedLanguage === lang
                      ? ['#43BCCD', '#5DD3A1']
                      : ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']
                  }
                  style={styles.languageGradient}
                >
                  <Text style={styles.languageText}>{lang}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Letters Grid */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.lettersContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.lettersTitle}>
              {selectedLanguage} Letters
            </Text>
            <View style={styles.lettersGrid}>
              {LETTERS[selectedLanguage].map((letter, index) => (
                <TouchableOpacity
                  key={`${letter}-${index}`}
                  style={styles.letterCard}
                  onPress={() => handleLetterPress(letter)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#6A8EFF', '#8A6BFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.letterGradient}
                  >
                    <Text style={styles.letterText}>{letter}</Text>
                    <View style={styles.letterIcon}>
                      <MaterialIcons name="edit" size={responsive.wp(5)} color="rgba(255,255,255,0.8)" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const getStyles = (
  responsive: ReturnType<typeof useResponsive>,
  isDarkMode: boolean
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
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
    languageContainer: {
      paddingHorizontal: responsive.wp(5),
      paddingVertical: responsive.hp(2),
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    sectionTitle: {
      fontSize: responsive.wp(5.5),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: responsive.hp(1.5),
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: responsive.wp(0.3), height: responsive.hp(0.15) },
      textShadowRadius: responsive.wp(0.8),
    },
    languageButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: responsive.wp(2),
    },
    languageButton: {
      flex: 1,
      borderRadius: responsive.wp(4),
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: responsive.hp(0.3) },
      shadowOpacity: 0.2,
      shadowRadius: responsive.wp(1.5),
    },
    languageButtonActive: {
      elevation: 6,
      shadowOpacity: 0.4,
    },
    languageGradient: {
      paddingVertical: responsive.hp(1.5),
      paddingHorizontal: responsive.wp(3),
      alignItems: 'center',
      justifyContent: 'center',
    },
    languageText: {
      fontSize: responsive.wp(4.5),
      fontWeight: 'bold',
      color: '#fff',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: responsive.wp(0.2), height: responsive.hp(0.1) },
      textShadowRadius: responsive.wp(0.5),
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: responsive.hp(2),
      paddingHorizontal: responsive.wp(5),
      paddingBottom: responsive.hp(3.5),
    },
    lettersContainer: {
      width: '100%',
    },
    lettersTitle: {
      fontSize: responsive.wp(6),
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: responsive.hp(2),
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: responsive.wp(0.3), height: responsive.hp(0.15) },
      textShadowRadius: responsive.wp(0.8),
    },
    lettersGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: responsive.wp(2.5),
    },
    letterCard: {
      width: responsive.wp(18),
      height: responsive.wp(18),
      borderRadius: responsive.wp(4),
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: responsive.hp(0.4) },
      shadowOpacity: 0.3,
      shadowRadius: responsive.wp(2),
      overflow: 'hidden',
      marginBottom: responsive.hp(1),
    },
    letterGradient: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    letterText: {
      fontSize: responsive.wp(10),
      fontWeight: 'bold',
      color: '#fff',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: responsive.wp(0.2), height: responsive.hp(0.1) },
      textShadowRadius: responsive.wp(0.5),
    },
    letterIcon: {
      position: 'absolute',
      bottom: responsive.hp(0.5),
      right: responsive.wp(1.5),
    },
  });

export default LetterSelectionScreen;

