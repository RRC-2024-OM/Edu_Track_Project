import { Request, Response, NextFunction } from 'express';
import EnrollmentService from '../services/enrollment.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { UserWithRole } from '../types/enrollment.types';

const enrollmentService = new EnrollmentService();

export default class EnrollmentController {
  async enrollStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user as UserWithRole;
      const enrollment = await enrollmentService.enrollStudent(req.body, user);
      res.status(201).json(enrollment);
    } catch (error) {
      next(error);
    }
  }

  async getEnrollments(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user as UserWithRole;
      const enrollments = await enrollmentService.getEnrollments(req.query, user);
      res.status(200).json(enrollments);
    } catch (error) {
      next(error);
    }
  }

  async unenrollStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user as UserWithRole;
      const { id } = req.params;
      await enrollmentService.unenrollStudent(id, user);
      res.status(200).json({ message: 'Enrollment removed successfully.' });
    } catch (error) {
      next(error);
    }
  }

  async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user as UserWithRole;
      const { id } = req.params;
      const { progress } = req.body;
      const updated = await enrollmentService.updateProgress(id, progress, user);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  async getStudentEnrollments(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthenticatedRequest).user as UserWithRole;
      const { id } = req.params; // studentId
      const enrollments = await enrollmentService.getStudentEnrollments(id, user);
      res.status(200).json(enrollments);
    } catch (error) {
      next(error);
    }
  }
}
