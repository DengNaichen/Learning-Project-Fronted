// Main Question Page component that handles getting next question
import { useGetNextQuestion } from "../hooks/useQuestion";
import { MCQQuestion } from "./MCQQuestion";

interface QuestionPageProps {
  graphId: string;
  isOwner?: boolean;
}

export const QuestionPage: React.FC<QuestionPageProps> = ({ graphId, isOwner = false }) => {
  const { data, isLoading, isError, error, refetch } = useGetNextQuestion(graphId, isOwner);

  const handleNextQuestion = () => {
    // Refetch the next question from the backend
    refetch();
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
          <p className="text-text-primary-light dark:text-text-primary-dark text-lg">Loading next question...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
            Something went wrong
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            {error instanceof Error ? error.message : "Failed to load next question"}
          </p>
        </div>
      </div>
    );
  }

  // No question available
  if (!data?.question) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
            No Questions Available
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            Reason: {data?.selectionReason || "Unknown"}
          </p>
        </div>
      </div>
    );
  }

  // Only show multiple choice questions
  if (data.question.questionType !== "multiple_choice") {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-6xl mb-4">ℹ️</div>
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
            Question Type Not Supported
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            Currently only multiple choice questions are supported.
          </p>
        </div>
      </div>
    );
  }

  // Show the question
  return (
    <MCQQuestion
      question={data.question}
      nodeId={data.nodeId}
      selectionReason={data.selectionReason}
      priorityScore={data.priorityScore}
      graphId={graphId}
      onNextQuestion={handleNextQuestion}
    />
  );
};
