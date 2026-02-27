import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase config (React Auth Project)
const firebaseConfig = {
    apiKey: "AIzaSyAW7pi6-8TGr7STSPXJ9uo2xcZktimyUKk",
    authDomain: "react-auth-a6860.firebaseapp.com",
    projectId: "react-auth-a6860",
    storageBucket: "react-auth-a6860.firebasestorage.app",
    messagingSenderId: "217752409849",
    appId: "1:217752409849:web:9e549b0d12dafe15983428",
    measurementId: "G-XR510N9V0Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth exports
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');