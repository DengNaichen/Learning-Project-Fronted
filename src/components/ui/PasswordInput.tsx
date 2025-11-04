import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FormField } from "./FormField";
import { Input } from "./Input";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export function PasswordInput({ label, id, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <FormField label={label} id={id}>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          className="pr-12"
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    </FormField>
  );
}
