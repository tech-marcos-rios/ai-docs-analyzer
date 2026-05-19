# 05 — AI Docs Analyzer: asistente con IA

> GitHub: [tech-marcos-rios/ai-docs-analyzer](https://github.com/tech-marcos-rios/ai-docs-analyzer)

Proyecto diferenciador: demuestra integración con IA, streaming y manejo de costos. Tiempo estimado: **1 semana**. Estado: 📋 planificado.

## ¿Qué construir?

**"AI Copy Generator"** — herramienta que genera descripciones de productos para e-commerce a partir de un nombre y características básicas. Multi-idioma, multi-tono, exportable.

Por qué este caso: tiene mercado real (cualquier tienda de Mercado Libre o Shopify lo necesita) y muestra una integración con IA bien hecha.

## Stack

- Backend: .NET 8 Web API (sirve solo de proxy seguro a la API de Claude/OpenAI, así no exponés la API key)
- Frontend: Next.js 14 + TypeScript + Tailwind
- IA: Claude API (Anthropic) o OpenAI API
- Storage: SQLite o PostgreSQL para historial

## Features

1. Formulario: nombre del producto, características (lista), tono (formal/casual/divertido), idioma, longitud.
2. Botón "Generar" → streaming de la respuesta en tiempo real (como ChatGPT).
3. Historial de las últimas 20 generaciones, guardadas en DB.
4. Copiar al portapapeles, exportar a CSV.
5. Contador de tokens usados (para que el usuario vea el "costo").
6. Plantillas predefinidas (descripción corta, descripción larga, bullet points, copy de anuncio).

## Plan paso a paso

### Día 1: Backend proxy
- Endpoint `POST /api/generate` que recibe el prompt construido y hace streaming server-sent events de Claude API.
- Guardar cada generación en DB.
- Endpoint `GET /api/history` con paginación.

### Día 2-3: Frontend principal
- Formulario con React Hook Form + Zod.
- Selector de plantilla.
- Stream de respuesta con `EventSource` o `fetch` + `ReadableStream`.

### Día 4: Historial + export
- Drawer/modal con historial.
- Exportar selección a CSV.

### Día 5: Polish + deploy
- Animaciones, estados de carga, toasts de error.
- Deploy backend (Render/Azure) y frontend (Vercel).
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
