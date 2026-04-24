const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const path = require('path');
const app = require('../src/app');
const User = require('../src/models/User');
const { generateTokens, hashRefreshToken } = require('../src/services/auth.service');

// Mock Cloudinary para tests
jest.mock('../src/config/cloudinary', () => ({
  uploader: {
    destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
  },
}));

// Mock multer-storage-cloudinary para que use almacenamiento en memoria
jest.mock('../src/middleware/upload.middleware', () => {
  const multer = require('multer');
  const upload = multer({ storage: multer.memoryStorage() });
  return upload;
});

let mongoServer;

// ─── Setup / Teardown ──────────────────────────────────

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_123';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_456';
  process.env.JWT_EXPIRE = '15m';
  process.env.JWT_REFRESH_EXPIRE = '7d';
  process.env.NODE_ENV = 'test';

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

// ─── Helpers ───────────────────────────────────────────

const createAuthenticatedUser = async (overrides = {}) => {
  const userData = {
    name: 'Ana García',
    email: 'ana@example.com',
    password: 'password123',
    birthDate: new Date('1998-05-15'),
    gender: 'mujer',
    genderPreference: ['hombre'],
    ...overrides,
  };

  const user = await User.create(userData);
  const tokens = generateTokens(user._id);
  const hashedRefresh = await hashRefreshToken(tokens.refreshToken);
  await User.updateOne({ _id: user._id }, { $set: { refreshToken: hashedRefresh } });

  return { user, accessToken: tokens.accessToken };
};

const authGet = (url, token) =>
  request(app).get(url).set('Authorization', `Bearer ${token}`);

const authPut = (url, token, body) =>
  request(app).put(url).set('Authorization', `Bearer ${token}`).send(body);

const authPost = (url, token, body) =>
  request(app).post(url).set('Authorization', `Bearer ${token}`).send(body);

const authDelete = (url, token, body) => {
  const req = request(app).delete(url).set('Authorization', `Bearer ${token}`);
  if (body) req.send(body);
  return req;
};

// ─── GET /api/users/me ─────────────────────────────────

describe('GET /api/users/me', () => {
  it('debería devolver el perfil del usuario autenticado', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authGet('/api/users/me', accessToken);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('Ana García');
    expect(res.body.user.email).toBe('ana@example.com');
    expect(res.body.user.gender).toBe('mujer');
    expect(res.body.user.age).toBeGreaterThanOrEqual(18);
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.refreshToken).toBeUndefined();
  });

  it('debería fallar sin token (401)', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});

// ─── PUT /api/users/me ─────────────────────────────────

describe('PUT /api/users/me', () => {
  it('debería actualizar nombre y bio', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me', accessToken, {
      name: 'Ana Actualizada',
      bio: 'Hola, soy nueva aquí',
    });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Ana Actualizada');
    expect(res.body.user.bio).toBe('Hola, soy nueva aquí');
  });

  it('debería actualizar intereses', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me', accessToken, {
      interests: ['música', 'viajes', 'cocina'],
    });

    expect(res.status).toBe(200);
    expect(res.body.user.interests).toEqual(['música', 'viajes', 'cocina']);
  });

  it('debería actualizar preferencias de género', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me', accessToken, {
      genderPreference: ['hombre', 'mujer'],
    });

    expect(res.status).toBe(200);
    expect(res.body.user.genderPreference).toEqual(['hombre', 'mujer']);
  });

  it('debería fallar con body vacío (400)', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me', accessToken, {});

    expect(res.status).toBe(400);
  });

  it('debería fallar con nombre demasiado corto (400)', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me', accessToken, { name: 'A' });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'name')).toBe(true);
  });

  it('no debería permitir cambiar email ni password via update', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me', accessToken, {
      name: 'Ana Segura',
    });

    // Debería aceptar solo name
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Ana Segura');
    expect(res.body.user.email).toBe('ana@example.com');
  });
});

// ─── PUT /api/users/me/location ────────────────────────

describe('PUT /api/users/me/location', () => {
  it('debería actualizar ubicación con coordenadas válidas', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me/location', accessToken, {
      longitude: -58.3816,
      latitude: -34.6037,
    });

    expect(res.status).toBe(200);
    expect(res.body.user.location.coordinates).toEqual([-58.3816, -34.6037]);
  });

  it('debería fallar sin coordenadas (400)', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me/location', accessToken, {});

    expect(res.status).toBe(400);
  });

  it('debería fallar con longitud fuera de rango (400)', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me/location', accessToken, {
      longitude: 200,
      latitude: -34,
    });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'longitude')).toBe(true);
  });

  it('debería fallar con latitud fuera de rango (400)', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me/location', accessToken, {
      longitude: -58,
      latitude: -100,
    });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'latitude')).toBe(true);
  });
});

// ─── PUT /api/users/me/settings ────────────────────────

describe('PUT /api/users/me/settings', () => {
  it('debería actualizar maxDistance', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me/settings', accessToken, {
      maxDistance: 25,
    });

    expect(res.status).toBe(200);
    expect(res.body.user.settings.maxDistance).toBe(25);
  });

  it('debería actualizar ageRange', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me/settings', accessToken, {
      ageRange: { min: 20, max: 40 },
    });

    expect(res.status).toBe(200);
    expect(res.body.user.settings.ageRange.min).toBe(20);
    expect(res.body.user.settings.ageRange.max).toBe(40);
  });

  it('debería actualizar showMe', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me/settings', accessToken, {
      showMe: false,
    });

    expect(res.status).toBe(200);
    expect(res.body.user.settings.showMe).toBe(false);
  });

  it('debería fallar con body vacío (400)', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me/settings', accessToken, {});

    expect(res.status).toBe(400);
  });

  it('debería fallar con maxDistance > 50 (400)', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authPut('/api/users/me/settings', accessToken, {
      maxDistance: 100,
    });

    expect(res.status).toBe(400);
  });
});

// ─── POST /api/users/block/:userId ─────────────────────

describe('POST /api/users/block/:userId', () => {
  it('debería bloquear un usuario', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const { user: target } = await createAuthenticatedUser({
      email: 'target@example.com',
      name: 'Target',
    });

    const res = await authPost(`/api/users/block/${target._id}`, accessToken);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/bloqueado/i);

    // Verificar en DB
    const updated = await User.findOne({ email: 'ana@example.com' });
    expect(updated.blockedUsers.map(String)).toContain(target._id.toString());
  });

  it('debería fallar al bloquearte a ti mismo (400)', async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const res = await authPost(`/api/users/block/${user._id}`, accessToken);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ti mismo/i);
  });

  it('debería fallar al bloquear usuario inexistente (404)', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await authPost(`/api/users/block/${fakeId}`, accessToken);

    expect(res.status).toBe(404);
  });

  it('debería fallar al bloquear usuario ya bloqueado (400)', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const { user: target } = await createAuthenticatedUser({
      email: 'target@example.com',
      name: 'Target',
    });

    await authPost(`/api/users/block/${target._id}`, accessToken);
    const res = await authPost(`/api/users/block/${target._id}`, accessToken);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ya bloqueado/i);
  });
});

// ─── POST /api/users/report ────────────────────────────

describe('POST /api/users/report', () => {
  it('debería reportar un usuario correctamente', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const { user: target } = await createAuthenticatedUser({
      email: 'target@example.com',
      name: 'Target',
    });

    const res = await authPost('/api/users/report', accessToken, {
      userId: target._id.toString(),
      reason: 'acoso',
      description: 'Mensajes inapropiados',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reporte/i);
  });

  it('debería fallar sin motivo de reporte (400)', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const { user: target } = await createAuthenticatedUser({
      email: 'target@example.com',
      name: 'Target',
    });

    const res = await authPost('/api/users/report', accessToken, {
      userId: target._id.toString(),
    });

    expect(res.status).toBe(400);
  });

  it('debería fallar con motivo inválido (400)', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const { user: target } = await createAuthenticatedUser({
      email: 'target@example.com',
      name: 'Target',
    });

    const res = await authPost('/api/users/report', accessToken, {
      userId: target._id.toString(),
      reason: 'motivo_inventado',
    });

    expect(res.status).toBe(400);
  });

  it('debería fallar al reportarte a ti mismo (400)', async () => {
    const { user, accessToken } = await createAuthenticatedUser();
    const res = await authPost('/api/users/report', accessToken, {
      userId: user._id.toString(),
      reason: 'spam',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ti mismo/i);
  });
});

// ─── DELETE /api/users/me ──────────────────────────────

describe('DELETE /api/users/me', () => {
  it('debería eliminar cuenta con confirmación ELIMINAR', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authDelete('/api/users/me', accessToken, {
      confirmation: 'ELIMINAR',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/eliminada/i);

    // Verificar soft delete
    const user = await User.findOne({ email: 'ana@example.com' });
    expect(user.isActive).toBe(false);
  });

  it('debería fallar sin confirmación (400)', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authDelete('/api/users/me', accessToken, {});

    expect(res.status).toBe(400);
  });

  it('debería fallar con confirmación incorrecta (400)', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await authDelete('/api/users/me', accessToken, {
      confirmation: 'borrar',
    });

    expect(res.status).toBe(400);
  });
});

// ─── POST /api/users/me/photos (mock) ──────────────────

describe('POST /api/users/me/photos', () => {
  it('debería fallar sin archivo (400)', async () => {
    const { accessToken } = await createAuthenticatedUser();
    const res = await request(app)
      .post('/api/users/me/photos')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/imagen/i);
  });
});
