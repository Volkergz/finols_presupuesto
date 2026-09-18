import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { exportarJSON, exportarSQL } from '@/lib/respaldo';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const formato = new URL(request.url).searchParams.get('formato') === 'sql' ? 'sql' : 'json';
  const fecha = new Date().toISOString().slice(0, 10);
  const db = getDb();

  const descarga = (body: string, tipo: string, nombre: string) =>
    new Response(body, {
      headers: {
        'Content-Type': `${tipo}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${nombre}"`,
        'Content-Length': String(Buffer.byteLength(body, 'utf8')),
      },
    });

  try {
    if (formato === 'sql') {
      return descarga(await exportarSQL(db), 'application/sql', `finols-respaldo-${fecha}.sql`);
    }
    const json = JSON.stringify(await exportarJSON(db), null, 2);
    return descarga(json, 'application/json', `finols-respaldo-${fecha}.json`);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Error al exportar' },
      { status: 500 },
    );
  }
}