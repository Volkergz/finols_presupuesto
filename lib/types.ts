// Tipos compartidos.

export const ESTADOS = ['borrador', 'enviado', 'aceptado', 'rechazado', 'cancelado'] as const;
export type EstadoPresupuesto = (typeof ESTADOS)[number];

export const ESTADO_LABEL: Record<EstadoPresupuesto, string> = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};

export interface Config {
  ancho_rollo: number;
  alto_rollo: number;
  markup_pct: number;
  negocio_nombre: string;
  negocio_direccion: string;
  negocio_telefono: string;
  negocio_email: string;
  moneda: 'CLP';
}

export interface Prenda {
  id: number;
  tipo: string;
  talla: string;
  color: string;
  proveedor: string | null;
  costo_unitario_cent: number;
  activo: number;
}

export interface Diseno {
  id: number;
  descripcion: string;
  ancho_cm: number;
  alto_cm: number;
  costo_metro_cent: number;
  activo: number;
}

export interface Packaging {
  id: number;
  nombre: string;
  descripcion: string | null;
  costo_paquete_cent: number;
  unidades_paquete: number;
  activo: number;
}

export interface Presupuesto {
  id: number;
  correlativo: number;
  numero: string;
  fecha: string;
  cliente: string | null;
  estado: EstadoPresupuesto;
  total_cent: number;
  creado_en: string;
}

export interface PresupuestoItem {
  id: number;
  presupuesto_id: number;
  descripcion: string;
  cantidad: number;
  prenda_id: number | null;
  diseno_id: number | null;
  packaging_id: number | null;
  diseno_desc: string | null;
  detalle_packaging: string | null;
  costo_prenda_cent: number;
  costo_dtf_cent: number;
  costo_packaging_cent: number;
  subtotal_cent: number;
  precio_unidad_cent: number;
  total_linea_cent: number;
}

/** Línea de la calculadora (antes de guardar). */
export interface LineaCalculo {
  id: string;
  prendaId: number | null;
  disenoId: number | null;
  packagingIds: number[];
  cantidad: number;
}

export interface ItemPackagingSnapshot {
  id: number;
  nombre: string;
  costo: number; // centavos
}