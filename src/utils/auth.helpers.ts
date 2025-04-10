import { AuthenticatedRequest } from '../middleware/auth.middleware';

export function isAuthenticated(user: AuthenticatedRequest['user']): user is NonNullable<AuthenticatedRequest['user']> {
  return user !== undefined;
}
