import React, { useState, useEffect, Fragment, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, StatusBar, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { Language } from '../utils/translations';
import { renderActivityByTypeId, isActivityTypeSupported } from '../components/activity-types';
import apiService, { ExerciseDto, ActivityDto } from '../services/api';
import { useBackgroundAudio } from '../context/BackgroundAudioContext';
import { loadStudentLanguagePreference, languageCodeToKey } from '../utils/studentLanguage';
import { useExerciseScoring } from '../hooks/useExerciseScoring';

const { width } = Dimensions.get('window');

type PlayScreenRouteParams = {
  activityId: number;
  activityTypeId: number;
  activityTitle: string;
  jsonMethod?: string;
};

// --- THEME COLORS - Matching Home Page Blue Theme ---
const THEME = {
  bg: '#E0F2FE',        // Light blue bg (matching home page)
  primary: '#0284C7',   // Blue (Header - matching home page)
  bottomBar: '#FFFFFF', // White Bottom Bar
  accent: '#0EA5E9',    // Light Blue
  text: '#0369A1',      // Dark Blue Text (matching home page)
  disabled: '#E0E0E0',  // Gray
};

const PlayScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, PlayScreenRouteParams>, string>>();
  const { currentUser } = useUser();
  const { resumeBackground } = useBackgroundAudio();
  
  // Extract route params
  const { activityId, activityTypeId, activityTitle } = route.params || {};
  
  // State
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentLang, setCurrentLang] = useState('en');
  const [activityDetails, setActivityDetails] = useState<ActivityDto | null>(null);
  const [conversationContent, setConversationContent] = useState<any>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [loadingActivityDetails, setLoadingActivityDetails] = useState(false);
  
  // Exercise scoring hook
  const { submitExerciseAttempt, isSubmitting } = useExerciseScoring();
  
  // Timer state for tracking time spent
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Attempt tracking
  const [attemptCount, setAttemptCount] = useState(1);

  // --- LANGUAGE SETUP ---
  useEffect(() => {
    const loadLanguage = async () => {
      const pref = await loadStudentLanguagePreference();
      const langKey = languageCodeToKey(pref.targetLanguageCode);
      setCurrentLang(langKey);
    };
    loadLanguage();
  }, []);

  // --- DATA LOADING ---
  useEffect(() => {
    const loadData = async () => {
      if (!activityId || !activityTypeId) return;
      
      try {
        setLoadingExercises(true);
        
        // Load exercises
        const exerciseData = await apiService.getExercisesByActivityId(activityId);
        const sortedExercises = exerciseData.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        setExercises(sortedExercises);
        
        // Load activity details
        setLoadingActivityDetails(true);
        const activityData = await apiService.getActivityById(activityId);
        setActivityDetails(activityData);
        setLoadingActivityDetails(false);
        
        // Special handling for conversation activities
        if (activityTypeId === 14) {
          setLoadingConversation(true);
          // Conversation content loading logic would go here
          setLoadingConversation(false);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load activity. Please try again.');
      } finally {
        setLoadingExercises(false);
      }
    };

    loadData();
    
    // Start timer for tracking time spent
    timerRef.current = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activityId, activityTypeId]);

  // --- NAVIGATION HANDLERS ---
  const handleNextExercise = async () => {
    // Submit score for current exercise before moving to next
    if (exercises[currentExerciseIndex] && exercises[currentExerciseIndex].id) {
      try {
        // Calculate a simple score based on time spent (faster = higher score)
        // In a real implementation, this would be based on actual performance
        const baseScore = 10;
        const timePenalty = Math.floor(timeSpent / 30); // 1 point penalty for every 30 seconds
        const finalScore = Math.max(0, Math.min(10, baseScore - timePenalty));
        
        const result = await submitExerciseAttempt({
          exerciseId: exercises[currentExerciseIndex].id,
          score: finalScore,
          timeSpentSeconds: timeSpent,
          attemptNumber: attemptCount,
          attemptDetails: `Completed in ${timeSpent} seconds with ${finalScore} points`
        });
        
        if (result) {
          console.log(`Exercise scored: ${finalScore} points, Points earned: ${result.pointsEarned}, Is first attempt: ${result.isFirstAttempt}`);
          // Show feedback to user about their score
          if (result.isFirstAttempt) {
            console.log(`Congratulations! You earned ${result.pointsEarned} XP points!`);
          } else {
            console.log('This was not your first attempt. Your score from the first attempt remains final.');
          }
          
          // Reset timer for next exercise
          setTimeSpent(0);
          // Increment attempt count for demo purposes
          setAttemptCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error submitting score:', error);
        // Continue even if scoring fails
      }
    }
    
    // Move to next exercise or finish
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      // All exercises completed
      try {
        await submitProgress();
        Alert.alert('Congratulations!', 'You have completed all exercises!');
        navigation.goBack();
      } catch (error) {
        console.error('Error submitting progress:', error);
        navigation.goBack();
      }
    }
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  // --- Progress submit logic ---
  const submitProgress = async () => {
    try {
      if (!activityId) return;

      // Prefer cached student profile id (child), fallback to currentUser.id
      let studentId: string | undefined = undefined;
      try {
        const raw = await AsyncStorage.getItem('@trilingo_student_profile');
        if (raw) {
          const parsed = JSON.parse(raw);
          studentId = parsed?.id || parsed?.studentId;
        }
      } catch {
        // ignore cache errors
      }
      if (!studentId && currentUser?.id) {
        studentId = currentUser.id;
      }
      if (!studentId) {
        Alert.alert('Oops', 'Student profile missing. Please re-login.');
        return;
      }

      await apiService.postStudentProgress({
        studentId,
        activityId,
        score: 10, // 10 stars
        maxScore: 10,
        timeSpentSeconds: timeSpent,
        attemptNumber: attemptCount,
        isCompleted: true,
      });
      // Optional: you could toast success here
    } catch (error: any) {
      const msg = error?.response?.data?.message || `${error}`;
      if (typeof msg === 'string' && msg.toLowerCase().includes('already recorded')) {
        return; // first attempt only enforced by backend; ignore duplicate
      }
      Alert.alert('Saved with a hiccup', 'First attempt already locked or network issue.');
    }
  };

  if (!isActivityTypeSupported(activityTypeId)) {
    return (
      <View style={styles.container}>
        <SafeAreaView />
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <Text style={{color: '#999'}}>Activity not supported</Text>
        </View>
      </View>
    );
  }

  // Get current exercise
  const currentExercise = exercises[currentExerciseIndex];
  const exerciseCount = exercises.length;
  
  // Display title
  const displayTitle = activityTitle || activityDetails?.name_en || 'Activity';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />
      
      {/* --- TOP BAR (Title & Back) --- */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={26} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text 
            style={styles.headerTitle} 
            numberOfLines={1} 
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            {displayTitle}
          </Text>
        </View>

        {/* Dummy View for center alignment balance */}
        <View style={{ width: 40 }} />
      </View>

      {/* --- CENTER CONTENT (Maximized) --- */}
      <View style={styles.centerContent}>
        {(() => {
          try {
            const parsedContent = currentExercise?.jsonData ? safeJsonParse(currentExercise.jsonData) : null;

            // Conversation player path: use details_JSON content
            const isConversation = Number(activityTypeId) === 14;

            let contentForRender = isConversation
              ? conversationContent || parsedContent || (activityDetails?.details_JSON ? safeJsonParse(activityDetails.details_JSON) : null)
              : parsedContent;

            // If conversation content came as an array, pick the first item
            if (isConversation && Array.isArray(contentForRender)) {
              contentForRender = contentForRender[0] || null;
            }

            // If still missing for conversation, try parsing current exercise again (fallback)
            if (isConversation && !contentForRender && currentExercise?.jsonData) {
              contentForRender = safeJsonParse(currentExercise.jsonData);
            }
            // Safety: if still missing, attempt to parse conversationContent directly or use parsedContent
            if (isConversation && !contentForRender) {
              contentForRender = safeJsonParse(conversationContent || parsedContent || (activityDetails?.details_JSON ?? ''));
            }
            // If still a string (double-encoded), parse once more
            if (isConversation && typeof contentForRender === 'string') {
              contentForRender = safeJsonParse(contentForRender);
            }

            // Final safety: ensure we return a normalized conversation shape so the player renders
            if (isConversation) {
              const hasConvData = contentForRender?.conversationData;
              const looksLikeConv =
                contentForRender?.dialogues ||
                contentForRender?.speakers ||
                contentForRender?.audioUrl;

              if (!hasConvData && looksLikeConv) {
                contentForRender = {
                  title: contentForRender?.title || activityTitle || 'Conversation',
                  instruction: contentForRender?.instruction || '',
                  conversationData: {
                    title: contentForRender?.title || activityTitle || 'Conversation',
                    audioUrl: contentForRender?.audioUrl,
                    speakers: contentForRender?.speakers || [],
                    dialogues: contentForRender?.dialogues || [],
                  },
                };
              } else if (hasConvData) {
                contentForRender = {
                  title: contentForRender?.title || activityTitle || 'Conversation',
                  instruction: contentForRender?.instruction || '',
                  conversationData: contentForRender.conversationData,
                };
              } else if (!contentForRender) {
                // as a last resort, pass an empty skeleton to avoid null
                contentForRender = {
                  title: activityTitle || 'Conversation',
                  instruction: '',
                  conversationData: { title: activityTitle || 'Conversation', audioUrl: {}, speakers: [], dialogues: [] },
                };
              }
            }

            if (isConversation) {
              const hasConversationData = !!contentForRender?.conversationData;
              const looksLikeConversation =
                !!contentForRender?.dialogues ||
                !!contentForRender?.speakers ||
                !!contentForRender?.audioUrl;

              // Normalize to the shape ConversationPlayer expects
              if (!hasConversationData && looksLikeConversation) {
                contentForRender = {
                  title: contentForRender?.title ?? activityTitle ?? 'Conversation',
                  instruction: contentForRender?.instruction ?? '',
                  conversationData: contentForRender,
                };
              } else if (hasConversationData) {
                contentForRender = {
                  title: contentForRender?.title ?? activityTitle ?? 'Conversation',
                  instruction: contentForRender?.instruction ?? '',
                  conversationData: contentForRender.conversationData,
                };
              }
            }

            if (isConversation) {
              if (loadingExercises || loadingConversation || loadingActivityDetails) {
                return <ActivityIndicator size="large" color={THEME.primary} />;
              }
            } else {
              if (loadingExercises) {
                return <ActivityIndicator size="large" color={THEME.primary} />;
              }
              if (!currentExercise || !contentForRender) {
                return <Text style={{ padding: 16 }}>No exercise content available.</Text>;
              }
            }

            const activityComponent = renderActivityByTypeId(activityTypeId, {
              content: contentForRender,
              currentLang: currentLang as any,
              onComplete: handleNextExercise,
              activityId: activityId,
              currentExerciseIndex: currentExerciseIndex,
              onExerciseComplete: handleNextExercise,
              onExit: () => navigation.goBack(),
              exerciseId: currentExercise?.id, // Pass exercise ID for scoring
            });

            // Safety Checks
            if (activityComponent == null) return <ActivityIndicator size="large" color={THEME.primary} />;
            if (typeof activityComponent === 'string' || typeof activityComponent === 'number') {
              return <Text>{String(activityComponent)}</Text>;
            }
            
            return activityComponent;
          } catch (error) {
            return <Text>Error loading activity</Text>;
          }
        })()}
      </View>

      {/* --- BOTTOM BAR (Nav & Progress) --- */}
      {exerciseCount > 0 && (
        <View style={styles.bottomBar}>
          
          {/* Back Button */}
          <TouchableOpacity
            style={[styles.navButton]}
            onPress={handlePrevExercise}
            disabled={currentExerciseIndex === 0 || loadingExercises}
          >
            <Feather name="arrow-left" size={28} color={currentExerciseIndex === 0 ? '#BDC3C7' : '#555'} />
          </TouchableOpacity>

          {/* Progress Indicator (Center) */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {currentExerciseIndex + 1} / {exerciseCount}
            </Text>
            {/* Tiny visual bar below text */}
            <View style={styles.miniProgressBar}>
              <View 
                style={[
                  styles.miniProgressFill, 
                  { width: `${((currentExerciseIndex + 1) / exerciseCount) * 100}%` }
                ]} 
              />
            </View>
          </View>

          {/* Next/Finish Button */}
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNextExercise}
            disabled={loadingExercises || isSubmitting}
          >
            <Feather 
              name={currentExerciseIndex === exerciseCount - 1 ? "check" : "arrow-right"} 
              size={28} 
              color={(loadingExercises || isSubmitting) ? '#BDC3C7' : '#555'} 
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Safe JSON parse helper
const safeJsonParse = (data: string) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
    position: 'relative', 
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.primary,
    paddingHorizontal: 15,
    paddingTop: 50, 
    paddingBottom: 15,
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    position: 'relative',
  },
  
  // --- BOTTOM BAR ---
  bottomBar: {
    height: 100,
    backgroundColor: THEME.bottomBar,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  navButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: THEME.accent, // Light gray for back
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2
  },
  nextButton: {
    backgroundColor: THEME.primary, // Blue for next/finish
  },
  
  // Progress in Bottom Bar
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.primary,
    marginBottom: 4,
  },
  miniProgressBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: THEME.primary,
    borderRadius: 2,
  },
});

export default PlayScreen;