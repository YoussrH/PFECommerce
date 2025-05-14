import React from 'react';

export default function FormInputs({ title, label, register, errors }) {
  return (
    <div className="sm:col-span-2">
      <label htmlFor={title} className="block mb-2 text-sm font-medium text-gray-900">
        {label}
      </label>
      <input
        type="text"
        id={title}
        autoComplete="given-name"
        {...register(title, { required: `${label} est requis` })}
        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-100 block w-full p-2.5"
        placeholder={`Saisir ${label}`}
      />
      {errors[title] && <p className="text-red-500 text-sm">{errors[title]?.message}</p>}
    </div>
  );
}
