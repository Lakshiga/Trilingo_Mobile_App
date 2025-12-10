import React, { useState, useEffect, Fragment } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { Language } from '../utils/translations';
import { renderActivityByTypeId, isActivityTypeSupported } from '../components/activity-types';
import apiService from '../services/api';

type PlayScreenRouteParams = {
  activityId: number;
  activityTypeId: number;
  activityTitle: string;
  jsonMethod?: string;
};

const PlayScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: PlayScreenRouteParams }, 'params'>>();
  const { currentUser } = useUser();
  
  const params = route.params || {};
  const activityId = params.activityId;
  const activityTypeId = params.activityTypeId;
  const activityTitle = params.activityTitle;
  
  const [exerciseCount, setExerciseCount] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  const currentLang: string = learningLanguage === 'English' ? 'en' : learningLanguage === 'Tamil' ? 'ta' : 'si';

  // Safe title handling - ensure it's always a string
  const displayTitle: string = (activityTitle && typeof activityTitle === 'string' && activityTitle.trim()) 
    ? activityTitle.trim() 
    : 'Activity';

  // Fetch exercise count
  useEffect(() => {
    const fetchExerciseCount = async () => {
      if (!activityId) {
        setLoadingExercises(false);
        return;
      }

      try {
        setLoadingExercises(true);
        const exercises = await apiService.getExercisesByActivityId(activityId);
        if (exercises && exercises.length > 0) {
          setExerciseCount(exercises.length);
        } else {
          setExerciseCount(0);
        }
      } catch (error) {
        console.error('Error fetching exercises:', error);
        setExerciseCount(0);
      } finally {
        setLoadingExercises(false);
      }
    };

    fetchExerciseCount();
  }, [activityId]);

  if (!activityId || !activityTypeId) {
    navigation.goBack();
    return null;
  }

  const handleNextExercise = () => {
    if (currentExerciseIndex < exerciseCount - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setExerciseCompleted(false);
    }
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setExerciseCompleted(false);
    }
  };

  const handleExerciseComplete = () => {
    setExerciseCompleted(true);
  };

  // Check if activity type is supported
  if (!isActivityTypeSupported(activityTypeId)) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#1976D2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayTitle}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>This activity type is not supported</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar with Activity Name */}
      <View style={styles.headerBar}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayTitle}
          </Text>
          {exerciseCount > 1 && (
            <Text style={styles.exerciseCounter}>
              {currentExerciseIndex + 1} / {exerciseCount}
            </Text>
          )}
        </View>
        <View style={{ width: 40 }} /> {/* Spacer for balance */}
      </View>

      {/* Activity Component */}
      <View style={styles.contentContainer}>
        {(() => {
          try {
            if (!activityTypeId || !activityId) {
              return (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Missing required parameters</Text>
                </View>
              );
            }

            const activityComponent = renderActivityByTypeId(activityTypeId, {
              content: null, // Components will fetch their own data using activityId
              currentLang: currentLang as any,
              onComplete: () => {
                // When all exercises are done, go back
                if (currentExerciseIndex === exerciseCount - 1) {
                  navigation.goBack();
                } else {
                  handleExerciseComplete();
                }
              },
              activityId: activityId,
              currentExerciseIndex: currentExerciseIndex,
              onExerciseComplete: () => {
                // Move to next exercise automatically
                if (currentExerciseIndex < exerciseCount - 1) {
                  setCurrentExerciseIndex(prev => prev + 1);
                  setExerciseCompleted(false);
                } else {
                  // Last exercise, go back
                  navigation.goBack();
                }
              },
              onExit: () => {
                // Always exit/go back when Exit button is clicked
                navigation.goBack();
              },
            });

            if (!activityComponent) {
              return (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Unable to load activity component</Text>
                </View>
              );
            }

            // IIFE Result Check: Handle different return types safely
            // Handle null/undefined first
            if (activityComponent == null) {
              return (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Activity component is null or undefined</Text>
                </View>
              );
            }

            // If activityComponent is a string, wrap it in Text
            if (typeof activityComponent === 'string') {
              return <Text>{activityComponent}</Text>;
            }

            // If it's a number or boolean, convert to string and wrap in Text
            if (typeof activityComponent === 'number' || typeof activityComponent === 'boolean') {
              return <Text>{String(activityComponent)}</Text>;
            }

            // Handle arrays (React fragments or arrays of elements)
            if (Array.isArray(activityComponent)) {
              // Check if array contains any strings
              const hasStrings = activityComponent.some(item => typeof item === 'string');
              if (hasStrings) {
                console.warn('Activity component array contains strings, wrapping in Text:', activityComponent);
                return (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Invalid activity component: array contains strings</Text>
                  </View>
                );
              }
              // If it's an array of valid React elements, wrap in Fragment
              return <Fragment>{activityComponent}</Fragment>;
            }

            // Ensure it's a valid React element before rendering
            if (React.isValidElement(activityComponent)) {
              return activityComponent;
            }

            // Fallback for invalid component (objects, functions, etc.)
            console.warn('Invalid activity component type:', typeof activityComponent, activityComponent);
            return (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Invalid activity component format</Text>
              </View>
            );
          } catch (error) {
            console.error('Error rendering activity:', error);
            return (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error loading activity</Text>
              </View>
            );
          }
        })()}
      </View>

      {/* Bottom Navigation Bar */}
      {exerciseCount > 1 && (
        <View style={styles.bottomNavBar}>
          <TouchableOpacity
            style={[
              styles.bottomNavButton,
              currentExerciseIndex === 0 && styles.bottomNavButtonDisabled
            ]}
            onPress={handlePrevExercise}
            disabled={currentExerciseIndex === 0 || loadingExercises}
          >
            <MaterialIcons name="arrow-back" size={24} color={currentExerciseIndex === 0 ? '#999' : '#000000'} />
            <Text style={[
              styles.bottomNavButtonText,
              currentExerciseIndex === 0 && styles.bottomNavButtonTextDisabled
            ]}>Previous</Text>
          </TouchableOpacity>

          <View style={styles.bottomNavCenter}>
            <Text style={styles.bottomNavCounter}>
              {currentExerciseIndex + 1} / {exerciseCount}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.bottomNavButton,
              styles.bottomNavButtonNext,
              (currentExerciseIndex >= exerciseCount - 1) && styles.bottomNavButtonDisabled
            ]}
            onPress={handleNextExercise}
            disabled={currentExerciseIndex >= exerciseCount - 1 || loadingExercises}
          >
            <Text style={[
              styles.bottomNavButtonText,
              (currentExerciseIndex >= exerciseCount - 1) && styles.bottomNavButtonTextDisabled
            ]}>Next</Text>
            <MaterialIcons name="arrow-forward" size={24} color={(currentExerciseIndex >= exerciseCount - 1) ? '#999' : '#000000'} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1976D2',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  exerciseCounter: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 2,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 90, // Add padding to prevent content from being hidden behind buttons
  },
  bottomNavBar: {
    position: 'absolute',
    bottom: 20, // Position higher from bottom
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1976D2',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 10, // Add margin on sides
    borderRadius: 15, // Rounded corners
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    minWidth: 120,
  },
  bottomNavButtonNext: {
    backgroundColor: '#FFFFFF',
  },
  bottomNavButtonDisabled: {
    opacity: 0.4,
    backgroundColor: '#FFFFFF',
  },
  bottomNavButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNavButtonTextDisabled: {
    color: '#999',
  },
  bottomNavCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavCounter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
});

export default PlayScreen;

