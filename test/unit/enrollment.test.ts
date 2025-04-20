import express from 'express';
import request from 'supertest';
import enrollmentRoutes from '../../src/routes/enrollment.routes';
import EnrollmentController from '../../src/controllers/enrollment.controller';
import EnrollmentService from '../../src/services/enrollment.service';
import { sendEmail } from '../../src/utils/email.util';

jest.mock('../../src/utils/email.util', () => ({
  sendEmail: jest.fn(),
}));

// 🔐 Mock Auth & Role Middleware
jest.mock('../../src/middleware/auth.middleware', () => ({
  AuthMiddleware: {
    verifyToken: (req: any, _res: any, next: any) => {
      req.user = {
        uid: 'teacher1',
        role: 'Teacher',
        institutionId: 'institution-1',
        email: 'teacher@example.com',
      };
      next();
    },
  },
}));
jest.mock('../../src/middleware/role.middleware', () => ({
  RoleMiddleware: {
    authorizeRoles: () => (_req: any, _res: any, next: any) => next(),
  },
}));
jest.mock('../../src/middleware/validate.middleware', () => () => (_req: any, _res: any, next: any) => next());

// 🔧 Mock Firestore (chained where, get, doc)
jest.mock('../../src/config/firebase', () => {
  const enrollmentDoc = {
    get: jest.fn(() => ({
      exists: true,
      data: () => ({
        courseId: 'course123',
        studentId: 'student456',
        teacherId: 'teacher1',
        institutionId: 'institution-1',
        progress: 50,
        status: 'active',
      }),
    })),
    set: jest.fn(),
    update: jest.fn(),
  };

  const querySnapshot = {
    docs: [
      {
        id: 'enroll1',
        data: () => ({
          courseId: 'course123',
          studentId: 'student456',
          teacherId: 'teacher1',
          institutionId: 'institution-1',
          progress: 50,
          status: 'active',
        }),
      },
    ],
  };

  const whereChain = {
    where: jest.fn().mockReturnThis(),
    get: jest.fn(() => Promise.resolve(querySnapshot)),
  };

  return {
    db: {
      collection: jest.fn((name) => {
        if (name === 'users') {
          return {
            where: jest.fn(() => ({
              get: jest.fn(() => Promise.resolve({
                empty: false,
                docs: [
                  {
                    data: () => ({
                      fullName: 'John Student',
                      parentEmail: 'parent@example.com',
                    }),
                  },
                ],
              })),
            })),
          };
        }
        return {
          doc: jest.fn(() => enrollmentDoc),
          where: jest.fn(() => whereChain),
        };
      }),
    },
  };
});

const app = express();
app.use(express.json());
app.use('/enrollments', enrollmentRoutes);

const controller = new EnrollmentController();
const service = new EnrollmentService();
const mockUser = {
  uid: 'teacher1',
  role: 'Teacher',
  institutionId: 'institution-1',
  email: 'teacher@example.com',
};

// 🧪 Full Test Suite
describe('Enrollment Module – Full Stack', () => {
  const enrollmentData = {
    courseId: 'course123',
    studentId: 'student456',
  };

  describe('Service Layer', () => {
    it('enrolls a student', async () => {
      const result = await service.enrollStudent(enrollmentData, mockUser);
      expect(result).toHaveProperty('id');
    });

    it('gets all enrollments', async () => {
      const result = await service.getEnrollments({}, mockUser);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('gets student enrollments', async () => {
      const result = await service.getStudentEnrollments('student456', mockUser);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('updates progress and sends email', async () => {
      const updated = await service.updateProgress('enroll1', 75, mockUser);
      expect(updated.progress).toBe(75);
      expect(sendEmail).toHaveBeenCalled();
    });

    it('unenrolls a student', async () => {
      await expect(service.unenrollStudent('enroll1', mockUser)).resolves.toBeUndefined();
    });

    it('throws if unauthorized to update progress', async () => {
      const user2 = { ...mockUser, uid: 'different' };
      await expect(service.updateProgress('enroll1', 30, user2)).rejects.toEqual({
        status: 403,
        message: 'Unauthorized to update progress',
      });
    });
  });

  describe('Controller Layer', () => {
    const mockRes = () => {
      const res: any = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    it('enrollStudent returns 201', async () => {
      const req: any = { body: enrollmentData, user: mockUser };
      const res = mockRes();
      await controller.enrollStudent(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('getEnrollments returns 200', async () => {
      const req: any = { query: {}, user: mockUser };
      const res = mockRes();
      await controller.getEnrollments(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getStudentEnrollments returns 200', async () => {
      const req: any = { params: { id: 'student456' }, user: mockUser };
      const res = mockRes();
      await controller.getStudentEnrollments(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('updateProgress returns 200', async () => {
      const req: any = { params: { id: 'enroll1' }, body: { progress: 75 }, user: mockUser };
      const res = mockRes();
      await controller.updateProgress(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('unenrollStudent returns 200', async () => {
      const req: any = { params: { id: 'enroll1' }, user: mockUser };
      const res = mockRes();
      await controller.unenrollStudent(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Route Integration', () => {
    const token = 'Bearer test-token';

    it('POST /enrollments', async () => {
      const res = await request(app)
        .post('/enrollments')
        .set('Authorization', token)
        .send(enrollmentData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    it('GET /enrollments', async () => {
      const res = await request(app)
        .get('/enrollments')
        .set('Authorization', token);

      expect(res.statusCode).toBe(200);
    });

    it('GET /enrollments/students/:id', async () => {
      const res = await request(app)
        .get('/enrollments/students/student456')
        .set('Authorization', token);

      expect(res.statusCode).toBe(200);
    });

    it('PUT /enrollments/:id/progress', async () => {
      const res = await request(app)
        .put('/enrollments/enroll1/progress')
        .set('Authorization', token)
        .send({ progress: 75 });

      expect(res.statusCode).toBe(200);
    });

    it('DELETE /enrollments/:id', async () => {
      const res = await request(app)
        .delete('/enrollments/enroll1')
        .set('Authorization', token);

      expect(res.statusCode).toBe(200);
    });
  });
});
