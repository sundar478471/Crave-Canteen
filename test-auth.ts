import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBZaoiOFU1DNDgrVRLXhiQ_T8R85B0Ug48",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "crave-canteen.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "crave-canteen",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "crave-canteen.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "380487303104",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:380487303104:web:f2a052d1600475785c1225",
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "https://crave-canteen-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "nonexistent_test_123@domain.com", "password123");
    console.log("Logged in:", cred.user.uid);
  } catch (err: any) {
    console.log("Error code:", err.code);
    console.log("Error message:", err.message);
  }
}

test();
