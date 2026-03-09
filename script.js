/* -------------------------------------------------------------------------- */
/* Bloque 1: estado global del mapa y capas                                    */
/* Define las referencias principales del visor, sus capas y el estado actual. */
/* -------------------------------------------------------------------------- */
let map;
let layerControl = null;
let miniMapControl = null;
let scaleControl = null;

let orthoLayer = null;
let esriImagery = null;
let pointsLayer = null;
let slopeLayer = null;

let ndGiData = null;
let edGiData = null;
let ndSlopeData = null;
let edSlopeData = null;

let currentVariable = "MAX";
let currentDam = "ND";
let polygonOpacity = 0.5;

/* -------------------------------------------------------------------------- */
/* Bloque 2: constantes, elementos del DOM y parámetros del proyecto           */
/* Centraliza rutas, selectores HTML, límites espaciales y zoom de trabajo.    */
/* -------------------------------------------------------------------------- */
const DATA_FOLDER = "json";
const ORTHO_AUTO_ZOOM = 19;

const variableSelect = document.getElementById("variableSelect");
const damSelect = document.getElementById("damSelect");
const opacitySlider = document.getElementById("opacitySlider");
const opacityValue = document.getElementById("opacityValue");

const featureInfo = document.getElementById("featureInfo");
const legendContainer = document.getElementById("legend");
const legendTitle = document.getElementById("legendTitle");
const giLegendContainer = document.getElementById("giLegend");
const variableDescription = document.getElementById("variableDescription");
const coordinatesBox = document.getElementById("coordinatesBox");

const ndBounds = L.latLngBounds(
  [8.889142077244362, -80.67947388818256],
  [8.89863953061006, -80.6506347768511]
);

const edBounds = L.latLngBounds(
  [8.859291336259593, -80.65200806786629],
  [8.895925997646508, -80.64239503075551]
);

/* -------------------------------------------------------------------------- */
/* Bloque 3: utilidades generales                                              */
/* Convierte, valida y formatea valores para visualización y análisis.         */
/* -------------------------------------------------------------------------- */
function safeValue(value) {
  return value !== undefined && value !== null && value !== "" ? value : "N/A";
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatNumber(value, decimals = 2) {
  const num = Number(value);

  if (!Number.isFinite(num)) {
    return "N/A";
  }

  return num.toLocaleString("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/* -------------------------------------------------------------------------- */
/* Bloque 4: selección dinámica de datasets y mosaicos                         */
/* Devuelve límites, teselas y datos según la presa seleccionada por usuario.  */
/* -------------------------------------------------------------------------- */
function getCurrentBounds() {
  return currentDam === "ND" ? ndBounds : edBounds;
}

function getCurrentTilePath() {
  return currentDam === "ND"
    ? "ortomosaico/ND/{z}/{x}/{y}.jpg"
    : "ortomosaico/ED/{z}/{x}/{y}.jpg";
}

function getCurrentPointsData() {
  return currentDam === "ND" ? ndGiData : edGiData;
}

function getCurrentSlopeData() {
  return currentDam === "ND" ? ndSlopeData : edSlopeData;
}

/* -------------------------------------------------------------------------- */
/* Bloque 5: simbología de polígonos de pendiente                              */
/* Asigna colores a cada unidad espacial según la variable topográfica activa. */
/* -------------------------------------------------------------------------- */
function getColor(value, variable) {
  if (value === null) return "#cccccc";

  switch (variable) {
    case "MEAN":
      return value > 35 ? "#67000d" :
             value > 28 ? "#a50f15" :
             value > 20 ? "#cb181d" :
             value > 12 ? "#ef3b2c" :
                          "#fcbba1";

    case "MAX":
      return value > 70 ? "#800026" :
             value > 55 ? "#BD0026" :
             value > 40 ? "#E31A1C" :
             value > 25 ? "#FC4E2A" :
                          "#FD8D3C";

    case "STD":
      return value > 18 ? "#54278f" :
             value > 14 ? "#756bb1" :
             value > 10 ? "#9e9ac8" :
             value > 6  ? "#cbc9e2" :
                          "#f2f0f7";

    case "PCT90":
      return value > 55 ? "#084081" :
             value > 45 ? "#0868ac" :
             value > 35 ? "#2b8cbe" :
             value > 25 ? "#4eb3d3" :
                          "#7bccc4";

    default:
      return "#cccccc";
  }
}

function getLegendItems(variable) {
  switch (variable) {
    case "MEAN":
      return [
        { color: "#fcbba1", label: "≤ 12" },
        { color: "#ef3b2c", label: "12 - 20" },
        { color: "#cb181d", label: "20 - 28" },
        { color: "#a50f15", label: "28 - 35" },
        { color: "#67000d", label: "> 35" }
      ];

    case "MAX":
      return [
        { color: "#FD8D3C", label: "≤ 25" },
        { color: "#FC4E2A", label: "25 - 40" },
        { color: "#E31A1C", label: "40 - 55" },
        { color: "#BD0026", label: "55 - 70" },
        { color: "#800026", label: "> 70" }
      ];

    case "STD":
      return [
        { color: "#f2f0f7", label: "≤ 6" },
        { color: "#cbc9e2", label: "6 - 10" },
        { color: "#9e9ac8", label: "10 - 14" },
        { color: "#756bb1", label: "14 - 18" },
        { color: "#54278f", label: "> 18" }
      ];

    case "PCT90":
      return [
        { color: "#7bccc4", label: "≤ 25" },
        { color: "#4eb3d3", label: "25 - 35" },
        { color: "#2b8cbe", label: "35 - 45" },
        { color: "#0868ac", label: "45 - 55" },
        { color: "#084081", label: "> 55" }
      ];

    default:
      return [];
  }
}

function updateLegend() {
  const items = getLegendItems(currentVariable);
  legendContainer.innerHTML = "";
  legendTitle.textContent = `Variable de pendiente: ${currentVariable}`;

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "legend-item";

    const colorBox = document.createElement("span");
    colorBox.className = "legend-color";
    colorBox.style.backgroundColor = item.color;

    const label = document.createElement("span");
    label.textContent = item.label;

    row.appendChild(colorBox);
    row.appendChild(label);
    legendContainer.appendChild(row);
  });
}

/* -------------------------------------------------------------------------- */
/* Bloque 6: simbología de puntos Gi*                                          */
/* Define colores y leyenda para la intensidad del clustering espacial.        */
/* -------------------------------------------------------------------------- */
function getGiColor(bin) {
  const value = Number(bin);

  switch (value) {
    case 3: return "#b2182b";
    case 2: return "#ef8a62";
    case 1: return "#fddbc7";
    case 0: return "#f7f7f7";
    case -1: return "#d1e5f0";
    case -2: return "#67a9cf";
    case -3: return "#2166ac";
    default: return "#cccccc";
  }
}

function updateGiLegend() {
  const items = [
    { color: "#b2182b", label: "99% - Clustering significativo" },
    { color: "#ef8a62", label: "95% - Clustering significativo" },
    { color: "#fddbc7", label: "90% - Clustering significativo" },
    { color: "#f7f7f7", label: "0 - Sin agrupamiento espacial" },
    { color: "#d1e5f0", label: "-90% - Clustering débil" },
    { color: "#67a9cf", label: "-95% - Clustering débil" },
    { color: "#2166ac", label: "-99% - Clustering débil" }
  ];

  giLegendContainer.innerHTML = "";

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "gi-item";

    const colorBox = document.createElement("span");
    colorBox.className = "gi-color";
    colorBox.style.backgroundColor = item.color;

    const label = document.createElement("span");
    label.textContent = item.label;

    row.appendChild(colorBox);
    row.appendChild(label);
    giLegendContainer.appendChild(row);
  });
}

/* -------------------------------------------------------------------------- */
/* Bloque 7: contenido explicativo del panel lateral                           */
/* Actualiza el texto interpretativo según la estadística de pendiente activa. */
/* -------------------------------------------------------------------------- */
function updateVariableDescription() {
  const descriptions = {
    MAX: "Valor máximo de pendiente dentro de cada polígono. Permite identificar sectores con gradientes topográficos altos, relevantes para reconocer condiciones asociadas a procesos erosivos.",
    MEAN: "Pendiente media dentro de cada polígono. Resume la condición general del terreno y facilita una interpretación más estable del comportamiento topográfico.",
    STD: "Desviación estándar de la pendiente. Indica la variabilidad interna del relieve dentro de cada unidad; valores altos sugieren mayor heterogeneidad topográfica.",
    PCT90: "Percentil 90 de pendiente. Representa condiciones altas de pendiente de forma robusta, sin depender exclusivamente del valor máximo."
  };

  variableDescription.innerHTML = `
    <h4>¿Qué muestra el mapa?</h4>
    <p>
      El ortomosaico corresponde a imágenes aéreas de alta resolución de las presas de relaves Norte y Este. Estas imágenes sirven como base cartográfica para visualizar la distribución espacial de la erosión y analizar su relación con la pendiente del terreno.
    </p>
    <ul>
      <li><b>Estadísticas de pendiente:</b> sintetizan el comportamiento topográfico de cada unidad de análisis.</li>
      <li><b>Estadística Gi* de Getis-Ord:</b> representan clustering espacial asociado a la distribución de puntos calientes por erosiones.</li>
      <li><b>${currentVariable}:</b> ${descriptions[currentVariable] || "Sin descripción disponible."}</li>
    </ul>
  `;
}

/* -------------------------------------------------------------------------- */
/* Bloque 8: estilo e interacción de polígonos                                 */
/* Renderiza la capa de pendiente y define hover, clic y popups.               */
/* -------------------------------------------------------------------------- */
function styleSlopeFeature(feature) {
  const value = toNumber(feature.properties?.[currentVariable]);

  return {
    color: "#111111",
    weight: 1,
    fillColor: getColor(value, currentVariable),
    fillOpacity: polygonOpacity
  };
}

function updateSlopeStyle() {
  if (!slopeLayer) return;
  slopeLayer.setStyle(styleSlopeFeature);
}

function updateSlopeInfo(props) {
  featureInfo.innerHTML = `
    <h4>Estadísticas de pendiente</h4>
    <ul>
      <li><b>Mínimo:</b> ${formatNumber(props.MIN)}</li>
      <li><b>Máximo:</b> ${formatNumber(props.MAX)}</li>
      <li><b>Rango:</b> ${formatNumber(props.RANGE)}</li>
      <li><b>Media:</b> ${formatNumber(props.MEAN)}</li>
      <li><b>Mediana:</b> ${formatNumber(props.MEDIAN)}</li>
      <li><b>Desviación estándar:</b> ${formatNumber(props.STD)}</li>
      <li><b>Percentil 90:</b> ${formatNumber(props.PCT90)}</li>
    </ul>
  `;
}

function onEachSlopeFeature(feature, layer) {
  const props = feature.properties || {};

  layer.bindPopup(`
    <b>Área:</b> ${formatNumber(props.AREA)}<br>
    <b>Media:</b> ${formatNumber(props.MEAN)}<br>
    <b>Máximo:</b> ${formatNumber(props.MAX)}<br>
    <b>Desviación estándar:</b> ${formatNumber(props.STD)}<br>
    <b>Percentil 90:</b> ${formatNumber(props.PCT90)}
  `);

  layer.on({
    mouseover: function (e) {
      e.target.setStyle({
        weight: 2.5,
        color: "#000000",
        fillOpacity: Math.min(polygonOpacity + 0.25, 1)
      });
      e.target.bringToFront();
    },
    mouseout: function () {
      updateSlopeStyle();
    },
    click: function () {
      updateSlopeInfo(props);
      layer.openPopup();
      ensureOrthomosaicByZoom();
    }
  });
}

function buildSlopeLayer(data) {
  return L.geoJSON(data, {
    style: styleSlopeFeature,
    onEachFeature: onEachSlopeFeature
  });
}

/* -------------------------------------------------------------------------- */
/* Bloque 9: estilo e interacción de puntos Gi*                                */
/* Construye la capa clusterizada de puntos de significancia espacial.         */
/* -------------------------------------------------------------------------- */
function updatePointInfo(props) {
  featureInfo.innerHTML = `
    <h4>Estadísticas Gi*</h4>
    <ul>
      <li><b>ID fuente:</b> ${safeValue(props.SOURCE_ID)}</li>
      <li><b>ID del elemento:</b> ${safeValue(props.EDSta_OBJE ?? props.NDSta_OBJE ?? props.NDSta_OBJE_1 ?? props.OBJECTID)}</li>
      <li><b>GiZScore:</b> ${formatNumber(props.GiZScore, 2)}</li>
      <li><b>GiPValue:</b> ${formatNumber(props.GiPValue, 6)}</li>
      <li><b>Número de vecinos:</b> ${formatNumber(props.NNeighbors, 0)}</li>
      <li><b>Clase Gi_Bin:</b> ${safeValue(props.Gi_Bin)}</li>
    </ul>
  `;
}

function onEachPointFeature(feature, layer) {
  const props = feature.properties || {};

  layer.bindPopup(`
    <b>ID fuente:</b> ${safeValue(props.SOURCE_ID)}<br>
    <b>GiZScore:</b> ${formatNumber(props.GiZScore, 2)}<br>
    <b>GiPValue:</b> ${formatNumber(props.GiPValue, 6)}<br>
    <b>Número de vecinos:</b> ${formatNumber(props.NNeighbors, 0)}<br>
    <b>Clase Gi_Bin:</b> ${safeValue(props.Gi_Bin)}
  `);

  layer.on("click", function () {
    updatePointInfo(props);
  });
}

function buildPointsLayer(data) {
  const clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    disableClusteringAtZoom: 21
  });

  const geojsonLayer = L.geoJSON(data, {
    pointToLayer: function (feature, latlng) {
      const bin = feature.properties?.Gi_Bin;

      return L.circleMarker(latlng, {
        radius: 5,
        color: "#111111",
        weight: 0.8,
        fillColor: getGiColor(bin),
        fillOpacity: 0.9
      });
    },
    onEachFeature: onEachPointFeature
  });

  geojsonLayer.eachLayer(layer => {
    clusterGroup.addLayer(layer);
  });

  return clusterGroup;
}

/* -------------------------------------------------------------------------- */
/* Bloque 10: control de capas                                                  */
/* Reconstruye el selector de capas base y overlays visibles del visor.        */
/* -------------------------------------------------------------------------- */
function updateLayerControl() {
  if (layerControl) {
    map.removeControl(layerControl);
  }

  const baseMaps = {};
  const overlays = {};

  if (esriImagery) {
    baseMaps["Vista satelital"] = esriImagery;
  }

  if (orthoLayer) {
    baseMaps["Ortomosaico del estudio"] = orthoLayer;
  }

  if (slopeLayer) {
    overlays["Estadísticas de pendiente"] = slopeLayer;
  }

  if (pointsLayer) {
    overlays["Puntos Gi*"] = pointsLayer;
  }

  layerControl = L.control.layers(baseMaps, overlays, {
    collapsed: false
  }).addTo(map);
}

/* -------------------------------------------------------------------------- */
/* Bloque 11: ortomosaico y conmutación automática por zoom                    */
/* Cambia entre vista satelital y ortomosaico local según el nivel de zoom.    */
/* -------------------------------------------------------------------------- */
function ensureOrthomosaicByZoom() {
  if (!map || !orthoLayer || !esriImagery) return;

  const zoom = map.getZoom();

  if (zoom >= ORTHO_AUTO_ZOOM) {
    if (!map.hasLayer(orthoLayer)) {
      map.addLayer(orthoLayer);
    }
    if (map.hasLayer(esriImagery)) {
      map.removeLayer(esriImagery);
    }
  }
}

function rebuildBaseMap() {
  const bounds = getCurrentBounds();
  const path = getCurrentTilePath();
  const orthoWasVisible = orthoLayer ? map.hasLayer(orthoLayer) : true;

  if (orthoLayer) {
    map.removeLayer(orthoLayer);
  }

  orthoLayer = L.tileLayer(path, {
    tms: true,
    minZoom: 18,
    maxZoom: 22,
    bounds,
    noWrap: true,
    attribution: "Ortomosaico del estudio"
  });

  if (orthoWasVisible) {
    orthoLayer.addTo(map);
  }

  map.fitBounds(bounds, { padding: [20, 20] });
  updateMiniMap();
  ensureOrthomosaicByZoom();
  updateLayerControl();
}

/* -------------------------------------------------------------------------- */
/* Bloque 12: reconstrucción de capas temáticas                                */
/* Vuelve a dibujar puntos y polígonos cuando cambian presa o variable.        */
/* -------------------------------------------------------------------------- */
function rebuildDataLayers() {
  const pointsData = getCurrentPointsData();
  const slopeData = getCurrentSlopeData();

  if (!pointsData || !slopeData) return;

  const wasPointsVisible = pointsLayer ? map.hasLayer(pointsLayer) : true;
  const wasSlopeVisible = slopeLayer ? map.hasLayer(slopeLayer) : true;

  if (pointsLayer) {
    map.removeLayer(pointsLayer);
  }

  if (slopeLayer) {
    map.removeLayer(slopeLayer);
  }

  slopeLayer = buildSlopeLayer(slopeData);
  pointsLayer = buildPointsLayer(pointsData);

  if (wasSlopeVisible) {
    slopeLayer.addTo(map);
  }

  if (wasPointsVisible) {
    pointsLayer.addTo(map);
  }

  updateLegend();
  updateGiLegend();
  updateVariableDescription();
  updateLayerControl();
}

/* -------------------------------------------------------------------------- */
/* Bloque 13: soporte para posición bottomcenter                               */
/* Añade una nueva esquina de controles para ubicar la escala en el centro.    */
/* -------------------------------------------------------------------------- */
function addBottomCenterControlPosition() {
  if (map._controlCorners.bottomcenter) {
    return;
  }

  const className = "leaflet-";
  const container = map._controlContainer;
  const bottom = L.DomUtil.create("div", `${className}bottom ${className}center`, container);

  map._controlCorners.bottomcenter = bottom;
}

/* -------------------------------------------------------------------------- */
/* Bloque 14: controles cartográficos extra                                    */
/* Configura escala centrada, coordenadas del cursor y mapa de contexto.       */
/* -------------------------------------------------------------------------- */
function setupScaleControl() {
  addBottomCenterControlPosition();

  scaleControl = L.control.scale({
    metric: true,
    imperial: false,
    position: "bottomcenter"
  }).addTo(map);
}

function setupCoordinateDisplay() {
  map.on("mousemove", function (e) {
    coordinatesBox.textContent = `Lat: ${e.latlng.lat.toFixed(6)} | Lon: ${e.latlng.lng.toFixed(6)}`;
  });

  map.on("mouseout", function () {
    coordinatesBox.textContent = "Lat: -- | Lon: --";
  });
}

function createMiniMapLayer() {
  return L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "© OpenStreetMap",
      minZoom: 0,
      maxZoom: 19
    }
  );
}

function updateMiniMap() {
  if (!map || typeof L.Control.MiniMap !== "function") {
    return;
  }

  if (miniMapControl) {
    map.removeControl(miniMapControl);
  }

  miniMapControl = new L.Control.MiniMap(createMiniMapLayer(), {
    position: "bottomright",
    width: 170,
    height: 170,
    zoomLevelOffset: -5,
    toggleDisplay: true,
    minimized: false,
    aimingRectOptions: {
      color: "#1d4ed8",
      weight: 1,
      opacity: 0.9
    }
  }).addTo(map);
}

function setupAutoOrthoZoom() {
  map.on("zoomend", function () {
    ensureOrthomosaicByZoom();
  });
}

/* -------------------------------------------------------------------------- */
/* Bloque 15: carga asíncrona de datos GeoJSON                                 */
/* Descarga los archivos de entrada y activa el renderizado temático.          */
/* -------------------------------------------------------------------------- */
async function loadData() {
  try {
    const [
      ndGiResponse,
      edGiResponse,
      ndSlopeResponse,
      edSlopeResponse
    ] = await Promise.all([
      fetch(`${DATA_FOLDER}/NDGi.geojson`),
      fetch(`${DATA_FOLDER}/EDGi.geojson`),
      fetch(`${DATA_FOLDER}/NDSlope.geojson`),
      fetch(`${DATA_FOLDER}/EDSlope.geojson`)
    ]);

    if (!ndGiResponse.ok) throw new Error("No se pudo cargar NDGi.geojson");
    if (!edGiResponse.ok) throw new Error("No se pudo cargar EDGi.geojson");
    if (!ndSlopeResponse.ok) throw new Error("No se pudo cargar NDSlope.geojson");
    if (!edSlopeResponse.ok) throw new Error("No se pudo cargar EDSlope.geojson");

    ndGiData = await ndGiResponse.json();
    edGiData = await edGiResponse.json();
    ndSlopeData = await ndSlopeResponse.json();
    edSlopeData = await edSlopeResponse.json();

    rebuildBaseMap();
    rebuildDataLayers();
  } catch (error) {
    console.error("Error cargando los GeoJSON:", error);

    featureInfo.innerHTML = `
      <h4>Error de carga</h4>
      <p>No se pudieron cargar uno o más archivos GeoJSON. Revisa la consola del navegador y verifica la estructura del proyecto.</p>
    `;
  }
}

/* -------------------------------------------------------------------------- */
/* Bloque 16: eventos de interfaz                                              */
/* Sincroniza selectores y slider con la actualización visual del mapa.        */
/* -------------------------------------------------------------------------- */
function setupControls() {
  variableSelect.addEventListener("change", function (event) {
    currentVariable = event.target.value;
    rebuildDataLayers();
  });

  damSelect.addEventListener("change", function (event) {
    currentDam = event.target.value;
    rebuildBaseMap();
    rebuildDataLayers();
  });

  opacitySlider.addEventListener("input", function (event) {
    polygonOpacity = Number(event.target.value);
    opacityValue.textContent = polygonOpacity.toFixed(2);
    updateSlopeStyle();
  });
}

/* -------------------------------------------------------------------------- */
/* Bloque 17: inicialización del visor                                         */
/* Crea el mapa principal, capas base, controles y arranca la carga de datos. */
/* -------------------------------------------------------------------------- */
function initMap() {
  map = L.map("map", {
    zoomControl: true
  }).setView([8.894, -80.661], 18);

  esriImagery = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles © Esri, Maxar, Earthstar Geographics",
      maxZoom: 22
    }
  ).addTo(map);

  orthoLayer = L.tileLayer(getCurrentTilePath(), {
    tms: true,
    minZoom: 18,
    maxZoom: 22,
    bounds: getCurrentBounds(),
    noWrap: true,
    attribution: "Ortomosaico del estudio"
  }).addTo(map);

  map.fitBounds(ndBounds, { padding: [20, 20] });

  setupScaleControl();
  setupCoordinateDisplay();
  updateMiniMap();
  setupAutoOrthoZoom();
  setupControls();
  updateLegend();
  updateGiLegend();
  updateVariableDescription();
  updateLayerControl();
  ensureOrthomosaicByZoom();
  loadData();
}

/* -------------------------------------------------------------------------- */
/* Bloque 18: arranque de la aplicación                                        */
/* Ejecuta la inicialización cuando el archivo JavaScript es cargado.          */
/* -------------------------------------------------------------------------- */
initMap();