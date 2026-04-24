/**
 * E2E Test — Flujo completo: Registro → Perfil → Explore → Match → Chat
 *
 * Simula dos usuarios que se registran, se encuentran en explore,
 * se dan like mutuamente (match), y se envían mensajes.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Like = require('../src/models/Like');
const Match = require('../src/models/Match');
const Message = require('../src/models/Message');

// Mocks
jest.mock('../src/config/cloudinary', () => ({
  uploader: { destroy: jest.fn().mockResolvedValue({ result: 'ok' }) },
}));
jest.mock('../src/middleware/upload.middleware', () => {
  const multer = require('multer');
  return multer({ storage: multer.memoryStorage() });
});
jest.mock('../src/config/socket', () => ({
  initSocket: jest.fn(),
  getIO: jest.fn(),
  emitNewMatch: jest.fn(),
}));

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_e2e';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_e2e';
  process.env.JWT_EXPIRE = '15m';
  process.env.JWT_REFRESH_EXPIRE = '7d';
  process.env.NODE_ENV = 'test';

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await Message.deleteMany({});
  await Match.deleteMany({});
  await Like.deleteMany({});
  await User.deleteMany({});
  await mongoose.disconnect();
  await mongoServer.stop();
});

// ─── E2E: Flujo completo ──────────────────────────────

describe('E2E — Registro → Explore → Match → Chat', () => {
  let userA, userB;

  it('1. Dos usuarios se registran exitosamente', async () => {
    const resA = await request(app).post('/api/auth/register').send({
      name: 'María',
      email: 'maria@e2e.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      birthDate: '1998-03-15',
      gender: 'mujer',
      genderPreference: ['hombre'],
    });
    expect(resA.status).toBe(201);
    expect(resA.body.user.name).toBe('María');
    expect(resA.body.accessToken).toBeDefined();

    const resB = await request(app).post('/api/auth/register').send({
      name: 'Lucas',
      email: 'lucas@e2e.com',
      password: 'Password456!',
      confirmPassword: 'Password456!',
      birthDate: '1996-07-20',
      gender: 'hombre',
      genderPreference: ['mujer'],
    });
    expect(resB.status).toBe(201);
    expect(resB.body.user.name).toBe('Lucas');

    userA = { id: resA.body.user._id, token: resA.body.accessToken };
    userB = { id: resB.body.user._id, token: resB.body.accessToken };
  });

  it('2. Ambos actualizan su ubicación', async () => {
    // María en Buenos Aires
    const resA = await request(app)
      .put('/api/users/me/location')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ latitude: -34.6037, longitude: -58.3816 });
    expect(resA.status).toBe(200);

    // Lucas también en Buenos Aires (2km de distancia)
    const resB = await request(app)
      .put('/api/users/me/location')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ latitude: -34.5900, longitude: -58.3900 });
    expect(resB.status).toBe(200);
  });

  it('3. María ve a Lucas en explore', async () => {
    const res = await request(app)
      .get('/api/explore')
      .set('Authorization', `Bearer ${userA.token}`);
    expect(res.status).toBe(200);
    expect(res.body.profiles.length).toBeGreaterThanOrEqual(1);

    const lucas = res.body.profiles.find(p => p.name === 'Lucas');
    expect(lucas).toBeDefined();
  });

  it('4. Lucas ve a María en explore', async () => {
    const res = await request(app)
      .get('/api/explore')
      .set('Authorization', `Bearer ${userB.token}`);
    expect(res.status).toBe(200);

    const maria = res.body.profiles.find(p => p.name === 'María');
    expect(maria).toBeDefined();
  });

  it('5. María da like a Lucas → no match todavía', async () => {
    const res = await request(app)
      .post(`/api/matches/like/${userB.id}`)
      .set('Authorization', `Bearer ${userA.token}`);
    expect(res.status).toBe(200);
    expect(res.body.matched).toBe(false);
  });

  it('6. Lucas da like a María → ¡MATCH!', async () => {
    const res = await request(app)
      .post(`/api/matches/like/${userA.id}`)
      .set('Authorization', `Bearer ${userB.token}`);
    expect(res.status).toBe(200);
    expect(res.body.matched).toBe(true);
    expect(res.body.match).toBeDefined();

    // Guardar match ID para usar en chat
    userA.matchId = res.body.match._id;
    userB.matchId = res.body.match._id;
  });

  it('7. Ambos ven el match en su lista', async () => {
    const resA = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${userA.token}`);
    expect(resA.status).toBe(200);
    expect(resA.body.matches.length).toBe(1);

    const resB = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${userB.token}`);
    expect(resB.status).toBe(200);
    expect(resB.body.matches.length).toBe(1);
  });

  it('8. María envía un mensaje a Lucas', async () => {
    const res = await request(app)
      .post(`/api/messages/${userA.matchId}`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ text: '¡Hola Lucas! 🐺' });
    expect(res.status).toBe(201);
    expect(res.body.message.text).toBe('¡Hola Lucas! 🐺');
    const senderId = res.body.message.sender._id || res.body.message.sender;
    expect(senderId.toString()).toBe(userA.id);
  });

  it('9. Lucas responde a María', async () => {
    const res = await request(app)
      .post(`/api/messages/${userB.matchId}`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ text: '¡Hola María! ¿Cómo estás?' });
    expect(res.status).toBe(201);
    expect(res.body.message.text).toBe('¡Hola María! ¿Cómo estás?');
  });

  it('10. María ve los mensajes del chat', async () => {
    const res = await request(app)
      .get(`/api/messages/${userA.matchId}`)
      .set('Authorization', `Bearer ${userA.token}`);
    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBe(2);

    const texts = res.body.messages.map(m => m.text);
    expect(texts).toContain('¡Hola Lucas! 🐺');
    expect(texts).toContain('¡Hola María! ¿Cómo estás?');
  });

  it('11. Lucas no aparece más en explore de María (ya interactuaron)', async () => {
    const res = await request(app)
      .get('/api/explore')
      .set('Authorization', `Bearer ${userA.token}`);
    expect(res.status).toBe(200);
    const lucas = res.body.profiles.find(p => p.name === 'Lucas');
    expect(lucas).toBeUndefined();
  });

  it('12. María actualiza su perfil', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ bio: 'Me encanta LobosMatch 🐺', interests: ['viajes', 'música'] });
    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe('Me encanta LobosMatch 🐺');
    expect(res.body.user.interests).toContain('viajes');
  });

  it('13. Lucas puede hacer unmatch', async () => {
    const res = await request(app)
      .delete(`/api/matches/${userB.matchId}`)
      .set('Authorization', `Bearer ${userB.token}`);
    expect(res.status).toBe(200);

    // Verificar que ya no hay matches para ninguno
    const resA = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${userA.token}`);
    expect(resA.body.matches.length).toBe(0);
  });

  it('14. María hace logout y login de nuevo', async () => {
    // Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${userA.token}`);
    expect(logoutRes.status).toBe(200);

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'maria@e2e.com', password: 'Password123!' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.user.name).toBe('María');
  });
});
