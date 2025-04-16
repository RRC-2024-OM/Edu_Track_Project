import { Router } from 'express';
import AnalyticsController from '../controllers/analytics.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { RoleMiddleware } from '../middleware/role.middleware';

const router = Router();
const controller = new AnalyticsController();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Endpoints for institution, teacher, student, and course analytics with export options
 */

/**
 * @swagger
 * /analytics/institution:
 *   get:
 *     summary: Get institution-wide analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Institution analytics retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/institution',
  AuthMiddleware.verifyToken,
  RoleMiddleware.authorizeRoles('SuperAdmin', 'InstitutionAdmin'),
  controller.getInstitutionAnalytics.bind(controller)
);

/**
 * @swagger
 * /analytics/teachers:
 *   get:
 *     summary: Get performance metrics for all teachers
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher analytics retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/teachers',
  AuthMiddleware.verifyToken,
  RoleMiddleware.authorizeRoles('SuperAdmin', 'InstitutionAdmin'),
  controller.getTeacherAnalytics.bind(controller)
);

/**
 * @swagger
 * /analytics/students/{id}:
 *   get:
 *     summary: Get analytics for a specific student
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student analytics retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/students/:id',
  AuthMiddleware.verifyToken,
  RoleMiddleware.authorizeRoles('SuperAdmin', 'InstitutionAdmin', 'Parent', 'Teacher'),
  controller.getStudentAnalytics.bind(controller)
);

/**
 * @swagger
 * /analytics/courses/{id}:
 *   get:
 *     summary: Get course engagement analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course analytics retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/courses/:id',
  AuthMiddleware.verifyToken,
  RoleMiddleware.authorizeRoles('SuperAdmin', 'InstitutionAdmin', 'Teacher'),
  controller.getCourseAnalytics.bind(controller)
);

/**
 * @swagger
 * /analytics/institution/export:
 *   get:
 *     summary: Export institution analytics as CSV
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file with institution analytics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/institution/export',
  AuthMiddleware.verifyToken,
  RoleMiddleware.authorizeRoles('SuperAdmin', 'InstitutionAdmin'),
  controller.exportInstitutionAnalytics.bind(controller)
);

/**
 * @swagger
 * /analytics/teachers/export:
 *   get:
 *     summary: Export teacher analytics as CSV
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file with teacher analytics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/teachers/export',
  AuthMiddleware.verifyToken,
  RoleMiddleware.authorizeRoles('SuperAdmin', 'InstitutionAdmin'),
  controller.exportTeacherAnalytics.bind(controller)
);

export default router;
