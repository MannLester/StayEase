// src/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth' // Import Firebase Authentication
import { getFirestore } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDiii3HKZOuvvcYsEj_-GUprG5xFYwYpuU',
  authDomain: 'stayease-ca1cb.firebaseapp.com',
  projectId: 'stayease-ca1cb',
  storageBucket: 'stayease-ca1cb.appspot.com',
  messagingSenderId: '605023633613',
  appId: '1:605023633613:web:b65a062054b5b5fbbd2984',
  measurementId: 'G-3WWKNS9VDB'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication
const auth = getAuth(app)

// Initialize Firestore
const db = getFirestore(app)

export { auth, db } // Export both auth and db
