import Link from 'next/link';
import { getDb } from '@/lib/db';
import { formatCLP } from '@/lib/format';
import { costoPackagingCentavos } from '@/lib/pricing';
import { guardarPackaging, togglePackaging } from './actions';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic';

export default async function PackagingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const editarId = typeof sp.editar === 'string' ? Number(sp.editar) : null;
  const q = typeof sp.q === 'string' ? sp.q.trim().toLowerCase() : '';

  const db = getDb();
  const res = await db.execute('SELECT * FROM packaging ORDER BY activo DESC, nombre');
  const items = res.rows.map((r) => {
    const costoPaquete = Number(r.costo_paquete_cent);
    const unidades = Number(r.unidades_paquete);
    return {
      id: Number(r.id),
      nombre: String(r.nombre),
      descripcion: r.descripcion ? String(r.descripcion) : '',
      costoPaquete,
      unidades,
      costoUnitario: costoPackagingCentavos(costoPaquete, unidades),
      activo: Number(r.activo) === 1,
    };
  });

  const editando = items.find((i) => i.id === editarId) ?? null;
  const filtrados = items.filter((i) => q && !`${i.nombre} ${i.descripcion}`.toLowerCase().includes(q));

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Packaging</h1>
          <p className="page-sub">Insumos de despacho: bolsas, etiquetas, stickers.</p>
        </div>
        {editarId && <Link href="/packaging" className="btn btn-outline btn-sm">Cancelar edición</Link>}
      </div>

      {typeof sp.error === 'string' && <div className="alert alert-error">{sp.error}</div>}

      <div className="grid grid-3 mb-3">
        <div className="card">
          <div className="card-title">{editando ? `Editar: ${editando.nombre}` : 'Nuevo elemento'}</div>
          <form action={guardarPackaging} className="form-grid">
            {editando && <input type="hidden" name="id" value={editando.id} />}
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="nombre">Nombre</label>
              <input className="input" id="nombre" name="nombre" required defaultValue={editando?.nombre} placeholder="Bolsa Transparente" />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="label" htmlFor="descripcion">Descripción</label>
              <input className="input" id="descripcion" name="descripcion" defaultValue={editando?.descripcion} placeholder="Opcional" />
            </div>
            <div className="field">
              <label className="label" htmlFor="costoPaquete">Costo del paquete ($)</label>
              <input className="input" id="costoPaquete" name="costoPaquete" type="number" min={0} step={1} required defaultValue={editando != null ? editando.costoPaquete / 100 : ''} placeholder="1990" />
            </div>
            <div className="field">
              <label className="label" htmlFor="unidades">Unidades por paquete</label>
              <input className="input" id="unidades" name="unidades" type="number" min={1} step={1} required defaultValue={editando?.unidades} placeholder="50" />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              {editando && (
                <p className="muted mb-1" style={{ fontSize: '0.85rem' }}>
                  Costo unitario calculado: {formatCLP(editando.costoUnitario)}
                </p>
              )}
              <button className="btn btn-primary" type="submit">{editando ? 'Guardar cambios' : 'Agregar elemento'}</button>
            </div>
          </form>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-title">Buscar</div>
          <form method="get" action="/packaging" className="flex">
            <input className="input" name="q" defaultValue={q} placeholder="Nombre o descripción" style={{ maxWidth: 320 }} />
            <button className="btn btn-secondary" type="submit">Buscar</button>
            {q && <Link href="/packaging" className="btn btn-outline btn-sm">Limpiar</Link>}
          </form>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th className="num">Costo paquete</th>
              <th className="num">Unidades</th>
              <th>Costo unitario</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(q ? filtrados : items).map((i) => (
              <tr key={i.id}>
                <td>{i.nombre}</td>
                <td className="muted">{i.descripcion || '—'}</td>
                <td className="num">{formatCLP(i.costoPaquete)}</td>
                <td className="num">{i.unidades}</td>
                <td>{formatCLP(i.costoUnitario)}</td>
                <td>
                  {i.activo ? <span className="badge badge-aceptado">Activo</span> : <span className="badge badge-cancelado">Inactivo</span>}
                </td>
                <td>
                  <div className="flex">
                    <Link href={`/packaging?editar=${i.id}`} className="btn btn-secondary btn-sm">Editar</Link>
                    <form action={togglePackaging.bind(null, i.id, !i.activo)}>
                      <button className="btn btn-outline btn-sm" type="submit">{i.activo ? 'Desactivar' : 'Activar'}</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={7} className="empty">Aún no hay elementos de packaging.</td></tr>
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