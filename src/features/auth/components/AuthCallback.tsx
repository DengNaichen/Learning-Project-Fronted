import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("AuthCallback: Processing OAuth callback...");
        console.log("Current URL:", window.location.href);
        
        // Check if there's a hash fragment (OAuth callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        console.log("Hash params:", {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
        });

        // Wait a bit for Supabase to process the callback
        await new Promise(resolve => setTimeout(resolve, 100));

        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log("AuthCallback: Session retrieved:", session);
        console.log("AuthCallback: Error:", error);

        if (error) {
          console.error("AuthCallback: Error getting session:", error);
          setError(error.message);
          setTimeout(() => navigate("/", { replace: true }), 2000);
          return;
        }

        if (session) {
          console.log("AuthCallback: Session found, navigating to /graphs");
          // Store access token in localStorage for API calls
          if (session.access_token) {
            localStorage.setItem("accessToken", session.access_token);
            console.log("Access token stored in localStorage");
          }
          navigate("/graphs", { replace: true });
        } else {
          console.log("AuthCallback: No session found, navigating to /");
          navigate("/", { replace: true });
        }
      } catch (err) {
        console.error("AuthCallback: Unexpected error:", err);
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
