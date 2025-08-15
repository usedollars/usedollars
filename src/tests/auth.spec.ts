import app from '../app'; // 🔹 match con export default
import request from 'supertest';

describe('Auth Endpoints', () => {
  const testEmail = 'testuser@example.com';
  const testPassword = '123456';
  const testName = 'Test User';

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, name: testName });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testEmail);
  });

  it('should not register existing user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, name: testName });

    expect(res.statusCode).toEqual(409);
  });

  it('should login registered user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: testEmail, password: testPassword });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  it('should not login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: testEmail, password: 'wrongpass' });

    expect(res.statusCode).toEqual(401);
  });
});

