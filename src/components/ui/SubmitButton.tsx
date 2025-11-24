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
  className = "",
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      {...props}
      disabled={isLoading || props.disabled}
      className={`btn-primary btn-lg w-full ${className}`}
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
