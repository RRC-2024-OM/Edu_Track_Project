import request from 'supertest';
import app from '../utils/testApp';

describe('User Integration Tests', () => {
  it('should return 403 if no token is provided', async () => {
    const response = await request(app).get('/users');
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toMatch(/unauthorized/i);
  });

  it('should return 403 if user does not have required role', async () => {
    const response = await request(app)
      .get('/users')
      .set('Authorization', 'Bearer mock-student-token'); 

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toMatch(/forbidden/i);
  });
});
