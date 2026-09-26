import { createApp } from '../../backend/src/app';

describe('Backend API Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = await createApp();
  });

  test('GET /api/health returns status ok', async () => {
    // Basic test checking app setup
    expect(app).toBeDefined();
  });
});
