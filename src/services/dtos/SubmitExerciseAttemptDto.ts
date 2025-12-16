export interface SubmitExerciseAttemptDto {
  exerciseId: number;
  score: number; // 0-10
  timeSpentSeconds: number;
  attemptNumber: number;
  attemptDetails?: string;
}