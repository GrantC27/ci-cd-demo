const admin = require("firebase-admin");

// Load Firestore credentials from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY_JSON);

console.log("Service Account:", FIREBASE_KEY_JSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  const { email, credits } = JSON.parse(event.body);

  try {
    const userRef = db.collection("users").doc(email);
    await userRef.set({ credits }, { merge: true });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User updated successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};