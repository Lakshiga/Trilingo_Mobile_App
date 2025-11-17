import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

function LessonScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const lessons = [
    {
      id: 1,
      title: 'Basic Greetings',
      description: 'Learn essential greetings and introductions',
      level: 'Beginner',
      color: ['#FF9A8B', '#FF6B9D'] as const,
      emoji: '👋',
      icon: 'waving-hand',
      progress: 0,
    },
    {
      id: 2,
      title: 'Numbers & Counting',
      description: 'Master numbers from 1 to 100',
      level: 'Beginner',
      color: ['#43BCCD', '#5DD3A1'] as const,
      emoji: '🔢',
      icon: 'calculate',
      progress: 0,
    },
    {
      id: 3,
      title: 'Family Vocabulary',
      description: 'Words for family members and relationships',
      level: 'Beginner',
      color: ['#6A8EFF', '#8A6BFF'] as const,
      emoji: '👨‍👩‍👧‍👦',
      icon: 'people',
      progress: 0,
    },
    {
      id: 4,
      title: 'Food & Dining',
      description: 'Restaurant vocabulary and ordering food',
      level: 'Intermediate',
      color: ['#FFB366', '#FF8C42'] as const,
      emoji: '🍽️',
      icon: 'restaurant',
      progress: 0,
    },
    {
      id: 5,
      title: 'Travel Essentials',
      description: 'Airport, hotel, and transportation phrases',
      level: 'Intermediate',
      color: ['#FF6B6B', '#FF4757'] as const,
      emoji: '✈️',
      icon: 'flight',
      progress: 0,
    },
    {
      id: 6,
      title: 'Fun Activities',
      description: 'Games, sports, and hobby vocabulary',
      level: 'Advanced',
      color: ['#A77BCA', '#BA91DA'] as const,
      emoji: '🎮',
      icon: 'sports-esports',
      progress: 0,
    },
  ];

  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'Beginner':
        return { color: '#4CAF50', emoji: '⭐', bg: 'rgba(76, 175, 80, 0.2)' };
      case 'Intermediate':
        return { color: '#FF9800', emoji: '⭐⭐', bg: 'rgba(255, 152, 0, 0.2)' };
      case 'Advanced':
        return { color: '#F44336', emoji: '⭐⭐⭐', bg: 'rgba(244, 67, 54, 0.2)' };
      default:
        return { color: '#9E9E9E', emoji: '⭐', bg: 'rgba(158, 158, 158, 0.2)' };
    }
  };

  return (
    <LinearGradient colors={theme.lessonsBackground} style={styles.container}>
      {/* Decorative elements */}
      <View style={[styles.decorativeCircle1, { backgroundColor: theme.decorativeCircle1 }]} />
      <View style={[styles.decorativeCircle2, { backgroundColor: theme.decorativeCircle2 }]} />
      <View style={[styles.decorativeCircle3, { backgroundColor: theme.decorativeCircle3 }]} />

      {/* Header */}
      <LinearGradient colors={theme.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerEmoji}>📚</Text>
            <Text style={styles.headerTitle}>Language Lessons</Text>
            <Text style={styles.headerEmoji}>🎓</Text>
          </View>
          <Text style={styles.headerSubtitle}>Master new skills step by step</Text>
        </View>
      </LinearGradient>

      {/* Lessons List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {lessons.map((lesson) => {
          const levelInfo = getLevelInfo(lesson.level);
          return (
            <TouchableOpacity key={lesson.id} activeOpacity={0.8} style={styles.lessonCard}>
              <LinearGradient
                colors={lesson.color}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.lessonGradient}
              >
                {/* Emoji Icon */}
                <View style={styles.emojiCircle}>
                  <Text style={styles.lessonEmoji}>{lesson.emoji}</Text>
                </View>

                {/* Content */}
                <View style={styles.lessonContent}>
                  <View style={styles.textContainer}>
                    <Text style={styles.lessonTitle} numberOfLines={1}>
                      {lesson.title}
                    </Text>
                    <Text style={styles.lessonDescription} numberOfLines={2}>
                      {lesson.description}
                    </Text>
                    
                    {/* Level Badge */}
                    <View style={[styles.levelBadge, { backgroundColor: levelInfo.bg }]}>
                      <Text style={styles.levelEmoji}>{levelInfo.emoji}</Text>
                      <Text style={[styles.levelText, { color: levelInfo.color }]}>
                        {lesson.level}
                      </Text>
                    </View>
                  </View>

                  {/* Arrow Icon */}
                  <View style={styles.arrowContainer}>
                    <MaterialIcons name="chevron-right" size={32} color="#fff" />
                  </View>
                </View>

                {/* Decorative sparkles */}
                <View style={styles.sparkle1}>
                  <Text style={styles.sparkleText}>✨</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
    top: 150,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: 200,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
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
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 15,
  },
  lessonCard: {
    marginBottom: 18,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  lessonGradient: {
    padding: 20,
    position: 'relative',
  },
  emojiCircle: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  lessonEmoji: {
    fontSize: 40,
  },
  lessonContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  lessonDescription: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.95,
    marginBottom: 12,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  levelEmoji: {
    fontSize: 14,
    marginRight: 5,
  },
  levelText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  arrowContainer: {
    marginLeft: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 6,
  },
  sparkle1: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  sparkleText: {
    fontSize: 22,
  },
  bottomSpacing: {
    height: 30,
  },
});

export default LessonScreen;
