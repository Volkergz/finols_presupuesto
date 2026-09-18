'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { prendaCreate, prendaUpdate } from '@/lib/schemas';

const conError = (msg: string) => `/prendas?error=${encodeURIComponent(msg)}`;

export async function guardarPrenda(formData: FormData): Promise<void> {
  const idRaw = formData.get('id');
  const input = {
    tipo: formData.get('tipo'),
    talla: formData.get('talla'),
    color: formData.get('color'),
    proveedor: formData.get('proveedor') ?? '',
    costoPesos: Number(formData.get('costo')),
  };

  if (idRaw) {
    const parsed = prendaUpdate.safeParse({ ...input, id: Number(idRaw) });
    if (!parsed.success) redirect(conError(parsed.error.issues[0]?.message ?? 'Datos inválidos'));
    const d = parsed.data;
    await getDb().execute(
      'UPDATE prendas SET tipo=?, talla=?, color=?, proveedor=?, costo_unitario_cent=? WHERE id=?',
      [d.tipo, d.talla, d.color, d.proveedor || null, Math.round(d.costoPesos * 100), d.id],
    );
  } else {
    const parsed = prendaCreate.safeParse(input);
    if (!parsed.success) redirect(conError(parsed.error.issues[0]?.message ?? 'Datos inválidos'));
    const d = parsed.data;
    await getDb().execute(
      'INSERT INTO prendas (tipo, talla, color, proveedor, costo_unitario_cent) VALUES (?,?,?,?,?)',
      [d.tipo, d.talla, d.color, d.proveedor || null, Math.round(d.costoPesos * 100)],
    );
  }
  revalidatePath('/prendas');
  revalidatePath('/calculadora');
  redirect('/prendas');
}

export async function togglePrenda(id: number, activo: boolean): Promise<void> {
  await getDb().execute('UPDATE prendas SET activo=? WHERE id=?', [activo ? 1 : 0, id]);
  revalidatePath('/prendas');
  revalidatePath('/calculadora');
}