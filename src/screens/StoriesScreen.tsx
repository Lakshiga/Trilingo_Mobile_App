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
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import apiService, { ActivityDto } from '../services/api';
import { getLearningLanguageField } from '../utils/languageUtils';
import { Language } from '../utils/translations';
import { CLOUDFRONT_URL } from '../config/apiConfig';
import {
  findActivityTypeIds,
  findMainActivityIds,
  LISTENING_MAIN_ACTIVITY_NAMES,
  STORY_PLAYER_ACTIVITY_TYPE_NAMES,
} from '../utils/activityMappings';

const { width } = Dimensions.get('window');

interface Story {
  id: number;
  title: string;
  emoji: string;
  duration: string;
  category: string;
  gradient: readonly [string, string, ...string[]];
  pages: number;
  difficulty: 'easy' | 'medium' | 'hard';
  activityId: number;
  storyData?: any;
}

const StoriesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { currentUser } = useUser();
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnimations = useRef<Animated.Value[]>([]).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        
        // Fetch all activities and activity types
        const [allActivities, activityTypes, mainActivities] = await Promise.all([
          apiService.getAllActivities(),
          apiService.getAllActivityTypes(),
          apiService.getAllMainActivities(),
        ]);

        const listeningMainActivityIds = findMainActivityIds(
          mainActivities,
          LISTENING_MAIN_ACTIVITY_NAMES
        );
        const storyPlayerTypeIds = findActivityTypeIds(
          activityTypes,
          STORY_PLAYER_ACTIVITY_TYPE_NAMES
        );

        if (storyPlayerTypeIds.size === 0) {
          console.warn('Story Player activity type not found');
          setStories([]);
          return;
        }

        // Filter activities with Story Player activity type under Listening
        const storyActivities = allActivities.filter(
          (activity) =>
            storyPlayerTypeIds.has(activity.activityTypeId) &&
            (listeningMainActivityIds.size === 0 ||
              listeningMainActivityIds.has(activity.mainActivityId))
        );
        
        // Map activities to stories
        const mappedStories: Story[] = storyActivities.map((activity, index) => {
          let storyData: any = {};
          
          // Parse Details_JSON
          if (activity.details_JSON) {
            try {
              storyData = JSON.parse(activity.details_JSON);
            } catch (e) {
              console.error('Error parsing story JSON:', e);
            }
          }
          
          // Get title in learning language
          const title = getLearningLanguageField(learningLanguage, activity) || activity.name_en || 'Story';
          
          // Get category from story data or default
          const category = storyData.category || storyData.type || 'Story';
          
          // Get pages count
          const pages = storyData.pages || storyData.pageCount || 10;
          
          // Gradients
          const gradients: readonly [string, string, ...string[]][] = [
            ['#FFA17F', '#FF6B6B'] as const,
            ['#667EEA', '#764BA2'] as const,
            ['#38B2AC', '#2B6CB0'] as const,
            ['#48BB78', '#38A169'] as const,
            ['#ED64A6', '#9F7AEA'] as const,
            ['#F6AD55', '#DD6B20'] as const,
          ];
          
          return {
            id: activity.id,
            activityId: activity.id,
            title,
            emoji: '📖',
            duration: '5 min',
            category,
            gradient: gradients[index % gradients.length],
            pages,
            difficulty: 'easy' as const,
            storyData,
          };
        });
        
        setStories(mappedStories);
        cardAnimations.length = mappedStories.length;
        for (let i = 0; i < mappedStories.length; i++) {
          if (!cardAnimations[i]) {
            cardAnimations[i] = new Animated.Value(0);
          }
        }
      } catch (error: any) {
        console.error('Error fetching stories:', error);
        Alert.alert('Error', 'Failed to load stories. Please try again.');
        setStories([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStories();
  }, [learningLanguage]);

  useEffect(() => {
    if (stories.length === 0) return;
    
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
    const animations = cardAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 120,
        useNativeDriver: true,
      })
    );

    if (animations.length > 0) {
      Animated.stagger(120, animations).start();
    }

    // Continuous floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [stories]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#48BB78';
      case 'medium':
        return '#ED8936';
      case 'hard':
        return '#F56565';
      default:
        return '#A0AEC0';
    }
  };

  const StoryCard = ({ story, index }: { story: Story; index: number }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const handlePressOut = () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Handler for when the story card is pressed
    const handleStoryPress = () => {
      // Navigate to the DynamicActivityScreen with the story's activity data
      (navigation as any).navigate('DynamicActivity', {
        activityTypeId: story.activityId,
        activityTitle: 'Stories', // This will show "Stories" as the title
        storyData: story.storyData,
      });
    };

    const cardStyle = {
      opacity: cardAnimations[index],
      transform: [
        { scale: scaleAnim },
        {
          translateX: cardAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          }),
        },
        {
          rotate: rotateAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '2deg'],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[styles.cardContainer, cardStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleStoryPress} // Add onPress handler
        >
          <LinearGradient
            colors={story.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.storyCard}
          >
            {/* Book spine effect */}
            <View style={styles.bookSpine} />

            {/* Category badge */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{story.category}</Text>
            </View>

            {/* Main content */}
            <View style={styles.cardContent}>
              <Text style={styles.storyEmoji}>{story.emoji}</Text>
              <Text style={styles.storyTitle} numberOfLines={2}>
                {story.title}
              </Text>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="access-time" size={16} color="#fff" />
                  <Text style={styles.infoText}>{story.duration}</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="menu-book" size={16} color="#fff" />
                  <Text style={styles.infoText}>{story.pages} pages</Text>
                </View>
              </View>

              {/* Difficulty indicator */}
              <View style={styles.difficultyContainer}>
                <View
                  style={[
                    styles.difficultyDot,
                    { backgroundColor: getDifficultyColor(story.difficulty) },
                  ]}
                />
                <Text style={styles.difficultyText}>
                  {story.difficulty.charAt(0).toUpperCase() + story.difficulty.slice(1)}
                </Text>
              </View>
            </View>

            {/* Read button */}
            <View style={styles.readButton}>
              <MaterialIcons name="play-arrow" size={20} color="#fff" />
              <Text style={styles.readText}>Read</Text>
            </View>

            {/* Decorative corner */}
            <View style={styles.cornerDecor} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const floatingTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#111827', '#0F172A'] : ['#FFF5E6', '#FFE4E1', '#E6F3FF']}
        style={styles.gradient}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
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
                transform: [
                  { translateY: slideAnim },
                  { translateY: floatingTranslate },
                ],
              },
            ]}
          >
            <Text style={styles.headerEmoji}>📚</Text>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Story Time!</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Pick a story to read</Text>
          </Animated.View>

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <LottieView
                source={require('../../assets/animations/Loading animation.json')}
                autoPlay
                loop
                style={styles.loadingAnimation}
              />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading stories...
              </Text>
            </View>
          )}

          {/* Stories List */}
          {!loading && (
            <View style={styles.storiesContainer}>
              {stories.length > 0 ? (
                stories.map((story, index) => (
                  <StoryCard key={story.id} story={story} index={index} />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No stories available yet.
                  </Text>
                  <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                    Check back later!
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
    top: 45,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  headerEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#5D6D7E',
    textAlign: 'center',
  },
  storiesContainer: {
    paddingHorizontal: 20,
  },
  cardContainer: {
    marginBottom: 20,
  },
  storyCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  bookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  categoryBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardContent: {
    marginLeft: 10,
  },
  storyEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  storyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  infoText: {
    color: '#fff',
    fontSize: 13,
    marginLeft: 5,
    fontWeight: '500',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  readButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  readText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cornerDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: 40,
    borderRightWidth: 40,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderRightColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingAnimation: {
    width: 200,
    height: 200,
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
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default StoriesScreen;