import { Request, Response } from 'express';
import AnalyticsService from '../services/analytics.service';
import { UserWithRole } from '../types/user.types';
import { sendCsvResponse } from '../utils/csv.util';

export default class AnalyticsController {
  private service = new AnalyticsService();

  async getInstitutionAnalytics(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = req.user as UserWithRole;
    const result = await this.service.institutionReport(user);
    res.status(200).json(result);
  }

  async getTeacherAnalytics(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = req.user as UserWithRole;
    const result = await this.service.teacherPerformance(user);
    res.status(200).json(result);
  }

  async getStudentAnalytics(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = req.user as UserWithRole;
    const studentId = req.params.id;
    const result = await this.service.studentReport(studentId, user);
    res.status(200).json(result);
  }

  async getCourseAnalytics(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = req.user as UserWithRole;
    const courseId = req.params.id;
    const result = await this.service.courseEngagement(courseId, user);
    res.status(200).json(result);
  }

  

async exportInstitutionAnalytics(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = req.user as UserWithRole;
  const data = await this.service.institutionReport(user);
  sendCsvResponse(res, [data], 'institution_report.csv');
}

async exportTeacherAnalytics(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = req.user as UserWithRole;
  const data = await this.service.teacherPerformance(user);
  sendCsvResponse(res, data, 'teacher_performance.csv');
}

}
