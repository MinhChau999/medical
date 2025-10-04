import request from 'supertest';
import app from '../../index';

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    test('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /api/v1/stats', () => {
    test('should return system statistics', async () => {
      const response = await request(app)
        .get('/api/v1/stats')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('cpuUsage');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should return valid memory usage data', async () => {
      const response = await request(app).get('/api/v1/stats');

      expect(response.body.memory).toHaveProperty('rss');
      expect(response.body.memory).toHaveProperty('heapTotal');
      expect(response.body.memory).toHaveProperty('heapUsed');
      expect(response.body.memory).toHaveProperty('external');
    });
  });
});
