import { useState } from "react";
import { SocialLoginButtons } from "./SocialLoginButtons";
import { supabase } from "../../../lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      console.log("Login successful!", data);
      console.log("Session:", data.session);
      console.log("User:", data.user);

      onClose();
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Login Failed, Please Try Again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) throw error;



      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration Failed, Please Try Again");
    } finally {
      setIsLoading(false);
    }
  };

  const switchToLogin = () => {
    setMode("login");
    setError(null);
  };

  const switchToRegister = () => {
    setMode("register");
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {mode === "login" ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">
                Welcome Back
              </h2>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                Sign in to your account
              </p>
            </div>

            <SocialLoginButtons />

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                OR
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="form-label" htmlFor="email">
                  Email Address
                </label>
                <input
                  className="input"
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  className="input"
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary btn-lg w-full"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="text-center text-sm text-text-secondary dark:text-text-secondary-dark">
              Don't have an account?{" "}
              <button
                onClick={switchToRegister}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </button>
            </p>

            <p className="text-center text-xs text-text-secondary dark:text-text-secondary-dark">
              By continuing, you agree to our{" "}
              <a className="link font-medium" href="#">
                Terms of Service
              </a>{" "}
              and{" "}
              <a className="link font-medium" href="#">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">
                Create Account
              </h2>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                Sign up to get started
              </p>
            </div>

            <SocialLoginButtons />

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                OR
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="form-label" htmlFor="email">
                  Email Address
                </label>
                <input
                  className="input"
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  className="input"
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  className="input"
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary btn-lg w-full"
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="text-center text-sm text-text-secondary dark:text-text-secondary-dark">
              Already have an account?{" "}
              <button
                onClick={switchToLogin}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>

            <p className="text-center text-xs text-text-secondary dark:text-text-secondary-dark">
              By continuing, you agree to our{" "}
              <a className="link font-medium" href="#">
                Terms of Service
              </a>{" "}
              and{" "}
              <a className="link font-medium" href="#">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
