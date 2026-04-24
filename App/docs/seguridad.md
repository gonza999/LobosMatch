# Seguridad — TinderApp

Medidas de seguridad implementadas en el proyecto, alineadas con OWASP Top 10.

---

## 1. Autenticación y Gestión de Sesiones

### JWT Dual Token
```
Access Token:
  - Duración: 15 minutos
  - Se envía en header: Authorization: Bearer <token>
  - Contiene: { userId, email, iat, exp }
  - NO se almacena en backend

Refresh Token:
  - Duración: 7 días
  - Se almacena en AsyncStorage (mobile) / httpOnly cookie (web)
  - Se almacena hasheado en DB (campo User.refreshToken)
  - Se rota en cada uso (el viejo se invalida)
```

### Flujo de Refresh
1. Access token expira → API devuelve 401
2. Axios interceptor detecta 401, llama `POST /api/auth/refresh`
3. Backend valida refresh token contra hash en DB
4. Si válido → genera nuevo par de tokens, invalida el anterior
5. Si inválido → 401, forzar logout

### Protección de Contraseñas
- Hash con bcryptjs, salt rounds: 12
- Nunca se almacena en texto plano
- Campo `password` tiene `select: false` en Mongoose (no se incluye en queries)
- Validación: mínimo 6 caracteres, al menos 1 número

---

## 2. Protección contra Ataques Comunes (OWASP)

### A01 — Broken Access Control
- Cada endpoint protegido verifica JWT en middleware
- Los usuarios solo pueden modificar sus propios datos
- Verificación de pertenencia a match antes de acceder a mensajes
- No se exponen IDs internos sensibles en respuestas

### A02 — Cryptographic Failures
- Contraseñas hasheadas con bcrypt (12 rounds)
- JWT firmado con secreto fuerte (min 256 bits)
- HTTPS obligatorio en producción
- Refresh tokens almacenados hasheados en DB

### A03 — Injection
- Mongoose con schemas tipados previene NoSQL injection
- Validación con Joi en todas las entradas del usuario
- Sanitización de strings (trim, escape)
- No se usan queries raw de MongoDB

### A04 — Insecure Design
- Rate limiting en endpoints sensibles
- Límite diario de likes (100) y super likes (1)
- Confirmación textual para eliminación de cuenta
- Bloqueo bidireccional inmediato

### A05 — Security Misconfiguration
- Helmet.js para headers de seguridad
- CORS restringido al dominio del frontend
- Variables sensibles en `.env` (nunca en código)
- `.env` en `.gitignore`

### A06 — Vulnerable and Outdated Components
- Auditoría periódica con `npm audit`
- Dependencias con versiones fijadas en package-lock.json
- CI/CD ejecuta `npm audit` en cada push

### A07 — Identification and Authentication Failures
- Rate limit en login: 5 intentos por 15 minutos por IP
- Rate limit en registro: 3 cuentas por IP por hora
- No se revela si un email existe en error de login ("Credenciales inválidas" genérico)
- Tokens con expiración corta (15min access, 7d refresh)

### A08 — Software and Data Integrity Failures
- JWT verificado con secreto del servidor (no confianza ciega)
- Validación de tipo de archivo en uploads (solo JPG/PNG/WebP)
- Límite de tamaño de upload (5MB)

### A09 — Security Logging and Monitoring Failures
- Morgan para logging de requests HTTP
- Logs de errores con stack trace (solo en desarrollo)
- Log de intentos de login fallidos
- Log de acciones sensibles (eliminar cuenta, bloquear)

### A10 — Server-Side Request Forgery (SSRF)
- No se procesan URLs proporcionadas por el usuario
- Las imágenes se suben directamente a Cloudinary (no se descargan de URLs externas)

---

## 3. Rate Limiting

```javascript
// Configuración de rate limiting
const rateLimits = {
  // Global: todas las rutas
  global: {
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 100                     // 100 requests por ventana
  },
  // Login: más restrictivo
  login: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos de login. Intenta en 15 minutos.'
  },
  // Registro: prevenir spam
  register: {
    windowMs: 60 * 60 * 1000,   // 1 hora
    max: 3,
    message: 'Demasiados registros desde esta IP.'
  },
  // Upload de fotos
  upload: {
    windowMs: 60 * 60 * 1000,
    max: 20
  },
  // Likes (además del límite diario por usuario)
  likes: {
    windowMs: 60 * 1000,        // 1 minuto
    max: 30                      // Anti-bot: no más de 30 swipes/min
  }
};
```

---

## 4. Validación de Datos

### Backend (Joi)
```javascript
// Ejemplo: schema de registro
const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).pattern(/\d/).required()
    .messages({ 'string.pattern.base': 'Debe contener al menos un número' }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Las contraseñas no coinciden' }),
  birthDate: Joi.date().max('now').required(),
  gender: Joi.string().valid('hombre', 'mujer', 'otro').required(),
  genderPreference: Joi.array().items(
    Joi.string().valid('hombre', 'mujer', 'otro')
  ).min(1).required()
});

// Middleware de validación
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const details = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    }));
    return res.status(400).json({ error: 'Error de validación', details });
  }
  next();
};
```

### Frontend (Yup)
```javascript
// Ejemplo: schema de login
const loginSchema = Yup.object({
  email: Yup.string()
    .email('Email no válido')
    .required('Email requerido'),
  password: Yup.string()
    .min(6, 'Mínimo 6 caracteres')
    .required('Contraseña requerida')
});
```

---

## 5. Upload de Archivos

```javascript
// Configuración segura de Multer
const upload = multer({
  storage: cloudinaryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB
    files: 1                     // 1 archivo por request
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Formato no soportado'), false);
    }
    cb(null, true);
  }
});
```

**Protecciones:**
- Solo tipos MIME permitidos (JPG, PNG, WebP)
- Límite de tamaño: 5MB
- Un archivo por request
- Cloudinary maneja el almacenamiento (no se guarda en servidor)
- Los publicIds de Cloudinary son generados automáticamente (no controlados por el usuario)

---

## 6. Protección de Datos Personales

### Datos sensibles
- Contraseñas: nunca expuestas, hasheadas en DB
- Email: solo visible para el propio usuario
- Ubicación exacta: solo se muestra distancia relativa a otros usuarios
- Refresh tokens: hasheados en DB, httpOnly cookie en web

### Datos expuestos a otros usuarios
Solo se expone lo necesario para la funcionalidad:
- Nombre
- Edad (calculada, no fecha de nacimiento)
- Bio
- Fotos
- Intereses
- Distancia relativa (no coordenadas)

### Eliminación de datos
- Al eliminar cuenta: soft delete inmediato (isActive: false)
- Hard delete de datos personales tras 30 días
- Fotos eliminadas de Cloudinary
- Mensajes anonimizados (sender: null)

---

## 7. Headers de Seguridad (Helmet)

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "https://res.cloudinary.com"],
      connectSrc: ["'self'", process.env.CLIENT_URL]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
```

---

## 8. CORS

```javascript
app.use(cors({
  origin: process.env.CLIENT_URL,  // Solo el frontend autorizado
  credentials: true,                // Permitir cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 9. Checklist de Seguridad Pre-Deploy

- [ ] Variables sensibles en `.env`, no en código
- [ ] `.env` en `.gitignore`
- [ ] JWT_SECRET con al menos 256 bits de entropía
- [ ] HTTPS habilitado
- [ ] CORS restringido al dominio correcto
- [ ] Rate limiting configurado
- [ ] Helmet activado
- [ ] `npm audit` sin vulnerabilidades críticas
- [ ] Contraseñas hasheadas con bcrypt (12+ rounds)
- [ ] No se expone stack trace en producción
- [ ] Logs de acciones sensibles habilitados
- [ ] Validación Joi en todos los endpoints
- [ ] Upload limitado a tipos y tamaños seguros
