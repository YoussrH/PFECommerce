import { useState } from "react";

const CustomDropdown = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const dropdownOptions = [{ value: "", label: "Choisissez parmi la liste" }, ...options];

  const handleSelect = (selectedValue) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div
        className="border p-2 rounded w-full cursor-pointer bg-white text-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        {dropdownOptions.find((option) => option.value === value)?.label || "Choose from the list"}
      </div>
      {isOpen && (
        <div
          className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-32 overflow-y-auto"
        >
          {dropdownOptions.map((option) => (
            <div
              key={option.value}
              className="p-2 hover:bg-gray-100 cursor-pointer text-xs"
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
