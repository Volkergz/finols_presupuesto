'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { disenoCreate, disenoUpdate } from '@/lib/schemas';

const conError = (msg: string) => `/dtf?error=${encodeURIComponent(msg)}`;

export async function guardarDiseno(formData: FormData): Promise<void> {
  const idRaw = formData.get('id');
  const input = {
    descripcion: formData.get('descripcion'),
    anchoCm: Number(formData.get('ancho')),
    altoCm: Number(formData.get('alto')),
    costoMetroPesos: Number(formData.get('costoMetro')),
  };

  if (idRaw) {
    const parsed = disenoUpdate.safeParse({ ...input, id: Number(idRaw) });
    if (!parsed.success) redirect(conError(parsed.error.issues[0]?.message ?? 'Datos inválidos'));
    const d = parsed.data;
    await getDb().execute(
      'UPDATE disenos_dtf SET descripcion=?, ancho_cm=?, alto_cm=?, costo_metro_cent=? WHERE id=?',
      [d.descripcion, d.anchoCm, d.altoCm, Math.round(d.costoMetroPesos * 100), d.id],
    );
  } else {
    const parsed = disenoCreate.safeParse(input);
    if (!parsed.success) redirect(conError(parsed.error.issues[0]?.message ?? 'Datos inválidos'));
    const d = parsed.data;
    await getDb().execute(
      'INSERT INTO disenos_dtf (descripcion, ancho_cm, alto_cm, costo_metro_cent) VALUES (?,?,?,?)',
      [d.descripcion, d.anchoCm, d.altoCm, Math.round(d.costoMetroPesos * 100)],
    );
  }
  revalidatePath('/dtf');
  revalidatePath('/calculadora');
  redirect('/dtf');
}

export async function toggleDiseno(id: number, activo: boolean): Promise<void> {
  await getDb().execute('UPDATE disenos_dtf SET activo=? WHERE id=?', [activo ? 1 : 0, id]);
  revalidatePath('/dtf');
  revalidatePath('/calculadora');
}