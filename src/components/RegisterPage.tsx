import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { registerUser } from "../api/auth";
import type { RegistrationRequest } from "../api/auth";

import { InputField } from "./ui/InputField";
import { PasswordInput } from "./ui/PasswordInput";
import { SubmitButton } from "./ui/SubmitButton";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";

type RegisterFormState = RegistrationRequest & {
  confirmPassword: string;
};

export default function RegisterPage() {
  const [FormData, SetFormData] = useState<RegisterFormState>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [clientError, setClientError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: registerUser,

    onSuccess: (data) => {
      console.log("Registration successful!", data);
      alert(`User ${data.username} register Successfully`);
      //TODO: navigate to dashboard or some pages
    },

    onError: (error) => {
      console.error("Failed to register", error);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError(null);
    if (FormData.password !== FormData.confirmPassword) {
        setClientError("Password do not match. Please try again.")
        return;
    }
    const { confirmPassword, ...apiData } = FormData
    registerMutation.mutate(apiData);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    SetFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="w-full max-w-md">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">
            Register
          </h2>
          <p className="auth-subtitle">
            Create your new account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField
            label="Username"
            id="username"
            name="username"
            required
            value={FormData.username}
            onChange={handleInputChange}
            placeholder="Your Name"
          />
          <InputField
            label="Email"
            id="username"
            name="email"
            type="email"
            required
            value={FormData.email}
            onChange={handleInputChange}
            placeholder="you@email.com"
          />
          <PasswordInput
            label="Password"
            id="password"
            name="password"
            required
            value={FormData.password}
            onChange={handleInputChange}
            placeholder="..........."
          />
          <PasswordInput
          label="Confirm Password"
          id="confirmPassword"
          name="confirmPassword"
          required
          value={FormData.confirmPassword}
          onChange={handleInputChange}
          placeholder="..........."
          />
          {clientError && (
          <p className="form-error">
            {clientError}
          </p>
          )}

          <SubmitButton
            isLoading={registerMutation.isPending}
            loadingText="Registering..."
          >
            Create Account
          </SubmitButton>
          {registerMutation.isError && (
            <p className="form-error">
              Register Failed: {registerMutation.error.message}
            </p>
          )}
        </form>
        <div className="auth-footer">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium link-blue"
          >
            Login Now
          </Link>
        </div>
      </div>
    </div>
  );
}
