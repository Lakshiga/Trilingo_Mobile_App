import { ActivityDto, ActivityTypeDto, MainActivityDto } from '../services/api';

type NamedEntity = {
  id: number;
  name_en?: string;
  name_ta?: string;
  name_si?: string;
};

const normalize = (value?: string): string =>
  value?.trim().toLowerCase() || '';

const matchesAnyName = (entity: NamedEntity, targetNames: string[]): boolean => {
  if (targetNames.length === 0) {
    return false;
  }

  const normalizedTargets = targetNames.map(normalize).filter(Boolean);
  const entityNames = [
    normalize(entity.name_en),
    normalize(entity.name_ta),
    normalize(entity.name_si),
  ];

  return entityNames.some((entityName) =>
    normalizedTargets.some(
      (target) =>
        entityName === target ||
        (entityName.length > 0 && entityName.includes(target))
    )
  );
};

const collectIdsByNames = <T extends NamedEntity>(
  list: T[] | undefined,
  targetNames: string[]
): Set<number> => {
  if (!list || list.length === 0 || targetNames.length === 0) {
    return new Set();
  }

  return new Set(
    list
      .filter((item) => matchesAnyName(item, targetNames))
      .map((item) => item.id)
  );
};

export const findMainActivityIds = (
  mainActivities: MainActivityDto[] | undefined,
  targetNames: string[]
): Set<number> => collectIdsByNames(mainActivities, targetNames);

export const findActivityTypeIds = (
  activityTypes: ActivityTypeDto[] | undefined,
  targetNames: string[]
): Set<number> => collectIdsByNames(activityTypes, targetNames);

export const filterActivitiesByIds = (
  activities: ActivityDto[],
  mainActivityIds?: Set<number>,
  activityTypeIds?: Set<number>
): ActivityDto[] => {
  if (!activities || activities.length === 0) {
    return [];
  }

  return activities.filter((activity) => {
    const matchesMain =
      !mainActivityIds || mainActivityIds.size === 0
        ? true
        : mainActivityIds.has(activity.mainActivityId);

    const matchesType =
      !activityTypeIds || activityTypeIds.size === 0
        ? true
        : activityTypeIds.has(activity.activityTypeId);

    return matchesMain && matchesType;
  });
};

export const LEARNING_MAIN_ACTIVITY_NAMES = ['learning', 'practice', 'game'];
export const LISTENING_MAIN_ACTIVITY_NAMES = ['listening'];
export const VIDEO_MAIN_ACTIVITY_NAMES = ['video', 'videos'];
export const CONVERSATION_MAIN_ACTIVITY_NAMES = ['conversation', 'conversations'];

export const SONG_PLAYER_ACTIVITY_TYPE_NAMES = ['song player'];
export const STORY_PLAYER_ACTIVITY_TYPE_NAMES = ['story player'];
export const VIDEO_PLAYER_ACTIVITY_TYPE_NAMES = ['video player'];
export const CONVERSATION_PLAYER_ACTIVITY_TYPE_NAMES = ['conversation player'];


