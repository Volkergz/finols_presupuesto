# Sistema de Gestión y Presupuestación para Negocio de Poleras Personalizadas

## 1. Descripción general

Sistema web destinado a gestionar los costos y presupuestos de un pequeño negocio dedicado a la venta de poleras personalizadas.

El sistema deberá permitir administrar los costos asociados a:

- Prendas base.
- Diseños DTF.
- Packaging.
- Otros costos asociados al proceso de producción.
- Margen de ganancia.
- Descuentos.
- Cantidades solicitadas.

La funcionalidad principal será una **calculadora de precios/presupuestos** que permita determinar automáticamente el costo y precio de venta de una polera personalizada a partir de los parámetros ingresados.

El sistema deberá reemplazar progresivamente el uso de un archivo Excel utilizado actualmente para realizar estos cálculos.

---

# 2. Objetivos del sistema

## 2.1 Objetivo principal

Disponer de una aplicación web que permita calcular de manera rápida y consistente el costo y precio de venta de productos personalizados.

## 2.2 Objetivos secundarios

- Centralizar los costos del negocio.
- Evitar cálculos manuales repetitivos.
- Reducir errores de cálculo.
- Mantener actualizados los costos de prendas, DTF y packaging.
- Facilitar la generación de presupuestos.
- Permitir guardar información histórica.
- Servir como base para futuras funcionalidades de gestión del negocio.

---

# 3. Plataforma

## 3.1 Tipo de aplicación

Aplicación web responsive.

Debe funcionar correctamente en:

- Computadores.
- Tablets.
- Teléfonos móviles.

## 3.2 Acceso

La aplicación deberá poder utilizarse desde un navegador web.

## 3.3 Hosting

Se buscará utilizar infraestructura gratuita o de muy bajo costo.

La arquitectura deberá considerar inicialmente:

- Aplicación web.
- Base de datos SQLite o una alternativa compatible con SQLite.
- Hosting que permita mantener los datos de forma persistente.

Una alternativa a evaluar es utilizar Cloudflare Pages/Workers + D1.

---

# 4. Módulos principales

El sistema estará compuesto inicialmente por los siguientes módulos:

- [x] **Dashboard** — implementado (`/`).
- [x] **Prendas base** — implementado (`/prendas`).
- [x] **Diseños / costos DTF** — implementado (`/dtf`).
- [x] **Packaging** — implementado (`/packaging`).
- [x] **Calculadora de costos** — implementado (`/calculadora`).
- [x] **Presupuestos** — implementado (`/presupuestos`).
- [x] **Configuración** — implementado (`/configuracion`).

Módulos futuros (no implementados):

- [ ] Clientes.
- [ ] Ventas.
- [ ] Gastos.
- [ ] Proveedores.
- [ ] Reportes.
- [ ] Control de inventario.

---

# 5. Módulo de Prendas Base

Este módulo permitirá administrar las prendas utilizadas como base para los productos personalizados.

## 5.1 Información de la prenda

Cada registro deberá permitir almacenar:

- Tipo de prenda.
- Talla.
- Color.
- Proveedor.
- Costo unitario.
- Costo unitario de envío.
- Estado activo/inactivo.

## 5.2 Campos

| Campo | Tipo | Obligatorio |
|---|---|---|
| ID | Automático | Sí |
| Tipo de prenda | Texto | Sí |
| Talla | Texto | Sí |
| Color | Texto | Sí |
| Proveedor | Texto/relación | No |
| Costo unitario | Número | Sí |
| Costo unitario envío | Número | Sí |
| Estado | Booleano | Sí |

## 5.3 Costo real

El sistema deberá poder calcular:

`Costo real de prenda = Costo unitario + Costo unitario de envío`

Este valor podrá utilizarse automáticamente en la calculadora.

## 5.4 Operaciones

El usuario deberá poder:

- Crear prendas.
- Editar prendas.
- Eliminar/desactivar prendas.
- Buscar prendas.
- Filtrar por tipo.
- Filtrar por talla.
- Filtrar por color.
- Filtrar por proveedor.
- Modificar costos.

---

# 6. Módulo de Diseños / Costos DTF

Este módulo permitirá administrar los diseños utilizados para personalización mediante DTF.

## 6.1 Información del diseño

Cada diseño deberá almacenar:

- Descripción del diseño.
- Ancho.
- Alto.
- Costo por rollo.
- Costo unitario del diseño.

## 6.2 Campos

| Campo | Tipo | Obligatorio |
|---|---|---|
| ID | Automático | Sí |
| Descripción | Texto | Sí |
| Ancho | Número | Sí |
| Alto | Número | Sí |
| Costo por rollo | Número | Sí |
| Costo unitario | Número calculado | Sí |

## 6.3 Cálculo del DTF

El sistema deberá calcular el costo del diseño utilizando:

- Dimensiones del diseño.
- Costo del rollo.
- Unidad de medida utilizada por el negocio.

La fórmula exacta deberá ser determinada a partir del Excel actual.

No se deberá asumir la fórmula definitiva hasta validar las fórmulas existentes en el archivo Excel.

## 6.4 Operaciones

El usuario deberá poder:

- Crear diseños.
- Editar diseños.
- Eliminar/desactivar diseños.
- Buscar diseños.
- Consultar dimensiones.
- Consultar costo unitario.
- Modificar el costo del rollo.

---

# 7. Módulo de Packaging

Este módulo permitirá administrar los elementos utilizados para entregar los productos.

## 7.1 Elementos

Inicialmente deberá permitir administrar:

- Bolsas.
- Etiquetas.
- Stickers.
- Otros elementos.

## 7.2 Información

Cada elemento deberá almacenar:

| Campo | Tipo |
|---|---|
| ID | Automático |
| Nombre | Texto |
| Descripción | Texto |
| Costo unitario | Número |
| Estado | Activo/Inactivo |

## 7.3 Operaciones

El usuario deberá poder:

- Crear elementos.
- Editar elementos.
- Desactivar elementos.
- Modificar costos.
- Consultar costos.

---

# 8. Calculadora de Costos

La calculadora será la funcionalidad principal del sistema.

Debe permitir calcular automáticamente el costo y precio de venta de una polera personalizada.

## 8.1 Información de entrada

El usuario deberá poder seleccionar/ingresar:

### Producto

- Tipo de prenda.
- Talla.
- Color.
- Cantidad.

### Personalización

- Diseño DTF.
- Ancho del diseño.
- Alto del diseño.
- Cantidad de diseños.
- Ubicación del diseño, si corresponde.

La aplicación deberá permitir considerar más de un diseño por prenda.

Ejemplo:

- Diseño delantero.
- Diseño trasero.
- Diseño manga.

### Packaging

El usuario deberá poder seleccionar los elementos de packaging utilizados.

Ejemplo:

- 1 bolsa.
- 1 etiqueta.
- 1 sticker.

---

# 9. Cálculo de costos

La calculadora deberá combinar automáticamente los diferentes componentes.

Conceptualmente:

`Costo total = Prendas + DTF + Packaging + Otros costos`

## 9.1 Costo de prendas

`Costo prendas = costo real unitario × cantidad`

Donde:

`Costo real unitario = costo prenda + envío unitario`

## 9.2 Costo DTF

El costo deberá calcularse considerando:

- Diseño.
- Dimensiones.
- Costo del rollo.
- Cantidad de prendas.

La fórmula definitiva deberá ser tomada del Excel existente.

## 9.3 Costo packaging

`Costo packaging = suma de los costos de los elementos utilizados × cantidad`

## 9.4 Otros costos

El sistema deberá permitir contemplar otros costos que puedan aparecer en el Excel actual.

Estos costos deberán identificarse y definirse durante el análisis del archivo Excel.

---

# 10. Margen / Markup

La calculadora deberá permitir definir el margen o markup utilizado para obtener el precio de venta.

El sistema deberá distinguir claramente entre:

- Margen de utilidad.
- Markup sobre costo.

La fórmula utilizada deberá corresponder a la actualmente utilizada en el Excel.

Ejemplo de configuración:

- Margen: 30%
- Markup: 30%

No se deberá asumir que ambos conceptos utilizan la misma fórmula.

---

# 11. Descuentos

La calculadora deberá permitir aplicar descuentos.

Tipos de descuento a evaluar:

- Porcentaje.
- Monto fijo.

Ejemplo:

`Precio antes del descuento = $20.000`

`Descuento = 10%`

`Precio final = $18.000`

La modalidad exacta deberá validarse contra el funcionamiento actual del Excel.

---

# 12. Cantidades

La calculadora deberá permitir calcular presupuestos para diferentes cantidades.

Ejemplo:

- 1 unidad.
- 5 unidades.
- 10 unidades.
- 20 unidades.
- 50 unidades.

El sistema deberá recalcular automáticamente los costos y precios según la cantidad.

---

# 13. Resultado de la calculadora

El resultado deberá mostrar de manera clara:

- Cantidad.
- Prenda seleccionada.
- Costo de las prendas.
- Costo de envío.
- Costo DTF.
- Costo de packaging.
- Otros costos.
- Costo total.
- Margen/markup aplicado.
- Precio antes de descuento.
- Descuento.
- Precio final.
- Precio unitario.

Ejemplo conceptual:

| Concepto | Valor |
|---|---:|
| Prendas | $50.000 |
| Envío | $5.000 |
| DTF | $20.000 |
| Packaging | $5.000 |
| Otros costos | $0 |
| **Costo total** | **$80.000** |
| Margen | 30% |
| Precio antes descuento | $XXX.XXX |
| Descuento | 10% |
| **Precio final** | **$XXX.XXX** |
| **Precio unitario** | **$XX.XXX** |

Los valores anteriores son solamente ilustrativos.

---

# 14. Presupuestos

El sistema deberá permitir guardar los cálculos realizados como presupuestos.

## 14.1 Información del presupuesto

Cada presupuesto deberá poder contener:

- Número de presupuesto.
- Fecha.
- Cliente, si existe.
- Productos.
- Cantidades.
- Diseños.
- Packaging.
- Costos.
- Margen.
- Descuento.
- Precio final.
- Estado.

## 14.2 Estados

Inicialmente:

- Borrador.
- Enviado.
- Aceptado.
- Rechazado.
- Cancelado.

---

# 15. Historial

El sistema deberá permitir consultar presupuestos anteriores.

Funciones:

- Listar presupuestos.
- Buscar.
- Filtrar por fecha.
- Filtrar por estado.
- Consultar detalle.
- Duplicar presupuesto.
- Editar presupuesto.
- Volver a calcular un presupuesto.

---

# 16. Dashboard

La pantalla principal deberá mostrar información resumida del negocio.

Inicialmente:

- Presupuestos recientes.
- Cantidad de presupuestos.
- Presupuestos pendientes.
- Presupuestos aceptados.
- Ventas, si el módulo se implementa posteriormente.
- Costos, si corresponde.

El dashboard deberá diseñarse para poder incorporar posteriormente nuevos indicadores.

---

# 17. Gestión de proveedores

Aunque inicialmente el proveedor puede ser un campo dentro de Prendas Base, se deberá dejar preparada la arquitectura para convertirlo posteriormente en una entidad independiente.

Información futura:

- Nombre.
- Contacto.
- Teléfono.
- Email.
- Dirección.
- Productos asociados.
- Historial de costos.

---

# 18. Clientes

Módulo futuro.

Deberá permitir:

- Crear clientes.
- Editar clientes.
- Buscar clientes.
- Ver historial de presupuestos.
- Ver historial de compras.

Información:

- Nombre.
- Teléfono.
- Email.
- Dirección.
- Notas.

---

# 19. Ventas

Módulo futuro.

Permitirá convertir un presupuesto aceptado en una venta.

Información:

- Cliente.
- Productos.
- Cantidades.
- Precio.
- Descuento.
- Total.
- Fecha.
- Estado de pago.

---

# 20. Gastos

Módulo futuro.

Permitirá registrar gastos del negocio que no formen parte directamente del costo del producto.

Ejemplos:

- Transporte.
- Publicidad.
- Herramientas.
- Servicios.
- Materiales.
- Otros gastos.

---

# 21. Inventario

Módulo futuro.

Podrá permitir controlar:

- Stock de prendas.
- Stock por talla.
- Stock por color.
- Entradas.
- Salidas.
- Ajustes.

La incorporación de inventario deberá evaluarse según las necesidades reales del negocio.

---

# 22. Reportes

Módulo futuro.

Posibles reportes:

- Ventas por período.
- Costos por período.
- Ganancias.
- Productos más vendidos.
- Diseños más utilizados.
- Consumo de prendas.
- Consumo de DTF.
- Consumo de packaging.
- Ventas por cliente.
- Ventas por período.

---

# 23. Base de datos

## 23.1 Requisito inicial

La aplicación deberá utilizar una base de datos basada en SQLite o compatible con SQLite.

## 23.2 Entidades iniciales

Como mínimo:

- `prendas`
- `proveedores`
- `disenos_dtf`
- `packaging`
- `presupuestos`
- `presupuesto_items`
- `configuracion`

## 23.3 Entidades futuras

- `clientes`
- `ventas`
- `venta_items`
- `gastos`
- `inventario`
- `movimientos_inventario`

---

# 24. Configuración

El sistema deberá disponer de parámetros configurables para evitar modificar código cuando cambien las condiciones del negocio.

Posibles configuraciones:

- Margen predeterminado.
- Markup predeterminado.
- Valores de DTF.
- Costos de packaging.
- Moneda.
- Impuestos, si corresponde.
- Descuento máximo, si se desea establecer.
- Datos del negocio.

---

# 25. Moneda

Inicialmente se deberá trabajar con pesos chilenos (CLP).

Los valores monetarios deberán mostrarse con formato apropiado para Chile.

Ejemplo:

`$15.990`

La implementación deberá almacenar los valores monetarios de forma segura para evitar errores de precisión.

---

# 26. Interfaz de usuario

La aplicación deberá tener una interfaz:

- Simple.
- Clara.
- Rápida.
- Responsive.
- Orientada principalmente a la calculadora.
- Optimizada para uso desde celular.

## 26.1 Navegación

La navegación inicial podrá incluir:

- Inicio.
- Calculadora.
- Presupuestos.
- Prendas.
- DTF.
- Packaging.
- Configuración.

---

# 27. Validaciones

El sistema deberá validar:

- Campos obligatorios.
- Valores numéricos.
- Valores negativos.
- Cantidades mayores que cero.
- Dimensiones válidas.
- Costos válidos.
- Porcentajes válidos.

La aplicación no deberá mostrar resultados como:

- `NaN`
- `Infinity`
- valores vacíos causados por errores de cálculo.

---

# 28. Persistencia

Los datos ingresados deberán permanecer almacenados después de cerrar el navegador.

Los datos no deberán depender exclusivamente del almacenamiento local del navegador.

La base de datos deberá ser persistente en el entorno de producción.

---

# 29. Seguridad

La aplicación deberá contemplar inicialmente:

- Acceso mediante HTTPS.
- Validación de datos.
- Protección de operaciones de escritura.
- No exponer directamente la base de datos al navegador.
- Separación entre frontend y acceso a datos.

Si posteriormente se incorporan múltiples usuarios, deberá implementarse autenticación y autorización.

---

# 30. Respaldo

La aplicación deberá contemplar la posibilidad de realizar respaldos de la información.

Idealmente:

- Exportación de base de datos.
- Exportación de presupuestos.
- Exportación de catálogos.
- Restauración de respaldo.

Esta funcionalidad puede implementarse después de la primera versión.

---

# 31. Importación desde Excel

Una de las funcionalidades importantes de la primera etapa será migrar los datos existentes del Excel.

El sistema deberá permitir eventualmente importar:

- Prendas.
- Costos.
- Diseños DTF.
- Packaging.
- Otros parámetros.

Antes de implementar la importación se deberá analizar el Excel existente para determinar:

- Estructura.
- Columnas.
- Fórmulas.
- Dependencias entre hojas.
- Valores calculados.
- Datos que deben convertirse en registros.

---

# 32. Equivalencia con el Excel existente

El Excel actual será considerado como referencia para validar la lógica de cálculo.

Se deberá comprobar que:

`Resultado aplicación = Resultado Excel`

para los mismos datos de entrada.

Se deberán crear casos de prueba utilizando ejemplos reales del Excel.

---

# 33. Casos de prueba

Como mínimo se deberán probar:

### Caso 1 — Una polera

- 1 prenda.
- 1 diseño.
- 1 packaging.

### Caso 2 — Varias unidades

- 10 prendas.
- Mismo diseño.
- Mismo packaging.

### Caso 3 — Varios diseños

- Diseño delantero.
- Diseño trasero.

### Caso 4 — Diferentes prendas

- Diferentes tallas.
- Diferentes colores.
- Diferentes costos.

### Caso 5 — Descuento

- Precio con descuento porcentual.

### Caso 6 — Cambio de costos

Modificar el costo de una prenda y comprobar que los nuevos presupuestos utilicen el nuevo valor.

### Caso 7 — Presupuesto histórico

Modificar posteriormente el precio de una prenda y comprobar que un presupuesto antiguo conserve sus valores originales.

---

# 34. Requisito importante: congelación de precios

Cuando se guarde un presupuesto, deberá conservarse el costo utilizado en ese momento.

Por ejemplo:

Si una polera cuesta $5.000 al crear un presupuesto y posteriormente pasa a costar $5.500, el presupuesto histórico deberá seguir mostrando:

`Costo utilizado: $5.000`

No deberá recalcularse automáticamente utilizando el nuevo precio.

Esto implica que los presupuestos deberán almacenar los valores utilizados al momento de su creación.

---

# 35. Arquitectura propuesta

Arquitectura inicial sugerida:

```text
┌─────────────────────────────┐
│           Usuario           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       Aplicación Web        │
│                             │
│  Calculadora                │
│  Prendas                    │
│  DTF                        │
│  Packaging                  │
│  Presupuestos               │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       Backend / API         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│     SQLite / Cloudflare D1  │
└─────────────────────────────┘
