// Mocks must be set up before importing any modules that use them
const mockVerifyIdToken = jest.fn();

jest.mock('firebase-admin', () => ({
  auth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
}));

import { AuthMiddleware, AuthenticatedRequest } from '../../src/middleware/auth.middleware';
import { RoleMiddleware } from '../../src/middleware/role.middleware';
import { ErrorMiddleware } from '../../src/middleware/error.middleware';
import validate from '../../src/middleware/validate.middleware';

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';


let originalConsoleError: any;
beforeAll(() => {
  originalConsoleError = console.error;
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Middleware – Auth, Error, Role, Validation', () => {
  describe('AuthMiddleware', () => {
    describe('verifyToken', () => {
      it('should call next if token is valid', async () => {
        const req = {
          headers: { authorization: 'Bearer validtoken' },
        } as unknown as Request;

        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;

        const next = jest.fn();

        mockVerifyIdToken.mockResolvedValue({
          uid: '123',
          email: 'a@b.com',
          role: 'Student',
        });

        await AuthMiddleware.verifyToken(req, res, next);

        expect(next).toHaveBeenCalled();
        expect((req as AuthenticatedRequest).user).toEqual(
          expect.objectContaining({ uid: '123', email: 'a@b.com', role: 'Student' })
        );
      });

      it('should return 401 if token is missing', async () => {
        const req = { headers: {} } as Request;
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
        const next = jest.fn();

        await AuthMiddleware.verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: No token provided' });
      });

      it('should return 401 if token is invalid', async () => {
        const req = {
          headers: { authorization: 'Bearer invalidtoken' },
        } as Request;
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
        const next = jest.fn();

        mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

        await AuthMiddleware.verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid or expired token' });
      });
    });

    describe('requireRole', () => {
      it('should call next for allowed roles', () => {
        const req = { user: { role: 'Admin' } } as Request;
        const res = {} as Response;
        const next = jest.fn();

        const middleware = AuthMiddleware.requireRole('Admin', 'SuperAdmin');
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('should return 403 if role not allowed', () => {
        const req = { user: { role: 'Student' } } as Request;
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
        const next = jest.fn();

        const middleware = AuthMiddleware.requireRole('Admin');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: Requires one of [Admin]' });
      });
    });
  });

  describe('ErrorMiddleware', () => {
    it('should respond with 500 and error message', () => {
      const err = new Error('Something went wrong');
      const req = {} as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
      const next = jest.fn();

      ErrorMiddleware.handle(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Something went wrong',
        })
      );
    });
  });

  describe('RoleMiddleware', () => {
    it('should call next if role is allowed', () => {
      const req = { user: { role: 'Teacher' } } as Request;
      const res = {} as Response;
      const next = jest.fn();

      const middleware = RoleMiddleware.authorizeRoles('Teacher', 'Admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should respond with 403 if role is not allowed', () => {
      const req = { user: { role: 'Student' } } as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
      const next = jest.fn();

      const middleware = RoleMiddleware.authorizeRoles('Teacher');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: insufficient role' });
    });
  });

  describe('validate middleware', () => {
    it('should pass validation and call next', () => {
      const schema = Joi.object({ name: Joi.string().required() });
      const req = { body: { name: 'EduTrack' } } as Request;
      const res = {} as Response;
      const next = jest.fn();

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 400 if validation fails', () => {
      const schema = Joi.object({ name: Joi.string().required() });
      const req = { body: {} } as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
      const next = jest.fn();

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation failed',
        })
      );
    });
  });
});