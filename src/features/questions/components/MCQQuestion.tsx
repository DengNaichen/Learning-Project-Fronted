// MCQ Question component for single question display
import { useState } from "react";
import { MathText } from "./MathText";
import { useSubmitAnswer } from "../hooks/useQuestion";
import type { MultipleChoiceQuestionUI } from "../types/question";

interface MCQQuestionProps {
  question: MultipleChoiceQuestionUI;
  nodeId: string | null;
  selectionReason: string;
  priorityScore: number | null;
  graphId: string;
  onNextQuestion?: () => void;
}

export const MCQQuestion: React.FC<MCQQuestionProps> = ({
  question,
  graphId,
  onNextQuestion,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submitAnswerMutation = useSubmitAnswer();

  const handleAnswerSelect = (optionIndex: number) => {
    if (!isSubmitted) {
      setSelectedAnswer(optionIndex);
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) return;

    try {
      await submitAnswerMutation.mutateAsync({
        question_id: question.questionId,
        user_answer: {
          question_type: "multiple_choice",
          selected_option: selectedAnswer,
        },
        graph_id: graphId,
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error("Failed to submit answer:", error);
    }
  };

  const handleNextQuestion = () => {
    // Reset state for next question
    setSelectedAnswer(null);
    setIsSubmitted(false);
    onNextQuestion?.();
  };

  const isCorrect = submitAnswerMutation.data?.isCorrect;

  return (
    <div className="flex flex-col gap-6 container mx-auto px-4">
      {/* Question Card */}
      <div className="p-0">
        <div className="flex flex-col items-stretch justify-start rounded-xl shadow-lg bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700">
          <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-4 p-6">
            <div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-normal leading-normal mb-2">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  question.difficulty === "easy"
                    ? "bg-green-500/20 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                    : question.difficulty === "medium"
                    ? "bg-yellow-400/20 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-400"
                    : "bg-red-500/20 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                }`}>
                  {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                </span>
              </p>
              <MathText
                text={question.text}
                className="text-xl font-bold leading-tight tracking-[-0.015em] text-text-primary-light dark:text-text-primary-dark"
              />
            </div>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-base font-normal leading-normal">
              Select the correct answer from the options below.
            </p>
          </div>
        </div>
      </div>

      {/* RadioList (Answers) */}
      <div className="flex flex-col gap-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;

          let labelClass = "flex items-center gap-4 rounded-xl p-4 cursor-pointer transition-all ";
          let showFeedback = false;
          let feedbackText = "";
          let feedbackClass = "";

          if (!isSubmitted) {
            // Before submission
            if (isSelected) {
              labelClass += "border-2 border-primary bg-primary/10 dark:bg-primary/20";
            } else {
              labelClass += "border border-solid border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark hover:border-primary/50 dark:hover:border-primary";
            }
          } else {
            // After submission
            if (isSelected && isCorrect) {
              labelClass += "border-2 border-green-500 bg-green-500/10 dark:bg-green-500/20";
              showFeedback = true;
              feedbackText = "Correct!";
              feedbackClass = "text-sm font-bold text-green-600 dark:text-green-400";
            } else if (isSelected && !isCorrect) {
              labelClass += "border-2 border-red-500 bg-red-500/10 dark:bg-red-500/20";
              showFeedback = true;
              feedbackText = "Incorrect";
              feedbackClass = "text-sm font-bold text-red-600 dark:text-red-400";
            } else {
              labelClass += "border border-solid border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark opacity-60";
            }
          }

          return (
            <label key={index} className={labelClass}>
              <input
                checked={isSelected}
                onChange={() => handleAnswerSelect(index)}
                disabled={isSubmitted}
                className="h-5 w-5 border-2 border-gray-400 dark:border-gray-500 bg-transparent text-transparent checked:border-primary checked:bg-[image:var(--radio-dot-svg)] focus:outline-none focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
                style={{
                  '--radio-dot-svg': "url('data:image/svg+xml,%3csvg viewBox=%270 0 16 16%27 fill=%27rgb(74,144,226)%27 xmlns=%27http://www.w3.org/2000/svg%27%3e%3ccircle cx=%278%27 cy=%278%27 r=%274%27/%3e%3c/svg%3e')"
                } as React.CSSProperties}
                name="quiz-question"
                type="radio"
              />
              <div className="flex grow flex-col">
                <MathText text={option} className="font-medium text-text-primary-light dark:text-text-primary-dark" />
              </div>
              {showFeedback && (
                <span className={feedbackClass}>{feedbackText}</span>
              )}
            </label>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 mt-2">
        {!isSubmitted ? (
          <>
            <button
              onClick={handleNextQuestion}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-gray-100 dark:bg-gray-800 text-text-primary-light dark:text-text-primary-dark text-sm font-medium leading-normal hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="truncate">Skip</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null || submitAnswerMutation.isPending}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-primary text-white text-sm font-bold leading-normal hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="truncate">
                {submitAnswerMutation.isPending ? "Submitting..." : "Submit Answer"}
              </span>
            </button>
          </>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-primary text-white text-sm font-bold leading-normal hover:bg-primary/90 transition-colors"
          >
            <span className="truncate">Next Question</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {submitAnswerMutation.isError && (
        <div className="mt-2">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-6 py-3 rounded-xl text-sm">
            Error: {submitAnswerMutation.error.message}
          </div>
        </div>
      )}
    </div>
  );
};
