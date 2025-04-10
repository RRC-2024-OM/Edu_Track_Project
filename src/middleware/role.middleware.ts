import { Request, Response, NextFunction } from 'express';

// Extend the Request interface to include the 'user' property
declare global {
  namespace Express {
    interface Request {
      user?: { role: string };
    }
  }
}

export class RoleMiddleware {
  static authorizeRoles(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const role = req.user?.role;
      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({ message: 'Forbidden: insufficient role' });
      }
      next();
    };
  }
}
