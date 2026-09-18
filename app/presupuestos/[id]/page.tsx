import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getConfig } from '@/lib/config';
import { formatCLP, formatFecha } from '@/lib/format';
import { ESTADOS, ESTADO_LABEL, type EstadoPresupuesto } from '@/lib/types';
import type { ItemPackagingSnapshot } from '@/lib/types';
import Badge from '@/components/Badge';
import { actualizarEstado, duplicarPresupuesto } from '../actions';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PresupuestoDetalle({ params }: Props) {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const db = getDb();
  const cfg = await getConfig();
  const p = (await db.execute('SELECT * FROM presupuestos WHERE id=?', [pid])).rows[0];
  if (!p) notFound();

  const items = (await db.execute('SELECT * FROM presupuesto_items WHERE presupuesto_id=? ORDER BY id', [pid])).rows;
  const estado = String(p.estado) as EstadoPresupuesto;

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">{String(p.numero)}</h1>
          <p className="page-sub">
            {formatFecha(String(p.fecha))} · {p.cliente ? String(p.cliente) : 'Sin cliente'}
          </p>
        </div>
        <div className="flex">
          <Badge estado={estado} />
          {estado === 'borrador' && (
            <Link href={`/calculadora?editar=${pid}`} className="btn btn-secondary btn-sm">Editar</Link>
          )}
          <form action={duplicarPresupuesto.bind(null, pid)}>
            <button className="btn btn-outline btn-sm" type="submit">Duplicar</button>
          </form>
        </div>
      </div>

      <div className="table-wrap mb-3">
        <table className="table">
          <thead>
            <tr>
              <th>Línea</th>
              <th className="num">Cant.</th>
              <th className="num">Prenda</th>
              <th className="num">DTF</th>
              <th className="num">Packaging</th>
              <th className="num">Subtotal u.</th>
              <th className="num">Precio u.</th>
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              let packs: ItemPackagingSnapshot[] = [];
              try {
                packs = JSON.parse(String(it.detalle_packaging ?? '[]')) as ItemPackagingSnapshot[];
              } catch {
                packs = [];
              }
              return (
                <tr key={String(it.id)}>
                  <td>
                    {String(it.descripcion)}
                    {it.diseno_desc ? <div className="muted" style={{ fontSize: '0.8rem' }}>DTF: {String(it.diseno_desc)}</div> : null}
                    {packs.length > 0 ? (
                      <div className="muted" style={{ fontSize: '0.8rem' }}>
                        Packaging: {packs.map((x) => x.nombre).join(', ')}
                      </div>
                    ) : null}
                  </td>
                  <td className="num">{Number(it.cantidad)}</td>
                  <td className="num">{formatCLP(Number(it.costo_prenda_cent))}</td>
                  <td className="num">{formatCLP(Number(it.costo_dtf_cent))}</td>
                  <td className="num">{formatCLP(Number(it.costo_packaging_cent))}</td>
                  <td className="num">{formatCLP(Number(it.subtotal_cent))}</td>
                  <td className="num">{formatCLP(Number(it.precio_unidad_cent))}</td>
                  <td className="num"><strong>{formatCLP(Number(it.total_linea_cent))}</strong></td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={8} className="empty">Este presupuesto no tiene líneas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Total</div>
          <div className="sum-row">
            <span className="muted">Margen de ganancia</span>
            <span>{cfg.markup_pct - 100}%</span>
          </div>
          <div className="sum-row">
            <span><strong>Total presupuesto</strong></span>
            <span className="sum-total">{formatCLP(Number(p.total_cent))}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Cambiar estado</div>
          <div className="flex">
            {ESTADOS.map((e) => (
              <form key={e} action={actualizarEstado.bind(null, pid, e)}>
                <button
                  type="submit"
                  className={`btn btn-sm ${e === estado ? 'btn-primary' : 'btn-outline'}`}
                  disabled={e === estado}
                >
                  {ESTADO_LABEL[e]}
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <Link href="/presupuestos" className="btn btn-outline">← Volver a presupuestos</Link>
      </div>
    </div>
  );
}