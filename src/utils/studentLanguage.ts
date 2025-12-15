import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from './translations';

const STUDENT_PROFILE_KEY = '@trilingo_student_profile';

export interface StudentLanguagePreference {
  nativeLanguageCode?: string;
  targetLanguageCode?: string;
}

export const languageCodeToLanguage = (code?: string): Language => {
  if (!code) return 'English';
  const lower = code.toLowerCase();
  if (lower.startsWith('ta')) return 'Tamil';
  if (lower.startsWith('si')) return 'Sinhala';
  return 'English';
};

export const languageCodeToKey = (code?: string): 'en' | 'ta' | 'si' => {
  const lang = languageCodeToLanguage(code);
  switch (lang) {
    case 'Tamil':
      return 'ta';
    case 'Sinhala':
      return 'si';
    default:
      return 'en';
  }
};

export const loadStudentLanguagePreference = async (): Promise<StudentLanguagePreference> => {
  try {
    const raw = await AsyncStorage.getItem(STUDENT_PROFILE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      nativeLanguageCode: parsed?.nativeLanguageCode,
      targetLanguageCode: parsed?.targetLanguageCode,
    };
  } catch {
    return {};
  }
};

