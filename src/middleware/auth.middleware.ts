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
  static async verifyToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        role: decodedToken.role,
        institutionId: decodedToken.institutionId,
      };

      next();
    } catch (error: any) {
      console.error('Token verification failed:', error);
      res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
  }

  static requireRole(...allowedRoles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user || !req.user.role) {
        res.status(403).json({ error: 'Forbidden: User role missing' });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({ error: `Forbidden: Requires one of [${allowedRoles.join(', ')}]` });
        return;
      }

      next();
    };
  }
}
