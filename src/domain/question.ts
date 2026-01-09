import type {
  CalculationAnswer,
  CalculationQuestion,
  FillInTheBlankAnswer,
  FillInTheBlankQuestion,
  MultipleChoiceAnswer,
  MultipleChoiceQuestion,
  NextQuestionResponse,
  QuestionDifficulty,
  SingleAnswerSubmitResponse,
} from "../api/generated/model";

export interface MultipleChoiceQuestionUI {
  questionId: string;
  questionType: "multiple_choice";
  text: string;
  difficulty: QuestionDifficulty;
  options: string[];
  correctAnswer?: number;
}

export interface FillInTheBlankQuestionUI {
  questionId: string;
  questionType: "fill_blank";
  text: string;
  difficulty: QuestionDifficulty;
}

export interface CalculationQuestionUI {
  questionId: string;
  questionType: "calculation";
  text: string;
  difficulty: QuestionDifficulty;
}

export type AnyQuestionUI =
  | MultipleChoiceQuestionUI
  | FillInTheBlankQuestionUI
  | CalculationQuestionUI;

export type AnyQuestionDTO =
  | MultipleChoiceQuestion
  | FillInTheBlankQuestion
  | CalculationQuestion;

export type AnyAnswer =
  | MultipleChoiceAnswer
  | FillInTheBlankAnswer
  | CalculationAnswer;

export interface NextQuestionResponseUI {
  question: AnyQuestionUI | null;
  nodeId: string | null;
  selectionReason: string;
  priorityScore: number | null;
}

export interface SingleAnswerSubmitResponseUI {
  answerId: string;
  isCorrect: boolean;
  masteryUpdated: boolean;
  correctAnswer: AnyAnswer;
}

export function mapQuestionToUi(dto: AnyQuestionDTO): AnyQuestionUI {
  const questionId = dto.question_id;
  if (!questionId) {
    throw new Error("Question is missing an id");
  }

  const questionType = dto.question_type ?? dto.details?.question_type;

  const baseUiQuestion = {
    questionId,
    text: dto.text,
    difficulty: dto.difficulty,
  };

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

export function mapNextQuestionToUi(
  dto: NextQuestionResponse
): NextQuestionResponseUI {
  return {
    question: dto.question ? mapQuestionToUi(dto.question) : null,
    nodeId: dto.node_id ?? null,
    selectionReason: dto.selection_reason,
    priorityScore: dto.priority_score ?? null,
  };
}

export function mapSubmitResponseToUi(
  dto: SingleAnswerSubmitResponse
): SingleAnswerSubmitResponseUI {
  return {
    answerId: dto.answer_id,
    isCorrect: dto.is_correct,
    masteryUpdated: dto.mastery_updated,
    correctAnswer: dto.correct_answer,
  };
}
