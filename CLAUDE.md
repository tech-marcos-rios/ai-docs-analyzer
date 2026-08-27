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
export interface AiProvider {
  generateStream(prompt: string, maxTokens?: number): AsyncIterable<string>;
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

- `maxTokens` tope de ~500 por generación (input de usuario es corto, no necesita más).
- Rate limiting: 5 requests/minuto y 50/día por IP (`express-rate-limit`), aplicado en el route de generación.
- Nunca loguear el contenido completo de prompts/respuestas en producción (costo + privacidad) — solo tokens usados y duración.
- Modelo default: el más barato que dé calidad aceptable (`claude-haiku-4-5`). Subir de modelo requiere justificación explícita, no es una decisión unilateral del agente.

---

## Variables de entorno

```
# .env (gitignoreado)
DATABASE_URL=postgresql://user:pass@localhost:5433/ai_docs_dev
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=claude
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

---

## Git Flow

Mismo patrón que el resto del portafolio numerado: `master` protegida, features en `feature/*`, Conventional Commits.
Scopes sugeridos: `generate`, `history`, `providers`, `infra`, `config`.

---

## Documentación

| Ubicación | Contenido |
|---|---|
| `README.md` | Plan del proyecto, features, roadmap día a día |
| `../docs/ROADMAP.md` | Plan estratégico del portafolio completo |
| `../docs/INFRAESTRUCTURA.md` | Estado de los servers de deploy |
