// components/ui/multi-select.jsx
"use client"
import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleItem = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className="w-full flex justify-between items-center p-2 border rounded-md bg-background hover:bg-accent"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selected.length > 0 
            ? `${selected.length} selected` 
            : placeholder}
        </span>
        <span className="ml-2">▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.map(option => (
            <div 
              key={option.value}
              className={cn(
                "flex items-center p-2 hover:bg-accent cursor-pointer",
                selected.includes(option.value) && 'bg-accent'
              )}
              onClick={() => toggleItem(option.value)}
            >
              <Check 
                className={cn(
                  "mr-2 h-4 w-4",
                  selected.includes(option.value) 
                    ? "opacity-100" 
                    : "opacity-0"
                )}
              />
              <span className="truncate">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}