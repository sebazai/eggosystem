import request from 'supertest';
import { app } from '../../app';

describe('GET /players', () => {
  it('should return 200', async () => {
    const response = await request(app).get('/api/v1/players');
    expect(response.status).toBe(200);
  });

  it('should return 404 when steam_id not found', async () => {
    const response = await request(app).get(`/api/v1/players/123123123`);
    expect(response.status).toBe(404);
  });
});
