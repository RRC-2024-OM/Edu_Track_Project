import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class CourseController {
  private courseService = new CourseService();

  async createCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const course = await this.courseService.createCourse(req.body, req.user!); // `user!` ensures user is non-null
      res.status(201).json(course);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message });
    }
  }

  async getAllCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { institutionId, isPublished } = req.query; 
      const pageSize = parseInt(req.query.pageSize as string) || 10; 
      const lastDoc = req.query.lastDoc ? JSON.parse(req.query.lastDoc as string) : null; 

      // Pass filters and pagination to the service
      const filter = {
        institutionId: institutionId as string,
        isPublished: isPublished === 'true' ? true : false,
      };

      const { courses, lastVisible } = await this.courseService.getAllCourses(req.user!, filter, pageSize, lastDoc);

      res.status(200).json({
        courses,
        lastVisible: lastVisible ? lastVisible.id : null, // Pass last document ID for pagination
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message });
    }
  }

  async getCourseById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const course = await this.courseService.getCourseById(req.params.id, req.user!);
      if (!course) res.status(404).json({ message: 'Course not found' });
      res.status(200).json(course);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message });
    }
  }

  async updateCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await this.courseService.updateCourse(req.params.id, req.body, req.user!);
      res.status(200).json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(403).json({ message });
    }
  }

  async deleteCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await this.courseService.deleteCourse(req.params.id, req.user!);
      res.status(200).json({ message: 'Course archived' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(403).json({ message });
    }
  }

  async publishCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await this.courseService.togglePublishStatus(req.params.id, req.user!);
      res.status(200).json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(403).json({ message });
    }
  }

  async getCourseStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await this.courseService.getCourseStats(req.params.id, req.user!);
      res.status(200).json(stats);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(403).json({ message });
    }
  }
}
