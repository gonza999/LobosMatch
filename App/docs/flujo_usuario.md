# Flujos de Usuario — TinderApp

## 1. Flujo Principal (Overview)

```mermaid
flowchart TD
    A[Abrir App] --> B{¿Token guardado?}
    B -- No --> C[Pantalla Login]
    B -- Sí --> D{¿Token válido?}
    D -- No --> C
    D -- Sí --> E[Obtener ubicación GPS]
    E --> F[Actualizar ubicación en backend]
    F --> G[Conectar Socket.io]
    G --> H[Pantalla Principal<br/>Bottom Tabs]

    C --> C1[Login con email/pass]
    C --> C2[Ir a Registro]
    C1 --> I{¿Credenciales OK?}
    I -- No --> C
    I -- Sí --> E

    C2 --> J[Flujo de Registro<br/>ver sección 2]
    J --> E
```

---

## 2. Flujo de Registro

```mermaid
flowchart TD
    A[Pantalla Registro] --> B[Paso 1: Datos Básicos]
    B --> B1[Nombre completo]
    B --> B2[Email]
    B --> B3[Contraseña + Confirmar]
    B --> B4[Fecha de nacimiento]
    B --> B5[Género]
    B1 & B2 & B3 & B4 & B5 --> C{¿Validación OK?}
    C -- No --> B
    C -- Sí --> D[Paso 2: Fotos]
    D --> D1[Subir mínimo 1 foto<br/>máximo 6]
    D1 --> D2{¿Al menos 1 foto?}
    D2 -- No --> D
    D2 -- Sí --> E[Paso 3: Perfil]
    E --> E1[Bio / Descripción<br/>máx 500 chars]
    E --> E2[Intereses<br/>seleccionar tags]
    E --> E3[Preferencia de género<br/>a quién buscar]
    E1 & E2 & E3 --> F[Paso 4: Ubicación]
    F --> F1{¿Permiso GPS?}
    F1 -- Sí --> F2[Capturar coordenadas]
    F1 -- No --> F3[Solicitar permiso<br/>explicar por qué]
    F3 --> F1
    F2 --> G[Enviar registro al backend]
    G --> H{¿Registro OK?}
    H -- No --> I[Mostrar error<br/>email duplicado, etc.]
    I --> B
    H -- Sí --> J[Guardar tokens]
    J --> K[Ir a Pantalla Principal]
```

### Validaciones del Registro
| Campo | Regla | Mensaje de error |
|-------|-------|-----------------|
| Nombre | 2-50 caracteres, solo letras y espacios | "Nombre debe tener entre 2 y 50 caracteres" |
| Email | Formato email válido | "Email no válido" |
| Contraseña | Mínimo 6 caracteres, al menos 1 número | "Contraseña debe tener al menos 6 caracteres y 1 número" |
| Confirmar | Debe coincidir con contraseña | "Las contraseñas no coinciden" |
| Fecha nacimiento | Edad ≥ 18 años | "Debes ser mayor de 18 años" |
| Género | Obligatorio (hombre/mujer/otro) | "Selecciona tu género" |
| Foto | Mínimo 1, máx 5MB, JPG/PNG/WebP | "Sube al menos una foto" |

---

## 3. Flujo de Exploración (Swipe)

```mermaid
flowchart TD
    A[Tab Explorar] --> B[Cargar feed<br/>GET /api/explore]
    B --> C{¿Hay usuarios?}
    C -- No --> D[Pantalla vacía<br/>'No hay más personas<br/>en tu zona']
    C -- Sí --> E[Mostrar stack de<br/>SwipeCards]
    E --> F{Acción del usuario}
    F -->|Swipe izquierda| G[Dislike]
    F -->|Swipe derecha| H[Like]
    F -->|Swipe arriba| I[Super Like]
    F -->|Tap botón ✕| G
    F -->|Tap botón ♥| H
    F -->|Tap botón ★| I

    G --> G1[POST /api/matches/dislike/:id]
    G1 --> G2[Remover tarjeta<br/>con animación]
    G2 --> J

    H --> H1{¿Likes restantes > 0?}
    H1 -- No --> H2[Mostrar mensaje<br/>'Límite diario alcanzado']
    H1 -- Sí --> H3[POST /api/matches/like/:id]
    H3 --> H4{¿Match?}
    H4 -- Sí --> H5[Animación Match!<br/>Mostrar overlay con<br/>foto del otro usuario]
    H5 --> H6[Botón: 'Enviar mensaje'<br/>o 'Seguir explorando']
    H6 -->|Mensaje| H7[Ir a ChatScreen]
    H6 -->|Seguir| J
    H4 -- No --> H8[Remover tarjeta<br/>con animación]
    H8 --> J

    I --> I1{¿Super Like disponible?}
    I1 -- No --> I2[Mostrar mensaje<br/>'Ya usaste tu Super Like hoy']
    I1 -- Sí --> I3[POST /api/matches/superlike/:id]
    I3 --> I4{¿Match?}
    I4 -- Sí --> H5
    I4 -- No --> I5[Remover tarjeta<br/>con animación especial ★]
    I5 --> J

    J{¿Más tarjetas en stack?}
    J -- Sí --> E
    J -- No --> K[Cargar más<br/>GET /api/explore?page=next]
    K --> C
```

### Detalles de la Tarjeta Expandida
- Tap en la tarjeta → se expande a pantalla completa
- Muestra: todas las fotos (swipeable), nombre, edad, distancia, bio completa, intereses
- Botones de acción (like/dislike/superlike) disponibles también en vista expandida
- Swipe down o botón X para cerrar

---

## 4. Flujo de Chat

```mermaid
flowchart TD
    A[Tab Chat] --> B[Cargar lista de<br/>conversaciones]
    B --> C[Mostrar ChatListScreen<br/>ordenado por último msg]

    C --> D[Tap en conversación]
    D --> E[ChatScreen]
    E --> F[Cargar mensajes<br/>GET /api/messages/:matchId]
    E --> G[Unirse a room Socket<br/>emit 'join' matchId]

    F --> H[Mostrar mensajes<br/>scroll al último]

    H --> I{Acción del usuario}
    I -->|Escribir| J[Mostrar indicador<br/>emit 'typing']
    I -->|Enviar| K[emit 'sendMessage'<br/>via Socket.io]
    I -->|Scroll arriba| L[Cargar mensajes<br/>anteriores paginado]
    I -->|Volver| M[emit 'leave' room<br/>Volver a ChatList]

    K --> N[Servidor guarda en DB]
    N --> O[Servidor emite<br/>'newMessage' a room]
    O --> P[Mensaje aparece<br/>en ambos clientes]

    subgraph Eventos Recibidos
      Q[newMessage] --> P
      R[userTyping] --> S[Mostrar '...' escribiendo]
      T[messageRead] --> U[Actualizar ✓✓ azul]
    end
```

### Estados de Mensajes
| Estado | Indicador | Descripción |
|--------|-----------|-------------|
| Enviando | ○ (reloj) | Mensaje en tránsito |
| Enviado | ✓ | Guardado en servidor |
| Leído | ✓✓ | Destinatario abrió el chat |

---

## 5. Flujo de Edición de Perfil

```mermaid
flowchart TD
    A[Tab Perfil] --> B[ProfileScreen<br/>ver datos actuales]
    B --> C[Tap 'Editar Perfil']
    C --> D[EditProfileScreen]

    D --> E[Sección Fotos]
    E --> E1[Tap foto existente<br/>→ Eliminar o Reordenar]
    E --> E2[Tap slot vacío<br/>→ Abrir galería/cámara]
    E2 --> E3[Seleccionar imagen]
    E3 --> E4[Upload a Cloudinary]
    E4 --> E5[Actualizar array fotos]

    D --> F[Sección Bio]
    F --> F1[Editar texto<br/>máx 500 chars]
    F --> F2[Contador de caracteres]

    D --> G[Sección Intereses]
    G --> G1[Tags predefinidos<br/>tap para toggle]
    G --> G2[Añadir custom tag]

    D --> H[Botón Guardar]
    H --> I[PUT /api/users/me]
    I --> J{¿OK?}
    J -- Sí --> K[Volver a ProfileScreen<br/>datos actualizados]
    J -- No --> L[Mostrar error]
```

---

## 6. Flujo de Configuración

```mermaid
flowchart TD
    A[ProfileScreen] --> B[Tap 'Configuración']
    B --> C[SettingsScreen]

    C --> D[Rango de Edad<br/>Slider dual 18-99]
    C --> E[Distancia Máxima<br/>Slider 1-50 km]
    C --> F[Mostrar: Hombres /<br/>Mujeres / Todos]
    C --> G[Mostrar mi perfil<br/>Toggle on/off]
    C --> H[Cerrar Sesión]
    C --> I[Eliminar Cuenta]

    D & E & F & G --> J[Guardar automático<br/>PUT /api/users/me/settings]

    H --> K{¿Confirmar?}
    K -- Sí --> L[Limpiar tokens<br/>Desconectar socket]
    L --> M[Ir a LoginScreen]

    I --> N{¿Confirmar?<br/>Escribir 'ELIMINAR'}
    N -- Sí --> O[DELETE /api/users/me]
    O --> M
```

---

## 7. Flujo de Reportar / Bloquear

```mermaid
flowchart TD
    A[ChatScreen o<br/>Perfil expandido] --> B[Tap menú ⋮]
    B --> C[Opciones:<br/>Reportar / Bloquear / Deshacer match]

    C -->|Reportar| D[Seleccionar razón<br/>Spam, Acoso, Perfil falso,<br/>Contenido inapropiado, Otro]
    D --> E[Descripción opcional]
    E --> F[POST /api/users/report]
    F --> G[Confirmación:<br/>'Reporte enviado']

    C -->|Bloquear| H{¿Confirmar bloqueo?}
    H -- Sí --> I[POST /api/users/block/:userId]
    I --> J[Usuario bloqueado<br/>bidireccional]
    J --> K[Deshacer match si existe]
    K --> L[Volver a pantalla anterior]

    C -->|Deshacer match| M{¿Confirmar?}
    M -- Sí --> N[DELETE /api/matches/:matchId]
    N --> O[Chat eliminado<br/>Volver a lista]
```

---

## 8. Flujo de Autenticación (Token Refresh)

```mermaid
sequenceDiagram
    participant App as Frontend App
    participant Store as useAuthStore
    participant API as Axios Instance
    participant Backend as Express Server

    Note over App: Petición normal (ej: cargar feed)
    App->>API: GET /api/explore
    API->>API: Interceptor añade Bearer token
    API->>Backend: Request
    Backend-->>API: 401 Unauthorized (token expirado)

    API->>API: Response interceptor detecta 401
    API->>Store: refreshAuth()
    Store->>API: POST /api/auth/refresh
    API->>Backend: { refreshToken }
    Backend-->>API: { accessToken, refreshToken }
    Store->>Store: Guardar nuevos tokens

    API->>Backend: Retry GET /api/explore (nuevo token)
    Backend-->>API: 200 OK { users: [...] }
    API-->>App: Datos recibidos

    Note over App: Si refresh también falla → logout
```
