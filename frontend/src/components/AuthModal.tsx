
import React, { useState, FormEvent } from 'react';
import { Button } from './Button';
import { XCircleIcon, UserCircleIcon, BriefcaseIcon, CheckCircleIcon } from './Icons';
import { APP_TITLE } from '../constants';
import { LoadingSpinner } from './LoadingSpinner';
import firebase from 'firebase/compat/app'; // Import for firebase.User type

type AuthMode = 'login' | 'signup';

interface AuthModalProps {
  mode: AuthMode;
  isOpen: boolean;
  onClose: () => void;
  onAuthAttempt: (email: string, mode: AuthMode, password?: string) => Promise<{ success: boolean; message?: string; requiresVerification?: boolean; user?: firebase.User | null }>; // Changed to firebase.User
  switchMode: (newMode: AuthMode) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ mode, isOpen, onClose, onAuthAttempt, switchMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [postAuthMessage, setPostAuthMessage] = useState<string | null>(null); 
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const resetFormState = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setPostAuthMessage(null);
    setIsLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPostAuthMessage(null);
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      setIsLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const result = await onAuthAttempt(email, mode, password);
      
      if (result.success) {
        if (result.requiresVerification && result.message) {
          setPostAuthMessage(result.message);
        } else {
          onClose(); 
        }
      } else { 
        setError(result.message || `An error occurred during ${mode}.`);
      }
    } catch (apiError: any) {
      let specificMessage = `An error occurred during ${mode}. Please try again.`;
      if (apiError.code) { 
        switch (apiError.code) {
          case 'auth/invalid-credential':
            specificMessage = 'Login failed: Incorrect email or password.';
            break;
          case 'auth/user-not-found':
            specificMessage = 'Login failed: No account found with this email. Please sign up or check your email.';
            break;
          case 'auth/wrong-password':
            specificMessage = 'Login failed: Incorrect password.';
            break;
          case 'auth/email-already-in-use':
            specificMessage = 'Signup failed: This email address is already in use. Please try logging in or use a different email.';
            break;
          case 'auth/weak-password':
            specificMessage = 'Signup failed: The password is too weak. Please use a stronger password (at least 6 characters).';
            break;
          case 'auth/invalid-email':
            specificMessage = `The email address is not valid. Please check and try again.`;
            break;
          default:
            specificMessage = apiError.message || specificMessage;
        }
      } else {
        specificMessage = apiError.message || specificMessage;
      }
      setError(specificMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchMode = () => {
    resetFormState();
    switchMode(mode === 'login' ? 'signup' : 'login');
  };

  const handleCloseModal = () => {
    resetFormState();
    onClose();
  };
  
  const title = mode === 'login' ? 'Login to your Account' : 'Create an Account';
  const subtitle = mode === 'login' 
    ? `Welcome back to ${APP_TITLE}!`
    : `Join ${APP_TITLE} and get started with free credits!`;

  return (
    <div 
        className="fixed inset-0 bg-neutral-darker/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={handleCloseModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl p-6 md:p-8 w-full max-w-md relative transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-appear"
        onClick={(e) => e.stopPropagation()} 
      >
        <button
          onClick={handleCloseModal}
          className="absolute top-3 right-3 text-neutral-dark hover:text-red-500 transition-colors"
          aria-label="Close authentication modal"
          disabled={isLoading}
        >
          <XCircleIcon className="h-7 w-7" />
        </button>
        
        <div className="text-center mb-6">
            <BriefcaseIcon className="h-12 w-12 text-primary mx-auto mb-2" />
            <h2 id="auth-modal-title" className="text-2xl font-bold text-primary-dark">{title}</h2>
            <p className="text-sm text-neutral-dark">{subtitle}</p>
        </div>

        {error && !postAuthMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm" role="alert" id="auth-error">
            {error}
          </div>
        )}

        {postAuthMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-500 text-green-700 rounded-md text-sm flex items-start" role="status">
                <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                <span>{postAuthMessage}</span>
            </div>
        )}

        {!postAuthMessage && ( 
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-dark">Email Address</label>
                <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm disabled:bg-neutral/50"
                placeholder="you@example.com"
                aria-describedby={error ? "auth-error" : undefined}
                disabled={isLoading}
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-dark">Password</label>
                <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm disabled:bg-neutral/50"
                placeholder="••••••••"
                aria-describedby={error ? "auth-error" : undefined}
                disabled={isLoading}
                />
            </div>
            {mode === 'signup' && (
                <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-dark">Confirm Password</label>
                <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-neutral rounded-md shadow-sm focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm disabled:bg-neutral/50"
                    placeholder="••••••••"
                    aria-describedby={error ? "auth-error" : undefined}
                    disabled={isLoading}
                />
                </div>
            )}
            <Button type="submit" className="w-full !py-2.5" disabled={isLoading}>
                {isLoading ? (
                    <>
                    <LoadingSpinner className="h-5 w-5 mr-2" />
                    Processing...
                    </>
                ) : (
                    <>
                    <UserCircleIcon className="h-5 w-5 mr-2" />
                    {mode === 'login' ? 'Login' : 'Sign Up'}
                    </>
                )
                }
            </Button>
            </form>
        )}
        
        {!postAuthMessage && ( 
            <p className="mt-6 text-center text-sm">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
                onClick={handleSwitchMode} 
                className="font-medium text-primary hover:text-primary-dark underline disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
            >
                {mode === 'login' ? 'Sign up' : 'Login'}
            </button>
            </p>
        )}
         {postAuthMessage && (
            <p className="mt-4 text-center text-sm">
                You can close this window now.
            </p>
        )}
        <style>
          {`
          @keyframes modal-appear-animation {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-modal-appear {
            animation: modal-appear-animation 0.3s ease-out forwards;
          }
          `}
        </style>
      </div>
    </div>
  );
};