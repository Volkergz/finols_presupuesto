// Construcción de snapshots de presupuesto (congelación de costos).

import type { Client } from '@libsql/client';
import { getConfig } from './config';
import { costoDtfCentavos, costoPackagingCentavos, ceilToPeso } from './pricing';
import type { ItemPackagingSnapshot } from './types';

interface LineaEntrada {
  prendaId: number;
  disenoId?: number | null;
  packagingIds: number[];
  cantidad: number;
}

export interface SnapshotItem {
  descripcion: string;
  cantidad: number;
  prenda_id: number | null;
  diseno_id: number | null;
  packaging_id: number | null;
  diseno_desc: string | null;
  detalle_packaging: string;
  costo_prenda_cent: number;
  costo_dtf_cent: number;
  costo_packaging_cent: number;
  subtotal_cent: number;
  precio_unidad_cent: number;
  total_linea_cent: number;
  total_linea_peso: number; // mostrado
}

export async function construirSnapshot(
  db: Client,
  lineas: LineaEntrada[],
): Promise<{ items: SnapshotItem[]; totalPesos: number }> {
  const cfg = await getConfig();

  const items: SnapshotItem[] = [];
  for (const l of lineas) {
    const pre = await db.execute('SELECT * FROM prendas WHERE id=?', [l.prendaId]);
    const prendaRow = pre.rows[0];
    if (!prendaRow) return { items: [], totalPesos: 0 };

    const costoPrenda = Number(prendaRow.costo_unitario_cent);

    let costoDtf = 0;
    let disenoDesc: string | null = null;
    if (l.disenoId) {
      const d = (await db.execute('SELECT * FROM disenos_dtf WHERE id=?', [l.disenoId])).rows[0];
      if (d) {
        costoDtf = costoDtfCentavos(
          Number(d.costo_metro_cent),
          Number(d.ancho_cm),
          Number(d.alto_cm),
          cfg.ancho_rollo,
          cfg.alto_rollo,
        );
        disenoDesc = String(d.descripcion);
      }
    }

    let costoPackaging = 0;
    const detalle: ItemPackagingSnapshot[] = [];
    for (const pid of l.packagingIds) {
      const p = (await db.execute('SELECT * FROM packaging WHERE id=?', [pid])).rows[0];
      if (p) {
        const costo = costoPackagingCentavos(Number(p.costo_paquete_cent), Number(p.unidades_paquete));
        costoPackaging += costo;
        detalle.push({ id: pid, nombre: String(p.nombre), costo });
      }
    }

    const subtotal = costoPrenda + costoDtf + costoPackaging;
    const precioUnidad = Math.ceil((subtotal * cfg.markup_pct) / 100);
    const totalLineaCent = Math.ceil((subtotal * cfg.markup_pct * l.cantidad) / 100);
    const totalLineaPeso = ceilToPeso(totalLineaCent);
    const tipo = String(prendaRow.tipo ?? '');
    const talla = String(prendaRow.talla ?? '');
    const color = String(prendaRow.color ?? '');

    items.push({
      descripcion: `${tipo} - ${talla} - ${color}`.trim(),
      cantidad: l.cantidad,
      prenda_id: l.prendaId,
      diseno_id: l.disenoId ?? null,
      packaging_id: l.packagingIds[0] ?? null,
      diseno_desc: disenoDesc,
      detalle_packaging: JSON.stringify(detalle),
      costo_prenda_cent: costoPrenda,
      costo_dtf_cent: costoDtf,
      costo_packaging_cent: costoPackaging,
      subtotal_cent: subtotal,
      precio_unidad_cent: precioUnidad,
      total_linea_cent: totalLineaCent,
      total_linea_peso: totalLineaPeso,
    });
  }

  const totalPesos = items.reduce((acc, i) => acc + i.total_linea_peso, 0);
  return { items, totalPesos };
}

export async function siguienteCorrelativo(db: Client): Promise<number> {
  const r = await db.execute('SELECT COALESCE(MAX(correlativo), 0) AS max FROM presupuestos');
  return Number(r.rows[0]?.max ?? 0) + 1;
}

export const numeroFromCorrelativo = (n: number): string => `COT-${String(n).padStart(4, '0')}`;

export async function insertarItems(
  db: Client,
  presupuestoId: number,
  items: SnapshotItem[],
): Promise<void> {
  for (const it of items) {
    await db.execute(
      `INSERT INTO presupuesto_items
       (presupuesto_id, descripcion, cantidad, prenda_id, diseno_id, packaging_id, diseno_desc,
        detalle_packaging, costo_prenda_cent, costo_dtf_cent, costo_packaging_cent,
        subtotal_cent, precio_unidad_cent, total_linea_cent)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        presupuestoId,
        it.descripcion,
        it.cantidad,
        it.prenda_id,
        it.diseno_id,
        it.packaging_id,
        it.diseno_desc,
        it.detalle_packaging,
        it.costo_prenda_cent,
        it.costo_dtf_cent,
        it.costo_packaging_cent,
        it.subtotal_cent,
        it.precio_unidad_cent,
        it.total_linea_cent,
      ],
    );
  }
}