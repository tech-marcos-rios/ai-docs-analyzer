# syntax=docker/dockerfile:1
#
# Build multi-stage: 3 imágenes intermedias, pero la que termina publicada
# ("runtime") es liviana — sin TypeScript, sin devDependencies, sin código
# fuente. Ver docs/INFRAESTRUCTURA.md en la raíz del monorepo para el
# contexto de deploy (Hetzner, server dedicado a portfolio).
#
# Se construye desde la raíz de `api/` (contexto), por eso las rutas COPY
# son relativas a `api/`, no a `deploy/`:
#   docker build -f deploy/Dockerfile -t ai-docs-analyzer-api .

# ---------------------------------------------------------------------------
# Stage 1 — "deps": instala TODAS las dependencias (prod + dev).
# Se cachea por separado del código fuente: mientras no cambien package.json
# / package-lock.json, Docker reusa esta capa entera y no vuelve a bajar nada
# de npm en cada build.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# Stage 2 — "build": compila TypeScript → JavaScript.
# Arranca desde "deps" (ya tiene node_modules completo) y le suma el código.
# ---------------------------------------------------------------------------
FROM deps AS build
WORKDIR /app
COPY . .

# "prisma generate" no se conecta a la base — solo lee prisma/schema.prisma
# y escribe el cliente. Pero prisma.config.ts exige poder resolver
# DATABASE_URL igual (falla si la env var no existe), así que le pasamos un
# valor cualquiera que nunca se usa para conectarse a nada real.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

# El cliente de Prisma no vive en node_modules (generator "prisma-client" en
# schema.prisma lo escribe como TS plano en src/generated/prisma/) — por eso
# hay que generarlo ANTES de correr tsc, si no faltan esos archivos en dist/.
RUN npx prisma generate

# tsc compila src/ -> dist/ (incluye src/generated/, que ya quedó ahí generado
# en el paso anterior). Ver tsconfig.json: rootDir "src", outDir "dist".
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3 — "runtime": la imagen final, la única que se publica/despliega.
# Arranca de cero (no hereda nada de "deps"/"build") para no cargar
# TypeScript, ESLint, Vitest ni el código fuente sin compilar.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copiamos solo el manifest (no el código) para instalar node_modules de
# producción en una capa cacheable, sin devDependencies.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# JS ya compilado (incluye el cliente de Prisma generado en el stage build).
COPY --from=build /app/dist ./dist

# schema.prisma + migraciones + prisma.config.ts: no los usa el servidor en
# runtime, pero sí el comando "prisma migrate deploy" que corre el servicio
# "migrator" del docker-compose de producción (mismo patrón que p-aeon:
# un contenedor efímero que migra antes de levantar la API).
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

# Usuario sin privilegios — evita correr el proceso Node como root dentro
# del contenedor. "node" ya viene creado en la imagen base node:22-alpine.
USER node

EXPOSE 3000

# Comando por defecto: arranca la API. docker-compose puede pisar este CMD
# (ej. ["npx", "prisma", "migrate", "deploy"] para el servicio "migrator")
# sin necesitar una imagen aparte.
CMD ["node", "dist/server.js"]
