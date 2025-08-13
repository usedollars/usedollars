import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../data-source';
import { User } from '../entities/user';

describe('Auth Endpoints', () => {

  const testEmail = 'testuser@example.com';
  const testPassword = '123456';

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

beforeEach(async () => {
  await AppDataSource.getRepository(User).delete({ email: 'testuser@example.com' });
});

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        name: 'Test User'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testEmail);
  });

  it('should not register existing user', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, name: 'Test User' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, name: 'Test User' });

    expect(res.statusCode).toEqual(409);
  });

  it('should login registered user', async () => {
    // Primero registramos el usuario
    await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, name: 'Test User' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: testEmail, password: testPassword });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  it('should not login with wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, name: 'Test User' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: testEmail, password: 'wrongpass' });

    expect(res.statusCode).toEqual(401);
  });

});

