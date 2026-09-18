// Exportación de respaldo (RNF-009): genera JSON o SQL con todo el contenido
// de las tablas del sistema. Solo lectura; no modifica datos.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Client } from '@libsql/client';

const Omitidas = new Set(['sqlite_sequence']);

async function listarTablas(db: Client): Promise<string[]> {
  const res = await db.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  );
  return res.rows.map((r) => String(r.name)).filter((n) => !Omitidas.has(n));
}

/** Objeto serializable con todas las tablas (columnas + filas). */
export async function exportarJSON(db: Client): Promise<unknown> {
  const tablas = await listarTablas(db);
  const datos: Record<string, unknown[]> = {};
  for (const t of tablas) {
    const res = await db.execute(`SELECT * FROM "${t}"`);
    datos[t] = res.rows.map((row) =>
      Object.fromEntries(res.columns.map((c) => [c, row[c]])),
    );
  }
  return {
    app: 'finols',
    version: 1,
    exportado_en: new Date().toISOString(),
    moneda: 'CLP',
    datos,
  };
}

const valorSQL = (v: unknown): string => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'bigint') return v.toString();
  return `'${String(v).replace(/'/g, "''")}'`;
};

/** Script SQL completo: schema + INSERTs con todos los datos. */
export async function exportarSQL(db: Client): Promise<string> {
  const schema = readFileSync(join(process.cwd(), 'db', 'schema.sql'), 'utf8');
  const tablas = await listarTablas(db);
  const partes: string[] = [
    '-- Respaldo Finols (RNF-009)',
    `-- Generado: ${new Date().toISOString()}`,
    schema,
  ];

  for (const t of tablas) {
    const [info, res] = await Promise.all([
      db.execute(`PRAGMA table_info("${t}")`),
      db.execute(`SELECT * FROM "${t}"`),
    ]);
    const cols = info.rows.map((r) => String(r.name));
    partes.push(`-- Datos: ${t} (${res.rows.length} filas)`);
    for (const row of res.rows) {
      const vals = cols.map((c) => valorSQL(row[c]));
      partes.push(
        `INSERT INTO "${t}" ("${cols.join('","')}") VALUES (${vals.join(', ')});`,
      );
    }
  }

  return partes.join('\n');
}