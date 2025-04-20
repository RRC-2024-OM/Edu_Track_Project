import express from 'express';
import request from 'supertest';
import analyticsRoutes from '../../src/routes/analytics.routes';
import { db } from '../../src/config/firebase';
import { sendCsvResponse } from '../../src/utils/csv.util';
import { sendPdfResponse } from '../../src/utils/pdf.util';
import AnalyticsController from '../../src/controllers/analytics.controller';
import { RoleMiddleware } from '../../src/middleware/role.middleware';
import type { CollectionReference, DocumentData } from 'firebase-admin/firestore';

jest.mock('../../src/utils/csv.util', () => ({
  sendCsvResponse: jest.fn((res, data, filename) => res.status(200).json({ filename, data }))
}));

jest.mock('../../src/utils/pdf.util', () => ({
  sendPdfResponse: jest.fn((res, title, headers, data, filename) => res.status(200).json({ title, filename, data }))
}));

jest.mock('../../src/config/firebase', () => {
  const mockGet = jest.fn().mockResolvedValue({ docs: [] });

  const mockCollection = (): Partial<CollectionReference<DocumentData>> => ({
    where: jest.fn(() => ({
      where: jest.fn(() => ({ get: mockGet })),
      get: mockGet,
    })),
    get: mockGet,
  }) as unknown as CollectionReference<DocumentData>;

  return {
    db: {
      collection: jest.fn(() => mockCollection()),
    },
  };
});

jest.mock('../../src/middleware/auth.middleware', () => ({
  AuthMiddleware: {
    verifyToken: (_req: any, _res: any, next: any) => {
      _req.user = { uid: 'admin123', role: 'InstitutionAdmin', institutionId: 'inst1' };
      return next();
    },
  },
}));

jest.mock('../../src/middleware/role.middleware', () => ({
  RoleMiddleware: {
    authorizeRoles: (..._roles: string[]) => (_req: any, _res: any, next: any) => next(),
  },
}));

const app = express();
app.use(express.json());
app.use('/analytics', analyticsRoutes);

const unauthorizedApp = express();
unauthorizedApp.use(express.json());

const controller = new AnalyticsController();

unauthorizedApp.use('/analytics', express.Router()
  .get('/institution', (_req, res) => controller.getInstitutionAnalytics(_req, res))
  .get('/teachers', (_req, res) => controller.getTeacherAnalytics(_req, res))
  .get('/students/:id', (_req, res) => controller.getStudentAnalytics(_req, res))
  .get('/courses/:id', (_req, res) => controller.getCourseAnalytics(_req, res))
  .get('/institution/export', (_req, res) => controller.exportInstitutionAnalytics(_req, res))
  .get('/teachers/export', (_req, res) => controller.exportTeacherAnalytics(_req, res))
  .get('/institution/export/pdf', (_req, res) => controller.exportInstitutionAnalyticsPdf(_req, res))
  .get('/teachers/export/pdf', (_req, res) => controller.exportTeacherAnalyticsPdf(_req, res))
);

describe('Analytics Module – Full Stack Test', () => {
  const mockDocs = [
    { id: '1', data: () => ({ progress: 80, teacherId: 't1', studentId: 's1', courseId: 'c1', status: 'active' }) },
    { id: '2', data: () => ({ progress: 100, teacherId: 't1', studentId: 's1', courseId: 'c1', status: 'active' }) },
  ];

  const mockGet = jest.fn().mockResolvedValue({ docs: mockDocs, size: mockDocs.length });

  beforeEach(() => {
    jest.clearAllMocks();
    (db.collection as jest.Mock).mockImplementation(() => ({
      where: jest.fn(() => ({
        where: jest.fn(() => ({ get: mockGet })),
        get: mockGet,
      })),
      get: mockGet,
    }));
  });

  it('GET /analytics/institution - returns institution report', async () => {
    const res = await request(app).get('/analytics/institution');
    expect(res.status).toBe(200);
    expect(res.body.totalCourses).toBeDefined();
    expect(res.body.avgProgress).toBeDefined();
  });

  it('GET /analytics/teachers - returns teacher performance', async () => {
    const res = await request(app).get('/analytics/teachers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('teacherId');
  });

  it('GET /analytics/students/:id - returns student analytics', async () => {
    const res = await request(app).get('/analytics/students/s1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /analytics/courses/:id - returns course engagement', async () => {
    const res = await request(app).get('/analytics/courses/c1');
    expect(res.status).toBe(200);
    expect(res.body.courseId).toBe('c1');
    expect(res.body.totalEnrolled).toBeGreaterThanOrEqual(0);
  });

  it('GET /analytics/institution/export - returns CSV', async () => {
    const res = await request(app).get('/analytics/institution/export');
    expect(res.status).toBe(200);
    expect(res.body.filename).toBe('institution_report.csv');
    expect(sendCsvResponse).toHaveBeenCalled();
  });

  it('GET /analytics/teachers/export - returns CSV', async () => {
    const res = await request(app).get('/analytics/teachers/export');
    expect(res.status).toBe(200);
    expect(res.body.filename).toBe('teacher_performance.csv');
    expect(sendCsvResponse).toHaveBeenCalled();
  });

  it('GET /analytics/institution/export/pdf - returns PDF', async () => {
    const res = await request(app).get('/analytics/institution/export/pdf');
    expect(res.status).toBe(200);
    expect(res.body.filename).toBe('institution_report.pdf');
    expect(sendPdfResponse).toHaveBeenCalled();
  });

  it('GET /analytics/teachers/export/pdf - returns PDF', async () => {
    const res = await request(app).get('/analytics/teachers/export/pdf');
    expect(res.status).toBe(200);
    expect(res.body.filename).toBe('teacher_report.pdf');
    expect(sendPdfResponse).toHaveBeenCalled();
  });

  it('GET /analytics/institution - unauthorized', async () => {
    const res = await request(unauthorizedApp).get('/analytics/institution');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('GET /analytics/teachers - unauthorized', async () => {
    const res = await request(unauthorizedApp).get('/analytics/teachers');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('GET /analytics/students/s1 - unauthorized', async () => {
    const res = await request(unauthorizedApp).get('/analytics/students/s1');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('GET /analytics/courses/c1 - unauthorized', async () => {
    const res = await request(unauthorizedApp).get('/analytics/courses/c1');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('GET /analytics/institution/export - unauthorized', async () => {
    const res = await request(unauthorizedApp).get('/analytics/institution/export');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('GET /analytics/teachers/export - unauthorized', async () => {
    const res = await request(unauthorizedApp).get('/analytics/teachers/export');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('GET /analytics/institution/export/pdf - unauthorized', async () => {
    const res = await request(unauthorizedApp).get('/analytics/institution/export/pdf');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('GET /analytics/teachers/export/pdf - unauthorized', async () => {
    const res = await request(unauthorizedApp).get('/analytics/teachers/export/pdf');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
