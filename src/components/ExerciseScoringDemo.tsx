import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useExerciseScoring } from '../hooks/useExerciseScoring';

const ExerciseScoringDemo: React.FC = () => {
  const { submitExerciseAttempt, isSubmitting, submissionError } = useExerciseScoring();
  const [attemptCount, setAttemptCount] = useState(1);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleExerciseAttempt = async () => {
    try {
      // Simulate an exercise attempt with a random score between 1-10
      const randomScore = Math.floor(Math.random() * 10) + 1;
      const timeSpent = Math.floor(Math.random() * 120) + 30; // 30-150 seconds
      
      const result = await submitExerciseAttempt({
        exerciseId: 1, // Demo exercise ID
        score: randomScore,
        timeSpentSeconds: timeSpent,
        attemptNumber: attemptCount,
        attemptDetails: `Completed with ${randomScore}/10 points in ${timeSpent} seconds`
      });
      
      if (result) {
        setLastResult(result);
        setAttemptCount(prev => prev + 1);
        
        // Show appropriate feedback based on whether it was the first attempt
        if (result.isFirstAttempt) {
          Alert.alert(
            'Success!',
            `You earned ${result.pointsEarned} XP points on your first attempt!\nTotal XP: ${result.totalXpPoints}`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Attempt Recorded',
            'This was not your first attempt. Your score from the first attempt remains final.\nNo additional XP awarded.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error submitting exercise attempt:', error);
      Alert.alert('Error', 'Failed to submit exercise attempt. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercise Scoring Demo</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Exercise ID: 1</Text>
        <Text style={styles.infoText}>Attempt #: {attemptCount}</Text>
      </View>
      
      {lastResult && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Last Submission Result:</Text>
          <Text style={styles.resultText}>Points Earned: {lastResult.pointsEarned}</Text>
          <Text style={styles.resultText}>Is First Attempt: {lastResult.isFirstAttempt ? 'Yes' : 'No'}</Text>
          <Text style={styles.resultText}>Total XP Points: {lastResult.totalXpPoints}</Text>
        </View>
      )}
      
      {submissionError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{submissionError}</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.button, isSubmitting && styles.disabledButton]} 
        onPress={handleExerciseAttempt}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Submitting...' : 'Submit Exercise Attempt'}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.rulesBox}>
        <Text style={styles.rulesTitle}>Scoring Rules:</Text>
        <Text style={styles.ruleText}>• First attempt: Earn XP points based on score (max 10 points)</Text>
        <Text style={styles.ruleText}>• Subsequent attempts: No additional XP, first score remains final</Text>
        <Text style={styles.ruleText}>• Each exercise has a unique ID and max score of 10</Text>
        <Text style={styles.ruleText}>• Progress is tracked across all exercises</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  resultBox: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#c62828',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#bbdefb',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rulesBox: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  ruleText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
});

export default ExerciseScoringDemo;