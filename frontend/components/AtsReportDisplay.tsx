
import React from 'react';
import { ChartBarIcon } from './Icons'; // Or another relevant icon

interface AtsReportDisplayProps {
  title: string;
  reportText: string | null;
}

export const AtsReportDisplay: React.FC<AtsReportDisplayProps> = ({ title, reportText }) => {
  if (!reportText) {
    return null; // Or some placeholder if needed
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-neutral-DEFAULT">
      <h3 className="text-lg font-semibold text-primary-dark mb-3 flex items-center">
        <ChartBarIcon className="h-6 w-6 mr-2 text-primary" /> 
        {title}
      </h3>
      <div 
        className="text-sm text-neutral-darker space-y-2 whitespace-pre-wrap bg-neutral-light/30 p-4 rounded-md shadow-inner"
        aria-label={`ATS Report for ${title}`}
      >
        {reportText}
      </div>
      <p className="mt-3 text-xs text-neutral-dark italic">
        This report is AI-generated and simulates a potential ATS perspective. Use it for insights, but always apply your judgment.
      </p>
    </div>
  );
};
