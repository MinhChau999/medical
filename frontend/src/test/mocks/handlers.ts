import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:3000/api';

export const handlers = [
  // Products endpoints
  http.get(`${API_BASE_URL}/products`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          name: 'Test Product 1',
          price: 100000,
          description: 'Test description',
          category: 'Test Category',
          stock: 10,
          image_url: 'https://example.com/image.jpg',
        },
        {
          id: 2,
          name: 'Test Product 2',
          price: 200000,
          description: 'Test description 2',
          category: 'Test Category',
          stock: 5,
          image_url: 'https://example.com/image2.jpg',
        },
      ],
    });
  }),

  http.get(`${API_BASE_URL}/products/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: {
        id: Number(id),
        name: `Test Product ${id}`,
        price: 100000,
        description: 'Test description',
        category: 'Test Category',
        stock: 10,
        image_url: 'https://example.com/image.jpg',
      },
    });
  }),

  http.post(`${API_BASE_URL}/products`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: 999,
        ...body,
      },
    });
  }),

  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as any;

    if (body.username === 'admin' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          token: 'fake-jwt-token',
          user: {
            id: 1,
            username: 'admin',
            role: 'admin',
            email: 'admin@example.com',
          },
        },
      });
    }

    return HttpResponse.json(
      {
        success: false,
        message: 'Invalid credentials',
      },
      { status: 401 }
    );
  }),

  // Categories endpoints
  http.get(`${API_BASE_URL}/categories`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, name: 'Category 1', description: 'Test category 1' },
        { id: 2, name: 'Category 2', description: 'Test category 2' },
      ],
    });
  }),

  // Orders endpoints
  http.get(`${API_BASE_URL}/orders`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          customer_name: 'John Doe',
          total: 500000,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ],
    });
  }),

  http.post(`${API_BASE_URL}/orders`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: 999,
        ...body,
        created_at: new Date().toISOString(),
      },
    });
  }),
];
