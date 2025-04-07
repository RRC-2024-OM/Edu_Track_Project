import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { registerUser, loginUser } from '../services/auth.service';

const router = Router();

interface RegisterBody {
  email: string;
  password: string;
  role: string;
  institutionId?: string;
}

interface LoginBody {
  email: string;
}

// Properly typed register endpoint
router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(['super_admin', 'admin', 'teacher', 'student', 'parent'])
  ],
  (
    req: Request<{}, {}, RegisterBody>,
    res: Response,
    next: NextFunction
  ) => {
    (async () => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const user = await registerUser(
          req.body.email,
          req.body.password,
          req.body.role,
          req.body.institutionId
        );
        res.status(201).json(user);
      } catch (error) {
        next(error);
      }
    })().catch(next);
  }
);

// Properly typed login endpoint
router.post(
  '/login',
  async (
    req: Request<{}, {}, LoginBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = await loginUser(req.body.email);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

export default router;