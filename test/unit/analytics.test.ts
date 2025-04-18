
import request from 'supertest';
import app from '../../src/app';
import { db } from '../../src/config/firebase';

jest.mock('../../src/config/firebase', () => ({
  db: {
    collection: jest.fn()
  }
}));

jest.mock('../../src/utils/csv.util', () => ({
  sendCsvResponse: jest.fn((res, data, filename) => res.status(200).json({ filename, data }))
}));

jest.mock('../../src/utils/pdf.util', () => ({
  sendPdfResponse: jest.fn((res, title, headers, data, filename) => res.status(200).json({ title, filename, data }))
}));

jest.mock('firebase-admin');

describe('Analytics Module - Full Suite', () => {
  const mockCollection = jest.fn();
  const mockWhere = jest.fn();
  const mockGet = jest.fn();

  const mockDocs = [
    { data: () => ({ progress: 80, teacherId: 't1', studentId: 's1', courseId: 'c1', status: 'active' }), id: '1' },
    { data: () => ({ progress: 100, teacherId: 't1', studentId: 's1', courseId: 'c1', status: 'active' }), id: '2' }
  ];
  const mockQuerySnapshot = {
    size: mockDocs.length,
    docs: mockDocs,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue(mockQuerySnapshot);
    mockWhere.mockReturnValue({ where: mockWhere, get: mockGet });
    mockCollection.mockReturnValue({ where: mockWhere, get: mockGet });
    (db.collection as jest.Mock).mockImplementation(mockCollection);
  });

  it('GET /analytics/institution', async () => {
    const res = await request(app).get('/analytics/institution').set('Authorization', 'Bearer mock-institution-admin-token');
    expect(res.status).toBe(200);
    expect(res.body.totalCourses).toBe(2);
    expect(res.body.avgProgress).toBe(90);
  });

  it('GET /analytics/teachers', async () => {
    const res = await request(app).get('/analytics/teachers').set('Authorization', 'Bearer mock-institution-admin-token');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].teacherId).toBe('t1');
  });

  it('GET /analytics/students/:id', async () => {
    const res = await request(app).get('/analytics/students/s1').set('Authorization', 'Bearer mock-teacher-token');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /analytics/courses/:id', async () => {
    const res = await request(app).get('/analytics/courses/c1').set('Authorization', 'Bearer mock-teacher-token');
    expect(res.status).toBe(200);
    expect(res.body.courseId).toBe('c1');
    expect(res.body.totalEnrolled).toBe(2);
    expect(res.body.avgProgress).toBe(90);
  });

  it('GET /analytics/institution/export', async () => {
    const res = await request(app).get('/analytics/institution/export').set('Authorization', 'Bearer mock-institution-admin-token');
    expect(res.status).toBe(200);
    expect(res.body.filename).toBe('institution_report.csv');
  });

  it('GET /analytics/teachers/export', async () => {
    const res = await request(app).get('/analytics/teachers/export').set('Authorization', 'Bearer mock-institution-admin-token');
    expect(res.status).toBe(200);
    expect(res.body.filename).toBe('teacher_performance.csv');
  });

  it('GET /analytics/institution/export/pdf', async () => {
    const res = await request(app).get('/analytics/institution/export/pdf').set('Authorization', 'Bearer mock-institution-admin-token');
    expect(res.status).toBe(200);
    expect(res.body.filename).toBe('institution_report.pdf');
  });

  it('GET /analytics/teachers/export/pdf', async () => {
    const res = await request(app).get('/analytics/teachers/export/pdf').set('Authorization', 'Bearer mock-institution-admin-token');
    expect(res.status).toBe(200);
    expect(res.body.filename).toBe('teacher_report.pdf');
  });
});
