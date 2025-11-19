import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService, { ActivityDto } from '../services/api';
import { getTranslation, Language } from '../utils/translations';
import { getLearningLanguageField, getLanguageKey } from '../utils/languageUtils';

const { width, height } = Dimensions.get('window');

interface Activity {
  id: number;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  gradient: readonly [string, string, ...string[]];
  description: string;
}

// Default activities as fallback
const defaultActivities: Activity[] = [
  {
    id: 1,
    title: 'Puzzles',
    icon: 'extension',
    color: '#FF6B9D',
    gradient: ['#FF6B9D', '#C06C84'] as const,
    description: 'Solve fun puzzles',
  },
  {
    id: 2,
    title: 'Memory Game',
    icon: 'psychology',
    color: '#4ECDC4',
    gradient: ['#4ECDC4', '#44A08D'] as const,
    description: 'Match the cards',
  },
  {
    id: 3,
    title: 'Quiz Time',
    icon: 'quiz',
    color: '#FFD93D',
    gradient: ['#FFD93D', '#F9A826'] as const,
    description: 'Test your knowledge',
  },
  {
    id: 4,
    title: 'Drawing',
    icon: 'brush',
    color: '#A8E6CF',
    gradient: ['#A8E6CF', '#56C596'] as const,
    description: 'Create art',
  },
  {
    id: 5,
    title: 'Word Hunt',
    icon: 'search',
    color: '#B4A7D6',
    gradient: ['#B4A7D6', '#8E7CC3'] as const,
    description: 'Find hidden words',
  },
  {
    id: 6,
    title: 'Counting',
    icon: 'calculate',
    color: '#FFDAB9',
    gradient: ['#FFDAB9', '#FFC09F'] as const,
    description: 'Learn numbers',
  },
];

// Map backend ActivityDto to mobile Activity interface
const mapActivityDtoToActivity = (
  dto: ActivityDto,
  index: number,
  learningLanguage: Language
): Activity => {
  // Icon mapping based on activity type or name
  const iconMap: { [key: string]: keyof typeof MaterialIcons.glyphMap } = {
    'puzzle': 'extension',
    'memory': 'psychology',
    'quiz': 'quiz',
    'drawing': 'brush',
    'word': 'search',
    'counting': 'calculate',
    'default': 'extension',
  };

  // Get icon based on activity name (case-insensitive)
  const nameLower = dto.name_en.toLowerCase();
  let icon: keyof typeof MaterialIcons.glyphMap = 'extension';
  for (const [key, value] of Object.entries(iconMap)) {
    if (nameLower.includes(key)) {
      icon = value;
      break;
    }
  }

  // Color gradients array (cycling through)
  const gradients: readonly [string, string, ...string[]][] = [
    ['#FF6B9D', '#C06C84'] as const,
    ['#4ECDC4', '#44A08D'] as const,
    ['#FFD93D', '#F9A826'] as const,
    ['#A8E6CF', '#56C596'] as const,
    ['#B4A7D6', '#8E7CC3'] as const,
    ['#FFDAB9', '#FFC09F'] as const,
  ];

  // Get title in learning language
  const title = getLearningLanguageField(learningLanguage, dto);
  
  // Get description in learning language
  let description = 'Fun activity';
  try {
    if (dto.details_JSON) {
      const parsed = JSON.parse(dto.details_JSON);
      // Check if description is multilingual object
      if (parsed.description) {
        if (typeof parsed.description === 'object') {
          const langKey = getLanguageKey(learningLanguage);
          description = parsed.description[langKey] || 
                        parsed.description.en || 
                        'Fun activity';
        } else {
          description = parsed.description;
        }
      } else {
        description = 'Fun activity';
      }
    }
  } catch (e) {
    description = 'Fun activity';
  }

  return {
    id: dto.id,
    title: title || 'Activity',
    icon: icon,
    color: gradients[index % gradients.length][0],
    gradient: gradients[index % gradients.length],
    description: description,
  };
};

const ActivitiesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { currentUser } = useUser();
  const nativeLanguage: Language = (currentUser?.nativeLanguage as Language) || 'English';
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  
  const [activities, setActivities] = useState<Activity[]>(defaultActivities);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cardAnimations = useRef<Animated.Value[]>([]);

  // Fetch activities from backend
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const backendActivities = await apiService.getAllActivities();
        
        if (backendActivities && backendActivities.length > 0) {
          // Map backend activities to mobile format using learning language
          const mappedActivities = backendActivities.map((dto, index) => 
            mapActivityDtoToActivity(dto, index, learningLanguage)
          );
          setActivities(mappedActivities);
        } else {
          // Use default activities if backend returns empty
          setActivities(defaultActivities);
        }
      } catch (error: any) {
        console.error('Error fetching activities:', error);
        // Use default activities on error
        setActivities(defaultActivities);
        Alert.alert(
          'Connection Error',
          'Could not load activities from server. Showing default activities.',
          [{ text: 'OK' }]
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [learningLanguage]);

  // Update card animations when activities change
  useEffect(() => {
    cardAnimations.current = activities.map(() => new Animated.Value(0));
    
    // Header animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    if (cardAnimations.current.length > 0) {
      const animations = cardAnimations.current.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true,
        })
      );

      Animated.stagger(100, animations).start();
    }
  }, [activities]);

  const ActivityCard = ({ activity, index }: { activity: Activity; index: number }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
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

    const handlePress = () => {
      // Navigate to ExerciseScreen with activity details
      (navigation as any).navigate('Exercise', {
        activity: {
          id: activity.id,
          title: activity.title,
          description: activity.description,
        },
      });
    };

    // Ensure we have a valid animation value
    const animValue = cardAnimations.current[index] || new Animated.Value(1);
    
    const cardStyle = {
      opacity: animValue,
      transform: [
        { scale: scaleAnim },
        {
          translateY: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[styles.cardWrapper, cardStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
        >
          <LinearGradient
            colors={activity.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrapper}>
                <MaterialIcons name={activity.icon} size={36} color="#fff" />
              </View>
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {activity.title}
                </Text>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {activity.description || getTranslation(nativeLanguage, 'funActivityLabel')}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.cardTag}>
                <Text style={styles.cardTagText}>
                  {getTranslation(nativeLanguage, 'funActivityLabel')}
                </Text>
              </View>
              <View style={styles.cardAction}>
                <Text style={styles.cardActionText}>
                  {getTranslation(nativeLanguage, 'start')}
                </Text>
                <MaterialIcons name="arrow-forward" size={22} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#111827', '#0F172A'] : ['#E8F5E9', '#F1F8E9', '#FFF9C4']}
        style={styles.gradient}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.emoji}>🎯</Text>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {getTranslation(nativeLanguage, 'funActivities')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {getTranslation(nativeLanguage, 'chooseYourAdventure')}
            </Text>
          </Animated.View>

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.textPrimary || '#4ECDC4'} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                {getTranslation(nativeLanguage, 'loadingActivities')}
              </Text>
            </View>
          )}

          {/* Activity Cards Grid */}
          {!loading && (
            <View style={styles.cardsContainer}>
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <ActivityCard key={activity.id} activity={activity} index={index} />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    {getTranslation(nativeLanguage, 'noActivitiesAvailable')}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
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
  backButton: {
    position: 'absolute',
    top: Math.max(40, height * 0.05),
    left: Math.max(12, width * 0.04),
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: Math.max(8, width * 0.025),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Math.max(80, height * 0.1),
    paddingBottom: Math.max(20, height * 0.03),
    paddingHorizontal: Math.max(12, width * 0.03),
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  emoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: Math.max(24, width * 0.08),
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Math.max(14, width * 0.04),
    color: '#5D6D7E',
    textAlign: 'center',
  },
  cardsContainer: {
    width: '100%',
    paddingHorizontal: Math.max(12, width * 0.04),
  },
  cardWrapper: {
    width: '100%',
    marginBottom: Math.max(14, height * 0.015),
  },
  card: {
    borderRadius: Math.max(20, width * 0.045),
    paddingVertical: Math.max(18, height * 0.022),
    paddingHorizontal: Math.max(18, width * 0.045),
    minHeight: Math.max(130, height * 0.16),
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.max(12, height * 0.015),
  },
  cardIconWrapper: {
    width: Math.max(56, width * 0.13),
    height: Math.max(56, width * 0.13),
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.max(14, width * 0.035),
  },
  cardTextContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Math.max(18, width * 0.05),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: Math.max(13, width * 0.035),
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cardTagText: {
    color: '#fff',
    fontSize: Math.max(12, width * 0.032),
    fontWeight: '600',
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardActionText: {
    color: '#fff',
    fontSize: Math.max(13, width * 0.035),
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ActivitiesScreen;