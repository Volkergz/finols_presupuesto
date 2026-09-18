// Cliente de base de datos único. Producción: Turso (TURSO_URL). Desarrollo: archivo SQLite local.

import { createClient, type Client } from '@libsql/client';

let db: Client | null = null;

export function getDb(): Client {
  if (db) return db;
  const url = process.env.TURSO_URL ?? process.env.DATABASE_URL ?? 'file:local.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;
  db = authToken ? createClient({ url, authToken }) : createClient({ url });
  return db;
}

export const dineroPesosACentavos = (pesos: number): number => Math.round(pesos * 100);