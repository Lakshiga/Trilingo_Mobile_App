import { useState, useCallback } from 'react';
import apiService, { SubmitExerciseAttemptDto } from '../services/api';

interface ExerciseScore {
  exerciseId: number;
  score: number; // 0-10
  timeSpentSeconds: number;
  attemptNumber: number;
  attemptDetails?: string;
}

interface ExerciseScoringResult {
  pointsEarned: number;
  isFirstAttempt: boolean;
  totalXpPoints: number;
}

export const useExerciseScoring = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const submitExerciseAttempt = useCallback(async (
    exerciseScore: ExerciseScore
  ): Promise<ExerciseScoringResult | null> => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const payload: SubmitExerciseAttemptDto = {
        exerciseId: exerciseScore.exerciseId,
        score: Math.min(Math.max(exerciseScore.score, 0), 10), // Ensure score is between 0-10
        timeSpentSeconds: exerciseScore.timeSpentSeconds,
        attemptNumber: exerciseScore.attemptNumber,
        attemptDetails: exerciseScore.attemptDetails,
      };

      const response = await apiService.submitExerciseAttempt(payload);
      
      if (response.isSuccess && response.data) {
        // Return the proper data from the backend response
        return {
          pointsEarned: response.data.pointsEarned || 0,
          isFirstAttempt: response.data.isFirstAttempt || false,
          totalXpPoints: response.data.totalXpPoints || 0
        };
      } else {
        throw new Error(response.message || 'Failed to submit exercise attempt');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || 'Failed to submit exercise attempt';
      setSubmissionError(errorMessage);
      console.error('Error submitting exercise attempt:', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    submitExerciseAttempt,
    isSubmitting,
    submissionError,
  };
};