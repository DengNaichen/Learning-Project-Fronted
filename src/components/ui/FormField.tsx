import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  id: string;
  children: ReactNode;
}

export function FormField({ label, id, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </label>

      {children}
    </div>
  );
}
