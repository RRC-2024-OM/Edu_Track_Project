import { auth, db, adminInstance } from '../config/firebase'; // Updated import
import { UserRecord } from 'firebase-admin/auth';

// Type definitions
interface UserData {
  email: string;
  role: string;
  institutionId?: string | null;
  createdAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
}

export const registerUser = async (
  email: string,
  password: string,
  role: string,
  institutionId?: string
): Promise<{ uid: string; email: string; role: string }> => {
  try {
    // 1. Create user in Firebase Auth
    const user = await auth.createUser({ email, password });
    
    // 2. Set custom claims (roles)
    await auth.setCustomUserClaims(user.uid, { 
      role,
      institutionId: institutionId || null 
    });

    // 3. Save user to Firestore
    const userData: UserData = {
      email,
      role,
      institutionId: institutionId || null,
      createdAt: adminInstance.firestore.FieldValue.serverTimestamp() // Using exported adminInstance
    };

    await db.collection('users').doc(user.uid).set(userData);

    return { uid: user.uid, email, role };
  } catch (error) {
    throw new Error(`Registration failed: ${(error as Error).message}`);
  }
};

export const loginUser = async (
  email: string
): Promise<{ uid: string; role?: string }> => {
  try {
    const user: UserRecord = await auth.getUserByEmail(email);
    return { 
      uid: user.uid,
      role: user.customClaims?.role as string | undefined 
    };
  } catch (error) {
    throw new Error(`Login failed: ${(error as Error).message}`);
  }
};