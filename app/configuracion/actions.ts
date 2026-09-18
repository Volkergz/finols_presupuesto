'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { configSchema } from '@/lib/schemas';

export async function guardarConfig(formData: FormData): Promise<void> {
  const input = {
    ancho_rollo: Number(formData.get('ancho_rollo')),
    alto_rollo: Number(formData.get('alto_rollo')),
    markup_pct: Number(formData.get('markup_pct')),
    negocio_nombre: formData.get('negocio_nombre'),
    negocio_direccion: formData.get('negocio_direccion') ?? '',
    negocio_telefono: formData.get('negocio_telefono') ?? '',
    negocio_email: formData.get('negocio_email') ?? '',
  };
  const parsed = configSchema.safeParse(input);
  if (!parsed.success) {
    redirect(`/configuracion?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'Datos inválidos')}`);
  }
  const d = parsed.data;
  const db = getDb();
  const filas: [string, string][] = [
    ['ancho_rollo', String(d.ancho_rollo)],
    ['alto_rollo', String(d.alto_rollo)],
    ['markup_pct', String(d.markup_pct)],
    ['negocio_nombre', d.negocio_nombre],
    ['negocio_direccion', d.negocio_direccion ?? ''],
    ['negocio_telefono', d.negocio_telefono ?? ''],
    ['negocio_email', d.negocio_email ?? ''],
  ];
  for (const [k, v] of filas) await db.execute('INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?,?)', [k, v]);
  revalidatePath('/configuracion');
  revalidatePath('/calculadora');
  redirect('/configuracion?ok=1');
}