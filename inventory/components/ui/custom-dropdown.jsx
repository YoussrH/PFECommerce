// components/ui/custom-dropdown.jsx
"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming you have shadcn/ui installed and configured

export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  className,
}) {
  return (
    <Select
      value={value ? String(value) : ""} // Ensure value is a string, handle null/undefined
      onValueChange={(selectedValue) => onChange(selectedValue)}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}