// Question type definitions
export type QuestionType =
  | "multiple_choice"
  | "fill_in_the_blank"
  | "calculation";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface MultipleChoiceDetailsDTO {
  question_type: "multiple_choice";
  options: string[];
  correct_answer: number;
}

export interface FillInTheBlankDetailsDTO {
  question_type: "fill_in_the_blank";
  expected_answer: string[];
}

export interface CalculationDetailsDTO {
  question_type: "calculation";
  expected_answer: string[];
  precision: number;
}

export type QuestionDetailsDTO =
  | MultipleChoiceDetailsDTO
  | FillInTheBlankDetailsDTO
  | CalculationDetailsDTO;

export interface BaseQuestionDTO {
  question_id: string;
  text: string;
  difficulty: QuestionDifficulty;
  knowledge_node_id: string;
}

export interface MultipleChoiceQuestionDTO extends BaseQuestionDTO {
  question_type: "multiple_choice";
  details: MultipleChoiceDetailsDTO;
}

export interface FillInTheBlankQuestionDTO extends BaseQuestionDTO {
  question_type: "fill_in_the_blank";
  details: FillInTheBlankDetailsDTO;
}

export interface CalculationQuestionDTO extends BaseQuestionDTO {
  question_type: "calculation";
  details: CalculationDetailsDTO;
}

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
  questionType: "fill_in_the_blank";
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

export interface MultipleChoiceAnswer {
  question_type: "multiple_choice";
  selected_option: number;
}

export interface FillInTheBlankAnswer {
  question_type: "fill_in_the_blank";
  text_answer: string;
}

export interface CalculationAnswer {
  question_type: "calculation";
  numeric_answer: number;
}

export type AnyAnswer =
  | MultipleChoiceAnswer
  | FillInTheBlankAnswer
  | CalculationAnswer;

export interface ClientAnswerInput {
  question_id: string;
  answer: AnyAnswer;
}

export interface ApiError {
  message: string;
  detail?: string;
}

// Next question recommendation response
export interface NextQuestionResponseDTO {
  question: AnyQuestionDTO | null;
  node_id: string | null;
  selection_reason: string;
  priority_score: number | null;
}

export interface NextQuestionResponseUI {
  question: AnyQuestionUI | null;
  nodeId: string | null;
  selectionReason: string;
  priorityScore: number | null;
}

// Single answer submission
export interface SingleAnswerSubmitRequest {
  question_id: string;
  user_answer: AnyAnswer;
  graph_id: string;
}

export interface SingleAnswerSubmitResponseDTO {
  answer_id: string;
  is_correct: boolean;
  mastery_updated: boolean;
  correct_answer: AnyAnswer;
}

export interface SingleAnswerSubmitResponseUI {
  answerId: string;
  isCorrect: boolean;
  masteryUpdated: boolean;
  correctAnswer: AnyAnswer;
}
