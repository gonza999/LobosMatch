require('dotenv').config();

const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.io
initSocket(server);

const start = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT} (${process.env.NODE_ENV})`);
  });
};

start();

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = server;
