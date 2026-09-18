'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { construirSnapshot, insertarItems, siguienteCorrelativo, numeroFromCorrelativo } from '@/lib/presupuesto';
import { ESTADOS, type EstadoPresupuesto } from '@/lib/types';
import { hoyISO } from '@/lib/format';

export async function actualizarEstado(id: number, estado: string): Promise<void> {
  if (ESTADOS.includes(estado as EstadoPresupuesto)) {
    await getDb().execute('UPDATE presupuestos SET estado=? WHERE id=?', [estado, id]);
  }
  revalidatePath('/presupuestos');
  revalidatePath(`/presupuestos/${id}`);
  revalidatePath('/');
}

export async function duplicarPresupuesto(id: number): Promise<void> {
  const db = getDb();
  const p = (await db.execute('SELECT * FROM presupuestos WHERE id=?', [id])).rows[0];
  if (!p) redirect('/presupuestos?error=Presupuesto%20no%20encontrado');

  const items = (await db.execute('SELECT * FROM presupuesto_items WHERE presupuesto_id=?', [id])).rows;
  const lineas = items.map((it) => {
    let packagingIds: number[] = [];
    if (it.detalle_packaging) {
      try {
        packagingIds = (JSON.parse(String(it.detalle_packaging)) as { id?: number }[])
          .map((x) => Number(x.id))
          .filter((n) => Number.isInteger(n) && n > 0);
      } catch {
        packagingIds = [];
      }
    }
    if (packagingIds.length === 0 && it.packaging_id != null) packagingIds = [Number(it.packaging_id)];
    return {
      prendaId: Number(it.prenda_id),
      disenoId: it.diseno_id != null ? Number(it.diseno_id) : null,
      packagingIds,
      cantidad: Number(it.cantidad),
    };
  });

  const snapshot = await construirSnapshot(db, lineas);
  if (snapshot.items.length === 0) {
    redirect('/presupuestos?error=' + encodeURIComponent('No se pudo reconstruir el presupuesto (hay prendas o diseños eliminados)'));
  }

  const correlativo = await siguienteCorrelativo(db);
  const numero = numeroFromCorrelativo(correlativo);
  const fecha = String(p!.fecha ?? hoyISO());
  const totalCent = snapshot.totalPesos * 100;
  const res = await db.execute(
    'INSERT INTO presupuestos (correlativo, numero, fecha, cliente, estado, total_cent) VALUES (?,?,?,?,?,?)',
    [correlativo, numero, fecha, p!.cliente != null ? String(p!.cliente) : null, 'borrador', totalCent],
  );
  const nuevoId = Number(res.lastInsertRowid);
  await insertarItems(db, nuevoId, snapshot.items);
  revalidatePath('/presupuestos');
  revalidatePath('/');
  redirect(`/presupuestos/${nuevoId}`);
}