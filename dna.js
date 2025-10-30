import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

export function initDNA(container, options = {}) {
  const { reducedMotion = false } = options;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    50
  );
  camera.position.set(0, 0, 12);

  const ambient = new THREE.AmbientLight(0xf2f0e9, 0.6);
  const directional = new THREE.DirectionalLight(0xd6ffe0, 0.8);
  directional.position.set(5, 6, 8);
  scene.add(ambient, directional);

  const dnaGroup = new THREE.Group();
  scene.add(dnaGroup);

  const helixGroup = new THREE.Group();

  const helixMaterialA = new THREE.MeshStandardMaterial({
    color: 0xb7f0d0,
    emissive: 0x183220,
    emissiveIntensity: 0.3,
    roughness: 0.3,
    metalness: 0.1,
  });

  const helixMaterialB = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x1b2a1c,
    emissiveIntensity: 0.25,
    roughness: 0.25,
    metalness: 0.2,
  });

  const rungMaterial = new THREE.MeshStandardMaterial({
    color: 0x5f7261,
    emissive: 0x101812,
    emissiveIntensity: 0.2,
    roughness: 0.4,
  });

  const strandRadius = 0.18;
  const totalHeight = 8;
  const turns = 6;
  const segments = 260;

  const sphereGeometry = new THREE.SphereGeometry(strandRadius, 16, 16);
  const rungGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 12);

  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    const angle = progress * Math.PI * 2 * turns;
    const y = progress * totalHeight - totalHeight / 2;
    const radius = 1.4;

    const xA = Math.cos(angle) * radius;
    const zA = Math.sin(angle) * radius;

    const xB = Math.cos(angle + Math.PI) * radius;
    const zB = Math.sin(angle + Math.PI) * radius;

    const sphereA = new THREE.Mesh(sphereGeometry, helixMaterialA);
    sphereA.position.set(xA, y, zA);
    helixGroup.add(sphereA);

    const sphereB = new THREE.Mesh(sphereGeometry, helixMaterialB);
    sphereB.position.set(xB, y, zB);
    helixGroup.add(sphereB);

    if (i % 6 === 0) {
      const from = new THREE.Vector3(xA, y, zA);
      const to = new THREE.Vector3(xB, y, zB);
      const direction = new THREE.Vector3().subVectors(to, from);
      const length = direction.length();
      const rung = new THREE.Mesh(rungGeometry, rungMaterial);
      rung.position.copy(new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5));
      rung.scale.set(1, length / 0.9, 1);
      rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      helixGroup.add(rung);
    }
  }

  dnaGroup.add(helixGroup);

  const extraHelixCount = 2;
  for (let i = 0; i < extraHelixCount; i++) {
    const clone = helixGroup.clone(true);
    clone.rotation.y += (Math.random() - 0.5) * 0.6;
    clone.rotation.x += (Math.random() - 0.5) * 0.15;
    clone.position.y += (Math.random() - 0.5) * 0.6;
    dnaGroup.add(clone);
  }

  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 500;
  const positions = new Float32Array(particleCount * 3);
  const scales = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    scales[i] = Math.random() * 0.6 + 0.2;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

  const particleMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      color: { value: new THREE.Color('#f2f0e9') },
      opacity: { value: 0.35 },
    },
    vertexShader: `
      attribute float scale;
      varying float vScale;
      void main() {
        vScale = scale;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = scale * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      varying float vScale;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        float alpha = smoothstep(0.6, 0.0, d) * opacity;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  dnaGroup.add(particles);

  let animationFrameId;
  let isRunning = true;
  let reduced = reducedMotion;
  let scrollTilt = 0;
  let baseRotation = 0;

  function updateScrollTilt() {
    const rect = container.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const scrollProgress = THREE.MathUtils.clamp(1 - rect.top / viewportHeight, 0, 1);
    scrollTilt = (scrollProgress - 0.5) * 0.4;
  }

  updateScrollTilt();

  function render() {
    if (!isRunning) return;
    animationFrameId = requestAnimationFrame(render);
    if (!reduced) {
      baseRotation += 0.004;
    }
    dnaGroup.rotation.set(scrollTilt, baseRotation, 0);
    renderer.render(scene, camera);
  }

  render();

  function onResize() {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  }

  function onScroll() {
    updateScrollTilt();
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', onScroll, { passive: true });

  return {
    pause() {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    },
    play() {
      if (isRunning) return;
      isRunning = true;
      render();
    },
    setReducedMotion(value) {
      reduced = value;
    },
    destroy() {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      renderer.dispose();
      container.removeChild(renderer.domElement);
      helixMaterialA.dispose();
      helixMaterialB.dispose();
      rungMaterial.dispose();
      sphereGeometry.dispose();
      rungGeometry.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    },
  };
}
