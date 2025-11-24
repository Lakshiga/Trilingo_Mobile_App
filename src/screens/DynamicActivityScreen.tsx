import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

type DynamicActivityRouteParams = {
  activityTypeId?: number;
  jsonMethod?: string;
  activityTitle?: string;
};

const DynamicActivityScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: DynamicActivityRouteParams }, 'params'>>();
  const { theme } = useTheme();
  const { activityTypeId, jsonMethod, activityTitle } = route.params || {};

  // Handle different activity types based on JSON method
  const renderActivityContent = () => {
    if (!jsonMethod) {
      return (
        <View style={styles.emptyState}>
          <MaterialIcons name="help-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            Unknown Activity Type
          </Text>
          <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
            No activity type information available.
          </Text>
        </View>
      );
    }

    // Parse the JSON method to determine what type of activity to render
    try {
      // This is where you would implement different activity type renderers
      // based on the jsonMethod value from the backend
      switch (jsonMethod.toLowerCase()) {
        case 'mcq':
          return renderMCQActivity();
        case 'flashcard':
          return renderFlashcardActivity();
        case 'matching':
          return renderMatchingActivity();
        case 'memory':
          return renderMemoryActivity();
        default:
          return renderGenericActivity();
      }
    } catch (error) {
      console.error('Error parsing JSON method:', error);
      return renderGenericActivity();
    }
  };

  const renderMCQActivity = () => (
    <View style={styles.activityContainer}>
      <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>
        Multiple Choice Quiz
      </Text>
      <Text style={[styles.activityDescription, { color: theme.textSecondary }]}>
        This is a Multiple Choice Quiz activity. In the full implementation, 
        this would load questions from the backend and allow users to select answers.
      </Text>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderText}>Question 1: What is 2 + 2?</Text>
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton}>
            <Text style={styles.optionText}>A) 3</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.optionButton, styles.selectedOption]}>
            <Text style={styles.optionText}>B) 4</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton}>
            <Text style={styles.optionText}>C) 5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton}>
            <Text style={styles.optionText}>D) 6</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderFlashcardActivity = () => (
    <View style={styles.activityContainer}>
      <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>
        Flashcard Activity
      </Text>
      <Text style={[styles.activityDescription, { color: theme.textSecondary }]}>
        This is a Flashcard activity. In the full implementation, 
        this would show vocabulary words with images and audio.
      </Text>
      <View style={styles.flashcardContainer}>
        <View style={styles.flashcard}>
          <Text style={styles.flashcardText}>Hello</Text>
          <Text style={styles.flashcardTranslation}>வணக்கம்</Text>
        </View>
        <TouchableOpacity style={styles.flipButton}>
          <Text style={styles.flipButtonText}>Flip Card</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMatchingActivity = () => (
    <View style={styles.activityContainer}>
      <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>
        Matching Game
      </Text>
      <Text style={[styles.activityDescription, { color: theme.textSecondary }]}>
        This is a Matching activity. In the full implementation, 
        this would show pairs of items to match.
      </Text>
      <View style={styles.matchingContainer}>
        <View style={styles.matchingRow}>
          <View style={styles.matchItem}>
            <Text style={styles.matchText}>Apple</Text>
          </View>
          <View style={styles.matchConnector} />
          <View style={[styles.matchItem, styles.matchedItem]}>
            <Text style={styles.matchText}>ஆப்பிள்</Text>
          </View>
        </View>
        <View style={styles.matchingRow}>
          <View style={[styles.matchItem, styles.matchedItem]}>
            <Text style={styles.matchText}>Cat</Text>
          </View>
          <View style={styles.matchConnector} />
          <View style={styles.matchItem}>
            <Text style={styles.matchText}>பூனை</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderMemoryActivity = () => (
    <View style={styles.activityContainer}>
      <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>
        Memory Game
      </Text>
      <Text style={[styles.activityDescription, { color: theme.textSecondary }]}>
        This is a Memory Game activity. In the full implementation, 
        this would show cards that flip to reveal images.
      </Text>
      <View style={styles.memoryGrid}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <TouchableOpacity key={item} style={styles.memoryCard}>
            <Text style={styles.memoryCardText}>?</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderGenericActivity = () => (
    <View style={styles.activityContainer}>
      <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>
        {activityTitle || 'Activity'}
      </Text>
      <Text style={[styles.activityDescription, { color: theme.textSecondary }]}>
        Activity Type: {jsonMethod || 'Unknown'}
      </Text>
      <Text style={[styles.genericDescription, { color: theme.textSecondary }]}>
        This activity type is not yet implemented. In the full implementation, 
        this would render a custom activity based on the JSON method: {jsonMethod}
      </Text>
      <TouchableOpacity 
        style={styles.startButton}
        onPress={() => Alert.alert('Activity Started', 'This would start the activity in a full implementation.')}
      >
        <Text style={styles.startButtonText}>Start Activity</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background[0] }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerGradient[0] }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]} numberOfLines={1}>
            {activityTitle || 'Dynamic Activity'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={1}>
            Activity Type: {jsonMethod || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Activity Content */}
      <ScrollView style={styles.content}>
        {renderActivityContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 20,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  activityContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  activityDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  genericDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  placeholderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#F0F0F0',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  flashcardContainer: {
    alignItems: 'center',
  },
  flashcard: {
    backgroundColor: '#43BCCD',
    width: 200,
    height: 120,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  flashcardText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  flashcardTranslation: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  flipButton: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  flipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchingContainer: {
    gap: 20,
  },
  matchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchItem: {
    backgroundColor: '#F0F0F0',
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  matchedItem: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  matchText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#43BCCD',
    marginHorizontal: 10,
  },
  memoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 15,
  },
  memoryCard: {
    backgroundColor: '#43BCCD',
    width: 80,
    height: 80,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  memoryCardText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  startButton: {
    backgroundColor: '#43BCCD',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 30,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default DynamicActivityScreen;