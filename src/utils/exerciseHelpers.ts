import { getAudioUrl, getImageUrl } from './awsUrlHelper';

export type SupportedLanguage = 'en' | 'ta' | 'si';

export interface ExerciseMediaInfo {
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string | null;
  audioUrl: string | null;
  raw: any;
  instruction?: any;
  word?: any;
  label?: any;
  referenceTitle?: any;
}

export const parseExerciseJson = (jsonData: string) => {
  try {
    return JSON.parse(jsonData);
  } catch (error) {
    console.warn('Failed to parse exercise JSON:', error);
    return {
      title: 'Exercise',
      description: 'Complete this exercise',
    };
  }
};

export const getLocalizedValue = (
  value: any,
  preferredLanguage: SupportedLanguage = 'en'
): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const candidate =
      value[preferredLanguage] ||
      value.en ||
      value.ta ||
      value.si ||
      Object.values(value).find(
        (entry) => typeof entry === 'string' && entry.trim().length > 0
      );

    return candidate || null;
  }

  return null;
};

const getMediaFromQuestion = (
  question: any,
  preferredLanguage: SupportedLanguage
) => {
  if (!question) {
    return { image: null, audio: null, text: null };
  }

  let image: string | null = null;
  let audio: string | null = null;
  let text: string | null = null;

  if (question.type === 'image') {
    image = getImageUrl(question.content, preferredLanguage);
  } else if (question.type === 'audio') {
    audio = getAudioUrl(question.content, preferredLanguage);
  } else {
    text = getLocalizedValue(question.content, preferredLanguage);
  }

  return { image, audio, text };
};

export const extractExerciseMediaInfo = (
  exerciseData: any,
  preferredLanguage: SupportedLanguage = 'en'
): ExerciseMediaInfo => {
  let imageUrl =
    getImageUrl(exerciseData?.imageUrl, preferredLanguage) ||
    getImageUrl(exerciseData?.image, preferredLanguage);

  let audioUrl =
    getAudioUrl(exerciseData?.audioUrl, preferredLanguage) ||
    getAudioUrl(exerciseData?.audio, preferredLanguage);

  let title =
    getLocalizedValue(exerciseData?.word, preferredLanguage) ||
    getLocalizedValue(exerciseData?.title, preferredLanguage) ||
    'Exercise';

  let description =
    getLocalizedValue(exerciseData?.label, preferredLanguage) ||
    getLocalizedValue(exerciseData?.referenceTitle, preferredLanguage) ||
    getLocalizedValue(exerciseData?.description, preferredLanguage) ||
    'Complete this exercise to continue';

  // Handle flashcard structure
  if (!imageUrl && exerciseData?.imageUrl) {
    imageUrl = getImageUrl(exerciseData.imageUrl, preferredLanguage);
  }

  if (!audioUrl && exerciseData?.audioUrl) {
    audioUrl = getAudioUrl(exerciseData.audioUrl, preferredLanguage);
  }

  // Handle MCQ structure
  if (!imageUrl || !audioUrl || !title) {
    const firstQuestion = exerciseData?.questions?.[0];
    if (firstQuestion) {
      const questionMedia = getMediaFromQuestion(
        firstQuestion.question,
        preferredLanguage
      );

      if (!imageUrl && questionMedia.image) {
        imageUrl = questionMedia.image;
      }

      if (!audioUrl && questionMedia.audio) {
        audioUrl = questionMedia.audio;
      }

      if (!title && questionMedia.text) {
        title = questionMedia.text;
      }
    }
  }

  // Final fallbacks
  if (!title) {
    title = 'Exercise';
  }

  if (!description) {
    description = 'Complete this exercise to continue';
  }

  return {
    title,
    description,
    imageUrl,
    audioUrl,
    raw: exerciseData,
    instruction: exerciseData?.instruction,
    word: exerciseData?.word,
    label: exerciseData?.label,
    referenceTitle: exerciseData?.referenceTitle,
  };
};


