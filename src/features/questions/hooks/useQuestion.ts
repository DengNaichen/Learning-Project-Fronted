import type {
  NextQuestionResponseDTO,
  NextQuestionResponseUI,
  AnyQuestionDTO,
  AnyQuestionUI,
  SingleAnswerSubmitRequestDTO,
  SingleAnswerSubmitResponseDTO,
  SingleAnswerSubmitResponseUI,
} from "../types/question";
import {
  getNextQuestionForEnrolledGraph,
  getNextQuestionForMyGraph,
  submitSingleAnswer,
} from "../../../api/backend";
import { useQuery, useMutation } from "@tanstack/react-query";

function convertQuestionDtoToUi(dto: AnyQuestionDTO): AnyQuestionUI {
  const questionId = dto.question_id;
  if (!questionId) {
    throw new Error("Question is missing an id");
  }

  const baseUiQuestion = {
    questionId,
    text: dto.text,
    difficulty: dto.difficulty,
  };

  const questionType = dto.question_type ?? dto.details?.question_type;

  switch (questionType) {
    case "multiple_choice": {
      if (!("options" in dto.details)) {
        throw new Error("Multiple choice question is missing options");
      }
      return {
        ...baseUiQuestion,
        questionType: "multiple_choice",
        options: dto.details.options,
      };
    }
    case "fill_blank":
      return {
        ...baseUiQuestion,
        questionType: "fill_blank",
      };
    case "calculation":
      return {
        ...baseUiQuestion,
        questionType: "calculation",
      };
    default:
      throw new Error(`Unknown question type: ${questionType}`);
  }
}

function convertNextQuestionDtoToUi(dto: NextQuestionResponseDTO): NextQuestionResponseUI {
  return {
    question: dto.question ? convertQuestionDtoToUi(dto.question) : null,
    nodeId: dto.node_id ?? null,
    selectionReason: dto.selection_reason,
    priorityScore: dto.priority_score ?? null,
  };
}

export function useGetNextQuestion(graphId: string | undefined, isOwner: boolean = false) {
  return useQuery<NextQuestionResponseDTO, Error, NextQuestionResponseUI>({
    queryKey: ["nextQuestion", graphId, isOwner],
    queryFn: () =>
      isOwner
        ? getNextQuestionForMyGraph(graphId!)
        : getNextQuestionForEnrolledGraph(graphId!),
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
  return useMutation<
    SingleAnswerSubmitResponseUI,
    Error,
    SingleAnswerSubmitRequestDTO
  >({
    mutationFn: async (request) => {
      const response = await submitSingleAnswer(request);
      return convertSubmitResponseDtoToUi(response);
    },
    // 不在这里 invalidate，让用户点击 "Next Question" 时才获取新问题
  });
}
