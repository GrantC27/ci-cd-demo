
import React from 'react';
import { AlertType } from '../types';
import { ExclamationIcon, CheckCircleIcon, InformationCircleIcon, XCircleIcon } from './Icons';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
  children?: React.ReactNode; // Added children prop
}

const alertStyles = {
  [AlertType.Error]: {
    bg: 'bg-red-100',
    border: 'border-red-500',
    text: 'text-red-700',
    icon: <XCircleIcon className="h-5 w-5 text-red-500" />
  },
  [AlertType.Success]: {
    bg: 'bg-green-100',
    border: 'border-green-500',
    text: 'text-green-700',
    icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
  },
  [AlertType.Warning]: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-500',
    text: 'text-yellow-700',
    icon: <ExclamationIcon className="h-5 w-5 text-yellow-500" />
  },
  [AlertType.Info]: {
    bg: 'bg-blue-100',
    border: 'border-blue-500',
    text: 'text-blue-700',
    icon: <InformationCircleIcon className="h-5 w-5 text-blue-500" />
  },
};

export const Alert: React.FC<AlertProps> = ({ type, message, onClose, children }) => {
  const styles = alertStyles[type];

  return (
    <div className={`p-4 mb-6 border-l-4 rounded-md shadow ${styles.bg} ${styles.border}`} role="alert">
      <div className="flex">
        <div className="flex-shrink-0 pt-0.5"> {/* Adjusted for icon alignment */}
          {styles.icon}
        </div>
        <div className="ml-3 flex-grow"> {/* Added flex-grow */}
          <p className={`text-sm ${styles.text}`}>{message}</p>
          {children && <div className="mt-2">{children}</div>} {/* Render children */}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 ${styles.text} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.bg} focus:ring-offset-${type}-50 focus:ring-${type}-600`}
                aria-label="Dismiss"
              >
                <span className="sr-only">Dismiss</span>
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
