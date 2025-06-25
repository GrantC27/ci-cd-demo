// Gemini Model Name
export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

// You can add other constants here, like default prompts or UI settings
export const APP_TITLE = "ATS CV Optimizer";

// User Authentication and Credits
export const LOCAL_STORAGE_USER_KEY = 'atsOptimizerUser';
export const INITIAL_SIGNUP_CREDITS = 5; // Matches Lambda's default
export const CREDIT_COST_OPTIMIZE = 1;
export const CREDIT_COST_SIMULATE = 1;

export const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter Pack', credits: 10, price: '$5', priceId: 'price_1RcNkyPJEHZKPBRwch4OQXvC' }, // Add your Stripe Price ID
  { id: 'plus', name: 'Plus Pack', credits: 25, price: '$10', priceId: 'price_1RcNkbPJEHZKPBRwgVf2ySOm' },       // Add your Stripe Price ID
  { id: 'pro', name: 'Pro Pack', credits: 50, price: '$18', priceId: 'price_1RcNjyPJEHZKPBRwT75zYgaT' },         // Add your Stripe Price ID
];

// AWS Lambda API Gateway Endpoints
// IMPORTANT: Replace these placeholders with your actual API Gateway Invoke URLs.

// Endpoint to create an application-specific user profile after Firebase signup.
// Expects: { firebaseUid: string, email: string, name?: string }
// Returns: { userId: string (should be firebaseUid), email: string, credits: number }
export const LAMBDA_SIGNUP_ENDPOINT: string = 'https://gycm1mkb1c.execute-api.eu-north-1.amazonaws.com/signup';
// export const LAMBDA_SIGNUP_ENDPOINT: string = 'YOUR_LAMBDA_API_GATEWAY_ENDPOINT_URL_FOR_PROFILE_CREATION_HERE';

// Endpoint to fetch an existing user's application profile.
// Expects: Authorization header with Firebase ID token. Lambda extracts UID.
// (Alternatively, pass UID in query/body if secured differently, but ID token is standard)
// Returns: { userId: string (firebaseUid), email: string, credits: number } or 404 if not found.
// export const LAMBDA_GET_PROFILE_ENDPOINT: string = 'YOUR_LAMBDA_API_GATEWAY_ENDPOINT_URL_FOR_GET_PROFILE_HERE';
export const LAMBDA_GET_PROFILE_ENDPOINT: string = 'https://gycm1mkb1c.execute-api.eu-north-1.amazonaws.com/get-profile';

// Endpoint to update user credits (conceptual, for future use via Stripe Webhook).
// This endpoint would be called by Stripe, not directly by the frontend for credit purchase.
export const LAMBDA_STRIPE_WEBHOOK_ENDPOINT: string = 'YOUR_LAMBDA_API_GATEWAY_ENDPOINT_URL_FOR_STRIPE_WEBHOOKS_HERE';

// Endpoint for the frontend to call to create a Stripe Checkout session.
// Expects: Authorization header with Firebase ID token. Body: { packageId: string }
// Returns: { checkoutUrl: string }
export const LAMBDA_CREATE_CHECKOUT_SESSION_ENDPOINT: string = 'https://gycm1mkb1c.execute-api.eu-north-1.amazonaws.com/stripe-create-checkout';
