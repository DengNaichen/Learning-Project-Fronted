// Main Question Page component that handles getting next question
import { useGetNextQuestion } from "../hooks/useQuestion";
import { MCQQuestion } from "./MCQQuestion";

interface QuestionPageProps {
  graphId: string;
}

export const QuestionPage: React.FC<QuestionPageProps> = ({ graphId }) => {
  const { data, isLoading, isError, error, refetch } = useGetNextQuestion(graphId);

  const handleNextQuestion = () => {
    // Refetch the next question from the backend
    refetch();
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-intellectual-blue border-t-transparent mb-4 mx-auto"></div>
          <p className="text-neutral-text dark:text-white text-lg">Loading next question...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-neutral-text/10 rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-neutral-text dark:text-white mb-4">
            Something went wrong
          </h1>
          <p className="text-neutral-border dark:text-white/60 mb-6">
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
        <div className="max-w-md w-full bg-white dark:bg-neutral-text/10 rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-neutral-text dark:text-white mb-4">
            No Questions Available
          </h1>
          <p className="text-neutral-border dark:text-white/60 mb-6">
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
        <div className="max-w-md w-full bg-white dark:bg-neutral-text/10 rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">ℹ️</div>
          <h1 className="text-3xl font-bold text-neutral-text dark:text-white mb-4">
            Question Type Not Supported
          </h1>
          <p className="text-neutral-border dark:text-white/60 mb-6">
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
