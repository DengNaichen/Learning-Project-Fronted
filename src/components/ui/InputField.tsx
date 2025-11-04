import type { InputHTMLAttributes } from "react";
import { FormField } from "./FormField";
import { Input } from "./Input";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export function InputField({ label, id, ...props }: InputFieldProps) {
  return (
    <FormField label={label} id={id}>
        <Input id={id} {...props} />
    </FormField>
  );
}
