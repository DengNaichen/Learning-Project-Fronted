import { useState } from "react";
import type {FormEvent, ChangeEvent} from "react"
import { InputField } from "./ui/InputField";
import { PasswordInput } from "./ui/PasswordInput";
import { SubmitButton } from "./ui/SubmitButton";
// import { Eye, EyeOff, Loader2 } from "lucide-react";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

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

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 backdrop-blur-sm">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-900"> Login </h2>
            <p className="text-gray-500">
              {" "}
              Please fill your account information
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
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
              label="Password"
              id="password"
              name="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              placeholder="............"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 block text-sm text-gray-700 cursor-pointer"
                >
                  Remember Me
                </label>
              </div>
              <a
                href="#"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forget your password?
              </a>
            </div>
            <SubmitButton isLoading={isLoading} loadingText="Logging in...">
              Login
            </SubmitButton>
          </form>
          <div className="text-center text-sm text-gray-600 pt-4">
            Don't have an account?{" "}
            <a
              href="#"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Register Now
            </a>
          </div>
        </div>
    </div>
  );
}
