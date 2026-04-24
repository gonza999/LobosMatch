const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Like = require('../src/models/Like');
const Match = require('../src/models/Match');
const { generateTokens, hashRefreshToken } = require('../src/services/auth.service');

// Mock Cloudinary
jest.mock('../src/config/cloudinary', () => ({
  uploader: { destroy: jest.fn().mockResolvedValue({ result: 'ok' }) },
}));
jest.mock('../src/middleware/upload.middleware', () => {
  const multer = require('multer');
  return multer({ storage: multer.memoryStorage() });
});

let mongoServer;

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
  await Like.deleteMany({});
  await Match.deleteMany({});
});

// ─── Helpers ───────────────────────────────────────────

const createUser = async (overrides = {}) => {
  const defaults = {
    name: 'Test User',
    email: `user${Date.now()}${Math.random().toString(36).slice(2)}@test.com`,
    password: 'password123',
    birthDate: new Date('1998-05-15'),
    gender: 'mujer',
    genderPreference: ['hombre'],
    settings: { maxDistance: 10, ageRange: { min: 18, max: 35 }, showMe: true },
  };
  const user = await User.create({ ...defaults, ...overrides });
  const tokens = generateTokens(user._id);
  const hashed = await hashRefreshToken(tokens.refreshToken);
  await User.updateOne({ _id: user._id }, { $set: { refreshToken: hashed } });
  return { user, accessToken: tokens.accessToken };
};

const authGet = (url, token) =>
  request(app).get(url).set('Authorization', `Bearer ${token}`);

const authPost = (url, token) =>
  request(app).post(url).set('Authorization', `Bearer ${token}`);

const authDelete = (url, token) =>
  request(app).delete(url).set('Authorization', `Bearer ${token}`);

// ─── EXPLORE ───────────────────────────────────────────

describe('GET /api/explore', () => {
  it('debería devolver perfiles filtrados (no incluye self)', async () => {
    const { accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
      gender: 'mujer',
      genderPreference: ['hombre'],
    });

    // Crear usuario que Ana debería ver
    await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
      gender: 'hombre',
      genderPreference: ['mujer'],
    });

    const res = await authGet('/api/explore', accessToken);

    expect(res.status).toBe(200);
    expect(res.body.profiles).toBeDefined();
    expect(res.body.profiles.length).toBe(1);
    expect(res.body.profiles[0].name).toBe('Carlos');
  });

  it('no debería incluir usuarios ya evaluados', async () => {
    const { user: ana, accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
      gender: 'mujer',
      genderPreference: ['hombre'],
    });

    const { user: carlos } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
      gender: 'hombre',
      genderPreference: ['mujer'],
    });

    // Ana ya le dio like a Carlos
    await Like.create({ fromUser: ana._id, toUser: carlos._id, type: 'like' });

    const res = await authGet('/api/explore', accessToken);

    expect(res.status).toBe(200);
    expect(res.body.profiles.length).toBe(0);
  });

  it('no debería incluir usuarios bloqueados', async () => {
    const { user: ana, accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
      gender: 'mujer',
      genderPreference: ['hombre'],
    });

    const { user: carlos } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
      gender: 'hombre',
      genderPreference: ['mujer'],
    });

    // Ana bloqueó a Carlos
    ana.blockedUsers.push(carlos._id);
    await ana.save({ validateModifiedOnly: true });

    const res = await authGet('/api/explore', accessToken);

    expect(res.status).toBe(200);
    expect(res.body.profiles.length).toBe(0);
  });

  it('debería respetar preferencias de género mutuas', async () => {
    const { accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
      gender: 'mujer',
      genderPreference: ['hombre'],
    });

    // Este usuario busca hombres, no mujeres → Ana no debería verlo
    await createUser({
      name: 'Pedro',
      email: 'pedro@test.com',
      gender: 'hombre',
      genderPreference: ['hombre'],
    });

    const res = await authGet('/api/explore', accessToken);

    expect(res.status).toBe(200);
    expect(res.body.profiles.length).toBe(0);
  });

  it('debería devolver array vacío sin perfiles disponibles', async () => {
    const { accessToken } = await createUser({
      name: 'Solo',
      email: 'solo@test.com',
    });

    const res = await authGet('/api/explore', accessToken);

    expect(res.status).toBe(200);
    expect(res.body.profiles).toEqual([]);
  });

  it('no debería incluir usuarios inactivos', async () => {
    const { accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
      gender: 'mujer',
      genderPreference: ['hombre'],
    });

    await createUser({
      name: 'Inactivo',
      email: 'inactivo@test.com',
      gender: 'hombre',
      genderPreference: ['mujer'],
      isActive: false,
    });

    const res = await authGet('/api/explore', accessToken);

    expect(res.status).toBe(200);
    expect(res.body.profiles.length).toBe(0);
  });

  it('no debería incluir usuarios con showMe=false', async () => {
    const { accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
      gender: 'mujer',
      genderPreference: ['hombre'],
    });

    await createUser({
      name: 'Oculto',
      email: 'oculto@test.com',
      gender: 'hombre',
      genderPreference: ['mujer'],
      settings: { maxDistance: 10, ageRange: { min: 18, max: 35 }, showMe: false },
    });

    const res = await authGet('/api/explore', accessToken);

    expect(res.status).toBe(200);
    expect(res.body.profiles.length).toBe(0);
  });
});

// ─── LIKE ──────────────────────────────────────────────

describe('POST /api/matches/like/:userId', () => {
  it('debería dar like sin match mutuo → { matched: false }', async () => {
    const { accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });

    const res = await authPost(`/api/matches/like/${carlos._id}`, accessToken);

    expect(res.status).toBe(200);
    expect(res.body.matched).toBe(false);
  });

  it('debería crear match con like mutuo → { matched: true }', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos, accessToken: carlosToken } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });

    // Carlos le da like a Ana primero
    await authPost(`/api/matches/like/${ana._id}`, carlosToken);

    // Ana le da like a Carlos → match!
    const res = await authPost(`/api/matches/like/${carlos._id}`, anaToken);

    expect(res.status).toBe(200);
    expect(res.body.matched).toBe(true);
    expect(res.body.match).toBeDefined();
    expect(res.body.match.users).toHaveLength(2);
  });

  it('debería fallar con like duplicado (409)', async () => {
    const { accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });

    await authPost(`/api/matches/like/${carlos._id}`, accessToken);
    const res = await authPost(`/api/matches/like/${carlos._id}`, accessToken);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya evaluaste/i);
  });

  it('debería fallar con like a sí mismo (400)', async () => {
    const { user, accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });

    const res = await authPost(`/api/matches/like/${user._id}`, accessToken);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ti mismo/i);
  });

  it('debería fallar con like a usuario inexistente (404)', async () => {
    const { accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const fakeId = new mongoose.Types.ObjectId();

    const res = await authPost(`/api/matches/like/${fakeId}`, accessToken);

    expect(res.status).toBe(404);
  });
});

// ─── DISLIKE ───────────────────────────────────────────

describe('POST /api/matches/dislike/:userId', () => {
  it('debería registrar dislike correctamente', async () => {
    const { accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });

    const res = await authPost(`/api/matches/dislike/${carlos._id}`, accessToken);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/dislike/i);
  });

  it('debería fallar con dislike duplicado (409)', async () => {
    const { accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });

    await authPost(`/api/matches/dislike/${carlos._id}`, accessToken);
    const res = await authPost(`/api/matches/dislike/${carlos._id}`, accessToken);

    expect(res.status).toBe(409);
  });
});

// ─── SUPERLIKE ─────────────────────────────────────────

describe('POST /api/matches/superlike/:userId', () => {
  it('debería dar superlike correctamente', async () => {
    const { accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });

    const res = await authPost(`/api/matches/superlike/${carlos._id}`, accessToken);

    expect(res.status).toBe(200);
    expect(res.body.matched).toBe(false);
  });

  it('debería crear match con superlike mutuo', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos, accessToken: carlosToken } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });

    // Carlos le da like a Ana
    await authPost(`/api/matches/like/${ana._id}`, carlosToken);

    // Ana le da superlike a Carlos → match!
    const res = await authPost(`/api/matches/superlike/${carlos._id}`, anaToken);

    expect(res.status).toBe(200);
    expect(res.body.matched).toBe(true);
  });

  it('debería fallar con segundo superlike en el mismo día (429)', async () => {
    const { accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });
    const { user: pedro } = await createUser({
      name: 'Pedro',
      email: 'pedro@test.com',
      gender: 'hombre',
    });

    await authPost(`/api/matches/superlike/${carlos._id}`, accessToken);
    const res = await authPost(`/api/matches/superlike/${pedro._id}`, accessToken);

    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/superlike del día/i);
  });
});

// ─── GET MATCHES ───────────────────────────────────────

describe('GET /api/matches', () => {
  it('debería devolver lista de matches del usuario', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos, accessToken: carlosToken } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });

    // Match mutuo
    await authPost(`/api/matches/like/${ana._id}`, carlosToken);
    await authPost(`/api/matches/like/${carlos._id}`, anaToken);

    const res = await authGet('/api/matches', anaToken);

    expect(res.status).toBe(200);
    expect(res.body.matches).toHaveLength(1);
    expect(res.body.matches[0].user.name).toBe('Carlos');
  });

  it('debería devolver array vacío sin matches', async () => {
    const { accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });

    const res = await authGet('/api/matches', accessToken);

    expect(res.status).toBe(200);
    expect(res.body.matches).toEqual([]);
  });
});

// ─── UNMATCH ───────────────────────────────────────────

describe('DELETE /api/matches/:matchId', () => {
  it('debería deshacer un match correctamente', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos, accessToken: carlosToken } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });

    // Crear match
    await authPost(`/api/matches/like/${ana._id}`, carlosToken);
    const likeRes = await authPost(`/api/matches/like/${carlos._id}`, anaToken);
    const matchId = likeRes.body.match._id;

    // Deshacer match
    const res = await authDelete(`/api/matches/${matchId}`, anaToken);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deshecho/i);

    // No debería aparecer en lista de matches
    const matchesRes = await authGet('/api/matches', anaToken);
    expect(matchesRes.body.matches).toHaveLength(0);
  });

  it('debería fallar con match inexistente (404)', async () => {
    const { accessToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const fakeId = new mongoose.Types.ObjectId();

    const res = await authDelete(`/api/matches/${fakeId}`, accessToken);

    expect(res.status).toBe(404);
  });

  it('debería fallar si el usuario no es parte del match (403)', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos, accessToken: carlosToken } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });
    const { accessToken: introToken } = await createUser({
      name: 'Intruso',
      email: 'intruso@test.com',
    });

    // Match entre Ana y Carlos
    await authPost(`/api/matches/like/${ana._id}`, carlosToken);
    const likeRes = await authPost(`/api/matches/like/${carlos._id}`, anaToken);
    const matchId = likeRes.body.match._id;

    // Intruso intenta deshacer
    const res = await authDelete(`/api/matches/${matchId}`, introToken);

    expect(res.status).toBe(403);
  });
});
