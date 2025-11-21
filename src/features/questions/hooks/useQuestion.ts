import type {
  NextQuestionResponseDTO,
  NextQuestionResponseUI,
  AnyQuestionDTO,
  AnyQuestionUI,
  SingleAnswerSubmitRequest,
  SingleAnswerSubmitResponseDTO,
  SingleAnswerSubmitResponseUI,
} from "../types/question";
import { getNextQuestion, submitAnswer } from "../api/questions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function convertQuestionDtoToUi(dto: AnyQuestionDTO): AnyQuestionUI {
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

function convertNextQuestionDtoToUi(dto: NextQuestionResponseDTO): NextQuestionResponseUI {
  return {
    question: dto.question ? convertQuestionDtoToUi(dto.question) : null,
    nodeId: dto.node_id,
    selectionReason: dto.selection_reason,
    priorityScore: dto.priority_score,
  };
}

export function useGetNextQuestion(graphId: string | undefined) {
  return useQuery<NextQuestionResponseDTO, Error, NextQuestionResponseUI>({
    queryKey: ["nextQuestion", graphId],
    queryFn: () => getNextQuestion(graphId!),
    select: convertNextQuestionDtoToUi,
    enabled: !!graphId,
  });
}

function convertSubmitResponseDtoToUi(dto: SingleAnswerSubmitResponseDTO): SingleAnswerSubmitResponseUI {
  return {
    answerId: dto.answer_id,
    isCorrect: dto.is_correct,
    masteryUpdated: dto.mastery_updated,
    nextQuestionId: dto.next_question_id,
  };
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient();

  return useMutation<SingleAnswerSubmitResponseUI, Error, SingleAnswerSubmitRequest>({
    mutationFn: async (request) => {
      const response = await submitAnswer(request);
      return convertSubmitResponseDtoToUi(response);
    },
    onSuccess: (_, variables) => {
      // Invalidate the next question query for this graph to refetch
      queryClient.invalidateQueries({ queryKey: ["nextQuestion", variables.graph_id] });
    },
  });
}
