import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBSN8DnEh-2m3pBdngXs8UTgJZgaV9YTDw",
  authDomain: "cardsofpower-2d60c.firebaseapp.com",
  projectId: "cardsofpower-2d60c",
  storageBucket: "cardsofpower-2d60c.firebasestorage.app",
  messagingSenderId: "220041050268",
  appId: "1:220041050268:android:1bf547ca44f139d5885559"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export const storage = getStorage(app);

export default app;
