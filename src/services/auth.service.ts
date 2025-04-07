import admin from 'firebase-admin';
import { db } from '../config/firebase';
import { ROLES } from '../config/constants';

interface RegisterUserInput {
  email: string;
  password: string;
  role: string;
  institutionId?: string;
}

export class AuthService {
  async registerUser({ email, password, role, institutionId }: RegisterUserInput) {
    if (!Object.values(ROLES).includes(role)) {
      throw new Error(`Invalid role. Accepted roles: ${Object.values(ROLES).join(', ')}`);
    }

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
    const userRecord = await admin.auth().getUserByEmail(email);
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    return {
      token: customToken,
      uid: userRecord.uid,
      email: userRecord.email,
      role: userRecord.customClaims?.role || null,
    };
  }
}
