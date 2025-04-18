import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

// Define AuthenticatedRequest interface
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
    institutionId?: string;
    childId?: string;
  };
}

export class AuthMiddleware {
  // Middleware to verify token
  static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Safely attach user info to req (with the correct type)
      (req as AuthenticatedRequest).user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        role: decodedToken.role || 'Student',
        institutionId: decodedToken.institutionId || '',
        childId: decodedToken.childId || '',
      };

      next(); // Proceed to the next middleware
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
  }

  // Middleware to check user roles for specific access
  static requireRole(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Safely cast req to AuthenticatedRequest to access `user`
      const user = (req as AuthenticatedRequest).user;

      // Ensure that `user` is available and has a `role`
      if (!user || !user.role) {
        res.status(403).json({ error: 'Forbidden: User role missing' });
        return;
      }

      // Check if the user's role is included in the allowed roles
      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
          error: `Forbidden: Requires one of [${allowedRoles.join(', ')}]`,
        });
        return;
      }
      next(); 
    };
  }
}
