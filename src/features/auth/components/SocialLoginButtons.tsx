import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export function SocialLoginButtons() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: "google" | "github") => {
    setIsLoading(provider);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      setIsLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-3">
      {/* Google Login */}
      <button
        type="button"
        onClick={() => handleSocialLogin("google")}
        disabled={!!isLoading}
        className="btn-secondary btn-md w-full gap-2 flex items-center justify-center"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_3033_335)">
            <path
              d="M21.9999 12.227C21.9999 11.39 21.9269 10.563 21.7839 9.764H12.2179V14.453H17.7129C17.4759 15.744 16.7939 16.857 15.8299 17.539V20.28H19.5319C21.1689 18.784 21.9999 16.66 21.9999 13.982C21.9999 13.39 21.9999 12.8 21.9999 12.227Z"
              fill="#4285F4"
            />
            <path
              d="M12.2179 22C15.0059 22 17.3689 21.05 19.5319 19.539L15.8299 16.79C14.8879 17.435 13.6609 17.832 12.2179 17.832C9.60488 17.832 7.39388 16.1 6.57088 13.784H2.74888V16.619C4.38588 19.839 8.01688 22 12.2179 22Z"
              fill="#34A853"
            />
            <path
              d="M6.57095 13.784C6.34695 13.139 6.21795 12.448 6.21795 11.737C6.21795 11.026 6.34695 10.335 6.57095 9.69L2.74895 6.855C1.52495 9.171 1.52495 11.832 2.74895 14.148L6.57095 13.784Z"
              fill="#FBBC05"
            />
            <path
              d="M12.2179 5.642C13.7229 5.642 15.1059 6.183 16.2049 7.21L19.6109 3.804C17.3689 1.69 15.0059 0.453 12.2179 0.453C8.01688 0.453 4.38588 2.614 2.74888 5.835L6.57088 8.67C7.39388 6.354 9.60488 4.642 12.2179 4.642V5.642Z"
              fill="#EA4335"
            />
          </g>
          <defs>
            <clipPath id="clip0_3033_335">
              <rect
                fill="white"
                height="21.547"
                transform="translate(1 0.453125)"
                width="21.547"
              />
            </clipPath>
          </defs>
        </svg>
        <span className="truncate">
          {isLoading === "google" ? "Loading..." : "Continue with Google"}
        </span>
      </button>

      {/* GitHub Login */}
      <button
        type="button"
        onClick={() => handleSocialLogin("github")}
        disabled={!!isLoading}
        className="btn-secondary btn-md w-full gap-2 flex items-center justify-center"
      >
        <svg
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12C2 16.425 4.86 20.165 8.84 21.49C9.484 21.602 9.696 21.218 9.696 20.886C9.696 20.586 9.684 19.743 9.679 18.735C7.039 19.23 6.367 17.934 6.16 17.388C6.043 17.073 5.512 16.098 5.122 15.864C4.805 15.681 4.213 15.144 5.092 15.13C5.902 15.117 6.49 15.9 6.685 16.182C7.575 17.688 9.043 17.256 9.733 16.953C9.814 16.362 10.056 15.951 10.327 15.72C8.259 15.498 6.048 14.706 6.048 11.2C6.048 10.107 6.43 9.228 7.035 8.55C6.939 8.316 6.648 7.425 7.126 6.273C7.126 6.273 7.891 6.021 9.658 7.2C10.378 7.005 11.184 6.906 12 6.906C12.816 6.906 13.622 7.005 14.342 7.2C16.109 6.021 16.874 6.273 16.874 6.273C17.352 7.425 17.061 8.316 16.965 8.55C17.57 9.228 17.952 10.107 17.952 11.2C17.952 14.718 15.741 15.498 13.673 15.72C14.01 16.002 14.327 16.53 14.327 17.355C14.327 18.543 14.315 19.488 14.315 19.818C14.315 20.154 14.516 20.358 15.168 20.247C19.141 18.915 22 15.18 22 12C22 6.477 17.523 2 12 2Z"
            fillRule="evenodd"
          />
        </svg>
        <span className="truncate">Continue with GitHub</span>
      </button>
    </div>
  );
}
