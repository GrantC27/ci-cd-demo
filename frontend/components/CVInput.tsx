import React, { useRef } from 'react';
import { DocumentTextIcon, FileUploadIcon, TrashIcon, XCircleIcon } from './Icons'; // Assuming FileUploadIcon and TrashIcon are added to Icons.tsx

interface CVInputProps {
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export const CVInput: React.FC<CVInputProps> = ({ selectedFile, onFileChange, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor="cv-file-input" className="text-lg font-semibold text-primary-dark flex items-center">
        <DocumentTextIcon className="h-6 w-6 mr-2 text-primary" />
        Your Current CV
      </label>
      <p className="text-sm text-neutral-dark mb-1">Upload your CV (PDF, DOC, or DOCX format).</p>
      
      <input
        type="file"
        id="cv-file-input"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        disabled={disabled}
        aria-label="Upload your CV file"
      />

      {!selectedFile ? (
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={disabled}
          className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-DEFAULT hover:border-primary-light rounded-md cursor-pointer transition-colors duration-150 ease-in-out disabled:bg-neutral/50 disabled:cursor-not-allowed disabled:hover:border-neutral-DEFAULT"
          aria-describedby="file-upload-instructions"
        >
          <FileUploadIcon className="h-10 w-10 text-primary mb-2" />
          <span className="text-primary font-medium">Click to upload CV</span>
          <span className="text-xs text-neutral-dark mt-1">PDF, DOC, DOCX up to 10MB</span>
        </button>
      ) : (
        <div className="w-full flex items-center justify-between p-3 border border-green-500 bg-green-50 rounded-md shadow-sm">
          <div className="flex items-center space-x-2 overflow-hidden">
            <DocumentTextIcon className="h-5 w-5 text-green-700 flex-shrink-0" />
            <span className="text-sm text-green-800 truncate" title={selectedFile.name}>
              {selectedFile.name}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            disabled={disabled}
            className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
            aria-label="Remove selected CV file"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      <div id="file-upload-instructions" className="sr-only">Supports PDF, DOC, and DOCX file formats.</div>
    </div>
  );
};