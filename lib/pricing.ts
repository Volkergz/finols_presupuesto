// Módulo de cálculo (núcleo). Funciones puras, sin I/O.
// El dinero se representa en CENTAVOS (CLP × 100) como enteros (number).
// La aritmética interna usa BigInt para evitar errores de precisión.
// Regla de negocio: sin redondeo interno; solo redondeo hacia arriba (ceil) al mostrar.

const divCeil = (a: bigint, b: bigint): bigint => (a + b - 1n) / b;

/** Costo unitario de packaging en centavos. costoPaquete en centavos, unidades entero > 0. */
export function costoPackagingCentavos(costoPaquete: number, unidades: number): number {
  return Number(divCeil(BigInt(costoPaquete), BigInt(unidades)));
}

/**
 * Costo de estampado unitario en centavos.
 * costoMetro en centavos (valor por metro lineal del rollo DTF).
 * ancho/alto y dimensiones de rollo en cm enteros.
 * Formula: costo_metro × ancho × alto / (ancho_rollo × alto_rollo)
 * Ej. Pasaporte: 15.000 × 30 × 20 / (100 × 57) = 1.578,95 CLP → 157.895 centavos.
 */
export function costoDtfCentavos(
  costoMetro: number,
  anchoCm: number,
  altoCm: number,
  anchoRolloCm: number,
  altoRolloCm: number,
): number {
  const area = BigInt(Math.round(anchoCm)) * BigInt(Math.round(altoCm));
  const rolloArea = BigInt(Math.round(anchoRolloCm)) * BigInt(Math.round(altoRolloCm));
  return Number(divCeil(BigInt(costoMetro) * area, rolloArea));
}

/** Subtotal unitario (centavos). */
export function subtotalCentavos(prendaCentavos: number, dtfCentavos: number, packagingCentavos: number): number {
  return prendaCentavos + dtfCentavos + packagingCentavos;
}

/**
 * Precio exacto unitario en centavos (redondeado hacia arriba al centavo).
 * markupPct: porcentaje entero (130 => factor 1,3).
 */
export function precioExactoUnidadCentavos(subtotalCentavos: number, markupPct: number): number {
  return Number(divCeil(BigInt(subtotalCentavos) * BigInt(markupPct), 100n));
}

/** Convierte centavos a pesos redondeando hacia arriba al número entero (CLP sin decimales). */
export function ceilToPeso(centavos: number): number {
  return Number(divCeil(BigInt(centavos), 100n));
}

/** Precio unitario mostrado: ceil(precio_exacto) en pesos enteros. */
export function precioUnitarioPeso(subtotalCentavos: number, markupPct: number): number {
  return ceilToPeso(precioExactoUnidadCentavos(subtotalCentavos, markupPct));
}

/**
 * Total de línea mostrado (pesos enteros): ceil(precio_exacto × cantidad).
 * cantidad entero > 0.
 */
export function totalLineaPeso(subtotalCentavos: number, cantidad: number, markupPct: number): number {
  const totalCentavos = Number(
    divCeil(BigInt(subtotalCentavos) * BigInt(markupPct) * BigInt(cantidad), 100n),
  );
  return ceilToPeso(totalCentavos);
}

/** Total de cotización: suma de totales de línea (pesos enteros). */
export function totalCotizacionPeso(lineas: { totalLinea: number }[]): number {
  return lineas.reduce((acc, l) => acc + l.totalLinea, 0);
}