// Quiz type definitions
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

export type QuizStatus = "in_progress" | "completed" | "cancelled";

export interface QuizAttemptResponseDTO {
  attempt_id: string;
  user_id: string;
  course_id: string;
  question_num: number;
  status: QuizStatus;
  score: number | null;
  created_at: string;
  questions: AnyQuestionDTO[];
}

// export interface QuizAttemptResponseDTO {
//   attempt_id: string;
//   questions: AnyQuestionDTO[];
// }

export interface QuizMultipleChoiceQuestionUI {
  questionId: string;
  questionType: "multiple_choice";
  text: string;
  difficulty: QuestionDifficulty;
  options: string[];
  correctAnswer?: number; // Optional - not available when fetching active quiz
}

export interface QuizFillInTheBlankQuestionUI {
  questionId: string;
  questionType: "fill_in_the_blank";
  text: string;
  difficulty: QuestionDifficulty;
}

export interface QuizCalculationQuestionUI {
  questionId: string;
  questionType: "calculation";
  text: string;
  difficulty: QuestionDifficulty;
}

export type AnyQuizQuestionUI =
  | QuizMultipleChoiceQuestionUI
  | QuizFillInTheBlankQuestionUI
  | QuizCalculationQuestionUI;

export interface QuizAttemptUI {
  attemptId: string;
  courseId: string;
  questionNum: number;
  status: QuizStatus;
  questions: AnyQuizQuestionUI[];
}

export interface QuizStartRequest {
  question_num: number;
}


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

export interface QuizSubmissionRequest {
  answers: ClientAnswerInput[];
}

export interface QuizSubmissionResponse {
  attempt_id: string;
  message: string
}

export interface StartQuizInput {
  courseId: string;
  questionNum: number;
}

export interface SubmitQuizInput {
  attemptId: string;
  answers: ClientAnswerInput[];
}

export interface ApiError {
  message: string;
  detail?: string;
}