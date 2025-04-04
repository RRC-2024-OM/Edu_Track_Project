export const auth = {
    createUser: jest.fn(),
    getUserByEmail: jest.fn(),
    setCustomUserClaims: jest.fn(),
    deleteUser: jest.fn(),
    verifyIdToken: jest.fn()
  };
  
  export const db = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }))
    }))
  };
  
  export const adminInstance = {
    firestore: {
      FieldValue: {
        serverTimestamp: jest.fn()
      }
    }
  };