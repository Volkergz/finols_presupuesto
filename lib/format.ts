// Utilidades de formato de dinero en CLP.

import { ceilToPeso } from './pricing';

const fmt = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

/** Formatea centavos como pesos chilenos enteros (ceil): 13791375 -> "$137.914". */
export function formatCLP(centavos: number): string {
  return fmt.format(ceilToPeso(centavos));
}

/** Formatea un valor ya en pesos enteros: 137914 -> "$137.914". */
export function formatCLPPesos(pesos: number): string {
  return fmt.format(Math.round(pesos));
}

export const hoyISO = (): string => new Date().toISOString().slice(0, 10);

export function formatFecha(iso: string): string {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}