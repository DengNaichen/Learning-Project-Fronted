import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import type { RegistrationRequest } from "../types/auth";
import { AuthLayout } from "./AuthLayout";
import { SocialLoginButtons } from "./SocialLoginButtons";

type RegisterFormState = RegistrationRequest & {
  confirmPassword: string;
};

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [clientError, setClientError] = useState<string | null>(null);

  const navigate = useNavigate();

  const registerMutation = useMutation({
    mutationFn: registerUser,

    onSuccess: (data) => {
      console.log("Registration successful!", data);
      alert(`User ${data.name} registered successfully!`);
      navigate("/login", { replace: true });
    },

    onError: (error) => {
      console.error("Failed to register", error);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError(null);
    if (formData.password !== formData.confirmPassword) {
      setClientError("Passwords do not match. Please try again.");
      return;
    }
    const { confirmPassword, ...apiData } = formData;
    registerMutation.mutate(apiData);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <AuthLayout>
      <div className="flex w-full max-w-md flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap justify-between gap-3 px-4">
            <p className="text-text-primary dark:text-text-primary-dark text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
              Create Account
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
              <label className="form-label" htmlFor="name">
                Username
              </label>
              <input
                className="input"
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your Name"
              />
            </div>

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

            <div className="flex flex-col gap-1">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                className="input"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
              />
            </div>

            {(clientError || registerMutation.isError) && (
              <p className="form-error text-center">
                {clientError || registerMutation.error?.message}
              </p>
            )}

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="btn-primary btn-lg w-full mt-4"
            >
              <span className="truncate">
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </span>
            </button>
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
