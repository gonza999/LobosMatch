/**
 * Seed script — Crea usuarios fake para probar exploración
 *
 * Uso: node src/utils/seed.js
 *
 * Crea 15 usuarios cerca de Buenos Aires (-58.38, -34.60)
 * con perfiles variados para testear filtros.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

const seedUsers = [
  { name: 'Lucía Fernández', email: 'lucia@test.com', password: 'test1234', birthDate: new Date('1998-03-12'), gender: 'mujer', genderPreference: ['hombre'], bio: 'Amante del café y los viajes', interests: ['café', 'viajes', 'yoga'], coordinates: [-58.3816, -34.6037] },
  { name: 'Martín López', email: 'martin@test.com', password: 'test1234', birthDate: new Date('1996-07-22'), gender: 'hombre', genderPreference: ['mujer'], bio: 'Ingeniero. Fan del rock.', interests: ['rock', 'programación', 'cerveza'], coordinates: [-58.3900, -34.6100] },
  { name: 'Valentina García', email: 'valentina@test.com', password: 'test1234', birthDate: new Date('2000-01-05'), gender: 'mujer', genderPreference: ['hombre', 'mujer'], bio: 'Diseñadora gráfica 🎨', interests: ['arte', 'diseño', 'fotografía'], coordinates: [-58.3750, -34.5950] },
  { name: 'Santiago Rodríguez', email: 'santiago@test.com', password: 'test1234', birthDate: new Date('1995-11-30'), gender: 'hombre', genderPreference: ['mujer'], bio: 'Cocinero aficionado', interests: ['cocina', 'vinos', 'fútbol'], coordinates: [-58.4000, -34.6200] },
  { name: 'Camila Martínez', email: 'camila@test.com', password: 'test1234', birthDate: new Date('1999-06-18'), gender: 'mujer', genderPreference: ['hombre'], bio: 'Estudiante de medicina', interests: ['ciencia', 'running', 'series'], coordinates: [-58.3700, -34.5900] },
  { name: 'Nicolás Pérez', email: 'nicolas@test.com', password: 'test1234', birthDate: new Date('1997-09-25'), gender: 'hombre', genderPreference: ['mujer', 'otro'], bio: 'Músico y profesor de guitarra', interests: ['música', 'guitarra', 'conciertos'], coordinates: [-58.3850, -34.6050] },
  { name: 'Sol Gómez', email: 'sol@test.com', password: 'test1234', birthDate: new Date('2001-04-14'), gender: 'mujer', genderPreference: ['hombre'], bio: 'Bailarina de tango 💃', interests: ['tango', 'baile', 'teatro'], coordinates: [-58.3780, -34.6080] },
  { name: 'Facundo Torres', email: 'facundo@test.com', password: 'test1234', birthDate: new Date('1994-12-08'), gender: 'hombre', genderPreference: ['mujer'], bio: 'Periodista deportivo', interests: ['fútbol', 'escritura', 'cine'], coordinates: [-58.3950, -34.6150] },
  { name: 'Milagros Díaz', email: 'milagros@test.com', password: 'test1234', birthDate: new Date('1998-08-20'), gender: 'mujer', genderPreference: ['hombre', 'mujer'], bio: 'Fotógrafa freelance', interests: ['fotografía', 'viajes', 'naturaleza'], coordinates: [-58.3600, -34.5800] },
  { name: 'Tomás Sánchez', email: 'tomas@test.com', password: 'test1234', birthDate: new Date('1996-02-14'), gender: 'hombre', genderPreference: ['mujer'], bio: 'Dev fullstack. Gamer.', interests: ['gaming', 'tecnología', 'anime'], coordinates: [-58.3880, -34.6020] },
  { name: 'Julieta Romero', email: 'julieta@test.com', password: 'test1234', birthDate: new Date('2000-10-03'), gender: 'mujer', genderPreference: ['hombre'], bio: 'Arquitecta en construcción 🏗️', interests: ['arquitectura', 'diseño', 'café'], coordinates: [-58.3720, -34.5970] },
  { name: 'Alex Rivera', email: 'alex@test.com', password: 'test1234', birthDate: new Date('1999-05-09'), gender: 'otro', genderPreference: ['hombre', 'mujer', 'otro'], bio: 'Artista y activista', interests: ['arte', 'política', 'música'], coordinates: [-58.3830, -34.6060] },
  { name: 'Bruno Medina', email: 'bruno@test.com', password: 'test1234', birthDate: new Date('1993-03-27'), gender: 'hombre', genderPreference: ['mujer'], bio: 'Personal trainer 💪', interests: ['fitness', 'nutrición', 'surf'], coordinates: [-58.3910, -34.6110] },
  { name: 'Florencia Castro', email: 'florencia@test.com', password: 'test1234', birthDate: new Date('1997-07-16'), gender: 'mujer', genderPreference: ['hombre'], bio: 'Abogada. Amante de los perros 🐶', interests: ['perros', 'derecho', 'lectura'], coordinates: [-58.3760, -34.5930] },
  { name: 'Mateo Ruiz', email: 'mateo@test.com', password: 'test1234', birthDate: new Date('1995-01-22'), gender: 'hombre', genderPreference: ['mujer', 'otro'], bio: 'Emprendedor y viajero', interests: ['startups', 'viajes', 'surf'], coordinates: [-58.4050, -34.6250] },
];

const seed = async () => {
  try {
    await connectDB();
    console.log('Conectado a MongoDB');

    // Limpiar datos anteriores de seed
    const seedEmails = seedUsers.map((u) => u.email);
    await User.deleteMany({ email: { $in: seedEmails } });
    console.log('Datos de seed anteriores eliminados');

    // Crear usuarios
    for (const userData of seedUsers) {
      const { coordinates, ...rest } = userData;
      await User.create({
        ...rest,
        location: {
          type: 'Point',
          coordinates,
        },
        photos: [{
          url: `https://picsum.photos/seed/${rest.email}/400/500`,
          publicId: `seed_${rest.email}`,
          order: 0,
        }],
        settings: {
          maxDistance: 15,
          ageRange: { min: 18, max: 40 },
          showMe: true,
        },
      });
      console.log(`  ✓ ${rest.name}`);
    }

    console.log(`\n${seedUsers.length} usuarios creados exitosamente.`);
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error.message);
    await disconnectDB();
    process.exit(1);
  }
};

seed();
