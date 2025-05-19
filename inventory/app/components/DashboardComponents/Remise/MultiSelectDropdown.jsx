// components/MultiSelectDropdown.js
"use client";

import { useState, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

const MultiSelectDropdown = ({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  className = "",
  disabled = false,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (option) => {
    const isSelected = selected.some(item => item.value === option.value);
    if (isSelected) {
      onChange(selected.filter(item => item.value !== option.value));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (value, e) => {
    e.stopPropagation();
    onChange(selected.filter(item => item.value !== value));
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`flex items-center justify-between p-2 border rounded-md bg-background text-sm cursor-pointer hover:border-primary ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 overflow-hidden">
          {selected.length > 0 ? (
            selected.map(item => (
              <span
                key={item.value}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-accent rounded-full"
              >
                {item.label}
                <button
                  type="button"
                  onClick={(e) => removeOption(item.value, e)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </span>
            ))
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-background border-b">
            <input
              type="text"
              placeholder="Search..."
              className="w-full p-1 text-sm border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No options found
            </div>
          ) : (
            filteredOptions.map(option => (
              <div
                key={option.value}
                className={`p-2 text-sm cursor-pointer flex items-center ${
                  selected.some(s => s.value === option.value)
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                }`}
                onClick={() => toggleOption(option)}
              >
                <span className="mr-2">
                  {selected.some(s => s.value === option.value) && (
                    <Check className="h-4 w-4" />
                  )}
                </span>
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;