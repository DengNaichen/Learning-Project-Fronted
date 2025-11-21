import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import type { LoginRequest } from "../types/auth";
import { AuthLayout } from "./AuthLayout";
import { SocialLoginButtons } from "./SocialLoginButtons";

interface LoginFormData extends LoginRequest {
  rememberMe: boolean;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: loginUser,

    onSuccess: (data) => {
      console.log("Login successful!", data.access_token);
      localStorage.setItem("accessToken", data.access_token);
      navigate("/notes", { replace: true });
    },
    onError: (error) => {
      console.error("Failed to login", error);
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
    });
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    console.log({ name, value, type, checked });

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <AuthLayout>
      <div className="flex w-full max-w-md flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap justify-between gap-3 px-4">
            <p className="text-text-primary dark:text-text-primary-dark text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
              Welcome Back
            </p>
          </div>

          {/* Social Logins */}
          <SocialLoginButtons />

          {/* Divider */}
          <p className="text-text-secondary dark:text-text-secondary-dark text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
            OR
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4">
            <div className="flex flex-col gap-1">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                className="input"
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                className="input"
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
              />
            </div>

            <a
              href="#"
              className="link text-sm font-medium text-right"
            >
              Forgot your password?
            </a>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-primary btn-lg w-full mt-4"
            >
              <span className="truncate">
                {loginMutation.isPending ? "Logging in..." : "Log In"}
              </span>
            </button>

            {loginMutation.isError && (
              <p className="form-error text-center">
                {loginMutation.error.message}
              </p>
            )}
          </form>

          <p className="text-center text-xs text-text-secondary dark:text-text-secondary-dark px-4">
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
      </div>
    </AuthLayout>
  );
}
