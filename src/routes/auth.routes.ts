import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const authController = new AuthController();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication routes
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
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
 *               institutionId:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing fields
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post(
  '/register',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole('SuperAdmin'),
  async (req, res) => {
    try {
      await authController.register(req, res);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Server error', error: errorMessage });
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and return a custom token
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
 *         description: Login successful
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
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  try {
    await authController.login(req, res);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Server error', error: errorMessage });
  }
});

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
router.post(
  '/set-claims',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole('SuperAdmin'),
  async (req, res) => {
    try {
      await authController.setClaims(req, res);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Server error', error: errorMessage });
    }
  }
);

export default router;
