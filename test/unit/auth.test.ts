import admin, { apps } from 'firebase-admin';
import { AuthService } from '../../src/services/auth.service';

jest.mock('firebase-admin', () => {
  const authMock = {
    createUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
    getUserByEmail: jest.fn(),
    createCustomToken: jest.fn(),
  };

  const firestoreMock = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(() => ({ exists: true, data: jest.fn() })),
      })),
    })),
  };

  return {
    auth: () => authMock,
    firestore: () => firestoreMock, 
    credential: { cert: jest.fn() },
    initializeApp: jest.fn(),
    apps: [],
  };
});

describe('AuthService', () => {
  const authService = new AuthService();
  const mockAuth = admin.auth() as jest.Mocked<ReturnType<typeof admin.auth>>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a user and set custom claims', async () => {
      const mockUserRecord = {
        uid: '1234',
        email: 'test@example.com',
        emailVerified: true,
        disabled: false,
        metadata: {} as any,
        providerData: [],
        toJSON: () => ({}),
      } as admin.auth.UserRecord;

      mockAuth.createUser.mockResolvedValue(mockUserRecord);
      mockAuth.setCustomUserClaims.mockResolvedValue(undefined);

      const user = await authService.registerUser({
        email: 'test@example.com',
        password: 'pass123',
        role: 'Teacher',
        institutionId: 'inst001',
      });

      expect(mockAuth.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'pass123',
      });

      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith('1234', { role: 'Teacher' });

      expect(user).toMatchObject({
        uid: '1234',
        email: 'test@example.com',
        role: 'Teacher',
        institutionId: 'inst001',
      });
    });

    it('should throw error if createUser fails', async () => {
      mockAuth.createUser.mockRejectedValue(new Error('createUser failed'));

      await expect(
        authService.registerUser({
          email: 'fail@example.com',
          password: 'badpass',
          role: 'Teacher',
        })
      ).rejects.toThrow('createUser failed');
    });
  });

  describe('loginUser', () => {
    it('should login a user and return a token', async () => {
      const mockUserRecord = {
        uid: 'user123',
        email: 'test@example.com',
        emailVerified: true,
        disabled: false,
        metadata: {} as any,
        providerData: [],
        toJSON: () => ({}),
        customClaims: { role: 'Student' },
      } as admin.auth.UserRecord;

      mockAuth.getUserByEmail.mockResolvedValue(mockUserRecord);
      mockAuth.createCustomToken.mockResolvedValue('fake-token');

      const result = await authService.loginUser('test@example.com', 'irrelevant');

      expect(mockAuth.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockAuth.createCustomToken).toHaveBeenCalledWith('user123');

      expect(result).toMatchObject({
        token: 'fake-token',
        uid: 'user123',
        email: 'test@example.com',
        role: 'Student',
      });
    });

    it('should throw error if user not found', async () => {
      mockAuth.getUserByEmail.mockRejectedValue(new Error('User not found'));

      await expect(authService.loginUser('missing@example.com', 'pass')).rejects.toThrow('User not found');
    });
  });
});