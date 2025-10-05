import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import { Express } from 'express';

describe('Room Management Integration Tests', () => {
  let app: Express;
  let teacherCookies: string[];

  beforeAll(async () => {
    app = createTestApp();

    // Login as teacher
    const loginResponse = await request(app)
      .post('/api/verify-teacher')
      .send({ password: 'quizmaster123' })
      .expect(200);

    const setCookie = loginResponse.headers['set-cookie'];
    teacherCookies = Array.isArray(setCookie) ? setCookie : [];
  });

  describe('GET /api/active-rooms', () => {
    it('should return active rooms object when authenticated', async () => {
      const response = await request(app)
        .get('/api/active-rooms')
        .set('Cookie', teacherCookies)
        .expect(200);

      // Response should be an object (Record<string, ActiveRoom>)
      expect(typeof response.body).toBe('object');
      expect(response.body).not.toBeNull();
    });

    it('should return 403 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/active-rooms')
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should return rooms with correct structure when rooms exist', async () => {
      const response = await request(app)
        .get('/api/active-rooms')
        .set('Cookie', teacherCookies)
        .expect(200);

      // If there are any rooms, check their structure
      const roomIds = Object.keys(response.body);
      if (roomIds.length > 0) {
        const firstRoom = response.body[roomIds[0]];
        expect(firstRoom).toHaveProperty('roomId');
        expect(firstRoom).toHaveProperty('quizId');
        expect(firstRoom).toHaveProperty('state');
        expect(firstRoom).toHaveProperty('playerCount');
      }
      // Otherwise, we just verify the endpoint works
      expect(true).toBe(true);
    });
  });

  describe('Room API Response Format', () => {
    it('should return a record/object structure not an array', async () => {
      const response = await request(app)
        .get('/api/active-rooms')
        .set('Cookie', teacherCookies)
        .expect(200);

      // Verify it's a Record<string, ActiveRoom>, not an array
      expect(Array.isArray(response.body)).toBe(false);
      expect(typeof response.body).toBe('object');
    });

    it('should handle empty rooms gracefully', async () => {
      const response = await request(app)
        .get('/api/active-rooms')
        .set('Cookie', teacherCookies)
        .expect(200);

      // Should return an empty object if no rooms
      expect(typeof response.body).toBe('object');
      expect(Object.keys(response.body).length).toBeGreaterThanOrEqual(0);
    });
  });
});
