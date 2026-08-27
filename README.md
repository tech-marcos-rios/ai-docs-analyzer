# 05 — AI Docs Analyzer: asistente con IA

> GitHub: [tech-marcos-rios/ai-docs-analyzer](https://github.com/tech-marcos-rios/ai-docs-analyzer)

Proyecto diferenciador: demuestra integración con IA, streaming y manejo de costos. Tiempo estimado: **1 semana**. Estado: 🚧 backend y frontend funcionando end-to-end en local — falta probar con una API key real y deployar.

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
- Endpoint `POST /api/generate` con streaming SSE real (Claude Haiku 4.5).
- Endpoint `GET /api/history` con las últimas generaciones.
- Rate limiting (5/min, 50/día por IP), validación con Zod, logging con Pino.
- Tests (Vitest + Supertest) y build de producción verificados.

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
- Panel de historial (`GET /api/history`) con export a CSV y copiar al portapapeles.
- Tema oscuro fijo, Tailwind v4.

Cómo correrlo en local (con el backend ya corriendo en el puerto 3000):
```bash
cd web
npm install
npm run dev   # puerto 5173, ya configurado en .env.local
```

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

## Por qué este proyecto

La integración con IA está extremadamente demandada en 2026. Si tenés esto en el portafolio, calificás automáticamente para una franja de proyectos donde la mayoría de freelancers no pueden competir.

Posible sucesor (si te interesa): "AI Email Writer" o "PDF Summarizer" siguiendo la misma estructura.
