import * as THREE from 'three';
import { TimeOfDay } from './proceduralScene';
import { groundHeightAt } from './worldLogic';
import {
  createInitialWeatherParticles,
  resolveWeatherProfile,
  stepWeatherParticleInPlace,
  WeatherParticleState,
  WeatherPresetId,
  WeatherProfile,
} from './weatherSystem';

export interface ProceduralWeatherRig {
  group: THREE.Group;
  petalMesh: THREE.InstancedMesh;
  moteMesh: THREE.InstancedMesh;
  mistGroup: THREE.Group;
  getCurrentProfile: () => WeatherProfile;
  setTimeOfDay: (mode: TimeOfDay) => void;
  setWeatherPreset: (preset: WeatherPresetId) => void;
  update: (elapsed: number, dt: number, playerX: number, playerZ: number) => void;
  dispose: () => void;
}

// Reusable scratch objects outside the animation loop (Zero GC)
const _dummy = new THREE.Object3D();
const _targetFogColor = new THREE.Color();
const _targetMistColor = new THREE.Color();
const _targetPetalColor = new THREE.Color();
const _targetMoteColor = new THREE.Color();

/**
 * Builds a curved 3D lotus/blossom petal BufferGeometry with subtle cup curvature.
 */
function createCurvedPetalGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.14);
  shape.bezierCurveTo(0.11, -0.08, 0.13, 0.07, 0.04, 0.15);
  shape.lineTo(0, 0.12);
  shape.lineTo(-0.04, 0.15);
  shape.bezierCurveTo(-0.13, 0.07, -0.11, -0.08, 0, -0.14);

  const geo = new THREE.ShapeGeometry(shape, 5);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    // Gentle concave cup & tip curl along Z
    const pz = (px * px * 2.4 + Math.max(0, py) * 0.18) * 0.45;
    pos.setZ(i, pz);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a soft procedural wisp texture for low-lying ground mist ribbons.
 */
function createMistCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 128);

  // Soft multi-lobe cloud wisp
  const lobes = [
    { cx: 128, cy: 68, rx: 108, ry: 48, alpha: 0.55 },
    { cx: 78, cy: 64, rx: 64, ry: 38, alpha: 0.42 },
    { cx: 178, cy: 66, rx: 68, ry: 40, alpha: 0.42 },
  ];

  for (const lobe of lobes) {
    ctx.save();
    ctx.translate(lobe.cx, lobe.cy);
    ctx.scale(lobe.rx, lobe.ry);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    grad.addColorStop(0, `rgba(255, 255, 255, ${lobe.alpha})`);
    grad.addColorStop(0.55, `rgba(245, 248, 255, ${lobe.alpha * 0.48})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralWeatherRig(
  scene: THREE.Scene,
  initialTimeOfDay: TimeOfDay = 'dawn'
): ProceduralWeatherRig {
  const group = new THREE.Group();
  group.name = 'ProceduralWeatherSystemGroup';

  let currentTimeOfDay: TimeOfDay = initialTimeOfDay;
  let currentPreset: WeatherPresetId = 'auto';
  let activeProfile: WeatherProfile = resolveWeatherProfile(currentTimeOfDay, currentPreset);

  const petalCount = 180;
  const moteCount = 180;
  const particles: WeatherParticleState[] = createInitialWeatherParticles(petalCount, moteCount);

  // 1. Falling Lotus & Blossom Petals (InstancedMesh)
  const petalGeo = createCurvedPetalGeometry();
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(activeProfile.primaryParticleHex),
    emissiveIntensity: 0.65,
    roughness: 0.42,
    metalness: 0.08,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });

  const petalMesh = new THREE.InstancedMesh(petalGeo, petalMat, petalCount);
  petalMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  petalMesh.frustumCulled = false;

  const petalPalette = [
    new THREE.Color('#f472b6'), // Sacred lotus pink
    new THREE.Color('#fda4af'), // Blossom rose
    new THREE.Color('#fef08a'), // Marigold gold
    new THREE.Color('#fbbf24'), // Saffron amber
  ];
  for (let i = 0; i < petalCount; i++) {
    petalMesh.setColorAt(i, petalPalette[i % petalPalette.length]);
  }
  if (petalMesh.instanceColor) petalMesh.instanceColor.needsUpdate = true;
  group.add(petalMesh);

  // 2. Suspended Solar Dust Motes & Prana Spores (InstancedMesh)
  const moteGeo = new THREE.OctahedronGeometry(0.036, 0);
  const moteMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const moteMesh = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
  moteMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  moteMesh.frustumCulled = false;

  const motePalette = [
    new THREE.Color('#fef08a'), // Solar gold
    new THREE.Color('#2dd4bf'), // Prana turquoise
    new THREE.Color('#c084fc'), // Astral violet
    new THREE.Color('#bae6fd'), // Sky crystal
  ];
  for (let i = 0; i < moteCount; i++) {
    moteMesh.setColorAt(i, motePalette[i % motePalette.length]);
  }
  if (moteMesh.instanceColor) moteMesh.instanceColor.needsUpdate = true;
  group.add(moteMesh);

  // 3. Low-Lying Horizontal Ground Mist Carpets across Saraswati River & Valley Terraces
  const mistTex = createMistCloudTexture();
  const mistMat = new THREE.MeshBasicMaterial({
    map: mistTex,
    color: new THREE.Color(activeProfile.mistColorHex),
    transparent: true,
    opacity: activeProfile.mistOpacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mistGroup = new THREE.Group();
  const mistPlanes: {
    mesh: THREE.Mesh;
    baseX: number;
    baseZ: number;
    baseY: number;
    driftSpeed: number;
    phase: number;
    baseScaleX: number;
    baseScaleY: number;
  }[] = [];

  const mistGeo = new THREE.PlaneGeometry(16, 8.5);
  const mistAnchors = [
    { x: -14, z: -2.5, scale: 1.25 },
    { x: 14, z: -4.2, scale: 1.25 },
    { x: -28, z: -1.5, scale: 1.35 },
    { x: 28, z: -5.0, scale: 1.35 },
    { x: -18, z: -18, scale: 1.15 },
    { x: 18, z: -18, scale: 1.15 },
    { x: -16, z: 12, scale: 1.1 },
    { x: 16, z: 12, scale: 1.1 },
    { x: -26, z: 22, scale: 1.2 },
    { x: 26, z: 22, scale: 1.2 },
    { x: -22, z: -34, scale: 1.3 },
    { x: 22, z: -34, scale: 1.3 },
  ];

  mistAnchors.forEach((anchor, idx) => {
    const mesh = new THREE.Mesh(mistGeo, mistMat);
    const by = groundHeightAt(anchor.x, anchor.z) + 0.32 + (idx % 3) * 0.16;
    mesh.position.set(anchor.x, by, anchor.z);
    // Horizontal ground-hugging mist layer with subtle tilt
    mesh.rotation.set(-Math.PI / 2 + 0.08, 0, ((idx * 0.65) % 1.2) - 0.6);
    mesh.renderOrder = 2;
    mistGroup.add(mesh);
    mistPlanes.push({
      mesh,
      baseX: anchor.x,
      baseZ: anchor.z,
      baseY: by,
      driftSpeed: 0.45 + (idx % 5) * 0.14,
      phase: idx * 1.1,
      baseScaleX: anchor.scale,
      baseScaleY: 0.85 + (idx % 3) * 0.15,
    });
  });

  group.add(mistGroup);
  scene.add(group);

  // Smoothed transition state
  let currentPetalVis = activeProfile.petalVisibility;
  let currentMoteVis = activeProfile.moteVisibility;
  let currentMistOpacity = activeProfile.mistOpacity;

  function refreshProfile() {
    activeProfile = resolveWeatherProfile(currentTimeOfDay, currentPreset);
  }

  function setTimeOfDay(mode: TimeOfDay) {
    currentTimeOfDay = mode;
    refreshProfile();
  }

  function setWeatherPreset(preset: WeatherPresetId) {
    currentPreset = preset;
    refreshProfile();
  }

  function update(elapsed: number, dt: number, playerX: number, playerZ: number) {
    const safeDt = Math.min(Math.max(dt, 0.001), 0.08);
    const dampFactor = 1 - Math.exp(-3.5 * safeDt);

    // 1. Smoothly damp scene fog density & color to match active weather profile
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = THREE.MathUtils.lerp(
        scene.fog.density,
        activeProfile.fogDensity,
        dampFactor
      );
      _targetFogColor.setHex(activeProfile.fogColorHex);
      scene.fog.color.lerp(_targetFogColor, dampFactor);
    }

    // 2. Smoothly damp petal, dust mote, and mist visibilities
    currentPetalVis = THREE.MathUtils.lerp(
      currentPetalVis,
      activeProfile.petalVisibility,
      dampFactor
    );
    currentMoteVis = THREE.MathUtils.lerp(
      currentMoteVis,
      activeProfile.moteVisibility,
      dampFactor
    );
    currentMistOpacity = THREE.MathUtils.lerp(
      currentMistOpacity,
      activeProfile.mistOpacity,
      dampFactor
    );

    _targetPetalColor.set(activeProfile.primaryParticleHex);
    petalMat.emissive.lerp(_targetPetalColor, dampFactor);
    petalMat.opacity = Math.max(0.05, currentPetalVis * 0.92);

    _targetMoteColor.set(activeProfile.secondaryParticleHex);
    moteMat.color.lerp(_targetMoteColor, dampFactor);
    moteMat.opacity = Math.max(0.05, currentMoteVis * 0.9);

    _targetMistColor.setHex(activeProfile.mistColorHex);
    mistMat.color.lerp(_targetMistColor, dampFactor);
    mistMat.opacity = currentMistOpacity;

    // 3. Step Falling Petals & Dust Motes in place around player (playerX, playerZ)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      stepWeatherParticleInPlace(p, activeProfile, playerX, playerZ, elapsed, safeDt);

      // Attenuate scale when very close to the player/camera centerline so no particle blocks the camera lens
      const distToPlayerXZ = Math.hypot(p.x - playerX, p.z - (playerZ + 2.8));
      const nearCamFade = THREE.MathUtils.smoothstep(distToPlayerXZ, 1.4, 3.6);

      _dummy.position.set(p.x, p.y, p.z);
      _dummy.rotation.set(p.rx, p.ry, p.rz);

      if (p.isPetal) {
        const s = p.baseScale * nearCamFade * (0.22 + currentPetalVis * 0.95);
        _dummy.scale.set(s, s, s);
        _dummy.updateMatrix();
        petalMesh.setMatrixAt(i, _dummy.matrix);
      } else {
        const moteIdx = i - petalCount;
        const pulse = 0.65 + 0.35 * Math.sin(elapsed * 3.4 + p.phase);
        const s = p.baseScale * pulse * nearCamFade * (0.22 + currentMoteVis * 1.0);
        _dummy.scale.set(s, s, s);
        _dummy.updateMatrix();
        moteMesh.setMatrixAt(moteIdx, _dummy.matrix);
      }
    }

    petalMesh.instanceMatrix.needsUpdate = true;
    moteMesh.instanceMatrix.needsUpdate = true;

    // 4. Gently drift low-lying valley mist ribbons along the wind vector
    for (let m = 0; m < mistPlanes.length; m++) {
      const mp = mistPlanes[m];
      const wave = elapsed * mp.driftSpeed + mp.phase;
      mp.mesh.position.x = mp.baseX + Math.sin(wave) * 3.2;
      mp.mesh.position.z = mp.baseZ + Math.cos(wave * 0.7) * 1.4;
      mp.mesh.position.y = mp.baseY + Math.sin(wave * 1.3) * 0.18;
      const breath = 1 + Math.sin(wave * 0.9) * 0.08;
      mp.mesh.scale.set(mp.baseScaleX * breath, mp.baseScaleY, 1);
    }
  }

  function dispose() {
    petalGeo.dispose();
    petalMat.dispose();
    moteGeo.dispose();
    moteMat.dispose();
    mistGeo.dispose();
    mistMat.dispose();
    mistTex.dispose();
  }

  return {
    group,
    petalMesh,
    moteMesh,
    mistGroup,
    getCurrentProfile: () => activeProfile,
    setTimeOfDay,
    setWeatherPreset,
    update,
    dispose,
  };
}
