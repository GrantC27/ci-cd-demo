
import React from 'react';
import { ClipboardListIcon } from './Icons';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor="job-desc-input" className="text-lg font-semibold text-primary-dark flex items-center">
        <ClipboardListIcon className="h-6 w-6 mr-2 text-primary" />
        Target Job Description
      </label>
      <p className="text-sm text-neutral-dark mb-1">Paste the job description you are applying for.</p>
      <textarea
        id="job-desc-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the job description here..."
        rows={15}
        className="w-full p-3 border border-neutral rounded-md shadow-sm focus:ring-2 focus:ring-primary-light focus:border-primary-light transition-shadow duration-150 ease-in-out disabled:bg-neutral/50 disabled:cursor-not-allowed"
        disabled={disabled}
        aria-label="Target Job Description"
      />
    </div>
  );
};
