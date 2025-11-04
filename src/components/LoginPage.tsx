import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react"
import { InputField } from "./ui/InputField";
import { PasswordInput } from "./ui/PasswordInput";
import { SubmitButton } from "./ui/SubmitButton";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

// FIXME: Check and create proper theme in in tailwind so that the colors are consistent

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  //   const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Login Information", formData);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert(`Successfully logged in with email: ${formData.email}`);
    } catch (error) {
      console.error("Failed to login", error);
    } finally {
      setIsLoading(false);
    }
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
      <div className="bg-white dark:bg-black rounded-2xl shadow-2xl p-8 space-y-6 backdrop-blur-sm">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-300"> Login </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {" "}
            Please fill your account information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField
            className="dark:placeholder-gray-400 placeholder-gray-500 text-gray-900 dark:text-gray-100"
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
            className="dark:placeholder-gray-400 placeholder-gray-500 text-gray-900 dark:text-gray-100"
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
                className="h-4 w-4 text-blue-600 dark:text-blue-300 focus:ring-blue-500 dark:focus:ring-blue-600 border-gray-300 rounded cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Remember Me
              </label>
            </div>
            <a
              href="https://google.com"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
            >
              Forgot your password?
            </a>
          </div>
          <SubmitButton isLoading={isLoading} loadingText="Logging in..." disabled={isLoading || !formData.email || !formData.password}>
            Login
          </SubmitButton>
        </form>
        <div className="text-center text-sm text-gray-600 dark:text-gray-300 pt-4">
          Don't have an account?{" "}
          <a
            href="#"
            className="font-medium text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:text-blue-500 transition-colors"
          >
            Register Now
          </a>
        </div>
      </div>
    </div>
  );
}
