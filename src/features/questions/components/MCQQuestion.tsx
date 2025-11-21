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
    <div className="flex flex-col gap-6">
      {/* Question Card */}
      <div className="p-0">
        <div className="flex flex-col items-stretch justify-start rounded-xl shadow-md bg-white dark:bg-neutral-text/10">
          {/* Question Header Image */}
          <div className="bg-gradient-to-r from-intellectual-blue/20 to-encouraging-green/20 dark:from-intellectual-blue/10 dark:to-encouraging-green/10 aspect-[21/9] rounded-t-xl flex items-center justify-center">
            <div className="text-neutral-border/40 dark:text-white/20 text-6xl">
              {question.difficulty === "easy" ? "📚" : question.difficulty === "medium" ? "🎯" : "🚀"}
            </div>
          </div>

          <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-4 p-6">
            <div>
              <p className="text-neutral-border dark:text-white/60 text-sm font-normal leading-normal mb-2">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  question.difficulty === "easy"
                    ? "bg-encouraging-green/20 text-encouraging-green dark:bg-encouraging-green/10"
                    : question.difficulty === "medium"
                    ? "bg-yellow-400/20 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-400"
                    : "bg-soft-red/20 text-soft-red dark:bg-soft-red/10"
                }`}>
                  {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                </span>
              </p>
              <MathText
                text={question.text}
                className="text-xl font-bold leading-tight tracking-[-0.015em] text-neutral-text dark:text-white"
              />
            </div>
            <p className="text-neutral-border dark:text-white/60 text-base font-normal leading-normal">
              Select the correct answer from the options below.
            </p>
          </div>
        </div>
      </div>

      {/* RadioList (Answers) */}
      <div className="flex flex-col gap-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;

          let labelClass = "flex items-center gap-4 rounded-lg p-4 cursor-pointer transition-all ";
          let showFeedback = false;
          let feedbackText = "";
          let feedbackClass = "";

          if (!isSubmitted) {
            // Before submission
            if (isSelected) {
              labelClass += "border-2 border-intellectual-blue bg-intellectual-blue/10 dark:bg-intellectual-blue/20";
            } else {
              labelClass += "border border-solid border-neutral-bg dark:border-neutral-text/20 bg-white dark:bg-neutral-text/10 hover:border-intellectual-blue/50 dark:hover:border-intellectual-blue";
            }
          } else {
            // After submission
            if (isSelected && isCorrect) {
              labelClass += "border-2 border-encouraging-green bg-encouraging-green/10 dark:bg-encouraging-green/20";
              showFeedback = true;
              feedbackText = "Correct!";
              feedbackClass = "text-sm font-bold text-encouraging-green";
            } else if (isSelected && !isCorrect) {
              labelClass += "border-2 border-soft-red bg-soft-red/10 dark:bg-soft-red/20";
              showFeedback = true;
              feedbackText = "Incorrect";
              feedbackClass = "text-sm font-bold text-soft-red";
            } else {
              labelClass += "border border-solid border-neutral-bg dark:border-neutral-text/20 bg-white dark:bg-neutral-text/10 opacity-60";
            }
          }

          return (
            <label key={index} className={labelClass}>
              <input
                checked={isSelected}
                onChange={() => handleAnswerSelect(index)}
                disabled={isSubmitted}
                className="h-5 w-5 border-2 border-neutral-border bg-transparent text-transparent checked:border-intellectual-blue checked:bg-[image:var(--radio-dot-svg)] focus:outline-none focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
                style={{
                  '--radio-dot-svg': "url('data:image/svg+xml,%3csvg viewBox=%270 0 16 16%27 fill=%27rgb(74,144,226)%27 xmlns=%27http://www.w3.org/2000/svg%27%3e%3ccircle cx=%278%27 cy=%278%27 r=%274%27/%3e%3c/svg%3e')"
                } as React.CSSProperties}
                name="quiz-question"
                type="radio"
              />
              <div className="flex grow flex-col">
                <MathText text={option} className="font-medium text-neutral-text dark:text-white" />
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
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-neutral-bg dark:bg-neutral-text/20 text-neutral-text dark:text-white text-sm font-medium leading-normal hover:bg-neutral-border/20 dark:hover:bg-neutral-text/30"
            >
              <span className="truncate">Skip</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null || submitAnswerMutation.isPending}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-intellectual-blue text-white text-sm font-bold leading-normal hover:bg-intellectual-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate">
                {submitAnswerMutation.isPending ? "Submitting..." : "Submit Answer"}
              </span>
            </button>
          </>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-intellectual-blue text-white text-sm font-bold leading-normal hover:bg-intellectual-blue/90"
          >
            <span className="truncate">Next Question</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {submitAnswerMutation.isError && (
        <div className="mt-2">
          <div className="bg-soft-red/10 dark:bg-soft-red/20 text-soft-red px-6 py-3 rounded-lg text-sm">
            Error: {submitAnswerMutation.error.message}
          </div>
        </div>
      )}
    </div>
  );
};
