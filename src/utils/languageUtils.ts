import { Language } from './translations';

/**
 * Get the appropriate language field from backend data
 * @param learningLanguage - The language the user wants to learn
 * @param data - Object with name_en, name_ta, name_si fields
 * @returns The value in the learning language, or English as fallback
 */
export const getLearningLanguageField = <T extends { name_en?: string; name_ta?: string; name_si?: string }>(
  learningLanguage: Language,
  data: T
): string => {
  switch (learningLanguage) {
    case 'Tamil':
      return data.name_ta || data.name_en || '';
    case 'Sinhala':
      return data.name_si || data.name_en || '';
    case 'English':
    default:
      return data.name_en || '';
  }
};

/**
 * Get language code for API calls or JSON parsing
 */
export const getLanguageCode = (language: Language): string => {
  switch (language) {
    case 'Tamil':
      return 'ta';
    case 'Sinhala':
      return 'si';
    case 'English':
    default:
      return 'en';
  }
};

/**
 * Get language code for JSON object keys (en, ta, si)
 */
export const getLanguageKey = (language: Language): 'en' | 'ta' | 'si' => {
  switch (language) {
    case 'Tamil':
      return 'ta';
    case 'Sinhala':
      return 'si';
    case 'English':
    default:
      return 'en';
  }
};

