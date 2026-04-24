const mongoose = require('mongoose');

let mongoServer = null;

const connectDB = async () => {
  try {
    // Intentar conectar a la URI configurada
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    // Si falla y estamos en desarrollo, usar MongoDB en memoria
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`No se pudo conectar a MongoDB externo: ${error.message}`);
      console.log('Iniciando MongoDB en memoria (desarrollo)...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`MongoDB en memoria conectado: ${conn.connection.host}`);
      return conn;
    }
    console.error('No se pudo conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

mongoose.connection.on('disconnected', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('MongoDB desconectado');
  }
});

mongoose.connection.on('error', (err) => {
  console.error('Error de MongoDB:', err.message);
});

module.exports = { connectDB, disconnectDB };
