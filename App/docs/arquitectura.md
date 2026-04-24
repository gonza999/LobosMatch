# Arquitectura del Sistema — TinderApp

## Visión General

Arquitectura cliente-servidor con API REST para operaciones CRUD y WebSocket (Socket.io) para comunicación en tiempo real. El frontend es una SPA multiplataforma con React Native.

---

## Diagrama de Arquitectura General

```mermaid
graph TD
  subgraph Clientes
    A1[Android<br/>React Native]
    A2[Web<br/>React Native Web]
    A3[Desktop<br/>Electron + RN Web]
  end

  subgraph API Gateway
    B0[Express Server<br/>:5000]
  end

  subgraph Middleware Layer
    M1[Helmet<br/>Security Headers]
    M2[CORS]
    M3[Rate Limiter<br/>100 req/15min]
    M4[JWT Auth<br/>Middleware]
    M5[Joi Validation]
    M6[Multer Upload]
  end

  subgraph REST API
    R1[Auth Routes<br/>/api/auth]
    R2[User Routes<br/>/api/users]
    R3[Explore Routes<br/>/api/explore]
    R4[Match Routes<br/>/api/matches]
    R5[Message Routes<br/>/api/messages]
  end

  subgraph WebSocket Server
    WS[Socket.io Server<br/>JWT Auth Handshake]
    WS1[Chat Rooms<br/>por matchId]
    WS2[Match Notifications<br/>push en tiempo real]
  end

  subgraph Business Logic
    S1[Auth Service<br/>hash, tokens, verify]
    S2[Explore Service<br/>query geoespacial]
    S3[Match Service<br/>likes, matches]
    S4[Chat Service<br/>mensajes, socket events]
  end

  subgraph Data Layer
    DB[(MongoDB 7<br/>Mongoose 8)]
    IDX1[Índice 2dsphere<br/>location]
    IDX2[Índice compuesto<br/>likes: fromUser+toUser]
    IDX3[Índice compuesto<br/>messages: match+createdAt]
  end

  subgraph External Services
    CL[Cloudinary<br/>Fotos CDN]
  end

  A1 -->|HTTPS + WSS| B0
  A2 -->|HTTPS + WSS| B0
  A3 -->|HTTPS + WSS| B0

  B0 --> M1 --> M2 --> M3

  M3 --> R1
  M3 --> M4
  M4 --> M5
  M5 --> R2
  M5 --> R3
  M5 --> R4
  M5 --> R5

  M4 --> M6
  M6 --> CL

  B0 --> WS
  WS --> WS1
  WS --> WS2

  R1 --> S1
  R2 --> S1
  R3 --> S2
  R4 --> S3
  R5 --> S4
  WS1 --> S4
  WS2 --> S3

  S1 --> DB
  S2 --> DB
  S3 --> DB
  S4 --> DB

  DB --> IDX1
  DB --> IDX2
  DB --> IDX3
```

---

## Diagrama de Componentes del Frontend

```mermaid
graph TD
  subgraph App Entry
    APP[App.js]
    NAV[AppNavigator]
  end

  subgraph Navigation
    AUTH_NAV[AuthNavigator<br/>Stack]
    MAIN_NAV[MainNavigator<br/>Bottom Tabs]
  end

  subgraph Screens
    LOGIN[LoginScreen]
    REGISTER[RegisterScreen]
    EXPLORE[ExploreScreen]
    MATCHES[MatchesScreen]
    CHATLIST[ChatListScreen]
    CHAT[ChatScreen]
    PROFILE[ProfileScreen]
    EDIT[EditProfileScreen]
    SETTINGS[SettingsScreen]
  end

  subgraph State Management
    AUTH_STORE[useAuthStore<br/>token, user, login/logout]
    USER_STORE[useUserStore<br/>profile, photos, settings]
    MATCH_STORE[useMatchStore<br/>feed, matches, likes]
    CHAT_STORE[useChatStore<br/>messages, typing, unread]
  end

  subgraph Services
    API[api.js<br/>Axios + interceptors]
    SOCKET[socket.service.js<br/>Socket.io client]
    AUTH_SVC[auth.service.js]
    USER_SVC[user.service.js]
    MATCH_SVC[match.service.js]
    CHAT_SVC[chat.service.js]
  end

  APP --> NAV
  NAV -->|no auth| AUTH_NAV
  NAV -->|auth| MAIN_NAV

  AUTH_NAV --> LOGIN
  AUTH_NAV --> REGISTER
  MAIN_NAV --> EXPLORE
  MAIN_NAV --> MATCHES
  MAIN_NAV --> CHATLIST
  CHATLIST --> CHAT
  MAIN_NAV --> PROFILE
  PROFILE --> EDIT
  PROFILE --> SETTINGS

  LOGIN --> AUTH_STORE
  REGISTER --> AUTH_STORE
  EXPLORE --> MATCH_STORE
  MATCHES --> MATCH_STORE
  CHAT --> CHAT_STORE
  PROFILE --> USER_STORE

  AUTH_STORE --> AUTH_SVC --> API
  USER_STORE --> USER_SVC --> API
  MATCH_STORE --> MATCH_SVC --> API
  CHAT_STORE --> CHAT_SVC --> SOCKET

  API -->|HTTP| B0[Backend :5000]
  SOCKET -->|WebSocket| B0
```

---

## Flujo de Datos

### Request HTTP (ejemplo: dar Like)

```mermaid
sequenceDiagram
  participant U as Usuario
  participant UI as ExploreScreen
  participant Store as useMatchStore
  participant SVC as match.service
  participant API as Axios Instance
  participant MW as Auth Middleware
  participant CTRL as match.controller
  participant BL as match.service (backend)
  participant DB as MongoDB

  U->>UI: Swipe derecha
  UI->>Store: like(userId)
  Store->>SVC: like(userId)
  SVC->>API: POST /api/matches/like/:userId
  API->>API: Interceptor añade Bearer token
  API->>MW: Request con JWT
  MW->>MW: Verificar token
  MW->>CTRL: req.user adjuntado
  CTRL->>BL: processLike(fromUser, toUser)
  BL->>DB: Crear Like document
  BL->>DB: Buscar Like inverso (toUser→fromUser)
  alt Match encontrado
    BL->>DB: Crear Match document
    BL-->>CTRL: { matched: true, match }
    CTRL-->>API: 200 { matched: true, match }
    Note over API: Socket.io emite 'newMatch' a ambos
  else No match
    BL-->>CTRL: { matched: false }
    CTRL-->>API: 200 { matched: false }
  end
  API-->>Store: response.data
  Store->>Store: Actualizar feed (remover usuario)
  Store-->>UI: Re-render
  UI-->>U: Siguiente tarjeta (o animación match)
```

### WebSocket (Chat en tiempo real)

```mermaid
sequenceDiagram
  participant UA as Usuario A
  participant CA as ChatScreen A
  participant SA as Socket Client A
  participant SRV as Socket.io Server
  participant SB as Socket Client B
  participant CB as ChatScreen B
  participant UB as Usuario B

  UA->>CA: Escribe mensaje
  CA->>SA: emit('sendMessage', {matchId, content})
  SA->>SRV: sendMessage event
  SRV->>SRV: Validar auth + pertenencia al match
  SRV->>SRV: Guardar mensaje en MongoDB
  SRV->>SA: emit('newMessage', {message})
  SRV->>SB: emit('newMessage', {message})
  SA->>CA: addMessage() en store
  SB->>CB: addMessage() en store
  CA-->>UA: Mensaje aparece (burbuja azul)
  CB-->>UB: Mensaje aparece (burbuja gris) + sonido
```

---

## Patrones de Diseño Utilizados

| Patrón | Dónde | Propósito |
|--------|-------|-----------|
| **Repository** | Services (backend) | Abstracción de acceso a datos |
| **Middleware Chain** | Express middleware | Procesamiento pipeline de requests |
| **Observer** | Socket.io events | Notificaciones en tiempo real |
| **Singleton** | Socket client (frontend) | Una conexión WebSocket por app |
| **Store** | Zustand stores | Estado centralizado por dominio |
| **Interceptor** | Axios interceptors | Auth automática y refresh tokens |
| **Strategy** | Validators (Joi schemas) | Validación declarativa intercambiable |

---

## Decisiones de Arquitectura

### ¿Por qué MongoDB y no PostgreSQL?
- Datos de perfil semi-estructurados (fotos, intereses, settings varían)
- Soporte nativo de índices geoespaciales (`2dsphere`) para queries de proximidad
- Esquemas flexibles con Mongoose para evolución rápida
- Mejor fit para el patrón de acceso (lectura frecuente de perfiles completos)

### ¿Por qué Socket.io y no WebSocket nativo?
- Rooms nativas (una por match = un chat room)
- Reconnect automático con backoff exponencial
- Fallback a long-polling si WebSocket no está disponible
- Middleware de autenticación integrado
- Broadcasting a rooms simplifica el chat

### ¿Por qué Zustand y no Redux?
- Mucho menos boilerplate
- No necesita providers ni wrappers
- API simple con hooks nativos
- Suficiente para el tamaño de esta app
- Suscripción selectiva a slices de estado

### ¿Por qué Cloudinary y no almacenamiento propio?
- CDN global incluido
- Transformaciones de imagen on-the-fly (resize, crop, optimización)
- No gestionar almacenamiento propio
- Free tier generoso (25 créditos/mes)
