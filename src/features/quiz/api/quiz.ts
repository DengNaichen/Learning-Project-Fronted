import axios from 'axios';
import apiClient from '../../../api/client';

import type {
    QuizStartRequest,
    QuizAttemptResponseDTO,
    StartQuizInput,
    ApiError,
    SubmitQuizInput,
    QuizSubmissionRequest,
    QuizSubmissionResponse,
} from "../types/quiz"

/**
 * Start a new quiz attempt (POST /course/{courseId}/quizzes)
 *
 * Uses global apiClient (with baseURL and auth interceptors configured)
 *
 * @param input - Contains `courseId` and `questionNum`
 * @returns Raw `QuizAttemptResponseDTO` from API
 */
export const startQuiz = async (
  input: StartQuizInput
): Promise<QuizAttemptResponseDTO> => {
  
  const { courseId, questionNum } = input;

  // 1. Prepare request body (matches Pydantic `QuizStartRequest`)
  const requestBody: QuizStartRequest = {
    question_num: questionNum
  };

  // 2. Prepare URL (backend: POST /course/{course_id}/quizzes)
  const url = `/course/${courseId}/quizzes`;

  try {
    // 3. Send request
    // axios automatically:
    // - Serializes `requestBody` to JSON
    // - Returns parsed JSON in `response.data`
    // - Throws error if status code is not 2xx
    const response = await apiClient.post<QuizAttemptResponseDTO>(url, requestBody);

    return response.data;

  } catch (error) {
    // 4. Standardized error handling
    if (axios.isAxiosError(error) && error.response) {
      // This is a server error (4xx, 5xx)
      const apiError = error.response.data as ApiError;
      // Backend returns error message in 'detail' field
      throw new Error(apiError.detail || apiError.message || 'Failed to start quiz');
    }
    // This is a network error or other JavaScript error
    throw new Error('An unknown error occurred while starting the quiz');
  }
};

/**
 * Fetch an existing quiz attempt (GET /quizzes/{attemptId})
 *
 * Matches `useGetQuizAttempt` hook
 *
 * @param attemptId - UUID of the quiz attempt to fetch
 * @returns Raw `QuizAttemptResponseDTO` from API
 */
export const getQuizAttempt = async (
  attemptId: string
): Promise<QuizAttemptResponseDTO> => {

  // Endpoint for fetching existing quiz attempt
  const url = `/quizzes/${attemptId}`;

  try {
    const response = await apiClient.get<QuizAttemptResponseDTO>(url);
    return response.data;

  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data as ApiError;
      throw new Error(apiError.detail || apiError.message || 'Failed to fetch quiz attempt');
    }
    throw new Error('An unknown error occurred while fetching the quiz');
  }
};

/**
 * Submit quiz answers (POST /submissions/{submission_id})
 *
 * Matches `useSubmitQuiz` hook
 *
 * @param input - Contains `attemptId` and `answers`
 * @returns `QuizSubmissionResponse` from API
 */
export const submitQuiz = async (
  input: SubmitQuizInput
): Promise<QuizSubmissionResponse> => {

  const { attemptId, answers } = input;

  // 1. Prepare request body (matches Pydantic `QuizSubmissionRequest`)
  const requestBody: QuizSubmissionRequest = {
    answers
  };

  // 2. Prepare URL (backend: POST /submissions/{submission_id})
  const url = `/submissions/${attemptId}`;

  try {
    // 3. Send request
    const response = await apiClient.post<QuizSubmissionResponse>(url, requestBody);

    return response.data;

  } catch (error) {
    // 4. Standardized error handling
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data as ApiError;
      throw new Error(apiError.detail || apiError.message || 'Failed to submit quiz');
    }
    throw new Error('An unknown error occurred while submitting the quiz');
  }
};