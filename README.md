# 05 — AI Docs Analyzer: asistente con IA

> GitHub: [tech-marcos-rios/ai-docs-analyzer](https://github.com/tech-marcos-rios/ai-docs-analyzer)

Proyecto diferenciador: demuestra integración con IA, streaming y manejo de costos. Tiempo estimado: **1 semana**. Estado: 🚧 código listo (backend + frontend + Docker + CI verde en GitHub), pusheado a `master`. Falta: confirmación visual en el navegador y el deploy real (bloqueado por la cuenta de Hetzner).

## ¿Qué construir?

**"AI Copy Generator"** — herramienta que genera descripciones de productos para e-commerce a partir de un nombre y características básicas. Multi-idioma, multi-tono, exportable.

Por qué este caso: tiene mercado real (cualquier tienda de Mercado Libre o Shopify lo necesita) y muestra una integración con IA bien hecha.

## Stack

- **Backend: Node.js 20+ / TypeScript estricto / Express** — elegido a propósito como proyecto de aprendizaje de Node.js aplicando patrones de Clean Architecture, distinto al resto del portafolio (.NET). Ver `api/CLAUDE.md` para el detalle de arquitectura.
- Frontend: Next.js 16 + TypeScript + Tailwind v4 + React Hook Form + Zod
- IA: Claude API (Anthropic), con arquitectura de proveedor intercambiable (Strategy/Adapter) para poder sumar OpenAI/Gemini sin tocar el resto del código
- Storage: PostgreSQL (vía Prisma) para historial de generaciones

## Backend — estado actual

Implementado en `api/`:
- Arquitectura en capas (`domain` / `application` / `infrastructure` / `api`), Result pattern, DI manual.
- Endpoint `POST /api/generate` con streaming SSE real (Claude Haiku 4.5) — probado con una API key real, no solo mockeado.
- Endpoint `GET /api/history` con las últimas generaciones.
- Historial scopeado por cliente anónimo (header `X-Client-Id`, sin auth real) — cada visitante solo ve el suyo.
- Rate limiting por IP (5/min, 50/día) **+ tope global diario** (300 generaciones/24hs entre todos los clientes) para que el límite por IP no se pueda esquivar repartiendo requests entre varias IPs.
- Validación con Zod, logging con Pino, `TRUST_PROXY_HOPS` configurable para cuando haya un reverse proxy en producción.
- Tests (Vitest + Supertest, 8 casos), build de producción y CI (GitHub Actions) verificados en verde.
- `deploy/Dockerfile` (multi-stage) + `deploy/docker-compose.yml` (`db` → `migrator` → `api`) probados de punta a punta local contra Postgres real.

Cómo correrlo en local:
```bash
cd api
npm install
docker compose -f docker-compose.dev.yml up -d   # Postgres local, puerto 5435
npx prisma migrate dev
cp .env.example .env   # y completar ANTHROPIC_API_KEY con una key real
npm run dev   # puerto 3000
```

## Frontend — estado actual

Implementado en `web/` con Next.js 16 (no 14 como decía la convención original del portafolio: `create-next-app@14.2.5` resultó tener ~28 CVEs acumulados, incluyendo uno crítico, así que se usó la última versión parcheada en su lugar):
- Formulario (producto, características dinámicas, tono, idioma) con React Hook Form + Zod, mismo shape que el schema del backend.
- Consumo del streaming SSE en tiempo real vía `fetch` + `ReadableStream` (no se puede usar `EventSource` nativo porque el endpoint necesita POST con body).
- ID anónimo por visitante (`lib/clientId.ts`, UUID en `localStorage`) enviado como `X-Client-Id` — necesario para que el backend sepa de quién es cada generación.
- Panel de historial (`GET /api/history`) con export a CSV (con neutralización de formula injection y BOM UTF-8 para que Excel no rompa tildes/ñ/emojis) y copiar al portapapeles.
- Tema oscuro fijo, Tailwind v4.

Cómo correrlo en local (con el backend ya corriendo en el puerto 3000):
```bash
cd web
npm install
npm run dev   # puerto 5173, ya configurado en .env.local
```

## Seguridad (revisado 2026-08-28)

Medidas ya implementadas: `helmet` + `cors` restringido, validación de entrada con Zod en todos los endpoints (incluido el header `X-Client-Id`), rate limiting por IP + tope global diario, tope de tokens de salida, errores internos nunca expuestos al cliente (solo logueados), neutralización de CSV/formula injection en el export, secrets solo en `.env` (gitignoreado) + hook `check-secrets.ps1`, y Prisma como ORM (sin SQL manual, sin superficie de SQL injection).

`npm audit` (`api/`): 3 vulnerabilidades **high**, todas de la misma cadena `prisma@7.10.0 → @prisma/config → deepmerge-ts@7.1.5` ([GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), stack exhaustion). No hay fix estable todavía — la última versión estable de `@prisma/config` (7.10.0, la instalada) sigue pineando la versión vulnerable de `deepmerge-ts`; el único fix es `prisma@8.0.0-rc.12` (release candidate, no estable). No se aplica: `deepmerge-ts` lo usa el CLI de Prisma al resolver `prisma.config.ts` (build/migrate time), no el cliente en runtime que atiende requests HTTP — no es una superficie alcanzable remotamente. Queda trackeado para revisar cuando Prisma publique una versión 7.x o 8.x estable que la resuelva. `npm audit` en `web/`: 0 vulnerabilidades.

## Próximos pasos (2026-08-28)

### Bloqueante / core — para considerarlo terminado y mostrable
- [ ] Probar en el navegador (`http://localhost:5173`) — pendiente de confirmación visual (2026-08-28: se validó el fix del export CSV solo con lint + build, todavía no con navegador real).
- [x] Push de los commits a GitHub — `master` al día, todo en `github.com/tech-marcos-rios/ai-docs-analyzer`.
- [x] Dockerfile del backend + `docker-compose` de producción (`api/deploy/`), probado de punta a punta local: `db` → `migrator` → `api` sobre Postgres real.
- [x] CI (lint + build + test en cada push a `master`) — `.github/workflows/ci.yml`, verificado en verde en GitHub Actions (no solo local), jobs separados para `api` y `web`.
- [ ] Deploy real: backend en Hetzner `:5030` (bloqueado por la recuperación de la cuenta de Hetzner, ver `docs/INFRAESTRUCTURA.md` en la raíz) y frontend en Vercel. Falta también configurar los secrets `HETZNER_HOST`/`HETZNER_SSH_KEY` en GitHub Actions y el workflow de `deploy.yml` (CI ya está, deploy automático todavía no).
- [ ] README con capturas + demo en vivo + video Loom de 90s (estándar de calidad del portafolio, `CLAUDE.md` raíz).

### Nice-to-have — no bloquea mostrar el proyecto
- [ ] Selector de plantillas predefinidas (quedó en el plan original, sin implementar).
- [ ] Mostrar el costo estimado en la UI (se guarda `tokensUsed` en el historial, pero no se le muestra al usuario).
- [ ] Tests en el frontend (el backend tiene 8, el frontend cero).
- [ ] Implementar OpenAI/Gemini como providers reales (la arquitectura `AiProvider` ya lo permite).

## Features

1. Formulario: nombre del producto, características (lista), tono (formal/casual/divertido), idioma, longitud.
2. Botón "Generar" → streaming de la respuesta en tiempo real (como ChatGPT).
3. Historial de las últimas 20 generaciones, guardadas en DB.
4. Copiar al portapapeles, exportar a CSV.
5. Contador de tokens usados (para que el usuario vea el "costo").
6. Plantillas predefinidas (descripción corta, descripción larga, bullet points, copy de anuncio).

## Plan paso a paso

### Día 1: Backend proxy ✅
- Endpoint `POST /api/generate` que recibe el prompt construido y hace streaming server-sent events de Claude API.
- Guardar cada generación en DB.
- Endpoint `GET /api/history`.

### Día 2-3: Frontend principal ✅
- Formulario con React Hook Form + Zod.
- Stream de respuesta con `fetch` + `ReadableStream`.
- Pendiente: selector de plantillas predefinidas (no implementado todavía).

### Día 4: Historial + export ✅
- Panel de historial (sin drawer/modal, integrado en la página).
- Exportar a CSV.

### Día 5: Polish + deploy
- Animaciones, estados de carga, toasts de error.
- Deploy backend (Hetzner :5030, ver `docs/INFRAESTRUCTURA.md`) y frontend (Vercel).
- Limitar uso por IP para evitar abuso.

## Manejo de costos

Importante mostrar que entendés esto:
- Limita tokens máximos por request (~500 output).
- Limita requests por IP (5/minuto, 50/día).
- Calcula costo aproximado y muéstralo en la UI.
- Usa el modelo más barato que dé buena calidad (Claude Haiku, GPT-4o-mini).

## Git Flow

- `master` — producción. Protegida: requiere PR + CI en verde (`api` y `web`), sin push directo ni force-push.
- `develop` — integración, rama default del repo. Misma protección que `master`.
- `feature/*` / `fix/*` / `chore/*` — ramas de trabajo, se mergean a `develop` vía PR.
- `release/*` / `hotfix/*` — promueven `develop` a `master`.

## Por qué este proyecto

La integración con IA está extremadamente demandada en 2026. Si tenés esto en el portafolio, calificás automáticamente para una franja de proyectos donde la mayoría de freelancers no pueden competir.

Posible sucesor (si te interesa): "AI Email Writer" o "PDF Summarizer" siguiendo la misma estructura.
