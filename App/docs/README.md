# Documentación Técnica — TinderApp

Índice completo de la documentación del proyecto.

---

## Documentos

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| [arquitectura.md](arquitectura.md) | Arquitectura del sistema, diagramas de componentes, flujos de datos, patrones de diseño, decisiones técnicas | Todos |
| [flujo_usuario.md](flujo_usuario.md) | Flujos detallados de cada funcionalidad: registro, exploración, chat, perfil, configuración, reportes, auth refresh | Frontend |
| [modelos_datos.md](modelos_datos.md) | Esquemas MongoDB completos: User, Like, Match, Message. Índices, validaciones, relaciones | Backend |
| [api_endpoints.md](api_endpoints.md) | Especificación completa de la API REST: rutas, métodos, request/response bodies, códigos de error, ejemplos | Full-stack |
| [pantallas_ui.md](pantallas_ui.md) | Especificación de cada pantalla: layout, componentes, estados, interacciones, responsive | Frontend |
| [seguridad.md](seguridad.md) | Autenticación JWT, protección de datos, rate limiting, validación, OWASP, privacidad | Todos |
| [despliegue.md](despliegue.md) | Guía de deploy: backend (Railway/Render), frontend web (Vercel), Android (APK/Play Store), Desktop (Electron) | DevOps |

---

## Orden de Lectura Recomendado

1. **arquitectura.md** — Entender el sistema completo
2. **modelos_datos.md** — Entender la estructura de datos
3. **api_endpoints.md** — Entender la comunicación cliente-servidor
4. **flujo_usuario.md** — Entender las interacciones del usuario
5. **pantallas_ui.md** — Entender la interfaz visual
6. **seguridad.md** — Entender las protecciones
7. **despliegue.md** — Entender cómo publicar

---

## Convenciones

- Los diagramas usan **Mermaid** (renderizables en GitHub/VS Code)
- Los endpoints siguen formato RESTful: `MÉTODO /ruta`
- Los modelos documentan tipos de Mongoose
- Las pantallas referencian componentes del directorio `frontend/src/`