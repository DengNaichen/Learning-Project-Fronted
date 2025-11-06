import type {
  QuizAttemptResponseDTO,
  QuizAttemptUI,
  AnyQuestionDTO,
  AnyQuizQuestionUI,
  StartQuizInput,
  SubmitQuizInput,
  QuizSubmissionResponse,
} from "../types/quiz";
import { getQuizAttempt, startQuiz, submitQuiz } from "../api/quiz";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function convertQuestionDtoToUi(dto: AnyQuestionDTO): AnyQuizQuestionUI {
  const baseUiQuestion = {
    questionId: dto.question_id,
    text: dto.text,
    difficulty: dto.difficulty,
  };

  switch (dto.question_type) {
    case "multiple_choice":
      return {
        ...baseUiQuestion,
        questionType: dto.question_type,
        options: dto.details.options,
        // NOTE: here we have no correct_answer
      };
    case "fill_in_the_blank":
      return {
        ...baseUiQuestion,
        questionType: dto.question_type,
      };
    case "calculation":
      return {
        ...baseUiQuestion,
        questionType: dto.question_type,
      };
    default:
      throw new Error(`Unknown question type: ${(dto as any).question_type}`);
  }
}

function convertQuizAttemptDtoToUi(dto: QuizAttemptResponseDTO): QuizAttemptUI {
  return {
    attemptId: dto.attempt_id,
    courseId: dto.course_id,
    questionNum: dto.question_num,
    status: dto.status,
    questions: dto.questions.map(convertQuestionDtoToUi),
  };
}

export function useGetQuizAttempt(attemptId: string | undefined) {
  return useQuery<QuizAttemptResponseDTO, Error, QuizAttemptUI>({
    queryKey: ["quiz", attemptId],
    queryFn: () => getQuizAttempt(attemptId!),
    select: convertQuizAttemptDtoToUi,
    enabled: !!attemptId,
  });
}

export function useStartQuiz() {
  const queryClient = useQueryClient();
  return useMutation<QuizAttemptResponseDTO, Error, StartQuizInput>({
    mutationFn: startQuiz,
    onSuccess: (data: QuizAttemptResponseDTO) => {
      const uiData = convertQuizAttemptDtoToUi(data);
      queryClient.setQueryData(["quiz", data.attempt_id], uiData);
    },
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  return useMutation<QuizSubmissionResponse, Error, SubmitQuizInput>({
    mutationFn: submitQuiz,
    onSuccess: (data: QuizSubmissionResponse) => {
      // Invalidate quiz attempts to refetch updated status
      queryClient.invalidateQueries({ queryKey: ["quiz", data.attempt_id] });
    },
  });
}
