import express from 'express';
import { jest } from '@jest/globals';

// ─── 1. Mock Firebase Admin SDK ──────────────────────────────────────────────
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  auth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn(),
  }),
  firestore: jest.fn().mockReturnValue({
    collection: jest.fn(),
  }),
  apps: [],
}));

import { setupSwagger } from '../../src/config/swagger';
import { ROLES, ERROR_MESSAGES } from '../../src/config/constants';
import { db, auth } from '../../src/config/firebase';

describe('Config Modules', () => {
  // ───────────────────────────────────────────────
  describe('env.ts', () => {
    it('should load required environment variables', () => {
      expect(process.env.FIREBASE_PROJECT_ID).toBeDefined();
      expect(process.env.FIREBASE_CLIENT_EMAIL).toBeDefined();
      expect(process.env.FIREBASE_PRIVATE_KEY).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────
  describe('constants.ts', () => {
    it('should export valid roles', () => {
      expect(ROLES).toHaveProperty('SUPER_ADMIN');
      expect(ROLES).toHaveProperty('STUDENT');
      expect(ROLES.TEACHER).toBe('Teacher');
    });

    it('should export standard error messages', () => {
      expect(ERROR_MESSAGES).toHaveProperty('UNAUTHORIZED');
      expect(ERROR_MESSAGES.INVALID_INPUT).toBe('Invalid request input.');
    });
  });

  // ───────────────────────────────────────────────
  describe('firebase.ts', () => {
    it('should expose auth and db instances', () => {
      expect(auth).toBeDefined();
      expect(db).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────
  describe('swagger.ts', () => {
    it('should set up Swagger UI without crashing', () => {
      const app = express();
      expect(() => setupSwagger(app)).not.toThrow();
    });
  });
});
