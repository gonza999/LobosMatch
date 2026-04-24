# API Endpoints — TinderApp

Base URL: `http://localhost:5000/api`

Todas las respuestas son JSON. Los endpoints marcados con 🔒 requieren header `Authorization: Bearer <token>`.

---

## Health Check

### `GET /health`

Sin autenticación. Verifica que el servidor está activo.

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-24T12:00:00.000Z"
}
```

---

## Auth — `/api/auth`

### `POST /api/auth/register`

Crear nueva cuenta de usuario.

**Request Body:**
```json
{
  "name": "Ana García",
  "email": "ana@example.com",
  "password": "miPassword123",
  "confirmPassword": "miPassword123",
  "birthDate": "1998-05-15",
  "gender": "mujer",
  "genderPreference": ["hombre"]
}
```

**Validaciones:**
| Campo | Regla |
|-------|-------|
| name | Requerido, 2-50 chars |
| email | Requerido, formato email, único |
| password | Requerido, min 6 chars, al menos 1 número |
| confirmPassword | Requerido, debe coincidir con password |
| birthDate | Requerido, edad ≥ 18 |
| gender | Requerido, enum: hombre/mujer/otro |
| genderPreference | Requerido, array de enum |

**Response 201:**
```json
{
  "user": {
    "_id": "665a1b2c3d4e5f6a7b8c9d0e",
    "name": "Ana García",
    "email": "ana@example.com",
    "birthDate": "1998-05-15T00:00:00.000Z",
    "gender": "mujer",
    "genderPreference": ["hombre"],
    "bio": "",
    "photos": [],
    "interests": [],
    "settings": { "maxDistance": 10, "ageRange": { "min": 18, "max": 35 }, "showMe": true },
    "isActive": true,
    "age": 28
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errores:**
| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | "Error de validación: ..." | Campos inválidos |
| 409 | "El email ya está registrado" | Email duplicado |

---

### `POST /api/auth/login`

Iniciar sesión.

**Request Body:**
```json
{
  "email": "ana@example.com",
  "password": "miPassword123"
}
```

**Response 200:**
```json
{
  "user": { /* objeto User completo */ },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Errores:**
| Código | Mensaje |
|--------|---------|
| 400 | "Email y contraseña son requeridos" |
| 401 | "Credenciales inválidas" |

---

### `POST /api/auth/refresh`

Renovar access token usando refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJ...(nuevo)",
  "refreshToken": "eyJ...(nuevo)"
}
```

**Errores:**
| Código | Mensaje |
|--------|---------|
| 401 | "Refresh token inválido o expirado" |

---

### `POST /api/auth/logout` 🔒

Cerrar sesión. Invalida el refresh token.

**Response 200:**
```json
{
  "message": "Sesión cerrada correctamente"
}
```

---

## Users — `/api/users` 🔒

Todos los endpoints requieren autenticación.

### `GET /api/users/me`

Obtener perfil del usuario autenticado.

**Response 200:**
```json
{
  "user": {
    "_id": "665a1b2c3d4e5f6a7b8c9d0e",
    "name": "Ana García",
    "email": "ana@example.com",
    "birthDate": "1998-05-15T00:00:00.000Z",
    "gender": "mujer",
    "bio": "Amante de los viajes 📸",
    "photos": [
      { "_id": "ph1", "url": "https://res.cloudinary.com/...", "publicId": "tinderapp/ana1", "order": 0 },
      { "_id": "ph2", "url": "https://res.cloudinary.com/...", "publicId": "tinderapp/ana2", "order": 1 }
    ],
    "interests": ["viajes", "fotografía", "cocina"],
    "genderPreference": ["hombre"],
    "location": { "type": "Point", "coordinates": [-3.7038, 40.4168] },
    "settings": { "maxDistance": 15, "ageRange": { "min": 25, "max": 35 }, "showMe": true },
    "isActive": true,
    "isVerified": false,
    "lastActive": "2026-04-24T10:30:00.000Z",
    "age": 28
  }
}
```

---

### `PUT /api/users/me`

Actualizar perfil (nombre, bio, intereses, gender preference).

**Request Body (campos opcionales):**
```json
{
  "name": "Ana G.",
  "bio": "Nueva bio actualizada",
  "interests": ["viajes", "música", "deporte"],
  "genderPreference": ["hombre", "otro"]
}
```

**Validaciones:**
| Campo | Regla |
|-------|-------|
| name | 2-50 chars si presente |
| bio | Max 500 chars |
| interests | Array de strings, max 10 items, cada uno max 30 chars |
| genderPreference | Array de enum |

**Response 200:**
```json
{
  "user": { /* usuario actualizado */ }
}
```

---

### `POST /api/users/me/photos`

Subir una foto al perfil. Multipart form-data.

**Request:** `multipart/form-data`
| Campo | Tipo | Requerido |
|-------|------|-----------|
| photo | File (JPG/PNG/WebP, max 5MB) | Sí |
| order | Number (0-5) | No (default: siguiente disponible) |

**Response 201:**
```json
{
  "photo": {
    "_id": "ph3",
    "url": "https://res.cloudinary.com/demo/image/upload/v1/tinderapp/abc123.jpg",
    "publicId": "tinderapp/abc123",
    "order": 2
  }
}
```

**Errores:**
| Código | Mensaje |
|--------|---------|
| 400 | "Formato de imagen no soportado (solo JPG, PNG, WebP)" |
| 400 | "La imagen excede el tamaño máximo de 5MB" |
| 400 | "Máximo 6 fotos permitidas" |

---

### `DELETE /api/users/me/photos/:photoId`

Eliminar una foto del perfil.

**Response 200:**
```json
{
  "message": "Foto eliminada",
  "photos": [ /* array actualizado */ ]
}
```

**Errores:**
| Código | Mensaje |
|--------|---------|
| 400 | "No puedes eliminar tu única foto" |
| 404 | "Foto no encontrada" |

---

### `PUT /api/users/me/location`

Actualizar ubicación GPS del usuario.

**Request Body:**
```json
{
  "longitude": -3.7038,
  "latitude": 40.4168
}
```

**Validaciones:**
| Campo | Regla |
|-------|-------|
| longitude | Requerido, número, -180 a 180 |
| latitude | Requerido, número, -90 a 90 |

**Response 200:**
```json
{
  "location": {
    "type": "Point",
    "coordinates": [-3.7038, 40.4168]
  }
}
```

---

### `PUT /api/users/me/settings`

Actualizar preferencias de búsqueda.

**Request Body (campos opcionales):**
```json
{
  "maxDistance": 20,
  "ageRange": { "min": 22, "max": 40 },
  "showMe": true
}
```

**Validaciones:**
| Campo | Regla |
|-------|-------|
| maxDistance | 1-50 (km) |
| ageRange.min | 18-99 |
| ageRange.max | 18-99, >= ageRange.min |
| showMe | Boolean |

**Response 200:**
```json
{
  "settings": {
    "maxDistance": 20,
    "ageRange": { "min": 22, "max": 40 },
    "showMe": true
  }
}
```

---

### `POST /api/users/report`

Reportar un usuario.

**Request Body:**
```json
{
  "userId": "665b2c3d4e5f6a7b8c9d0e1f",
  "reason": "spam",
  "description": "Envía links sospechosos"
}
```

**Validaciones:**
| Campo | Regla |
|-------|-------|
| userId | Requerido, ObjectId válido |
| reason | Requerido, enum: spam/acoso/perfil_falso/contenido_inapropiado/otro |
| description | Opcional, max 500 chars |

**Response 200:**
```json
{
  "message": "Reporte enviado correctamente"
}
```

---

### `POST /api/users/block/:userId`

Bloquear un usuario. Bidireccional e inmediato.

**Response 200:**
```json
{
  "message": "Usuario bloqueado"
}
```

Efectos secundarios:
- Se deshace cualquier match existente entre ambos
- Ambos usuarios dejan de verse mutuamente en exploración
- Se elimina cualquier conversación activa

---

### `DELETE /api/users/me`

Eliminar cuenta permanentemente.

**Request Body:**
```json
{
  "confirmation": "ELIMINAR"
}
```

**Response 200:**
```json
{
  "message": "Cuenta eliminada permanentemente"
}
```

---

## Explore — `/api/explore` 🔒

### `GET /api/explore`

Obtener feed de usuarios para explorar (swipe).

**Query Parameters:**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| limit | Number | 20 | Usuarios por página (max 50) |
| page | Number | 1 | Página |

**Response 200:**
```json
{
  "users": [
    {
      "_id": "665b...",
      "name": "Carlos",
      "age": 27,
      "bio": "Ingeniero, amante del surf",
      "photos": [
        { "url": "https://res.cloudinary.com/...", "order": 0 },
        { "url": "https://res.cloudinary.com/...", "order": 1 }
      ],
      "interests": ["surf", "tecnología", "cocina"],
      "distance": 3.2
    }
  ],
  "page": 1,
  "totalPages": 5,
  "hasMore": true
}
```

**Filtros aplicados automáticamente:**
1. Excluye al usuario autenticado
2. Excluye usuarios ya swipeados (like/dislike/superlike)
3. Excluye usuarios bloqueados (en ambas direcciones)
4. Filtra por género según preferencias mutuas
5. Filtra por rango de edad del usuario
6. Filtra por distancia máxima (query geoespacial `$near`)
7. Solo usuarios activos con `showMe: true`
8. Solo usuarios activos en los últimos 30 días

---

## Matches — `/api/matches` 🔒

### `POST /api/matches/like/:userId`

Dar like a un usuario.

**Response 200 (sin match):**
```json
{
  "matched": false,
  "dailyLikesRemaining": 95
}
```

**Response 200 (con match):**
```json
{
  "matched": true,
  "match": {
    "_id": "665c...",
    "users": ["665a...", "665b..."],
    "matchedAt": "2026-04-24T14:00:00.000Z"
  },
  "matchedUser": {
    "name": "Carlos",
    "photos": [{ "url": "...", "order": 0 }]
  },
  "dailyLikesRemaining": 95
}
```

**Errores:**
| Código | Mensaje |
|--------|---------|
| 400 | "No puedes darte like a ti mismo" |
| 400 | "Ya realizaste una acción sobre este usuario" |
| 429 | "Límite diario de likes alcanzado (100)" |
| 404 | "Usuario no encontrado" |

---

### `POST /api/matches/dislike/:userId`

Dar dislike a un usuario (no se mostrará de nuevo).

**Response 200:**
```json
{
  "message": "Dislike registrado"
}
```

---

### `POST /api/matches/superlike/:userId`

Dar super like (1 por día para usuarios free).

**Response 200 (sin match):**
```json
{
  "matched": false,
  "superLikesRemaining": 0
}
```

**Response 200 (con match):**
```json
{
  "matched": true,
  "match": { /* match object */ },
  "matchedUser": { /* user summary */ },
  "superLikesRemaining": 0
}
```

**Errores:**
| Código | Mensaje |
|--------|---------|
| 429 | "Ya usaste tu Super Like de hoy" |

---

### `GET /api/matches`

Listar todos los matches activos del usuario.

**Query Parameters:**
| Param | Tipo | Default |
|-------|------|---------|
| page | Number | 1 |
| limit | Number | 20 |

**Response 200:**
```json
{
  "matches": [
    {
      "_id": "665c...",
      "matchedAt": "2026-04-24T14:00:00.000Z",
      "user": {
        "_id": "665b...",
        "name": "Carlos",
        "photos": [{ "url": "...", "order": 0 }],
        "age": 27,
        "lastActive": "2026-04-24T13:00:00.000Z"
      },
      "lastMessage": {
        "content": "¿Cómo estás?",
        "sender": "665b...",
        "sentAt": "2026-04-24T15:30:00.000Z"
      }
    }
  ],
  "page": 1,
  "totalPages": 2
}
```

---

### `DELETE /api/matches/:matchId`

Deshacer un match. Elimina la conexión y los mensajes.

**Response 200:**
```json
{
  "message": "Match deshecho"
}
```

**Errores:**
| Código | Mensaje |
|--------|---------|
| 403 | "No perteneces a este match" |
| 404 | "Match no encontrado" |

---

## Messages — `/api/messages` 🔒

### `GET /api/messages/:matchId`

Obtener mensajes de un match (paginado, más recientes primero).

**Query Parameters:**
| Param | Tipo | Default |
|-------|------|---------|
| page | Number | 1 |
| limit | Number | 50 |

**Response 200:**
```json
{
  "messages": [
    {
      "_id": "665d...",
      "sender": "665a...",
      "content": "¡Hola! ¿Qué tal?",
      "readAt": null,
      "createdAt": "2026-04-24T15:30:00.000Z"
    },
    {
      "_id": "665e...",
      "sender": "665b...",
      "content": "¡Hey! Bien, ¿y tú?",
      "readAt": "2026-04-24T15:31:00.000Z",
      "createdAt": "2026-04-24T15:31:00.000Z"
    }
  ],
  "page": 1,
  "totalPages": 3,
  "hasMore": true
}
```

**Errores:**
| Código | Mensaje |
|--------|---------|
| 403 | "No perteneces a este match" |
| 404 | "Match no encontrado" |

---

### `POST /api/messages/:matchId`

Enviar un mensaje (fallback HTTP, normalmente se usa Socket.io).

**Request Body:**
```json
{
  "content": "¡Hola! ¿Cómo estás?"
}
```

**Validaciones:**
| Campo | Regla |
|-------|-------|
| content | Requerido, 1-1000 chars, trimmed |

**Response 201:**
```json
{
  "message": {
    "_id": "665f...",
    "match": "665c...",
    "sender": "665a...",
    "content": "¡Hola! ¿Cómo estás?",
    "readAt": null,
    "createdAt": "2026-04-24T16:00:00.000Z"
  }
}
```

---

## Códigos de Error Globales

| Código | Significado | Cuándo |
|--------|-------------|--------|
| 400 | Bad Request | Validación fallida, datos incorrectos |
| 401 | Unauthorized | Token faltante, inválido o expirado |
| 403 | Forbidden | No tienes permiso para esta acción |
| 404 | Not Found | Recurso no existe |
| 409 | Conflict | Duplicado (email, like repetido) |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Error no controlado |

### Formato de Error Estándar
```json
{
  "error": "Mensaje descriptivo del error"
}
```

Para errores de validación:
```json
{
  "error": "Error de validación",
  "details": [
    { "field": "email", "message": "Email no válido" },
    { "field": "password", "message": "Mínimo 6 caracteres" }
  ]
}
```
