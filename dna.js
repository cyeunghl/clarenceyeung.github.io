import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

export function initDNA(container, options = {}) {
  if (!container) throw new Error('A valid container element is required for initDNA');

  const {
    colorA = '#7da7ba',
    colorB = '#9abfc9',
    rungColor = '#c2d8d9',
    backgroundColor = '#f5f2ec',
    particleColor = '#e7e2d6',
    rotationSpeed = 0.004,
    showParticles = true,
  } = options;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(new THREE.Color(backgroundColor), 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(32, container.clientWidth / container.clientHeight, 0.1, 60);
  camera.position.set(0, 0, 14);

  const ambientLight = new THREE.AmbientLight(0xf6f3ec, 0.8);
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
  keyLight.position.set(6, 8, 10);
  const rimLight = new THREE.DirectionalLight(0xd4ecf3, 0.4);
  rimLight.position.set(-4, -6, -8);
  scene.add(ambientLight, keyLight, rimLight);

  const dnaGroup = new THREE.Group();
  scene.add(dnaGroup);

  const helixGroup = new THREE.Group();
  dnaGroup.add(helixGroup);

  const strandRadius = 1.15;
  const strandHeight = 16;
  const turns = 7.5;
  const segments = 260;

  const sphereGeometry = new THREE.SphereGeometry(0.13, 16, 16);
  const strandMaterialA = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorA),
    roughness: 0.35,
    metalness: 0.15,
  });
  const strandMaterialB = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorB),
    roughness: 0.38,
    metalness: 0.1,
  });
  const rungGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
  const rungMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(rungColor),
    roughness: 0.45,
    metalness: 0.05,
  });

  const strandA = new THREE.InstancedMesh(sphereGeometry, strandMaterialA, segments);
  const strandB = new THREE.InstancedMesh(sphereGeometry, strandMaterialB, segments);
  const rungs = new THREE.InstancedMesh(rungGeometry, rungMaterial, segments);

  const dummy = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const midpoint = new THREE.Vector3();

  // Generate helix geometry
  for (let i = 0; i < segments; i++) {
    const progress = i / (segments - 1);
    const angle = progress * Math.PI * 2 * turns;
    const y = progress * strandHeight - strandHeight / 2;

    const xA = Math.cos(angle) * strandRadius;
    const zA = Math.sin(angle) * strandRadius;
    const xB = Math.cos(angle + Math.PI) * strandRadius;
    const zB = Math.sin(angle + Math.PI) * strandRadius;

    dummy.position.set(xA, y, zA);
    dummy.updateMatrix();
    strandA.setMatrixAt(i, dummy.matrix);

    dummy.position.set(xB, y, zB);
    dummy.updateMatrix();
    strandB.setMatrixAt(i, dummy.matrix);

    from.set(xA, y, zA);
    to.set(xB, y, zB);
    midpoint.copy(from).add(to).multiplyScalar(0.5);
    direction.copy(to).sub(from).normalize();

    dummy.position.copy(midpoint);
    dummy.quaternion.setFromUnitVectors(up, direction);
    dummy.scale.set(1, from.distanceTo(to), 1);
    dummy.updateMatrix();
    rungs.setMatrixAt(i, dummy.matrix);
  }

  strandA.instanceMatrix.needsUpdate = true;
  strandB.instanceMatrix.needsUpdate = true;
  rungs.instanceMatrix.needsUpdate = true;

  helixGroup.add(strandA, strandB, rungs);

  // ✅ Compute bounding box and re-center helixGroup at origin
  const box = new THREE.Box3().setFromObject(helixGroup);
  const center = new THREE.Vector3();
  box.getCenter(center);
  helixGroup.position.sub(center);

  // Optional: clone slightly offset for "messier" look
  for (let j = 1; j < 3; j++) {
    const clone = helixGroup.clone(true);
    clone.rotation.y += Math.random() * 0.3;
    clone.rotation.z += (Math.random() - 0.5) * 0.15;
    clone.position.x += (Math.random() - 0.5) * 0.1;
    clone.position.z += (Math.random() - 0.5) * 0.1;
    dnaGroup.add(clone);
  }

  // Background particles
  if (showParticles) {
    const count = 400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 6 + Math.random() * 6;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 14;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(particleColor),
      size: 0.06,
      opacity: 0.35,
      transparent: true,
    });
    const points = new THREE.Points(geo, mat);
    points.renderOrder = -1;
    scene.add(points);
  }

  // ✅ Animate
  let baseRotation = 0;
  let animationFrameId;
  let destroyed = false;

  function render() {
    if (destroyed) return;
    animationFrameId = requestAnimationFrame(render);
    baseRotation += rotationSpeed;
    dnaGroup.rotation.y = baseRotation;
    renderer.render(scene, camera);
  }

  render();

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener('resize', onResize);

  function destroy() {
    destroyed = true;
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    container.removeChild(renderer.domElement);
  }

  return { destroy };
}
