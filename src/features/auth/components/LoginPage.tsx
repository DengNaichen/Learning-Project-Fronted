import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import type { LoginRequest } from "../types/auth";
import { InputField } from "../../../components/ui/InputField";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import { SubmitButton } from "../../../components/ui/SubmitButton";

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
      navigate("/courses", { replace: true });
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
    <div className="w-full max-w-md">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Login</h2>
          <p className="auth-subtitle">Please fill your account information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField
            className="input-styled"
            label="Email"
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            placeholder="you@email.com"
          />
          <PasswordInput
            className="input-styled"
            label="Password"
            id="password"
            name="password"
            required
            value={formData.password}
            onChange={handleInputChange}
            placeholder="•••••••••••"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-light dark:text-primary-dark focus:ring-primary-light dark:focus:ring-primary-dark border-gray-300 rounded cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-text-primary-light dark:text-text-primary-dark cursor-pointer"
              >
                Remember Me
              </label>
            </div>
            <a
              href="https://google.com"
              className="text-sm font-medium link-primary"
            >
              Forgot your password?
            </a>
          </div>
          <SubmitButton
            isLoading={loginMutation.isPending}
            loadingText="Logging in..."
            // disabled={isLoading || !formData.email || !formData.password}
          >
            Login
          </SubmitButton>
          {loginMutation.isError && (
            <p className="form-error">{loginMutation.error.message}</p>
          )}
        </form>
        <div className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium link-primary">
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
}
