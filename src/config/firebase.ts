import * as admin from "firebase-admin";
import { serviceAccount } from "./env";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://edu-track-project.firebaseio.com"
});

export const db = admin.firestore();
export const auth = admin.auth();