const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

let mongoServer;

// ─── Setup / Teardown ──────────────────────────────────

beforeAll(async () => {
  // Variables de entorno para tests
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

const validUser = {
  name: 'Ana García',
  email: 'ana@example.com',
  password: 'password123',
  confirmPassword: 'password123',
  birthDate: '1998-05-15',
  gender: 'mujer',
  genderPreference: ['hombre'],
};

const registerUser = (overrides = {}) => {
  return request(app)
    .post('/api/auth/register')
    .send({ ...validUser, ...overrides });
};

// ─── REGISTER ──────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('debería registrar un usuario y devolver 201 con user + tokens', async () => {
    const res = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('Ana García');
    expect(res.body.user.email).toBe('ana@example.com');
    expect(res.body.user.gender).toBe('mujer');
    expect(res.body.user.age).toBeGreaterThanOrEqual(18);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    // No debe exponer password ni refreshToken en el user
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.refreshToken).toBeUndefined();
  });

  it('debería fallar con email duplicado (409)', async () => {
    await registerUser();
    const res = await registerUser();

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email ya está registrado/i);
  });

  it('debería fallar sin campos requeridos (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Error de validación');
    expect(res.body.details).toBeInstanceOf(Array);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('debería fallar con email inválido (400)', async () => {
    const res = await registerUser({ email: 'no-es-email' });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'email')).toBe(true);
  });

  it('debería fallar con contraseña corta (400)', async () => {
    const res = await registerUser({ password: '123', confirmPassword: '123' });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'password')).toBe(true);
  });

  it('debería fallar con contraseña sin número (400)', async () => {
    const res = await registerUser({ password: 'abcdefgh', confirmPassword: 'abcdefgh' });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'password')).toBe(true);
  });

  it('debería fallar si las contraseñas no coinciden (400)', async () => {
    const res = await registerUser({ confirmPassword: 'diferente123' });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'confirmPassword')).toBe(true);
  });

  it('debería fallar si es menor de 18 años (400)', async () => {
    const today = new Date();
    const under18 = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
    const res = await registerUser({ birthDate: under18.toISOString() });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.message.includes('18'))).toBe(true);
  });

  it('debería fallar con género inválido (400)', async () => {
    const res = await registerUser({ gender: 'alien' });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'gender')).toBe(true);
  });

  it('debería guardar la contraseña hasheada (no en texto plano)', async () => {
    await registerUser();
    const user = await User.findOne({ email: 'ana@example.com' }).select('+password');

    expect(user.password).toBeDefined();
    expect(user.password).not.toBe('password123');
    expect(user.password.startsWith('$2')).toBe(true); // bcrypt hash
  });
});

// ─── LOGIN ─────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await registerUser();
  });

  it('debería hacer login y devolver 200 con user + tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('ana@example.com');
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it('debería fallar con email inexistente (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('debería fallar con contraseña incorrecta (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@example.com', password: 'wrongpassword1' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('debería fallar sin campos (400)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Error de validación');
  });
});

// ─── REFRESH TOKEN ─────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  let refreshToken;

  beforeEach(async () => {
    const res = await registerUser();
    refreshToken = res.body.refreshToken;
  });

  it('debería renovar tokens con refresh token válido (200)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    // Nuevo refresh token debe ser diferente al anterior
    expect(res.body.refreshToken).not.toBe(refreshToken);
  });

  it('debería fallar con refresh token inválido (401)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'token-invalido' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/inválido|expirado/i);
  });

  it('debería fallar sin refresh token (400)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Error de validación');
  });

  it('debería invalidar el refresh token anterior tras rotación', async () => {
    // Usar refresh token una vez → obtener nuevo
    const res1 = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res1.status).toBe(200);

    // Intentar usar el viejo refresh token → debe fallar
    const res2 = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res2.status).toBe(401);
  });
});

// ─── LOGOUT ────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  let accessToken;
  let refreshToken;

  beforeEach(async () => {
    const res = await registerUser();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('debería cerrar sesión correctamente (200)', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/sesión cerrada/i);
  });

  it('debería invalidar el refresh token tras logout', async () => {
    // Logout
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    // Intentar refresh → debe fallar
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(401);
  });

  it('debería fallar sin token de autenticación (401)', async () => {
    const res = await request(app)
      .post('/api/auth/logout');

    expect(res.status).toBe(401);
  });
});

// ─── PROTECTED ROUTES ──────────────────────────────────

describe('Rutas protegidas (auth middleware)', () => {
  it('debería denegar acceso sin token (401)', async () => {
    const res = await request(app)
      .post('/api/auth/logout');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token/i);
  });

  it('debería denegar acceso con token inválido (401)', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer token-falso');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token inválido/i);
  });

  it('debería permitir acceso con token válido (200)', async () => {
    const registerRes = await registerUser();
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`);

    expect(res.status).toBe(200);
  });
});
