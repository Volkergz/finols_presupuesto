import Link from 'next/link';
import { getDb } from '@/lib/db';
import { getConfig } from '@/lib/config';
import { formatCLP, formatFecha } from '@/lib/format';
import type { EstadoPresupuesto } from '@/lib/types';
import Badge from '@/components/Badge';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const db = getDb();
  const cfg = await getConfig();

  const recientes = (await db.execute('SELECT * FROM presupuestos ORDER BY correlativo DESC LIMIT 8')).rows;
  const conteo = (await db.execute('SELECT COUNT(*) AS n FROM presupuestos')).rows[0];
  const pendientes = (await db.execute("SELECT COUNT(*) AS n FROM presupuestos WHERE estado IN ('borrador','enviado')")).rows[0];
  const aceptados = (await db.execute("SELECT COUNT(*) AS n FROM presupuestos WHERE estado='aceptado'")).rows[0];
  const total = conteo ? Number(conteo.n) : 0;

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">{cfg.negocio_nombre}</h1>
          <p className="page-sub">Gestión y presupuestación de poleras personalizadas.</p>
        </div>
        <Link href="/calculadora" className="btn btn-primary">Nueva cotización</Link>
      </div>

      <div className="grid grid-3 mb-3">
        <div className="card stat">
          <span className="stat-value">{total}</span>
          <span className="stat-label">Presupuestos totales</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{pendientes ? Number(pendientes.n) : 0}</span>
          <span className="stat-label">Pendientes (borrador/enviado)</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{aceptados ? Number(aceptados.n) : 0}</span>
          <span className="stat-label">Aceptados</span>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Presupuestos recientes</div>
        {recientes.length === 0 ? (
          <div className="empty">
            Aún no hay presupuestos. Crea el primero desde la <Link href="/calculadora">calculadora</Link>.
          </div>
        ) : (
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
                {recientes.map((r) => (
                  <tr key={String(r.id)}>
                    <td><strong>{String(r.numero)}</strong></td>
                    <td>{formatFecha(String(r.fecha))}</td>
                    <td className="muted">{r.cliente ? String(r.cliente) : '—'}</td>
                    <td><Badge estado={String(r.estado) as EstadoPresupuesto} /></td>
                    <td className="num">{formatCLP(Number(r.total_cent))}</td>
                    <td><Link href={`/presupuestos/${r.id}`} className="btn btn-secondary btn-sm">Ver</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}