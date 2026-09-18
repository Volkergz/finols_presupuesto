// Herramienta CLI de base de datos: npm run db:migrate | db:seed | db:reset
// Usa libSQL (Turso en producción, archivo local en desarrollo).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDb, dineroPesosACentavos } from '../lib/db';

const SCHEMA = readFileSync(join(process.cwd(), 'db', 'schema.sql'), 'utf8');

async function migrate() {
  const db = getDb();
  await db.executeMultiple(SCHEMA);
  console.log('✓ Schema aplicado.');
}

async function seed() {
  const db = getDb();
  await migrate();

  await db.execute(
    `INSERT OR IGNORE INTO prendas (tipo, talla, color, proveedor, costo_unitario_cent) VALUES (?,?,?,?,?)`,
    ['Polera', 'XXXL', 'Cafe', 'Andesland', dineroPesosACentavos(8990)],
  );

  await db.execute(
    `INSERT OR IGNORE INTO disenos_dtf (descripcion, ancho_cm, alto_cm, costo_metro_cent) VALUES (?,?,?,?)`,
    ['Pasaporte', 30, 20, dineroPesosACentavos(15000)],
  );

  await db.execute(
    `INSERT OR IGNORE INTO packaging (nombre, descripcion, costo_paquete_cent, unidades_paquete) VALUES (?,?,?,?)`,
    ['Bolsa Transparente', null, dineroPesosACentavos(1990), 50],
  );

  const pavos: [string, string][] = [
    ['ancho_rollo', '100'],
    ['alto_rollo', '57'],
    ['markup_pct', '130'],
    ['negocio_nombre', 'Mi Negocio'],
    ['negocio_direccion', ''],
    ['negocio_telefono', ''],
    ['negocio_email', ''],
    ['moneda', 'CLP'],
  ];
  for (const [k, v] of pavos) await db.execute('INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?,?)', [k, v]);

  console.log('✓ Seed aplicado (prendas, DTF, packaging, configuración).');
}

async function reset() {
  const db = getDb();
  await db.execute('DROP TABLE IF EXISTS presupuesto_items');
  await db.execute('DROP TABLE IF EXISTS presupuestos');
  await db.execute('DROP TABLE IF EXISTS prendas');
  await db.execute('DROP TABLE IF EXISTS disenos_dtf');
  await db.execute('DROP TABLE IF EXISTS packaging');
  await db.execute('DROP TABLE IF EXISTS configuracion');
  await migrate();
  await seed();
  console.log('✓ Base reseteada.');
}

const cmd = process.argv[2] ?? 'migrate';
if (cmd === 'migrate') void migrate();
else if (cmd === 'seed') void seed();
else if (cmd === 'reset') void reset();
else throw new Error(`Comando desconocido: ${cmd}`);