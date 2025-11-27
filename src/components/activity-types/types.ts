// Shared types for activity components

export type Language = 'ta' | 'en' | 'si';

export interface MultiLingualText {
  ta?: string;
  en?: string;
  si?: string;
  [key: string]: string | undefined;
}

export interface ImageUrl {
  default?: string | null;
  ta?: string | null;
  en?: string | null;
  si?: string | null;
}

export interface ActivityComponentProps {
  content: any; // JSON content from database
  currentLang?: Language;
  onComplete?: () => void;
}

