import express from 'express';
import request from 'supertest';
import { CourseController } from '../../src/controllers/course.controller';
import { CourseService } from '../../src/services/course.service';
import courseRoutes from '../../src/routes/course.routes';

jest.mock('../../src/config/firebase', () => {
  const mockDoc = {
    set: jest.fn(),
    get: jest.fn(() => ({
      exists: true,
      data: () => ({
        teacherId: 'teacher1',
        institutionId: 'inst1',
        isPublished: false,
      }),
    })),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockQuerySnapshot = {
    docs: [
      {
        id: 'course-1',
        data: () => ({
          teacherId: 'teacher1',
          institutionId: 'inst1',
          isPublished: true,
        }),
      },
    ],
  };

  const mockQuery = {
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    startAfter: jest.fn().mockReturnThis(),
    get: jest.fn(() => Promise.resolve(mockQuerySnapshot)),
  };

  return {
    db: {
      collection: jest.fn(() => ({
        doc: jest.fn(() => mockDoc),
        get: jest.fn(() => Promise.resolve(mockQuerySnapshot)),
        where: mockQuery.where,
        limit: mockQuery.limit,
        startAfter: mockQuery.startAfter,
        getDocs: mockQuery.get,
      })),
    },
  };
});

// Mock Firebase Auth middleware
jest.mock('../../src/middleware/auth.middleware', () => ({
  AuthMiddleware: {
    verifyToken: (req: any, _res: any, next: any) => {
      req.user = {
        uid: 'teacher1',
        role: 'Teacher',
        institutionId: 'inst1',
        email: 'mock@edu.com',
      };
      next();
    },
    requireRole: (..._roles: string[]) => (_req: any, _res: any, next: any) => next(),
  },
}));

const mockUser = {
  uid: 'teacher1',
  role: 'Teacher',
  institutionId: 'inst1',
  email: 'mock@edu.com',
};

describe('Courses Module – Full Stack Test', () => {
  const service = new CourseService();
  const controller = new CourseController();

  const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('Service Layer', () => {
    it('creates a course', async () => {
      const result = await service.createCourse({ title: 'Math' }, mockUser);
      expect(result).toHaveProperty('id');
    });

    it('gets all courses with filter', async () => {
      const result = await service.getAllCourses(mockUser, { isPublished: true }, 10, null);
      expect(result.courses.length).toBeGreaterThanOrEqual(1);
    });

    it('gets a course by ID', async () => {
      const result = await service.getCourseById('course-1', mockUser);
      expect(result).toHaveProperty('id');
    });

    it('fails to getCourseById if user is undefined', async () => {
      await expect(service.getCourseById('course-1', undefined as any)).rejects.toThrow('Unauthorized');
    });

    it('updates a course successfully', async () => {
      const updated = await service.updateCourse('course-1', { title: 'New' }, mockUser);
      expect(updated).toHaveProperty('title', 'New');
    });

    it('throws if unauthorized to update', async () => {
      const user2 = { ...mockUser, uid: 'other' };
      await expect(service.updateCourse('course-1', {}, user2)).rejects.toThrow('Not authorized');
    });

    it('deletes a course successfully', async () => {
      await expect(service.deleteCourse('course-1', mockUser)).resolves.toBeUndefined();
    });

    it('publishes/unpublishes a course', async () => {
      const updated = await service.togglePublishStatus('course-1', mockUser);
      expect(updated).toHaveProperty('isPublished', true);
    });

    it('returns course stats', async () => {
      const stats = await service.getCourseStats('course-1', mockUser);
      expect(stats).toHaveProperty('enrolled');
    });
  });

  describe('Controller Layer', () => {
    it('creates a course (201)', async () => {
      const req: any = { body: { title: 'Course' }, user: mockUser };
      const res = mockRes();
      await controller.createCourse(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('gets all courses (200)', async () => {
      const req: any = { query: {}, user: mockUser };
      const res = mockRes();
      await controller.getAllCourses(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('gets course by ID (200)', async () => {
      const req: any = { params: { id: 'course-1' }, user: mockUser };
      const res = mockRes();
      await controller.getCourseById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('updates course (200)', async () => {
      const req: any = { params: { id: '1' }, body: { title: 'New' }, user: mockUser };
      const res = mockRes();
      await controller.updateCourse(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deletes course (200)', async () => {
      const req: any = { params: { id: '1' }, user: mockUser };
      const res = mockRes();
      await controller.deleteCourse(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('publishes course (200)', async () => {
      const req: any = { params: { id: '1' }, user: mockUser };
      const res = mockRes();
      await controller.publishCourse(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('gets stats (200)', async () => {
      const req: any = { params: { id: '1' }, user: mockUser };
      const res = mockRes();
      await controller.getCourseStats(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Route Integration', () => {
    const app = express();
    app.use(express.json());
    app.use('/courses', courseRoutes);

    it('POST /courses', async () => {
      const res = await request(app).post('/courses').send({ title: 'Math' });
      expect(res.statusCode).toBe(201);
    });

    it('GET /courses', async () => {
      const res = await request(app).get('/courses');
      expect(res.statusCode).toBe(200);
    });

    it('GET /courses/:id', async () => {
      const res = await request(app).get('/courses/abc123');
      expect(res.statusCode).toBe(200);
    });

    it('PUT /courses/:id', async () => {
      const res = await request(app).put('/courses/abc123').send({ title: 'Update' });
      expect(res.statusCode).toBe(200);
    });

    it('DELETE /courses/:id', async () => {
      const res = await request(app).delete('/courses/abc123');
      expect(res.statusCode).toBe(200);
    });

    it('POST /courses/:id/publish', async () => {
      const res = await request(app).post('/courses/abc123/publish');
      expect(res.statusCode).toBe(200);
    });

    it('GET /courses/:id/stats', async () => {
      const res = await request(app).get('/courses/abc123/stats');
      expect(res.statusCode).toBe(200);
    });
  });
});
