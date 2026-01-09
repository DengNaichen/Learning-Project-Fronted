import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession } from "../supabaseAuth";

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await getSession();

        if (error) {
          setError(error.message);
          setTimeout(() => navigate("/", { replace: true }), 2000);
          return;
        }

        if (data.session) {
          navigate("/graphs", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed");
        setTimeout(() => navigate("/", { replace: true }), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-600 dark:text-red-400">
            Authentication error: {error}
          </p>
          <p className="text-text-secondary dark:text-text-secondary-dark">
            Redirecting to home...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-text-secondary dark:text-text-primary-dark">
          Signing you in...
        </p>
      </div>
    </div>
  );
}
