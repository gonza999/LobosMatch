# Guía de Despliegue — TinderApp

---

## 1. Backend — Railway / Render

### Opción A: Railway

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Inicializar proyecto (desde /App/backend)
railway init

# 4. Agregar MongoDB plugin
railway add --plugin mongodb

# 5. Configurar variables de entorno
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=<secreto_seguro_256bits>
railway variables set JWT_REFRESH_SECRET=<secreto_seguro_256bits>
railway variables set JWT_EXPIRE=15m
railway variables set JWT_REFRESH_EXPIRE=7d
railway variables set CLOUDINARY_CLOUD_NAME=<valor>
railway variables set CLOUDINARY_API_KEY=<valor>
railway variables set CLOUDINARY_API_SECRET=<valor>
railway variables set CLIENT_URL=https://tinderapp.vercel.app

# 6. Deploy
railway up
```

### Opción B: Render

1. Crear cuenta en render.com
2. New → Web Service → conectar repositorio GitHub
3. Configurar:
   - **Root Directory**: `App/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Environment**: Node
4. Agregar variables de entorno (mismas que arriba)
5. Agregar MongoDB Atlas como base de datos externa

### MongoDB Atlas (producción)

```
1. Crear cuenta en mongodb.com/atlas
2. Crear cluster gratuito (M0 Sandbox)
3. Configurar Network Access: permitir IP del servidor (o 0.0.0.0/0 para inicio)
4. Crear usuario de base de datos
5. Obtener connection string:
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/tinderapp?retryWrites=true&w=majority
6. Configurar MONGODB_URI en variables de entorno del hosting
```

### Verificación Backend

```bash
# Health check
curl https://<tu-backend>.railway.app/api/health
# Esperado: { "status": "ok", "timestamp": "..." }
```

---

## 2. Frontend Web — Vercel

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Desde /App/frontend
vercel

# 3. Configuración durante setup:
#    - Framework: Create React App
#    - Root Directory: App/frontend
#    - Build Command: npm run build
#    - Output Directory: build

# 4. Variables de entorno en Vercel Dashboard:
#    REACT_APP_API_URL=https://<tu-backend>.railway.app/api
#    REACT_APP_SOCKET_URL=https://<tu-backend>.railway.app
```

### Configuración `vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

---

## 3. Android — APK / Play Store

### Generar APK de Release

```bash
# Desde /App/frontend

# 1. Generar keystore (solo la primera vez)
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/release.keystore -alias tinderapp -keyalg RSA -keysize 2048 -validity 10000

# 2. Configurar android/gradle.properties
# MYAPP_RELEASE_STORE_FILE=release.keystore
# MYAPP_RELEASE_KEY_ALIAS=tinderapp
# MYAPP_RELEASE_STORE_PASSWORD=<password>
# MYAPP_RELEASE_KEY_PASSWORD=<password>

# 3. Configurar android/app/build.gradle (signingConfigs)

# 4. Build APK
cd android
./gradlew assembleRelease

# APK generado en: android/app/build/outputs/apk/release/app-release.apk

# 5. Build AAB (para Play Store)
./gradlew bundleRelease
# AAB en: android/app/build/outputs/bundle/release/app-release.aab
```

### Variables de Entorno en Android

```javascript
// Crear .env.production en /frontend
API_URL=https://<tu-backend>.railway.app/api
SOCKET_URL=https://<tu-backend>.railway.app

// Usar react-native-config para leer variables
import Config from 'react-native-config';
const apiUrl = Config.API_URL;
```

### Publicar en Play Store
1. Crear cuenta de desarrollador en Google Play Console ($25 único)
2. Crear nueva aplicación
3. Completar ficha de Store (capturas, descripción, categoría)
4. Subir AAB firmado
5. Configurar versiones de prueba internas → cerradas → producción
6. Revisar política de contenido y clasificación de edad

---

## 4. Desktop — Electron

### Empaquetado

```bash
# Desde /App/frontend

# 1. Instalar electron-builder
npm install --save-dev electron-builder

# 2. Configurar package.json
{
  "build": {
    "appId": "com.tinderapp.local",
    "productName": "TinderApp Local",
    "directories": {
      "output": "dist-electron"
    },
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "perMachine": true,
      "allowToChangeInstallationDirectory": true
    }
  }
}

# 3. Build para Windows
npx electron-builder --win

# Instalador generado en: dist-electron/TinderApp Local Setup.exe
```

### Archivo `electron/main.js`

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 780,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // En desarrollo: localhost
  // En producción: archivo build
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../build/index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
```

---

## 5. CI/CD — GitHub Actions

### `.github/workflows/ci.yml`

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        working-directory: App/backend
        run: npm ci
      - name: Lint
        working-directory: App/backend
        run: npm run lint
      - name: Test
        working-directory: App/backend
        run: npm test
      - name: Security audit
        working-directory: App/backend
        run: npm audit --audit-level=high

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        working-directory: App/frontend
        run: npm ci
      - name: Lint
        working-directory: App/frontend
        run: npm run lint
      - name: Test
        working-directory: App/frontend
        run: npm test -- --watchAll=false

  deploy-backend:
    needs: [test-backend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend

  deploy-frontend:
    needs: [test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: App/frontend
```

---

## 6. Checklist Pre-Deploy

### Backend
- [ ] Variables de entorno configuradas en el hosting
- [ ] MongoDB Atlas configurado con IP whitelist
- [ ] CORS apunta al dominio correcto del frontend
- [ ] NODE_ENV=production
- [ ] Health check responde OK
- [ ] Logs configurados (no exponer stack traces)

### Frontend Web
- [ ] API_URL apunta al backend de producción
- [ ] SOCKET_URL apunta al backend de producción
- [ ] Build sin errores: `npm run build`
- [ ] Redirección SPA configurada (vercel.json)

### Android
- [ ] Keystore generado y respaldado de forma segura
- [ ] APK/AAB firmado correctamente
- [ ] API_URL de producción en .env.production
- [ ] Probado en dispositivo real
- [ ] Permisos declarados en AndroidManifest

### Desktop
- [ ] Electron main.js apunta al build correcto
- [ ] Ventana configurada (420x780, no resizable)
- [ ] Instalador generado y probado en Windows

---

## 7. Dominios y URLs de Producción

| Servicio | URL | Hosting |
|----------|-----|---------|
| Backend API | `https://api.tinderapp-local.com` | Railway/Render |
| Frontend Web | `https://tinderapp-local.com` | Vercel |
| WebSocket | `wss://api.tinderapp-local.com` | Mismo que backend |
| Fotos CDN | `https://res.cloudinary.com/<cloud>` | Cloudinary |
| Base de datos | MongoDB Atlas connection string | Atlas |

> Los dominios son ejemplos. Reemplazar con los dominios reales del proyecto.
