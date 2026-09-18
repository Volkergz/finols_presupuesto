'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  subtotalCentavos,
  totalLineaPeso,
  precioExactoUnidadCentavos,
} from '@/lib/pricing';
import { formatCLP } from '@/lib/format';
import type { LineaCalculo } from '@/lib/types';
import { crearPresupuesto, actualizarPresupuesto } from './actions';
import Combobox from '@/components/Combobox';

export interface CatPrenda {
  id: number;
  tipo: string;
  talla: string;
  color: string;
  costo: number;
}
export interface CatDiseno {
  id: number;
  descripcion: string;
  costoUnitario: number;
}
export interface CatPackaging {
  id: number;
  nombre: string;
  costoUnitario: number;
}
export interface ConfigCalc {
  anchoRollo: number;
  altoRollo: number;
  markupPct: number;
}

interface Props {
  prendas: CatPrenda[];
  disenos: CatDiseno[];
  packaging: CatPackaging[];
  config: ConfigCalc;
  presupuestoId?: number;
  clienteInicial?: string;
  lineasIniciales?: LineaCalculo[];
}

let seq = 0;
const nuevaLinea = (): LineaCalculo => ({
  id: `l${Date.now()}_${seq++}`,
  prendaId: null,
  disenoId: null,
  packagingIds: [],
  cantidad: 1,
});

export default function Calculadora({
  prendas,
  disenos,
  packaging,
  config,
  presupuestoId,
  clienteInicial = '',
  lineasIniciales = [],
}: Props) {
  const router = useRouter();
  const [lineas, setLineas] = useState<LineaCalculo[]>(
    lineasIniciales.length > 0 ? lineasIniciales : [nuevaLinea()],
  );
  const [cliente, setCliente] = useState(clienteInicial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const prendaMap = useMemo(() => new Map(prendas.map((p) => [p.id, p])), [prendas]);
  const disenoMap = useMemo(() => new Map(disenos.map((d) => [d.id, d])), [disenos]);
  const packMap = useMemo(() => new Map(packaging.map((p) => [p.id, p])), [packaging]);

  // Cálculo por línea
  const calculadas = useMemo(
    () =>
      lineas.map((l) => {
        const prenda = l.prendaId ? prendaMap.get(l.prendaId) : undefined;
        const diseno = l.disenoId ? disenoMap.get(l.disenoId) : undefined;
        const costoPrenda = prenda?.costo ?? 0;
        const costoDtf = diseno ? diseno.costoUnitario : 0;
        let costoPackaging = 0;
        const packs: CatPackaging[] = [];
        for (const pid of l.packagingIds) {
          const p = packMap.get(pid);
          if (p) {
            costoPackaging += p.costoUnitario;
            packs.push(p);
          }
        }
        const subtotal = subtotalCentavos(costoPrenda, costoDtf, costoPackaging);
        const cantidad = Math.max(1, Math.floor(l.cantidad || 0));
        const totalLinea = totalLineaPeso(subtotal, cantidad, config.markupPct);
        const precioExactoUnidad = precioExactoUnidadCentavos(subtotal, config.markupPct);
        return {
          linea: l,
          prenda,
          diseno,
          packs,
          costoPrenda,
          costoDtf,
          costoPackaging,
          subtotal,
          cantidad,
          precioExactoUnidad,
          totalLinea,
        };
      }),
    [lineas, prendaMap, disenoMap, packMap, config.markupPct],
  );

  const total = calculadas.reduce((acc, c) => (c.prenda ? acc + c.totalLinea : acc), 0);
  const lineasValidas = calculadas.filter((c) => c.prenda);

  const setLinea = (id: string, patch: Partial<LineaCalculo>) => {
    setLineas((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const togglePack = (linea: LineaCalculo, pid: number) => {
    const on = linea.packagingIds.includes(pid);
    setLinea(linea.id, {
      packagingIds: on ? linea.packagingIds.filter((x) => x !== pid) : [...linea.packagingIds, pid],
    });
  };

  const guardar = () => {
    setError(null);
    const payload = {
      cliente,
      lineas: lineasValidas.map((c) => ({
        prendaId: c.linea.prendaId as number,
        disenoId: c.linea.disenoId,
        packagingIds: c.linea.packagingIds,
        cantidad: c.cantidad,
      })),
    };
    if (payload.lineas.length === 0) {
      setError('Agrega al menos una línea con una prenda seleccionada.');
      return;
    }
    startTransition(async () => {
      const res = presupuestoId
        ? await actualizarPresupuesto(presupuestoId, payload)
        : await crearPresupuesto(payload);
      if (!res.ok) {
        setError(res.error ?? 'No se pudo guardar el presupuesto.');
        return;
      }
      router.push(`/presupuestos/${res.id}`);
      router.refresh();
    });
  };

  if (prendas.length === 0) {
    return (
      <div className="card">
        <div className="empty">
          No hay prendas activas. Agrega prendas en el módulo <strong>Prendas</strong> para calcular.
        </div>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
      {error && <div className="alert alert-error">{error}</div>}

      {calculadas.map((c, idx) => (
        <div className="line" key={c.linea.id}>
          <div className="line-header">
            <strong style={{ color: 'var(--color-primary)' }}>Producto {idx + 1}</strong>
            {lineas.length > 1 && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => setLineas((ls) => ls.filter((l) => l.id !== c.linea.id))}
              >
                Eliminar
              </button>
            )}
          </div>

          <div className="form-grid">
            <div className="field">
              <Combobox
                id={`prenda-${c.linea.id}`}
                label="Prenda"
                value={c.linea.prendaId}
                options={prendas.map((p) => ({
                  id: p.id,
                  label: `${p.tipo} · ${p.talla} · ${p.color} (${formatCLP(p.costo)})`,
                }))}
                placeholder="Busca la prenda…"
                onChange={(prendaid) => setLinea(c.linea.id, { prendaId: prendaid })}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor={`cantidad-${c.linea.id}`}>Cantidad</label>
              <input
                className="input"
                id={`cantidad-${c.linea.id}`}
                type="number"
                min={1}
                step={1}
                value={c.linea.cantidad}
                onChange={(e) => setLinea(c.linea.id, { cantidad: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <Combobox
                id={`diseno-${c.linea.id}`}
                label="Diseño DTF"
                value={c.linea.disenoId}
                options={disenos.map((d) => ({
                  id: d.id,
                  label: `${d.descripcion} (${formatCLP(d.costoUnitario)})`,
                }))}
                placeholder="Busca el diseño…"
                onChange={(disenoid) => setLinea(c.linea.id, { disenoId: disenoid })}
              />
            </div>
          </div>

          {packaging.length > 0 && (
            <div className="mt-2">
              <div className="label mb-1">Packaging</div>
              <div className="grid grid-3">
                {packaging.map((p) => {
                  const on = c.linea.packagingIds.includes(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      className={`check-label${on ? ' on' : ''}`}
                      aria-pressed={on}
                      onClick={() => togglePack(c.linea, p.id)}
                    >
                      <span>{on ? '✓' : '○'}</span>
                      <span>
                        {p.nombre} <span className="muted">({formatCLP(p.costoUnitario)})</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {c.prenda && (
            <div className="kv mt-2">
              <span>Prenda</span>
              <span className="num">{formatCLP(c.costoPrenda)}</span>
              <span>DTF</span>
              <span className="num">{formatCLP(c.costoDtf)}</span>
              <span>Packaging</span>
              <span className="num">{formatCLP(c.costoPackaging)}</span>
              <span>Subtotal unitario</span>
              <span className="num">{formatCLP(c.subtotal)}</span>
              <span><b>Precio unitario</b></span>
              <span className="num"><b>{formatCLP(c.precioExactoUnidad)}</b></span>
              <span><b>Total línea ({c.cantidad} u)</b></span>
              <span className="num"><b>{formatCLP(c.totalLinea * 100)}</b></span>
            </div>
          )}
        </div>
      ))}

      <div className="flex">
        <button type="button" className="btn btn-secondary" onClick={() => setLineas((ls) => [...ls, nuevaLinea()])}>
          + Agregar línea
        </button>
      </div>

      <div className="card">
        <div className="form-grid">
          <div className="field">
            <label className="label" htmlFor="cliente">Cliente (opcional)</label>
            <input
              className="input"
              id="cliente"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nombre del cliente"
            />
          </div>
        </div>
        <div className="sum-row mt-3">
          <span>Total cotización</span>
          <span className="sum-total">{formatCLP(total * 100)}</span>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="button" onClick={guardar} disabled={pending || lineasValidas.length === 0}>
            {pending ? 'Guardando…' : presupuestoId ? 'Actualizar presupuesto' : 'Guardar presupuesto'}
          </button>
        </div>
      </div>
    </div>
  );
}