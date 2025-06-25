// index.mjs
import admin from 'firebase-admin';

import { readFileSync } from 'fs';
import { resolve } from 'path'; // Optional: for constructing absolute paths

let serviceAccountCredentialsFromFile;
try {
  // Assuming 'serviceAccountKey.json' is in the same directory as your .mjs file
  // For a more robust path, especially in Lambdas, construct it carefully:
  // const filePath = resolve(__dirname, 'serviceAccountKey.json'); // if __dirname is available (commonjs context)
  // Or if your .mjs file is at root of project and serviceAccountKey.json is also at root:
  const filePath = './serviceAccountKey.json'; 

  const fileContent = readFileSync(filePath, 'utf8'); // 'utf8' is the typical encoding for text/JSON
  serviceAccountCredentialsFromFile = JSON.parse(fileContent);

  console.log('Successfully read and parsed JSON data');
  // Now you can use jsonData, for example, to initialize Firebase Admin SDK:
  // admin.initializeApp({
  //   credential: admin.credential.cert(jsonData)
  // });

} catch (error) {
  console.error('Failed to read or parse serviceAccountKey.json:', error);
  // Handle the error appropriately (e.g., exit the process, throw)
}

const serviceAccount = serviceAccountCredentialsFromFile;


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
  const { email, userId, name } = event.body ? JSON.parse(event.body) : event; // Handle direct invocation and API Gateway event

  if (!email || !userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing email or userId in request.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const userRef = db.collection('cvwebpagedata').doc(userId); // Use userId as the document ID

    await userRef.set({
      userId: userId,
      email: email,
      name: name || '', // Optional name
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      credits: 5, // Example: Give new users 5 credits by default (matches your frontend logic)
    });

    console.log(`User ${userId} created/updated successfully in Firestore.`);
    return {
      statusCode: 201, // 201 Created
      body: JSON.stringify({ message: 'User created successfully', userId: userId, email: email }),
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