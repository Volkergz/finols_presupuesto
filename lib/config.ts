// Lectura de configuración tipada.

import { getDb } from './db';
import type { Config } from './types';

export const CLAVES = [
  'ancho_rollo',
  'alto_rollo',
  'markup_pct',
  'negocio_nombre',
  'negocio_direccion',
  'negocio_telefono',
  'negocio_email',
  'moneda',
] as const;

export const DEFAULTS: Record<(typeof CLAVES)[number], string> = {
  ancho_rollo: '100',
  alto_rollo: '57',
  markup_pct: '130',
  negocio_nombre: 'Mi Negocio',
  negocio_direccion: '',
  negocio_telefono: '',
  negocio_email: '',
  moneda: 'CLP',
};

export async function getConfig(): Promise<Config> {
  const db = getDb();
  const res = await db.execute('SELECT clave, valor FROM configuracion');
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of res.rows) map[String(row.clave)] = String(row.valor ?? '');

  const num = (k: string, fb: number) => {
    const v = Number(map[k]);
    return Number.isFinite(v) && v > 0 ? v : fb;
  };

  return {
    ancho_rollo: num('ancho_rollo', 100),
    alto_rollo: num('alto_rollo', 57),
    markup_pct: num('markup_pct', 130),
    negocio_nombre: map.negocio_nombre || DEFAULTS.negocio_nombre,
    negocio_direccion: map.negocio_direccion,
    negocio_telefono: map.negocio_telefono,
    negocio_email: map.negocio_email,
    moneda: 'CLP',
  };
}