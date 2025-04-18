const createUser = jest.fn(() => Promise.resolve({ uid: 'mock-uid' }));

const setCustomUserClaims = jest.fn();

const verifyIdToken = jest.fn((token: string) => {
  // Default mock if no token logic is provided (for existing tests)
  if (!token || token === 'mock-valid-token') {
    return Promise.resolve({
      uid: 'mock-superadmin',
      email: 'superadmin@example.com',
      role: 'SuperAdmin',
      institutionId: 'institution-1',
    });
  }

  // Allow other roles based on custom token string
  if (token === 'mock-institution-admin-token') {
    return Promise.resolve({
      uid: 'mock-admin',
      email: 'admin@example.com',
      role: 'InstitutionAdmin',
      institutionId: 'institution-1',
    });
  }

  if (token === 'mock-teacher-token') {
    return Promise.resolve({
      uid: 'mock-teacher',
      email: 'teacher@example.com',
      role: 'Teacher',
      institutionId: 'institution-1',
    });
  }

  if (token === 'mock-student-token') {
    return Promise.resolve({
      uid: 'mock-student',
      email: 'student@example.com',
      role: 'Student',
      institutionId: 'institution-1',
    });
  }

  // Fallback: unauthorized token
  return Promise.reject(new Error('Invalid token'));
});

const authMock = {
  createUser,
  setCustomUserClaims,
  verifyIdToken,
};

const docMock = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  data: jest.fn(() => ({
    email: 'mock@example.com',
    role: 'Teacher',
    institutionId: 'institution-1',
  })),
};

const collectionMock = jest.fn(() => ({
  doc: jest.fn(() => docMock),
}));

const firestoreMock = {
  collection: collectionMock,
};

module.exports = {
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    applicationDefault: jest.fn(),
    cert: jest.fn(),
  },
  auth: jest.fn(() => authMock),
  firestore: jest.fn(() => firestoreMock),
};
