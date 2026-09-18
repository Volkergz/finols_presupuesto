import Link from 'next/link';
import { getDb } from '@/lib/db';
import { getConfig } from '@/lib/config';
import { formatCLP } from '@/lib/format';
import { costoDtfCentavos } from '@/lib/pricing';
import { guardarDiseno, toggleDiseno } from './actions';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic';

export default async function DtfPage({ searchParams }: Props) {
  const sp = await searchParams;
  const editarId = typeof sp.editar === 'string' ? Number(sp.editar) : null;
  const q = typeof sp.q === 'string' ? sp.q.trim().toLowerCase() : '';

  const cfg = await getConfig();
  const db = getDb();
  const res = await db.execute('SELECT * FROM disenos_dtf ORDER BY activo DESC, descripcion');
  const disenos = res.rows.map((r) => {
    const ancho = Number(r.ancho_cm);
    const alto = Number(r.alto_cm);
    const costoMetro = Number(r.costo_metro_cent);
    return {
      id: Number(r.id),
      descripcion: String(r.descripcion),
      ancho,
      alto,
      costoMetro,
      costoUnitario: costoDtfCentavos(costoMetro, ancho, alto, cfg.ancho_rollo, cfg.alto_rollo),
      activo: Number(r.activo) === 1,
    };
  });

  const editando = disenos.find((d) => d.id === editarId) ?? null;
  const filtrados = disenos.filter((d) => q && !d.descripcion.toLowerCase().includes(q));

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Diseños DTF</h1>
          <p className="page-sub">
            Costo de estampado calculado con rollo de {cfg.ancho_rollo} × {cfg.alto_rollo} cm.
          </p>
        </div>
        {editarId && (
          <Link href="/dtf" className="btn btn-outline btn-sm">Cancelar edición</Link>
        )}
      </div>

      {typeof sp.error === 'string' && <div className="alert alert-error">{sp.error}</div>}

      <div className="grid grid-3 mb-3">
        <div className="card">
          <div className="card-title">{editando ? `Editar: ${editando.descripcion}` : 'Nuevo diseño'}</div>
          <form action={guardarDiseno} className="form-grid">
            {editando && <input type="hidden" name="id" value={editando.id} />}
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="descripcion">Descripción del diseño</label>
              <input className="input" id="descripcion" name="descripcion" required defaultValue={editando?.descripcion} placeholder="Pasaporte" />
            </div>
            <div className="field">
              <label className="label" htmlFor="ancho">Ancho (cm)</label>
              <input className="input" id="ancho" name="ancho" type="number" min={1} step={1} required defaultValue={editando?.ancho} />
            </div>
            <div className="field">
              <label className="label" htmlFor="alto">Alto (cm)</label>
              <input className="input" id="alto" name="alto" type="number" min={1} step={1} required defaultValue={editando?.alto} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="costoMetro">Costo del metro de DTF ($)</label>
              <input className="input" id="costoMetro" name="costoMetro" type="number" min={0} step={1} required defaultValue={editando != null ? editando.costoMetro / 100 : ''} placeholder="15000" />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <button className="btn btn-primary" type="submit">{editando ? 'Guardar cambios' : 'Agregar diseño'}</button>
            </div>
          </form>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-title">Buscar</div>
          <form method="get" action="/dtf" className="flex">
            <input className="input" name="q" defaultValue={q} placeholder="Descripción del diseño" style={{ maxWidth: 320 }} />
            <button className="btn btn-secondary" type="submit">Buscar</button>
            {q && <Link href="/dtf" className="btn btn-outline btn-sm">Limpiar</Link>}
          </form>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Diseño</th>
              <th className="num">Ancho</th>
              <th className="num">Alto</th>
              <th>Costo del metro</th>
              <th>Costo estampado unitario</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(q ? filtrados : disenos).map((d) => (
              <tr key={d.id}>
                <td>{d.descripcion}</td>
                <td className="num">{d.ancho} cm</td>
                <td className="num">{d.alto} cm</td>
                <td>{formatCLP(d.costoMetro)}</td>
                <td>{formatCLP(d.costoUnitario)}</td>
                <td>
                  {d.activo ? <span className="badge badge-aceptado">Activo</span> : <span className="badge badge-cancelado">Inactivo</span>}
                </td>
                <td>
                  <div className="flex">
                    <Link href={`/dtf?editar=${d.id}`} className="btn btn-secondary btn-sm">Editar</Link>
                    <form action={toggleDiseno.bind(null, d.id, !d.activo)}>
                      <button className="btn btn-outline btn-sm" type="submit">{d.activo ? 'Desactivar' : 'Activar'}</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {disenos.length === 0 && (
              <tr><td colSpan={7} className="empty">Aún no hay diseños registrados.</td></tr>
            )}
            {q && filtrados.length === 0 && (
              <tr><td colSpan={7} className="empty">Sin resultados para la búsqueda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}