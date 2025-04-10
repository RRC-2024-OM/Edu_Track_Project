import express from 'express';
import multer from 'multer';
import { UserController } from '../controllers/user.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const upload = multer(); // in-memory storage
const userController = new UserController();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by user role
 *       - in: query
 *         name: institutionId
 *         schema:
 *           type: string
 *         description: Filter by institution ID
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole('InstitutionAdmin', 'SuperAdmin'),
  (req: express.Request, res: express.Response) => userController.getAllUsers(req, res)
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The user
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
router.get(
  '/:id',
  AuthMiddleware.verifyToken,
  (req, res) => userController.getUserById(req, res)
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
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
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               institutionId:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole('InstitutionAdmin', 'SuperAdmin'),
  (req, res) => userController.createUser(req, res)
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               institutionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  AuthMiddleware.verifyToken,
  (req, res) => userController.updateUser(req, res)
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID (SUPER_ADMIN only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole('SuperAdmin'),
  (req, res) => userController.deleteUser(req, res)
);

/**
 * @swagger
 * /users/bulk:
 *   post:
 *     summary: Bulk import users via CSV
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Users imported
 *       400:
 *         description: No CSV provided
 *       500:
 *         description: Server error
 */
router.post(
  '/bulk',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole('InstitutionAdmin', 'SuperAdmin'),
  upload.single('file'),
  (req, res) => userController.importUsers(req, res)
);

export default router;
