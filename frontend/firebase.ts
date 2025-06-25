
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth'; // Import for side effects to populate firebase.auth()

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPPQrzFRAkRlZfONzLfSfL_LuDGgd_Fkc",
  authDomain: "cvgendata.firebaseapp.com",
  projectId: "cvgendata",
  storageBucket: "cvgendata.firebasestorage.app",
  messagingSenderId: "647604039777",
  appId: "1:647604039777:web:af3667af703faced717a20"
};

// Initialize Firebase
// Ensure Firebase is initialized only once
let app: firebase.app.App;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app(); // Get default app if already initialized
}

const auth: firebase.auth.Auth = firebase.auth(app);

export { app, auth };
