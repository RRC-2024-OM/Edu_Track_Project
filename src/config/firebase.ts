import * as admin from 'firebase-admin';
import { serviceAccount } from './env';

// Initialize Firebase Admin
const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://edu-track-project.firebaseio.com"
});

// Explicitly export what's needed
export const auth = firebaseApp.auth();
export const db = firebaseApp.firestore();
export const adminInstance = admin; // If you need the raw admin SDK