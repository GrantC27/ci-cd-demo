import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const StripeRedirect: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Parse query params for success/cancel
  const params = new URLSearchParams(location.search);
  const success = params.get('success');
  const canceled = params.get('canceled');

  useEffect(() => {
    // Optionally, you could refresh user profile here
    if (success) {
      // Optionally show a message, then redirect
      setTimeout(() => navigate('/', { replace: true }), 4000);
    } else if (canceled) {
      setTimeout(() => navigate('/', { replace: true }), 4000);
    }
  }, [success, canceled, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-neutral-light to-gray-200">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        {success && (
          <>
            <h1 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h1>
            <p className="mb-4">Thank you for your purchase. Your credits will be updated shortly.</p>
            <p className="text-sm text-neutral-dark">Redirecting to dashboard...</p>
          </>
        )}
        {canceled && (
          <>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Canceled</h1>
            <p className="mb-4">Your payment was not completed. No credits have been added.</p>
            <p className="text-sm text-neutral-dark">Redirecting to dashboard...</p>
          </>
        )}
        {!success && !canceled && (
          <>
            <h1 className="text-2xl font-bold text-primary-dark mb-2">Processing...</h1>
            <p className="mb-4">Please wait while we process your payment status.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default StripeRedirect;
