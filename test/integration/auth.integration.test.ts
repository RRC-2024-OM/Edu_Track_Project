import request from 'supertest';
import app from '../utils/testApp';

describe('Auth Integration', () => {
  it('should fail to register user without token (Super Admin only)', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'testuser@example.com',
        password: 'Test123!',
        role: 'Teacher',
      });

    expect(response.statusCode).toBe(401); // Unauthorized
  });

  it('should reject login with invalid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'invalid@example.com',
        password: 'wrongpass',
      });

    expect(response.statusCode).toBe(401);
  });

  it('should register a new user when authenticated as Super Admin', async () => {
    const response = await request(app)
      .post('/auth/register')
      .set('Authorization', 'Bearer mock-valid-token')
      .send({
        email: 'newteacher@example.com',
        password: 'Test123!',
        role: 'Teacher',
        institutionId: 'demo-institution',
      });
  
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('uid', 'mock-uid');
  });
  
});
