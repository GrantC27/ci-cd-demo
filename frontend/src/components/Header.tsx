
import React from 'react';
import { APP_TITLE } from '../constants';
import { BriefcaseIcon, UserCircleIcon, CreditCardIcon, LogoutIcon, ShieldExclamationIcon } from './Icons'; // Added ShieldExclamationIcon

interface CurrentUser {
  email: string;
  credits: number;
}

interface HeaderProps {
  currentUser: CurrentUser | null;
  onLoginClick: () => void;
  onSignupClick: () => void;
  onLogoutClick: () => void;
  onBuyCreditsClick: () => void;
  isEmailVerified: boolean;
  isFirebaseLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentUser, 
  onLoginClick, 
  onSignupClick, 
  onLogoutClick,
  onBuyCreditsClick,
  isEmailVerified,
  isFirebaseLoading
}) => {
  return (
    <header className="bg-primary shadow-lg">
      <div className="container mx-auto px-4 py-5 flex flex-wrap items-center justify-between">
        <div className="flex items-center">
          <BriefcaseIcon className="h-10 w-10 text-white mr-3"/>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{APP_TITLE}</h1>
        </div>
        <div className="flex items-center space-x-2 md:space-x-3 mt-3 md:mt-0">
          {isFirebaseLoading ? (
            <div className="text-sm text-white px-3 py-1.5">Loading user...</div>
          ) : currentUser ? (
            <>
              {!isEmailVerified && (
                <div 
                  className="flex items-center text-sm text-yellow-900 bg-yellow-300 px-3 py-1.5 rounded-md shadow"
                  title="Your email is not verified. Please check your inbox."
                >
                  <ShieldExclamationIcon className="h-5 w-5 mr-1 md:mr-2" />
                  <span>Unverified</span>
                </div>
              )}
              <div className="flex items-center text-sm text-white bg-primary-dark px-3 py-1.5 rounded-md shadow">
                <UserCircleIcon className="h-5 w-5 mr-2 opacity-80" />
                <span className="truncate max-w-[100px] md:max-w-[150px]" title={currentUser.email}>{currentUser.email}</span>
              </div>
              <div className="flex items-center text-sm text-white bg-primary-dark px-3 py-1.5 rounded-md shadow">
                <CreditCardIcon className="h-5 w-5 mr-2 opacity-80" />
                <span>Credits: {currentUser.credits}</span>
              </div>
              <button
                onClick={onBuyCreditsClick}
                className="text-sm text-white hover:bg-primary-light px-3 py-1.5 rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Buy more credits"
                disabled={!isEmailVerified} 
                title={!isEmailVerified ? "Verify email to buy credits" : "Buy more credits"}
              >
                Buy Credits
              </button>
              <button
                onClick={onLogoutClick}
                className="text-sm text-white hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-md transition-colors font-medium flex items-center"
                aria-label="Logout"
              >
                <LogoutIcon className="h-5 w-5 mr-1 md:mr-2" />
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onLoginClick}
                className="text-sm text-white hover:bg-primary-light px-3 py-1.5 rounded-md transition-colors font-medium"
                aria-label="Login to your account"
              >
                Login
              </button>
              <button
                onClick={onSignupClick}
                className="text-sm bg-secondary hover:bg-secondary/80 text-primary-darker px-3 py-1.5 rounded-md transition-colors font-semibold shadow"
                aria-label="Create a new account"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
      <div className="bg-primary-dark py-2">
        <p className="container mx-auto px-4 text-sm text-primary-light/80">
          Transform your CV to perfectly match job descriptions and impress recruiters.
        </p>
      </div>
    </header>
  );
};
