# Finols — Gestión y Presupuestación de Poleras Personalizadas

Sistema web (Next.js + TypeScript) para calcular costos/presupuestos de poleras
personalizadas, reemplazando el archivo Excel "Calculo" del negocio.

Requisitos y decisiones en `docs/`:

- `docs/Requerimientos del Sistema.md` — fuente de verdad (RF-001 a RF-028).
- `docs/Plan de Desarrollo.md` — estado actual y pendientes.
- `docs/requirements.md` — documento original de negocio.

## Módulos (V1)

- Dashboard (`/`)
- Calculadora (`/calculadora`) — funcionalidad principal, multi-línea
- Presupuestos (`/presupuestos`) — congelación de costos, numeración `COT-####`
- Prendas base (`/prendas`)
- Diseños DTF (`/dtf`)
- Packaging (`/packaging`)
- Configuración (`/configuracion`) — incluye exportación de respaldo (JSON/SQL)

## Desarrollo local

```bash
npm install
npm run db:migrate && npm run db:seed   # crea local.db y datos de ejemplo
npm run dev                              # http://localhost:3000
```

Checks:

```bash
npm run lint
npm run typecheck
npm test
```

## Producción (Vercel + Turso)

1. Crea una base Turso (capa gratuita) y copia `TURSO_URL` y `TURSO_AUTH_TOKEN`.
2. Con esas variables, inicializa la base remota:
   ```bash
   TURSO_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:migrate
   TURSO_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:seed
   ```
3. En Vercel: importa el repo y agrega `TURSO_URL` y `TURSO_AUTH_TOKEN`
   como variables de entorno del proyecto.
4. La app lee las variables automáticamente (`lib/db.ts`); sin ellas usa
   `file:local.db`.

## Respaldo

Desde `/configuracion` se pueden descargar respaldos:

- JSON: `GET /api/respaldo?formato=json`
- SQL completo: `GET /api/respaldo?formato=sql`

La restauración puede hacerse reinsertando el archivo SQL en la base (Turso CLI
o consola) o reimportando el JSON en un entorno de desarrollo.

## Reglas de cálculo (resumen)

- Dinero interno en **centavos** (enteros), BigInt en las fórmulas.
- Sin redondeo interno; `ceil` solo al mostrar.
- `costo DTF = costo_metro × ancho × alto / (rollo_ancho × rollo_alto)`
- `precio = ceil(subtotal × markup)` · `total línea = ceil(exacto × cantidad)`
- Presupuestos guardados **congelan** sus costos (no se recalculan).