
import React, { useState, useCallback } from 'react';
import { CheckCircleIcon, ClipboardCopyIcon, SparklesIcon } from './Icons';

interface TransformedCVDisplayProps {
  cvText: string;
}

export const TransformedCVDisplay: React.FC<TransformedCVDisplayProps> = ({ cvText }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cvText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      // You could add an error state/toast here
    });
  }, [cvText]);

  return (
    <div className="mt-8 p-6 bg-primary-light/5 border border-primary-light rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-xl font-semibold text-primary-dark flex items-center mb-2 sm:mb-0">
            <SparklesIcon className="h-7 w-7 mr-2 text-accent" />
            Your Optimized CV
        </h2>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-md shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50 disabled:opacity-50"
          disabled={!cvText}
        >
          {copied ? (
            <>
              <CheckCircleIcon className="h-5 w-5 mr-2" /> Copied!
            </>
          ) : (
            <>
              <ClipboardCopyIcon className="h-5 w-5 mr-2" /> Copy to Clipboard
            </>
          )}
        </button>
      </div>
      <textarea
        value={cvText}
        readOnly
        rows={20}
        className="w-full p-3 border border-neutral-DEFAULT rounded-md bg-white shadow-inner focus:outline-none"
        aria-label="Transformed CV"
      />
      <p className="mt-3 text-xs text-neutral-dark italic">
        Review the optimized CV carefully and make any necessary adjustments to ensure accuracy and reflect your voice.
      </p>
    </div>
  );
};
