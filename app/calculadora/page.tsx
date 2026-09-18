import { getDb } from '@/lib/db';
import { getConfig } from '@/lib/config';
import { costoDtfCentavos, costoPackagingCentavos } from '@/lib/pricing';
import type { LineaCalculo } from '@/lib/types';
import Calculadora, { type CatPrenda, type CatDiseno, type CatPackaging } from './Calculadora';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CalculadoraPage({ searchParams }: Props) {
  const sp = await searchParams;
  const editarId = typeof sp.editar === 'string' ? Number(sp.editar) : null;

  const cfg = await getConfig();
  const db = getDb();

  const prendas: CatPrenda[] = (
    await db.execute('SELECT * FROM prendas WHERE activo=1 ORDER BY tipo, talla, color')
  ).rows.map((r) => ({
    id: Number(r.id),
    tipo: String(r.tipo),
    talla: String(r.talla),
    color: String(r.color),
    costo: Number(r.costo_unitario_cent),
  }));

  const disenos: CatDiseno[] = (await db.execute('SELECT * FROM disenos_dtf WHERE activo=1 ORDER BY descripcion')).rows.map((r) => ({
    id: Number(r.id),
    descripcion: String(r.descripcion),
    costoUnitario: costoDtfCentavos(
      Number(r.costo_metro_cent),
      Number(r.ancho_cm),
      Number(r.alto_cm),
      cfg.ancho_rollo,
      cfg.alto_rollo,
    ),
  }));

  const packaging: CatPackaging[] = (await db.execute('SELECT * FROM packaging WHERE activo=1 ORDER BY nombre')).rows.map((r) => ({
    id: Number(r.id),
    nombre: String(r.nombre),
    costoUnitario: costoPackagingCentavos(Number(r.costo_paquete_cent), Number(r.unidades_paquete)),
  }));

  let clienteInicial = '';
  let lineasIniciales: LineaCalculo[] = [];

  if (editarId) {
    const p = (await db.execute('SELECT * FROM presupuestos WHERE id=?', [editarId])).rows[0];
    if (p && String(p.estado) === 'borrador') {
      clienteInicial = p.cliente ? String(p.cliente) : '';
      const items = (await db.execute('SELECT * FROM presupuesto_items WHERE presupuesto_id=? ORDER BY id', [editarId])).rows;
      let i = 0;
      lineasIniciales = items.map((it) => {
        let packagingIds: number[] = [];
        try {
          packagingIds = (JSON.parse(String(it.detalle_packaging ?? '[]')) as { id?: number }[])
            .map((x) => Number(x.id))
            .filter((n) => Number.isInteger(n) && n > 0);
        } catch {
          packagingIds = [];
        }
        if (packagingIds.length === 0 && it.packaging_id != null) packagingIds = [Number(it.packaging_id)];
        return {
          id: `edit${editarId}_${i++}`,
          prendaId: it.prenda_id != null ? Number(it.prenda_id) : null,
          disenoId: it.diseno_id != null ? Number(it.diseno_id) : null,
          packagingIds,
          cantidad: Number(it.cantidad),
        };
      });
    }
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Calculadora</h1>
          <p className="page-sub">
            Arma una cotización con una o varias líneas. Precio = (prenda + DTF + packaging) ×{' '}
            {cfg.markup_pct / 100}.
          </p>
        </div>
      </div>

      <Calculadora
        prendas={prendas}
        disenos={disenos}
        packaging={packaging}
        config={{ anchoRollo: cfg.ancho_rollo, altoRollo: cfg.alto_rollo, markupPct: cfg.markup_pct }}
        presupuestoId={editarId ?? undefined}
        clienteInicial={clienteInicial}
        lineasIniciales={lineasIniciales}
      />
    </div>
  );
}