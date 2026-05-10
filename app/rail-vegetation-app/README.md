# README - Aplicación React del prototipo de vegetación ferroviaria

## Objetivo

Este frontend muestra un mapa base y superpone la información geoespacial del prototipo:

* eje ferroviario,
* bloques NDVI descargados,
* manifiesto de bloques procesados.

La aplicación se ha creado con **React + Vite + TypeScript**.

---

## Creación del proyecto

```bash
npm create vite@latest rail-vegetation-app -- --template react-ts
cd rail-vegetation-app
npm install
```

---

## Librerías necesarias

Instalar las dependencias mínimas del visor:

```bash
npm install leaflet react-leaflet geotiff
npm install -D @types/leaflet
```

### Motivo de cada librería

* `leaflet`: motor de mapa web.
* `react-leaflet`: integración de Leaflet con React.
* `geotiff`: lectura de archivos GeoTIFF en cliente.
* `@types/leaflet`: tipado para TypeScript.

---

## Framework de estilos

Para la interfaz se usará **Tailwind CSS**.

### Instalación de Tailwind en Vite

```bash
npm install tailwindcss @tailwindcss/vite
```

### Configuración en `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

### Importación de Tailwind en `src/index.css`

```css
@import "tailwindcss";
```

---

## Arranque del proyecto

Instalar dependencias y arrancar el servidor de desarrollo:

```bash
npm install
npm run dev
```

---

## Tipo de mapa base previsto

La aplicación debe soportar un mapa base con distintas visualizaciones:

* **satélite**, para inspección visual del entorno,
* **tema claro**, para trabajo analítico,
* **tema oscuro**, para una visualización más limpia del overlay.

Sobre ese mapa base se dibujarán:

* la vía ferroviaria,
* los bloques o capas ráster NDVI,
* los elementos gráficos del prototipo.

---

## Estructura de carpetas

Estructura recomendada del proyecto:

```text
rail-vegetation-app/
├─ public/
│  └─ data/
│     ├─ rail/
│     │  └─ soria_torralba_axis.geojson
│     └─ ndvi_blocks/
│        └─ soria_torralba/
│           ├─ manifest.json
│           ├─ manifest.csv
│           ├─ 2026-04-22/
│           │  ├─ soria_torralba_kmX_Y_ndvi.tif
│           │  └─ soria_torralba_kmX_Y_metadata.json
│           └─ 2026-04-27/
│              ├─ soria_torralba_kmX_Y_ndvi.tif
│              └─ soria_torralba_kmX_Y_metadata.json
├─ src/
│  ├─ components/
│  ├─ pages/
│  ├─ types/
│  ├─ App.tsx
│  └─ main.tsx
├─ package.json
└─ tsconfig.json
```

---

## Datos que hay que copiar al frontend

Dentro de `public/data/` hay que copiar los datos generados en la fase previa de notebooks.

### 1. Eje ferroviario

Copiar el GeoJSON de la vía a:

```text
public/data/rail/soria_torralba_axis.geojson
```

### 2. Manifest del corredor

Copiar los ficheros de inventario a:

```text
public/data/ndvi_blocks/soria_torralba/manifest.json
public/data/ndvi_blocks/soria_torralba/manifest.csv
```

### 3. Bloques NDVI descargados

Copiar las carpetas de fecha con los rásteres y metadatos a:

```text
public/data/ndvi_blocks/soria_torralba/<fecha>/
```

Por ejemplo:

```text
public/data/ndvi_blocks/soria_torralba/2026-04-27/
public/data/ndvi_blocks/soria_torralba/2026-04-22/
```

Cada carpeta de fecha contendrá archivos como:

* `soria_torralba_km0_1_ndvi.tif`
* `soria_torralba_km0_1_metadata.json`

---

## Resumen de instalación

```bash
npm install leaflet react-leaflet geotiff
npm install -D @types/leaflet
```

---

## Resumen de datos necesarios

La aplicación necesita disponer de estos tres grupos de datos:

* `rail`: eje ferroviario en GeoJSON,
* `manifest`: inventario de bloques descargados,
* `ndvi_blocks`: GeoTIFFs y metadatos organizados por fecha.
