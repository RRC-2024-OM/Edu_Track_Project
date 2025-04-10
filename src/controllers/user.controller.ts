import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ROLES } from '../config/constants';

const userService = new UserService();

export class UserController {
  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Get all users (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: role
   *         in: query
   *         schema:
   *           type: string
   *         description: Filter by user role
   *       - name: institutionId
   *         in: query
   *         schema:
   *           type: string
   *         description: Filter by institution ID
   *     responses:
   *       200:
   *         description: List of users
   *       500:
   *         description: Internal server error
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { role, institutionId } = req.query;
      const users = await userService.getAllUsers({
        role: role?.toString(),
        institutionId: institutionId?.toString(),
      });
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users', details: error });
    }
  }

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
   *         description: Unauthorized access
   *       404:
   *         description: User not found
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    const userId = req.params.id;
    const requester = (req as any).user;

    if (requester.uid !== userId && !['InstitutionAdmin', 'SuperAdmin'].includes(requester.role)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    try {
      const user = await userService.getUserById(userId);
      res.status(200).json(user);
    } catch (error) {
      res.status(404).json({ message: 'User not found' });
    }
  }

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
   *         description: Missing fields
   *       500:
   *         description: Server error
   */
  async createUser(req: Request, res: Response): Promise<void> {
    const { email, role, institutionId, name } = req.body;

    if (!email || !role) {
      res.status(400).json({ error: 'Missing required fields (email, role)' });
      return;
    }

    if (!Object.values(ROLES).includes(role)) {
      res.status(400).json({ error: `Invalid role. Accepted roles: ${Object.values(ROLES).join(', ')}` });
      return;
    }

    try {
      const user = await userService.createUser({ email, role, institutionId, name });
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user', details: error });
    }
  }

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
   *         description: Server error
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.id;
    const requester = (req as any).user;

    if (requester.uid !== userId && !['InstitutionAdmin', 'SuperAdmin'].includes(requester.role)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    try {
      const updatedUser = await userService.updateUser(userId, req.body);
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user', details: error });
    }
  }

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
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    const requester = (req as any).user;
    const userId = req.params.id;

    if (requester.role !== 'SuperAdmin') {
      res.status(403).json({ message: 'Only SuperAdmin can delete users.' });
      return;
    }

    try {
      const result = await userService.deleteUser(userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user', details: error });
    }
  }

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
   *         description: Bulk import successful
   *       400:
   *         description: No CSV provided
   *       500:
   *         description: Import failed
   */
  async importUsers(req: Request, res: Response): Promise<void> {
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: 'CSV file is required.' });
      return;
    }

    try {
      const results = await userService.importUsersFromCSV(file.buffer);
      res.status(200).json({ message: 'Bulk import completed', results });
    } catch (error) {
      res.status(500).json({ message: 'Bulk import failed', details: error });
    }
  }
}
