import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { registerUser, loginUser } from '../services/auth.service';

interface RegisterBody {
  email: string;
  password: string;
  role: string;
  institutionId?: string;
}

interface LoginBody {
  email: string;
  password: string; 
}

class AuthController {
  /**
   * Register a new user
   */
  async register(
    req: Request<{}, {}, RegisterBody>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, role, institutionId } = req.body;
      const user = await registerUser(email, password, role, institutionId);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login an existing user
   */
  async login(
    req: Request<{}, {}, LoginBody>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = req.body;
      const user = await loginUser(email);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user (to be implemented)
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement token invalidation logic
      res.json({ message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;