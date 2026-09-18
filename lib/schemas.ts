import { z } from 'zod';

const texto = (min = 1, max = 120) => z.string().trim().min(min, 'Requerido').max(max);
const pesos = () => z.number().int().nonnegative('No puede ser negativo');
const enteroPositivo = () => z.number().int().positive('Debe ser un entero mayor que cero');

export const prendaCreate = z.object({
  tipo: texto(),
  talla: texto(),
  color: texto(),
  proveedor: z.string().trim().max(120).optional().default(''),
  costoPesos: pesos(),
});

export const prendaUpdate = prendaCreate.extend({ id: z.number().int().positive() });

export const disenoCreate = z.object({
  descripcion: texto(),
  anchoCm: enteroPositivo(),
  altoCm: enteroPositivo(),
  costoMetroPesos: pesos(),
});

export const disenoUpdate = disenoCreate.extend({ id: z.number().int().positive() });

export const packagingCreate = z.object({
  nombre: texto(),
  descripcion: z.string().trim().max(120).optional().default(''),
  costoPaquetePesos: pesos(),
  unidadesPaquete: enteroPositivo(),
});

export const packagingUpdate = packagingCreate.extend({ id: z.number().int().positive() });

export const configSchema = z.object({
  ancho_rollo: enteroPositivo(),
  alto_rollo: enteroPositivo(),
  markup_pct: z.number().int().positive('Debe ser mayor que cero').max(500),
  negocio_nombre: texto(1, 80),
  negocio_direccion: z.string().trim().max(160).optional().default(''),
  negocio_telefono: z.string().trim().max(30).optional().default(''),
  negocio_email: z.string().trim().max(120).optional().default(''),
});

export const lineaInSchema = z.object({
  prendaId: z.number().int().positive(),
  disenoId: z.number().int().positive().nullable().optional(),
  packagingIds: z.array(z.number().int().positive()).optional().default([]),
  cantidad: z.number().int().positive(),
});

export const presupuestoCreateSchema = z.object({
  cliente: z.string().trim().max(120).optional().or(z.literal('')),
  lineas: z.array(lineaInSchema).min(1, 'El presupuesto debe tener al menos una línea'),
});

export type PrendaCreate = z.infer<typeof prendaCreate>;
export type DisenoCreate = z.infer<typeof disenoCreate>;
export type PackagingCreate = z.infer<typeof packagingCreate>;
export type ConfigInput = z.infer<typeof configSchema>;
export type PresupuestoCreateInput = z.infer<typeof presupuestoCreateSchema>;