# WebMAP para el Análisis de Erosión en Presas de Relaves

Este repositorio contiene una **WebMAP desarrollada con Leaflet** para visualizar y analizar procesos de erosión en presas de relaves.

El sistema integra:

- ortomosaicos UAV de alta resolución
- estadísticas de pendiente derivadas del terreno
- análisis de clustering espacial mediante **Getis-Ord Gi\***

El visor permite explorar de forma interactiva la relación entre **topografía y patrones de erosión**.

Este proyecto fue desarrollado como una herramienta académica de visualización y análisis espacial.

---

# Mapa Web en Línea

El visor interactivo puede abrirse en:

https://mslwcol.github.io/webmap-erosion/

---

# Recursos

El WebMAP fue desarrollado utilizando:

- Leaflet.js
- JavaScript
- GeoJSON
- GitHub Pages
- Python HTTP Server (para ejecución local)

Plugins de Leaflet utilizados:

- Leaflet MarkerCluster
- Leaflet MiniMap

---

# Capas del Mapa

El WebMAP integra tres conjuntos principales de datos espaciales.

## Ortomosaico

Imágenes UAV de alta resolución utilizadas como mapa base.

Conjuntos disponibles:

- Presa de Relaves Norte
- Presa de Relaves Este

Estos ortomosaicos permiten una visualización detallada de las características del terreno y de las erosiones.

---

## Estadísticas de Pendiente

Capas poligonales que contienen métricas estadísticas derivadas de los valores de pendiente del terreno.

| Variable | Descripción |
|---------|-------------|
| MAX | Pendiente máxima dentro del polígono |
| MEAN | Pendiente media |
| STD | Desviación estándar de la pendiente |
| PCT90 | Percentil 90 de la pendiente |
| MIN | Pendiente mínima |
| MEDIAN | Mediana de la pendiente |
| RANGE | Diferencia entre pendiente máxima y mínima |
| COUNT | Número de celdas del raster dentro del polígono |

Estas estadísticas resumen las **características topográficas de cada unidad de análisis**.

---

## Clustering Espacial (Getis-Ord Gi*)

Capas de puntos que representan agrupamientos espaciales de erosiones calculados mediante el estadístico **Getis-Ord Gi\***.

Interpretación de los valores Gi_Bin:

| Gi_Bin | Interpretación |
|------|---------------|
| 3 | Clustering muy significativo |
| 2 | Clustering significativo |
| 1 | Clustering débil |
| 0 | Sin agrupamiento espacial |
| -1 | Dispersión débil |
| -2 | Dispersión significativa |
| -3 | Dispersión muy significativa |

El estadístico Gi\* permite identificar zonas donde las erosiones presentan **patrones de concentración espacial**.

---

# Funcionalidades del WebMAP

El visor interactivo incluye las siguientes funciones:

- visualización de ortomosaicos
- cambio entre presa Norte y Este
- representación temática de variables de pendiente
- visualización de clustering espacial mediante Gi*
- control de transparencia de polígonos
- leyendas dinámicas
- panel de atributos
- minimapa
- herramienta de medición
- visualización de coordenadas del cursor
- barra de escala
- activación automática del ortomosaico a altos niveles de zoom

---

# Ejecutar el Proyecto Localmente

Para evitar problemas al cargar archivos **GeoJSON o tiles del ortomosaico**, el WebMAP debe ejecutarse mediante un servidor HTTP local.

---

# Paso 1 — Abrir una Terminal en la Carpeta del Proyecto

Navega a la carpeta donde se encuentra el proyecto.

Ejemplo:
```
C:\Users\User\Desktop\webmap-erosion
```
Abre una terminal en esa carpeta.

Puedes hacerlo de dos formas:
```
Shift + Click derecho → **Abrir PowerShell aquí**
```
o abrir una terminal y navegar manualmente:
```
cd C:\Users\User\Desktop\webmap-erosion
```
---

# Paso 2 — Ejecutar un Servidor Local

Ejecuta el siguiente comando:
```
python -m http.server 8000
```
Si utilizas Python Launcher también funciona:
```
py -m http.server 8000
```
---

# Paso 3 — Inicialización del Servidor

La terminal mostrará un mensaje similar a:
```
Serving HTTP on 0.0.0.0 port 8000
```
Esto indica que el servidor está activo.

---

# Paso 4 — Abrir el Mapa

Abre en tu navegador:
```
http://127.0.0.1:8000
```
o
```
http://localhost:8000
```
El visor WebMAP debería cargarse correctamente.

---

# Estructura del Proyecto

La estructura de carpetas debe ser:

```
webmap-erosion
│
├─ index.html
├─ script.js
├─ style.css
│
├─ json
│   ├─ NDGi.geojson
│   ├─ EDGi.geojson
│   ├─ NDSlope.geojson
│   └─ EDSlope.geojson
│
└─ ortomosaico
     ├─ ND
     │   ├─ 18
     │   ├─ 19
     │   ├─ 20
     │   ├─ 21
     │   └─ 22
     │
     └─ ED
         ├─ 18
         ├─ 19
         ├─ 20
         ├─ 21
         └─ 22
```

---

# Detener el Servidor Local

Para detener el servidor presiona:
```
CTRL + C
```
---

# Si el Puerto Está Ocupado

Puedes iniciar el servidor en otro puerto:
```
python -m http.server 5500
```
Luego abre en el navegador:
```
http://127.0.0.1:5500
```
---

# Autor

Desarrollado por **Mariana S. Loo** para la asignatura **Geoportales** de la **Maestría en Geoinformática** y como material complementario del Proyecto de Grado **Modelo de Segmentación de Erosiones** a partir de imágenes de drones ```(Preprint_PG.pdf)```.
