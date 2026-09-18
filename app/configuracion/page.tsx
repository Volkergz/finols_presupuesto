import { getConfig } from '@/lib/config';
import { guardarConfig } from './actions';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ConfigPage({ searchParams }: Props) {
  const sp = await searchParams;
  const cfg = await getConfig();

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-sub">Parámetros de cálculo y datos del negocio.</p>
        </div>
      </div>

      {typeof sp.error === 'string' && <div className="alert alert-error">{sp.error}</div>}
      {sp.ok && <div className="alert alert-ok">Configuración guardada.</div>}

      <form action={guardarConfig}>
        <div className="card mb-3">
          <div className="card-title">Parámetros de cálculo</div>
          <div className="form-grid">
            <div className="field">
              <label className="label" htmlFor="ancho_rollo">Ancho del rollo DTF (cm)</label>
              <input className="input" id="ancho_rollo" name="ancho_rollo" type="number" min={1} step={1} required defaultValue={cfg.ancho_rollo} />
            </div>
            <div className="field">
              <label className="label" htmlFor="alto_rollo">Alto del rollo DTF (cm)</label>
              <input className="input" id="alto_rollo" name="alto_rollo" type="number" min={1} step={1} required defaultValue={cfg.alto_rollo} />
            </div>
            <div className="field">
              <label className="label" htmlFor="markup_pct">Markup sobre costo (%)</label>
              <input className="input" id="markup_pct" name="markup_pct" type="number" min={1} max={500} step={1} required defaultValue={cfg.markup_pct} />
              <span className="muted" style={{ fontSize: '0.8rem' }}>
                Factor aplicado al subtotal: × {(cfg.markup_pct / 100).toLocaleString('es-CL')}
              </span>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-title">Datos del negocio</div>
          <div className="form-grid">
            <div className="field">
              <label className="label" htmlFor="negocio_nombre">Nombre</label>
              <input className="input" id="negocio_nombre" name="negocio_nombre" required defaultValue={cfg.negocio_nombre} />
            </div>
            <div className="field">
              <label className="label" htmlFor="negocio_telefono">Teléfono</label>
              <input className="input" id="negocio_telefono" name="negocio_telefono" defaultValue={cfg.negocio_telefono} />
            </div>
            <div className="field">
              <label className="label" htmlFor="negocio_email">Email</label>
              <input className="input" id="negocio_email" name="negocio_email" type="email" defaultValue={cfg.negocio_email} />
            </div>
            <div className="field">
              <label className="label" htmlFor="negocio_direccion">Dirección</label>
              <input className="input" id="negocio_direccion" name="negocio_direccion" defaultValue={cfg.negocio_direccion} />
            </div>
          </div>
        </div>

        <button className="btn btn-primary" type="submit">Guardar configuración</button>
      </form>

      <div className="card mt-3">
        <div className="card-title">Respaldo y exportación</div>
        <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
          Descarga la información completa del negocio. El respaldo JSON o SQL
          incluye catálogos y presupuestos guardados.
        </p>
        <div className="flex">
          <a className="btn btn-secondary" href="/api/respaldo?formato=json">Descargar JSON</a>
          <a className="btn btn-outline" href="/api/respaldo?formato=sql">Descargar SQL</a>
        </div>
      </div>

      <div className="card mt-3">
        <div className="card-title">Fórmulas vigentes</div>
        <div className="kv">
          <span>Costo DTF</span>
          <span className="num">costo metro × ancho × alto ÷ ({cfg.ancho_rollo} × {cfg.alto_rollo})</span>
          <span>Costo packaging</span>
          <span className="num">costo paquete ÷ unidades por paquete</span>
          <span>Subtotal</span>
          <span className="num">prenda + DTF + packaging</span>
          <span>Precio de venta</span>
          <span className="num">subtotal × {cfg.markup_pct / 100} (redondeado hacia arriba)</span>
        </div>
      </div>
    </div>
  );
}