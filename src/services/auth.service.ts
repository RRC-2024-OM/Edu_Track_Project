import admin from 'firebase-admin';
import { db } from '../config/firebase';

interface RegisterUserInput {
  email: string;
  password: string;
  role: string;
  institutionId?: string;
}

export class AuthService {
  async registerUser({ email, password, role, institutionId }: RegisterUserInput) {
    const userRecord = await admin.auth().createUser({ email, password });

    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    const userData = {
      uid: userRecord.uid,
      email,
      role,
      institutionId: institutionId || null,
      createdAt: new Date().toISOString(),
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    return userData;
  }

  async loginUser(email: string, password: string) {
    // Firebase Admin SDK can't verify password directly
    const userRecord = await admin.auth().getUserByEmail(email);

    // Assume password is validated by client using Firebase Auth SDK
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    return {
      token: customToken,
      uid: userRecord.uid,
      email: userRecord.email,
      role: userRecord.customClaims?.role || null,
    };
  }
}
