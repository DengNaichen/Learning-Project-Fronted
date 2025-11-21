import axios from 'axios';
import apiClient from '../../../api/client';

import type {
  NextQuestionResponseDTO,
  SingleAnswerSubmitRequest,
  SingleAnswerSubmitResponseDTO,
  ApiError,
} from "../types/question"

/**
 * Get next question for a knowledge graph (GET /graphs/{graphId}/next-question)
 *
 * Uses global apiClient (with baseURL and auth interceptors configured)
 *
 * @param graphId - UUID of the knowledge graph
 * @returns `NextQuestionResponseDTO` from API with the next recommended question
 */
export const getNextQuestion = async (
  graphId: string
): Promise<NextQuestionResponseDTO> => {

  const url = `/graphs/${graphId}/next-question`;

  try {
    const response = await apiClient.get<NextQuestionResponseDTO>(url);
    return response.data;

  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data as ApiError;
      throw new Error(apiError.detail || apiError.message || 'Failed to get next question');
    }
    throw new Error('An unknown error occurred while getting the next question');
  }
};

/**
 * Submit a single answer (POST /answer)
 *
 * Used for practice mode - one question at a time with immediate feedback
 *
 * @param request - Contains question_id, user_answer, and graph_id
 * @returns `SingleAnswerSubmitResponseDTO` with grading result and mastery update
 */
export const submitAnswer = async (
  request: SingleAnswerSubmitRequest
): Promise<SingleAnswerSubmitResponseDTO> => {

  const url = `/answer`;

  try {
    const response = await apiClient.post<SingleAnswerSubmitResponseDTO>(url, request);
    return response.data;

  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data as ApiError;
      throw new Error(apiError.detail || apiError.message || 'Failed to submit answer');
    }
    throw new Error('An unknown error occurred while submitting the answer');
  }
};
