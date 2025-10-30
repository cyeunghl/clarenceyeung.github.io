import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { BufferGeometryUtils } from 'https://unpkg.com/three@0.158.0/examples/jsm/utils/BufferGeometryUtils.js';

const DATA_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson';

const container = document.getElementById('globe-container');
const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0, 3.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = false;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 1.5;
controls.maxDistance = 4;

let isUserInteracting = false;
controls.addEventListener('start', () => {
  isUserInteracting = true;
});
controls.addEventListener('end', () => {
  isUserInteracting = false;
});

const globeGroup = new THREE.Group();
scene.add(globeGroup);

const markersGroup = new THREE.Group();
markersGroup.name = 'markers';
globeGroup.add(markersGroup);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(2, 2, 2);
scene.add(directionalLight);

directionalLight.castShadow = false;

const GLOBE_RADIUS = 1;
const LAND_RADIUS = GLOBE_RADIUS + 0.02;
const MARKER_RADIUS = GLOBE_RADIUS + 0.04;

const oceanGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 128, 128);
const oceanMaterial = new THREE.MeshLambertMaterial({
  color: 0x7aaed6,
  emissive: 0x000000,
  side: THREE.FrontSide,
});
const oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
oceanMesh.name = 'ocean';
globeGroup.add(oceanMesh);

loadLandPolygons().catch((error) => {
  console.error('Failed to load land polygons:', error);
});

loadActivities().catch((error) => {
  console.error('Failed to load activity markers:', error);
});

function onResize() {
  const { clientWidth, clientHeight } = container;
  const width = clientWidth;
  const height = clientHeight;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', onResize);
requestAnimationFrame(() => {
  onResize();
  renderer.render(scene, camera);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (!isUserInteracting) {
    globeGroup.rotation.y += 0.0005;
  }

  renderer.render(scene, camera);
}

animate();

async function loadLandPolygons() {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`GeoJSON request failed with ${response.status}`);
  }
  const data = await response.json();
  const geometries = [];

  for (const feature of data.features) {
    const { geometry } = feature;
    if (!geometry) continue;

    if (geometry.type === 'Polygon') {
      const geom = polygonToGeometry(geometry.coordinates);
      if (geom) geometries.push(geom);
    } else if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        const geom = polygonToGeometry(polygon);
        if (geom) geometries.push(geom);
      }
    }
  }

  if (!geometries.length) {
    console.warn('No land geometries were generated from the GeoJSON data.');
    return;
  }

  const merged = BufferGeometryUtils.mergeBufferGeometries(geometries, false);
  merged.computeVertexNormals();

  const landMaterial = new THREE.MeshLambertMaterial({
    color: 0x6f7b57,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -0.5,
  });

  const landMesh = new THREE.Mesh(merged, landMaterial);
  landMesh.name = 'land';
  globeGroup.add(landMesh);
}

async function loadActivities() {
  const response = await fetch('assets/activities.json');
  if (!response.ok) {
    throw new Error(`Activities request failed with ${response.status}`);
  }

  const payload = await response.json();
  const activities = Array.isArray(payload.activities)
    ? payload.activities
    : [];

  markersGroup.clear();

  const markerGeometry = new THREE.SphereGeometry(0.015, 16, 16);
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd447,
  });
  const target = new THREE.Vector3();

  for (const activity of activities) {
    const { latitude, longitude } = activity;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const position = convertLatLonToXYZ(
      latitude,
      longitude,
      MARKER_RADIUS,
      target
    );

    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(position);
    marker.name = activity.name || 'activity-marker';
    markersGroup.add(marker);
  }
}

function polygonToGeometry(rings) {
  if (!rings || !rings.length) {
    return null;
  }

  const outerRing = sanitizeRing(rings[0]);
  if (outerRing.length < 3) {
    return null;
  }

  const holes = [];
  for (let i = 1; i < rings.length; i += 1) {
    const holeRing = sanitizeRing(rings[i]);
    if (holeRing.length >= 3) {
      holes.push(holeRing);
    }
  }

  const shape = new THREE.Shape();
  outerRing.forEach(([lon, lat], index) => {
    if (index === 0) {
      shape.moveTo(lon, lat);
    } else {
      shape.lineTo(lon, lat);
    }
  });

  holes.forEach((hole) => {
    const path = new THREE.Path();
    hole.forEach(([lon, lat], index) => {
      if (index === 0) {
        path.moveTo(lon, lat);
      } else {
        path.lineTo(lon, lat);
      }
    });
    shape.holes.push(path);
  });

  const geometry = new THREE.ShapeGeometry(shape);
  projectShapeGeometry(geometry);
  return geometry;
}

function sanitizeRing(ring) {
  const cleaned = [];
  for (let i = 0; i < ring.length; i += 1) {
    const [lon, lat] = ring[i];
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    cleaned.push([lon, lat]);
  }

  if (cleaned.length > 1) {
    const [firstLon, firstLat] = cleaned[0];
    const [lastLon, lastLat] = cleaned[cleaned.length - 1];
    if (Math.hypot(firstLon - lastLon, firstLat - lastLat) < 1e-10) {
      cleaned.pop();
    }
  }

  return cleaned;
}

function projectShapeGeometry(geometry) {
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < position.count; i += 1) {
    const lon = position.getX(i);
    const lat = position.getY(i);
    const point = convertLatLonToXYZ(lat, lon, LAND_RADIUS, vertex);
    position.setXYZ(i, point.x, point.y, point.z);
  }

  geometry.deleteAttribute('normal');
  geometry.deleteAttribute('uv');
  geometry.computeVertexNormals();
}

function convertLatLonToXYZ(latDeg, lonDeg, radius, target = new THREE.Vector3()) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);

  const cosLat = Math.cos(lat);
  target.x = radius * cosLat * Math.cos(lon);
  target.y = radius * Math.sin(lat);
  target.z = radius * cosLat * Math.sin(lon);
  return target;
}
