'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { construirSnapshot, insertarItems, siguienteCorrelativo, numeroFromCorrelativo } from '@/lib/presupuesto';
import { presupuestoCreateSchema } from '@/lib/schemas';
import { hoyISO } from '@/lib/format';

export async function crearPresupuesto(input: unknown) {
  const parsed = presupuestoCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const db = getDb();
  const snapshot = await construirSnapshot(db, parsed.data.lineas);
  if (snapshot.items.length === 0) return { ok: false as const, error: 'No se pudo construir el presupuesto' };

  const correlativo = await siguienteCorrelativo(db);
  const numero = numeroFromCorrelativo(correlativo);
  const totalCent = snapshot.totalPesos * 100;
  const res = await db.execute(
    'INSERT INTO presupuestos (correlativo, numero, fecha, cliente, estado, total_cent) VALUES (?,?,?,?,?,?)',
    [correlativo, numero, hoyISO(), parsed.data.cliente || null, 'borrador', totalCent],
  );
  const nuevoId = Number(res.lastInsertRowid);
  await insertarItems(db, nuevoId, snapshot.items);
  revalidatePath('/presupuestos');
  revalidatePath('/');
  return { ok: true as const, id: nuevoId };
}

export async function actualizarPresupuesto(id: number, input: unknown) {
  const parsed = presupuestoCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const db = getDb();
  const p = (await db.execute('SELECT * FROM presupuestos WHERE id=?', [id])).rows[0];
  if (!p) return { ok: false as const, error: 'Presupuesto no encontrado' };
  if (String(p.estado) !== 'borrador') {
    return { ok: false as const, error: 'Solo se puede editar un presupuesto en estado Borrador' };
  }

  const snapshot = await construirSnapshot(db, parsed.data.lineas);
  if (snapshot.items.length === 0) return { ok: false as const, error: 'No se pudo construir el presupuesto' };

  const totalCent = snapshot.totalPesos * 100;
  await db.execute('UPDATE presupuestos SET cliente=?, total_cent=? WHERE id=?', [
    parsed.data.cliente || null,
    totalCent,
    id,
  ]);
  await db.execute('DELETE FROM presupuesto_items WHERE presupuesto_id=?', [id]);
  await insertarItems(db, id, snapshot.items);
  revalidatePath('/presupuestos');
  revalidatePath(`/presupuestos/${id}`);
  revalidatePath('/');
  return { ok: true as const, id };
}