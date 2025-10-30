import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';

const LAND_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson';

const container = document.getElementById('globe-container');
const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 6;
controls.target.set(0, 0, 0);

let isUserInteracting = false;
controls.addEventListener('start', () => (isUserInteracting = true));
controls.addEventListener('end', () => (isUserInteracting = false));

const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(4, 3, 6);
scene.add(directionalLight);

const globeGroup = new THREE.Group();
scene.add(globeGroup);

const OCEAN_RADIUS = 1.5;
const LAND_RADIUS = 1.505;

const oceanGeometry = new THREE.SphereGeometry(OCEAN_RADIUS, 128, 128);
const oceanMaterial = new THREE.MeshLambertMaterial({ color: 0x1f2a38 });
const oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
globeGroup.add(oceanMesh);

defineLandLayer();

async function defineLandLayer() {
  try {
    const response = await fetch(LAND_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch land polygons: ${response.status}`);
    }

    const geojson = await response.json();
    const landMaterial = new THREE.MeshLambertMaterial({
      color: 0x6f7650,
      side: THREE.DoubleSide,
    });

    const landGroup = new THREE.Group();

    for (const feature of geojson.features ?? []) {
      if (!feature || !feature.geometry) continue;
      const { type, coordinates } = feature.geometry;
      if (!coordinates) continue;

      if (type === 'Polygon') {
        const mesh = buildPolygonMesh(coordinates, landMaterial);
        if (mesh) landGroup.add(mesh);
      } else if (type === 'MultiPolygon') {
        for (const polygon of coordinates) {
          const mesh = buildPolygonMesh(polygon, landMaterial);
          if (mesh) landGroup.add(mesh);
        }
      }
    }

    landGroup.name = 'land-masses';
    globeGroup.add(landGroup);
  } catch (error) {
    console.error(error);
  }
}

function buildPolygonMesh(rings, material) {
  if (!Array.isArray(rings) || rings.length === 0) return null;

  const contour = toVector2Ring(rings[0]);
  if (contour.length < 3) return null;

  ensureCounterClockwise(contour);

  const holeRings = [];
  for (let i = 1; i < rings.length; i++) {
    const ring = toVector2Ring(rings[i]);
    if (ring.length < 3) continue;
    ensureClockwise(ring);
    holeRings.push(ring);
  }

  const triangles = THREE.ShapeUtils.triangulateShape(contour, holeRings);
  if (!triangles.length) return null;

  const combinedPoints = contour.concat(...holeRings);
  const positions = [];
  const normals = [];

  for (const tri of triangles) {
    for (const index of tri) {
      const point = combinedPoints[index];
      const vertex = convertLatLonToXYZ(point.y, point.x, LAND_RADIUS);
      positions.push(vertex.x, vertex.y, vertex.z);
      const normal = vertex.clone().normalize();
      normals.push(normal.x, normal.y, normal.z);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.computeBoundingSphere();

  return new THREE.Mesh(geometry, material);
}

function toVector2Ring(rawRing) {
  const points = [];
  for (const coord of rawRing) {
    if (!Array.isArray(coord) || coord.length < 2) continue;
    const lon = normalizeLongitude(coord[0]);
    const lat = THREE.MathUtils.clamp(coord[1], -90, 90);
    const point = new THREE.Vector2(lon, lat);
    if (points.length === 0 || !point.equals(points[points.length - 1])) {
      points.push(point);
    }
  }

  if (points.length > 2 && points[0].equals(points[points.length - 1])) {
    points.pop();
  }

  return points;
}

function ensureCounterClockwise(points) {
  if (ringArea(points) < 0) points.reverse();
}

function ensureClockwise(points) {
  if (ringArea(points) > 0) points.reverse();
}

function ringArea(points) {
  let area = 0;
  for (let i = 0, len = points.length; i < len; i++) {
    const current = points[i];
    const next = points[(i + 1) % len];
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
}

function normalizeLongitude(lon) {
  let normalized = lon;
  while (normalized < -180) normalized += 360;
  while (normalized > 180) normalized -= 360;
  return normalized;
}

function convertLatLonToXYZ(lat, lon, radius) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

function onWindowResize() {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

window.addEventListener('resize', onWindowResize);

function animate() {
  requestAnimationFrame(animate);

  if (!isUserInteracting) {
    globeGroup.rotation.y += 0.0005;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
