import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCTqTDMzM4s7AIUxx72-QaGhRvgtbwxZjY",
  authDomain: "larre-app.firebaseapp.com",
  projectId: "larre-app",
  storageBucket: "larre-app.firebasestorage.app",
  messagingSenderId: "73189586466",
  appId: "1:73189586466:web:12e324b3301b3a34c7fc7b",
  measurementId: "G-QX7S0GMW4E",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
