import { UserService } from '../../src/services/user.service';
import * as admin from 'firebase-admin';
import { db } from '../../src/config/firebase';

// Mock firebase-admin (auth)
jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    applicationDefault: jest.fn(),
    cert: jest.fn(),
  },
  auth: jest.fn(),
}));

// Mock firebase config file (db)
jest.mock('../../src/config/firebase', () => {
  const get = jest.fn();
  const set = jest.fn();
  const update = jest.fn();
  const deleteFn = jest.fn();
  const data = jest.fn();

  const doc = jest.fn(() => ({ get, set, update, delete: deleteFn, data }));

  const collection = jest.fn(() => ({ doc }));

  return {
    db: {
      collection,
    },
  };
});

const mockAuth = {
  createUser: jest.fn(),
  setCustomUserClaims: jest.fn(),
};

describe('UserService', () => {
  const service = new UserService();

  beforeEach(() => {
    jest.clearAllMocks();
    (admin.auth as unknown as jest.Mock).mockReturnValue(mockAuth);
  });

  describe('getUserById', () => {
    it('should throw if user not found', async () => {
      const collectionMock = db.collection('users');
      const docMock = collectionMock.doc('not-found');

      // ✅ Cast to jest.Mock for TypeScript compatibility
      (docMock.get as jest.Mock).mockResolvedValueOnce({ exists: false });

      await expect(service.getUserById('not-found')).rejects.toThrow('User not found');
    });

    it('should return user data if found', async () => {
      const mockData = { name: 'Test User' };
      const collectionMock = db.collection('users');
      const docMock = collectionMock.doc('123');

      (docMock.get as jest.Mock).mockResolvedValueOnce({
        exists: true,
        data: () => mockData,
        id: '123',
      });

      const result = await service.getUserById('123');
      expect(result).toEqual({ id: '123', ...mockData });
    });
  });

  describe('importUsersFromCSV', () => {
    it('should parse CSV and import users using real parser', async () => {
      const csvData = `email,password,role,institutionId
john@example.com,pass123,Student,inst1
jane@example.com,pass456,Teacher,inst2`;

      const buffer = Buffer.from(csvData);

      mockAuth.createUser.mockResolvedValue({ uid: 'uid1' });
      mockAuth.setCustomUserClaims.mockResolvedValue(undefined);

      const collectionMock = db.collection('users');
      const docMock = collectionMock.doc('uid1');

      (docMock.set as jest.Mock).mockResolvedValue(undefined);

      const result = await service.importUsersFromCSV(buffer);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(mockAuth.createUser).toHaveBeenCalledTimes(2);
      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledTimes(2);
      expect(docMock.set).toHaveBeenCalled();
    });
  });

  
  describe('updateUser', () => {
    it('should update a user and return the updated data', async () => {
      const collectionMock = db.collection('users');
      const docMock = collectionMock.doc('123');

      const updatedUser = { name: 'Updated User' };

      (docMock.update as jest.Mock).mockResolvedValue(undefined);
      (docMock.get as jest.Mock).mockResolvedValueOnce({
        data: () => updatedUser,
      });

      const result = await service.updateUser('123', updatedUser);
      expect(result).toEqual({ id: '123', ...updatedUser });
      expect(docMock.update).toHaveBeenCalledWith(expect.objectContaining(updatedUser));
    });
  });

  describe('deleteUser', () => {
    it('should delete a user and return confirmation', async () => {
      const collectionMock = db.collection('users');
      const docMock = collectionMock.doc('123');

      (docMock.delete as jest.Mock).mockResolvedValue(undefined);

      const result = await service.deleteUser('123');
      expect(result).toEqual({ id: '123', deleted: true });
      expect(docMock.delete).toHaveBeenCalled();
    });
  });
});
