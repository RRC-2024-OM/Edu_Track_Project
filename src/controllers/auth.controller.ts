import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ROLES } from '../config/constants';

const authService = new AuthService();

export class AuthController {
  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register a new user with role and institution
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - role
   *               - institutionId
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [SUPER_ADMIN, INSTITUTION_ADMIN, TEACHER, STUDENT, PARENT]
   *               institutionId:
   *                 type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   *       400:
   *         description: Missing required fields or invalid role
   *       500:
   *         description: Registration failed
   */
  async register(req: Request, res: Response): Promise<Response> {
    const { email, password, role, institutionId } = req.body;

    if (!email || !password || !role || !institutionId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: `Invalid role. Accepted roles: ${Object.values(ROLES).join(', ')}` });
    }

    try {
      const user = await authService.registerUser({ email, password, role, institutionId });
      return res.status(201).json(user);
    } catch (error) {
      return res.status(500).json({ error: 'User registration failed.', details: error });
    }
  }

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Log in user and receive custom token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token issued
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                 uid:
   *                   type: string
   *                 email:
   *                   type: string
   *                 role:
   *                   type: string
   *       400:
   *         description: Missing email or password
   *       401:
   *         description: Invalid credentials or user not found
   */
  async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
      const result = await authService.loginUser(email, password);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid credentials or user not found.' });
    }
  }
    /**
   * @swagger
   * /auth/set-claims:
   *   post:
   *     summary: Modify user role and institutionId (Super Admin only)
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - uid
   *               - role
   *             properties:
   *               uid:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [SUPER_ADMIN, INSTITUTION_ADMIN, TEACHER, STUDENT, PARENT]
   *               institutionId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Claims updated successfully
   *       400:
   *         description: Missing or invalid data
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Server error
   */
    async setClaims(req: Request, res: Response): Promise<Response> {
      const { uid, role, institutionId } = req.body;
  
      if (!uid || !role) {
        return res.status(400).json({ error: 'UID and role are required.' });
      }
  
      if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({ error: `Invalid role. Accepted roles: ${Object.values(ROLES).join(', ')}` });
      }
  
      try {
        const result = await authService.setCustomClaims(uid, role, institutionId);
        return res.status(200).json({ message: 'Claims updated successfully', result });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to update claims.', details: error });
      }
    }
}
