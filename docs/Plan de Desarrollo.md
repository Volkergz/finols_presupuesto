# Plan de Desarrollo — Sistema de Gestión y Presupuestación de Poleras Personalizadas

Documento operativo para **retomar el desarrollo en otra sesión**. Complementa a
`Requerimientos del Sistema.md` (fuente de verdad de requisitos) y a `requirements.md`
(documento original de negocio).

---

## 1. Estado actual (checkpoint)

- [x] Análisis de requisitos y del Excel de referencia ("Calculo") completado.
- [x] Fórmulas de negocio validadas con ejemplos reales del Excel.
- [x] Documento `Requerimientos del Sistema.md` generado (RF-001 a RF-028, RNF-001 a RNF-011).
- [x] Repositorio git inicializado y aplicación Next.js (App Router) + TypeScript creada.
- [x] Migraciones + seed (SQLite local / Turso) y fórmulas como funciones puras con tests (lint, typecheck y test en verde).
- [x] Fases 1 a 5 completadas en código: setup, catálogos (prendas/DTF/packaging/configuración), calculadora, presupuestos, dashboard y pulido (respaldo, accesibilidad, deploy-ready).

**Siguiente acción:** ejecutar el despliegue real en Vercel + Turso (pasos en sección 7/README, requiere cuentas propias).

---

## 2. Contexto del negocio

- Pequeño negocio de poleras personalizadas.
- HOY usa un archivo Excel llamado **"Calculo"** con 4 hojas:
  1. **Prendas Base** — tipo, talla, color, proveedor, costo unitario, costo envío, costo total.
  2. **Costos DTF** — descripción, ancho, alto, costo del metro de DTF, rendimiento (se elimina), costo unitario estampado, costo total estampado (se ignora).
  3. **Packaging** — nombre insumo, costo paquete, unidades paquete, coste unitario.
  4. **Calculadora de costo** — descripción (manualmente), costo prenda, costo DTF, costo packaging, subtotal, costo total (× 1,3).
- El sistema reemplaza progresivamente el Excel. El Excel sigue siendo la **referencia de validación** (Resultado app = Resultado Excel).

---

## 3. Decisiones tomadas (NO cambiar sin revalidar el negocio)

| Tema | Decisión |
|---|---|
| Descuentos | **Fuera** del sistema (usuario no quiere). |
| Envío | **Fuera** de V1 (el Excel lo tiene, se aplacó). |
| Multi-diseño por prenda | **Fuera de V1**: 1 diseño por línea. |
| Clientes | No es módulo; en presupuesto es **texto libre**. |
| IVA | No aplica (venta sin IVA). |
| Moneda | CLP, **enteros** en display, cálculo interno en **centavos** (sin float). |
| Redondeo | Sin redondeo interno; **solo un rounding hacia arriba (ceil)** al valor mostrado. |
| Terminaciones cómodas | **Eliminadas** (se descartó la regla .990). |
| Número de presupuesto | `COT-0001` secuencial. |
| Cotización | **Multi-línea** (varias líneas por presupuesto). |
| Congelación | Al guardar, snapshot de **todos** los costos/precios por línea (§34). |
| Usuario(s) | Uno solo, **sin autenticación** en V1. |
| Tema | Exclusivamente **tema claro**. |
| Colores | `#87012d` (Principal), `#350612` (Sombra), `#ea0561` (Luz). Ver RNF-011. |

---

## 4. Stack y herramientas

| Capa | Elección | Notas |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | RSC/Server Actions donde aplique; validación de entradas en el servidor. |
| Hosting | **Vercel (plan gratuito/Hobby)** | Funciones serverless con disco efímero. |
| Base de datos prod | **Turso (libSQL)** | Compatible SQLite, persistente en serverless, plan free. |
| Base de datos dev | **SQLite en archivo** | Mismo esquema; evitar dependencia de la nube para tests. |
| ORM/Driver | libSQL client + migraciones SQL (o Drizzle/Prisma si se prefiere; decidir en Fase 1) | |
| Tests | framework de tests del stack (Vitest recomendado) | Fórmulas como funciones puras. |
| Estilos | CSS/design tokens (tema claro + paleta de marca) | Centralizar colores en variables. |

- La lógica de cálculo va en un módulo de **funciones puras** (sin I/O) para testearla contra el Excel (RNF-007).

---

## 5. Modelo de datos

Esquema objetivo (sintaxis SQLite):

```sql
-- Entidades de catálogo
CREATE TABLE prendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  talla TEXT NOT NULL,
  color TEXT NOT NULL,
  proveedor TEXT,               -- texto por ahora; futuro módulo proveedores
  costo_unitario INTEGER NOT NULL,  -- en centavos CLP
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE disenos_dtf (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  descripcion TEXT NOT NULL,
  ancho_cm REAL NOT NULL,
  alto_cm REAL NOT NULL,
  costo_metro INTEGER NOT NULL,  -- en centavos CLP
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE packaging (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  costo_paquete INTEGER NOT NULL,   -- en centavos CLP
  unidades_paquete INTEGER NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL            -- ancho_rollo=100, alto_rollo=57, markup=1.3, datos negocio
);

-- Presupuestos (congelación de costos)
CREATE TABLE presupuestos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT NOT NULL UNIQUE,       -- COT-0001
  fecha TEXT NOT NULL,               -- ISO date
  cliente TEXT,
  estado TEXT NOT NULL DEFAULT 'borrador',
  total INTEGER NOT NULL,            -- en centavos CLP, suma de líneas
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE presupuesto_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  presupuesto_id INTEGER NOT NULL REFERENCES presupuestos(id),
  descripcion TEXT NOT NULL,            -- texto armado automáticamente (ex "Polera - M - Negro")
  cantidad INTEGER NOT NULL,
  costo_prenda INTEGER NOT NULL,        -- snapshot, centavos
  costo_dtf INTEGER NOT NULL,           -- snapshot, centavos
  costo_packaging INTEGER NOT NULL,     -- snapshot, centavos
  subtotal_unidad INTEGER NOT NULL,     -- snapshot, centavos
  precio_unidad INTEGER NOT NULL,       -- snapshot final (ceil), centavos
  total_linea INTEGER NOT NULL,         -- snapshot (ceil de exacto×cantidad), centavos
  prenda_id INTEGER, diseno_id INTEGER, packaging_id INTEGER  -- referencias opcionales
);
```

Estados de presupuesto: `borrador`, `enviado`, `aceptado`, `rechazado`, `cancelado`.
En `presupuesto_items` se guarda además una referencia JSON o columnas de texto con el detalle
de los elementos de packaging seleccionados (puede haber varios por línea).

---

## 6. Fórmulas (núcleo funcional)

```text
costo_packaging   = costo_paquete / unidades_paquete
costo_dtf         = costo_metro × ancho × alto / (ancho_rollo × alto_rollo)
subtotal_unidad   = costo_prenda + costo_dtf + costo_packaging
precio_unidad     = ceil(subtotal_unidad × markup)                 # display entero
total_linea       = ceil(precio_exacto_unidad × cantidad)           # precio_exacto = subtotal × markup
total_cotizacion  = Σ total_linea
```

Parámetros default en `configuracion`:
- `ancho_rollo = 100` cm, `alto_rollo = 57` cm → **5.700 cm²** por metro.
- `markup = 1.3`.

Ejemplo de validación (del Excel real):
- DTF "Pasaporte": 15.000 × 30 × 20 / 5.700 = **1.578,95**.
- Packaging "Bolsa Transparente": 1.990 / 50 = **39,8**.
- Prenda "Polera/XXXL/Cafe/Andesland": **8.990**.
- Subtotal = 10.608,75 → precio unidad = ceil(10.608,75 × 1,3) = ceil(13.791,37) = **13.792**.
- Total 10u = ceil(13.791,37 × 10) = **137.914**.

---

## 7. Fases de desarrollo

### Fase 1 — Setup ✅ (completada)
- [x] `git init` + repo (terminar de definir estructura de carpetas).
- [x] Crear app Next.js (App Router) + TypeScript.
- [x] Configurar Estilos/Tema claro + tokens de color (RNF-011).
- [x] Instalar libSQL client; definir migraciones (schema sección 5).
- [x] Seed con configuración default (`configuracion`) y datos de ejemplo reales (Pasaporte, Polera, Bolsa).
- [x] Definir estructura del módulo de fórmulas como funciones puras.
- [x] CI básico: lint + typecheck + test.

### Fase 2 — Catálogos (CRUD) ✅ (completada)
- [x] Prendas: listar/buscar/filtrar, crear, editar, desactivar (RF-002..005).
- [x] Diseños DTF: listar/buscar, crear, editar, desactivar + **costo unitario calculado** (RF-006..009).
- [x] Packaging: listar/buscar, crear, editar, desactivar + **costo unitario calculado** (RF-010..013).
- [x] Configuración: ver/editar rollo, markup y datos del negocio (RF-014).

### Fase 3 — Calculadora (núcleo) ✅ (completada)
- [x] Módulo de fórmulas + **tests** contra ejemplos del Excel (RF-018, RNF-003/RNF-007).
- [x] Selección de prenda y cantidad (RF-015).
- [x] Aplicar diseño DTF a la línea (RF-016).
- [x] Añadir packaging (uno o varios elementos) (RF-017).
- [x] Resultados por línea: desglose + precio unitario + total (RF-018).
- [x] Multi-línea: agregar, editar, eliminar con recálculo automático (RF-019, RF-020).
- [x] Validaciones y prevención de NaN/Infinity/vacíos (RF-028).

### Fase 4 — Presupuestos y Dashboard ✅ (completada)
- [x] Guardar cotización como presupuesto + **snapshot/congelación** (RF-021, RNF-010).
- [x] Numeración secuencial `COT-0001` (RF-027).
- [x] Listar/buscar/filtrar por fecha y estado (RF-022).
- [x] Detalle histórico con valores congelados (RF-023).
- [x] Duplicar (nueva numeración) (RF-024).
- [x] Editar presupuesto en estado borrador (RF-025).
- [x] Cambiar estado (RF-026).
- [x] Dashboard: recientes, totales, pendientes, aceptados (RF-001).

### Fase 5 — Pulido ✅ (completada en código)
- [x] Responsive mobile-first completo (RNF-001, RNF-006).
- [x] Exportación de respaldo JSON + SQL (RNF-009) — ruta `GET /api/respaldo`, UI en `/configuracion`.
- [x] Despliegue listo para Vercel + Turso (RNF-008) — variables `TURSO_URL`/`TURSO_AUTH_TOKEN`, `.env.example`, README con pasos. *Pendiente operativo: ejecutar el deploy real con las cuentas del usuario.*
- [x] Verificación de accesibilidad/contraste (RNF-011) y seguridad básica (RNF-004): foco visible global, labels asociados en los formularios, tokens de paleta centralizados; validación zod y servidor como capa de datos.

---

## 8. Guía para retomar el desarrollo

1. Leer este documento y `Requerimientos del Sistema.md` completo.
2. Verificar estado (sección 1) y arrancar con la primera tarea pendiente (Fase 5, Pulido).
3. Reglas irrenunciables del cálculo (sección 3 y 6):
   - Dinero en **centavos enteros** (multiplicar por 100 al guardar; nunca `float`).
   - Sin redondeo interno; `ceil` solo al mostrar/guardar los valores finales mostrados.
   - Snapshot congelado al guardar presupuesto; nunca recalcular históricos.
   - Un solo diseño por prenda; sin descuentos; sin envío.
4. Al validar cálculos, comparar contra los ejemplos de la sección 6 y los casos del
   anexo de `Requerimientos del Sistema.md`.
5. Mantener el tema claro y la paleta de marca (RNF-011).

### Comandos previstos (ajustar a la estructura elegida en Fase 1)
```bash
# desarrollo local (con SQLite de archivo)
npm run dev
# lint + typecheck
npm run lint && npm run typecheck
# tests de fórmulas (Vitest)
npm test
# migraciones / seed
npm run db:migrate && npm run db:seed
```

---

## 9. Pendientes y decisiones abiertas

- ~~**ORM/migraciones**: elegir entre libSQL crudo + SQL, Drizzle o Prisma~~ → **Resuelto**: libSQL crudo + migraciones SQL (`db/schema.sql`, `db/scripts.ts`).
- **Cantidad de packaging por línea**: varios elementos seleccionables (bolsa + sticker). Definir UX exacta en Fase 3.
- ~~**Estructura de carpetas/componentes** del frontend~~ → **Resuelto**: `app/` (rutas por módulo), `lib/` (cálculo, db, schemas), `db/`, `components/`.
- ~~**Exportación/respaldo**: formato a confirmar~~ → **Resuelto**: JSON y SQL implementados (`/api/respaldo`, UI en `/configuracion`).
- **Nombre/dominio** de la app y datos del negocio a cargar en configuración (datos del negocio ya configurables; nombre/dominio del deploy dependerá de la cuenta Vercel).