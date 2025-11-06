// Export quiz components
export { QuizPage } from "./components/QuizPage";
export { MCQQuiz } from "./components/MCQQuiz";
export { MathText } from "./components/MathText";

// Export hooks
export { useStartQuiz, useSubmitQuiz, useGetQuizAttempt } from "./hooks/useQuiz";

// Export types
export type {
  QuizMultipleChoiceQuestionUI,
  QuizAttemptUI,
  ClientAnswerInput,
  MultipleChoiceAnswer,
  QuizStatus,
} from "./types/quiz";
