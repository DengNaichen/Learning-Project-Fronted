// Export question components
export { QuestionPage } from "./components/QuestionPage";
export { MCQQuestion } from "./components/MCQQuestion";
export { MathText } from "./components/MathText";

// Export hooks
export { useGetNextQuestion, useSubmitAnswer } from "./hooks/useQuestion";

// Export types
export type {
  MultipleChoiceQuestionUI,
  NextQuestionResponseUI,
  SingleAnswerSubmitRequest,
  SingleAnswerSubmitResponseUI,
  ClientAnswerInput,
  MultipleChoiceAnswer,
  AnyQuestionUI,
  AnyAnswer,
} from "./types/question";
