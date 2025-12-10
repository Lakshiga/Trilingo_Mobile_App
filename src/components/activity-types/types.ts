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
  content?: any; // JSON content from database (optional - can fetch internally)
  currentLang?: Language;
  onComplete?: () => void;
  activityId?: number; // Activity ID to fetch data (if content not provided)
  currentExerciseIndex?: number; // Current exercise index (for multi-exercise activities)
  onExerciseComplete?: () => void; // Callback when exercise is completed
  onExit?: () => void; // Callback to exit/go back (always exits)
}

