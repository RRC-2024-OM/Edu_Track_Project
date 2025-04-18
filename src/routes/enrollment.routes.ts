import { Router } from 'express';
import EnrollmentController from '../controllers/enrollment.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { RoleMiddleware } from '../middleware/role.middleware';
import validate from '../middleware/validate.middleware';
import {
  enrollStudentSchema,
  updateProgressSchema,
} from '../validations/enrollment.validation';

const router = Router();
const controller = new EnrollmentController();

/**
 * @swagger
 * tags:
 *   name: Enrollments
 *   description: Student Enrollment & Progress Tracking
 */

/**
 * @swagger
 * /enrollments:
 *   post:
 *     summary: Enroll a student into a course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EnrollStudent'
 *     responses:
 *       201:
 *         description: Student successfully enrolled
 *       403:
 *         description: Unauthorized
 */
router.post(
  '/',
  AuthMiddleware.verifyToken,
  RoleMiddleware.authorizeRoles('Teacher', 'InstitutionAdmin', 'SuperAdmin'),
  validate(enrollStudentSchema),
  controller.enrollStudent.bind(controller)
);

/**
 * @swagger
 * /enrollments:
 *   get:
 *     summary: Get enrollments with optional filters
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course ID
 *     responses:
 *       200:
 *         description: List of enrollments
 *       403:
 *         description: Unauthorized
 */
router.get(
  '/',
  AuthMiddleware.verifyToken,
  RoleMiddleware.authorizeRoles('Teacher', 'InstitutionAdmin', 'SuperAdmin'),
  controller.getEnrollments.bind(controller)
);

/**
 * @swagger
 * /enrollments/{id}:
 *   delete:
 *     summary: Unenroll a student from a course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Enrollment ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment successfully removed
 *       403:
 *         description: Unauthorized
 */
router.delete(
  '/:id',
  AuthMiddleware.verifyToken,
  RoleMiddleware.authorizeRoles('Teacher', 'InstitutionAdmin', 'SuperAdmin'),
  controller.unenrollStudent.bind(controller)
);

/**
 * @swagger
 * /enrollments/{id}/progress:
 *   put:
 *     summary: Update a student's progress in a course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Enrollment ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProgress'
 *     responses:
 *       200:
 *         description: Progress updated
 *       403:
 *         description: Unauthorized
 */
router.put(
  '/:id/progress',
  AuthMiddleware.verifyToken,
  RoleMiddleware.authorizeRoles('Teacher'),
  validate(updateProgressSchema),
  controller.updateProgress.bind(controller)
);

/**
 * @swagger
 * /enrollments/students/{id}:
 *   get:
 *     summary: Get all enrollments for a specific student
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Student ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student enrollments retrieved
 *       403:
 *         description: Unauthorized
 */
router.get(
  '/students/:id',
  AuthMiddleware.verifyToken,
  RoleMiddleware.authorizeRoles('Parent', 'Teacher', 'InstitutionAdmin', 'SuperAdmin'),
  controller.getStudentEnrollments.bind(controller)
);

export default router;
