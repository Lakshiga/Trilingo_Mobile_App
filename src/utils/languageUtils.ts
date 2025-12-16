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

/**
 * Get text alignment style based on language
 * Tamil and Sinhala are LTR but may need consistent left alignment
 */
export const getTextAlignment = (language: Language): 'left' | 'center' | 'right' => {
  switch (language) {
    case 'Tamil':
    case 'Sinhala':
      return 'left';
    case 'English':
    default:
      return 'left';
  }
};

/**
 * Get text alignment style object for React Native Text/TextInput components
 */
export const getTextAlignmentStyle = (language: Language) => {
  return {
    textAlign: getTextAlignment(language) as 'left' | 'center' | 'right',
    writingDirection: 'ltr' as const,
  };
};

/**
 * Get font size multiplier for Tamil and Sinhala (smaller font size)
 * Returns a multiplier to apply to base font sizes
 */
export const getFontSizeMultiplier = (language: Language): number => {
  switch (language) {
    case 'Tamil':
    case 'Sinhala':
      return 0.85; // 15% smaller for Tamil and Sinhala
    case 'English':
    default:
      return 1.0;
  }
};

/**
 * Get adjusted font size based on language
 * Tamil and Sinhala get smaller font sizes to prevent overflow
 */
export const getAdjustedFontSize = (baseSize: number, language: Language): number => {
  return baseSize * getFontSizeMultiplier(language);
};

/**
 * Get complete text style with alignment and font size adjustments
 * Use this for Text and TextInput components
 */
export const getLanguageTextStyle = (language: Language, baseFontSize?: number) => {
  const style: any = {
    textAlign: getTextAlignment(language) as 'left' | 'center' | 'right',
    writingDirection: 'ltr' as const,
  };
  
  if (baseFontSize !== undefined) {
    style.fontSize = getAdjustedFontSize(baseFontSize, language);
  }
  
  return style;
};

