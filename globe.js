import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';

const EARTH_RADIUS = 1;
const CLUSTER_DISTANCE_KM = 0.5;

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const R = 6371; // km
  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(lat1)) *
      Math.cos(degToRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function clusterActivities(activities) {
  const clusters = [];

  for (const activity of activities) {
    let foundCluster = null;
    for (const cluster of clusters) {
      const distance = haversineDistance(cluster.coordinates, activity.coordinates);
      if (distance <= CLUSTER_DISTANCE_KM) {
        foundCluster = cluster;
        break;
      }
    }

    if (foundCluster) {
      foundCluster.activities.push(activity);
      foundCluster.activities.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
      foundCluster.representative = foundCluster.activities[0];
    } else {
      clusters.push({
        coordinates: activity.coordinates,
        activities: [activity],
        representative: activity,
      });
    }
  }

  return clusters;
}

async function fetchActivities({ mockDataUrl, refreshIntervalDays }) {
  const storageKey = 'clarence-strava-cache';
  const cacheRaw = localStorage.getItem(storageKey);
  const now = Date.now();
  const refreshIntervalMs = refreshIntervalDays * 24 * 60 * 60 * 1000;

  if (cacheRaw) {
    try {
      const parsed = JSON.parse(cacheRaw);
      if (parsed.timestamp && now - parsed.timestamp < refreshIntervalMs) {
        return parsed.payload;
      }
    } catch (error) {
      console.warn('Failed to parse Strava cache', error);
    }
  }

  const headers = new Headers();
  const token =
    (typeof window !== 'undefined' && window.STRAVA_ACCESS_TOKEN) ||
    import.meta.env?.VITE_STRAVA_TOKEN ||
    '';
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  const request = mockDataUrl
    ? fetch(mockDataUrl, { headers })
    : Promise.resolve({ json: async () => ({ activities: [] }) });

  const response = await request;
  const payload = await response.json();

  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ timestamp: now, payload })
    );
  } catch (error) {
    console.warn('Unable to persist Strava cache', error);
  }

  return payload;
}

function createAtmosphere() {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.02, 64, 64);
  const material = new THREE.MeshBasicMaterial({
    color: 0x335577,
    transparent: true,
    opacity: 0.25,
    side: THREE.BackSide,
  });
  return new THREE.Mesh(geometry, material);
}

function createEarthMaterial() {
  const uniforms = {
    colorA: { value: new THREE.Color('#1a2a3d') },
    colorB: { value: new THREE.Color('#0c1624') },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 colorA;
      uniform vec3 colorB;
      void main() {
        float intensity = smoothstep(0.0, 1.0, vUv.y);
        vec3 color = mix(colorB, colorA, intensity);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

  return material;
}

function createGlobePoints(clusters) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const sizes = [];
  const colors = [];
  const data = [];

  for (const cluster of clusters) {
    const [lat, lon] = cluster.representative.coordinates;
    const phi = degToRad(90 - lat);
    const theta = degToRad(lon + 180);

    const x = -EARTH_RADIUS * Math.sin(phi) * Math.cos(theta);
    const z = EARTH_RADIUS * Math.sin(phi) * Math.sin(theta);
    const y = EARTH_RADIUS * Math.cos(phi);

    positions.push(x, y, z);
    sizes.push(12 + Math.random() * 6);
    const color = new THREE.Color('#6f9ccf');
    colors.push(color.r, color.g, color.b);

    data.push({
      cluster,
      position: new THREE.Vector3(x, y, z),
    });
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    uniforms: {
      sizeMultiplier: { value: 1.0 },
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float sizeMultiplier;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * sizeMultiplier * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        float alpha = smoothstep(0.6, 0.0, d);
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  points.userData = { clusters: data };
  return points;
}

export async function initGlobe(container, options = {}) {
  const { mockDataUrl, refreshIntervalDays = 10 } = options;
  const refreshIntervalMs = refreshIntervalDays * 24 * 60 * 60 * 1000;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    20
  );
  camera.position.set(0, 0, 3);

  const ambientLight = new THREE.AmbientLight(0x335577, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0x99bbff, 1.2);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 96, 96);
  const earthMaterial = createEarthMaterial();
  const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earthMesh);

  const atmosphere = createAtmosphere();
  scene.add(atmosphere);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 1.6;
  controls.maxDistance = 6;
  controls.enablePan = false;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const tooltip = document.createElement('div');
  tooltip.className = 'globe-tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.padding = '0.75rem 1rem';
  tooltip.style.background = 'rgba(15, 23, 42, 0.85)';
  tooltip.style.borderRadius = '12px';
  tooltip.style.color = '#f2f0e9';
  tooltip.style.fontSize = '0.85rem';
  tooltip.style.lineHeight = '1.4';
  tooltip.style.backdropFilter = 'blur(6px)';
  tooltip.style.opacity = '0';
  tooltip.style.transition = 'opacity 0.2s ease';
  tooltip.style.transform = 'translate(-50%, -120%)';
  tooltip.style.maxWidth = '220px';
  tooltip.style.whiteSpace = 'normal';
  container.style.position = 'relative';
  container.appendChild(tooltip);

  let animationFrameId;
  let points;
  let running = true;
  let refreshTimer;

  async function hydratePoints() {
    try {
      const payload = await fetchActivities({ mockDataUrl, refreshIntervalDays });
      const clusters = clusterActivities(payload.activities || []);
      if (points) {
        scene.remove(points);
        points.geometry.dispose();
        points.material.dispose();
      }
      points = createGlobePoints(clusters);
      scene.add(points);
    } catch (error) {
      console.error('Failed to load Strava data', error);
    }
  }

  await hydratePoints();

  if (refreshIntervalDays > 0) {
    refreshTimer = setInterval(() => {
      hydratePoints();
    }, refreshIntervalMs);
  }

  function render() {
    if (!running) return;
    animationFrameId = requestAnimationFrame(render);
    earthMesh.rotation.y += 0.0009;
    if (points) {
      points.rotation.y += 0.0012;
    }
    controls.update();
    renderer.render(scene, camera);
  }

  render();

  function onPointerMove(event) {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    if (!points) return;
    const intersects = raycaster.intersectObject(points);

    if (intersects.length > 0) {
      const index = intersects[0].index;
      const clusterData = points.userData.clusters[index];
      if (clusterData) {
        const { representative } = clusterData.cluster;
        const date = new Date(representative.start_date);
        tooltip.innerHTML = `
          <strong>${representative.name}</strong><br />
          ${representative.city || ''} ${representative.country || ''}<br />
          ${representative.type} • ${(representative.distance / 1000).toFixed(1)} km<br />
          ${date.toLocaleDateString()}
        `;
        tooltip.style.left = `${event.clientX - bounds.left}px`;
        tooltip.style.top = `${event.clientY - bounds.top}px`;
        tooltip.style.opacity = '1';
      }
    } else {
      tooltip.style.opacity = '0';
    }
  }

  function onPointerLeave() {
    tooltip.style.opacity = '0';
  }

  function onResize() {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  }

  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('resize', onResize);

  return {
    pause() {
      running = false;
      cancelAnimationFrame(animationFrameId);
    },
    play() {
      if (running) return;
      running = true;
      render();
    },
    destroy() {
      running = false;
      cancelAnimationFrame(animationFrameId);
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
      renderer.dispose();
      controls.dispose();
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      if (points) {
        points.geometry.dispose();
        points.material.dispose();
      }
      earthGeometry.dispose();
      earthMaterial.dispose();
      atmosphere.geometry.dispose();
      atmosphere.material.dispose();
      container.removeChild(renderer.domElement);
      tooltip.remove();
    },
  };
}
