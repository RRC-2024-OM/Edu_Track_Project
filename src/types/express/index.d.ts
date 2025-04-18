// src/types/express/index.d.ts
import { UserWithRole } from '../user.types';

declare global {
  namespace Express {
    interface Request {
      user?: UserWithRole;
    }
  }
}
