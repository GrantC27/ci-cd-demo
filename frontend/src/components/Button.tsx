
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      {...props}
      className={`
        px-8 py-3 bg-primary hover:bg-primary-dark text-white font-semibold 
        rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out 
        focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-opacity-75
        disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
        flex items-center justify-center space-x-2
        ${className}
      `}
    >
      {children}
    </button>
  );
};
