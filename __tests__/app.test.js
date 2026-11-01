const request = require('supertest');
const app     = require('../src/app');

describe('Aqsa Kitchen\'s - API Tests', () => {

  /* -- Health Check -- */
  test('GET /health -> 200 with healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.app).toBe('aqsa-kitchens');
  });

  /* -- Home Page -- */
  test('GET / -> 200 HTML', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  /* -- Products Page -- */
  test('GET /products -> 200', async () => {
    const res = await request(app).get('/products');
    expect(res.statusCode).toBe(200);
  });

  test('GET /products?category=trolley -> 200', async () => {
    const res = await request(app).get('/products?category=trolley');
    expect(res.statusCode).toBe(200);
  });

  /* -- API Endpoints -- */
  test('GET /api/status -> 200', async () => {
    const res = await request(app).get('/api/status');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/products -> returns product list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(0);
  });

  /* -- Enquiry Form -- */
  test('POST /api/enquiry -> success with valid data', async () => {
    const res = await request(app).post('/api/enquiry').send({
      name    : 'Sakib Shaikh',
      phone   : '9876543210',
      product : 'Classic 3-Shelf Kitchen Trolley',
      city    : 'Ahmednagar'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.enquiryId).toBeDefined();
  });

  test('POST /api/enquiry -> 400 when name is missing', async () => {
    const res = await request(app).post('/api/enquiry').send({
      phone   : '9876543210',
      product : 'Classic 3-Shelf Kitchen Trolley'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/enquiry -> 400 when phone invalid', async () => {
    const res = await request(app).post('/api/enquiry').send({
      name    : 'Test User',
      phone   : '123',   // too short
      product : 'Trolley'
    });
    expect(res.statusCode).toBe(400);
  });

  /* -- 404 -- */
  test('GET /nonexistent -> 404', async () => {
    const res = await request(app).get('/this-page-does-not-exist');
    expect(res.statusCode).toBe(404);
  });

});
