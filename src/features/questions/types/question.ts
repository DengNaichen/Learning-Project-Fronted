import type {
  CalculationAnswer,
  CalculationDetails,
  CalculationQuestion,
  FillInTheBlankAnswer,
  FillInTheBlankDetails,
  FillInTheBlankQuestion,
  MultipleChoiceAnswer,
  MultipleChoiceDetails,
  MultipleChoiceQuestion,
  NextQuestionResponse,
  QuestionDifficulty,
  QuestionType,
  SingleAnswerSubmitRequest,
  SingleAnswerSubmitResponse,
} from "../../../api/generated/model";

export type {
  QuestionType,
  QuestionDifficulty,
  MultipleChoiceAnswer,
  FillInTheBlankAnswer,
  CalculationAnswer,
  SingleAnswerSubmitRequest,
};

export type MultipleChoiceDetailsDTO = MultipleChoiceDetails;
export type FillInTheBlankDetailsDTO = FillInTheBlankDetails;
export type CalculationDetailsDTO = CalculationDetails;
export type QuestionDetailsDTO =
  | MultipleChoiceDetailsDTO
  | FillInTheBlankDetailsDTO
  | CalculationDetailsDTO;

export type MultipleChoiceQuestionDTO = MultipleChoiceQuestion;
export type FillInTheBlankQuestionDTO = FillInTheBlankQuestion;
export type CalculationQuestionDTO = CalculationQuestion;
export type AnyQuestionDTO =
  | MultipleChoiceQuestionDTO
  | FillInTheBlankQuestionDTO
  | CalculationQuestionDTO;

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

export type AnyAnswer =
  | MultipleChoiceAnswer
  | FillInTheBlankAnswer
  | CalculationAnswer;

export type ClientAnswerInput = {
  question_id: string;
  answer: AnyAnswer;
};

export interface ApiError {
  message: string;
  detail?: string;
}

export type NextQuestionResponseDTO = NextQuestionResponse;

export interface NextQuestionResponseUI {
  question: AnyQuestionUI | null;
  nodeId: string | null;
  selectionReason: string;
  priorityScore: number | null;
}

export type SingleAnswerSubmitRequestDTO = SingleAnswerSubmitRequest;
export type SingleAnswerSubmitResponseDTO = SingleAnswerSubmitResponse;

export interface SingleAnswerSubmitResponseUI {
  answerId: string;
  isCorrect: boolean;
  masteryUpdated: boolean;
  correctAnswer: AnyAnswer;
}
