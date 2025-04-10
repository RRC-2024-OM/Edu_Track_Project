import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
    institutionId?: string;
  };
}

export class AuthMiddleware {
  static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);

      (req as AuthenticatedRequest).user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        role: decodedToken.role,
        institutionId: decodedToken.institutionId,
      };

      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
  }

  static requireRole(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as AuthenticatedRequest).user;

      if (!user?.role) {
        res.status(403).json({ error: 'Forbidden: User role missing' });
        return;
      }

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
