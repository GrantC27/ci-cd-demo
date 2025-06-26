
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { XCircleIcon, CreditCardIcon, LockClosedIcon, ExternalLinkIcon as StripeIcon } from './Icons';
import { CREDIT_PACKAGES, LAMBDA_CREATE_CHECKOUT_SESSION_ENDPOINT } from '../constants';
import firebase from 'firebase/compat/app'; // Import for firebase.User type


const LoadingSpinner: React.FC<{className?: string}> = ({ className }) => (
  <svg 
    className={`animate-spin h-5 w-5 text-current ${className}`} 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);


interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  firebaseUser: firebase.User | null;  // Changed to firebase.User
}

type PaymentState = 'idle' | 'selecting_package' | 'creating_session' | 'redirecting' | 'error';

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ 
    isOpen, 
    onClose, 
    currentCredits, 
    firebaseUser 
}) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(CREDIT_PACKAGES[1]?.id || CREDIT_PACKAGES[0]?.id || null);
  const [paymentState, setPaymentState] = useState<PaymentState>('selecting_package');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentState('selecting_package');
      setSelectedPackageId(CREDIT_PACKAGES[1]?.id || CREDIT_PACKAGES[0]?.id || null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInitiateCheckout = async () => {
    if (!selectedPackageId || !firebaseUser) {
      setErrorMessage("Please select a package and ensure you are logged in.");
      setPaymentState('error');
      return;
    }
    
    if (LAMBDA_CREATE_CHECKOUT_SESSION_ENDPOINT === 'YOUR_LAMBDA_API_GATEWAY_ENDPOINT_URL_FOR_CREATE_CHECKOUT_SESSION_HERE') {
        setErrorMessage("Payment system is not configured. Please contact support. (Admin: LAMBDA_CREATE_CHECKOUT_SESSION_ENDPOINT is not set).");
        setPaymentState('error');
        return;
    }

    setPaymentState('creating_session');
    setErrorMessage(null);

    try {
      const idToken = await firebaseUser.getIdToken();
      const selectedPkg = CREDIT_PACKAGES.find(pkg => pkg.id === selectedPackageId);
        if (!selectedPkg || !selectedPkg.priceId || selectedPkg.priceId.startsWith('YOUR_STRIPE_PRICE_ID')) {
            setErrorMessage("Selected package is not configured for payment. Please select another or contact support. (Admin: Stripe Price ID missing).");
            setPaymentState('error');
            return;
        }

      const response = await fetch(LAMBDA_CREATE_CHECKOUT_SESSION_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ 
            packageId: selectedPackageId,
            priceId: selectedPkg.priceId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create checkout session. Please try again." }));
        throw new Error(errorData.message || "Server error during checkout session creation.");
      }

      const { checkoutUrl } = await response.json();
      if (!checkoutUrl) {
        throw new Error("Checkout URL not received from server.");
      }

      setPaymentState('redirecting');
      window.location.href = checkoutUrl;

    } catch (err: any) {
      console.error("Error initiating Stripe checkout:", err);
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
      setPaymentState('error');
    }
  };
  
  const isLoading = paymentState === 'creating_session' || paymentState === 'redirecting';

  return (
    <div 
        className="fixed inset-0 bg-neutral-darker/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={() => { if (!isLoading) onClose();}}
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-credits-modal-title"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl p-6 md:p-8 w-full max-w-lg relative transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-appear"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-dark hover:text-red-500 transition-colors disabled:opacity-50"
          aria-label="Close buy credits modal"
          disabled={isLoading}
        >
          <XCircleIcon className="h-7 w-7" />
        </button>
        
        <div className="text-center mb-6">
            <CreditCardIcon className="h-12 w-12 text-primary mx-auto mb-2" />
            <h2 id="buy-credits-modal-title" className="text-2xl font-bold text-primary-dark">Purchase Credits</h2>
            <p className="text-sm text-neutral-dark">Current balance: {currentCredits} credits.</p>
        </div>

        {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm" role="alert">
                {errorMessage}
            </div>
        )}

        {paymentState === 'redirecting' && (
             <div className="my-8 p-4 bg-blue-50 border border-blue-300 text-blue-700 rounded-md text-center">
                <LoadingSpinner className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold">Redirecting to Secure Payment...</p>
                <p className="text-sm">You will be redirected to Stripe to complete your purchase.</p>
            </div>
        )}
        
        {(paymentState === 'selecting_package' || paymentState === 'creating_session' || paymentState === 'error') &&  (
            <>
                <p className="text-sm text-neutral-dark mb-4 text-center">
                   Select a package to add credits to your account.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {CREDIT_PACKAGES.map((pkg) => (
                    <button
                    key={pkg.id}
                    onClick={() => { if (!isLoading) setSelectedPackageId(pkg.id); }}
                    disabled={isLoading}
                    className={`p-4 border rounded-lg text-center transition-all duration-150 ease-in-out
                                ${selectedPackageId === pkg.id
                                    ? 'border-primary-dark ring-2 ring-primary-light bg-primary-light/10 shadow-lg' 
                                    : 'border-neutral hover:border-primary-light hover:shadow-md bg-neutral-light/30'
                                }
                                ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                    aria-pressed={selectedPackageId === pkg.id}
                    >
                    <p className="text-lg font-semibold text-primary-dark">{pkg.name}</p>
                    <p className="text-2xl font-bold text-accent">{pkg.credits}</p>
                    <p className="text-sm text-neutral-dark">Credits</p>
                    <p className="text-xs text-neutral-dark mt-1">Price: {pkg.price}</p>
                    </button>
                ))
                }
                </div>
            </>
        )}

        { (paymentState === 'selecting_package' || paymentState === 'creating_session' || paymentState === 'error') && (
            <Button 
                onClick={handleInitiateCheckout} 
                className="w-full !py-2.5 mt-4" 
                disabled={isLoading || !selectedPackageId}
            >
                {isLoading && paymentState === 'creating_session' ? (
                    <> <LoadingSpinner className="mr-2" /> Creating Secure Session... </>
                 ) : (
                    <> <LockClosedIcon className="h-5 w-5 mr-2" /> Proceed to Secure Payment </>
                 )
                }
            </Button>
        )}
        
        {(paymentState === 'selecting_package' || paymentState === 'error') && (
             <p className="text-xs text-neutral-dark text-center mt-3">
                You'll be redirected to Stripe to complete your purchase securely.
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