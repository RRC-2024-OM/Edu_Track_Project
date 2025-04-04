import { auth, db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { AppError } from '../utlis/error';

// Type Definitions
interface UserDocument {
  email: string;
  role: string;
  institutionId?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
  deleted?: boolean;
  deletedAt?: admin.firestore.Timestamp;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  institutionId?: string;
  createdAt: string;
  updatedAt?: string;
}

// Helper Functions
const toUserResponse = (id: string, data: UserDocument): UserResponse => ({
  id,
  email: data.email,
  role: data.role,
  institutionId: data.institutionId,
  createdAt: data.createdAt.toDate().toISOString(),
  updatedAt: data.updatedAt?.toDate().toISOString()
});

const validateUserExists = async (userId: string): Promise<UserDocument> => {
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) throw new AppError('User not found', 404);
  return doc.data() as UserDocument;
};

// Core Operations
export const createUserWithPassword = async (
  email: string,
  password: string,
  role: string,
  institutionId?: string
): Promise<UserResponse> => {
  try {
    const { uid } = await auth.createUser({ email, password });
    await auth.setCustomUserClaims(uid, { role, institutionId });

    const userDoc: UserDocument = {
      email,
      role,
      institutionId,
      createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp
    };

    await db.collection('users').doc(uid).set(userDoc);
    return toUserResponse(uid, userDoc);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'User creation failed',
      400
    );
  }
};

export const createUserWithoutPassword = async (
  email: string,
  role: string,
  institutionId?: string
): Promise<{ user: UserResponse; setupLink: string }> => {
  try {
    const { uid } = await auth.createUser({ email });
    const setupLink = await auth.generatePasswordResetLink(email);

    await auth.setCustomUserClaims(uid, { role, institutionId });

    const userDoc: UserDocument = {
      email,
      role,
      institutionId,
      createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp
    };

    await db.collection('users').doc(uid).set(userDoc);

    return {
      user: toUserResponse(uid, userDoc),
      setupLink
    };
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'User invitation failed', 
      400
    );
  }
};

export const getUsers = async (
  institutionId?: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ users: UserResponse[]; total: number }> => {
  try {
    let query = db.collection('users')
      .where('deleted', '==', false)
      .limit(limit)
      .offset(offset);

    if (institutionId) {
      query = query.where('institutionId', '==', institutionId);
    }

    const [snapshot, total] = await Promise.all([
      query.get(),
      query.count().get()
    ]);

    return {
      users: snapshot.docs.map(doc => 
        toUserResponse(doc.id, doc.data() as UserDocument)
      ),
      total: total.data().count
    };
  } catch (error) {
    throw new AppError('Failed to fetch users', 500);
  }
};

export const getUser = async (userId: string): Promise<UserResponse> => {
  try {
    const user = await validateUserExists(userId);
    return toUserResponse(userId, user);
  } catch (error) {
    throw error instanceof AppError ? error : new AppError('Failed to fetch user', 500);
  }
};

export const updateUser = async (
  userId: string,
  data: Partial<Omit<UserDocument, 'createdAt'>>,
  requester: { role: string; uid: string }
): Promise<UserResponse> => {
  try {
    const user = await validateUserExists(userId);

    // Authorization
    if (requester.role !== 'super_admin' && requester.uid !== userId) {
      throw new AppError('Unauthorized: Can only update your own profile', 403);
    }

    // Role change validation
    if (data.role && data.role !== user.role) {
      if (requester.role !== 'super_admin') {
        throw new AppError('Only super admins can change roles', 403);
      }
    }

    const updateData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userId).update(updateData);

    // Sync auth claims if needed
    if (data.role || data.institutionId) {
      await auth.setCustomUserClaims(userId, {
        role: data.role || user.role,
        institutionId: data.institutionId || user.institutionId
      });
    }

    const updatedUser = {
      ...user,
      ...updateData,
      updatedAt: (await admin.firestore.FieldValue.serverTimestamp()) as admin.firestore.Timestamp
    };

    return toUserResponse(userId, updatedUser);
  } catch (error) {
    throw error instanceof AppError ? error : new AppError('Failed to update user', 500);
  }
};

export const deleteUser = async (
  userId: string,
  requesterRole: string
): Promise<void> => {
  try {
    if (!['super_admin', 'admin'].includes(requesterRole)) {
      throw new AppError('Unauthorized: Only admins can delete users', 403);
    }

    await db.collection('users').doc(userId).update({
      deleted: true,
      deletedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    throw error instanceof AppError ? error : new AppError('Failed to delete user', 500);
  }
};