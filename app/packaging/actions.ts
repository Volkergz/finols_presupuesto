'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { packagingCreate, packagingUpdate } from '@/lib/schemas';

const conError = (msg: string) => `/packaging?error=${encodeURIComponent(msg)}`;

export async function guardarPackaging(formData: FormData): Promise<void> {
  const idRaw = formData.get('id');
  const input = {
    nombre: formData.get('nombre'),
    descripcion: formData.get('descripcion') ?? '',
    costoPaquetePesos: Number(formData.get('costoPaquete')),
    unidadesPaquete: Number(formData.get('unidades')),
  };

  if (idRaw) {
    const parsed = packagingUpdate.safeParse({ ...input, id: Number(idRaw) });
    if (!parsed.success) redirect(conError(parsed.error.issues[0]?.message ?? 'Datos inválidos'));
    const d = parsed.data;
    await getDb().execute(
      'UPDATE packaging SET nombre=?, descripcion=?, costo_paquete_cent=?, unidades_paquete=? WHERE id=?',
      [d.nombre, d.descripcion || null, Math.round(d.costoPaquetePesos * 100), d.unidadesPaquete, d.id],
    );
  } else {
    const parsed = packagingCreate.safeParse(input);
    if (!parsed.success) redirect(conError(parsed.error.issues[0]?.message ?? 'Datos inválidos'));
    const d = parsed.data;
    await getDb().execute(
      'INSERT INTO packaging (nombre, descripcion, costo_paquete_cent, unidades_paquete) VALUES (?,?,?,?)',
      [d.nombre, d.descripcion || null, Math.round(d.costoPaquetePesos * 100), d.unidadesPaquete],
    );
  }
  revalidatePath('/packaging');
  revalidatePath('/calculadora');
  redirect('/packaging');
}

export async function togglePackaging(id: number, activo: boolean): Promise<void> {
  await getDb().execute('UPDATE packaging SET activo=? WHERE id=?', [activo ? 1 : 0, id]);
  revalidatePath('/packaging');
  revalidatePath('/calculadora');
}