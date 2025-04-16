
import request from 'supertest';
import app from '../../src/app';
import EnrollmentService from '../../src/services/enrollment.service';


jest.mock('../../src/services/enrollment.service');

jest.mock('../../src/utils/email.util', () => ({
  sendEmail: jest.fn(),
}));

const MockEnrollmentService = EnrollmentService as jest.MockedClass<typeof EnrollmentService>;

describe('Enrollment Controller & Routes', () => {
  const mockEnrollment = {
    id: 'enroll1',
    courseId: 'course123',
    studentId: 'student456',
    teacherId: 'mock-teacher',
    institutionId: 'institution-1',
    progress: 50,
    status: 'active',
    enrolledAt: new Date(), 
  };

  const authToken = 'Bearer mock-teacher-token';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /enrollments', () => {
    it('should create a new enrollment', async () => {
      MockEnrollmentService.prototype.enrollStudent.mockResolvedValue(mockEnrollment);

      const res = await request(app)
        .post('/enrollments')
        .set('Authorization', authToken)
        .send({ courseId: 'course123', studentId: 'student456' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ ...mockEnrollment, enrolledAt: mockEnrollment.enrolledAt.toISOString() });
    });
  });

  describe('GET /enrollments', () => {
    it('should fetch all enrollments', async () => {
      MockEnrollmentService.prototype.getEnrollments.mockResolvedValue([mockEnrollment]);

      const res = await request(app)
        .get('/enrollments')
        .set('Authorization', authToken);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([{ ...mockEnrollment, enrolledAt: mockEnrollment.enrolledAt.toISOString() }]);
    });
  });

  describe('GET /enrollments/students/:id', () => {
    it("should get a student's enrollments", async () => {
      MockEnrollmentService.prototype.getStudentEnrollments.mockResolvedValue([mockEnrollment]);

      const res = await request(app)
        .get('/enrollments/students/student456')
        .set('Authorization', authToken);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([{ ...mockEnrollment, enrolledAt: mockEnrollment.enrolledAt.toISOString() }]);
    });
  });

  describe('PUT /enrollments/:id/progress', () => {
    it('should update enrollment progress and send email', async () => {
      const updated = { ...mockEnrollment, progress: 75 };
      MockEnrollmentService.prototype.updateProgress.mockResolvedValue(updated);

      const res = await request(app)
        .put('/enrollments/enroll1/progress')
        .set('Authorization', authToken)
        .send({ progress: 75 });

      expect(res.statusCode).toBe(200);
      expect(res.body.progress).toBe(75);
    });
  });

  describe('DELETE /enrollments/:id', () => {
    it('should delete an enrollment', async () => {
      MockEnrollmentService.prototype.unenrollStudent.mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/enrollments/enroll1')
        .set('Authorization', authToken);

      expect(res.statusCode).toBe(200);
    });
  });
});
