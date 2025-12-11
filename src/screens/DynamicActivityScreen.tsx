import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { Language } from '../utils/translations';
import { getLearningLanguageField } from '../utils/languageUtils';
import apiService, { ActivityDto, ActivityTypeDto } from '../services/api';
import {
  renderActivityByTypeId,
  isActivityTypeSupported,
} from '../components/activity-types';
import { useBackgroundAudio } from '../context/BackgroundAudioContext';

type DynamicActivityRouteParams = {
  activityId?: number;
  activityTypeId?: number;
  jsonMethod?: string;
  activityTitle?: string;
  storyData?: any;
  conversationData?: any;
};

const DynamicActivityScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: DynamicActivityRouteParams }, 'params'>>();
  const { theme } = useTheme();
  const { currentUser } = useUser();
  const { requestAudioFocus, resumeBackground } = useBackgroundAudio();
  const releaseRef = useRef<(() => void) | null>(null);
  const learningLanguage: Language = (currentUser?.learningLanguage as Language) || 'Tamil';
  const currentLang = learningLanguage === 'English' ? 'en' : learningLanguage === 'Tamil' ? 'ta' : 'si';

  const { activityId, activityTypeId, jsonMethod, activityTitle, storyData, conversationData } =
    route.params || {};

  const [activity, setActivity] = useState<ActivityDto | null>(null);
  const [activityType, setActivityType] = useState<ActivityTypeDto | null>(null);
  const [content, setContent] = useState<any>(storyData ?? conversationData ?? null);
  const [loading, setLoading] = useState<boolean>(!!activityId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    releaseRef.current = requestAudioFocus();
    return () => {
      releaseRef.current?.();
      releaseRef.current = null;
      resumeBackground().catch(() => null);
    };
  }, [requestAudioFocus, resumeBackground]);

  useEffect(() => {
    let isMounted = true;

    const loadActivity = async () => {
      try {
        setError(null);

        if (!activityId && !activityTypeId) {
          setLoading(false);
          return;
        }

        setLoading(true);

        let fetchedActivity: ActivityDto | null = null;
        if (activityId) {
          fetchedActivity = await apiService.getActivityById(activityId);
        }

        if (!isMounted) return;

        if (fetchedActivity) {
          setActivity(fetchedActivity);
          if (fetchedActivity.details_JSON) {
            try {
              const parsed = JSON.parse(fetchedActivity.details_JSON);
              setContent(parsed);
            } catch (parseError) {
              console.warn('Failed to parse activity JSON', parseError);
            }
          }
        }

        // Use activityTypeId from route params (already passed from activity screen)
        // Only fetch if we don't have activityTypeId or jsonMethod from route
        const typeIdToUse = activityTypeId || fetchedActivity?.activityTypeId;
        if (typeIdToUse && !jsonMethod) {
          // Only fetch if jsonMethod wasn't passed (to avoid unnecessary API call)
          const fetchedType = await apiService.getActivityTypeById(typeIdToUse);
          if (!isMounted) return;
          setActivityType(fetchedType);
        } else if (jsonMethod && typeIdToUse) {
          // If jsonMethod is passed, create activityType object from route params
          setActivityType({
            id: typeIdToUse,
            jsonMethod: jsonMethod,
          } as ActivityTypeDto);
        } else {
          setActivityType(null);
        }
      } catch (err) {
        console.error('Failed to load activity data', err);
        if (isMounted) {
          setError('Unable to load this activity right now. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadActivity();

    return () => {
      isMounted = false;
    };
  }, [activityId, activityTypeId]);

  const normalizedMethod = useMemo(() => {
    const method = activityType?.jsonMethod || jsonMethod || '';
    return method.trim().toLowerCase();
  }, [activityType?.jsonMethod, jsonMethod]);

  const headerTitle =
    activityTitle ||
    (activity ? getLearningLanguageField(learningLanguage, activity) : null) ||
    activity?.name_en ||
    'Activity';

  const headerSubtitle =
    activity?.name_en || activity?.name_ta || activity?.name_si || 'Dynamic Activity';

  const ensureMultilingual = (value: any, fallback: string) => {
    if (value && typeof value === 'object') {
      return value;
    }
    return { en: fallback };
  };

  const buildGenericContent = (fallbackInstruction: string) => {
    if (content && typeof content === 'object') {
      return {
        ...content,
        title: ensureMultilingual(content.title, headerTitle),
        instruction: ensureMultilingual(content.instruction, fallbackInstruction),
      };
    }
    return {
      title: ensureMultilingual(null, headerTitle),
      instruction: ensureMultilingual(null, fallbackInstruction),
    };
  };


  // Helper function to build content with proper structure for each activity type
  const buildActivityContent = (activityTypeId: number) => {
    // Special handling for Story (ID: 7)
    if (activityTypeId === 7) {
      return {
        title: ensureMultilingual(content?.title, headerTitle),
        instruction: ensureMultilingual(content?.instruction, 'Enjoy the story!'),
        storyData: content?.storyData || content || storyData,
      };
    }

    // Special handling for Conversation (ID: 14)
    if (activityTypeId === 14) {
      return {
        title: ensureMultilingual(content?.title, headerTitle),
        instruction: ensureMultilingual(content?.instruction, 'Listen and follow the conversation.'),
        conversationData: content?.conversationData || content || conversationData,
      };
    }

    // Special handling for Song (ID: 6)
    if (activityTypeId === 6) {
      return {
        ...buildGenericContent('Listen to the song and sing along!'),
        songData: content?.songData || content,
      };
    }

    // Special handling for Video (ID: 15)
    if (activityTypeId === 15) {
      return {
        ...buildGenericContent('Watch the video carefully.'),
        videoData: content?.videoData || content,
      };
    }

    // Default content building for other activity types
    const fallbackInstructions: Record<number, string> = {
      1: 'Flip the card to reveal the translation.',
      2: 'Match the related pairs.',
      3: 'Complete the sentence.',
      4: 'Select the correct answer.',
      5: 'Decide if each statement is True or False.',
      8: 'Practice the pronunciation.',
      9: 'Unscramble the words.',
      10: 'Match three related tiles.',
      11: 'Pop the bubbles with correct answers.',
      12: 'Remember and match the cards.',
      13: 'Sort the items into the correct group.',
    };

    // For Flashcard (ID: 1), ensure we preserve the entire content structure
    if (activityTypeId === 1) {
      // Flashcard needs the full content object with words array
      if (content && typeof content === 'object') {
        return {
          ...content, // Preserve all content properties including words
          title: ensureMultilingual(content.title, headerTitle),
          instruction: ensureMultilingual(content.instruction, fallbackInstructions[1]),
        };
      }
      // If no content, return empty structure
      return {
        title: ensureMultilingual(null, headerTitle),
        instruction: ensureMultilingual(null, fallbackInstructions[1]),
      };
    }

    return buildGenericContent(fallbackInstructions[activityTypeId] || 'Complete the activity.');
  };

  const renderUnsupportedActivity = (message?: string) => (
    <View style={styles.genericContainer}>
      <MaterialIcons name="extension-off" size={56} color={theme.textSecondary} />
      <Text style={[styles.genericTitle, { color: theme.textPrimary }]}>
        {message || 'This activity type is not supported yet.'}
      </Text>
      <Text style={[styles.genericDescription, { color: theme.textSecondary }]}>
        {activityType?.jsonMethod || jsonMethod
          ? `Activity Type: ${activityType?.jsonMethod || jsonMethod}`
          : 'No activity type information provided.'}
      </Text>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../../assets/animations/Loading animation.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading activity...</Text>
        </View>
      );
    }

    if (error) {
      return renderUnsupportedActivity(error);
    }

    // Primary method: Use Activity Type ID to render component
    const typeId = activityType?.id || activityTypeId;
    
    if (typeId && isActivityTypeSupported(typeId)) {
      const activityContent = buildActivityContent(typeId);
      
      // Debug: Log content for Flashcard (ID: 1)
      const renderedComponent = renderActivityByTypeId(typeId, {
        content: activityContent,
        currentLang: currentLang as any,
        onComplete: () => {
          navigation.goBack();
        },
        activityId: activityId, // Pass activityId so component can fetch its own data
      });

      if (renderedComponent) {
        return renderedComponent;
      }
    }

    // Fallback: Use jsonMethod if activityTypeId mapping doesn't work
    // This is for backward compatibility with older navigation flows
    const hasStoryPayload = storyData || content?.storyData || normalizedMethod.includes('story');
    const hasConversationPayload =
      conversationData || content?.conversationData || normalizedMethod.includes('conversation');

    if (hasStoryPayload && isActivityTypeSupported(7)) {
      return renderActivityByTypeId(7, {
        content: buildActivityContent(7),
        currentLang: currentLang as any,
        onComplete: () => {
          navigation.goBack();
        },
      });
    }

    if (hasConversationPayload && isActivityTypeSupported(14)) {
      return renderActivityByTypeId(14, {
        content: buildActivityContent(14),
        currentLang: currentLang as any,
        onComplete: () => {
          navigation.goBack();
        },
      });
    }

    // Last resort: Try to map jsonMethod to activity type ID
    const jsonMethodToIdMap: Record<string, number> = {
      song: 6,
      video: 15,
      mcq: 4,
      multiple_choice: 4,
      flashcard: 1,
      flash: 1,
      matching: 2,
      memory: 12,
      fill: 3,
      true_false: 5,
      scramble: 9,
      pronunciation: 8,
      triple_blast: 10,
      bubble_blast: 11,
      group_sorter: 13,
    };

    for (const [method, id] of Object.entries(jsonMethodToIdMap)) {
      if (normalizedMethod.includes(method) && isActivityTypeSupported(id)) {
        return renderActivityByTypeId(id, {
          content: buildActivityContent(id),
          currentLang: currentLang as any,
          onComplete: () => {
            navigation.goBack();
          },
        });
      }
    }

    // If nothing matches, show unsupported message
    return renderUnsupportedActivity();
  };

  // Hide header for Flashcard activity (ID: 1) - component handles its own display
  const shouldHideHeader = (activityType?.id || activityTypeId) === 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.background[0] }]}>
      {!shouldHideHeader && (
        <LinearGradient colors={theme.headerGradient} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {headerTitle}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {normalizedMethod ? `Activity Type: ${activityType?.jsonMethod || jsonMethod}` : headerSubtitle}
            </Text>
          </View>
        </LinearGradient>
      )}

      {/* Show back button for Flashcard even when header is hidden */}
      {shouldHideHeader && (
        <TouchableOpacity 
          style={[styles.backButton, { position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 25, padding: 10 }]} 
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={22} color="#1976D2" />
        </TouchableOpacity>
      )}

      <View style={[styles.contentWrapper, shouldHideHeader && { paddingTop: 0 }]}>{renderContent()}</View>
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
    top: 45,
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
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  contentWrapper: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  genericContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  genericTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  genericDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  genericButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#43BCCD',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  genericButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DynamicActivityScreen;
