import request from 'supertest';
import { app } from '../../../src/app';
import { auth, db } from '../../../src/config/firebase';

// Mock Firebase
jest.mock('../../../src/config/firebase');

describe('Auth API Integration Tests', () => {
  const testUser = {
    email: 'test@school.com',
    password: 'SecurePass123',
    role: 'teacher',
    institutionId: 'school_123'
  };

  beforeAll(() => {
    // Mock Firebase responses
    (auth.createUser as jest.Mock).mockImplementation(async ({ email }) => ({
      uid: `mock-uid-${email}`,
      email
    }));

    (db.collection as jest.Mock).mockImplementation(() => ({
      doc: jest.fn().mockReturnThis(),
      set: jest.fn().mockResolvedValue(null)
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user (201)', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        uid: expect.any(String),
        email: testUser.email,
        role: testUser.role
      });
    });

    it('should reject invalid role (400)', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ ...testUser, role: 'invalid_role' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    it('should login existing user (200)', async () => {
      (auth.getUserByEmail as jest.Mock).mockResolvedValue({
        uid: 'mock-uid',
        email: testUser.email,
        customClaims: {
          role: testUser.role,
          institutionId: testUser.institutionId
        }
      });

      const res = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        uid: 'mock-uid',
        role: testUser.role,
        institutionId: testUser.institutionId
      });
    });

    it('should reject non-existent user (400)', async () => {
      (auth.getUserByEmail as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nonexistent@school.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('User not found');
    });
  });
});