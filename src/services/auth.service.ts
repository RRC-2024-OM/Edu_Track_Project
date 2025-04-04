import { auth, db } from "../config/firebase";
import { UserRecord } from "firebase-admin/auth";

// Register a new user with role
export const registerUser = async (
  email: string,
  password: string,
  role: string,
  institutionId?: string
) => {
  const user = await auth.createUser({ email, password });
  
  // Set custom claims (roles)
  await auth.setCustomUserClaims(user.uid, { 
    role,
    institutionId: institutionId || null 
  });

  // Save user to Firestore
  await db.collection("users").doc(user.uid).set({
    email,
    role,
    institutionId,
    createdAt: new Date()
  });

  return { uid: user.uid, email, role };
};

// Login user (JWT will be generated client-side)
export const loginUser = async (email: string) => {
  const user = await auth.getUserByEmail(email);
  return { 
    uid: user.uid,
    customClaims: user.customClaims 
  };
};