import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        role: string;
        institutionId?: string;
        email?: string;
      };
    }
  }
}

/**
 * Authentication middleware that verifies Firebase ID tokens
 * @alias authMiddleware
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Authorization token required',
      code: 'MISSING_AUTH_TOKEN'
    });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      role: decoded.role || 'student',
      institutionId: decoded.institutionId,
      email: decoded.email
    };
    next();
  } catch (error: unknown) {
    res.status(403).json({ 
      error: error instanceof Error ? error.message : 'Invalid token',
      code: 'INVALID_AUTH_TOKEN'
    });
  }
};

// Alias export for backward compatibility
export const authMiddleware = authenticate;

// Optional: Role-based middleware generator
export const requireRole = (role: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        error: `Requires ${role} role`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};