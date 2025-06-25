

import admin from 'firebase-admin';
import Stripe from 'stripe';

// --- Environment Variables ---
// These MUST be configured in your Lambda environment:
// STRIPE_SECRET_KEY: Your Stripe secret key (e.g., sk_test_YOUR_STRIPE_KEY or sk_live_YOUR_STRIPE_KEY)
// SUCCESS_URL: URL to redirect to after successful payment (e.g., https://your-app.com/payment-success)
// CANCEL_URL: URL to redirect to if payment is cancelled (e.g., https://your-app.com/payment-cancelled)
// FIREBASE_SERVICE_ACCOUNT: The JSON content of your Firebase service account key.

let stripe;
let firebaseAppInitialized = false;

// Initialize Firebase Admin SDK
// It's best to initialize outside the handler for performance (avoid re-initialization on every call)
function initializeFirebase() {
    if (firebaseAppInitialized) {
        return;
    }
    try {
        const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!serviceAccountString) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set or empty.");
        }
        const serviceAccount = JSON.parse(serviceAccountString);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin SDK initialized successfully.");
        firebaseAppInitialized = true;
    } catch (error) {
        console.error("Firebase Admin SDK initialization error:", error);
        // If Firebase fails to initialize, the function likely can't proceed.
        // You might throw the error to cause a cold start retry or handle it based on your strategy.
        throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
    }
}

// Initialize Stripe
function initializeStripe() {
    if (!stripe) {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error("STRIPE_SECRET_KEY environment variable is not set.");
            throw new Error("Stripe configuration error.");
        }
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        console.log("Stripe SDK initialized.");
    }
}


export const handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    try {
        initializeFirebase(); // Ensure Firebase is initialized
        initializeStripe();   // Ensure Stripe is initialized
    } catch (initError) {
        console.error("Initialization failed:", initError);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", // Configure for your specific domain in production
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "POST,OPTIONS"
            },
            body: JSON.stringify({ message: "Internal server error during initialization." }),
        };
    }
    
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Be more specific in production
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "POST,OPTIONS"
            },
            body: JSON.stringify({ message: "CORS preflight check successful" })
        };
    }

    if (event.requestContext.http.method !== 'POST' ) {
        return {
            statusCode: 405,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    let idToken;
    try {
        const authorizationHeader = event.headers?.Authorization || event.headers?.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
            throw new Error('Unauthorized: Missing or invalid Bearer token.');
        }
        idToken = authorizationHeader.split('Bearer ')[1];
    } catch (authError) {
        console.error("Authorization error:", authError);
        return {
            statusCode: 401,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: authError.message || 'Unauthorized' }),
        };
    }

    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        return {
            statusCode: 403,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: 'Forbidden: Invalid or expired token.' }),
        };
    }

    const uid = decodedToken.uid;
    console.log(`Verified UID: ${uid}`);

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (e) {
        console.error("Invalid request body:", e);
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: 'Invalid request body. Expected JSON.' }),
        };
    }

    const { packageId, priceId } = requestBody;

    if (!priceId) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: 'Missing priceId in request body.' }),
        };
    }
    if (!packageId) { // Though not strictly used by Stripe, good for logging/validation
        console.warn("packageId missing from request, but proceeding with priceId.");
    }

    const successUrl = process.env.SUCCESS_URL;
    const cancelUrl = process.env.CANCEL_URL;

    if (!successUrl || !cancelUrl) {
        console.error("SUCCESS_URL or CANCEL_URL environment variables are not set.");
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: 'Server configuration error: Redirect URLs not set.' }),
        };
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId, // This is the Stripe Price ID
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`, // Stripe will replace {CHECKOUT_SESSION_ID}
            cancel_url: cancelUrl,
            client_reference_id: uid, // Pass Firebase UID to link payment to user
            // Alternatively, you can use metadata:
            // metadata: {
            //   firebase_uid: uid,
            //   package_id: packageId 
            // }
        });

        console.log(`Stripe Checkout Session created for UID ${uid}, packageId ${packageId}: ${session.id}`);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", // Be more specific in production
            },
            body: JSON.stringify({ checkoutUrl: session.url }),
        };
    } catch (error) {
        console.error('Error creating Stripe Checkout session:', error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: `Error creating payment session: ${error.message}` }),
        };
    }
};