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
import { useQuery, useMutation } from "@tanstack/react-query";

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

export function useGetNextQuestion(graphId: string | undefined, isOwner: boolean = false) {
  return useQuery<NextQuestionResponseDTO, Error, NextQuestionResponseUI>({
    queryKey: ["nextQuestion", graphId, isOwner],
    queryFn: () => getNextQuestion(graphId!, isOwner),
    select: convertNextQuestionDtoToUi,
    enabled: !!graphId,
  });
}

function convertSubmitResponseDtoToUi(dto: SingleAnswerSubmitResponseDTO): SingleAnswerSubmitResponseUI {
  return {
    answerId: dto.answer_id,
    isCorrect: dto.is_correct,
    masteryUpdated: dto.mastery_updated,
    correctAnswer: dto.correct_answer,
  };
}

export function useSubmitAnswer() {
  return useMutation<SingleAnswerSubmitResponseUI, Error, SingleAnswerSubmitRequest>({
    mutationFn: async (request) => {
      const response = await submitAnswer(request);
      return convertSubmitResponseDtoToUi(response);
    },
    // 不在这里 invalidate，让用户点击 "Next Question" 时才获取新问题
  });
}
