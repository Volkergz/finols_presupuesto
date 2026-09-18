-- Esquema del sistema. Todos los valores monetarios en CENTAVOS CLP (enteros).

CREATE TABLE IF NOT EXISTS prendas (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo              TEXT NOT NULL,
  talla             TEXT NOT NULL,
  color             TEXT NOT NULL,
  proveedor         TEXT,
  costo_unitario_cent INTEGER NOT NULL,
  activo            INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS disenos_dtf (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  descripcion       TEXT NOT NULL,
  ancho_cm          REAL NOT NULL,
  alto_cm           REAL NOT NULL,
  costo_metro_cent  INTEGER NOT NULL,
  activo            INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS packaging (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre            TEXT NOT NULL,
  descripcion       TEXT,
  costo_paquete_cent INTEGER NOT NULL,
  unidades_paquete  INTEGER NOT NULL,
  activo            INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS configuracion (
  clave             TEXT PRIMARY KEY,
  valor             TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS presupuestos (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  correlativo       INTEGER NOT NULL UNIQUE,
  numero            TEXT NOT NULL UNIQUE,
  fecha             TEXT NOT NULL,
  cliente           TEXT,
  estado            TEXT NOT NULL DEFAULT 'borrador',
  total_cent        INTEGER NOT NULL DEFAULT 0,
  creado_en         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS presupuesto_items (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  presupuesto_id     INTEGER NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  descripcion        TEXT NOT NULL,
  cantidad           INTEGER NOT NULL,
  prenda_id          INTEGER,
  diseno_id          INTEGER,
  packaging_id       INTEGER,
  diseno_desc        TEXT,
  detalle_packaging  TEXT,
  costo_prenda_cent   INTEGER NOT NULL,
  costo_dtf_cent      INTEGER NOT NULL,
  costo_packaging_cent INTEGER NOT NULL,
  subtotal_cent       INTEGER NOT NULL,
  precio_unidad_cent  INTEGER NOT NULL,
  total_linea_cent    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_presupuesto ON presupuesto_items(presupuesto_id);