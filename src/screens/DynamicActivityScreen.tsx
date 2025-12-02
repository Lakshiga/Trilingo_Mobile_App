import React, { useEffect, useMemo, useState } from 'react';
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
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { Language } from '../utils/translations';
import { getLearningLanguageField } from '../utils/languageUtils';
import apiService, { ActivityDto, ActivityTypeDto } from '../services/api';
import {
  StoryPlayer,
  ConversationPlayer,
  MCQActivity,
  Flashcard,
  Matching,
  MemoryPair,
  FillInTheBlanks,
  TrueFalse,
  ScrambleActivity,
  PronunciationActivity,
  TripleBlast,
  BubbleBlast,
  GroupSorter,
  SongPlayer,
  VideoPlayer,
} from '../components/activity-types';

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

        const typeIdToUse = activityTypeId || fetchedActivity?.activityTypeId;
        if (typeIdToUse) {
          const fetchedType = await apiService.getActivityTypeById(typeIdToUse);
          if (!isMounted) return;
          setActivityType(fetchedType);
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
    getLearningLanguageField(learningLanguage, activity) ||
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

  const handleOpenExercises = () => {
    if (!activityId) return;
    navigation.navigate('Exercise', {
      activityId,
      activity: {
        id: activityId,
        title: headerTitle,
        description: headerSubtitle,
      },
      activityTypeId: activityType?.id || activityTypeId,
      jsonMethod: activityType?.jsonMethod || jsonMethod,
    });
  };

  const renderStoryActivity = () => {
    const storyPayload = {
      title: ensureMultilingual(content?.title, headerTitle),
      instruction: ensureMultilingual(content?.instruction, 'Enjoy the story!'),
      storyData: content?.storyData || content || storyData,
    };

    return (
      <StoryPlayer
        content={storyPayload}
        currentLang={currentLang as any}
        onComplete={() => {}}
      />
    );
  };

  const renderConversationActivity = () => {
    const conversationPayload = {
      title: ensureMultilingual(content?.title, headerTitle),
      instruction: ensureMultilingual(content?.instruction, 'Listen and follow the conversation.'),
      conversationData: content?.conversationData || content || conversationData,
    };

    return (
      <ConversationPlayer
        content={conversationPayload}
        currentLang={currentLang as any}
        onComplete={() => {}}
      />
    );
  };

  const renderSongActivity = () => (
    <SongPlayer
      content={{
        ...buildGenericContent('Listen to the song and sing along!'),
        songData: content?.songData || content,
      }}
      currentLang={currentLang as any}
      onComplete={() => {}}
    />
  );

  const renderVideoActivity = () => (
    <VideoPlayer
      content={{
        ...buildGenericContent('Watch the video carefully.'),
        videoData: content?.videoData || content,
      }}
      currentLang={currentLang as any}
      onComplete={() => {}}
    />
  );

  const renderMCQActivity = () => (
    <MCQActivity
      content={buildGenericContent('Select the correct answer.')}
      currentLang={currentLang as any}
      onComplete={() => {}}
    />
  );

  const renderFlashcardActivity = () => (
    <Flashcard
      content={buildGenericContent('Flip the card to reveal the translation.')}
      currentLang={currentLang as any}
      onComplete={() => {}}
    />
  );

  const renderMatchingActivity = () => (
    <Matching
      content={buildGenericContent('Match the related pairs.')}
      currentLang={currentLang as any}
      onComplete={() => {}}
    />
  );

  const renderMemoryActivity = () => (
    <MemoryPair
      content={buildGenericContent('Remember and match the cards.')}
      currentLang={currentLang as any}
      onComplete={() => {}}
    />
  );

  const renderFillInTheBlanksActivity = () => (
    <FillInTheBlanks
      content={buildGenericContent('Complete the sentence.')}
      currentLang={currentLang as any}
      onComplete={() => {}}
    />
  );

  const renderTrueFalseActivity = () => (
    <TrueFalse
      content={buildGenericContent('Decide if each statement is True or False.')}
      currentLang={currentLang as any}
      onComplete={() => {}}
    />
  );

  const renderScrambleActivity = () => (
    <ScrambleActivity
      content={buildGenericContent('Unscramble the words.')}
      currentLang={currentLang as any}
      onComplete={() => {}}
    />
  );

  const renderPronunciationActivity = () => (
    <PronunciationActivity
      content={buildGenericContent('Practice the pronunciation.')}
      currentLang={currentLang as any}
      onComplete={() => {}}
    />
  );

  const renderTripleBlastActivity = () => (
    <TripleBlast
      content={buildGenericContent('Match three related tiles.')}
      currentLang={currentLang as any}
      onComplete={() => {}}
    />
  );

  const renderBubbleBlastActivity = () => (
    <BubbleBlast
      content={buildGenericContent('Pop the bubbles with correct answers.')}
      currentLang={currentLang as any}
      onComplete={() => {}}
    />
  );

  const renderGroupSorterActivity = () => (
    <GroupSorter
      content={buildGenericContent('Sort the items into the correct group.')}
      currentLang={currentLang as any}
      onComplete={() => {}}
    />
  );

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
      {activityId && (
        <TouchableOpacity style={styles.genericButton} onPress={handleOpenExercises}>
          <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
          <Text style={styles.genericButtonText}>View Exercises</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.headerGradient[0]} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading activity...</Text>
        </View>
      );
    }

    if (error) {
      return renderUnsupportedActivity(error);
    }

    const hasStoryPayload = storyData || content?.storyData || normalizedMethod.includes('story');
    const hasConversationPayload =
      conversationData || content?.conversationData || normalizedMethod.includes('conversation');

    if (hasStoryPayload) {
      return renderStoryActivity();
    }

    if (hasConversationPayload) {
      return renderConversationActivity();
    }

    switch (true) {
      case normalizedMethod.includes('song'):
        return renderSongActivity();
      case normalizedMethod.includes('video'):
        return renderVideoActivity();
      case normalizedMethod === 'mcq':
      case normalizedMethod === 'multiple_choice':
        return renderMCQActivity();
      case normalizedMethod.includes('flash'):
        return renderFlashcardActivity();
      case normalizedMethod.includes('matching'):
        return renderMatchingActivity();
      case normalizedMethod.includes('memory'):
        return renderMemoryActivity();
      case normalizedMethod.includes('fill'):
        return renderFillInTheBlanksActivity();
      case normalizedMethod.includes('true'):
      case normalizedMethod.includes('false'):
        return renderTrueFalseActivity();
      case normalizedMethod.includes('scramble'):
        return renderScrambleActivity();
      case normalizedMethod.includes('pronunciation'):
        return renderPronunciationActivity();
      case normalizedMethod.includes('triple'):
        return renderTripleBlastActivity();
      case normalizedMethod.includes('bubble'):
        return renderBubbleBlastActivity();
      case normalizedMethod.includes('group'):
        return renderGroupSorterActivity();
      default:
        return renderUnsupportedActivity();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background[0] }]}>
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

      <View style={styles.contentWrapper}>{renderContent()}</View>
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
