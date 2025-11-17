import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

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
}

const stories: Story[] = [
  {
    id: 1,
    title: 'The Lion and the Mouse',
    emoji: '🦁',
    duration: '5 min',
    category: 'Fables',
    gradient: ['#FFA17F', '#FF6B6B'] as const,
    pages: 8,
    difficulty: 'easy',
  },
  {
    id: 2,
    title: 'Space Adventure',
    emoji: '🚀',
    duration: '7 min',
    category: 'Science',
    gradient: ['#667EEA', '#764BA2'] as const,
    pages: 12,
    difficulty: 'medium',
  },
  {
    id: 3,
    title: 'Under the Sea',
    emoji: '🐠',
    duration: '6 min',
    category: 'Nature',
    gradient: ['#38B2AC', '#2B6CB0'] as const,
    pages: 10,
    difficulty: 'easy',
  },
  {
    id: 4,
    title: 'Magic Forest',
    emoji: '🌳',
    duration: '8 min',
    category: 'Fantasy',
    gradient: ['#48BB78', '#38A169'] as const,
    pages: 15,
    difficulty: 'medium',
  },
  {
    id: 5,
    title: 'Princess and the Dragon',
    emoji: '🐉',
    duration: '10 min',
    category: 'Adventure',
    gradient: ['#ED64A6', '#9F7AEA'] as const,
    pages: 18,
    difficulty: 'hard',
  },
  {
    id: 6,
    title: 'The Brave Little Ant',
    emoji: '🐜',
    duration: '5 min',
    category: 'Values',
    gradient: ['#F6AD55', '#DD6B20'] as const,
    pages: 7,
    difficulty: 'easy',
  },
];

const StoriesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnimations = useRef(
    stories.map(() => new Animated.Value(0))
  ).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    Animated.stagger(120, animations).start();

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
  }, []);

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

          {/* Stories List */}
          <View style={styles.storiesContainer}>
            {stories.map((story, index) => (
              <StoryCard key={story.id} story={story} index={index} />
            ))}
          </View>
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
});

export default StoriesScreen;