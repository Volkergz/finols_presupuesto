import { describe, expect, test } from 'vitest';
import {
  ceilToPeso,
  costoDtfCentavos,
  costoPackagingCentavos,
  precioExactoUnidadCentavos,
  precioUnitarioPeso,
  subtotalCentavos,
  totalCotizacionPeso,
  totalLineaPeso,
} from '../lib/pricing';

const CLP = (pesos: number) => Math.round(pesos * 100); // pesos -> centavos

describe('cálculo DTF (validado contra el Excel)', () => {
  test('Pasaporte 30x20, $15.000/m en rollo 100x57 → 1.578,95 (157895 centavos)', () => {
    expect(costoDtfCentavos(CLP(15000), 30, 20, 100, 57)).toBe(157895);
  });
  test('con rollo configurable distinto', () => {
    // rollo 100x100 (10000 cm²): 15.000 × 600 / 10000 = 900 CLP
    expect(costoDtfCentavos(CLP(15000), 30, 20, 100, 100)).toBe(90000);
  });
});

describe('cálculo de packaging (validado contra el Excel)', () => {
  test('Bolsa Transparente: $1.990 el paquete de 50 → 39,8 CLP (3980 centavos)', () => {
    expect(costoPackagingCentavos(CLP(1990), 50)).toBe(3980);
  });
});

describe('precio de venta (markup ×1,3)', () => {
  test('subtotal 10.608,75 → precio unidad 13.791,38 cent → ceil peso 13.792', () => {
    const paramedio = subtotalCentavos(CLP(8990), 157895, 3980); // 1060875
    expect(paramedio).toBe(1060875);
    expect(precioExactoUnidadCentavos(paramedio, 130)).toBe(1379138);
    expect(precioUnitarioPeso(paramedio, 130)).toBe(13792);
  });

  test('total línea 10 u → 137.914', () => {
    const paramedio = subtotalCentavos(CLP(8990), 157895, 3980);
    expect(totalLineaPeso(paramedio, 10, 130)).toBe(137914);
  });

  test('una unidad: total línea = precio unitario', () => {
    const paramedio = subtotalCentavos(CLP(8990), 157895, 3980);
    expect(totalLineaPeso(paramedio, 1, 130)).toBe(precioUnitarioPeso(paramedio, 130));
  });
});

describe('redondeo al entero (CLP sin decimales)', () => {
  test('ceilToPeso redondea hacia arriba siempre', () => {
    expect(ceilToPeso(1)).toBe(1);
    expect(ceilToPeso(99)).toBe(1);
    expect(ceilToPeso(100)).toBe(1);
    expect(ceilToPeso(101)).toBe(2);
    expect(ceilToPeso(157894)).toBe(1579);
    expect(ceilToPeso(1399900)).toBe(13999);
  });
});

describe('total de cotización multi-línea', () => {
  test('suma de líneas', () => {
    const a = totalLineaPeso(subtotalCentavos(CLP(8990), 157895, 3980), 10, 130);
    const b = totalLineaPeso(subtotalCentavos(CLP(7990), 0, 0), 2, 130);
    expect(totalCotizacionPeso([{ totalLinea: a }, { totalLinea: b }])).toBe(a + b);
  });
});

describe('sin diseños ni packaging', () => {
  test('solo prenda ×1,3', () => {
    const s = subtotalCentavos(CLP(8990), 0, 0);
    expect(precioUnitarioPeso(s, 130)).toBe(11687); // 8990×1,3 = 11687
  });
});