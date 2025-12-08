import React from 'react';
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
} from './index';
import { ActivityComponentProps } from './types';

// Activity Type ID to Component Mapping
// This maps backend activity type IDs to their corresponding React components
export const ACTIVITY_TYPE_MAP: Record<number, React.FC<ActivityComponentProps>> = {
  1: Flashcard,
  2: Matching,
  3: FillInTheBlanks,
  4: MCQActivity,
  5: TrueFalse,
  6: SongPlayer,
  7: StoryPlayer,
  8: PronunciationActivity,
  9: ScrambleActivity,
  10: TripleBlast,
  11: BubbleBlast,
  12: MemoryPair,
  13: GroupSorter,
  14: ConversationPlayer,
  15: VideoPlayer,
};

/**
 * Renders the appropriate activity component based on activity type ID
 * @param activityTypeId - The activity type ID (1-15)
 * @param props - Props to pass to the activity component
 * @returns The rendered activity component or null if ID is not found
 */
export const renderActivityByTypeId = (
  activityTypeId: number,
  props: ActivityComponentProps
): React.ReactElement | null => {
  if (!activityTypeId || typeof activityTypeId !== 'number') {
    return null;
  }
  
  const Component = ACTIVITY_TYPE_MAP[activityTypeId];
  
  if (!Component) {
    return null;
  }
  
  try {
    return <Component {...props} />;
  } catch (error) {
    return null;
  }
};

/**
 * Checks if an activity type ID is supported
 * @param activityTypeId - The activity type ID to check
 * @returns true if the ID is supported (1-15), false otherwise
 */
export const isActivityTypeSupported = (activityTypeId: number): boolean => {
  return activityTypeId >= 1 && activityTypeId <= 15 && ACTIVITY_TYPE_MAP[activityTypeId] !== undefined;
};

/**
 * Gets the component name for a given activity type ID
 * @param activityTypeId - The activity type ID
 * @returns The component name or 'Unknown' if not found
 */
export const getActivityComponentName = (activityTypeId: number): string => {
  const componentNames: Record<number, string> = {
    1: 'Flashcard',
    2: 'Matching',
    3: 'FillInTheBlanks',
    4: 'MCQActivity',
    5: 'TrueFalse',
    6: 'SongPlayer',
    7: 'StoryPlayer',
    8: 'PronunciationActivity',
    9: 'ScrambleActivity',
    10: 'TripleBlast',
    11: 'BubbleBlast',
    12: 'MemoryPair',
    13: 'GroupSorter',
    14: 'ConversationPlayer',
    15: 'VideoPlayer',
  };
  
  return componentNames[activityTypeId] || 'Unknown';
};
