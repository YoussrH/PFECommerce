"use client";
import React from "react";

const PrefixCheckbox = ({ formData, setFormData }) => {
  const options = ["Madame","Monsieur","Mlle"];

  return (
    
    <div className="w-64 mx-auto">
      <label className="block text-black font-medium my-2 text-xs">
        Civilité <span className="text-yellow-500">*</span>
      </label>
      <div className="flex items-center space-x-4">
        {options.map((option) => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="prefix"
              value={option}
              checked={formData.prefix === option}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  prefix: e.target.value,
                })
              }
              className="hidden"
              required
            />
            <div
              className={`h-4 w-4 border-2 rounded-full flex items-center justify-center transition-all ${
                formData.prefix === option ? "border-black bg-black" : "border-gray-400"
              }`}
            >
              {formData.prefix === option && <div className="h-2 w-2 bg-white rounded-full"></div>}
            </div>
            <span className="text-xs text-black">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default PrefixCheckbox;
