const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Match = require('../src/models/Match');
const Message = require('../src/models/Message');
const { generateTokens, hashRefreshToken } = require('../src/services/auth.service');

// Mock Cloudinary & upload
jest.mock('../src/config/cloudinary', () => ({
  uploader: { destroy: jest.fn().mockResolvedValue({ result: 'ok' }) },
}));
jest.mock('../src/middleware/upload.middleware', () => {
  const multer = require('multer');
  return multer({ storage: multer.memoryStorage() });
});
// Mock socket emitNewMatch para que no falle en tests
jest.mock('../src/config/socket', () => ({
  initSocket: jest.fn(),
  getIO: jest.fn(),
  emitNewMatch: jest.fn(),
}));

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
  await Match.deleteMany({});
  await Message.deleteMany({});
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
  };
  const user = await User.create({ ...defaults, ...overrides });
  const tokens = generateTokens(user._id);
  const hashed = await hashRefreshToken(tokens.refreshToken);
  await User.updateOne({ _id: user._id }, { $set: { refreshToken: hashed } });
  return { user, accessToken: tokens.accessToken };
};

const createMatch = async (user1Id, user2Id) => {
  const users = [user1Id, user2Id].sort();
  return Match.create({ users });
};

const authGet = (url, token) =>
  request(app).get(url).set('Authorization', `Bearer ${token}`);

const authPost = (url, token, body) =>
  request(app).post(url).set('Authorization', `Bearer ${token}`).send(body);

const authPut = (url, token) =>
  request(app).put(url).set('Authorization', `Bearer ${token}`);

// ─── POST /api/messages/:matchId ───────────────────────

describe('POST /api/messages/:matchId', () => {
  it('debería enviar un mensaje correctamente (201)', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });
    const match = await createMatch(ana._id, carlos._id);

    const res = await authPost(`/api/messages/${match._id}`, anaToken, {
      text: 'Hola Carlos!',
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBeDefined();
    expect(res.body.message.text).toBe('Hola Carlos!');
    expect(res.body.message.sender).toBeDefined();
  });

  it('debería actualizar lastMessage en el match', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });
    const match = await createMatch(ana._id, carlos._id);

    await authPost(`/api/messages/${match._id}`, anaToken, {
      text: 'Último mensaje',
    });

    const updated = await Match.findById(match._id);
    expect(updated.lastMessage.text).toBe('Último mensaje');
    expect(updated.lastMessage.sender.toString()).toBe(ana._id.toString());
  });

  it('debería fallar sin match (404)', async () => {
    const { accessToken } = await createUser({ name: 'Ana', email: 'ana@test.com' });
    const fakeId = new mongoose.Types.ObjectId();

    const res = await authPost(`/api/messages/${fakeId}`, accessToken, {
      text: 'Hola',
    });

    expect(res.status).toBe(404);
  });

  it('debería fallar si no es participante del match (403)', async () => {
    const { user: ana } = await createUser({ name: 'Ana', email: 'ana@test.com' });
    const { user: carlos } = await createUser({ name: 'Carlos', email: 'carlos@test.com' });
    const { accessToken: introToken } = await createUser({ name: 'Intruso', email: 'intruso@test.com' });

    const match = await createMatch(ana._id, carlos._id);

    const res = await authPost(`/api/messages/${match._id}`, introToken, {
      text: 'Espiando',
    });

    expect(res.status).toBe(403);
  });

  it('debería fallar con mensaje vacío (400)', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos } = await createUser({ name: 'Carlos', email: 'carlos@test.com' });
    const match = await createMatch(ana._id, carlos._id);

    const res = await authPost(`/api/messages/${match._id}`, anaToken, {
      text: '',
    });

    expect(res.status).toBe(400);
  });

  it('debería fallar en match inactivo (403)', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos } = await createUser({ name: 'Carlos', email: 'carlos@test.com' });
    const match = await createMatch(ana._id, carlos._id);
    match.isActive = false;
    await match.save();

    const res = await authPost(`/api/messages/${match._id}`, anaToken, {
      text: 'Hola',
    });

    expect(res.status).toBe(403);
  });
});

// ─── GET /api/messages/:matchId ────────────────────────

describe('GET /api/messages/:matchId', () => {
  it('debería devolver mensajes del match', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos, accessToken: carlosToken } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });
    const match = await createMatch(ana._id, carlos._id);

    // Enviar algunos mensajes
    await authPost(`/api/messages/${match._id}`, anaToken, { text: 'Hola!' });
    await authPost(`/api/messages/${match._id}`, carlosToken, { text: 'Hey!' });
    await authPost(`/api/messages/${match._id}`, anaToken, { text: 'Cómo estás?' });

    const res = await authGet(`/api/messages/${match._id}`, anaToken);

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(3);
    // Orden cronológico
    expect(res.body.messages[0].text).toBe('Hola!');
    expect(res.body.messages[1].text).toBe('Hey!');
    expect(res.body.messages[2].text).toBe('Cómo estás?');
  });

  it('debería devolver array vacío sin mensajes', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos } = await createUser({ name: 'Carlos', email: 'carlos@test.com' });
    const match = await createMatch(ana._id, carlos._id);

    const res = await authGet(`/api/messages/${match._id}`, anaToken);

    expect(res.status).toBe(200);
    expect(res.body.messages).toEqual([]);
  });

  it('debería fallar si no es participante (403)', async () => {
    const { user: ana } = await createUser({ name: 'Ana', email: 'ana@test.com' });
    const { user: carlos } = await createUser({ name: 'Carlos', email: 'carlos@test.com' });
    const { accessToken: introToken } = await createUser({ name: 'Intruso', email: 'intruso@test.com' });

    const match = await createMatch(ana._id, carlos._id);

    const res = await authGet(`/api/messages/${match._id}`, introToken);

    expect(res.status).toBe(403);
  });
});

// ─── PUT /api/messages/:matchId/read ───────────────────

describe('PUT /api/messages/:matchId/read', () => {
  it('debería marcar mensajes como leídos', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos, accessToken: carlosToken } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });
    const match = await createMatch(ana._id, carlos._id);

    // Carlos envía 3 mensajes
    await authPost(`/api/messages/${match._id}`, carlosToken, { text: 'Msg 1' });
    await authPost(`/api/messages/${match._id}`, carlosToken, { text: 'Msg 2' });
    await authPost(`/api/messages/${match._id}`, carlosToken, { text: 'Msg 3' });

    // Ana marca como leídos
    const res = await authPut(`/api/messages/${match._id}/read`, anaToken);

    expect(res.status).toBe(200);
    expect(res.body.markedCount).toBe(3);

    // Verificar en DB
    const messages = await Message.find({ match: match._id });
    messages.forEach((msg) => {
      expect(msg.readBy.map(String)).toContain(ana._id.toString());
    });
  });

  it('debería devolver 0 si no hay mensajes sin leer', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos } = await createUser({ name: 'Carlos', email: 'carlos@test.com' });
    const match = await createMatch(ana._id, carlos._id);

    const res = await authPut(`/api/messages/${match._id}/read`, anaToken);

    expect(res.status).toBe(200);
    expect(res.body.markedCount).toBe(0);
  });
});

// ─── GET /api/messages/:matchId/unread ─────────────────

describe('GET /api/messages/:matchId/unread', () => {
  it('debería devolver conteo de mensajes no leídos', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos, accessToken: carlosToken } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });
    const match = await createMatch(ana._id, carlos._id);

    // Carlos envía 2 mensajes
    await authPost(`/api/messages/${match._id}`, carlosToken, { text: 'Msg 1' });
    await authPost(`/api/messages/${match._id}`, carlosToken, { text: 'Msg 2' });

    // Ana chequea no leídos
    const res = await authGet(`/api/messages/${match._id}/unread`, anaToken);

    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBe(2);
  });

  it('debería devolver 0 después de leer', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos, accessToken: carlosToken } = await createUser({
      name: 'Carlos',
      email: 'carlos@test.com',
    });
    const match = await createMatch(ana._id, carlos._id);

    await authPost(`/api/messages/${match._id}`, carlosToken, { text: 'Msg 1' });
    await authPut(`/api/messages/${match._id}/read`, anaToken);

    const res = await authGet(`/api/messages/${match._id}/unread`, anaToken);

    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBe(0);
  });

  it('no debería contar mensajes propios como no leídos', async () => {
    const { user: ana, accessToken: anaToken } = await createUser({
      name: 'Ana',
      email: 'ana@test.com',
    });
    const { user: carlos } = await createUser({ name: 'Carlos', email: 'carlos@test.com' });
    const match = await createMatch(ana._id, carlos._id);

    // Ana envía mensajes a sí misma (sus propios)
    await authPost(`/api/messages/${match._id}`, anaToken, { text: 'Mi msg' });

    const res = await authGet(`/api/messages/${match._id}/unread`, anaToken);

    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBe(0);
  });
});
