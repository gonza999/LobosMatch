# Backend — TinderApp API

API REST + WebSocket server para TinderApp. Node.js 20 + Express 4 + MongoDB 7 + Socket.io 4.

---

## Dependencias

### Producción
```json
{
  "express": "^4.18",
  "mongoose": "^8.0",
  "socket.io": "^4.7",
  "jsonwebtoken": "^9.0",
  "bcryptjs": "^2.4",
  "joi": "^17.11",
  "cors": "^2.8",
  "dotenv": "^16.3",
  "helmet": "^7.1",
  "express-rate-limit": "^7.1",
  "multer": "^1.4",
  "cloudinary": "^2.0",
  "multer-storage-cloudinary": "^4.0",
  "morgan": "^1.10",
  "cookie-parser": "^1.4"
}
```

### Desarrollo
```json
{
  "nodemon": "^3.0",
  "jest": "^29.7",
  "supertest": "^6.3",
  "eslint": "^8.56",
  "mongodb-memory-server": "^9.1"
}
```

---

## Arquitectura del Backend

```
src/
├── app.js              # Express app: middleware global, rutas, error handler
├── server.js           # HTTP server + Socket.io init + MongoDB connect
├── config/
│   ├── db.js           # mongoose.connect() con retry
│   ├── cloudinary.js   # Cloudinary config
│   └── socket.js       # Socket.io setup, auth middleware, eventos
├── models/
│   ├── User.js         # Schema usuario (perfil + auth + ubicación)
│   ├── Like.js         # Schema likes/dislikes/superlikes
│   ├── Match.js        # Schema matches (par de usuarios)
│   └── Message.js      # Schema mensajes de chat
├── routes/
│   ├── auth.routes.js      # POST /register, /login, /refresh, /logout
│   ├── user.routes.js      # GET/PUT /profile, /photos, /settings
│   ├── explore.routes.js   # GET /explore (feed de usuarios)
│   ├── match.routes.js     # POST /like, /dislike, /superlike, GET /matches
│   └── message.routes.js   # GET /messages/:matchId, POST /messages
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── explore.controller.js
│   ├── match.controller.js
│   └── message.controller.js
├── middleware/
│   ├── auth.middleware.js        # Verificar JWT, extraer user
│   ├── validate.middleware.js    # Validar body/params con Joi
│   ├── upload.middleware.js      # Multer + Cloudinary
│   └── rateLimiter.middleware.js # Rate limiting por IP/user
├── validators/
│   ├── auth.validator.js    # Schemas Joi para registro/login
│   └── user.validator.js    # Schemas Joi para perfil
├── services/
│   ├── auth.service.js      # Lógica de auth (hash, tokens, verify)
│   ├── explore.service.js   # Query geoespacial + filtros
│   ├── match.service.js     # Lógica de likes/matches
│   └── chat.service.js      # Lógica de mensajes + socket events
└── utils/
    ├── errors.js        # Clases de error custom (AppError, NotFoundError...)
    └── helpers.js       # Funciones utilitarias
```

---

## Configuración de Express (`app.js`)

```javascript
// Middleware orden:
// 1. helmet() — Headers de seguridad
// 2. cors({ origin: CLIENT_URL, credentials: true })
// 3. express.json({ limit: '10mb' })
// 4. cookieParser()
// 5. morgan('dev') — Solo en desarrollo
// 6. rateLimiter — Global: 100 req/15min por IP
// 7. Routes
// 8. 404 handler
// 9. Error handler global
```

---

## Modelos de Datos (Resumen)

> Detalle completo en [docs/modelos_datos.md](../docs/modelos_datos.md)

### User
- `email`, `password` (hash), `name`, `birthDate`, `gender`, `genderPreference`
- `bio`, `photos[]` (URLs Cloudinary), `interests[]`
- `location` (GeoJSON Point con índice 2dsphere)
- `settings` (maxDistance, ageRange, showMe)
- `isActive`, `lastActive`, `isVerified`
- Timestamps automáticos

### Like
- `fromUser`, `toUser`, `type` (like/dislike/superlike)
- Índice compuesto único `{fromUser, toUser}`

### Match
- `users` (array de 2 ObjectIds)
- `isActive`, `matchedAt`
- Índice compuesto único en users ordenados

### Message
- `match` (ref), `sender` (ref), `content`, `readAt`
- Índice en `{match, createdAt}`

---

## Endpoints API (Resumen)

> Detalle completo en [docs/api_endpoints.md](../docs/api_endpoints.md)

### Auth — `/api/auth`
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/register` | Crear cuenta | No |
| POST | `/login` | Iniciar sesión | No |
| POST | `/refresh` | Renovar access token | Cookie |
| POST | `/logout` | Cerrar sesión | Sí |

### User — `/api/users`
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/me` | Perfil propio | Sí |
| PUT | `/me` | Actualizar perfil | Sí |
| POST | `/me/photos` | Subir foto | Sí |
| DELETE | `/me/photos/:photoId` | Eliminar foto | Sí |
| PUT | `/me/location` | Actualizar ubicación | Sí |
| PUT | `/me/settings` | Actualizar preferencias | Sí |

### Explore — `/api/explore`
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/` | Feed de usuarios cercanos | Sí |

### Match — `/api/matches`
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/like/:userId` | Dar like | Sí |
| POST | `/dislike/:userId` | Dar dislike | Sí |
| POST | `/superlike/:userId` | Dar super like | Sí |
| GET | `/` | Listar matches | Sí |
| DELETE | `/:matchId` | Deshacer match | Sí |

### Messages — `/api/messages`
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/:matchId` | Mensajes de un match | Sí |
| POST | `/:matchId` | Enviar mensaje | Sí |

---

## WebSocket Events (Socket.io)

### Client → Server
| Evento | Payload | Descripción |
|--------|---------|-------------|
| `join` | `{ matchId }` | Unirse a sala de chat |
| `leave` | `{ matchId }` | Salir de sala |
| `sendMessage` | `{ matchId, content }` | Enviar mensaje |
| `typing` | `{ matchId }` | Indicador de escritura |
| `stopTyping` | `{ matchId }` | Dejar de escribir |
| `markRead` | `{ matchId, messageId }` | Marcar como leído |

### Server → Client
| Evento | Payload | Descripción |
|--------|---------|-------------|
| `newMessage` | `{ message }` | Mensaje recibido |
| `userTyping` | `{ userId }` | Usuario escribiendo |
| `userStoppedTyping` | `{ userId }` | Dejó de escribir |
| `messageRead` | `{ messageId, readAt }` | Confirmación de lectura |
| `newMatch` | `{ match, user }` | Nuevo match (push) |

### Autenticación Socket
- El cliente envía el JWT en `auth.token` al conectar
- El middleware de Socket.io valida el token antes de permitir la conexión
- Si el token expira, emite `authError` y desconecta

---

## Middleware de Autenticación

```
Request → auth.middleware.js
  1. Extraer token de header: Authorization: Bearer <token>
  2. Verificar con jwt.verify(token, JWT_SECRET)
  3. Buscar usuario en DB por id del token
  4. Si usuario no existe o está desactivado → 401
  5. Adjuntar req.user = usuario encontrado
  6. next()
```

---

## Query Geoespacial (Exploración)

```javascript
// explore.service.js — Pseudocódigo de la query principal
User.find({
  _id: { $ne: currentUserId },        // Excluir usuario actual
  _id: { $nin: alreadySwipedIds },     // Excluir ya vistos
  gender: { $in: currentUser.genderPreference },
  genderPreference: currentUser.gender,
  'settings.showMe': true,
  isActive: true,
  birthDate: { $gte: minDate, $lte: maxDate },  // Rango de edad
  location: {
    $near: {
      $geometry: currentUser.location,
      $maxDistance: currentUser.settings.maxDistance * 1000  // km → m
    }
  }
}).limit(20)
```

---

## Manejo de Errores

```javascript
// Clase base
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Errores específicos
class NotFoundError extends AppError { constructor(msg) { super(msg, 404) } }
class UnauthorizedError extends AppError { constructor(msg) { super(msg, 401) } }
class ForbiddenError extends AppError { constructor(msg) { super(msg, 403) } }
class ValidationError extends AppError { constructor(msg) { super(msg, 400) } }
class ConflictError extends AppError { constructor(msg) { super(msg, 409) } }

// Error handler global en app.js
app.use((err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error('ERROR no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});
```

---

## Testing

```bash
npm test              # Ejecutar todos los tests
npm run test:watch    # Modo watch
```

- **Unit tests**: Services y utils con Jest
- **Integration tests**: Endpoints con Supertest + mongodb-memory-server
- Cada archivo de test en `/tests/` corresponde a un dominio (auth, user, match, explore)
- Se usa una instancia de MongoDB en memoria para tests (no afecta la DB real)