// Main Quiz Page component that handles quiz lifecycle
import { useState } from "react";
import { useStartQuiz, useSubmitQuiz } from "../hooks/useQuiz";
import { MCQQuiz } from "./MCQQuiz";
import type { ClientAnswerInput, QuizMultipleChoiceQuestionUI } from "../types/quiz";

interface QuizPageProps {
  courseId: string;
  questionNum?: number;
}

type QuizPageState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "conflict" } // 409 - Active quiz exists
  | { type: "quiz"; attemptId: string; questions: QuizMultipleChoiceQuestionUI[] }
  | { type: "submitting"; attemptId: string; questions: QuizMultipleChoiceQuestionUI[] }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export const QuizPage: React.FC<QuizPageProps> = ({
  courseId,
  questionNum = 5
}) => {
  const [pageState, setPageState] = useState<QuizPageState>({ type: "idle" });

  const startQuizMutation = useStartQuiz();
  const submitQuizMutation = useSubmitQuiz();

  const handleStartQuiz = async () => {
    setPageState({ type: "loading" });

    try {
      const response = await startQuizMutation.mutateAsync({
        courseId,
        questionNum,
      });

      // Convert DTO to UI and filter only MCQ questions
      const allQuestions = response.questions
        .map((q) => {
          const baseQuestion = {
            questionId: q.question_id,
            text: q.text,
            difficulty: q.difficulty,
          };

          if (q.question_type === "multiple_choice") {
            return {
              ...baseQuestion,
              questionType: "multiple_choice" as const,
              options: q.details.options,
              correctAnswer: q.details.correct_answer,
            };
          }
          return null;
        })
        .filter((q): q is QuizMultipleChoiceQuestionUI & { correctAnswer: number } =>
          q !== null && q.correctAnswer !== undefined
        );

      if (allQuestions.length === 0) {
        setPageState({
          type: "error",
          message: "No multiple choice questions available for this course.",
        });
        return;
      }

      setPageState({
        type: "quiz",
        attemptId: response.attempt_id,
        questions: allQuestions,
      });
    } catch (error) {
      // Check if it's a 409 conflict error
      if (error instanceof Error && error.message.includes("active quiz attempt already exists")) {
        setPageState({ type: "conflict" });
      } else {
        setPageState({
          type: "error",
          message: error instanceof Error ? error.message : "Failed to start quiz",
        });
      }
    }
  };

  const handleSubmitQuiz = async (answers: ClientAnswerInput[]) => {
    if (pageState.type !== "quiz") return;

    setPageState({
      type: "submitting",
      attemptId: pageState.attemptId,
      questions: pageState.questions,
    });

    try {
      const response = await submitQuizMutation.mutateAsync({
        attemptId: pageState.attemptId,
        answers,
      });

      setPageState({
        type: "success",
        message: response.message,
      });
    } catch (error) {
      setPageState({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to submit quiz",
      });
    }
  };

  const handleRetry = () => {
    setPageState({ type: "idle" });
  };

  // Idle State - Start Quiz
  if (pageState.type === "idle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
            Ready to Start Quiz?
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
            This quiz contains {questionNum} multiple choice question{questionNum !== 1 ? 's' : ''}.
          </p>
          <button
            onClick={handleStartQuiz}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // Loading State
  if (pageState.type === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4 mx-auto"></div>
          <p className="text-white text-lg">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Conflict State - Active quiz exists
  if (pageState.type === "conflict") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Quiz Already in Progress
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You already have an active quiz attempt for this course. Please complete or cancel the existing quiz first.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Note: Contact your instructor if you need to reset your quiz progress.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Quiz State
  if (pageState.type === "quiz" || pageState.type === "submitting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <MCQQuiz
          questions={pageState.questions}
          attemptId={pageState.attemptId}
          onSubmit={handleSubmitQuiz}
          isSubmitting={pageState.type === "submitting"}
        />
      </div>
    );
  }

  // Success State
  if (pageState.type === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Quiz Submitted!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {pageState.message}
          </p>
          <button
            onClick={handleRetry}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take Another Quiz
          </button>
        </div>
      </div>
    );
  }

  // Error State
  if (pageState.type === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {pageState.message}
          </p>
          <button
            onClick={handleRetry}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
};
