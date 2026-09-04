# CLAUDE.md — ai-docs-analyzer (AI Copy Generator)

Este archivo se carga automáticamente en cada sesión de Claude Code dentro de esta carpeta.

---

## Sobre el proyecto

**AI Copy Generator** — genera descripciones de productos e-commerce (multi-idioma, multi-tono) a partir de nombre + características, usando streaming en tiempo real.

**Por qué Node.js y no .NET (a diferencia del resto del portafolio):** proyecto elegido a propósito como pieza de aprendizaje de Node.js aplicando los mismos principios de arquitectura ya usados en los proyectos .NET (capas, Result pattern, DI manual). Suma una segunda tecnología de backend al portafolio.

Stack: Node.js 20+ + TypeScript estricto + Express + Prisma + PostgreSQL.
Deploy: server de portfolio en Hetzner (puerto **5030**), separado del server de p-aeon — ver `docs/INFRAESTRUCTURA.md` en la raíz.

---

## Arquitectura — capas (equivalente a Clean Architecture en .NET)

```
src/domain/            ← entidades, sin dependencias externas       (≈ Domain)
src/application/       ← ports (interfaces), services, DTOs/schemas  (≈ Application)
src/infrastructure/    ← Prisma, providers de IA, logging            (≈ Infrastructure)
src/api/                ← Express app, routes, middleware            (≈ Api)
```

Regla de dependencia: `domain` no depende de nada. `application` depende solo de `domain` (a través de ports/interfaces). `infrastructure` implementa los ports de `application`. `api` depende de `application`, nunca de `infrastructure` directamente (se inyecta la implementación concreta en el composition root, `src/server.ts`).

No usamos un framework de DI (tipo `tsyringe`) — el proyecto es chico, alcanza con inyección manual por constructor/factory, igual que harías con un `IServiceCollection` simple en .NET pero sin el contenedor.

---

## Patrón: proveedor de IA intercambiable (Strategy/Adapter)

Decisión clave: usar Claude por default, pero la arquitectura permite cambiar a OpenAI/Gemini/otro sin tocar el resto del código.

```typescript
// application/ports/AiProvider.ts
export interface AiGenerationStream extends AsyncIterable<{ text: string }> {
  getUsage(): Promise<{ tokensUsed: number; model: string }>; // ≈ stream.finalMessage() del SDK
}

export interface AiProvider {
  readonly name: string;
  generateStream(prompt: string, maxTokens: number): AiGenerationStream;
}
```

- Implementaciones concretas en `infrastructure/providers/` (`ClaudeProvider.ts` es la única implementada hoy).
- Selección vía `AI_PROVIDER` en `.env` (`claude` por default), resuelta en `infrastructure/providers/getAiProvider.ts`.
- Modelo Claude usado: `claude-haiku-4-5` (el más económico) — proyecto de demo/portafolio, no requiere el modelo más capaz. Cambiar el modelo es una sola línea en `ClaudeProvider.ts`.
- Nunca instanciar el SDK de Anthropic (ni de otro proveedor) fuera de `infrastructure/providers/` — los routes y services solo conocen la interfaz `AiProvider`.

---

## Result pattern (igual que en 02-inventory-api y 04-kanban-saas)

Los services retornan `Result<T>` o `Result`, nunca lanzan excepciones para lógica de negocio esperada (input inválido, límite excedido, etc.). Las excepciones se reservan para errores inesperados (infraestructura, bugs) y las captura el `errorHandler` middleware.

---

## Convenciones de código

- Idioma: comentarios en español (solo si el *por qué* no es obvio), código (nombres) en inglés.
- TypeScript estricto (`strict: true` en `tsconfig.json`), sin `any` salvo justificación puntual.
- Validación de entrada con **Zod** en `application/dtos/` — los routes nunca validan a mano, delegan al schema.
- ESLint + Prettier — correr `npm run lint` antes de commitear.
- Testing: **Vitest** (unit) + **Supertest** (integración de endpoints). No aspirar a 100% coverage — priorizar el endpoint de generación y el rate limiting.

---

## Control de costos de IA — reglas que NO romper

- `maxTokens` tope de ~500 por generación (input de usuario es corto, no necesita más) — `application/common/constants.ts`.
- Rate limiting: 5 requests/minuto y 50/día por IP (`express-rate-limit`), aplicado en `/api/generate` y `/api/history`.
- **Tope global diario** (`GLOBAL_DAILY_GENERATION_LIMIT`, hoy 300/24hs entre todos los clientes juntos) chequeado en `GenerateCopyService.checkGlobalCapacity()` antes de llamar a la IA — el rate limit por IP solo no alcanza porque alguien podría repartir pedidos entre muchas IPs.
- Nunca loguear el contenido completo de prompts/respuestas en producción (costo + privacidad) — solo tokens usados y duración.
- Modelo default: el más barato que dé calidad aceptable (`claude-haiku-4-5`). Subir de modelo requiere justificación explícita, no es una decisión unilateral del agente.

---

## Scoping del historial — `X-Client-Id`

`GET /api/history` y `POST /api/generate` requieren el header `X-Client-Id` (validado en `api/requestClientId.ts`, 400 si falta). Es un UUID anónimo que genera el frontend y persiste en `localStorage` (`web/src/lib/clientId.ts`) — **no es autenticación real**, solo evita que un visitante vea el historial de otro. Si se agrega auth de verdad en el futuro, este mecanismo se reemplaza, no se apila.

---

## Variables de entorno

```
# .env (gitignoreado)
DATABASE_URL=postgresql://postgres:postgres@localhost:5435/ai_docs_dev
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=claude
PORT=3000
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
TRUST_PROXY_HOPS=0   # poner en 1 detrás de Nginx/Cloudflare en producción
```

**`LOG_LEVEL=debug` está atado a `NODE_ENV`, no al revés** (`infrastructure/logging/logger.ts`): en producción nunca usa `pino-pretty` (es devDependency, no viaja en la imagen — ver `deploy/Dockerfile`) sin importar qué `LOG_LEVEL` se configure. No desatar esa lógica sin revisar el Dockerfile.

---

## Deploy

| Recurso | Estado |
|---|---|
| Backend (Hetzner, puerto planeado `5030`) | No desplegado — bloqueado por recuperación de cuenta Hetzner, ver `docs/INFRAESTRUCTURA.md` |
| `api/deploy/Dockerfile` | Listo y probado (multi-stage: deps → build → runtime, imagen final sin devDependencies) |
| `api/deploy/docker-compose.yml` | Listo y probado — `db` (Postgres) → `migrator` (`prisma migrate deploy`, efímero) → `api`, mismo patrón que `p-aeon` |
| CI (`.github/workflows/ci.yml`) | Verde en GitHub Actions — jobs `api` (lint+build+test) y `web` (lint+build) |
| `deploy.yml` (deploy automático por SSH) | No existe todavía — falta crearlo + secrets `HETZNER_HOST`/`HETZNER_SSH_KEY` en GitHub |
| Frontend (Vercel) | No desplegado |

Cuando se despliegue, `TRUST_PROXY_HOPS` queda en `0` mientras el acceso sea directo por IP:puerto (sin Nginx/Cloudflare adelante) — subir a `1` recién si se suma un reverse proxy.

---

## Git Flow

- `master` — producción. Protegida: requiere PR + CI en verde (`api` y `web`), sin push directo ni force-push.
- `develop` — integración, rama default del repo. Misma protección que `master`.
- `feature/*` / `fix/*` / `chore/*` — ramas de trabajo, se mergean a `develop` vía PR.
- `release/*` / `hotfix/*` — promueven `develop` a `master`.
- Conventional Commits obligatorios.
Scopes sugeridos: `generate`, `history`, `providers`, `infra`, `config`.

---

## Documentación

| Ubicación | Contenido |
|---|---|
| `README.md` | Plan del proyecto, features, roadmap día a día |
| `../docs/ROADMAP.md` | Plan estratégico del portafolio completo |
| `../docs/INFRAESTRUCTURA.md` | Estado de los servers de deploy |
