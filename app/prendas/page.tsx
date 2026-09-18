import Link from 'next/link';
import { getDb } from '@/lib/db';
import { formatCLP } from '@/lib/format';
import { guardarPrenda, togglePrenda } from './actions';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic';

export default async function PrendasPage({ searchParams }: Props) {
  const sp = await searchParams;
  const editarId = typeof sp.editar === 'string' ? Number(sp.editar) : null;
  const q = typeof sp.q === 'string' ? sp.q.trim().toLowerCase() : '';
  const fTipo = typeof sp.tipo === 'string' ? sp.tipo : '';
  const fTalla = typeof sp.talla === 'string' ? sp.talla : '';
  const fColor = typeof sp.color === 'string' ? sp.color : '';
  const fProv = typeof sp.prov === 'string' ? sp.prov : '';

  const db = getDb();
  const res = await db.execute('SELECT * FROM prendas ORDER BY activo DESC, tipo, talla, color');
  const prendas = res.rows.map((r) => ({
    id: Number(r.id),
    tipo: String(r.tipo),
    talla: String(r.talla),
    color: String(r.color),
    proveedor: r.proveedor ? String(r.proveedor) : '',
    costo: Number(r.costo_unitario_cent),
    activo: Number(r.activo) === 1,
  }));

  const editando = prendas.find((p) => p.id === editarId) ?? null;

  const filtradas = prendas.filter((p) => {
    if (q && !`${p.tipo} ${p.talla} ${p.color} ${p.proveedor}`.toLowerCase().includes(q)) return false;
    if (fTipo && p.tipo !== fTipo) return false;
    if (fTalla && p.talla !== fTalla) return false;
    if (fColor && p.color !== fColor) return false;
    if (fProv && p.proveedor !== fProv) return false;
    return true;
  });

  const opciones = (campo: 'tipo' | 'talla' | 'color' | 'proveedor') =>
    Array.from(new Set(prendas.map((p) => p[campo]).filter(Boolean))).sort();

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Prendas base</h1>
          <p className="page-sub">Catálogo de prendas utilizadas en los cálculos.</p>
        </div>
        {editarId && (
          <Link href="/prendas" className="btn btn-outline btn-sm">
            Cancelar edición
          </Link>
        )}
      </div>

      {typeof sp.error === 'string' && <div className="alert alert-error">{sp.error}</div>}

      <div className="grid grid-3 mb-3">
        <div className="card">
          <div className="card-title">{editando ? `Editar: ${editando.tipo} ${editando.talla}` : 'Nueva prenda'}</div>
          <form action={guardarPrenda} className="form-grid">
            {editando && <input type="hidden" name="id" value={editando.id} />}
            <div className="field">
              <label className="label" htmlFor="tipo">Tipo de prenda</label>
              <input className="input" id="tipo" name="tipo" required defaultValue={editando?.tipo} placeholder="Polera" />
            </div>
            <div className="field">
              <label className="label" htmlFor="talla">Talla</label>
              <input className="input" id="talla" name="talla" required defaultValue={editando?.talla} placeholder="M" />
            </div>
            <div className="field">
              <label className="label" htmlFor="color">Color</label>
              <input className="input" id="color" name="color" required defaultValue={editando?.color} placeholder="Negro" />
            </div>
            <div className="field">
              <label className="label" htmlFor="proveedor">Proveedor</label>
              <input className="input" id="proveedor" name="proveedor" defaultValue={editando?.proveedor} placeholder="Opcional" />
            </div>
            <div className="field">
              <label className="label" htmlFor="costo">Costo unitario ($)</label>
              <input
                className="input"
                id="costo"
                name="costo"
                type="number"
                min={0}
                step={1}
                required
                defaultValue={editando != null ? editando.costo / 100 : ''}
                placeholder="8990"
              />
            </div>
            <div className="field">
              <div className="label">&nbsp;</div>
              <button className="btn btn-primary" type="submit">
                {editando ? 'Guardar cambios' : 'Agregar prenda'}
              </button>
            </div>
          </form>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-title">Buscar y filtrar</div>
          <form method="get" action="/prendas" className="form-grid">
            <div className="field">
              <label className="label" htmlFor="pq">Buscar</label>
              <input className="input" id="pq" name="q" defaultValue={q} placeholder="Tipo, talla, color o proveedor" />
            </div>
            <div className="grid grid-2" style={{ gap: '14px' }}>
              <div className="field">
                <label className="label" htmlFor="ptipo">Tipo</label>
                <select className="select" id="ptipo" name="tipo" defaultValue={fTipo}>
                  <option value="">Todos</option>
                  {opciones('tipo').map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="ptalla">Talla</label>
                <select className="select" id="ptalla" name="talla" defaultValue={fTalla}>
                  <option value="">Todas</option>
                  {opciones('talla').map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="pcolor">Color</label>
                <select className="select" id="pcolor" name="color" defaultValue={fColor}>
                  <option value="">Todos</option>
                  {opciones('color').map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="pprov">Proveedor</label>
                <select className="select" id="pprov" name="prov" defaultValue={fProv}>
                  <option value="">Todos</option>
                  {opciones('proveedor').map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <button className="btn btn-secondary" type="submit">Aplicar filtros</button>
            </div>
          </form>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Prenda</th>
              <th>Talla</th>
              <th>Color</th>
              <th>Proveedor</th>
              <th className="num">Costo unitario</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((p) => (
              <tr key={p.id}>
                <td>{p.tipo}</td>
                <td>{p.talla}</td>
                <td>{p.color}</td>
                <td className="muted">{p.proveedor || '—'}</td>
                <td className="num">{formatCLP(p.costo)}</td>
                <td>
                  {p.activo ? <span className="badge badge-aceptado">Activa</span> : <span className="badge badge-cancelado">Inactiva</span>}
                </td>
                <td>
                  <div className="flex">
                    <Link href={`/prendas?editar=${p.id}`} className="btn btn-secondary btn-sm">Editar</Link>
                    <form
                      action={togglePrenda.bind(null, p.id, !p.activo)}
                      aria-label={p.activo ? 'Desactivar prenda' : 'Activar prenda'}
                    >
                      <button className="btn btn-outline btn-sm" type="submit">
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">No hay prendas que coincidan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}