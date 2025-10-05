import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/testApp';

describe('Authentication Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/verify-teacher', () => {
    it('should verify teacher with correct password', async () => {
      const response = await request(app)
        .post('/api/verify-teacher')
        .send({ password: 'quizmaster123' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        redirect: '/teacher/dashboard',
      });
      
      // Verify session cookie was set
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/verify-teacher')
        .send({ password: 'wrongpassword' })
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Incorrect password',
      });
    });

    it('should return 401 for missing password', async () => {
      const response = await request(app)
        .post('/api/verify-teacher')
        .send({})
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Incorrect password',
      });
    });
  });

  describe('GET /api/logout', () => {
    it('should logout successfully', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/verify-teacher')
        .send({ password: 'quizmaster123' });

      const cookies = loginResponse.headers['set-cookie'];

      // Then logout
      const response = await request(app)
        .get('/api/logout')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });

  describe('POST /api/set-language', () => {
    it('should set language successfully when logged in', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/verify-teacher')
        .send({ password: 'quizmaster123' });

      const cookies = loginResponse.headers['set-cookie'];

      // Set language
      const response = await request(app)
        .post('/api/set-language')
        .set('Cookie', cookies)
        .send({ language: 'en' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
      });
    });

    it('should return 400 for invalid language', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/verify-teacher')
        .send({ password: 'quizmaster123' });

      const cookies = loginResponse.headers['set-cookie'];

      // Try to set invalid language
      const response = await request(app)
        .post('/api/set-language')
        .set('Cookie', cookies)
        .send({ language: 'invalid' })
        .expect(400);

      expect(response.body.error).toBe('Invalid language');
    });
  });

  describe('GET /api/get-language', () => {
    it('should return default language when not set', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/verify-teacher')
        .send({ password: 'quizmaster123' });

      const cookies = loginResponse.headers['set-cookie'];

      // Get language
      const response = await request(app)
        .get('/api/get-language')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toEqual({
        language: 'en',
      });
    });

    it('should return set language after setting it', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/verify-teacher')
        .send({ password: 'quizmaster123' });

      const cookies = loginResponse.headers['set-cookie'];

      // Set language
      await request(app)
        .post('/api/set-language')
        .set('Cookie', cookies)
        .send({ language: 'id' });

      // Get language
      const response = await request(app)
        .get('/api/get-language')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toEqual({
        language: 'id',
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full auth flow: verify teacher -> set language -> get language -> logout', async () => {
      // 1. Verify teacher
      const loginResponse = await request(app)
        .post('/api/verify-teacher')
        .send({ password: 'quizmaster123' })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.redirect).toBe('/teacher/dashboard');
      const cookies = loginResponse.headers['set-cookie'];

      // 2. Set language
      const setLangResponse = await request(app)
        .post('/api/set-language')
        .set('Cookie', cookies)
        .send({ language: 'id' })
        .expect(200);

      expect(setLangResponse.body.success).toBe(true);

      // 3. Get language to verify
      const getLangResponse = await request(app)
        .get('/api/get-language')
        .set('Cookie', cookies)
        .expect(200);

      expect(getLangResponse.body.language).toBe('id');

      // 4. Logout
      const logoutResponse = await request(app)
        .get('/api/logout')
        .set('Cookie', cookies)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);
    });
  });
});
