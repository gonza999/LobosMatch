# TinderApp — Guía de Setup y Desarrollo

## Requisitos Previos

| Herramienta | Versión mínima | Uso |
|-------------|---------------|-----|
| Node.js | 20 LTS | Runtime backend y herramientas frontend |
| npm | 10+ | Gestión de paquetes |
| MongoDB | 7.0 | Base de datos (local o Atlas) |
| Git | 2.40+ | Control de versiones |
| Android Studio | Hedgehog+ | Emulador Android + SDK |
| JDK | 17 | Compilación Android |
| VS Code | 1.85+ | Editor recomendado |

### Extensiones VS Code Recomendadas
- ESLint
- Prettier
- React Native Tools
- MongoDB for VS Code
- Thunder Client (pruebas API)

---

## Setup Paso a Paso

### 1. Backend

```bash
cd backend
cp .env.example .env
# Editar .env con tus valores (ver Readme.md raíz para variables)
npm install
npm run dev
```

El servidor arranca en `http://localhost:5000`. Verifica con:
```bash
curl http://localhost:5000/api/health
# Respuesta esperada: { "status": "ok", "timestamp": "..." }
```

### 2. Frontend

```bash
cd frontend
npm install
```

#### Android
```bash
# Asegurar que un emulador esté corriendo o un dispositivo conectado
npm run android
```

#### Web
```bash
npm run web
# Abre http://localhost:3000
```

#### Desktop (Electron)
```bash
npm run electron
```

---

## Scripts Disponibles

### Backend (`/backend/package.json`)

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `nodemon src/server.js` | Servidor con hot-reload |
| `start` | `node src/server.js` | Servidor producción |
| `test` | `jest --coverage` | Tests con cobertura |
| `test:watch` | `jest --watch` | Tests en modo watch |
| `lint` | `eslint src/` | Linting |
| `seed` | `node src/utils/seed.js` | Poblar DB con datos de prueba |

### Frontend (`/frontend/package.json`)

| Script | Comando | Descripción |
|--------|---------|-------------|
| `start` | `react-native start` | Metro bundler |
| `android` | `react-native run-android` | Compilar y correr en Android |
| `web` | `react-scripts start` | Versión web |
| `electron` | `electron .` | Versión desktop |
| `test` | `jest` | Tests |
| `lint` | `eslint src/` | Linting |

---

## Estructura de Carpetas

```
App/
├── backend/          # API REST + WebSocket server
│   ├── src/
│   │   ├── app.js          # Express config (middleware, routes)
│   │   ├── server.js        # Entry point (HTTP + Socket.io)
│   │   ├── config/          # DB, Cloudinary, Socket config
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/       # Auth, validation, upload, rate-limit
│   │   ├── validators/      # Joi schemas
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helpers, error classes
│   └── tests/               # Jest + Supertest
├── frontend/         # React Native multiplataforma
│   ├── src/
│   │   ├── navigation/      # React Navigation stacks
│   │   ├── screens/         # Pantallas organizadas por feature
│   │   ├── components/      # Componentes reutilizables
│   │   ├── store/           # Zustand stores
│   │   ├── services/        # API calls + Socket client
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Helpers, constantes
│   │   └── theme/           # Colores, tipografía, spacing
│   └── __tests__/
└── docs/             # Documentación técnica completa
```

---

## Flujo de Desarrollo

1. Crear rama desde `main`: `git checkout -b feature/nombre-feature`
2. Desarrollar siguiendo las especificaciones en `/docs`
3. Escribir tests para la funcionalidad nueva
4. Ejecutar linting y tests: `npm run lint && npm test`
5. Commit con mensaje descriptivo: `git commit -m "feat: descripción"`
6. Push y crear Pull Request

### Convención de Commits
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Formato (no afecta lógica)
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Tareas de mantenimiento

---

## Documentación Técnica

Ver [docs/README.md](docs/README.md) para el índice completo de especificaciones.