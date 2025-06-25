
import React from 'react';
import { APP_TITLE } from '../constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-darker text-neutral-light py-6 text-center">
      <div className="container mx-auto px-4">
        <p className="text-sm">&copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.</p>
        <p className="text-xs mt-1">Powered by AI - Always review generated content.</p>
      </div>
    </footer>
  );
};
