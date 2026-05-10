# README - Prototipo de monitorización de vegetación cercana a vía ferroviaria

## Objetivo

Construir un prototipo que permita visualizar, sobre un mapa, la vegetación cercana a una línea ferroviaria usando datos ráster NDVI de Copernicus/Sentinel-2.

El objetivo del **MVP** es:

* obtener datos NDVI por píxel de un corredor ferroviario,
* representar esos píxeles sobre un mapa,
* resaltar visualmente los píxeles con vegetación potencialmente peligrosa,
* dejar preparada la arquitectura para una futura fase de histórico temporal.

---

## Alcance del MVP

### Incluye

* Obtención de la geometría de la vía.
* Segmentación de la vía en bloques manejables.
* Generación de buffers laterales para definir el corredor de análisis.
* Descarga de ráster NDVI por bloque desde Copernicus.
* Representación visual en una aplicación React.
* Clasificación visual de píxeles según nivel de vegetación.

### No incluye todavía

* Time lapse o histórico temporal bajo demanda.
* Sistema avanzado de alertas automatizadas.
* Cálculo sofisticado de riesgo por especie, altura o densidad real de vegetación.
* Backend complejo de persistencia o cacheado.

---

## Decisiones de diseño tomadas

### 1. Se trabaja con ráster, no con estadísticas agregadas

Se descarta el enfoque de estadísticas por tramo porque puede ocultar vegetación puntual relevante.

Se usará un enfoque **pixel a pixel** mediante ráster NDVI.

### 2. La unidad de descarga será el bloque de 1 km

La vía no se dividirá en puntos, sino en **segmentos de línea**.

Cada segmento de trabajo será de **1 km**.

### 3. Cada bloque tendrá un buffer lateral de 100 m

A cada segmento de 1 km se le aplica un **buffer de 100 m a cada lado** para generar el corredor de análisis.

### 4. El análisis fino se hará en postproceso local

No se pedirán anillos internos a Copernicus en esta fase.

Se descargará el ráster NDVI del corredor completo y el filtrado fino se hará localmente o en la aplicación.

### 5. La visualización se hará en React

La aplicación final del prototipo será una app web en **React**, con foco principal en mapa interactivo y visualización de píxeles.

---

## Arquitectura por fases

# Fase 1 - Obtención de datos

## Paso 1. Obtener la geometría de la vía

**Entrada:**

* fichero `via.geojson` con la línea ferroviaria.

**Resultado esperado:**

* una geometría limpia y válida de la vía a analizar.

**Notas:**

* revisar que la línea no tenga geometrías corruptas,
* verificar el sistema de coordenadas,
* dejar la vía preparada para reproyección y corte en segmentos.

---

## Paso 2. Reproyectar la geometría a un sistema en metros

Para poder cortar en distancias reales y hacer buffers correctos, la geometría debe estar en un CRS métrico.

**Objetivo:**

* trabajar en metros reales para poder crear segmentos de 1 km y buffers de 100 m.

**Salida:**

* línea ferroviaria en CRS métrico.

---

## Paso 3. Granular la vía en segmentos de 1 km

La línea ferroviaria completa se divide en **segmentos de línea de 1 km**.

**Importante:**

* no se divide en puntos,
* no se generan círculos,
* se generan mini tramos de línea.

**Salida:**

* una colección de segmentos con estructura similar a:

  * `block_id`
  * `km_start`
  * `km_end`
  * `geometry`

---

## Paso 4. Generar un buffer de 100 m por segmento

A cada segmento de 1 km se le aplica un buffer de 100 m.

Esto define el **corredor espacial** del que se descargará el NDVI.

**Salida:**

* un polígono por bloque, listo para usarse en la petición a Copernicus.

**Ejemplo conceptual:**

* segmento de línea: 1 km
* buffer lateral: 100 m
* resultado: una cápsula o corredor geográfico alrededor de ese tramo

---

## Paso 5. Generar la lista de peticiones ráster

Para cada polígono buffer generado, se prepara una petición al servicio de Copernicus.

### Parámetros recomendados del MVP

* Dataset: Sentinel-2 L2A
* Producto: NDVI por píxel
* Resolución: 10 m
* Unidad de descarga: 1 bloque = 1 km + buffer 100 m
* Salida: GeoTIFF georreferenciado

### Resultado esperado

* un GeoTIFF NDVI por bloque
* aproximadamente 100 peticiones para una línea de 100 km

---

## Paso 6. Descargar los ráster NDVI

Se ejecutan las peticiones al servicio de Copernicus/Sentinel Hub.

### Estrategia inicial recomendada

Usar **Processing API** para la primera implementación porque es la forma más simple de validar el pipeline.

### Evolución futura

Si el volumen crece o se automatiza el histórico, migrar a un esquema asíncrono.

**Salida:**

* carpeta con GeoTIFF NDVI por bloque
* metadatos mínimos por bloque y fecha

---

# Fase 2 - Postproceso mínimo del MVP

## Objetivo de esta fase

Preparar los ráster descargados para su visualización.

Esta fase no es todavía análisis complejo, sino una preparación ligera de datos.

## Paso 7. Leer los GeoTIFF y normalizar la estructura

Para cada bloque descargado:

* leer el ráster,
* conservar su georreferenciación,
* dejar accesibles los valores NDVI por píxel.

---

## Paso 8. Aplicar reglas visuales simples

Definir una primera lógica de representación:

* valores bajos de vegetación: tonos claros o blancos
* vegetación media: verdes suaves
* vegetación alta: verdes intensos
* píxeles peligrosos: rojo

### Ejemplo de regla simple del MVP

* NDVI bajo: blanco/gris claro
* NDVI medio: verde claro
* NDVI alto: verde oscuro
* NDVI por encima de umbral de peligro: rojo

**Nota:**
El umbral de peligro puede fijarse inicialmente de manera manual para prototipo.

---

## Paso 9. Preparar una salida consumible por frontend

Opciones posibles:

### opción A

Servir directamente tiles o imágenes procesadas.

### opción B

Servir los GeoTIFF y procesarlos parcialmente en frontend.

### opción C

Generar un formato intermedio más ligero para visualización.

### Recomendación para el MVP

Escoger la opción más simple que permita:

* pintar la vía,
* pintar el corredor,
* superponer el ráster,
* aplicar la rampa de color.

---

# Fase 3 - Representación visual en React

## Objetivo

Construir una aplicación React con una vista principal de vigilancia geoespacial.

---

## Pantalla 1 - Vista principal del mapa

### Elementos principales

* barra superior con nombre del producto
* selector de línea o tramo
* fecha de observación
* botón de capas
* mapa central grande
* línea ferroviaria dibujada
* corredor analizado visible
* ráster NDVI superpuesto al mapa
* píxeles peligrosos destacados en rojo
* leyenda visual NDVI
* controles de zoom y navegación

### Diseño visual esperado

* fondo sobrio y profesional
* colores tipo blanco -> verde -> rojo
* la vía debe verse claramente por encima del ráster
* el mapa es la pieza dominante de la interfaz

### Interacción

* el usuario debe poder navegar el mapa,
* cambiar la opacidad de capas,
* interpretar rápidamente dónde hay zonas con vegetación alta.

---

## Lógica visual del MVP

### Capas recomendadas

1. mapa base satelital o neutro
2. línea ferroviaria
3. corredor de análisis
4. capa ráster NDVI
5. resaltado de peligro

### Escala visual recomendada

* blanco / gris muy claro: NDVI muy bajo
* verde claro: NDVI moderado
* verde oscuro: NDVI alto
* rojo: píxel con peligro o umbral superado

---

## Fase 2 futura en frontend

Esta parte no entra en el MVP inicial, pero debe quedar prevista.

### Interacción futura

Cuando el usuario haga clic en un píxel o pequeña zona:

* se abrirá un popup o panel lateral,
* se hará una consulta temporal bajo demanda,
* se mostrará histórico de NDVI de esa microzona,
* aparecerá un spinner mientras carga.

### Elementos de esa futura pantalla secundaria

* mini mapa de detalle
* valor NDVI actual
* distancia a la vía
* gráfico temporal de 8 a 12 observaciones
* indicador de crecimiento

---

# Estructura recomendada del trabajo

## Parte 1 - Pipeline de datos

Incluye:

* lectura de vía GeoJSON
* reproyección
* segmentación en bloques de 1 km
* buffer 100 m
* petición a Copernicus
* descarga de GeoTIFF NDVI

## Parte 2 - Aplicación visual

Incluye:

* app React
* mapa principal
* superposición del ráster NDVI
* rampa de color blanco-verde-rojo
* representación de la línea ferroviaria
* vista clara de riesgo visual

---

# MVP final esperado

Al terminar esta primera iteración, el prototipo debe permitir:

1. cargar una línea ferroviaria,
2. dividirla en bloques de trabajo,
3. descargar el NDVI ráster del corredor,
4. pintar esos píxeles en un mapa,
5. resaltar visualmente las zonas de vegetación peligrosa,
6. dejar preparada la arquitectura para histórico temporal futuro.

---

# Posibles mejoras posteriores

## Mejora 1

Añadir histórico temporal bajo demanda al hacer clic.

## Mejora 2

Añadir cacheado de resultados para no repetir peticiones.

## Mejora 3

Añadir backend Python para servir ráster, histórico y reglas de alerta.

## Mejora 4

Añadir clasificación más avanzada de riesgo por proximidad a la vía.

## Mejora 5

Automatizar ejecución periódica por fechas y generación de alertas.

---

# Resumen ejecutivo

La solución definida para el prototipo es:

* trabajar con **ráster NDVI**, no con estadísticas agregadas,
* dividir la vía en **bloques de 1 km**,
* aplicar **buffer de 100 m** a cada bloque,
* descargar los datos desde Copernicus,
* hacer un postproceso visual mínimo,
* construir una app **React** centrada en mapa,
* dejar el histórico temporal para una segunda fase.
