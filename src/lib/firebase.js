import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBYV_lPTFrIl18AN8u--HRiD8Hrhv9eKQQ",
    authDomain: "my-first-project-fd8f6.firebaseapp.com",
    projectId: "my-first-project-fd8f6",
    storageBucket: "my-first-project-fd8f6.firebasestorage.app",
    messagingSenderId: "664924566379",
    appId: "1:664924566379:web:9488e04eef0022f2a2122e",
    measurementId: "G-TQJ003QREJ"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

export const auth = app.auth();
export const db = app.firestore();
export const googleProvider = new firebase.auth.GoogleAuthProvider();
export default app;
