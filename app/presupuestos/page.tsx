import Link from 'next/link';
import { getDb } from '@/lib/db';
import { formatCLP, formatFecha } from '@/lib/format';
import { ESTADOS, ESTADO_LABEL, type EstadoPresupuesto } from '@/lib/types';
import Badge from '@/components/Badge';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic';

export default async function PresupuestosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const estado = typeof sp.estado === 'string' ? sp.estado : '';
  const desde = typeof sp.desde === 'string' ? sp.desde : '';
  const hasta = typeof sp.hasta === 'string' ? sp.hasta : '';

  const where: string[] = [];
  const args: (string | number)[] = [];
  if (q) {
    where.push('(numero LIKE ? OR COALESCE(cliente, \'\') LIKE ?)');
    args.push(`%${q}%`, `%${q}%`);
  }
  if (estado) {
    where.push('estado = ?');
    args.push(estado);
  }
  if (desde) {
    where.push('fecha >= ?');
    args.push(desde);
  }
  if (hasta) {
    where.push('fecha <= ?');
    args.push(hasta);
  }
  const sql = `SELECT * FROM presupuestos ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY correlativo DESC`;
  const rows = (await getDb().execute({ sql, args })).rows;

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Presupuestos</h1>
          <p className="page-sub">Historial de cotizaciones guardadas.</p>
        </div>
        <Link href="/calculadora" className="btn btn-primary">Nueva cotización</Link>
      </div>

      {typeof sp.error === 'string' && <div className="alert alert-error">{sp.error}</div>}

      <div className="card mb-3">
        <div className="card-title">Buscar y filtrar</div>
        <form method="get" action="/presupuestos" className="form-grid">
          <div className="field">
            <label className="label" htmlFor="fq">Buscar</label>
            <input className="input" id="fq" name="q" defaultValue={q} placeholder="Número o cliente" />
          </div>
          <div className="field">
            <label className="label" htmlFor="festado">Estado</label>
            <select className="select" id="festado" name="estado" defaultValue={estado}>
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="fdesde">Desde</label>
            <input className="input" type="date" id="fdesde" name="desde" defaultValue={desde} />
          </div>
          <div className="field">
            <label className="label" htmlFor="fhasta">Hasta</label>
            <input className="input" type="date" id="fhasta" name="hasta" defaultValue={hasta} />
          </div>
          <div className="field">
            <div className="label">&nbsp;</div>
            <div className="flex">
              <button className="btn btn-secondary" type="submit">Aplicar</button>
              <Link href="/presupuestos" className="btn btn-outline">Limpiar</Link>
            </div>
          </div>
        </form>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th className="num">Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const est = String(r.estado) as EstadoPresupuesto;
              return (
                <tr key={String(r.id)}>
                  <td><strong>{String(r.numero)}</strong></td>
                  <td>{formatFecha(String(r.fecha))}</td>
                  <td className="muted">{r.cliente ? String(r.cliente) : '—'}</td>
                  <td><Badge estado={est} /></td>
                  <td className="num">{formatCLP(Number(r.total_cent))}</td>
                  <td>
                    <Link href={`/presupuestos/${r.id}`} className="btn btn-secondary btn-sm">Ver</Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="empty">No hay presupuestos que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}