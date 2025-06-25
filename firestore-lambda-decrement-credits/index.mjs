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
  // Expects: { userId: string, cost: number }
  const { userId, cost } = event.body ? JSON.parse(event.body) : event;

  if (!userId || typeof cost !== 'number' || cost <= 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing or invalid userId or cost.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const userRef = db.collection('cvwebpagedata').doc(userId);
    const res = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(userRef);
      if (!doc.exists) throw new Error('User not found');
      const currentCredits = doc.data().credits || 0;
      if (currentCredits < cost) throw new Error('Insufficient credits');
      transaction.update(userRef, { credits: currentCredits - cost });
      return currentCredits - cost;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ userId, newCredits: res }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
