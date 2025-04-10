const authMock = {
  createUser: jest.fn(() => Promise.resolve({ uid: 'mock-uid' })),
  setCustomUserClaims: jest.fn(),
  verifyIdToken: jest.fn(() =>
    Promise.resolve({
      uid: 'mock-superadmin',
      email: 'superadmin@example.com',
      role: 'SuperAdmin',
    })
  ),
};

const docMock = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  data: jest.fn(),
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
