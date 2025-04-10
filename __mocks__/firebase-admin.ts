const authMock = {
  createUser: jest.fn(),
  setCustomUserClaims: jest.fn(),
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
  apps: [], // Ensures admin.apps.length check works
  initializeApp: jest.fn(),
  credential: {
    applicationDefault: jest.fn(),
    cert: jest.fn(),
  },
  auth: jest.fn(() => authMock),         // ✅ NOW a Jest mock function
  firestore: jest.fn(() => firestoreMock), // ✅ NOW a Jest mock function
};
