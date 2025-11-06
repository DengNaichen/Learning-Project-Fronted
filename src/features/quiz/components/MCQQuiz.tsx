// MCQ Quiz component that works with backend API
import { useState } from "react";
import { MathText } from "./MathText";
import type {
  QuizMultipleChoiceQuestionUI,
  ClientAnswerInput,
  MultipleChoiceAnswer,
} from "../types/quiz";

interface MCQQuizProps {
  questions: QuizMultipleChoiceQuestionUI[];
  attemptId: string;
  onSubmit: (answers: ClientAnswerInput[]) => void;
  isSubmitting?: boolean;
}

interface QuizState {
  currentQuestionIndex: number;
  selectedAnswers: Map<string, number>; // questionId -> selected option index
  showFeedback: boolean;
}

export const MCQQuiz: React.FC<MCQQuizProps> = ({
  questions,
  onSubmit,
  isSubmitting = false,
}) => {
  const [state, setState] = useState<QuizState>({
    currentQuestionIndex: 0,
    selectedAnswers: new Map(),
    showFeedback: false,
  });

  const currentQuestion = questions[state.currentQuestionIndex];
  const currentAnswer = state.selectedAnswers.get(currentQuestion.questionId);
  const progress = ((state.currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = state.currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = (optionIndex: number) => {
    setState(prev => {
      const newAnswers = new Map(prev.selectedAnswers);
      newAnswers.set(currentQuestion.questionId, optionIndex);
      return {
        ...prev,
        selectedAnswers: newAnswers,
        showFeedback: true,
      };
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Submit quiz
      const answers: ClientAnswerInput[] = Array.from(state.selectedAnswers.entries()).map(
        ([questionId, selectedOption]) => ({
          question_id: questionId,
          answer: {
            question_type: "multiple_choice",
            selected_option: selectedOption,
          } as MultipleChoiceAnswer,
        })
      );
      onSubmit(answers);
    } else {
      // Move to next question
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        showFeedback: false,
      }));
    }
  };

  const handlePrevious = () => {
    if (state.currentQuestionIndex > 0) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
        showFeedback: !!prev.selectedAnswers.has(questions[prev.currentQuestionIndex - 1].questionId),
      }));
    }
  };

  const canProceed = currentAnswer !== undefined;
  const allQuestionsAnswered = state.selectedAnswers.size === questions.length;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {state.currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
        {/* Difficulty Badge */}
        <div className="mb-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              currentQuestion.difficulty === "easy"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : currentQuestion.difficulty === "medium"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
          </span>
        </div>

        {/* Question Text */}
        <MathText
          text={currentQuestion.text}
          className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-8"
        />

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = currentAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            const showSelection = state.showFeedback;

            let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all ";

            if (!showSelection) {
              // Before answering
              buttonClass += isSelected
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10";
            } else {
              // After answering - show correct/incorrect
              if (isSelected && isCorrect) {
                // Selected and correct
                buttonClass += "border-green-500 bg-green-50 dark:bg-green-900/20";
              } else if (isSelected && !isCorrect) {
                // Selected but wrong
                buttonClass += "border-red-500 bg-red-50 dark:bg-red-900/20";
              } else if (!isSelected && isCorrect) {
                // Not selected but is the correct answer
                buttonClass += "border-green-500 bg-green-50 dark:bg-green-900/20";
              } else {
                buttonClass += "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700";
              }
            }

            return (
              <button
                key={index}
                onClick={() => !showSelection && handleAnswerSelect(index)}
                disabled={showSelection}
                className={buttonClass}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <MathText
                    text={option}
                    className="flex-1 text-gray-900 dark:text-gray-100"
                  />
                  {showSelection && isCorrect && (
                    <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                  )}
                  {showSelection && isSelected && !isCorrect && (
                    <span className="text-red-600 dark:text-red-400 text-xl">✗</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handlePrevious}
          disabled={state.currentQuestionIndex === 0}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed || (isLastQuestion && !allQuestionsAnswered) || isSubmitting}
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            "Submitting..."
          ) : isLastQuestion ? (
            "Submit Quiz"
          ) : (
            "Next →"
          )}
        </button>
      </div>

      {/* Answer Progress */}
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Answered: {state.selectedAnswers.size} / {questions.length}
      </div>
    </div>
  );
};
