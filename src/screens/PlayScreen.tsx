import React, { useState, useEffect, Fragment, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, StatusBar, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { Language } from '../utils/translations';
import { renderActivityByTypeId, isActivityTypeSupported } from '../components/activity-types';
import apiService, { ExerciseDto, ActivityDto } from '../services/api';
import { useBackgroundAudio } from '../context/BackgroundAudioContext';

const { width } = Dimensions.get('window');

type PlayScreenRouteParams = {
  activityId: number;
  activityTypeId: number;
  activityTitle: string;
  jsonMethod?: string;
};

// --- THEME COLORS ---
const THEME = {
  bg: '#F0F8FF',        // Very light Alice Blue
  primary: '#4FACFE',   // Sky Blue (Header)
  bottomBar: '#FFFFFF', // White Bottom Bar
  accent: '#FFB75E',    // Orange
  text: '#2C3E50',      // Dark Blue Text
  disabled: '#E0E0E0',  // Gray
};

const PlayScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: PlayScreenRouteParams }, 'params'>>();
  const { currentUser } = useUser();
  const { requestAudioFocus, resumeBackground } = useBackgroundAudio();
  const releaseRef = useRef<(() => void) | null>(null);
  
  const params = route.params || {};
  const activityId = params.activityId;
  const activityTypeId = params.activityTypeId;
  const activityTitle = params.activityTitle;
  
  const [exerciseCount, setExerciseCount] = useState(0);
  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [conversationContent, setConversationContent] = useState<any>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  const currentLang: string = learningLanguage === 'English' ? 'en' : learningLanguage === 'Tamil' ? 'ta' : 'si';

  const displayTitle: string = (activityTitle && typeof activityTitle === 'string' && activityTitle.trim()) 
    ? activityTitle.trim() 
    : 'Activity';

  useEffect(() => {
    releaseRef.current = requestAudioFocus();
    return () => {
      releaseRef.current?.();
      releaseRef.current = null;
      resumeBackground().catch(() => null);
    };
  }, [requestAudioFocus, resumeBackground]);

  useEffect(() => {
    const fetchExerciseCount = async () => {
      if (!activityId) {
        setLoadingExercises(false);
        return;
      }
      try {
        setLoadingExercises(true);
        const result = await apiService.getExercisesByActivityId(activityId);
        setExercises(result || []);
        setExerciseCount(result?.length || 0);
        setCurrentExerciseIndex(0);
      } catch (error) {
        setExerciseCount(0);
        setExercises([]);
      } finally {
        setLoadingExercises(false);
      }
    };
    fetchExerciseCount();
  }, [activityId]);

  useEffect(() => {
    const fetchConversation = async () => {
      if (!activityId || activityTypeId !== 14) return;
      try {
        setLoadingConversation(true);
        const activity: ActivityDto | null = await apiService.getActivityById(activityId);
        if (activity?.details_JSON) {
          try {
            const parsed = JSON.parse(activity.details_JSON);
            // Keep the full structure so ConversationPlayer can pick title/instruction + conversationData
            setConversationContent(parsed);
          } catch (e) {
            setConversationContent(null);
          }
        }
      } catch {
        setConversationContent(null);
      } finally {
        setLoadingConversation(false);
      }
    };
    fetchConversation();
  }, [activityId, activityTypeId]);

  if (!activityId || !activityTypeId) {
    navigation.goBack();
    return null;
  }

  const handleNextExercise = () => {
    const count = exercises.length || exerciseCount;
    if (currentExerciseIndex < count - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      // Finish: submit progress (10 stars) then exit
      submitProgress().finally(() => navigation.goBack());
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
      if (!activityId || !currentUser?.id) return;
      // NOTE: replace with selected student id if you store it elsewhere
      const studentId = currentUser.id;
      await apiService.postStudentProgress({
        studentId,
        activityId,
        score: 10, // 10 stars
        maxScore: 10,
        timeSpentSeconds: 0,
        attemptNumber: 1,
        isCompleted: true,
      });
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
            const currentExercise = exercises[currentExerciseIndex];
            const parsedContent = currentExercise?.jsonData ? safeJsonParse(currentExercise.jsonData) : null;

            // Conversation player path: use details_JSON content
            const isConversation = activityTypeId === 14;

            let contentForRender = isConversation
              ? conversationContent || parsedContent
              : parsedContent;

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

            if (isConversation && loadingConversation) {
              return <ActivityIndicator size="large" color={THEME.primary} />;
            }

            if (!isConversation) {
              if (loadingExercises) {
                return <ActivityIndicator size="large" color={THEME.primary} />;
              }
              if (!currentExercise || !contentForRender) {
                return <Text style={{ padding: 16 }}>No exercise content available.</Text>;
              }
            } else {
              if (!contentForRender) {
                return <Text style={{ padding: 16 }}>No conversation content available.</Text>;
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
            });

            // Safety Checks
            if (activityComponent == null) return <ActivityIndicator size="large" color={THEME.primary} />;
            if (typeof activityComponent === 'string' || typeof activityComponent === 'number') {
              return <Text style={{fontSize: 20}}>{String(activityComponent)}</Text>;
            }
            if (Array.isArray(activityComponent)) {
              return <Fragment>{activityComponent}</Fragment>;
            }
            if (React.isValidElement(activityComponent)) {
              return activityComponent;
            }
            return <View />;
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
            style={[styles.navButton]}
            onPress={handleNextExercise}
            disabled={loadingExercises}
          >
            <Feather 
              name={currentExerciseIndex >= exerciseCount - 1 ? "check" : "arrow-right"} 
              size={28} 
              color="#FFF" 
            />
          </TouchableOpacity>

        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },

  // --- TOP BAR ---
  headerBar: {
    paddingTop: 45, // StatusBar space
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.primary,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18, // Adjusted font size as requested
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // --- CENTER CONTENT ---
  centerContent: {
    flex: 1, // Maximizes space
    width: '100%',
    backgroundColor: '#FFFFFF', // Keep background clean
    // Removed margins/padding to maximize area as requested
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

// Safe JSON parse helper
const safeJsonParse = (data: string) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

export default PlayScreen;