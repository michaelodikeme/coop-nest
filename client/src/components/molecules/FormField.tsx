import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  register,
  error,
  required,
  type = 'text',
  ...props
}) => {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        type={type}
        {...register(name)}
        {...props}
        className={`
          block w-full rounded-md border-gray-300 shadow-sm
          focus:border-primary-500 focus:ring-primary-500 sm:text-sm
          ${error ? 'border-red-300' : ''}
        `}
        aria-invalid={error ? 'true' : 'false'}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">{error.message}</p>
      )}
    </div>
  );
};

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  options: { value: string; label: string }[];
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  register,
  error,
  required,
  options,
  ...props
}) => {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={name}
        {...register(name)}
        {...props}
        className={`
          block w-full rounded-md border-gray-300 shadow-sm
          focus:border-primary-500 focus:ring-primary-500 sm:text-sm
          ${error ? 'border-red-300' : ''}
        `}
      >
        <option value="">Select {label}</option>
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
};

interface TextAreaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  rows?: number;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  name,
  register,
  error,
  required,
  rows = 3,
  ...props
}) => {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={name}
        rows={rows}
        {...register(name)}
        {...props}
        className={`
          block w-full rounded-md border-gray-300 shadow-sm
          focus:border-primary-500 focus:ring-primary-500 sm:text-sm
          ${error ? 'border-red-300' : ''}
        `}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
};
