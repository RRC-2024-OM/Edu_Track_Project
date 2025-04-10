import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class CourseController {
  private courseService = new CourseService();

  async createCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const course = await this.courseService.createCourse(req.body, req.user!); 
      res.status(201).json(course);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message });
    }
  }

  async getAllCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter = {
        institutionId: req.query.institutionId as string,
        isPublished: req.query.isPublished === 'true',
      };
      const courses = await this.courseService.getAllCourses(req.user!, filter);
      res.status(200).json(courses);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message });
    }
  }

  async getCourseById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const course = await this.courseService.getCourseById(req.params.id, req.user!);
      if (!course) {
        res.status(404).json({ message: 'Course not found' });
        return;
      }
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
