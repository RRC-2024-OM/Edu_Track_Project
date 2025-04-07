import { registerUser, loginUser } from '../../../services/auth.service';
import { auth, db } from '../../../config/firebase';

// Mock Firebase modules
jest.mock('../../../src/config/firebase');

const mockUser = {
  uid: 'user123',
  email: 'test@school.com',
  customClaims: { role: 'teacher', institutionId: 'school_123' }
};

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    (auth.createUser as jest.Mock).mockReset();
    (auth.setCustomUserClaims as jest.Mock).mockReset();
    (db.collection as jest.Mock).mockImplementation(() => ({
      doc: jest.fn().mockReturnThis(),
      set: jest.fn().mockResolvedValue(null)
    }));
  });

  describe('registerUser()', () => {
    it('should register a user with valid data', async () => {
      (auth.createUser as jest.Mock).mockResolvedValue({
        uid: mockUser.uid,
        email: mockUser.email
      });

      const result = await registerUser(
        'test@school.com',
        'SecurePass123',
        'teacher',
        'school_123'
      );

      expect(result).toEqual({
        uid: mockUser.uid,
        email: mockUser.email,
        role: 'teacher'
      });
      
      expect(auth.setCustomUserClaims).toHaveBeenCalledWith(
        mockUser.uid, 
        { role: 'teacher', institutionId: 'school_123' }
      );
      
      expect(db.collection).toHaveBeenCalledWith('users');
    });

    it('should throw error for invalid email', async () => {
      await expect(
        registerUser('invalid-email', 'password', 'teacher')
      ).rejects.toThrow('The email address is badly formatted');
    });
  });

  describe('loginUser()', () => {
    it('should return user data for valid email', async () => {
      (auth.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await loginUser('test@school.com');
      expect(result).toEqual({
        uid: mockUser.uid,
        role: 'teacher',
        institutionId: 'school_123'
      });
    });

    it('should throw error for non-existent email', async () => {
      (auth.getUserByEmail as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );

      await expect(loginUser('nonexistent@school.com'))
        .rejects.toThrow('User not found');
    });
  });
});