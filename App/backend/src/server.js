require('dotenv').config();

console.log('[boot] NODE_ENV:', process.env.NODE_ENV);
console.log('[boot] PORT:', process.env.PORT);
console.log('[boot] MONGODB_URI:', process.env.MONGODB_URI ? 'SET (' + process.env.MONGODB_URI.substring(0, 20) + '...)' : 'NOT SET');
console.log('[boot] JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');

const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.io
initSocket(server);

const start = async () => {
  try {
    console.log('[boot] Connecting to MongoDB...');
    await connectDB();
    console.log('[boot] MongoDB connected');

    server.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT} (${process.env.NODE_ENV})`);
    });
  } catch (err) {
    console.error('[boot] FATAL ERROR:', err);
    process.exit(1);
  }
};

start();

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = server;
