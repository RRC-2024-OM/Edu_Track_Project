import admin from 'firebase-admin';
import { db } from '../config/firebase';
import { ROLES } from '../config/constants';
import { parse } from 'csv-parse/sync';


interface UserInput {
  email: string;
  role: string;
  institutionId?: string;
  name?: string;
}

interface UserFilter {
  role?: string;
  institutionId?: string;
}

export class UserService {
  async getAllUsers(filter: UserFilter) {
    let query: FirebaseFirestore.Query = db.collection('users');

    if (filter.role) {
      query = query.where('role', '==', filter.role);
    }

    if (filter.institutionId) {
      query = query.where('institutionId', '==', filter.institutionId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getUserById(userId: string) {
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) throw new Error('User not found');
    return { id: doc.id, ...doc.data() };
  }

  async createUser(userData: UserInput) {
    if (!Object.values(ROLES).includes(userData.role)) {
      throw new Error(`Invalid role. Accepted roles: ${Object.values(ROLES).join(', ')}`);
    }

    const userRef = db.collection('users').doc();
    await userRef.set({
      ...userData,
      createdAt: new Date().toISOString(),
    });

    return { id: userRef.id, ...userData };
  }

  async updateUser(userId: string, updates: Partial<UserInput>) {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    const updatedDoc = await userRef.get();
    return { id: userId, ...updatedDoc.data() };
  }

  async deleteUser(userId: string) {
    await db.collection('users').doc(userId).delete();
    return { id: userId, deleted: true };
  }

  async importUsersFromCSV(buffer: Buffer) {
    const csvText = buffer.toString();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });
        
    const results: any[] = [];

    for (const row of records) {
      const { email, password, role, institutionId } = row;

      if (!email || !password || !role) continue;

      const userRecord = await admin.auth().createUser({ email, password });

      await admin.auth().setCustomUserClaims(userRecord.uid, { role });

      const userDoc = {
        uid: userRecord.uid,
        email,
        role,
        institutionId: institutionId || null,
        createdAt: new Date().toISOString(),
      };

      await db.collection('users').doc(userRecord.uid).set(userDoc);
      results.push(userDoc);
    }

    return results;
  }
}
