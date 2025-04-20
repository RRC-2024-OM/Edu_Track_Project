// Persistent mock of Firestore (`db`) from custom firebase config
const docMock = {
  set: jest.fn().mockResolvedValue(undefined),
};
const collectionMock = jest.fn(() => ({
  doc: jest.fn(() => docMock),
}));

jest.mock('../../src/config/firebase', () => ({
  db: {
    collection: collectionMock,
  },
}));

// ✅ Mock Firebase Admin SDK auth methods
jest.mock('firebase-admin', () => {
  const authMock = {
    createUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
    getUserByEmail: jest.fn(),
    createCustomToken: jest.fn(),
  };

  return {
    auth: () => authMock,
    credential: { cert: jest.fn() },
    initializeApp: jest.fn(),
    apps: [],
  };
});

import express from 'express';
import request from 'supertest';
import admin from 'firebase-admin';

const mockAuth = admin.auth() as jest.Mocked<ReturnType<typeof admin.auth>>;

describe('Auth Module - Full Stack', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    const { AuthMiddleware } = require('../../src/middleware/auth.middleware');
    AuthMiddleware.verifyToken = (_req: any, _res: any, next: any) => next();
    AuthMiddleware.requireRole = () => (_req: any, _res: any, next: any) => next();

    const authRoutes = require('../../src/routes/auth.routes').default;
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  afterAll(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('POST /auth/register', () => {
    it('should return 400 for missing fields', async () => {
      const res = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'pass123',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid role', async () => {
      const res = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'pass123',
        role: 'HACKER',
        institutionId: 'inst001',
      });

      expect(res.status).toBe(400);
    });

    it('should return 500 if registration fails', async () => {
      mockAuth.createUser.mockRejectedValueOnce(new Error('Registration error'));

      const res = await request(app).post('/auth/register').send({
        email: 'fail@example.com',
        password: 'pass123',
        role: 'Teacher',
        institutionId: 'inst001',
      });

      expect(res.status).toBe(500);
    });
  });

  describe('POST /auth/login', () => {
    it('should return 400 for missing credentials', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'onlyemail@example.com',
      });

      expect(res.status).toBe(400);
    });

    it('should return 401 for invalid login', async () => {
      mockAuth.getUserByEmail.mockRejectedValueOnce(new Error('Not found'));

      const res = await request(app).post('/auth/login').send({
        email: 'missing@example.com',
        password: 'any',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/set-claims', () => {
    it('should set custom claims', async () => {
      mockAuth.setCustomUserClaims.mockResolvedValueOnce();

      const res = await request(app).post('/auth/set-claims').send({
        uid: 'user123',
        role: 'Teacher',
        institutionId: 'inst001',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Claims updated successfully');
    });

    it('should return 400 for missing uid or role', async () => {
      const res = await request(app).post('/auth/set-claims').send({
        uid: 'user123',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid role', async () => {
      const res = await request(app).post('/auth/set-claims').send({
        uid: 'user123',
        role: 'Spy',
      });

      expect(res.status).toBe(400);
    });
  });
});
