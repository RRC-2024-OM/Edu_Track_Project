import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        role: string;
        institutionId?: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      role: decoded.role || 'student',
      institutionId: decoded.institutionId
    };
    next();
  } catch (error: unknown) {
    res.status(403).json({ 
      error: error instanceof Error ? error.message : 'Invalid token' 
    });
  }
};