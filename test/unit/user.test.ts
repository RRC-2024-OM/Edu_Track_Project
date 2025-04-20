import express from 'express';
import request from 'supertest';
import userRoutes from '../../src/routes/user.routes';
import { UserService } from '../../src/services/user.service';
import admin from 'firebase-admin';

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    applicationDefault: jest.fn(),
    cert: jest.fn(),
  },
  auth: jest.fn(),
}));

jest.mock('../../src/config/firebase', () => {
  let updatedData: any = { name: 'Test User', role: 'Student' };

  const docMock = {
    get: jest.fn(() => Promise.resolve({
      exists: true,
      id: '123',
      data: () => updatedData,
    })),
    set: jest.fn(),
    update: jest.fn((data) => {
      updatedData = { ...updatedData, ...data };
      return Promise.resolve();
    }),
    delete: jest.fn(),
  };

  const collectionMock = {
    doc: jest.fn(() => docMock),
    where: jest.fn().mockReturnThis(),
    get: jest.fn(() => Promise.resolve({
      docs: [
        {
          id: '123',
          data: () => updatedData,
        },
      ]
    })),
  };

  return {
    db: {
      collection: jest.fn(() => collectionMock),
    },
  };
});

jest.mock('multer', () => () => ({ single: () => (_req: any, _res: any, next: any) => next() }));

const mockAuth = {
  createUser: jest.fn(),
  setCustomUserClaims: jest.fn(),
};

const app = express();
app.use(express.json());
app.use('/users', userRoutes);

const mockUser = {
  uid: 'admin123',
  email: 'admin@test.com',
  role: 'SuperAdmin',
  institutionId: 'inst1',
};

jest.mock('../../src/middleware/auth.middleware', () => ({
  AuthMiddleware: {
    verifyToken: (req: any, _res: any, next: any) => {
      req.user = mockUser;
      next();
    },
    requireRole: (..._roles: string[]) => (_req: any, _res: any, next: any) => next(),
  },
}));

describe('Users Module - Full Stack', () => {
  const service = new UserService();

  beforeEach(() => {
    jest.clearAllMocks();
    (admin.auth as unknown as jest.Mock).mockReturnValue(mockAuth);
  });

  describe('Service Layer', () => {
    it('should get a user by ID', async () => {
      const result = await service.getUserById('123');
      expect(result).toHaveProperty('name', 'Test User');
    });

    it('should throw if user not found', async () => {
      const collection = require('../../src/config/firebase').db.collection('users');
      const doc = collection.doc('not-found');
      (doc.get as jest.Mock).mockResolvedValueOnce({ exists: false });
      await expect(service.getUserById('not-found')).rejects.toThrow('User not found');
    });

    it('should update a user', async () => {
      const result = await service.updateUser('123', { name: 'Updated' });
      expect(result).toHaveProperty('name', 'Updated');
    });

    it('should delete a user', async () => {
      const result = await service.deleteUser('123');
      expect(result).toEqual({ id: '123', deleted: true });
    });

    it('should import users from CSV', async () => {
      const buffer = Buffer.from('email,password,role\njohn@example.com,123456,Student');
      mockAuth.createUser.mockResolvedValueOnce({ uid: 'uid1' });
      mockAuth.setCustomUserClaims.mockResolvedValueOnce(undefined);

      const result = await service.importUsersFromCSV(buffer);
      expect(result).toHaveLength(1);
      expect(mockAuth.createUser).toHaveBeenCalled();
    });
  });

  describe('Route Integration', () => {
    it('GET /users - should return all users', async () => {
      const res = await request(app).get('/users');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /users/:id - should return one user', async () => {
      const res = await request(app).get('/users/123');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name');
    });

    it('PUT /users/:id - should update a user', async () => {
      const res = await request(app).put('/users/123').send({ name: 'Updated' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated');
    });

    it('DELETE /users/:id - should delete a user', async () => {
      const res = await request(app).delete('/users/123');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: '123', deleted: true });
    });

    it('POST /users - should create a user', async () => {
      mockAuth.createUser.mockResolvedValue({ uid: 'uid1' });
      mockAuth.setCustomUserClaims.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/users')
        .send({ email: 'test@test.com', password: '123456', role: 'Student' });

      expect(res.status).toBe(201);
      expect(mockAuth.createUser).toHaveBeenCalled();
    });

    it('POST /users - should return 400 for missing fields', async () => {
      const res = await request(app).post('/users').send({ email: 'x@test.com' });
      expect(res.status).toBe(400);
    });

    it('POST /users - should return 400 for invalid role', async () => {
      const res = await request(app).post('/users').send({ email: 'x@test.com', password: '123', role: 'InvalidRole' });
      expect(res.status).toBe(400);
    });

    it('POST /users/bulk - should return 400 if no file', async () => {
      const res = await request(app).post('/users/bulk');
      expect(res.status).toBe(400);
    });
  });
});
