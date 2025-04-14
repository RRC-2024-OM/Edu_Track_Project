import express from 'express';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { CourseController } from '../controllers/course.controller';

const router = express.Router();
const controller = new CourseController();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Manage courses for the platform
 */

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - institutionId
 *               - teacherId
 *             properties:
 *               title:
 *                 type: string
 *                 description: The course's title
 *               description:
 *                 type: string
 *                 description: The course's description
 *               institutionId:
 *                 type: string
 *                 description: The institution associated with the course
 *               teacherId:
 *                 type: string
 *                 description: The teacher who owns the course
 *               isPublished:
 *                 type: boolean
 *                 description: Whether the course is published or not
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Missing or invalid fields
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole('Teacher', 'InstitutionAdmin', 'SuperAdmin'),
  (req, res) => controller.createCourse(req as AuthenticatedRequest, res)
);

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: institutionId
 *         schema:
 *           type: string
 *         description: The institutionId to filter courses by
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *         description: Filter courses by published status
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   isPublished:
 *                     type: boolean
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  AuthMiddleware.verifyToken,
  (req, res) => controller.getAllCourses(req as AuthenticatedRequest, res)
);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get course details by ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the course
 *     responses:
 *       200:
 *         description: The course details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 institutionId:
 *                   type: string
 *                 teacherId:
 *                   type: string
 *                 isPublished:
 *                   type: boolean
 *       404:
 *         description: Course not found
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  AuthMiddleware.verifyToken,
  (req, res) => controller.getCourseById(req as AuthenticatedRequest, res)
);

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Update course metadata
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The course's title
 *               description:
 *                 type: string
 *                 description: The course's description
 *               isPublished:
 *                 type: boolean
 *                 description: Whether the course is published
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       400:
 *         description: Missing or invalid fields
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  AuthMiddleware.verifyToken,
  (req, res) => controller.updateCourse(req as AuthenticatedRequest, res)
);

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Delete (archive) a course by ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the course
 *     responses:
 *       200:
 *         description: Course archived successfully
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  AuthMiddleware.verifyToken,
  (req, res) => controller.deleteCourse(req as AuthenticatedRequest, res)
);

/**
 * @swagger
 * /courses/{id}/publish:
 *   post:
 *     summary: Publish or unpublish a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the course
 *     responses:
 *       200:
 *         description: Course published or unpublished successfully
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/publish',
  AuthMiddleware.verifyToken,
  (req, res) => controller.publishCourse(req as AuthenticatedRequest, res)
);

/**
 * @swagger
 * /courses/{id}/stats:
 *   get:
 *     summary: Get course enrollment stats
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the course
 *     responses:
 *       200:
 *         description: Enrollment stats for the course
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enrolled:
 *                   type: integer
 *                 averageProgress:
 *                   type: integer
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  '/:id/stats',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole('Teacher', 'InstitutionAdmin', 'SuperAdmin'),
  (req, res) => controller.getCourseStats(req as AuthenticatedRequest, res)
);

export default router;
