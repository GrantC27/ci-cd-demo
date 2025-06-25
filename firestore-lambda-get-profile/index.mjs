// index.mjs
import admin from 'firebase-admin';

//get GOOGLE_APPLICATION_CREDENTIALS from environment variable
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

const SIGNUP_CREDITS = 5;


// Initialize Firebase Admin SDK, but only if it hasn't been initialized yet.
// This is important because Lambda might reuse the execution environment.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    // Rethrow or handle critical initialization failure
    throw error; 
  }
}


const db = admin.firestore();


export const handler = async (event) => {

  // Assume the event will contain user details, e.g., from API Gateway
  // For this example, let's expect an 'email' and a 'userId' (which could be generated or from an auth provider)
  const {  userId, email, name } = event.body ? JSON.parse(event.body) : event; // Handle direct invocation and API Gateway event

  if (!email || !userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing email or userId in request.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
  
  try {
    const userRef = db.collection('users').doc(userId); // Use userId as the document ID

    await userRef.set({
      userId: userId,
      email: email,
      name: name || '', // Optional name
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      credits: SIGNUP_CREDITS, // Example: Give new users 5 credits by default (matches your frontend logic)
    });

    console.log(`User ${userId} created/updated successfully in Firestore.`);
    return {
      statusCode: 201, // 201 Created
      body: JSON.stringify({ message: 'User created successfully', userId: userId, email: email, credits: SIGNUP_CREDITS }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Error creating user in Firestore:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error creating user in Firestore.', error: error.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};