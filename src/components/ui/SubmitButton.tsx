import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function SubmitButton({
  isLoading,
  loadingText = "Loading ...",
  children,
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      {...props}
      disabled={isLoading || props.disabled}
      className="w-full bg-blue-700 dark:bg-white dark:text-gray-800 text-white py-3 rounded-lg font-medium hover:bg-blue-800 dark:hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
