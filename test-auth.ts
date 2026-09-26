import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from './firebase-applet-config.json' with { type: "json" };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    const cred = await signInAnonymously(auth);
    console.log("Success:", cred.user.uid);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
