# Requerimientos del Sistema — Gestión y Presupuestación de Poleras Personalizadas

---

## 1. Contexto y alcance

### 1.1 Objetivo

Aplicación web que permita calcular de manera rápida y consistente el costo y precio de venta
de poleras personalizadas, reemplazando progresivamente el uso de un archivo Excel
(archivo de referencia: "Calculo").

### 1.2 Plataforma

- Aplicación web responsive (computador, tablet y celular).
- Stack: Next.js (App Router) + TypeScript, desplegado en Vercel (plan gratuito).
- Base de datos: Turso / libSQL (compatible SQLite), persistente; SQLite en archivo para desarrollo local.
- Moneda: Pesos Chilenos (CLP), valores monetarios internos en centavos (enteros) para evitar errores de precisión.
- Usuario: único (dueño del negocio / operador), sin autenticación en V1.
- Interfaz: exclusivamente en tema claro, con la paleta de marca definida en RNF-011.

### 1.3 Alcance V1

Módulos incluidos:

- Dashboard.
- Prendas base.
- Diseños / costos DTF.
- Packaging.
- Calculadora de costos (funcionalidad principal).
- Presupuestos.
- Configuración.

Módulos / conceptos fuera de alcance en V1:

- Descuentos.
- Costo de envío.
- Múltiples diseños por prenda (solo un diseño por línea).
- Clientes (en presupuesto el cliente es texto libre).
- Ventas.
- Inventario.
- Reportes.
- Gastos.
- Importación desde Excel (el Excel se usa solo como referencia para validar la lógica de cálculo).

---

## 2. Terminología y reglas de negocio

### 2.1 Términos

| Término | Definición |
|---|---|
| Prenda base | Prenda sin personalizar (ej. polera), definida por tipo, talla, color y proveedor. |
| Diseño DTF | Personalización estampada mediante DTF, definida por descripción, ancho y alto. |
| Packaging | Insumo de despacho (bolsas, etiquetas, stickers), definido por costo de paquete y unidades por paquete. |
| Línea de cotización | Unidad de cálculo dentro de una cotización: una prenda + un diseño + packaging + cantidad. |
| Cotización / Presupuesto | Conjunto de una o varias líneas guardado con fecha, número, cliente y estado. |
| Costos congelados | Valores copiados al momento de guardar el presupuesto; no se recalculan si cambian los catálogos. |

### 2.2 Reglas de negocio (validadas con el Excel)

Parámetros configurados:

- Ancho del rollo DTF: **100 cm** (configurable).
- Alto del rollo DTF: **57 cm** (configurable).
- Markup sobre costo: **× 1,3 (30%)** (configurable).

Fórmulas de cálculo:

```text
costo_packaging   = costo_paquete / unidades_paquete                 (ej. 1.990 / 50 = 39,8)
costo_dtf         = costo_metro × ancho × alto / (ancho_rollo × alto_rollo)   (ej. 15.000 × 30 × 20 / 5.700 = 1.578,95)
subtotal_unidad   = costo_prenda + costo_dtf + costo_packaging       (ej. 8.990 + 1.578,95 + 39,8 = 10.608,75)
precio_unidad     = redondear_arriba(subtotal_unidad × markup)       (13.791,4 → $13.792)
total_linea       = redondear_arriba(precio_exacto_unidad × cantidad)  (13.791,4 × 10 = 137.914)
total_cotizacion  = Σ total_linea de todas las líneas
```

Reglas de presentación:

- Los valores intermedios se calculan con precisión total (sin redondeo interno).
- Todo valor monetario mostrado se redondea hacia arriba al siguiente número entero
  (redondear el decimal al siguiente entero); nunca se muestra `NaN`, `Infinity` ni vacíos.
- IVA: no aplica (venta sin IVA).

Ejemplo de validación con datos reales del Excel:

| Concepto | Valor |
|---|---:|
| Prenda (Polera, proveedor Andesland) | $8.990,00 |
| DTF (Pasaporte 30×20, costo metro $15.000) | $1.578,95 |
| Packaging (Bolsa Transparente) | $39,80 |
| SubTotal unidad | $10.608,75 |
| Precio unidad (×1,3) | $13.791,37 → **$13.792** |
| Total 10 unidades (137.913,68) | **$137.914** |

### 2.3 Estados de presupuesto

- Borrador.
- Enviado.
- Aceptado.
- Rechazado.
- Cancelado.

### 2.4 Validaciones generales

- Campos obligatorios definidos por entidad.
- Valores numéricos válidos.
- Sin valores negativos.
- Cantidades mayores que cero.
- Dimensiones y costos mayores que cero.
- Markup mayor que cero.

---

## 3. Requerimientos Funcionales (RF)

**Usuarios:** un único rol activo en V1 — "Dueño del negocio / operador" (sin autenticación).
Cuando se indique "Usuario" se refiere a este rol.

---

### RF-001 — Ver dashboard con resumen de presupuestos

- **ID:** RF-001
- **Nombre:** Ver dashboard con resumen de presupuestos
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Dashboard
  Como Usuario
  Quiero ver un resumen del estado del negocio
  Para conocer rápidamente presupuestos recientes y su estado

  Escenario: Ver resumen general
    Dado que existen presupuestos guardados
    Cuando ingreso a la pantalla de inicio
    Entonces veo el listado de presupuestos recientes
    Y veo la cantidad total de presupuestos
    Y veo la cantidad de presupuestos pendientes (borrador/enviado)
    Y veo la cantidad de presupuestos aceptados

  Escenario: Sin presupuestos registrados
    Dado que no existen presupuestos
    Cuando ingreso a la pantalla de inicio
    Entonces veo indicadores en cero
    Y veo una invitación a crear un presupuesto
```

---

### RF-002 — Listar y buscar prendas

- **ID:** RF-002
- **Nombre:** Listar y buscar prendas
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Listado de prendas
  Como Usuario
  Quiero consultar las prendas registradas
  Para revisar costos sin abrir registro por registro

  Escenario: Listar prendas activas e inactivas
    Dado que existen prendas registradas
    Cuando ingreso al módulo de prendas
    Entonces veo la lista de prendas con tipo, talla, color, proveedor y costo unitario

  Escenario: Buscar prendas
    Dado que existen prendas registradas
    Cuando ingreso un término de búsqueda
    Entonces veo solo las prendas que coinciden con el término

  Escenario: Filtrar prendas
    Dado que existen prendas registradas
    Cuando aplico un filtro por tipo, talla, color o proveedor
    Entonces veo solo las prendas que cumplen el filtro
```

---

### RF-003 — Crear prenda

- **ID:** RF-003
- **Nombre:** Crear prenda
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Creación de prenda
  Como Usuario
  Quiero registrar una nueva prenda base con su costo
  Para usarla en la calculadora de presupuestos

  Escenario: Crear prenda válida
    Dado que estoy en el módulo de prendas
    Cuando ingreso tipo, talla, color, proveedor y costo unitario
    Entonces la prenda queda registrada como activa
    Y aparece en el listado y en la calculadora

  Escenario: Intentar crear prenda con datos incompletos
    Dado que estoy creando una prenda
    Cuando no ingreso un campo obligatorio o ingreso costos negativos
    Entonces el sistema muestra un mensaje de validación
    Y la prenda no se guarda
```

---

### RF-004 — Editar prenda

- **ID:** RF-004
- **Nombre:** Editar prenda
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Edición de prenda
  Como Usuario
  Quiero modificar los datos y costos de una prenda
  Para mantener los catálogos actualizados

  Escenario: Editar prenda válida
    Dado que existe una prenda registrada
    Cuando modifico su costo unitario o cualquier dato y guardo
    Entonces la prenda queda actualizada
    Y los nuevos cálculos de la calculadora usan el nuevo valor
    Y los presupuestos ya guardados conservan sus costos anteriores

  Escenario: Intentar guardar cambios inválidos
    Dado que estoy editando una prenda
    Cuando ingreso un costo negativo o vacío y guardo
    Entonces el sistema muestra un mensaje de validación
    Y los cambios no se aplican
```

---

### RF-005 — Desactivar prenda

- **ID:** RF-005
- **Nombre:** Desactivar prenda
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Desactivación de prenda
  Como Usuario
  Quiero desactivar prendas que ya no se usan
  Para que no aparezcan en la calculadora sin eliminar su historial

  Escenario: Desactivar prenda
    Dado que existe una prenda activa
    Cuando cambio su estado a inactivo
    Entonces la prenda desaparece de los selectores de la calculadora
    Y permanece visible en el listado con filtro de inactivas
    Y los presupuestos históricos que la usan no se ven afectados
```

---

### RF-006 — Listar y buscar diseños DTF

- **ID:** RF-006
- **Nombre:** Listar y buscar diseños DTF
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Listado de diseños DTF
  Como Usuario
  Quiero consultar los diseños registrados con sus dimensiones
  Para revisar sus costos unitarios calculados

  Escenario: Listar diseños
    Dado que existen diseños registrados
    Cuando ingreso al módulo de diseños DTF
    Entonces veo descripción, ancho, alto, costo del metro y costo de estampado unitario

  Escenario: Buscar diseños
    Dado que existen diseños registrados
    Cuando ingreso un término de búsqueda
    Entonces veo solo los diseños que coinciden con el término
```

---

### RF-007 — Crear diseño DTF

- **ID:** RF-007
- **Nombre:** Crear diseño DTF
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Creación de diseño DTF
  Como Usuario
  Quiero registrar un nuevo diseño con sus dimensiones y costo del metro
  Para usarlo en la calculadora

  Escenario: Crear diseño válido
    Dado que estoy en el módulo de diseños DTF
    Cuando ingreso descripción, ancho, alto y costo del metro
    Entonces el sistema calcula el costo de estampado unitario con la fórmula definida
    Y el diseño queda activo y disponible en la calculadora

  Escenario: Intentar crear diseño con datos inválidos
    Dado que estoy creando un diseño
    Cuando ingreso dimensiones o costos cero, negativos o vacíos
    Entonces el sistema muestra un mensaje de validación
    Y el diseño no se guarda
```

---

### RF-008 — Editar diseño DTF

- **ID:** RF-008
- **Nombre:** Editar diseño DTF
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Edición de diseño DTF
  Como Usuario
  Quiero modificar dimensiones o costo del metro de un diseño
  Para mantener actualizados los costos de estampado

  Escenario: Editar diseño válido
    Dado que existe un diseño registrado
    Cuando modifico su descripción, dimensiones o costo del metro y guardo
    Entonces el costo de estampado unitario se recalcula
    Y los presupuestos guardados conservan sus valores anteriores
```

---

### RF-009 — Desactivar diseño DTF

- **ID:** RF-009
- **Nombre:** Desactivar diseño DTF
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Desactivación de diseño DTF
  Como Usuario
  Quiero desactivar diseños fuera de uso
  Para que no aparezcan en la calculadora

  Escenario: Desactivar diseño
    Dado que existe un diseño activo
    Cuando cambio su estado a inactivo
    Entonces el diseño desaparece de los selectores de la calculadora
    Y los presupuestos históricos que lo usan no se ven afectados
```

---

### RF-010 — Listar y buscar elementos de packaging

- **ID:** RF-010
- **Nombre:** Listar y buscar elementos de packaging
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Listado de packaging
  Como Usuario
  Quiero consultar los insumos de packaging registrados
  Para revisar sus costos unitarios

  Escenario: Listar packaging
    Dado que existen elementos de packaging registrados
    Cuando ingreso al módulo de packaging
    Entonces veo nombre, costo de paquete, unidades por paquete y costo unitario

  Escenario: Buscar packaging
    Dado que existen elementos de packaging registrados
    Cuando ingreso un término de búsqueda
    Entonces veo solo los elementos que coinciden con el término
```

---

### RF-011 — Crear packaging

- **ID:** RF-011
- **Nombre:** Crear packaging
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Creación de packaging
  Como Usuario
  Quiero registrar un nuevo insumo de packaging
  Para agregarlo a los cálculos de las líneas de cotización

  Escenario: Crear packaging válido
    Dado que estoy en el módulo de packaging
    Cuando ingreso nombre, costo del paquete y unidades por paquete
    Entonces el sistema calcula el costo unitario (costo paquete ÷ unidades)
    Y el elemento queda activo y disponible en la calculadora

  Escenario: Intentar crear packaging con datos inválidos
    Dado que estoy creando packaging
    Cuando el costo del paquete o las unidades son cero, negativos o vacíos
    Entonces el sistema muestra un mensaje de validación
    Y el elemento no se guarda
```

---

### RF-012 — Editar packaging

- **ID:** RF-012
- **Nombre:** Editar packaging
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Edición de packaging
  Como Usuario
  Quiero modificar los costos de un elemento de packaging
  Para mantener actualizados los costos de despacho

  Escenario: Editar packaging válido
    Dado que existe un elemento de packaging registrado
    Cuando modifico su costo de paquete o unidades y guardo
    Entonces el costo unitario se recalcula
    Y los presupuestos guardados conservan sus valores anteriores
```

---

### RF-013 — Desactivar packaging

- **ID:** RF-013
- **Nombre:** Desactivar packaging
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Desactivación de packaging
  Como Usuario
  Quiero desactivar insumos fuera de uso
  Para que no aparezcan en la calculadora

  Escenario: Desactivar packaging
    Dado que existe un elemento de packaging activo
    Cuando cambio su estado a inactivo
    Entonces el elemento desaparece de los selectores de la calculadora
    Y los presupuestos históricos que lo usan no se ven afectados
```

---

### RF-014 — Gestionar configuración

- **ID:** RF-014
- **Nombre:** Gestionar configuración del sistema
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Configuración
  Como Usuario
  Quiero ajustar los parámetros de cálculo y datos del negocio
  Para adaptar el sistema sin modificar código

  Escenario: Modificar parámetros válidos
    Dado que estoy en el módulo de configuración
    Cuando actualizo ancho del rollo, alto del rollo, markup o datos del negocio y guardo
    Entonces los parámetros quedan actualizados
    Y la calculadora usa los nuevos valores en nuevos cálculos

  Escenario: Guardar parámetros inválidos
    Dado que estoy en el módulo de configuración
    Cuando ingreso markup o dimensiones de rollo negativos o vacíos
    Entonces el sistema muestra un mensaje de validación
    Y los cambios no se aplican

  Escenario: Respetar presupuestos históricos
    Dado que modifico los parámetros de cálculo
    Cuando consulto un presupuesto guardado antes del cambio
    Entonces el presupuesto conserva sus costos originales
```

---

### RF-015 — Calculadora: seleccionar prenda y cantidad

- **ID:** RF-015
- **Nombre:** Seleccionar prenda y cantidad en la calculadora
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Selección de prenda y cantidad
  Como Usuario
  Quiero elegir la prenda y la cantidad para una línea
  Para calcular su costo y precio

  Escenario: Seleccionar prenda válida
    Dado que estoy en la calculadora
    Cuando selecciono una prenda activa e ingreso una cantidad
    Entonces la línea refleja el costo de la prenda multiplicado por la cantidad

  Escenario: Ingresar cantidad inválida
    Dado que estoy en la calculadora
    Cuando ingreso una cantidad cero, negativa o vacía
    Entonces el sistema muestra un mensaje de validación
    Y la línea no permite guardarse sin una cantidad válida
```

---

### RF-016 — Calculadora: aplicar diseño DTF a una línea

- **ID:** RF-016
- **Nombre:** Aplicar diseño DTF a una línea
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Aplicación de diseño DTF
  Como Usuario
  Quiero asignar un diseño DTF a la línea
  Para que se sume su costo de estampado

  Escenario: Aplicar diseño válido
    Dado que tengo una línea con una prenda
    Cuando selecciono un diseño activo
    Entonces la línea suma el costo de estampado unitario del diseño

  Escenario: Línea sin diseño
    Dado que estoy armando una línea
    Cuando no selecciono diseño
    Entonces la línea se calcula solo con prenda y packaging
```

---

### RF-017 — Calculadora: añadir packaging a una línea

- **ID:** RF-017
- **Nombre:** Añadir packaging a una línea
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Aplicación de packaging
  Como Usuario
  Quiero añadir insumos de packaging a la línea
  Para que se sume su costo unitario

  Escenario: Añadir packaging válido
    Dado que tengo una línea con una prenda
    Cuando selecciono uno o más elementos de packaging activos
    Entonces la línea suma el costo unitario de cada elemento
```

---

### RF-018 — Calculadora: calcular costos y precios por línea

- **ID:** RF-018
- **Nombre:** Calcular costos y precios por línea
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Cálculo por línea
  Como Usuario
  Quiero obtener el desglose de costos y precios de la línea
  Para conocer con certeza el precio de venta

  Escenario: Calcular línea completa
    Dado que tengo prenda, diseño, packaging y cantidad definidos
    Cuando la calculadora procesa la línea
    Entonces muestro el costo de prendas, costo DTF, costo packaging y subtotal
    Y muestro el precio unitario obtenido con el markup y redondeo definidos
    Y muestro el total de la línea

  Escenario: Resultado siempre visible
    Dado que tengo una línea calculable
    Cuando se muestran los resultados
    Entonces ningún valor es NaN, Infinity ni está vacío
```

---

### RF-019 — Calculadora: agregar múltiples líneas

- **ID:** RF-019
- **Nombre:** Agregar múltiples líneas a una cotización
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Cotización multi-línea
  Como Usuario
  Quiero agregar varias líneas a la misma cotización
  Para cotizar prendas o tallas distintas juntas

  Escenario: Agregar líneas
    Dado que estoy en la calculadora
    Cuando agrego una nueva línea y la completo
    Entonces la cotización contiene ambas líneas
    Y el total de la cotización es la suma del total de cada línea

  Escenario: Cotización sin líneas
    Dado que estoy en la calculadora
    Cuando no hay líneas agregadas
    Entonces el total de la cotización es cero
    Y no es posible guardar un presupuesto vacío
```

---

### RF-020 — Calculadora: editar y eliminar líneas

- **ID:** RF-020
- **Nombre:** Editar y eliminar líneas con recálculo automático
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Gestión de líneas
  Como Usuario
  Quiero modificar o quitar líneas de la cotización
  Para ajustar la propuesta sin reiniciar el cálculo

  Escenario: Editar una línea
    Dado que existe una línea en la cotización
    Cuando cambio la prenda, el diseño, el packaging o la cantidad
    Entonces todos los valores de la línea se recalculan automáticamente
    Y el total de la cotización se actualiza

  Escenario: Eliminar una línea
    Dado que la cotización tiene más de una línea
    Cuando elimino una línea
    Entonces la línea desaparece
    Y el total de la cotización se recalcula sin ella
```

---

### RF-021 — Guardar cotización como presupuesto (congelación)

- **ID:** RF-021
- **Nombre:** Guardar cotización como presupuesto
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Guardado de presupuesto
  Como Usuario
  Quiero guardar la cotización como presupuesto
  Para conservar el cálculo y gestionar su estado

  Escenario: Guardar presupuesto válido
    Dado que tengo una cotización con al menos una línea
    Cuando confirmo el guardado
    Entonces el sistema asigna el siguiente número secuencial (COT-0001)
    Y guarda la fecha, el cliente (si lo ingresé) y el estado "Borrador"
    Y guarda una copia congelada de todos los costos y precios de cada línea

  Escenario: Guardar sin fecha consistente
    Dado que guardo una cotización
    Entonces el presupuesto queda asociado a la fecha de creación

  Escenario: Presupuestos posteriores no alteran el histórico
    Dado que un presupuesto fue guardado con ciertos costos
    Cuando luego cambian los costos en los catálogos
    Entonces el presupuesto guardado conserva sus costos originales (congelados)
```

---

### RF-022 — Listar y filtrar presupuestos

- **ID:** RF-022
- **Nombre:** Listar y filtrar presupuestos
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Listado de presupuestos
  Como Usuario
  Quiero consultar los presupuestos guardados
  Para encontrar rápidamente uno específico

  Escenario: Listar presupuestos
    Dado que existen presupuestos guardados
    Cuando ingreso al módulo de presupuestos
    Entonces veo el listado con número, fecha, cliente, estado y total

  Escenario: Buscar por término
    Dado que existen presupuestos guardados
    Cuando ingreso un término de búsqueda
    Entonces veo solo los presupuestos que coinciden

  Escenario: Filtrar por estado o fecha
    Dado que existen presupuestos guardados
    Cuando aplico un filtro por estado o por rango de fechas
    Entonces veo solo los presupuestos que cumplen el filtro
```

---

### RF-023 — Ver detalle de presupuesto histórico

- **ID:** RF-023
- **Nombre:** Ver detalle de presupuesto histórico
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Detalle de presupuesto
  Como Usuario
  Quiero ver el detalle completo de un presupuesto
  Para revisar sus líneas y valores congelados

  Escenario: Consultar detalle
    Dado que existe un presupuesto guardado
    Cuando abro su detalle
    Entonces veo número, fecha, cliente, estado y total
    Y veo cada línea con sus costos y precios congelados
    Y los valores mostrados son los del momento de creación, sin recalcular
```

---

### RF-024 — Duplicar presupuesto

- **ID:** RF-024
- **Nombre:** Duplicar presupuesto
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Duplicación de presupuesto
  Como Usuario
  Quiero duplicar un presupuesto existente
  Para crear una nueva propuesta a partir de una anterior

  Escenario: Duplicar presupuesto
    Dado que existe un presupuesto guardado
    Cuando solicito duplicarlo
    Entonces se crea un nuevo presupuesto con el siguiente número secuencial
    Y copia las líneas con los costos de los catálogos vigentes
    Y el nuevo presupuesto nace en estado "Borrador"
    Y el presupuesto original no se modifica
```

---

### RF-025 — Editar presupuesto

- **ID:** RF-025
- **Nombre:** Editar presupuesto
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Edición de presupuesto
  Como Usuario
  Quiero editar un presupuesto existente en estado editable
  Para ajustar líneas o el cliente antes de enviarlo

  Escenario: Editar presupuesto en borrador
    Dado que existe un presupuesto en estado "Borrador"
    Cuando modifico líneas o datos y guardo
    Entonces el presupuesto se recalcula con los valores vigentes
    Y el total se actualiza

  Escenario: No editar presupuestos confirmados
    Dado que un presupuesto está en un estado distinto de "Borrador"
    Cuando intento editarlo
    Entonces el sistema restringe la edición de sus costos
```

---

### RF-026 — Cambiar estado de presupuesto

- **ID:** RF-026
- **Nombre:** Cambiar estado de presupuesto
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Transición de estados
  Como Usuario
  Quiero cambiar el estado de un presupuesto
  Para reflejar su avance (borrador, enviado, aceptado, rechazado, cancelado)

  Escenario: Cambiar estado
    Dado que existe un presupuesto
    Cuando selecciono un nuevo estado válido
    Entonces el presupuesto queda con el nuevo estado
    Y el detalle refleja el cambio
```

---

### RF-027 — Numeración secuencial de presupuestos

- **ID:** RF-027
- **Nombre:** Numeración secuencial de presupuestos
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Numeración
  Como Usuario
  Quiero que cada presupuesto tenga un número único y correlativo
  Para identificar y referenciar los presupuestos

  Escenario: Asignación correlativa
    Dado que existe un presupuesto con número COT-0001
    Cuando guardo el siguiente presupuesto
    Entonces el número asignado es COT-0002
    Y ningún presupuesto comparte número
```

---

### RF-028 — Validaciones y control de errores de cálculo

- **ID:** RF-028
- **Nombre:** Validar entradas y evitar resultados inválidos
- **Usuarios:** Usuario
- **Descripción:**

```gherkin
Funcionalidad: Validación del sistema
  Como Usuario
  Quiero que el sistema valide mis datos y evite errores de cálculo
  Para trabajar con resultados confiables

  Escenario: Validar entradas
    Dado que ingreso datos en cualquier formulario
    Cuando algún dato es obligatorio y está vacío, negativo o no numérico
    Entonces el sistema muestra un mensaje claro de validación
    Y no guarda ni calcula con datos inválidos

  Escenario: Prevenir resultados inválidos
    Dado que realizo un cálculo
    Cuando el resultado fuese NaN, Infinity o un valor vacío
    Entonces el sistema muestra un estado de error controlado
    Y nunca muestra dichos valores en pantalla
```

---

## 4. Requerimientos No Funcionales (RNF)

Formato: `ID · Nombre · Descripción · Criterio de aceptación`.

---

### RNF-001 — Interfaz responsive

- **ID:** RNF-001
- **Nombre:** Interfaz responsive
- **Descripción:** La aplicación debe adaptarse correctamente a computador, tablet y teléfono móvil, priorizando el uso desde celular.
- **Criterio de aceptación:** Todas las pantallas se visualizan y operan sin desbordes ni cortes en pantallas de 360 px de ancho en adelante; los controles táctiles principales tienen un tamaño adecuado para uso móvil.

---

### RNF-002 — Persistencia de datos

- **ID:** RNF-002
- **Nombre:** Persistencia de datos
- **Descripción:** Los datos ingresados deben permanecer almacenados tras cerrar el navegador y no depender del almacenamiento local del navegador. La base de datos es Turso/libSQL en producción y SQLite en archivo en desarrollo.
- **Criterio de aceptación:** Al recargar o volver a abrir la aplicación, los catálogos y presupuestos siguen disponibles; los datos residen en la base de datos remota en producción.

---

### RNF-003 — Precisión monetaria

- **ID:** RNF-003
- **Nombre:** Precisión monetaria
- **Descripción:** Los valores en CLP se manejan sin errores de precisión: cálculo interno en centavos (enteros) y redondeo hacia arriba al entero solo al mostrar.
- **Criterio de aceptación:** Ningún cálculo de dinero arroja diferencias por punto flotante; todo valor mostrado es un número entero; las fórmulas reproducen los ejemplos del Excel (Pasaporte → $1.579; packaging → $40; precio × 1,3).

---

### RNF-004 — Seguridad

- **ID:** RNF-004
- **Nombre:** Seguridad
- **Descripción:** Acceso por HTTPS; separación entre frontend y acceso a datos; validación de datos y protección de operaciones de escritura; la base de datos no se expone al navegador.
- **Criterio de aceptación:** Ninguna credencial ni la base de datos queda accesible desde el cliente; las operaciones de escritura validan tamaños, tipos y rangos; todas las rutas sirven por HTTPS.

---

### RNF-005 — Rendimiento

- **ID:** RNF-005
- **Nombre:** Rendimiento
- **Descripción:** Las vistas de catálogos, la calculadora y el listado de presupuestos deben responder de forma ágil.
- **Criterio de aceptación:** La calculadora recalculan al instante con los datos cargados; el listado de presupuestos carga sin bloqueo perceptible (objetivo: respuesta de API < 1 s en operaciones típicas).

---

### RNF-006 — Usabilidad mobile-first

- **ID:** RNF-006
- **Nombre:** Usabilidad mobile-first
- **Descripción:** La interfaz debe ser simple, clara y rápida, orientada principalmente a la calculadora y optimizada para uso desde celular.
- **Criterio de aceptación:** El acceso a la calculadora requiere como máximo dos toques desde el inicio; los formularios son operables en pantalla táctil; los resultados son legibles sin zoom.

---

### RNF-007 — Mantenibilidad

- **ID:** RNF-007
- **Nombre:** Mantenibilidad
- **Descripción:** La lógica de cálculo debe vivir en un módulo de funciones puras y estar cubierta por pruebas automatizadas.
- **Criterio de aceptación:** Las fórmulas (costo DTF, packaging, subtotal, precio, total) se identifican como funciones unitarias con tests; el repositorio cuenta con tests que validan los casos del Excel.

---

### RNF-008 — Disponibilidad del hosting gratuito

- **ID:** RNF-008
- **Nombre:** Disponibilidad del hosting gratuito
- **Descripción:** La aplicación se despliega en infraestructura gratuita o de muy bajo costo (Vercel plan Hobby + Turso capa gratuita).
- **Criterio de aceptación:** La aplicación queda accesible desde un dominio HTTPS proporcionado por Vercel; la base de datos Turso permanece persistente en el plan gratuito.

---

### RNF-009 — Copias de respaldo (exportación)

- **ID:** RNF-009
- **Nombre:** Copias de respaldo y exportación
- **Descripción:** El sistema debe permitir exportar la información (presupuestos y catálogos) para respaldo; la restauración puede gestionarse después de la primera versión.
- **Criterio de aceptación:** Existe una función de exportación (por ejemplo JSON o SQL) que descarga los datos; el archivo exportado puede reimportarse en el entorno de desarrollo para verificación.

---

### RNF-010 — Actualización de precios sin afectar presupuestos históricos

- **ID:** RNF-010
- **Nombre:** Actualización de precios con congelación de presupuestos
- **Descripción:** Cambiar costos en catálogos o configuración no debe recalcular presupuestos ya guardados.
- **Criterio de aceptación:** Al modificar el costo de una prenda, el precio de un presupuesto anterior permanece sin cambios y coincide exactamente con el valor guardado en su creación.

---

### RNF-011 — Tema claro e identidad visual

- **ID:** RNF-011
- **Nombre:** Tema claro e identidad visual
- **Descripción:** La interfaz debe ser exclusivamente en tema claro (no se contempla modo oscuro) y debe usar la paleta de marca definida:

| Color | Rol | Uso |
|---|---|---|
| `#87012d` | Principal | Fondo de botones principales, encabezados y elementos de acento activos; textos de marca y resaltados. |
| `#350612` | Sombra | Bordes, separadores, sombras de tarjetas, textos de jerarquía y estados oscurecidos del color principal. |
| `#ea0561` | Luz | Estados de hover, foco y elementos interactivos resaltados; acentos secundarios y enlaces. |

- **Criterio de aceptación:** No existe modo oscuro; los elementos de acento (botones, enlaces, resaltados, estados activos/hover/foco) se construyen a partir de la paleta definida; el texto sobre los colores de marca mantiene un contraste legible; los colores quedan centralizados (variables/design tokens) para reutilizarse en todo el sistema.

---

## 5. Anexo — Casos de prueba

Casos mínimos, adaptados de los requisitos originales y del Excel de referencia:

1. **Caso 1 — Una polera:** 1 prenda, 1 diseño, 1 packaging → desglose completo y precio unitario (× 1,3).
2. **Caso 2 — Varias unidades:** 10 prendas, mismo diseño y packaging → total igual a precio unitario exacto × 10 (redondeo final).
3. **Caso 3 — Multi-línea:** cotización con dos líneas (p. ej. distintos tallas) → total = suma de líneas.
4. **Caso 4 — Diferentes prendas:** líneas con tallas, colores y costos distintos → cada línea usa su costo.
5. **Caso 5 — Cambio de costos:** modificar costo de prenda → nuevos presupuestos usan el nuevo valor.
6. **Caso 6 — Presupuesto histórico:** tras cambiar un precio, el presupuesto antiguo conserva sus valores originales (congelación).
7. **Caso 7 — Validación del Excel:** replicar el ejemplo Pasaporte (30×20, $15.000/m, rollo 100×57) → costo estampado $1.579; Bolsa Transparente (1.990/50) → $40; Polera Andesland $8.990; precio ×1,3.