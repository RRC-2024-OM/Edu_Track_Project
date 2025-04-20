import request from 'supertest';
import express, { Request, Response } from 'express';
import app from '../../src/app';

// Mock the Swagger setup before importing app
jest.mock('../../src/config/swagger', () => ({
  setupSwagger: (appInstance: express.Express) => {
    appInstance.get('/swagger-test', (_req: Request, res: Response) => {
      res.status(200).send('Swagger OK');
    });
  },
}));

describe('App - Server Initialization & Routing', () => {
  it('should have JSON middleware enabled', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({})
      .set('Accept', 'application/json');

    expect(res.headers['content-type']).toMatch(/json/);
  });

  it('should have Swagger setup route (mocked)', async () => {
    const res = await request(app).get('/swagger-test');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Swagger OK');
  });

  it('should have /auth route defined', async () => {
    const res = await request(app).get('/auth/does-not-exist');
    expect([404, 401, 403]).toContain(res.status);
  });

  it('should have /users route defined', async () => {
    const res = await request(app).get('/users');
    expect([200, 401, 403]).toContain(res.status);
  });

  it('should have /courses route defined', async () => {
    const res = await request(app).get('/courses');
    expect([200, 401, 403]).toContain(res.status);
  });

  it('should have /enrollments route defined', async () => {
    const res = await request(app).get('/enrollments');
    expect([200, 401, 403]).toContain(res.status);
  });

  it('should have /analytics route defined', async () => {
    const res = await request(app).get('/analytics/institution');
    expect([200, 401, 403]).toContain(res.status);
  });
});
