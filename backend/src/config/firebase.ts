import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeApp as initAdminApp, cert, getApps as getAdminApps, getApp as getAdminApp, App as AdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, Auth as AdminAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let firebaseConfig: any = {};
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');

if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {
    console.warn('Could not parse firebase-applet-config.json:', e);
  }
}

const app = initializeApp(firebaseConfig);

export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

// Initialize Firebase Admin SDK
const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
let adminApp: AdminApp | null = null;

if (!getAdminApps().length && fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
    adminApp = initAdminApp({
      credential: cert(serviceAccount)
    });
    console.log('🔥 Firebase Admin SDK initialized successfully with service account credentials.');
  } catch (e) {
    console.warn('Could not initialize Firebase Admin SDK:', e);
  }
} else if (getAdminApps().length) {
  adminApp = getAdminApp();
}

export const adminDb: AdminFirestore | null = adminApp ? getAdminFirestore(adminApp) : null;
export const adminAuth: AdminAuth | null = adminApp ? getAdminAuth(adminApp) : null;
