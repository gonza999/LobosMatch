
# TinderApp Local

App de citas multiplataforma (Android, Web, PC) para conectar personas dentro de una localidad específica.

---

## Stack Tecnológico (Decisiones Finales)

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Frontend mobile** | React Native 0.76+ | Código compartido Android/iOS |
| **Frontend web** | React Native Web | Reutiliza componentes de RN |
| **Frontend desktop** | Electron + React Native Web | Empaquetado desktop nativo |
| **Backend** | Node.js 20 LTS + Express 4 | Ecosistema JS unificado, rendimiento async |
| **Base de datos** | MongoDB 7 + Mongoose 8 | Esquemas flexibles, geospatial nativo |
| **Autenticación** | JWT (access + refresh tokens) + bcryptjs | Stateless, escalable |
| **Chat real-time** | Socket.io 4 | WebSocket con fallback, rooms nativas |
| **Almacenamiento fotos** | Cloudinary | CDN integrado, transformaciones |
| **Geolocalización** | MongoDB 2dsphere + API Geolocation del navegador/dispositivo | Sin dependencia de Google Maps |
| **Validación** | Joi (backend) + Yup (frontend) | Esquemas declarativos |
| **Estado frontend** | Zustand | Ligero, sin boilerplate |
| **Navegación** | React Navigation 6 | Multiplataforma |
| **Testing** | Jest + Supertest (backend), Jest + React Native Testing Library (frontend) | |
| **CI/CD** | GitHub Actions | |
| **Deploy backend** | Railway / Render | Free tier, fácil setup |
| **Deploy web** | Vercel | Optimizado para React |

---

## Estructura del Proyecto

```
TinderApp/
├── Readme.md                    # Este archivo
├── App/
│   ├── README.md                # Guía de setup y desarrollo
│   ├── backend/
│   │   ├── README.md            # Especificación del backend
│   │   ├── package.json
│   │   ├── .env.example
│   │   ├── src/
│   │   │   ├── app.js           # Configuración Express
│   │   │   ├── server.js        # Entry point + Socket.io
│   │   │   ├── config/
│   │   │   │   ├── db.js        # Conexión MongoDB
│   │   │   │   ├── cloudinary.js
│   │   │   │   └── socket.js    # Config Socket.io
│   │   │   ├── models/
│   │   │   │   ├── User.js
│   │   │   │   ├── Match.js
│   │   │   │   ├── Message.js
│   │   │   │   └── Like.js
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── user.routes.js
│   │   │   │   ├── match.routes.js
│   │   │   │   ├── message.routes.js
│   │   │   │   └── explore.routes.js
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── user.controller.js
│   │   │   │   ├── match.controller.js
│   │   │   │   ├── message.controller.js
│   │   │   │   └── explore.controller.js
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.js
│   │   │   │   ├── upload.middleware.js
│   │   │   │   ├── validate.middleware.js
│   │   │   │   └── rateLimiter.middleware.js
│   │   │   ├── validators/
│   │   │   │   ├── auth.validator.js
│   │   │   │   └── user.validator.js
│   │   │   ├── services/
│   │   │   │   ├── auth.service.js
│   │   │   │   ├── match.service.js
│   │   │   │   ├── explore.service.js
│   │   │   │   └── chat.service.js
│   │   │   └── utils/
│   │   │       ├── errors.js
│   │   │       └── helpers.js
│   │   └── tests/
│   │       ├── auth.test.js
│   │       ├── user.test.js
│   │       ├── match.test.js
│   │       └── explore.test.js
│   ├── frontend/
│   │   ├── README.md            # Especificación del frontend
│   │   ├── package.json
│   │   ├── app.json
│   │   ├── babel.config.js
│   │   ├── metro.config.js
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── src/
│   │   │   ├── navigation/
│   │   │   │   ├── AppNavigator.js
│   │   │   │   ├── AuthNavigator.js
│   │   │   │   └── MainNavigator.js
│   │   │   ├── screens/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginScreen.js
│   │   │   │   │   ├── RegisterScreen.js
│   │   │   │   │   └── ForgotPasswordScreen.js
│   │   │   │   ├── profile/
│   │   │   │   │   ├── ProfileScreen.js
│   │   │   │   │   ├── EditProfileScreen.js
│   │   │   │   │   └── SettingsScreen.js
│   │   │   │   ├── explore/
│   │   │   │   │   └── ExploreScreen.js
│   │   │   │   ├── matches/
│   │   │   │   │   └── MatchesScreen.js
│   │   │   │   └── chat/
│   │   │   │       ├── ChatListScreen.js
│   │   │   │       └── ChatScreen.js
│   │   │   ├── components/
│   │   │   │   ├── common/
│   │   │   │   │   ├── Button.js
│   │   │   │   │   ├── Input.js
│   │   │   │   │   ├── Avatar.js
│   │   │   │   │   └── Loading.js
│   │   │   │   ├── cards/
│   │   │   │   │   ├── SwipeCard.js
│   │   │   │   │   └── MatchCard.js
│   │   │   │   └── chat/
│   │   │   │       ├── MessageBubble.js
│   │   │   │       └── ChatInput.js
│   │   │   ├── store/
│   │   │   │   ├── useAuthStore.js
│   │   │   │   ├── useUserStore.js
│   │   │   │   ├── useMatchStore.js
│   │   │   │   └── useChatStore.js
│   │   │   ├── services/
│   │   │   │   ├── api.js          # Axios instance
│   │   │   │   ├── auth.service.js
│   │   │   │   ├── user.service.js
│   │   │   │   ├── match.service.js
│   │   │   │   ├── chat.service.js
│   │   │   │   └── socket.service.js
│   │   │   ├── hooks/
│   │   │   │   ├── useLocation.js
│   │   │   │   ├── useSocket.js
│   │   │   │   └── useSwipe.js
│   │   │   ├── utils/
│   │   │   │   ├── constants.js
│   │   │   │   ├── validators.js
│   │   │   │   └── helpers.js
│   │   │   └── theme/
│   │   │       ├── colors.js
│   │   │       ├── typography.js
│   │   │       └── spacing.js
│   │   └── __tests__/
│   └── docs/
│       ├── README.md             # Índice de documentación
│       ├── arquitectura.md       # Arquitectura del sistema
│       ├── flujo_usuario.md      # Flujos de usuario
│       ├── modelos_datos.md      # Esquemas de base de datos
│       ├── api_endpoints.md      # Especificación API REST
│       ├── pantallas_ui.md       # Especificación de pantallas
│       ├── seguridad.md          # Seguridad y privacidad
│       └── despliegue.md         # Guía de despliegue
```

---

## Características Principales

1. **Autenticación**: Registro con email/contraseña, login, refresh tokens, recuperación de contraseña
2. **Perfil**: Hasta 6 fotos, bio, edad, género, intereses, verificación de perfil
3. **Exploración**: Swipe cards con usuarios filtrados por ubicación, edad y preferencias
4. **Matching**: Like/Dislike/Super Like, notificación instantánea de match
5. **Chat**: Mensajería en tiempo real vía WebSocket, indicador de escritura, estados de lectura
6. **Geolocalización**: Filtrado por radio configurable (1-50 km) usando índices geoespaciales de MongoDB
7. **Multiplataforma**: Una base de código para Android, Web y Desktop (Windows)

---

## Reglas de Negocio

- Edad mínima: 18 años (validado en registro)
- Radio de búsqueda: 1-50 km desde la ubicación del usuario
- Máximo de likes diarios: 100 (usuarios free)
- Super Likes diarios: 1 (usuarios free)
- Fotos: mínimo 1, máximo 6, tamaño máximo 5MB, formatos JPG/PNG/WebP
- Un match se crea cuando ambos usuarios se dan like mutuamente
- Un usuario puede deshacer el último swipe (1 vez por día, free)
- Los mensajes solo se pueden enviar entre usuarios con match activo
- Un usuario puede reportar/bloquear a otro; el bloqueo es inmediato y bidireccional
- Los perfiles inactivos por más de 30 días se ocultan de la exploración

---

## Quick Start

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd TinderApp/App

# 2. Backend
cd backend
cp .env.example .env          # Configurar variables
npm install
npm run dev                   # http://localhost:5000

# 3. Frontend (otra terminal)
cd frontend
npm install
npm start                     # Metro bundler
# En otra terminal:
npm run android               # Android
npm run web                   # Web (localhost:3000)
npm run electron              # Desktop
```

---

## Variables de Entorno (Backend)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tinderapp
JWT_SECRET=tu_secreto_jwt_super_seguro
JWT_REFRESH_SECRET=tu_secreto_refresh_super_seguro
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLIENT_URL=http://localhost:3000
```

---

## Documentación Detallada

Toda la especificación técnica está en [App/docs/](App/docs/README.md):

- [Arquitectura del Sistema](App/docs/arquitectura.md)
- [Flujos de Usuario](App/docs/flujo_usuario.md)
- [Modelos de Datos](App/docs/modelos_datos.md)
- [API Endpoints](App/docs/api_endpoints.md)
- [Pantallas y UI](App/docs/pantallas_ui.md)
- [Seguridad](App/docs/seguridad.md)
- [Despliegue](App/docs/despliegue.md)