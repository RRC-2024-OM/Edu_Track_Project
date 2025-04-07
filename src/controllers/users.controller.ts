import { Router, Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import {
  createUserWithPassword,
  createUserWithoutPassword,
  getUsers,
  getUser,
  updateUser,
  deleteUser
} from '../services/user.service';
import { authenticate } from '../middleware/auth.middleware';
import { AppError, handleError } from '../utlis/error';

const router = Router();

// Apply authentication middleware with proper typing
router.use((req: Request, res: Response, next: NextFunction) => {
  authenticate(req, res, next).catch(next);
});

// Create user with password
router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(['teacher', 'student', 'parent']),
    body('institutionId').optional().isString()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !['super_admin', 'admin'].includes(req.user.role)) {
        throw new AppError('Unauthorized', 403);
      }

      const user = await createUserWithPassword(
        req.body.email,
        req.body.password,
        req.body.role,
        req.body.institutionId || req.user.institutionId
      );
      res.status(201).json(user);
    } catch (error) {
      handleError(error, res);
    }
  }
);

// Invite user (email setup)
router.post(
  '/invite',
  [
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['teacher', 'student', 'parent']),
    body('institutionId').optional().isString()
  ],
  async (req: Request, res: Response) => {
    try {
      if (!req.user || !['super_admin', 'admin'].includes(req.user.role)) {
        throw new AppError('Unauthorized', 403);
      }

      const { user, setupLink } = await createUserWithoutPassword(
        req.body.email,
        req.body.role,
        req.body.institutionId || req.user.institutionId
      );

      // TODO: Send email with setupLink in production
      res.status(201).json({ 
        message: 'Invitation sent',
        user,
        setupLink: process.env.NODE_ENV === 'development' ? setupLink : undefined
      });
    } catch (error) {
      handleError(error, res);
    }
  }
);

// Get paginated users
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const offset = (page - 1) * limit;

      const institutionId = req.user?.role === 'super_admin' 
        ? undefined 
        : req.user?.institutionId;

      const result = await getUsers(institutionId, limit, offset);
      res.json({
        data: result.users,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      handleError(error, res);
    }
  }
);

// Get single user
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    // Restrict access
    if (req.user.role === 'student' && req.user.uid !== req.params.id) {
      throw new AppError('Forbidden', 403);
    }

    const user = await getUser(req.params.id);
    res.json(user);
  } catch (error) {
    handleError(error, res);
  }
});

// Update user
router.put(
  '/:id',
  [
    body('email').optional().isEmail(),
    body('role').optional().isIn(['teacher', 'student', 'parent']),
    body('institutionId').optional().isString()
  ],
  async (req: Request, res: Response) => {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);

      const updatedUser = await updateUser(
        req.params.id,
        req.body,
        { role: req.user.role, uid: req.user.uid }
      );
      res.json(updatedUser);
    } catch (error) {
      handleError(error, res);
    }
  }
);

// Soft delete user
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);

    await deleteUser(req.params.id, req.user.role);
    res.sendStatus(204);
  } catch (error) {
    handleError(error, res);
  }
});

export default router;