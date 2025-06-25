import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPPQrzFRAkRlZfONzLfSfL_LuDGgd_Fkc",
  authDomain: "cvgendata.firebaseapp.com",
  projectId: "cvgendata",
  storageBucket: "cvgendata.appspot.com", // Using the value from the provided src/firebase.ts
  messagingSenderId: "647604039777",
  appId: "1:647604039777:web:af3667af703faced717a20"
};

// Initialize Firebase
let app: firebase.app.App;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app(); // Get default app if already initialized
}

const auth: firebase.auth.Auth = firebase.auth(app); // Can pass app explicitly or rely on default

export { app, auth };