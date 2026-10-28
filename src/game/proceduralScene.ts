import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {
  PORTFOLIO_STOPS,
  LOTUS_RELICS,
  FORGE_WEAPONS,
  INITIAL_DEMON_SPAWNS,
  LAYOFF_BOSS_CONFIG,
  MonumentType,
  WeaponId,
  DemonArchetype,
} from '../data/portfolioStops';
import { groundHeightAt, DemonCombatState } from './worldLogic';
import { createProceduralWeatherRig, ProceduralWeatherRig } from './weatherRig';
import { WeatherPresetId } from './weatherSystem';

export type TimeOfDay = 'dawn' | 'noon' | 'twilight';

export interface PlayerRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  weaponArmPivot: THREE.Group;
  elbowJoint: THREE.Group;
  wristGrip: THREE.Group;
  offhandArmPivot: THREE.Group;
  cloakMesh: THREE.Mesh;
  chakraHaloGroup: THREE.Group;
  dashRingMesh: THREE.Mesh;
  swordGroup: THREE.Group;
  swordBlade: THREE.Mesh;
  weaponMeshes: Record<WeaponId, THREE.Group>;
  equippedWeaponId: WeaponId;
  slashArcMesh: THREE.Mesh;
  comboSlashRing: THREE.Mesh;
  parryShieldMesh: THREE.Mesh;
  paragliderGroup: THREE.Group;
  powerOrbitals: THREE.Mesh[];
  shadowDisc: THREE.Mesh;
  glbRoot: THREE.Object3D | null;
  rightHandBone: THREE.Object3D | null;
  leftHandBone: THREE.Object3D | null;
  rightArmBone: THREE.Object3D | null;
  rightForeArmBone: THREE.Object3D | null;
  leftArmBone: THREE.Object3D | null;
  leftForeArmBone: THREE.Object3D | null;
  mixer: THREE.AnimationMixer | null;
  actions: {
    idle?: THREE.AnimationAction;
    walk?: THREE.AnimationAction;
    run?: THREE.AnimationAction;
  };
  activeActionName: 'idle' | 'walk' | 'run';
  setAnimationState: (state: 'idle' | 'walk' | 'run', speedMultiplier?: number) => void;
  setEquippedWeapon: (weaponId: WeaponId) => void;
}

export interface DemonEntity {
  id: string;
  name: string;
  title: string;
  archetype: DemonArchetype;
  attackDamage: number;
  moveSpeed: number;
  state: DemonCombatState;
  stateTimer: number;
  group: THREE.Group;
  bodyGroup: THREE.Group;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  rightHandBone: THREE.Object3D | null;
  weaponGroup: THREE.Group;
  slashArcMesh: THREE.Mesh;
  telegraphRingMesh: THREE.Mesh;
  hpBarGroup: THREE.Group;
  hpBarFill: THREE.Mesh;
  postureBarFill: THREE.Mesh;
  kanjiSprite: THREE.Sprite;
  homeX: number;
  homeZ: number;
  x: number;
  z: number;
  y: number;
  yaw: number;
  hp: number;
  maxHp: number;
  posture: number;
  maxPosture: number;
  scale: number;
  alive: boolean;
  hitFlashTimer: number;
  attackCooldown: number;
  perilousTimer: number;
  aggroRange: number;
  mixer: THREE.AnimationMixer | null;
  actions: {
    idle?: THREE.AnimationAction;
    walk?: THREE.AnimationAction;
    run?: THREE.AnimationAction;
  };
  activeClip: 'idle' | 'walk' | 'run';
  setClip: (clip: 'idle' | 'walk' | 'run', speed?: number) => void;
}

export interface LayoffBossEntity {
  id: string;
  name: string;
  subtitle: string;
  group: THREE.Group;
  bodyGroup: THREE.Group;
  arms: THREE.Object3D[];
  rightHandBone: THREE.Object3D | null;
  leftHandBone: THREE.Object3D | null;
  rightWeaponGroup: THREE.Group;
  leftWeaponGroup: THREE.Group;
  crownRing: THREE.Mesh;
  shockwaveRing: THREE.Mesh;
  kanjiSprite: THREE.Sprite;
  x: number;
  z: number;
  y: number;
  yaw: number;
  hp: number;
  maxHp: number;
  posture: number;
  maxPosture: number;
  awakened: boolean;
  defeated: boolean;
  hitFlashTimer: number;
  attackTimer: number;
  perilousTimer: number;
  mixer: THREE.AnimationMixer | null;
}

export interface MonumentRig {
  id: string;
  group: THREE.Group;
  haloRing: THREE.Mesh;
  artifactMesh: THREE.Object3D;
  scrollPedestalMesh: THREE.Object3D;
  skyBeamMesh: THREE.Mesh;
  grappleAnchorPos: THREE.Vector3;
  pointLight: THREE.PointLight | null;
  baseY: number;
}

export interface RelicRig {
  id: string;
  group: THREE.Group;
  mesh: THREE.Object3D;
  baseY: number;
}

export interface WeaponForgeRig {
  id: WeaponId;
  group: THREE.Group;
  weaponMesh: THREE.Group;
  haloRing: THREE.Mesh;
  baseY: number;
}

export interface ParticleBurstPool {
  mesh: THREE.InstancedMesh;
  spawnBurst: (x: number, y: number, z: number, count?: number, isGold?: boolean) => void;
  update: (dt: number) => void;
}

export interface AncientWorldScene {
  scene: THREE.Scene;
  playerRig: PlayerRig;
  monumentRigs: Map<string, MonumentRig>;
  relicRigs: Map<string, RelicRig>;
  weaponForgeRigs: Map<WeaponId, WeaponForgeRig>;
  demons: DemonEntity[];
  layoffBoss: LayoffBossEntity;
  cameraBlockers: THREE.Object3D[];
  particlePool: ParticleBurstPool;
  grappleLine: THREE.Line;
  triggerLightningBoltVisual: (targetX: number, targetY: number, targetZ: number) => void;
  updateGrappleLine: (
    active: boolean,
    startX?: number,
    startY?: number,
    startZ?: number,
    endX?: number,
    endY?: number,
    endZ?: number
  ) => void;
  updateGuidanceTrail: (
    active: boolean,
    playerX?: number,
    playerZ?: number,
    targetX?: number,
    targetZ?: number,
    colorHex?: string,
    elapsed?: number
  ) => void;
  updateShadowCamera: (playerX: number, playerZ: number) => void;
  updatePlayerPowerVisuals: (unlockedCount: number, colorHex: string, equippedWeaponId?: WeaponId) => void;
  updateBossLockHologram: (
    visitedCount: number,
    bossAwakened: boolean,
    bossDefeated: boolean,
    elapsed: number
  ) => void;
  applyTimeOfDay: (mode: TimeOfDay) => void;
  setWeatherPreset: (preset: WeatherPresetId) => void;
  weatherRig: ProceduralWeatherRig;
  updateWorldAnimations: (
    elapsed: number,
    dt: number,
    activeStopId: string | null,
    nearStopId: string | null,
    attackProgress?: number,
    playerMoveSpeed?: number,
    isGliding?: boolean,
    isParrying?: boolean,
    comboStage?: 1 | 2 | 3,
    isDashing?: boolean
  ) => void;
  dispose: () => void;
}

function createSandstoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#8c583a');
  grad.addColorStop(0.5, '#734429');
  grad.addColorStop(1, '#59321d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Fine mineral grain & weathering speckles
  for (let i = 0; i < 1800; i++) {
    const gx = (i * 73) % 512;
    const gy = (i * 139) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 224, 178, 0.07)' : 'rgba(20, 10, 5, 0.14)';
    ctx.fillRect(gx, gy, 3, 2);
  }

  for (let y = 0; y < 512; y += 64) {
    ctx.fillStyle = y % 128 === 0 ? 'rgba(38, 19, 10, 0.36)' : 'rgba(235, 190, 130, 0.12)';
    ctx.fillRect(0, y, 512, 24);
    ctx.fillStyle = 'rgba(22, 11, 6, 0.65)';
    ctx.fillRect(0, y, 512, 3);

    const offset = (y / 64) % 2 === 0 ? 0 : 64;
    for (let x = offset; x < 512; x += 128) {
      ctx.fillRect(x, y, 3, 64);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 12, y + 10, 102, 44);
      // Carved lotus diamond motif
      ctx.beginPath();
      ctx.moveTo(x + 63, y + 16);
      ctx.lineTo(x + 82, y + 32);
      ctx.lineTo(x + 63, y + 48);
      ctx.lineTo(x + 44, y + 32);
      ctx.closePath();
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createFlagstoneRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep mossy temple mortar base
  ctx.fillStyle = '#141c18';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 8;
  const cols = 4;
  const cellH = 512 / rows;
  const cellW = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const shift = r % 2 === 0 ? 0 : cellW * 0.5;
    for (let c = -1; c <= cols; c++) {
      const x = c * cellW + shift;
      const y = r * cellH;
      const tone = ((r * 7 + c * 13) % 4) * 6;
      // Weathered dark basalt & slate temple slabs
      ctx.fillStyle = `rgb(${38 + tone}, ${42 + tone}, ${52 + tone})`;
      ctx.fillRect(x + 4, y + 4, cellW - 8, cellH - 8);

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 8, y + 8, cellW - 16, cellH - 16);
    }
  }

  // Central Sacred Gold Yantra Filigree Runner & Double Gold Curb Trim
  ctx.fillStyle = 'rgba(212, 175, 55, 0.72)';
  ctx.fillRect(10, 0, 8, 512);
  ctx.fillRect(494, 0, 8, 512);
  ctx.fillStyle = 'rgba(212, 175, 55, 0.25)';
  ctx.fillRect(24, 0, 2, 512);
  ctx.fillRect(486, 0, 2, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 20);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTerrainMosaicTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Rich forest emerald & dark highland moss base (high contrast against sunlit grass tips)
  ctx.fillStyle = '#1b311d';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 960; i++) {
    const x = (i * 97) % 512;
    const y = (i * 151) % 512;
    const r = 8 + (i % 24);
    ctx.fillStyle =
      i % 6 === 0
        ? 'rgba(120, 92, 48, 0.16)'
        : i % 4 === 0
        ? 'rgba(42, 82, 44, 0.28)'
        : i % 3 === 0
        ? 'rgba(68, 108, 48, 0.22)'
        : 'rgba(18, 38, 22, 0.34)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(26, 26);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates a crisp Sekiro "危" (Perilous / Deathblow) Kanji Sprite for enemies and Boss
 */
function createKanjiWarningSprite(kanji = '危'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 58);
  grad.addColorStop(0, 'rgba(220, 38, 38, 0.95)');
  grad.addColorStop(0.55, 'rgba(153, 27, 27, 0.65)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '900 74px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 4;
  ctx.strokeText(kanji, 64, 66);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(kanji, 64, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.5, 1.5, 1);
  sprite.visible = false;
  return sprite;
}

/**
 * Builds a high-poly bevel-extruded curved blade geometry (Katana, Odachi, Scimitar, or Halberd)
 * with smooth vertex normals and chamfered edges that catch specular highlights.
 */
function createForgedBladeGeometry(
  length = 1.65,
  baseWidth = 0.085,
  curveBack = 0.065,
  depth = 0.014
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-baseWidth * 0.5, 0);
  // Spine (Mune) curves gently backward toward the kissaki tip
  shape.quadraticCurveTo(
    -baseWidth * 0.42 - curveBack,
    length * 0.55,
    -curveBack * 1.15,
    length
  );
  // Sculpted Kissaki (Tip) and cutting edge (Ha)
  shape.quadraticCurveTo(
    baseWidth * 0.58 - curveBack * 0.45,
    length * 0.52,
    baseWidth * 0.5,
    0
  );
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    steps: 18,
    depth,
    bevelEnabled: true,
    bevelThickness: 0.009,
    bevelSize: 0.012,
    bevelSegments: 5,
    curveSegments: 32,
  });
  geo.translate(0, 0, -depth * 0.5);
  geo.rotateY(Math.PI * 0.5);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a silky-smooth Lathe-sculpted teardrop Agni flame geometry (replaces flat Octahedron flames)
 */
function createSculptedFlameGeometry(radius = 0.16, height = 0.42): THREE.LatheGeometry {
  const curve = new THREE.SplineCurve([
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(radius * 0.85, height * 0.22),
    new THREE.Vector2(radius, height * 0.42),
    new THREE.Vector2(radius * 0.62, height * 0.72),
    new THREE.Vector2(radius * 0.22, height * 0.92),
    new THREE.Vector2(0.001, height),
  ]);
  const geo = new THREE.LatheGeometry(curve.getPoints(28), 32);
  geo.translate(0, -height * 0.35, 0);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a smooth bevel-extruded 3D Padma Lotus Petal for Sacred Relics, Shrines & Water Lilies
 */
function createSculptedLotusPetalGeometry(length = 0.38, width = 0.16): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width * 0.85, length * 0.25, width * 0.95, length * 0.72, 0, length);
  shape.bezierCurveTo(-width * 0.95, length * 0.72, -width * 0.85, length * 0.25, 0, 0);

  const geo = new THREE.ExtrudeGeometry(shape, {
    steps: 8,
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 4,
    curveSegments: 24,
  });
  geo.rotateX(Math.PI * 0.36);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Shared high-poly multi-whorl 3D Sculpted Lotus Blossom builder
 */
function createSculptedLotusBlossom(
  petalMat: THREE.Material,
  coreMat: THREE.Material,
  scale = 1.0
): THREE.Group {
  const blossom = new THREE.Group();
  blossom.scale.setScalar(scale);

  const innerPetalGeo = createSculptedLotusPetalGeometry(0.34, 0.14);
  const outerPetalGeo = createSculptedLotusPetalGeometry(0.42, 0.17);

  // Inner whorl of 8 cupped petals
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const pPivot = new THREE.Group();
    pPivot.rotation.y = a;
    const petal = new THREE.Mesh(innerPetalGeo, petalMat);
    petal.position.set(0, 0.02, 0.06);
    petal.rotation.x = -0.35;
    pPivot.add(petal);
    blossom.add(pPivot);
  }

  // Outer whorl of 8 open petals
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    const pPivot = new THREE.Group();
    pPivot.rotation.y = a;
    const petal = new THREE.Mesh(outerPetalGeo, petalMat);
    petal.position.set(0, -0.02, 0.1);
    petal.rotation.x = -0.72;
    pPivot.add(petal);
    blossom.add(pPivot);
  }

  // Smooth high-poly radiant jewel core
  const coreOrb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 24), coreMat);
  coreOrb.position.y = 0.12;
  blossom.add(coreOrb);

  return blossom;
}

/**
 * Shared Forged Divine Weapon Builder (used by both the Hero's hand-tracked rig and the 4 World Weapon Forges)
 */
function buildForgedDivineWeaponModel(
  wId: WeaponId,
  obsidianLacquerMat: THREE.Material,
  goldMat: THREE.Material,
  capeMat: THREE.Material
): { root: THREE.Group; primaryBlade: THREE.Mesh } {
  const wRoot = new THREE.Group();

  const hilt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.038, 0.4, 28),
    obsidianLacquerMat
  );
  wRoot.add(hilt);

  // Smooth gold tsuka-ito grip rings
  for (let r = -0.14; r <= 0.14; r += 0.056) {
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.007, 16, 28), goldMat);
    wrap.rotation.x = Math.PI / 2;
    wrap.position.y = r;
    wRoot.add(wrap);
  }

  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.048, 28, 20), goldMat);
  pommel.scale.set(1, 1.25, 1);
  pommel.position.y = -0.22;
  wRoot.add(pommel);

  // Flowing silk pommel tassel with smooth lathe curve
  const tassel = new THREE.Mesh(createSculptedFlameGeometry(0.028, 0.24), capeMat);
  tassel.position.set(0, -0.32, 0.03);
  tassel.rotation.x = Math.PI + 0.35;
  wRoot.add(tassel);

  if (wId === 'weapon-nandaka') {
    const lotusTsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.034, 32), goldMat);
    lotusTsuba.position.y = 0.2;
    wRoot.add(lotusTsuba);

    const tsubaRim = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.014, 16, 36), goldMat);
    tsubaRim.rotation.x = Math.PI / 2;
    tsubaRim.position.y = 0.2;
    wRoot.add(tsubaRim);

    const habakiCollar = new THREE.Mesh(
      new RoundedBoxGeometry(0.054, 0.085, 0.088, 4, 0.012),
      goldMat
    );
    habakiCollar.position.y = 0.245;
    wRoot.add(habakiCollar);

    const bladeMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.85,
      roughness: 0.06,
      metalness: 0.96,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      anisotropy: 0.8,
    });

    const katanaBlade = new THREE.Mesh(
      createForgedBladeGeometry(1.68, 0.078, 0.075, 0.014),
      bladeMat
    );
    katanaBlade.position.set(0, 0.24, 0);
    wRoot.add(katanaBlade);
    return { root: wRoot, primaryBlade: katanaBlade };
  }

  if (wId === 'weapon-surya-greatsword') {
    const solarGuard = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.036, 20, 40), goldMat);
    solarGuard.position.y = 0.22;
    wRoot.add(solarGuard);

    const spineCore = new THREE.Mesh(
      new RoundedBoxGeometry(0.05, 1.65, 0.095, 4, 0.014),
      obsidianLacquerMat
    );
    spineCore.position.y = 1.04;
    wRoot.add(spineCore);

    const greatswordMat = new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.95,
      roughness: 0.08,
      metalness: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      anisotropy: 0.8,
    });
    const greatBlade = new THREE.Mesh(
      createForgedBladeGeometry(1.98, 0.135, 0.04, 0.022),
      greatswordMat
    );
    greatBlade.position.y = 0.24;
    wRoot.add(greatBlade);
    return { root: wRoot, primaryBlade: greatBlade };
  }

  if (wId === 'weapon-agni-twinblades') {
    const crescentGuard = new THREE.Mesh(
      new THREE.TorusGeometry(0.145, 0.028, 18, 36, Math.PI * 1.25),
      goldMat
    );
    crescentGuard.position.y = 0.18;
    wRoot.add(crescentGuard);

    const emeraldMat = new THREE.MeshPhysicalMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 1.95,
      roughness: 0.07,
      metalness: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const saberBlade = new THREE.Mesh(
      createForgedBladeGeometry(1.48, 0.092, 0.12, 0.014),
      emeraldMat
    );
    saberBlade.position.set(0, 0.2, 0);
    wRoot.add(saberBlade);
    return { root: wRoot, primaryBlade: saberBlade };
  }

  // 'weapon-brahmastra-halberd'
  const longShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.032, 1.55, 28),
    obsidianLacquerMat
  );
  longShaft.position.y = 0.6;
  wRoot.add(longShaft);

  const chakraCollar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.028, 20, 48), goldMat);
  chakraCollar.position.y = 1.35;
  wRoot.add(chakraCollar);

  const halberdMat = new THREE.MeshPhysicalMaterial({
    color: 0xf472b6,
    emissive: 0xec4899,
    emissiveIntensity: 2.0,
    roughness: 0.07,
    metalness: 0.95,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  const spearTip = new THREE.Mesh(
    createForgedBladeGeometry(1.22, 0.11, 0.02, 0.018),
    halberdMat
  );
  spearTip.position.y = 1.35;
  wRoot.add(spearTip);
  return { root: wRoot, primaryBlade: spearTip };
}

/**
 * Builds the Hero Character Rig ("Sthapati Royal Shinobi") with:
 * - Immediate smooth articulated armor + asynchronous `Soldier.glb` skeletal character with `Idle`, `Walk`, `Run` animations
 * - High-poly bevel-extruded weapons bound to `mixamorigRightHand`
 * - Smooth high-segment Slash Arc Ribbons + Sekiro Golden Parry Shield + Shadow-Step Dash Ring
 */
function createPlayerCharacter(): PlayerRig {
  const group = new THREE.Group();
  group.name = 'SeekerPlayer';

  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  const fallbackHeroGroup = new THREE.Group();
  bodyGroup.add(fallbackHeroGroup);

  const armorSlateMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e2532,
    roughness: 0.24,
    metalness: 0.78,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
    emissive: 0x0b1120,
    emissiveIntensity: 0.16,
  });
  const capeMat = new THREE.MeshPhysicalMaterial({
    color: 0x881337,
    roughness: 0.32,
    metalness: 0.18,
    sheen: 0.92,
    sheenColor: new THREE.Color(0xfbbf24),
    side: THREE.DoubleSide,
  });
  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    roughness: 0.15,
    metalness: 0.95,
    clearcoat: 0.85,
    clearcoatRoughness: 0.1,
    emissive: 0x78350f,
    emissiveIntensity: 0.32,
  });
  const obsidianLacquerMat = new THREE.MeshPhysicalMaterial({
    color: 0x090d16,
    roughness: 0.18,
    metalness: 0.88,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });

  // Sculpted Smooth Dark-Obsidian & Burnished Gold Shinobi Fallback Silhouette
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.62, 32), armorSlateMat);
  torso.position.y = 1.02;
  torso.castShadow = true;
  fallbackHeroGroup.add(torso);

  const chestPlate = new THREE.Mesh(
    new RoundedBoxGeometry(0.4, 0.38, 0.26, 4, 0.045),
    obsidianLacquerMat
  );
  chestPlate.position.set(0, 1.08, 0);
  fallbackHeroGroup.add(chestPlate);

  const spineTrim = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.36, 0.28, 3, 0.015), goldMat);
  spineTrim.position.set(0, 1.08, 0);
  fallbackHeroGroup.add(spineTrim);

  const waistBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.195, 0.1, 32), goldMat);
  waistBelt.position.y = 0.74;
  fallbackHeroGroup.add(waistBelt);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.165, 32, 24), obsidianLacquerMat);
  head.scale.set(0.92, 1.08, 1.02);
  head.position.y = 1.54;
  head.castShadow = true;
  fallbackHeroGroup.add(head);

  const visorBand = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.055, 0.22, 3, 0.012), goldMat);
  visorBand.position.set(0, 1.55, 0.06);
  fallbackHeroGroup.add(visorBand);

  const helmetCrest = new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.14, 0.24, 3, 0.01), goldMat);
  helmetCrest.position.set(0, 1.68, 0);
  fallbackHeroGroup.add(helmetCrest);

  for (const side of [-1, 1]) {
    const pauldronGrp = new THREE.Group();
    pauldronGrp.position.set(side * 0.26, 1.32, 0);
    pauldronGrp.rotation.z = side * -0.26;
    const plate = new THREE.Mesh(
      new RoundedBoxGeometry(0.16, 0.09, 0.24, 4, 0.02),
      obsidianLacquerMat
    );
    const rim = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.028, 0.26, 3, 0.008), goldMat);
    rim.position.y = -0.03;
    pauldronGrp.add(plate, rim);
    fallbackHeroGroup.add(pauldronGrp);
  }

  const chakraHaloGroup = new THREE.Group();
  chakraHaloGroup.visible = false;

  const cloakMesh = new THREE.Mesh(new THREE.BufferGeometry(), capeMat);
  cloakMesh.visible = false;

  const leftLeg = new THREE.Group();
  leftLeg.position.set(0.11, 0.65, 0);
  const leftLegMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.078, 0.44, 16, 24),
    armorSlateMat
  );
  leftLegMesh.position.y = -0.25;
  leftLeg.add(leftLegMesh);
  fallbackHeroGroup.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(-0.11, 0.65, 0);
  const rightLegMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.078, 0.44, 16, 24),
    armorSlateMat
  );
  rightLegMesh.position.y = -0.25;
  rightLeg.add(rightLegMesh);
  fallbackHeroGroup.add(rightLeg);

  const leftArm = new THREE.Group();
  leftArm.position.set(0.28, 1.24, 0);
  const leftArmMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.062, 0.36, 16, 24),
    armorSlateMat
  );
  leftArmMesh.position.y = -0.18;
  leftArm.add(leftArmMesh);
  fallbackHeroGroup.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(-0.28, 1.22, 0);
  const rightArmMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.062, 0.36, 16, 24),
    armorSlateMat
  );
  rightArmMesh.position.y = -0.18;
  rightArm.add(rightArmMesh);
  fallbackHeroGroup.add(rightArm);

  // Hand-locked Weapon Pivot: origin (0,0,0) sits directly inside the right hand palm gripping the weapon hilt
  const weaponArmPivot = new THREE.Group();
  weaponArmPivot.position.set(-0.26, 0.88, 0.12);
  bodyGroup.add(weaponArmPivot);

  const elbowJoint = new THREE.Group();
  weaponArmPivot.add(elbowJoint);

  const wristGrip = new THREE.Group();
  elbowJoint.add(wristGrip);

  const swordGroup = new THREE.Group();
  swordGroup.scale.setScalar(1.05);
  // Rotate -90 deg around Y so the blade's sharp cutting edge (+X in weapon space) faces forward (+Z in character space)
  swordGroup.rotation.set(0, -Math.PI / 2, 0);
  wristGrip.add(swordGroup);

  const offhandArmPivot = new THREE.Group();
  offhandArmPivot.position.set(0.26, 0.88, 0.12);
  offhandArmPivot.visible = false;
  bodyGroup.add(offhandArmPivot);

  const nandakaBuilt = buildForgedDivineWeaponModel(
    'weapon-nandaka',
    obsidianLacquerMat,
    goldMat,
    capeMat
  );
  const suryaBuilt = buildForgedDivineWeaponModel(
    'weapon-surya-greatsword',
    obsidianLacquerMat,
    goldMat,
    capeMat
  );
  const agniBuilt = buildForgedDivineWeaponModel(
    'weapon-agni-twinblades',
    obsidianLacquerMat,
    goldMat,
    capeMat
  );
  const brahmastraBuilt = buildForgedDivineWeaponModel(
    'weapon-brahmastra-halberd',
    obsidianLacquerMat,
    goldMat,
    capeMat
  );

  suryaBuilt.root.visible = false;
  agniBuilt.root.visible = false;
  brahmastraBuilt.root.visible = false;

  swordGroup.add(nandakaBuilt.root, suryaBuilt.root, agniBuilt.root, brahmastraBuilt.root);

  const offhandSaber = buildForgedDivineWeaponModel(
    'weapon-agni-twinblades',
    obsidianLacquerMat,
    goldMat,
    capeMat
  ).root;
  offhandSaber.rotation.set(0, -Math.PI / 2, 0);
  offhandSaber.position.set(0, 0, 0);
  offhandArmPivot.add(offhandSaber);

  const weaponMeshes: Record<WeaponId, THREE.Group> = {
    'weapon-nandaka': nandakaBuilt.root,
    'weapon-surya-greatsword': suryaBuilt.root,
    'weapon-agni-twinblades': agniBuilt.root,
    'weapon-brahmastra-halberd': brahmastraBuilt.root,
  };

  const swordBlade = nandakaBuilt.primaryBlade;

  // High-segment Sekiro / Zelda Katana Slash Ribbon Arc (64 segments, positioned in FRONT +Z of the character)
  const slashArcGeo = new THREE.RingGeometry(1.15, 2.95, 64, 2, -Math.PI * 0.68, Math.PI * 1.36);
  slashArcGeo.rotateX(-Math.PI / 2);
  const slashArcMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const slashArcMesh = new THREE.Mesh(slashArcGeo, slashArcMat);
  slashArcMesh.position.set(0, 1.08, 0.45);
  group.add(slashArcMesh);

  // Secondary Golden Cross-Slash & Whirlwind Ribbon (in FRONT +Z of the character)
  const comboRingGeo = new THREE.RingGeometry(1.35, 3.25, 64, 2, -Math.PI * 0.85, Math.PI * 1.7);
  comboRingGeo.rotateX(-Math.PI / 2);
  const comboRingMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const comboSlashRing = new THREE.Mesh(comboRingGeo, comboRingMat);
  comboSlashRing.position.set(0, 1.16, 0.45);
  group.add(comboSlashRing);

  // Sekiro Golden Deflect / Parry Aura Shield Ring (in FRONT +Z of the character)
  const parryShieldGeo = new THREE.TorusGeometry(1.08, 0.065, 24, 64);
  const parryShieldMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0,
  });
  const parryShieldMesh = new THREE.Mesh(parryShieldGeo, parryShieldMat);
  parryShieldMesh.position.set(0, 1.15, 0.48);
  group.add(parryShieldMesh);

  // Shinobi Shadow-Step Dash Wind Aura Ring
  const dashRingGeo = new THREE.RingGeometry(0.65, 1.35, 64);
  dashRingGeo.rotateX(-Math.PI / 2);
  const dashRingMat = new THREE.MeshBasicMaterial({
    color: 0x2dd4bf,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const dashRingMesh = new THREE.Mesh(dashRingGeo, dashRingMat);
  dashRingMesh.position.set(0, 0.18, 0);
  group.add(dashRingMesh);

  // Zelda BotW / TotK Garuda Sky-Cloak Paraglider with smooth sculpted wings
  const paragliderGroup = new THREE.Group();
  paragliderGroup.position.set(0, 2.35, 0);
  paragliderGroup.visible = false;
  group.add(paragliderGroup);

  const gliderBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.9, 24), goldMat);
  gliderBar.rotation.z = Math.PI / 2;
  gliderBar.position.y = -0.32;
  paragliderGroup.add(gliderBar);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.quadraticCurveTo(0.85, 0.45, 1.55, 0.12);
  wingShape.quadraticCurveTo(1.15, -0.38, 0, -0.48);
  wingShape.closePath();
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    steps: 6,
    depth: 0.024,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.012,
    bevelSegments: 4,
    curveSegments: 28,
  });
  wingGeo.rotateX(Math.PI * 0.5);
  wingGeo.computeVertexNormals();

  const wingMat = new THREE.MeshPhysicalMaterial({
    color: 0x0ea5e9,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.85,
    roughness: 0.2,
    metalness: 0.35,
    clearcoat: 0.8,
  });
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.scale.x = -1;
  leftWing.position.set(-0.1, 0, 0.1);
  leftWing.rotation.y = 0.16;
  paragliderGroup.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(0.1, 0, 0.1);
  rightWing.rotation.y = -0.16;
  paragliderGroup.add(rightWing);

  const centerFin = new THREE.Mesh(new THREE.SphereGeometry(0.24, 28, 20), goldMat);
  centerFin.scale.set(0.75, 0.36, 1.65);
  paragliderGroup.add(centerFin);

  // No revolving jewels around the character (kept empty per user request)
  const powerOrbitals: THREE.Mesh[] = [];

  // Grounding Contact Shadow Disc
  const shadowGeo = new THREE.CircleGeometry(0.58, 48);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x080503,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.position.y = 0.025;
  group.add(shadowDisc);

  const rig: PlayerRig = {
    group,
    bodyGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    weaponArmPivot,
    elbowJoint,
    wristGrip,
    offhandArmPivot,
    cloakMesh,
    chakraHaloGroup,
    dashRingMesh,
    swordGroup,
    swordBlade,
    weaponMeshes,
    equippedWeaponId: 'weapon-nandaka',
    slashArcMesh,
    comboSlashRing,
    parryShieldMesh,
    paragliderGroup,
    powerOrbitals,
    shadowDisc,
    glbRoot: null,
    rightHandBone: null,
    leftHandBone: null,
    rightArmBone: null,
    rightForeArmBone: null,
    leftArmBone: null,
    leftForeArmBone: null,
    mixer: null,
    actions: {},
    activeActionName: 'idle',
    setAnimationState(nextState: 'idle' | 'walk' | 'run', speedMultiplier = 1) {
      if (!this.mixer) return;
      if (this.activeActionName !== nextState) {
        const prevAction = this.actions[this.activeActionName];
        const nextAction = this.actions[nextState];
        if (nextAction) {
          nextAction.reset().fadeIn(0.16).play();
          if (prevAction && prevAction !== nextAction) {
            prevAction.fadeOut(0.16);
          }
          this.activeActionName = nextState;
        }
      }
      const currentAct = this.actions[this.activeActionName];
      if (currentAct) {
        currentAct.timeScale = speedMultiplier;
      }
    },
    setEquippedWeapon(weaponId: WeaponId) {
      this.equippedWeaponId = weaponId;
      (Object.keys(this.weaponMeshes) as WeaponId[]).forEach((k) => {
        this.weaponMeshes[k].visible = k === weaponId;
      });
      this.offhandArmPivot.visible = weaponId === 'weapon-agni-twinblades';
    },
  };

  // Load real rigged 3D character `Soldier.glb`, apply smooth Steel-Obsidian & Burnished Gold Shinobi Armor,
  // and strip the rifle-holding forearm/hand keyframe tracks so the character holds the sword naturally at the right side!
  const loader = new GLTFLoader();
  loader.load(
    'https://threejs.org/examples/models/gltf/Soldier.glb',
    (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(1.08);
      model.rotation.y = Math.PI;
      model.traverse((child) => {
        if (child.name === 'mixamorigRightHand' || /RightHand$/i.test(child.name)) {
          rig.rightHandBone = child;
        } else if (child.name === 'mixamorigLeftHand' || /LeftHand$/i.test(child.name)) {
          rig.leftHandBone = child;
        } else if (child.name === 'mixamorigRightArm' || /RightArm$/i.test(child.name)) {
          rig.rightArmBone = child;
        } else if (child.name === 'mixamorigRightForeArm' || /RightForeArm$/i.test(child.name)) {
          rig.rightForeArmBone = child;
        } else if (child.name === 'mixamorigLeftArm' || /LeftArm$/i.test(child.name)) {
          rig.leftArmBone = child;
        } else if (child.name === 'mixamorigLeftForeArm' || /LeftForeArm$/i.test(child.name)) {
          rig.leftForeArmBone = child;
        }

        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.castShadow = true;
          m.receiveShadow = true;
          m.geometry.computeVertexNormals();
          if (m.material instanceof THREE.MeshStandardMaterial) {
            const mat = m.material.clone();
            mat.flatShading = false;
            const isVisor = /visor/i.test(m.name);
            if (isVisor) {
              mat.color = new THREE.Color(0xfbbf24);
              mat.emissive = new THREE.Color(0xd97706);
              mat.emissiveIntensity = 0.65;
              mat.metalness = 0.92;
              mat.roughness = 0.14;
            } else {
              mat.color = new THREE.Color(0x526077);
              mat.metalness = 0.68;
              mat.roughness = 0.24;
              mat.emissive = new THREE.Color(0x162033);
              mat.emissiveIntensity = 0.22;
            }
            m.material = mat;
          }
        }
      });

      fallbackHeroGroup.visible = false;
      bodyGroup.add(model);
      rig.glbRoot = model;

      const mixer = new THREE.AnimationMixer(model);
      rig.mixer = mixer;

      const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'Idle') || gltf.animations[0];
      const walkClip =
        THREE.AnimationClip.findByName(gltf.animations, 'Walk') || gltf.animations[3] || idleClip;
      const runClip =
        THREE.AnimationClip.findByName(gltf.animations, 'Run') || gltf.animations[1] || walkClip;

      if (idleClip) rig.actions.idle = mixer.clipAction(idleClip);
      if (walkClip) rig.actions.walk = mixer.clipAction(walkClip);
      if (runClip) rig.actions.run = mixer.clipAction(runClip);

      rig.actions.idle?.play();
    },
    undefined,
    () => {}
  );

  return rig;
}

/**
 * Creates a floating 3D Corporate Lingo Nameplate Sprite above each Asura / Boss
 */
function createCorporateNameplateSprite(
  name: string,
  subtitle: string,
  accentHex: number
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(7, 9, 16, 0.88)';
  ctx.beginPath();
  ctx.roundRect(12, 16, 488, 96, 16);
  ctx.fill();

  const hexStr = `#${accentHex.toString(16).padStart(6, '0')}`;
  ctx.strokeStyle = hexStr;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  ctx.font = '900 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name.length > 34 ? name.slice(0, 32) + '…' : name, 256, 48);

  ctx.font = '700 18px monospace';
  ctx.fillStyle = '#fda4af';
  ctx.fillText(subtitle.toUpperCase(), 256, 84);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.8, 0.7, 1);
  return sprite;
}

/**
 * Builds a forged Crimson/Void Corporate Asura Weapon (hilt + guard + curved bevel-extruded blade)
 * that attaches directly to the rigged 3D character's right hand bone (`mixamorigRightHand`).
 */
function createAsuraForgedWeapon(colorHex: number, scale = 1.0): THREE.Group {
  const wGrp = new THREE.Group();
  wGrp.scale.setScalar(scale);

  const hiltMat = new THREE.MeshPhysicalMaterial({
    color: 0x09060d,
    roughness: 0.2,
    metalness: 0.9,
    clearcoat: 1.0,
  });
  const guardMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    roughness: 0.16,
    metalness: 0.94,
    clearcoat: 0.9,
  });
  const bladeMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 1.85,
    roughness: 0.08,
    metalness: 0.95,
    clearcoat: 1.0,
  });

  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.38, 24), hiltMat);
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.024, 16, 32), guardMat);
  guard.rotation.x = Math.PI / 2;
  guard.position.y = 0.19;
  const blade = new THREE.Mesh(createForgedBladeGeometry(1.42, 0.09, 0.08, 0.016), bladeMat);
  blade.position.y = 0.2;

  wGrp.add(hilt, guard, blade);
  return wGrp;
}

/**
 * Builds a Corporate Asura Enemy Rig:
 * - Zero primitive sphere/cone geometry! Uses 100% rigged 3D humanoid skeletal warrior (`Soldier.glb` / `Xbot.glb`)
 * - Forged Crimson/Void Blade locked to the right hand bone
 * - 3D Corporate Lingo Nameplate, Vitality Bar, Sekiro Posture Bar, Ground Telegraph Ring, and Perilous Kanji Warning
 */
function createDemonRig(config: (typeof INITIAL_DEMON_SPAWNS)[number]): DemonEntity {
  const group = new THREE.Group();
  const y = groundHeightAt(config.position.x, config.position.z);
  group.position.set(config.position.x, y, config.position.z);

  const bodyGroup = new THREE.Group();
  bodyGroup.scale.setScalar(config.scale);
  group.add(bodyGroup);

  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();

  const weaponGroup = createAsuraForgedWeapon(config.colorHex, 1.05);
  weaponGroup.position.set(0.32, 0.95, 0.18);
  weaponGroup.rotation.set(0.85, 0, 0.15);
  bodyGroup.add(weaponGroup);

  // Smooth 64-segment Crimson Enemy Attack Slash Arc Ribbon
  const demonSlashGeo = new THREE.RingGeometry(0.95, 2.35, 64, 2, -Math.PI * 0.65, Math.PI * 1.3);
  demonSlashGeo.rotateX(-Math.PI / 2);
  const demonSlashMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const slashArcMesh = new THREE.Mesh(demonSlashGeo, demonSlashMat);
  slashArcMesh.position.set(0, 1.12, 0.35);
  group.add(slashArcMesh);

  // Smooth 64-segment Ground Perilous Telegraph Ring
  const teleGeo = new THREE.RingGeometry(1.1, 1.65, 64);
  teleGeo.rotateX(-Math.PI / 2);
  const teleMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const telegraphRingMesh = new THREE.Mesh(teleGeo, teleMat);
  telegraphRingMesh.position.y = 0.05;
  group.add(telegraphRingMesh);

  // High-Contrast Billboard 3D Health & Posture Bar Group with Corporate Lingo Nameplate
  const hpBarGroup = new THREE.Group();
  hpBarGroup.position.y = 2.35 * config.scale;
  group.add(hpBarGroup);

  const nameplate = createCorporateNameplateSprite(config.name, config.title, config.colorHex);
  nameplate.position.set(0, 0.56, 0);
  hpBarGroup.add(nameplate);

  const hpBg = new THREE.Mesh(
    new THREE.PlaneGeometry(1.52, 0.34),
    new THREE.MeshBasicMaterial({
      color: 0x05070b,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    })
  );
  hpBg.position.z = -0.01;
  hpBarGroup.add(hpBg);

  const hpFillGeo = new THREE.PlaneGeometry(1.42, 0.13);
  hpFillGeo.translate(0.71, 0, 0);
  const hpBarFill = new THREE.Mesh(
    hpFillGeo,
    new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide })
  );
  hpBarFill.position.set(-0.71, 0.06, 0.01);
  hpBarGroup.add(hpBarFill);

  const postureFillGeo = new THREE.PlaneGeometry(1.42, 0.07);
  postureFillGeo.translate(0.71, 0, 0);
  const postureBarFill = new THREE.Mesh(
    postureFillGeo,
    new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide })
  );
  postureBarFill.position.set(-0.71, -0.07, 0.01);
  postureBarFill.scale.x = 0.04;
  hpBarGroup.add(postureBarFill);

  const kanjiSprite = createKanjiWarningSprite('危');
  kanjiSprite.position.y = 3.45 * config.scale;
  group.add(kanjiSprite);

  return {
    id: config.id,
    name: config.name,
    title: config.title,
    archetype: config.archetype,
    attackDamage: config.attackDamage,
    moveSpeed: config.moveSpeed,
    state: 'patrol',
    stateTimer: 0,
    group,
    bodyGroup,
    leftArm,
    rightArm,
    rightHandBone: null,
    weaponGroup,
    slashArcMesh,
    telegraphRingMesh,
    hpBarGroup,
    hpBarFill,
    postureBarFill,
    kanjiSprite,
    homeX: config.position.x,
    homeZ: config.position.z,
    x: config.position.x,
    z: config.position.z,
    y,
    yaw: 0,
    hp: config.maxHp,
    maxHp: config.maxHp,
    posture: 0,
    maxPosture: 65,
    scale: config.scale,
    alive: true,
    hitFlashTimer: 0,
    attackCooldown: 0,
    perilousTimer: 0,
    aggroRange: config.aggroRange,
    mixer: null,
    actions: {},
    activeClip: 'idle',
    setClip(nextClip: 'idle' | 'walk' | 'run', speed = 1) {
      if (!this.mixer) return;
      if (this.activeClip !== nextClip) {
        const prev = this.actions[this.activeClip];
        const next = this.actions[nextClip];
        if (next) {
          next.reset().fadeIn(0.15).play();
          if (prev && prev !== next) prev.fadeOut(0.15);
          this.activeClip = nextClip;
        }
      }
      const act = this.actions[this.activeClip];
      if (act) act.timeScale = speed;
    },
  };
}

/**
 * Builds the Colossal "THE SEPTEMBER LAYOFF" Maha-Asura Final Boss in the Northern Citadel Arena:
 * - Zero primitive spheres/cones! Uses a colossal rigged 3D humanoid warrior (`Soldier.glb` / `Xbot.glb`)
 * - Dual Forged Crimson/Gold Greatswords locked to its right and left hands
 */
function createLayoffBossRig(): LayoffBossEntity {
  const group = new THREE.Group();
  const pos = LAYOFF_BOSS_CONFIG.spawnPosition;
  const y = groundHeightAt(pos.x, pos.z);
  group.position.set(pos.x, y, pos.z);
  group.visible = false;

  const bodyGroup = new THREE.Group();
  bodyGroup.scale.setScalar(LAYOFF_BOSS_CONFIG.scale);
  group.add(bodyGroup);

  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.75,
    roughness: 0.14,
    metalness: 0.95,
    clearcoat: 1.0,
  });

  const crownRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 24, 64), goldMat);
  crownRing.position.set(0, 1.95, -0.15);
  bodyGroup.add(crownRing);

  const rightWeaponGroup = createAsuraForgedWeapon(0xe11d48, 1.35);
  rightWeaponGroup.position.set(0.36, 1.0, 0.2);
  rightWeaponGroup.rotation.set(0.85, 0, 0.15);
  bodyGroup.add(rightWeaponGroup);

  const leftWeaponGroup = createAsuraForgedWeapon(0xfbbf24, 1.25);
  leftWeaponGroup.position.set(-0.36, 1.0, 0.2);
  leftWeaponGroup.rotation.set(0.85, 0, -0.15);
  bodyGroup.add(leftWeaponGroup);

  const bossNameplate = createCorporateNameplateSprite(
    'THE SEPTEMBER LAYOFF',
    'EXECUTIVE RESTRUCTURING COLOSSUS · 1600 HP',
    0xe11d48
  );
  bossNameplate.scale.set(4.6, 1.15, 1);
  bossNameplate.position.set(0, 5.8, 0);
  group.add(bossNameplate);

  const shockGeo = new THREE.RingGeometry(1.2, 1.75, 64);
  shockGeo.rotateX(-Math.PI / 2);
  const shockMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const shockwaveRing = new THREE.Mesh(shockGeo, shockMat);
  shockwaveRing.position.y = 0.08;
  group.add(shockwaveRing);

  const kanjiSprite = createKanjiWarningSprite('忍殺');
  kanjiSprite.scale.set(2.2, 2.2, 1);
  kanjiSprite.position.y = 6.9;
  group.add(kanjiSprite);

  return {
    id: LAYOFF_BOSS_CONFIG.id,
    name: LAYOFF_BOSS_CONFIG.name,
    subtitle: LAYOFF_BOSS_CONFIG.subtitle,
    group,
    bodyGroup,
    arms: [rightWeaponGroup, leftWeaponGroup],
    rightHandBone: null,
    leftHandBone: null,
    rightWeaponGroup,
    leftWeaponGroup,
    crownRing,
    shockwaveRing,
    kanjiSprite,
    x: pos.x,
    z: pos.z,
    y,
    yaw: 0,
    hp: LAYOFF_BOSS_CONFIG.maxHp,
    maxHp: LAYOFF_BOSS_CONFIG.maxHp,
    posture: 0,
    maxPosture: 180,
    awakened: false,
    defeated: false,
    hitFlashTimer: 0,
    attackTimer: 0,
    perilousTimer: 0,
    mixer: null,
  };
}

/**
 * Builds a floating 3D Ancient Royal Scroll Pedestal in front of each monument stop
 * with high-segment lathe-carved stone base and smooth curved parchment scroll
 */
function createFloatingScrollPedestal(
  stoneMat: THREE.Material,
  goldMat: THREE.Material,
  accentHex: string
): THREE.Group {
  const scrollRoot = new THREE.Group();

  const pedestalProfile = new THREE.SplineCurve([
    new THREE.Vector2(0.48, 0.0),
    new THREE.Vector2(0.45, 0.18),
    new THREE.Vector2(0.32, 0.36),
    new THREE.Vector2(0.28, 0.85),
    new THREE.Vector2(0.42, 1.05),
    new THREE.Vector2(0.38, 1.15),
  ]);
  const pillarGeo = new THREE.LatheGeometry(pedestalProfile.getPoints(28), 36);
  pillarGeo.computeVertexNormals();
  const pillar = new THREE.Mesh(pillarGeo, stoneMat);
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  scrollRoot.add(pillar);

  const floatGroup = new THREE.Group();
  floatGroup.name = 'FloatingScrollObject';
  floatGroup.position.y = 1.68;

  const parchmentMat = new THREE.MeshPhysicalMaterial({
    color: 0xf5e1be,
    emissive: new THREE.Color(accentHex),
    emissiveIntensity: 0.34,
    roughness: 0.38,
    clearcoat: 0.4,
    side: THREE.DoubleSide,
  });
  // Gently S-curved high-segment scroll parchment
  const parchGeo = new THREE.PlaneGeometry(0.86, 1.06, 16, 24);
  const pPos = parchGeo.attributes.position;
  for (let i = 0; i < pPos.count; i++) {
    const py = pPos.getY(i);
    pPos.setZ(i, Math.sin((py / 0.53) * Math.PI) * 0.065);
  }
  parchGeo.computeVertexNormals();
  const parchment = new THREE.Mesh(parchGeo, parchmentMat);
  parchment.rotation.x = -0.25;
  floatGroup.add(parchment);

  const topRoller = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 1.04, 28), goldMat);
  topRoller.rotation.z = Math.PI / 2;
  topRoller.position.set(0, 0.49, -0.12);
  floatGroup.add(topRoller);

  const botRoller = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 1.04, 28), goldMat);
  botRoller.rotation.z = Math.PI / 2;
  botRoller.position.set(0, -0.49, 0.12);
  floatGroup.add(botRoller);

  scrollRoot.add(floatGroup);
  return scrollRoot;
}

/**
 * Creates a smooth high-segment Hoysala / Chalukya Spline-Interpolated Lathe Temple Pillar Geometry
 */
function createHoysalaLathePillarGeometry(height = 3.8): THREE.LatheGeometry {
  const rawPoints: THREE.Vector2[] = [
    new THREE.Vector2(0.43, 0.0),
    new THREE.Vector2(0.42, 0.26),
    new THREE.Vector2(0.31, 0.35),
    new THREE.Vector2(0.34, 0.58),
    new THREE.Vector2(0.24, 0.74),
    new THREE.Vector2(0.26, height * 0.42),
    new THREE.Vector2(0.34, height * 0.48), // smooth central bell molding
    new THREE.Vector2(0.23, height * 0.54),
    new THREE.Vector2(0.21, height * 0.74),
    new THREE.Vector2(0.35, height * 0.82), // kumbha cushion capital
    new THREE.Vector2(0.2, height * 0.88),
    new THREE.Vector2(0.44, height * 0.96), // flared abacus bracket
    new THREE.Vector2(0.44, height),
  ];
  const spline = new THREE.SplineCurve(rawPoints);
  const geo = new THREE.LatheGeometry(spline.getPoints(48), 48);
  geo.translate(0, -height * 0.5, 0);
  geo.computeVertexNormals();
  return geo;
}

function createMonumentMesh(
  type: MonumentType,
  accentHex: string,
  stoneMat: THREE.Material,
  darkStoneMat: THREE.Material,
  goldMat: THREE.Material,
  waterMat: THREE.Material,
  isSoftwareGl: boolean
): {
  group: THREE.Group;
  haloRing: THREE.Mesh;
  artifactMesh: THREE.Object3D;
  scrollPedestalMesh: THREE.Object3D;
  skyBeamMesh: THREE.Mesh;
  pointLight: THREE.PointLight | null;
} {
  const group = new THREE.Group();
  const accentColor = new THREE.Color(accentHex);

  const emissiveMat = new THREE.MeshPhysicalMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 1.65,
    roughness: 0.14,
    metalness: 0.88,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    ior: 2.1,
  });

  const sculptedFlameGeo = createSculptedFlameGeometry(0.18, 0.44);

  // Multi-tiered carved Jagati Plinth with gold lotus molding + Walkable Front Ceremonial Staircase (Sopana)
  const baseStep1 = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.0, 0.48, 64), darkStoneMat);
  baseStep1.position.y = 0.24;
  baseStep1.receiveShadow = true;
  baseStep1.castShadow = true;
  group.add(baseStep1);

  const goldMolding = new THREE.Mesh(new THREE.CylinderGeometry(4.95, 5.1, 0.14, 64), goldMat);
  goldMolding.position.y = 0.54;
  group.add(goldMolding);

  const baseStep2 = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.85, 0.52, 64), stoneMat);
  baseStep2.position.y = 0.86;
  baseStep2.receiveShadow = true;
  baseStep2.castShadow = true;
  group.add(baseStep2);

  // Walkable Front Ceremonial Staircase (Sopana) with Beveled Hastihasta Balustrades (+Z approach)
  for (let st = 0; st < 5; st++) {
    const stepH = 0.22;
    const stepY = (st + 0.5) * stepH;
    const stepZ = 6.95 - st * 0.52;
    const stepSlab = new THREE.Mesh(
      new RoundedBoxGeometry(2.75 - st * 0.08, stepH, 0.58, 4, 0.035),
      st % 2 === 0 ? stoneMat : darkStoneMat
    );
    stepSlab.position.set(0, stepY, stepZ);
    stepSlab.receiveShadow = true;
    stepSlab.castShadow = true;
    const stepGoldEdge = new THREE.Mesh(
      new RoundedBoxGeometry(2.78 - st * 0.08, 0.045, 0.6, 3, 0.015),
      goldMat
    );
    stepGoldEdge.position.set(0, stepY + stepH * 0.5, stepZ);
    group.add(stepSlab, stepGoldEdge);
  }

  for (const railSide of [-1.48, 1.48]) {
    const railWall = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.95, 2.7, 4, 0.045), darkStoneMat);
    railWall.position.set(railSide, 0.55, 5.85);
    railWall.rotation.x = 0.36;
    railWall.castShadow = true;
    const railCap = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.08, 2.75, 4, 0.025), goldMat);
    railCap.position.set(railSide, 1.02, 5.85);
    railCap.rotation.x = 0.36;
    const newelPost = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.95, 32), stoneMat);
    newelPost.position.set(railSide, 0.48, 7.15);
    const newelGem = new THREE.Mesh(sculptedFlameGeo, emissiveMat);
    newelGem.position.set(railSide, 0.96, 7.15);
    group.add(railWall, railCap, newelPost, newelGem);
  }

  // Corner Sacred Agni Braziers on every Sanctum Plinth
  for (let c = 0; c < 4; c++) {
    const ca = (c / 4) * Math.PI * 2 + Math.PI / 4;
    const bx = Math.cos(ca) * 4.85;
    const bz = Math.sin(ca) * 4.85;
    const brazierPost = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.85, 32), darkStoneMat);
    brazierPost.position.set(bx, 0.9, bz);
    const brazierCup = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.16, 0.24, 32), goldMat);
    brazierCup.position.set(bx, 1.42, bz);
    const ember = new THREE.Mesh(sculptedFlameGeo, emissiveMat);
    ember.position.set(bx, 1.54, bz);
    group.add(brazierPost, brazierCup, ember);
  }

  const haloGeo = new THREE.RingGeometry(5.85, 6.45, 64);
  haloGeo.rotateX(-Math.PI / 2);
  const haloMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.82,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const haloRing = new THREE.Mesh(haloGeo, haloMat);
  haloRing.position.y = 0.08;
  const innerMandala = new THREE.Mesh(
    new THREE.RingGeometry(5.2, 5.45, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  haloRing.add(innerMandala);
  group.add(haloRing);

  // Volumetric God-Ray Sky Column
  const skyBeamGeo = new THREE.CylinderGeometry(0.12, 1.25, 38, 36, 1, true);
  const skyBeamMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const skyBeamMesh = new THREE.Mesh(skyBeamGeo, skyBeamMat);
  skyBeamMesh.position.y = 19.5;
  group.add(skyBeamMesh);

  const hoysalaPillarGeo = createHoysalaLathePillarGeometry(3.85);
  let artifactMesh: THREE.Object3D = new THREE.Group();

  if (type === 'sun_mandapa') {
    const pillarOffsets = [
      [-2.4, -2.4],
      [2.4, -2.4],
      [-2.4, 2.4],
      [2.4, 2.4],
      [-2.4, 0],
      [2.4, 0],
      [0, -2.4],
      [0, 2.4],
    ];
    for (const [px, pz] of pillarOffsets) {
      const col = new THREE.Mesh(hoysalaPillarGeo, stoneMat);
      col.position.set(px, 3.02, pz);
      col.castShadow = true;
      group.add(col);
    }

    // Stepped Phamsana Cornice & Curvilinear Nagara Shikhara Tower with 4 Urusringa sub-spires
    const cornice = new THREE.Mesh(new RoundedBoxGeometry(5.8, 0.36, 5.8, 5, 0.06), darkStoneMat);
    cornice.position.y = 5.05;
    group.add(cornice);

    const goldCorniceTrim = new THREE.Mesh(new RoundedBoxGeometry(6.0, 0.12, 6.0, 4, 0.03), goldMat);
    goldCorniceTrim.position.y = 5.28;
    group.add(goldCorniceTrim);

    for (let t = 0; t < 5; t++) {
      const w = 4.8 - t * 0.72;
      const tier = new THREE.Mesh(
        new RoundedBoxGeometry(w, 0.62, w, 5, 0.065),
        t % 2 === 0 ? stoneMat : darkStoneMat
      );
      tier.position.y = 5.65 + t * 0.58;
      tier.castShadow = true;
      group.add(tier);
    }

    // 4 Corner Curvilinear Rekha-Nagara Urusringa Turrets (Smooth Lathe Spire Profile)
    const urusringaProfile = new THREE.SplineCurve([
      new THREE.Vector2(0.65, -0.92),
      new THREE.Vector2(0.56, -0.25),
      new THREE.Vector2(0.36, 0.42),
      new THREE.Vector2(0.12, 0.82),
      new THREE.Vector2(0.0, 0.94),
    ]);
    const turretGeo = new THREE.LatheGeometry(urusringaProfile.getPoints(28), 36);
    turretGeo.computeVertexNormals();
    for (const [ux, uz] of [
      [-1.75, -1.75],
      [1.75, -1.75],
      [-1.75, 1.75],
      [1.75, 1.75],
    ]) {
      const turret = new THREE.Mesh(turretGeo, stoneMat);
      turret.position.set(ux, 6.25, uz);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 18), goldMat);
      finial.position.set(ux, 7.28, uz);
      group.add(turret, finial);
    }

    // Fluted Amalaka Crown & Kalasha Finial
    const amalaka = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.28, 28, 48), stoneMat);
    amalaka.rotation.x = Math.PI / 2;
    amalaka.position.y = 8.65;
    group.add(amalaka);

    const kalasha = new THREE.Mesh(new THREE.SphereGeometry(0.46, 32, 24), goldMat);
    kalasha.position.y = 9.35;
    const spireTip = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.75, 32), goldMat);
    spireTip.position.y = 9.95;
    group.add(kalasha, spireTip);

    const chakraGroup = new THREE.Group();
    chakraGroup.position.y = 2.85;
    const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.1, 24, 64), goldMat);
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.06, 20, 48), emissiveMat);
    innerRing.rotation.y = Math.PI / 3;
    const hub = createSculptedLotusBlossom(emissiveMat, goldMat, 0.85);
    hub.rotation.x = Math.PI / 2;
    chakraGroup.add(wheelRing, innerRing, hub);
    group.add(chakraGroup);
    artifactMesh = chakraGroup;
  } else if (type === 'jantar_yantra') {
    const dial = new THREE.Mesh(
      new THREE.TorusGeometry(2.7, 0.28, 28, 64, Math.PI * 1.45),
      stoneMat
    );
    dial.position.y = 3.2;
    dial.rotation.x = 0.48;
    dial.castShadow = true;
    group.add(dial);

    const ramp = new THREE.Mesh(new RoundedBoxGeometry(0.9, 4.8, 3.8, 5, 0.06), darkStoneMat);
    ramp.position.set(0, 3.1, -0.4);
    ramp.rotation.x = 0.52;
    ramp.castShadow = true;
    group.add(ramp);

    const armillary = new THREE.Group();
    armillary.position.set(0, 4.5, 0.5);
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.06, 24, 64), goldMat);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.05, 24, 64), emissiveMat);
    ring2.rotation.y = Math.PI / 2;
    const core = createSculptedLotusBlossom(emissiveMat, goldMat, 0.78);
    armillary.add(ring1, ring2, core);
    group.add(armillary);
    artifactMesh = armillary;
  } else if (type === 'oasis_pavilion') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const col = new THREE.Mesh(hoysalaPillarGeo, stoneMat);
      col.position.set(Math.cos(a) * 2.8, 2.95, Math.sin(a) * 2.8);
      col.castShadow = true;
      group.add(col);
    }

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(3.05, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.52),
      darkStoneMat
    );
    dome.position.y = 4.65;
    group.add(dome);

    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.1, 32), goldMat);
    finial.position.y = 8.05;
    group.add(finial);

    const arcadeCubeGroup = new THREE.Group();
    arcadeCubeGroup.position.y = 2.9;
    const holoLotus = createSculptedLotusBlossom(emissiveMat, goldMat, 1.15);
    const holoRing = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.07, 24, 64), goldMat);
    holoRing.rotation.x = Math.PI / 3;
    arcadeCubeGroup.add(holoLotus, holoRing);
    group.add(arcadeCubeGroup);
    artifactMesh = arcadeCubeGroup;
  } else if (type === 'ashoka_stambha') {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.68, 6.8, 48), stoneMat);
    shaft.position.y = 4.4;
    shaft.castShadow = true;
    group.add(shaft);

    const lotusBell = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.52, 0.78, 48), goldMat);
    lotusBell.position.y = 8.05;
    group.add(lotusBell);

    const dharmachakra = new THREE.Group();
    dharmachakra.position.y = 9.35;
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.1, 24, 64), emissiveMat);
    const centerLotus = createSculptedLotusBlossom(goldMat, emissiveMat, 0.78);
    centerLotus.rotation.x = Math.PI / 2;
    dharmachakra.add(wheel, centerLotus);
    group.add(dharmachakra);
    artifactMesh = dharmachakra;
  } else if (type === 'gopuram_sanctum') {
    const tiers = [
      { w: 4.8, d: 3.1, h: 1.5, y: 1.8 },
      { w: 4.1, d: 2.6, h: 1.4, y: 3.2 },
      { w: 3.4, d: 2.2, h: 1.3, y: 4.5 },
      { w: 2.7, d: 1.8, h: 1.2, y: 5.7 },
    ];
    tiers.forEach((t, idx) => {
      const box = new THREE.Mesh(
        new RoundedBoxGeometry(t.w, t.h, t.d, 5, 0.065),
        idx % 2 === 0 ? stoneMat : darkStoneMat
      );
      box.position.y = t.y;
      box.castShadow = true;
      group.add(box);
      const goldBand = new THREE.Mesh(
        new RoundedBoxGeometry(t.w + 0.16, 0.1, t.d + 0.16, 4, 0.03),
        goldMat
      );
      goldBand.position.y = t.y + t.h * 0.5;
      group.add(goldBand);
    });

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 1.2, 1.2, 36), goldMat);
    crown.position.y = 6.85;
    crown.rotation.z = Math.PI / 2;
    group.add(crown);

    const yantra = new THREE.Group();
    yantra.position.set(0, 2.7, 2.1);
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.065, 24, 64), emissiveMat);
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 24, 64), goldMat);
    innerRing.rotation.x = Math.PI / 4;
    const centerBlossom = createSculptedLotusBlossom(emissiveMat, goldMat, 0.72);
    centerBlossom.rotation.x = Math.PI / 2;
    yantra.add(outerRing, innerRing, centerBlossom);
    group.add(yantra);
    artifactMesh = yantra;
  } else {
    for (let i = 0; i < 4; i++) {
      const rOuter = 4.4 - i * 0.65;
      const ringWall = new THREE.Mesh(
        new THREE.CylinderGeometry(rOuter, rOuter, 0.58, 48, 1, true),
        i % 2 === 0 ? stoneMat : darkStoneMat
      );
      ringWall.position.y = 1.45 - i * 0.25;
      group.add(ringWall);
    }

    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.7, 48), waterMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 1.14;
    group.add(pool);

    const vajraLotus = new THREE.Group();
    vajraLotus.position.y = 2.45;
    const lotusSculpture = createSculptedLotusBlossom(emissiveMat, goldMat, 1.12);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.06, 24, 64), goldMat);
    ring.rotation.x = Math.PI / 2;
    vajraLotus.add(lotusSculpture, ring);
    group.add(vajraLotus);
    artifactMesh = vajraLotus;
  }

  const scrollPedestal = createFloatingScrollPedestal(stoneMat, goldMat, accentHex);
  scrollPedestal.position.set(0, 1.05, 4.65);
  group.add(scrollPedestal);

  let pointLight: THREE.PointLight | null = null;
  if (!isSoftwareGl) {
    pointLight = new THREE.PointLight(accentColor, 3.2, 20);
    pointLight.position.set(0, 4.0, 2.0);
    group.add(pointLight);
  }

  return {
    group,
    haloRing,
    artifactMesh,
    scrollPedestalMesh: scrollPedestal,
    skyBeamMesh,
    pointLight,
  };
}

/**
 * Builds Ghost of Tsushima / Zelda style Slender Botanical Wind-Swept Grass Field
 */
function createZeldaWindGrassField(isSoftwareGl: boolean): {
  mesh: THREE.InstancedMesh;
  uniforms: { uTime: { value: number }; uSunIntensity: { value: number } };
} {
  const bladeCount = isSoftwareGl ? 4200 : 12000;

  // Slender 5-blade botanical fan (0.07m wide instead of fat 0.28m ribbons!)
  const singleBlade = new THREE.PlaneGeometry(0.072, 0.86, 1, 4);
  singleBlade.translate(0, 0.43, 0);
  const b2 = singleBlade.clone().rotateY(0.65).rotateZ(0.08).translate(0.07, 0, 0.05);
  const b3 = singleBlade.clone().rotateY(-0.65).rotateZ(-0.08).translate(-0.07, 0, -0.05);
  const b4 = singleBlade.clone().rotateY(1.35).rotateX(0.09).translate(0.04, 0, -0.07);
  const b5 = singleBlade.clone().rotateY(-1.35).rotateX(-0.09).translate(-0.04, 0, 0.07);

  const blades = [singleBlade, b2, b3, b4, b5];
  const singlePosLen = (singleBlade.attributes.position.array as Float32Array).length;
  const singleIdxArr = singleBlade.index!.array;
  const vCount = singleBlade.attributes.position.count;

  const mergedPos = new Float32Array(singlePosLen * blades.length);
  const mergedIdx = new Uint16Array(singleIdxArr.length * blades.length);

  blades.forEach((b, bIdx) => {
    mergedPos.set(b.attributes.position.array as Float32Array, bIdx * singlePosLen);
    for (let i = 0; i < singleIdxArr.length; i++) {
      mergedIdx[bIdx * singleIdxArr.length + i] = singleIdxArr[i] + bIdx * vCount;
    }
  });

  const bladeGeo = new THREE.BufferGeometry();
  bladeGeo.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  bladeGeo.setIndex(new THREE.BufferAttribute(mergedIdx, 1));

  const grassUniforms = {
    uTime: { value: 0 },
    uSunIntensity: { value: 1.0 },
  };

  const grassMat = new THREE.ShaderMaterial({
    uniforms: grassUniforms,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying float vHeightPct;
      varying float vWindWave;

      void main() {
        vHeightPct = clamp(position.y / 0.86, 0.0, 1.0);
        vec4 worldBase = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);

        float wave = sin(worldBase.x * 0.18 + worldBase.z * 0.14 + uTime * 2.45)
                   + 0.48 * cos(worldBase.x * 0.09 - worldBase.z * 0.21 + uTime * 1.75);
        vWindWave = wave;

        vec3 displaced = position;
        displaced.x *= (1.0 - vHeightPct * 0.84);
        float bend = vHeightPct * vHeightPct * 0.36 * wave;
        displaced.x += bend;
        displaced.z += bend * 0.6;

        vec4 worldPos = instanceMatrix * vec4(displaced, 1.0);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uSunIntensity;
      varying float vHeightPct;
      varying float vWindWave;

      void main() {
        vec3 rootColor = vec3(0.06, 0.17, 0.09);
        vec3 midColor  = vec3(0.16, 0.39, 0.18);
        vec3 tipColor  = vec3(0.58, 0.76, 0.26);

        vec3 baseCol = mix(rootColor, midColor, smoothstep(0.0, 0.55, vHeightPct));
        baseCol = mix(baseCol, tipColor, smoothstep(0.48, 1.0, vHeightPct));

        float gustHighlight = smoothstep(0.25, 1.15, vWindWave) * vHeightPct * 0.22;
        vec3 finalCol = (baseCol + vec3(gustHighlight * 1.15, gustHighlight * 1.05, 0.03)) * uSunIntensity;

        gl_FragColor = vec4(finalCol, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });

  const instancedGrass = new THREE.InstancedMesh(bladeGeo, grassMat, bladeCount);
  instancedGrass.frustumCulled = false;

  const dummy = new THREE.Object3D();
  let placed = 0;
  let seed = 1337;
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  while (placed < bladeCount) {
    const angle = nextRand() * Math.PI * 2;
    const radius = 4.8 + Math.pow(nextRand(), 0.76) * 74;
    const gx = Math.cos(angle) * radius;
    const gz = Math.sin(angle) * radius;

    if (Math.abs(gx) < 3.4 && gz > -44 && gz < 30) continue;
    if (Math.abs(gz) < 3.2 && Math.abs(gx) < 42) continue;
    if (Math.hypot(gx, gz + 48) < 12.4) continue;
    const riverZ = -3.5 + Math.sin(gx * 0.09) * 3.4;
    if (Math.abs(gz - riverZ) < 4.2) continue;

    let insideMonument = false;
    for (const stop of PORTFOLIO_STOPS) {
      if (Math.hypot(gx - stop.position.x, gz - stop.position.z) < 6.3) {
        insideMonument = true;
        break;
      }
    }
    if (insideMonument) continue;

    const gy = groundHeightAt(gx, gz);
    dummy.position.set(gx, gy - 0.03, gz);
    dummy.rotation.set(
      (nextRand() - 0.5) * 0.14,
      nextRand() * Math.PI * 2,
      (nextRand() - 0.5) * 0.14
    );
    const scaleH = 0.65 + nextRand() * 0.72;
    dummy.scale.set(0.85 + nextRand() * 0.35, scaleH, 0.85 + nextRand() * 0.35);
    dummy.updateMatrix();
    instancedGrass.setMatrixAt(placed, dummy.matrix);
    placed++;
  }
  instancedGrass.instanceMatrix.needsUpdate = true;

  return { mesh: instancedGrass, uniforms: grassUniforms };
}

/**
 * Builds Stylized Zelda Water & Shoreline Foam Shader for the winding Saraswati River
 */
function createZeldaRiverWater(): {
  mesh: THREE.Mesh;
  uniforms: { uTime: { value: number } };
} {
  const riverGeo = new THREE.PlaneGeometry(240, 8.8, 120, 12);
  riverGeo.rotateX(-Math.PI / 2);
  const posAttr = riverGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const rx = posAttr.getX(i);
    const rz = posAttr.getZ(i);
    const curveZ = -3.5 + Math.sin(rx * 0.09) * 3.4;
    posAttr.setZ(i, rz + curveZ);
    posAttr.setY(i, -0.16);
  }
  riverGeo.computeVertexNormals();

  const waterUniforms = {
    uTime: { value: 0 },
  };

  const waterMat = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    transparent: true,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      void main() {
        vUv = uv;
        vec3 pos = position;
        pos.y += sin(pos.x * 0.45 + uTime * 2.2) * 0.035 + cos(pos.z * 0.8 + uTime * 1.8) * 0.025;
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      void main() {
        vec3 deepWater = vec3(0.05, 0.42, 0.56);
        vec3 shallowTurquoise = vec3(0.14, 0.72, 0.78);

        float edgeDist = min(vUv.y, 1.0 - vUv.y);
        vec3 waterCol = mix(shallowTurquoise, deepWater, smoothstep(0.0, 0.38, edgeDist));

        float ripple1 = sin(vWorldPos.x * 0.9 - uTime * 2.6 + sin(vWorldPos.z * 1.2) * 1.5);
        float ripple2 = cos(vWorldPos.x * 1.4 + vWorldPos.z * 1.1 + uTime * 1.9);
        float specBand = smoothstep(0.76, 0.92, (ripple1 + ripple2) * 0.5);

        float foamWave = smoothstep(0.11, 0.02, edgeDist + 0.025 * sin(vWorldPos.x * 1.8 + uTime * 3.0));

        vec3 finalCol = waterCol + vec3(0.75, 0.94, 0.98) * specBand * 0.38 + vec3(0.95, 0.98, 1.0) * foamWave * 0.65;
        gl_FragColor = vec4(finalCol, 0.86);
      }
    `,
  });

  const mesh = new THREE.Mesh(riverGeo, waterMat);
  mesh.receiveShadow = true;
  return { mesh, uniforms: waterUniforms };
}

function createParticlePool(maxParticles = 140): ParticleBurstPool {
  const geo = new THREE.SphereGeometry(0.082, 12, 10);
  const mat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const mesh = new THREE.InstancedMesh(geo, mat, maxParticles);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const positions = new Float32Array(maxParticles * 3);
  const velocities = new Float32Array(maxParticles * 3);
  const ages = new Float32Array(maxParticles);
  const lifetimes = new Float32Array(maxParticles);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < maxParticles; i++) {
    ages[i] = 999;
    lifetimes[i] = 1;
    dummy.position.set(0, -100, 0);
    dummy.scale.setScalar(0.001);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;

  let cursor = 0;

  return {
    mesh,
    spawnBurst(x: number, y: number, z: number, count = 12, isGold = false) {
      for (let c = 0; c < count; c++) {
        const idx = cursor % maxParticles;
        cursor++;
        const i3 = idx * 3;
        positions[i3] = x + (Math.random() - 0.5) * 0.5;
        positions[i3 + 1] = y + 0.1 + Math.random() * 0.25;
        positions[i3 + 2] = z + (Math.random() - 0.5) * 0.5;

        const angle = Math.random() * Math.PI * 2;
        const speed = (isGold ? 2.8 : 1.5) + Math.random() * 2.5;
        velocities[i3] = Math.cos(angle) * speed;
        velocities[i3 + 1] = (isGold ? 3.0 : 1.6) + Math.random() * 2.3;
        velocities[i3 + 2] = Math.sin(angle) * speed;

        ages[idx] = 0;
        lifetimes[idx] = isGold ? 0.72 + Math.random() * 0.35 : 0.45 + Math.random() * 0.25;
      }
    },
    update(dt: number) {
      let dirty = false;
      for (let i = 0; i < maxParticles; i++) {
        if (ages[i] >= lifetimes[i]) continue;
        ages[i] += dt;
        dirty = true;
        const i3 = i * 3;

        if (ages[i] >= lifetimes[i]) {
          dummy.position.set(0, -100, 0);
          dummy.scale.setScalar(0.001);
        } else {
          positions[i3] += velocities[i3] * dt;
          positions[i3 + 1] += velocities[i3 + 1] * dt;
          positions[i3 + 2] += velocities[i3 + 2] * dt;
          velocities[i3 + 1] -= 5.8 * dt;

          const t = 1 - ages[i] / lifetimes[i];
          dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
          dummy.rotation.y += 5 * dt;
          dummy.scale.setScalar(Math.max(0.01, t * 1.4));
        }
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      if (dirty) {
        mesh.instanceMatrix.needsUpdate = true;
      }
    },
  };
}

export function buildAncientWorldScene(
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean
): AncientWorldScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c192c);
  scene.fog = new THREE.FogExp2(0x162438, 0.0034);

  const sandstoneTex = createSandstoneTexture();
  const flagstoneTex = createFlagstoneRoadTexture();
  const terrainTex = createTerrainMosaicTexture();

  const maxAniso = renderer.capabilities?.getMaxAnisotropy
    ? Math.min(16, renderer.capabilities.getMaxAnisotropy())
    : 8;
  sandstoneTex.anisotropy = maxAniso;
  flagstoneTex.anisotropy = maxAniso;
  terrainTex.anisotropy = maxAniso;

  const stoneMat = new THREE.MeshPhysicalMaterial({
    map: sandstoneTex,
    bumpMap: sandstoneTex,
    bumpScale: 0.036,
    roughness: 0.48,
    metalness: 0.16,
    clearcoat: 0.28,
    clearcoatRoughness: 0.35,
  });
  const darkStoneMat = new THREE.MeshPhysicalMaterial({
    color: 0x261c18,
    bumpMap: sandstoneTex,
    bumpScale: 0.032,
    roughness: 0.52,
    metalness: 0.28,
    clearcoat: 0.35,
    clearcoatRoughness: 0.28,
  });
  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xe5c158,
    roughness: 0.14,
    metalness: 0.96,
    emissive: 0x78350f,
    emissiveIntensity: 0.32,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    reflectivity: 1.0,
  });
  const monumentWaterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0d9488,
    roughness: 0.06,
    metalness: 0.72,
    emissive: 0x0f766e,
    emissiveIntensity: 0.36,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    ior: 1.333,
  });

  // 1. Custom GLSL Rayleigh/Mie Golden-Hour Atmospheric Sky Dome + Painterly Cloud Shader
  const skyUniforms = {
    uTime: { value: 0 },
    uZenithColor: { value: new THREE.Color(0x0b1528) },
    uMidSkyColor: { value: new THREE.Color(0x1e3a5f) },
    uHorizonColor: { value: new THREE.Color(0xd97706) },
    uSunColor: { value: new THREE.Color(0xfef08a) },
    uSunDir: { value: new THREE.Vector3(0.0, 0.26, -0.96).normalize() },
  };

  const skyGeo = new THREE.SphereGeometry(250, 48, 32);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vWorldDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uZenithColor;
      uniform vec3 uMidSkyColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      varying vec3 vWorldDir;

      float hash2(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise2(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash2(i + vec2(0.0, 0.0)), hash2(i + vec2(1.0, 0.0)), u.x),
          mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise2(p);
          p *= 2.04;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float elev = clamp(dir.y, 0.0, 1.0);

        vec3 sky = mix(uHorizonColor, uMidSkyColor, smoothstep(0.0, 0.28, elev));
        sky = mix(sky, uZenithColor, smoothstep(0.22, 0.85, elev));

        // Mie solar corona & golden atmospheric halo
        float sunCos = max(dot(dir, normalize(uSunDir)), 0.0);
        float sunHalo = pow(sunCos, 8.0) * 0.48 + pow(sunCos, 64.0) * 0.85;
        float sunDisc = smoothstep(0.9965, 0.9992, sunCos);
        sky += uSunColor * (sunHalo + sunDisc * 1.8);

        // High-altitude painterly cirrus & dusk clouds
        if (dir.y > 0.03) {
          vec2 uv = dir.xz / (dir.y + 0.18) * 1.45 + vec2(uTime * 0.012, -uTime * 0.006);
          float cNoise = fbm(uv);
          float cloudMask = smoothstep(0.48, 0.78, cNoise) * smoothstep(0.03, 0.22, dir.y) * (1.0 - smoothstep(0.65, 0.95, dir.y));
          vec3 cloudCol = mix(uMidSkyColor * 1.35, uSunColor, 0.45 + 0.45 * pow(sunCos, 3.0));
          sky = mix(sky, cloudCol, cloudMask * 0.68);
        }

        gl_FragColor = vec4(sky, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  // 2. High-Contrast Cinematic Lighting Rig (Warm Golden Key Light vs Deep Indigo Rim/Ambient)
  const hemiLight = new THREE.HemisphereLight(0xffdfa8, 0x122238, 1.25);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffd28a, 2.85);
  dirLight.position.set(28, 46, -54);
  if (!isSoftwareGl) {
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 2;
    dirLight.shadow.camera.far = 180;
    const d = 75;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
  }
  scene.add(dirLight);

  // 3. Vast 320m x 320m Solid Walkable Valley & Climbable Himalayan Mountain Terrain Mesh
  const terrainGeo = new THREE.PlaneGeometry(320, 320, 192, 192);
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position;
  const terrainColors = new Float32Array(posAttr.count * 3);
  const colValley = new THREE.Color(0xffffff);
  const colGranite = new THREE.Color(0x526074);
  const colSnowPeak = new THREE.Color(0xe2e8f0);
  const colTmp = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    const vy = groundHeightAt(vx, vz);
    posAttr.setY(i, vy);

    if (vy <= 2.4) {
      colTmp.copy(colValley);
    } else if (vy <= 12.5) {
      const t = (vy - 2.4) / 10.1;
      colTmp.copy(colValley).lerp(colGranite, t);
    } else {
      const t = Math.min(1, (vy - 12.5) / 11.5);
      colTmp.copy(colGranite).lerp(colSnowPeak, t);
    }
    terrainColors[i * 3] = colTmp.r;
    terrainColors[i * 3 + 1] = colTmp.g;
    terrainColors[i * 3 + 2] = colTmp.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(terrainColors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    map: terrainTex,
    bumpMap: terrainTex,
    bumpScale: 0.032,
    vertexColors: true,
    roughness: 0.84,
    metalness: 0.06,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  // 4. Slender Wind-Swept Botanical Grass Shader Field + Instanced Golden Marigold & Lotus Wildflowers
  const windGrass = createZeldaWindGrassField(isSoftwareGl);
  scene.add(windGrass.mesh);

  const flowerCount = isSoftwareGl ? 380 : 1100;
  const flowerGeo = new THREE.SphereGeometry(0.11, 14, 10);
  flowerGeo.scale(1.25, 0.55, 1.25);
  const flowerMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.45,
    roughness: 0.35,
  });
  const flowerMesh = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
  const flDummy = new THREE.Object3D();
  const flColor = new THREE.Color();
  for (let f = 0; f < flowerCount; f++) {
    const fa = ((f * 137.5) % 360) * (Math.PI / 180);
    const fr = 6.2 + ((f * 29) % 62);
    const fx = Math.cos(fa) * fr;
    const fz = Math.sin(fa) * fr;
    if (Math.abs(fx) < 4.2 && fz > -44 && fz < 26) continue;
    const fy = groundHeightAt(fx, fz) + 0.24 + (f % 3) * 0.08;
    flDummy.position.set(fx, fy, fz);
    flDummy.rotation.set(0.1, f * 0.7, 0.1);
    flDummy.scale.setScalar(0.75 + (f % 4) * 0.22);
    flDummy.updateMatrix();
    flowerMesh.setMatrixAt(f, flDummy.matrix);
    flColor.setHex(f % 3 === 0 ? 0xf43f5e : f % 2 === 0 ? 0xfbbf24 : 0xf97316);
    flowerMesh.setColorAt(f, flColor);
  }
  flowerMesh.instanceMatrix.needsUpdate = true;
  if (flowerMesh.instanceColor) flowerMesh.instanceColor.needsUpdate = true;
  scene.add(flowerMesh);

  // Smoothly Sculpted Mossy Temple Ruin Outcrops & Beveled Carved Stele Stones (Welded vertices + smooth normals!)
  const rawRockGeo = new THREE.SphereGeometry(0.84, 36, 28);
  const rPos = rawRockGeo.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    const rx = rPos.getX(i);
    const ry = rPos.getY(i);
    const rz = rPos.getZ(i);
    const jag =
      1 +
      0.18 * Math.sin(rx * 3.8 + rz * 3.1) * Math.cos(ry * 2.8) -
      0.12 * Math.cos(ry * 4.2 - rx * 2.5);
    rPos.setXYZ(i, rx * jag * 1.25, Math.max(-0.25, ry * jag * 0.65), rz * jag * 0.96);
  }
  const craggyRockGeo = BufferGeometryUtils.mergeVertices(rawRockGeo, 1e-3);
  craggyRockGeo.computeVertexNormals();

  const mossyGraniteMat = new THREE.MeshPhysicalMaterial({
    color: 0x3f4d42,
    bumpMap: sandstoneTex,
    bumpScale: 0.042,
    roughness: 0.78,
    metalness: 0.1,
    clearcoat: 0.24,
    clearcoatRoughness: 0.45,
    flatShading: false,
  });

  const boulderCoords = [
    [-8.5, 4.2, 1.0], [8.8, 3.8, 1.05], [-9.4, -8.5, 1.15], [9.6, -9.2, 1.1],
    [-16.5, -14.0, 1.4], [16.8, -14.5, 1.35], [-14.2, 14.5, 1.25], [14.8, 14.2, 1.2],
    [-28.0, -12.0, 1.6], [28.5, -12.0, 1.55], [-11.5, -34.0, 1.3], [11.5, -34.0, 1.3],
  ];
  for (const [bx, bz, bs] of boulderCoords) {
    const by = groundHeightAt(bx, bz);
    const rockGrp = new THREE.Group();
    rockGrp.position.set(bx, by, bz);
    const mainRock = new THREE.Mesh(craggyRockGeo, mossyGraniteMat);
    mainRock.scale.setScalar(bs);
    mainRock.position.y = 0.18 * bs;
    mainRock.rotation.set(0.08, bx * 0.4, -0.06);
    mainRock.castShadow = true;
    mainRock.receiveShadow = true;

    // Carved Ancient Ruin Stele Tablet with Beveled Edges leaning beside the outcrop
    const steleSlab = new THREE.Mesh(
      new RoundedBoxGeometry(0.46 * bs, 0.95 * bs, 0.18 * bs, 4, 0.035 * bs),
      stoneMat
    );
    steleSlab.position.set(0.52 * bs, 0.42 * bs, 0.22 * bs);
    steleSlab.rotation.set(0.18, -0.35, 0.22);
    steleSlab.castShadow = true;
    rockGrp.add(mainRock, steleSlab);
    scene.add(rockGrp);
  }

  // 5. Winding Saraswati River with Custom Water & Foam Shader + Carved Basalt-Gold Bridge + Sacred Lotus Pads
  const zeldaRiver = createZeldaRiverWater();
  scene.add(zeldaRiver.mesh);

  const lilyPadMat = new THREE.MeshPhysicalMaterial({
    color: 0x14532d,
    roughness: 0.48,
    metalness: 0.08,
    clearcoat: 0.5,
  });
  const padmaPetalMat = new THREE.MeshPhysicalMaterial({
    color: 0xf472b6,
    emissive: 0xe11d48,
    emissiveIntensity: 0.55,
    roughness: 0.24,
    clearcoat: 0.85,
  });
  const riverLotusCoords = [
    [-18, -4.2], [-14, -2.1], [-9, -4.8], [8, -2.2], [13, -4.6], [19, -2.4], [26, -4.1], [-25, -2.8],
  ];
  for (const [lx, lz] of riverLotusCoords) {
    const padGrp = new THREE.Group();
    const curveZ = -3.5 + Math.sin(lx * 0.09) * 3.4 + (lz + 3.5) * 0.45;
    padGrp.position.set(lx, -0.13, curveZ);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.024, 32), lilyPadMat);
    const flower = createSculptedLotusBlossom(padmaPetalMat, goldMat, 0.34);
    flower.position.y = 0.06;
    padGrp.add(pad, flower);
    scene.add(padGrp);
  }

  // Royal Basalt & Gold Temple Bridge at (0, 0, -3.5)
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(0, 0, -3.5);
  const bridgeDeck = new THREE.Mesh(
    new RoundedBoxGeometry(5.6, 0.28, 8.8, 5, 0.05),
    darkStoneMat
  );
  bridgeDeck.position.y = 0.06;
  bridgeDeck.receiveShadow = true;
  bridgeGroup.add(bridgeDeck);

  for (const sideX of [-2.55, 2.55]) {
    const balustrade = new THREE.Mesh(
      new RoundedBoxGeometry(0.32, 0.58, 8.8, 4, 0.045),
      stoneMat
    );
    balustrade.position.set(sideX, 0.4, 0);
    bridgeGroup.add(balustrade);
    const railGold = new THREE.Mesh(
      new RoundedBoxGeometry(0.36, 0.08, 8.9, 4, 0.025),
      goldMat
    );
    railGold.position.set(sideX, 0.72, 0);
    bridgeGroup.add(railGold);
    for (const postZ of [-4.1, -1.4, 1.4, 4.1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.12, 28), darkStoneMat);
      post.position.set(sideX, 0.6, postZ);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 18), goldMat);
      finial.position.set(sideX, 1.26, postZ);
      bridgeGroup.add(post, finial);
    }
  }
  scene.add(bridgeGroup);

  // Dark Basalt & Gold-Inlaid Temple Causeway (polygonOffset prevents any ground Z-fighting)
  const pathMat = new THREE.MeshPhysicalMaterial({
    map: flagstoneTex,
    bumpMap: flagstoneTex,
    bumpScale: 0.035,
    roughness: 0.44,
    metalness: 0.26,
    clearcoat: 0.3,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const nsPathGeo = new THREE.PlaneGeometry(4.6, 98, 12, 80);
  nsPathGeo.rotateX(-Math.PI / 2);
  const nsPos = nsPathGeo.attributes.position;
  for (let i = 0; i < nsPos.count; i++) {
    const px = nsPos.getX(i);
    const pz = nsPos.getZ(i) - 10;
    nsPos.setZ(i, pz);
    nsPos.setY(i, groundHeightAt(px, pz) + 0.042);
  }
  nsPathGeo.computeVertexNormals();
  const nsPath = new THREE.Mesh(nsPathGeo, pathMat);
  nsPath.receiveShadow = true;
  scene.add(nsPath);

  // Carved Deepastambha Stone Lanterns lining the Royal Avenue
  const lanternCoords = [
    [-3.2, 16], [3.2, 16],
    [-3.2, 2], [3.2, 2],
    [-3.2, -9], [3.2, -9],
    [-3.2, -19], [3.2, -19],
    [-3.2, -35], [3.2, -35],
  ];
  const lanternFlames: THREE.Mesh[] = [];
  const lanternFlameMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  const lanternFlameGeo = createSculptedFlameGeometry(0.13, 0.32);
  const shortLathePillar = createHoysalaLathePillarGeometry(1.45);
  for (const [lx, lz] of lanternCoords) {
    const ly = groundHeightAt(lx, lz);
    const lGrp = new THREE.Group();
    lGrp.position.set(lx, ly, lz);
    const base = new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.34, 0.58, 4, 0.04), darkStoneMat);
    base.position.y = 0.17;
    const shaft = new THREE.Mesh(shortLathePillar, stoneMat);
    shaft.scale.set(0.52, 1, 0.52);
    shaft.position.y = 1.04;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.36, 32), goldMat);
    cap.position.y = 2.08;
    const flame = new THREE.Mesh(lanternFlameGeo, lanternFlameMat);
    flame.position.y = 1.72;
    lGrp.add(base, shaft, cap, flame);
    scene.add(lGrp);
    lanternFlames.push(flame);
  }

  // Atmospheric Instanced Golden Prana Fireflies & Falling Blossom Petals
  const fireflyCount = isSoftwareGl ? 48 : 130;
  const fireflyGeo = new THREE.SphereGeometry(0.062, 12, 10);
  const fireflyMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.88,
  });
  const fireflyMesh = new THREE.InstancedMesh(fireflyGeo, fireflyMat, fireflyCount);
  fireflyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  fireflyMesh.frustumCulled = false;
  const fireflySeeds: { x: number; y: number; z: number; phase: number; speed: number }[] = [];
  const ffDummy = new THREE.Object3D();
  for (let i = 0; i < fireflyCount; i++) {
    const a = (i / fireflyCount) * Math.PI * 2 * 3.7;
    const r = 3.5 + ((i * 19) % 54);
    const fx = Math.cos(a) * r;
    const fz = Math.sin(a) * r - 6;
    const fy = groundHeightAt(fx, fz) + 1.0 + (i % 6) * 0.65;
    fireflySeeds.push({ x: fx, y: fy, z: fz, phase: i * 0.73, speed: 0.85 + (i % 4) * 0.25 });
    ffDummy.position.set(fx, fy, fz);
    ffDummy.updateMatrix();
    fireflyMesh.setMatrixAt(i, ffDummy.matrix);
  }
  fireflyMesh.instanceMatrix.needsUpdate = true;
  scene.add(fireflyMesh);

  // 6. Wide Open Great Plateau Lookout Braziers at (±9.5, 6.2)
  const cameraBlockers: THREE.Object3D[] = [terrainMesh];
  const tallLathePillar = createHoysalaLathePillarGeometry(5.2);
  const lookoutFlameGeo = createSculptedFlameGeometry(0.52, 1.25);
  for (const side of [-1, 1]) {
    const obeliskGroup = new THREE.Group();
    const ox = side * 9.5;
    const oz = 6.2;
    obeliskGroup.position.set(ox, groundHeightAt(ox, oz), oz);

    const plinth = new THREE.Mesh(
      new RoundedBoxGeometry(2.4, 1.2, 2.4, 5, 0.08),
      darkStoneMat
    );
    plinth.position.y = 0.6;
    obeliskGroup.add(plinth);

    const column = new THREE.Mesh(tallLathePillar, stoneMat);
    column.scale.set(1.35, 1, 1.35);
    column.position.y = 3.6;
    column.castShadow = true;
    obeliskGroup.add(column);

    const brazierBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.45, 0.55, 36), goldMat);
    brazierBowl.position.y = 6.45;
    obeliskGroup.add(brazierBowl);

    const flame = new THREE.Mesh(
      lookoutFlameGeo,
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
    );
    flame.position.y = 6.65;
    obeliskGroup.add(flame);

    scene.add(obeliskGroup);
  }

  // Ornate Carved Sanchi / Hampi Royal Torana Gateway at (0, -12.5) with Swaying Silk Banners & Sculpted Capitals
  const toranaGroup = new THREE.Group();
  toranaGroup.position.set(0, groundHeightAt(0, -12.5), -12.5);
  const toranaPillarGeo = createHoysalaLathePillarGeometry(6.2);
  const silkBannerMat = new THREE.MeshPhysicalMaterial({
    color: 0x9f1239,
    emissive: 0x4c0519,
    emissiveIntensity: 0.35,
    roughness: 0.38,
    sheen: 0.85,
    sheenColor: new THREE.Color(0xfbbf24),
    side: THREE.DoubleSide,
  });
  const silkBanners: THREE.Mesh[] = [];

  for (const side of [-1, 1]) {
    const basePlinth = new THREE.Mesh(
      new RoundedBoxGeometry(1.4, 0.9, 1.4, 5, 0.065),
      darkStoneMat
    );
    basePlinth.position.set(side * 4.3, 0.45, 0);
    const post = new THREE.Mesh(toranaPillarGeo, stoneMat);
    post.scale.set(1.25, 1, 1.25);
    post.position.set(side * 4.3, 3.6, 0);
    post.castShadow = true;
    const capitalLotus = createSculptedLotusBlossom(goldMat, stoneMat, 0.72);
    capitalLotus.position.set(side * 4.3, 6.82, 0);

    // Hanging Crimson-Gold Temple Silk Banner
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 3.2, 8, 16), silkBannerMat);
    banner.position.set(side * 3.55, 3.6, 0.25);
    silkBanners.push(banner);

    toranaGroup.add(basePlinth, post, capitalLotus, banner);
  }

  // 3 Curved Sanchi Architrave Beams with Scroll Volute Ends
  for (let b = 0; b < 3; b++) {
    const by = 5.45 + b * 0.72;
    const bw = 11.2 - b * 0.6;
    const archBeam = new THREE.Mesh(
      new RoundedBoxGeometry(bw, 0.34, 0.78, 4, 0.045),
      b === 1 ? goldMat : stoneMat
    );
    archBeam.position.set(0, by, 0);
    archBeam.castShadow = true;
    const goldTrim = new THREE.Mesh(
      new RoundedBoxGeometry(bw + 0.2, 0.08, 0.84, 3, 0.025),
      goldMat
    );
    goldTrim.position.set(0, by + 0.19, 0);
    toranaGroup.add(archBeam, goldTrim);

    for (const endSide of [-1, 1]) {
      const volute = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.84, 32), goldMat);
      volute.rotation.x = Math.PI / 2;
      volute.position.set(endSide * (bw * 0.5 + 0.1), by, 0);
      toranaGroup.add(volute);
    }
  }

  // Traditional Carved Golden Kalasha Temple Finial atop the Grand Torana Gateway
  const toranaKalashaBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.45, 0.32, 32),
    goldMat
  );
  toranaKalashaBase.position.set(0, 7.62, 0);
  const toranaKalashaSpire = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.88, 32),
    goldMat
  );
  toranaKalashaSpire.position.set(0, 8.15, 0);
  toranaGroup.add(toranaKalashaBase, toranaKalashaSpire);
  scene.add(toranaGroup);

  // Northern Rakshasa Boss Arena Ring at (0, -48)
  const bossArenaGroup = new THREE.Group();
  const arenaY = groundHeightAt(0, -48);
  bossArenaGroup.position.set(0, arenaY, -48);
  const arenaFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(11.5, 12.2, 0.35, 64),
    darkStoneMat
  );
  arenaFloor.position.y = 0.17;
  arenaFloor.receiveShadow = true;
  bossArenaGroup.add(arenaFloor);

  const arenaRuneRing = new THREE.Mesh(
    new THREE.RingGeometry(9.8, 10.6, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0xe11d48,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.72,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  arenaRuneRing.position.y = 0.38;
  bossArenaGroup.add(arenaRuneRing);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    if (Math.sin(a) > 0.45) continue;
    const obelisk = new THREE.Mesh(tallLathePillar, darkStoneMat);
    obelisk.position.set(Math.cos(a) * 10.8, 2.5, Math.sin(a) * 10.8);
    bossArenaGroup.add(obelisk);
  }

  // 3D Hologram Sanctuary Seal at the Layoff Boss Arena ("Unlock fight after seeing all the projects")
  const bossLockHologramGroup = new THREE.Group();
  bossLockHologramGroup.position.set(0, 0.38, 2.2); // At (0, arenaY + 0.38, -45.8) right at the front of the Boss Arena
  bossArenaGroup.add(bossLockHologramGroup);

  const holoCyanMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const holoGoldMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const holoBaseRing = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 2.85, 64).rotateX(-Math.PI / 2),
    holoCyanMat
  );
  holoBaseRing.position.y = 0.05;
  bossLockHologramGroup.add(holoBaseRing);

  const holoBeamCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 2.65, 5.2, 48, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  holoBeamCylinder.position.y = 2.6;
  bossLockHologramGroup.add(holoBeamCylinder);

  const holoGyroRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.045, 20, 64), holoGoldMat);
  holoGyroRing1.position.y = 2.65;
  const holoGyroRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.038, 20, 64), holoCyanMat);
  holoGyroRing2.position.y = 2.65;
  bossLockHologramGroup.add(holoGyroRing1, holoGyroRing2);

  // High-Resolution 3D Hologram Canvas Billboard ("Unlock fight after seeing all the projects")
  const holoCanvas = document.createElement('canvas');
  holoCanvas.width = 1024;
  holoCanvas.height = 384;
  const holoCtx = holoCanvas.getContext('2d')!;
  const holoTex = new THREE.CanvasTexture(holoCanvas);
  holoTex.colorSpace = THREE.SRGBColorSpace;

  let lastRenderedHoloProjects = -1;
  const redrawBossLockHologramCanvas = (visitedCount: number) => {
    if (visitedCount === lastRenderedHoloProjects) return;
    lastRenderedHoloProjects = visitedCount;

    holoCtx.clearRect(0, 0, 1024, 384);
    // Translucent Cyan-Obsidian Holographic Panel
    const bgGrad = holoCtx.createLinearGradient(0, 0, 0, 384);
    bgGrad.addColorStop(0, 'rgba(4, 22, 42, 0.92)');
    bgGrad.addColorStop(0.5, 'rgba(7, 36, 64, 0.95)');
    bgGrad.addColorStop(1, 'rgba(4, 18, 36, 0.92)');
    holoCtx.fillStyle = bgGrad;
    holoCtx.beginPath();
    holoCtx.roundRect(18, 18, 988, 348, 24);
    holoCtx.fill();

    // Holographic Scanlines
    holoCtx.fillStyle = 'rgba(56, 189, 248, 0.07)';
    for (let y = 24; y < 360; y += 8) {
      holoCtx.fillRect(24, y, 976, 3);
    }

    // Glowing Dual Border
    holoCtx.strokeStyle = '#38bdf8';
    holoCtx.lineWidth = 5;
    holoCtx.stroke();

    holoCtx.strokeStyle = 'rgba(254, 240, 138, 0.7)';
    holoCtx.lineWidth = 2;
    holoCtx.strokeRect(34, 34, 956, 316);

    // Header Badge
    holoCtx.textAlign = 'center';
    holoCtx.textBaseline = 'middle';
    holoCtx.font = '700 24px monospace';
    holoCtx.fillStyle = '#38bdf8';
    holoCtx.fillText('🔒 NORTHERN CITADEL HOLOGRAM · LAYOFF BOSS SEALED', 512, 82);

    // Main Required Message
    holoCtx.font = '800 36px sans-serif';
    holoCtx.fillStyle = '#fef08a';
    holoCtx.fillText('Unlock fight after seeing all the projects', 512, 168);

    // Subtitle & Progress Counter
    holoCtx.font = '700 20px monospace';
    holoCtx.fillStyle = '#e0f2fe';
    holoCtx.fillText(
      `PROJECTS SEEN: ${visitedCount} / 6   ·   VISIT ALL 6 SANCTUMS TO UNLOCK BOSS`,
      512,
      242
    );

    // Progress Bar
    const barX = 192;
    const barY = 286;
    const barW = 640;
    const barH = 26;
    holoCtx.fillStyle = 'rgba(2, 10, 22, 0.9)';
    holoCtx.fillRect(barX, barY, barW, barH);
    holoCtx.strokeStyle = '#38bdf8';
    holoCtx.lineWidth = 2;
    holoCtx.strokeRect(barX, barY, barW, barH);

    const fillW = Math.round((Math.min(6, Math.max(0, visitedCount)) / 6) * (barW - 8));
    if (fillW > 0) {
      const barGrad = holoCtx.createLinearGradient(barX, 0, barX + barW, 0);
      barGrad.addColorStop(0, '#0284c7');
      barGrad.addColorStop(0.5, '#38bdf8');
      barGrad.addColorStop(1, '#fef08a');
      holoCtx.fillStyle = barGrad;
      holoCtx.fillRect(barX + 4, barY + 4, fillW, barH - 8);
    }

    holoTex.needsUpdate = true;
  };
  redrawBossLockHologramCanvas(0);

  const holoBillboardSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: holoTex,
      transparent: true,
      depthWrite: false,
    })
  );
  holoBillboardSprite.scale.set(7.4, 2.78, 1);
  holoBillboardSprite.position.set(0, 3.35, 0);
  bossLockHologramGroup.add(holoBillboardSprite);

  function updateBossLockHologram(
    visitedCount: number,
    bossAwakened: boolean,
    bossDefeated: boolean,
    elapsed: number
  ) {
    const shouldShowHologram = visitedCount < 6 && !bossAwakened && !bossDefeated;
    bossLockHologramGroup.visible = shouldShowHologram;
    if (!shouldShowHologram) return;

    redrawBossLockHologramCanvas(visitedCount);
    holoBaseRing.rotation.z = elapsed * 0.85;
    holoGyroRing1.rotation.y = elapsed * 1.15;
    holoGyroRing1.rotation.x = Math.sin(elapsed * 1.4) * 0.35;
    holoGyroRing2.rotation.y = -elapsed * 1.45;
    holoGyroRing2.rotation.z = Math.cos(elapsed * 1.2) * 0.42;
    holoBillboardSprite.position.y = 3.35 + Math.sin(elapsed * 2.6) * 0.14;
  }

  scene.add(bossArenaGroup);

  // 7. Sculpted Multi-Branching Sacred Banyan & Golden Flame-of-the-Forest Trees (Smooth Welded Botanical Canopies!)
  const treeCoords = [
    { x: -13.5, z: -2, s: 1.45, golden: false },
    { x: 13.5, z: -2, s: 1.45, golden: true },
    { x: -22, z: -26, s: 1.55, golden: true },
    { x: 22, z: -26, s: 1.55, golden: false },
    { x: -30, z: 4, s: 1.35, golden: false },
    { x: 30, z: 4, s: 1.35, golden: true },
    { x: -24, z: 36, s: 1.5, golden: true },
    { x: 24, z: 36, s: 1.5, golden: false },
    { x: -52, z: -4, s: 1.75, golden: false },
    { x: 52, z: -4, s: 1.75, golden: true },
    { x: -48, z: -36, s: 1.65, golden: true },
    { x: 48, z: -36, s: 1.65, golden: false },
    { x: -48, z: 38, s: 1.65, golden: false },
    { x: 48, z: 38, s: 1.65, golden: true },
    { x: -18, z: -56, s: 1.6, golden: true },
    { x: 18, z: -56, s: 1.6, golden: false },
  ];

  const trunkMat = new THREE.MeshPhysicalMaterial({
    color: 0x3b2314,
    bumpMap: sandstoneTex,
    bumpScale: 0.04,
    roughness: 0.82,
    clearcoat: 0.15,
    flatShading: false,
  });
  const canopyDeepMat = new THREE.MeshPhysicalMaterial({
    color: 0x143820,
    roughness: 0.72,
    metalness: 0.04,
    sheen: 0.55,
    sheenColor: new THREE.Color(0x34d399),
    clearcoat: 0.22,
    flatShading: false,
  });
  const canopyJadeMat = new THREE.MeshPhysicalMaterial({
    color: 0x245e32,
    emissive: 0x0c2914,
    emissiveIntensity: 0.16,
    roughness: 0.68,
    metalness: 0.04,
    sheen: 0.65,
    sheenColor: new THREE.Color(0x86efac),
    clearcoat: 0.28,
    flatShading: false,
  });
  const blossomGoldMat = new THREE.MeshPhysicalMaterial({
    color: 0xd97706,
    emissive: 0x92400e,
    emissiveIntensity: 0.28,
    roughness: 0.62,
    metalness: 0.06,
    sheen: 0.75,
    sheenColor: new THREE.Color(0xfef08a),
    clearcoat: 0.35,
    flatShading: false,
  });
  const blossomCrimsonMat = new THREE.MeshPhysicalMaterial({
    color: 0xbe123c,
    emissive: 0x881337,
    emissiveIntensity: 0.26,
    roughness: 0.62,
    metalness: 0.06,
    sheen: 0.75,
    sheenColor: new THREE.Color(0xfda4af),
    clearcoat: 0.35,
    flatShading: false,
  });

  // Smoothly Sculpted Botanical Foliage Cloud Cluster (Indexed High-Resolution Sphere + Vertex Welding for Silky Normals!)
  const rawFrondGeo = new THREE.SphereGeometry(0.86, 42, 32);
  const fPos = rawFrondGeo.attributes.position;
  for (let i = 0; i < fPos.count; i++) {
    const fx = fPos.getX(i);
    const fy = fPos.getY(i);
    const fz = fPos.getZ(i);
    const lobe =
      1 +
      0.21 * Math.sin(fx * 4.2 + fz * 3.6) * Math.cos(fy * 3.8) +
      0.12 * Math.cos(fx * 6.4 - fy * 4.8);
    fPos.setXYZ(i, fx * lobe * 1.28, fy * lobe * 0.68, fz * lobe * 1.18);
  }
  const frondGeo = BufferGeometryUtils.mergeVertices(rawFrondGeo, 1e-3);
  frondGeo.computeVertexNormals();

  for (let tIdx = 0; tIdx < treeCoords.length; tIdx++) {
    const tc = treeCoords[tIdx];
    const ty = groundHeightAt(tc.x, tc.z);
    const treeGrp = new THREE.Group();
    treeGrp.position.set(tc.x, ty, tc.z);
    treeGrp.scale.setScalar(tc.s);
    treeGrp.rotation.y = tIdx * 1.1;

    // Gnarled curving main trunk via CatmullRomCurve3 + high-segment TubeGeometry
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.1, 0),
      new THREE.Vector3(0.14, 1.0, -0.08),
      new THREE.Vector3(-0.1, 2.1, 0.12),
      new THREE.Vector3(0.05, 3.1, 0.0),
    ]);
    const trunkMesh = new THREE.Mesh(
      new THREE.TubeGeometry(trunkCurve, 28, 0.36, 18, false),
      trunkMat
    );
    trunkMesh.castShadow = true;
    treeGrp.add(trunkMesh);

    // Flared Root Buttresses + Hanging Aerial Banyan Roots
    for (let b = 0; b < 5; b++) {
      const ba = (b / 5) * Math.PI * 2;
      const bx = Math.cos(ba);
      const bz = Math.sin(ba);

      // Spreading Bough
      const boughCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 2.5, 0),
        new THREE.Vector3(bx * 1.15, 3.25 + (b % 2) * 0.25, bz * 1.15),
        new THREE.Vector3(bx * 2.25, 3.65 + (b % 3) * 0.22, bz * 2.25),
      ]);
      const bough = new THREE.Mesh(
        new THREE.TubeGeometry(boughCurve, 20, 0.16, 14, false),
        trunkMat
      );
      bough.castShadow = true;
      treeGrp.add(bough);

      // Hanging Banyan Aerial Prop Root
      const aerialRoot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.055, 3.4, 16),
        trunkMat
      );
      aerialRoot.position.set(bx * 1.55, 1.7, bz * 1.55);
      aerialRoot.rotation.set(bz * 0.06, 0, -bx * 0.06);
      treeGrp.add(aerialRoot);

      // Layered Botanical Foliage Cloud Clusters along each bough
      for (let layer = 0; layer < 3; layer++) {
        const dist = 1.2 + layer * 0.65;
        const leafMat =
          tc.golden && layer === 2
            ? blossomGoldMat
            : !tc.golden && layer === 2 && b % 2 === 0
            ? blossomCrimsonMat
            : layer === 1
            ? canopyJadeMat
            : canopyDeepMat;
        const frond = new THREE.Mesh(frondGeo, leafMat);
        frond.position.set(
          bx * dist + (layer - 1) * 0.28,
          3.35 + layer * 0.38 + (b % 2) * 0.18,
          bz * dist - (layer - 1) * 0.24
        );
        frond.rotation.set(
          Math.sin(b + layer) * 0.22,
          ba + layer * 0.8,
          Math.cos(b - layer) * 0.18
        );
        const s = 1.15 - layer * 0.16;
        frond.scale.set(s * 1.2, s * 0.85, s * 1.15);
        frond.castShadow = true;
        treeGrp.add(frond);
      }
    }

    // Central Crown Canopy Cluster
    for (let top = 0; top < 4; top++) {
      const ta = (top / 4) * Math.PI * 2;
      const crownFrond = new THREE.Mesh(
        frondGeo,
        tc.golden ? (top % 2 === 0 ? blossomGoldMat : canopyJadeMat) : canopyJadeMat
      );
      crownFrond.position.set(Math.cos(ta) * 0.55, 4.25 + top * 0.16, Math.sin(ta) * 0.55);
      crownFrond.rotation.set(0.12, ta, -0.1);
      crownFrond.scale.set(1.25, 0.9, 1.25);
      crownFrond.castShadow = true;
      treeGrp.add(crownFrond);
    }

    scene.add(treeGrp);
  }

  // 8. Build the 6 Portfolio Project Monuments with Floating Scrolls & Grapple Anchors
  const monumentRigs = new Map<string, MonumentRig>();
  for (const stop of PORTFOLIO_STOPS) {
    const baseY = groundHeightAt(stop.position.x, stop.position.z);
    const built = createMonumentMesh(
      stop.monumentType,
      stop.accentColor,
      stoneMat,
      darkStoneMat,
      goldMat,
      monumentWaterMat,
      isSoftwareGl
    );
    built.group.position.set(stop.position.x, baseY, stop.position.z);
    scene.add(built.group);

    monumentRigs.set(stop.id, {
      id: stop.id,
      group: built.group,
      haloRing: built.haloRing,
      artifactMesh: built.artifactMesh,
      scrollPedestalMesh: built.scrollPedestalMesh,
      skyBeamMesh: built.skyBeamMesh,
      grappleAnchorPos: new THREE.Vector3(stop.position.x, baseY + 6.5, stop.position.z),
      pointLight: built.pointLight,
      baseY,
    });
  }

  // 9. Build the 5 Collectible Career Experience Lotus Relics (16-Petal Sculpted Padma Lotus Blossoms!)
  const relicRigs = new Map<string, RelicRig>();
  const lotusMat = new THREE.MeshPhysicalMaterial({
    color: 0xc084fc,
    emissive: 0x9333ea,
    emissiveIntensity: 1.35,
    roughness: 0.12,
    metalness: 0.85,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    ior: 2.2,
  });

  for (const relic of LOTUS_RELICS) {
    const rGroup = new THREE.Group();
    const baseY = groundHeightAt(relic.position.x, relic.position.z);
    rGroup.position.set(relic.position.x, baseY, relic.position.z);

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.58, 0.45, 36), stoneMat);
    plinth.position.y = 0.225;
    rGroup.add(plinth);

    const gemGroup = new THREE.Group();
    gemGroup.position.y = 1.18;
    const lotusBlossom = createSculptedLotusBlossom(lotusMat, goldMat, 0.92);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.042, 20, 48), goldMat);
    halo.rotation.x = Math.PI / 2;
    gemGroup.add(lotusBlossom, halo);
    rGroup.add(gemGroup);

    scene.add(rGroup);
    relicRigs.set(relic.id, {
      id: relic.id,
      group: rGroup,
      mesh: gemGroup,
      baseY,
    });
  }

  // 9B. Build the 4 Sacred Weapon Forge Altars with Custom Bevel-Extruded Forged Weapons!
  const weaponForgeRigs = new Map<WeaponId, WeaponForgeRig>();
  for (const wf of FORGE_WEAPONS) {
    const wfGroup = new THREE.Group();
    const baseY = groundHeightAt(wf.position.x, wf.position.z);
    wfGroup.position.set(wf.position.x, baseY, wf.position.z);

    const accentCol = new THREE.Color(wf.colorHex);

    // Stepped Anvil Pedestal (Walkable 0.65m height)
    const stepBase = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.58, 0.34, 48), darkStoneMat);
    stepBase.position.y = 0.17;
    stepBase.receiveShadow = true;
    const anvilTop = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.32, 48), stoneMat);
    anvilTop.position.y = 0.49;
    anvilTop.receiveShadow = true;
    const goldTrim = new THREE.Mesh(
      new THREE.TorusGeometry(1.06, 0.05, 20, 48).rotateX(Math.PI / 2),
      goldMat
    );
    goldTrim.position.y = 0.65;
    wfGroup.add(stepBase, anvilTop, goldTrim);

    // Ground Mandala Halo Ring
    const wfHalo = new THREE.Mesh(
      new THREE.RingGeometry(1.62, 1.92, 64).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: accentCol,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.82,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    wfHalo.position.y = 0.06;
    wfGroup.add(wfHalo);

    // High-Poly Forged Display Weapon Mesh above the Forge
    const forgedWeapon = buildForgedDivineWeaponModel(wf.id, darkStoneMat, goldMat, silkBannerMat);
    const displayWeapon = forgedWeapon.root;
    displayWeapon.position.y = 1.95;
    wfGroup.add(displayWeapon);
    scene.add(wfGroup);

    weaponForgeRigs.set(wf.id, {
      id: wf.id,
      group: wfGroup,
      weaponMesh: displayWeapon,
      haloRing: wfHalo,
      baseY,
    });
  }

  // 10. Build 6 Roaming Asura Demons + Colossal September Layoff Boss
  const demons: DemonEntity[] = [];
  for (const dConf of INITIAL_DEMON_SPAWNS) {
    const demon = createDemonRig(dConf);
    scene.add(demon.group);
    demons.push(demon);
  }

  const layoffBoss = createLayoffBossRig();
  scene.add(layoffBoss.group);

  // Load `Xbot.glb` once and clone skeletal meshes into the 6 Corporate Asuras + Colossal Layoff Boss with two-tone Obsidian/Crimson PBR armor and hand-locked weapons
  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    'https://threejs.org/examples/models/gltf/Xbot.glb',
    (gltf) => {
      const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'idle') || gltf.animations[0];
      const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'walk') || gltf.animations[2] || idleClip;
      const runClip = THREE.AnimationClip.findByName(gltf.animations, 'run') || gltf.animations[1] || walkClip;

      for (const demon of demons) {
        const accentHex =
          INITIAL_DEMON_SPAWNS.find((c) => c.id === demon.id)?.colorHex ?? 0xdc2626;
        const cloned = SkeletonUtils.clone(gltf.scene);
        cloned.scale.setScalar(1.14);
        cloned.traverse((child) => {
          if (child.name === 'mixamorigRightHand' || /RightHand$/i.test(child.name)) {
            demon.rightHandBone = child;
          }
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.castShadow = true;
            m.receiveShadow = true;
            if (m.geometry) m.geometry.computeVertexNormals();
            const isJoints = /Joints/i.test(m.name);
            m.material = new THREE.MeshPhysicalMaterial({
              color: isJoints ? accentHex : 0x160b1e,
              emissive: new THREE.Color(accentHex),
              emissiveIntensity: isJoints ? 1.45 : 0.32,
              roughness: isJoints ? 0.14 : 0.22,
              metalness: 0.88,
              clearcoat: 0.95,
              clearcoatRoughness: 0.1,
              flatShading: false,
            });
          }
        });
        demon.bodyGroup.add(cloned);
        const mixer = new THREE.AnimationMixer(cloned);
        demon.mixer = mixer;
        if (idleClip) demon.actions.idle = mixer.clipAction(idleClip);
        if (walkClip) demon.actions.walk = mixer.clipAction(walkClip);
        if (runClip) demon.actions.run = mixer.clipAction(runClip);
        demon.actions.walk?.play();
        demon.activeClip = 'walk';
      }

      const bossClone = SkeletonUtils.clone(gltf.scene);
      bossClone.scale.setScalar(1.26);
      bossClone.traverse((child) => {
        if (child.name === 'mixamorigRightHand' || /RightHand$/i.test(child.name)) {
          layoffBoss.rightHandBone = child;
        } else if (child.name === 'mixamorigLeftHand' || /LeftHand$/i.test(child.name)) {
          layoffBoss.leftHandBone = child;
        }
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.castShadow = true;
          m.receiveShadow = true;
          if (m.geometry) m.geometry.computeVertexNormals();
          const isJoints = /Joints/i.test(m.name);
          m.material = new THREE.MeshPhysicalMaterial({
            color: isJoints ? 0xfbbf24 : 0x0d0414,
            emissive: new THREE.Color(isJoints ? 0xf59e0b : 0xe11d48),
            emissiveIntensity: isJoints ? 1.65 : 0.58,
            roughness: 0.15,
            metalness: 0.92,
            clearcoat: 1.0,
            clearcoatRoughness: 0.08,
            flatShading: false,
          });
        }
      });
      layoffBoss.bodyGroup.add(bossClone);
      const bossMixer = new THREE.AnimationMixer(bossClone);
      layoffBoss.mixer = bossMixer;
      if (walkClip) {
        const act = bossMixer.clipAction(walkClip);
        act.timeScale = 0.78;
        act.play();
      }
    },
    undefined,
    () => {}
  );

  // 10B. Build Colossal 3D Sky-to-Ground "Indra Vajra" Lightning Bolt Super-Power Rig
  const lightningBoltGroup = new THREE.Group();
  lightningBoltGroup.visible = false;
  scene.add(lightningBoltGroup);

  const boltPoints: THREE.Vector3[] = [];
  const boltSteps = 14;
  for (let i = 0; i <= boltSteps; i++) {
    const t = i / boltSteps;
    const by = (1 - t) * 42;
    const jitterX = i === 0 || i === boltSteps ? 0 : (Math.sin(i * 7.3) * 0.85 + Math.cos(i * 3.1) * 0.45);
    const jitterZ = i === 0 || i === boltSteps ? 0 : (Math.cos(i * 5.7) * 0.85 - Math.sin(i * 4.3) * 0.45);
    boltPoints.push(new THREE.Vector3(jitterX, by, jitterZ));
  }
  const mainBoltCurve = new THREE.CatmullRomCurve3(boltPoints);
  const boltCoreMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.98,
  });
  const boltAuraMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const boltGoldMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const mainBoltCore = new THREE.Mesh(
    new THREE.TubeGeometry(mainBoltCurve, 48, 0.22, 12, false),
    boltCoreMat
  );
  const mainBoltAura = new THREE.Mesh(
    new THREE.TubeGeometry(mainBoltCurve, 48, 0.56, 12, false),
    boltAuraMat
  );
  lightningBoltGroup.add(mainBoltCore, mainBoltAura);

  // 3 Jagged Branching Lightning Forks from the main sky bolt
  for (let f = 0; f < 3; f++) {
    const startIdx = 3 + f * 3;
    const origin = boltPoints[startIdx];
    const dirAngle = (f * Math.PI * 2) / 3 + 0.4;
    const forkCurve = new THREE.CatmullRomCurve3([
      origin.clone(),
      origin.clone().add(new THREE.Vector3(Math.cos(dirAngle) * 1.8, -3.2, Math.sin(dirAngle) * 1.8)),
      origin.clone().add(new THREE.Vector3(Math.cos(dirAngle + 0.3) * 3.4, -6.8, Math.sin(dirAngle + 0.3) * 3.4)),
      origin.clone().add(new THREE.Vector3(Math.cos(dirAngle - 0.2) * 4.8, -10.5, Math.sin(dirAngle - 0.2) * 4.8)),
    ]);
    const forkMesh = new THREE.Mesh(
      new THREE.TubeGeometry(forkCurve, 20, 0.11, 8, false),
      boltGoldMat
    );
    lightningBoltGroup.add(forkMesh);
  }

  const boltImpactRing = new THREE.Mesh(
    new THREE.RingGeometry(0.65, 3.8, 64).rotateX(-Math.PI / 2),
    boltGoldMat
  );
  boltImpactRing.position.y = 0.12;
  lightningBoltGroup.add(boltImpactRing);

  const boltSkyPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 2.2, 42, 32, 1, true),
    boltAuraMat
  );
  boltSkyPillar.position.y = 21;
  lightningBoltGroup.add(boltSkyPillar);

  let boltLight: THREE.PointLight | null = null;
  if (!isSoftwareGl) {
    boltLight = new THREE.PointLight(0x38bdf8, 0, 45);
    boltLight.position.set(0, 4.0, 0);
    lightningBoltGroup.add(boltLight);
  }

  let lightningBoltTimer = 0;
  function triggerLightningBoltVisual(targetX: number, targetY: number, targetZ: number) {
    lightningBoltGroup.position.set(targetX, targetY, targetZ);
    lightningBoltGroup.visible = true;
    lightningBoltTimer = 0.78;
    boltImpactRing.scale.setScalar(0.5);
    if (boltLight) boltLight.intensity = 18;
    particlePool.spawnBurst(targetX, targetY + 1.2, targetZ, 42, true);
  }

  // 11. Grounded Living World Companions & Wildlife (`RobotExpressive.glb`, `Fox.glb`, `Parrot.glb`, `Flamingo.glb`)
  const ambientMixers: THREE.AnimationMixer[] = [];
  const soaringBirds: { group: THREE.Group; radius: number; speed: number; phase: number; height: number }[] = [];
  const spiritFoxes: {
    group: THREE.Group;
    centerX: number;
    centerZ: number;
    radius: number;
    phase: number;
    footOffsetY: number;
  }[] = [];
  let hypoBotGroup: THREE.Group | null = null;

  // Place "Hypo" (`RobotExpressive.glb`) at the 05. Hypo AI Agent Sanctum (-22.5, 18.8) where he belongs!
  const hypoBaseX = -22.5;
  const hypoBaseZ = 18.8;
  const hypoFloorY = groundHeightAt(hypoBaseX, hypoBaseZ);
  const hypoPlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.82, 0.26, 36),
    darkStoneMat
  );
  hypoPlinth.position.set(hypoBaseX, hypoFloorY + 0.13, hypoBaseZ);
  hypoPlinth.receiveShadow = true;
  scene.add(hypoPlinth);

  const hypoHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 0.92, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0xec4899,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  hypoHalo.position.set(hypoBaseX, hypoFloorY + 0.04, hypoBaseZ);
  scene.add(hypoHalo);

  gltfLoader.load(
    'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    (gltf) => {
      const bot = gltf.scene;
      bot.scale.setScalar(0.36);
      bot.position.set(hypoBaseX, hypoFloorY + 0.26, hypoBaseZ);
      bot.rotation.y = 0.65;
      scene.add(bot);
      hypoBotGroup = bot as unknown as THREE.Group;

      const mixer = new THREE.AnimationMixer(bot);
      ambientMixers.push(mixer);
      const waveClip =
        THREE.AnimationClip.findByName(gltf.animations, 'Wave') ||
        THREE.AnimationClip.findByName(gltf.animations, 'Standing') ||
        gltf.animations[0];
      if (waveClip) {
        mixer.clipAction(waveClip).play();
      }
    },
    undefined,
    () => {}
  );

  // Load Golden Spirit Foxes (`Fox.glb`) on flat emerald meadows with exact ground contact & tangent heading!
  gltfLoader.load(
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb',
    (gltf) => {
      const foxCenters = [
        { x: -12.5, z: 5.5, r: 4.8, phase: 0 },
        { x: 12.5, z: -16.5, r: 5.2, phase: Math.PI },
      ];
      const walkClip =
        THREE.AnimationClip.findByName(gltf.animations, 'Walk') ||
        THREE.AnimationClip.findByName(gltf.animations, 'Survey') ||
        THREE.AnimationClip.findByName(gltf.animations, 'Run') ||
        gltf.animations[0];

      for (const fc of foxCenters) {
        const foxClone = SkeletonUtils.clone(gltf.scene) as THREE.Group;
        foxClone.scale.setScalar(0.017);

        const bbox = new THREE.Box3().setFromObject(foxClone);
        const footOffsetY = Number.isFinite(bbox.min.y) ? -bbox.min.y : 0;

        foxClone.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            if (m.geometry) m.geometry.computeVertexNormals();
            m.castShadow = true;
            if (m.material instanceof THREE.MeshStandardMaterial) {
              const mat = m.material.clone();
              mat.emissive = new THREE.Color(0xd97706);
              mat.emissiveIntensity = 0.28;
              mat.flatShading = false;
              m.material = mat;
            }
          }
        });
        scene.add(foxClone);
        spiritFoxes.push({
          group: foxClone,
          centerX: fc.x,
          centerZ: fc.z,
          radius: fc.r,
          phase: fc.phase,
          footOffsetY,
        });
        const mixer = new THREE.AnimationMixer(foxClone);
        ambientMixers.push(mixer);
        if (walkClip) {
          const act = mixer.clipAction(walkClip);
          act.timeScale = 1.05;
          act.play();
        }
      }
    },
    undefined,
    () => {}
  );

  // Load Soaring Birds (`Parrot.glb` & `Flamingo.glb`) wheeling across the sky with proper forward tangent facing
  ['Parrot.glb', 'Flamingo.glb'].forEach((file, idx) => {
    gltfLoader.load(
      `https://threejs.org/examples/models/gltf/${file}`,
      (gltf) => {
        for (let b = 0; b < 3; b++) {
          const bird = SkeletonUtils.clone(gltf.scene) as THREE.Group;
          bird.scale.setScalar(0.032);
          scene.add(bird);
          soaringBirds.push({
            group: bird,
            radius: 26 + b * 12 + idx * 8,
            speed: 0.26 + b * 0.05,
            phase: (b * Math.PI * 2) / 3 + idx * 1.2,
            height: 15 + b * 3.5 + idx * 2,
          });
          const mixer = new THREE.AnimationMixer(bird);
          ambientMixers.push(mixer);
          if (gltf.animations[0]) {
            const act = mixer.clipAction(gltf.animations[0]);
            act.timeScale = 1.15 + b * 0.12;
            act.play();
          }
        }
      },
      undefined,
      () => {}
    );
  });

  // 12. Shinobi Grapple Hook Energy Tether Line
  const grappleLineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -100, 0),
    new THREE.Vector3(0, -100, 0),
  ]);
  const grappleLineMat = new THREE.LineBasicMaterial({
    color: 0xfef08a,
    linewidth: 3,
  });
  const grappleLine = new THREE.Line(grappleLineGeo, grappleLineMat);
  grappleLine.visible = false;
  grappleLine.frustumCulled = false;
  scene.add(grappleLine);

  // 13. Player Character Rig & Particle Pool
  const playerRig = createPlayerCharacter();
  playerRig.group.position.set(0, groundHeightAt(0, 8.2), 8.2);
  playerRig.group.rotation.y = Math.PI;
  scene.add(playerRig.group);

  const particlePool = createParticlePool(isSoftwareGl ? 80 : 140);
  scene.add(particlePool.mesh);

  // 13B. Procedural Weather System Rig (Falling Petals, Solar Dust Motes & Low-Lying Valley Mist)
  const weatherRig = createProceduralWeatherRig(scene, 'dawn');

  // 14. Golden Prana Guidance Trail (18 Smooth Glowing Stepping Spheres/Drop Gems from Player to Tracked Objective)
  const trailNodes = 18;
  const trailGeo = new THREE.SphereGeometry(0.14, 16, 12);
  trailGeo.scale(1.15, 0.45, 1.65);
  const trailMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.85,
  });
  const guidanceTrailMesh = new THREE.InstancedMesh(trailGeo, trailMat, trailNodes);
  guidanceTrailMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  guidanceTrailMesh.frustumCulled = false;
  scene.add(guidanceTrailMesh);
  const trailDummy = new THREE.Object3D();

  function updateGuidanceTrail(
    active: boolean,
    playerX = 0,
    playerZ = 0,
    targetX = 0,
    targetZ = 0,
    colorHex = '#fbbf24',
    elapsed = 0
  ) {
    guidanceTrailMesh.visible = active;
    if (!active) return;
    trailMat.color.set(colorHex);
    const dx = targetX - playerX;
    const dz = targetZ - playerZ;
    const dist = Math.hypot(dx, dz);
    if (dist < 2.2) {
      guidanceTrailMesh.visible = false;
      return;
    }
    const dirYaw = Math.atan2(dx, dz);
    const maxSpan = Math.min(dist - 1.5, 34);

    for (let i = 0; i < trailNodes; i++) {
      const flowPct = ((i / trailNodes) + elapsed * 0.42) % 1.0;
      const d = 1.6 + flowPct * maxSpan;
      const nx = playerX + (dx / dist) * d;
      const nz = playerZ + (dz / dist) * d;
      const ny = groundHeightAt(nx, nz) + 0.24 + Math.sin(elapsed * 4.5 + i * 0.6) * 0.08;
      trailDummy.position.set(nx, ny, nz);
      trailDummy.rotation.set(0, dirYaw, 0);
      const fade = Math.sin(flowPct * Math.PI);
      trailDummy.scale.setScalar(Math.max(0.15, fade * 1.15));
      trailDummy.updateMatrix();
      guidanceTrailMesh.setMatrixAt(i, trailDummy.matrix);
    }
    guidanceTrailMesh.instanceMatrix.needsUpdate = true;
  }

  // Dynamic Shadow Frustum Following the Player for High-Resolution 2048x2048 Contact Shadows
  const sunOffset = new THREE.Vector3(24, 42, -38);
  function updateShadowCamera(playerX: number, playerZ: number) {
    if (isSoftwareGl) return;
    dirLight.position.set(playerX + sunOffset.x, sunOffset.y, playerZ + sunOffset.z);
    dirLight.target.position.set(playerX, 0, playerZ);
    dirLight.target.updateMatrixWorld();
  }

  if (!isSoftwareGl) {
    const shadowExtent = 34;
    dirLight.shadow.camera.left = -shadowExtent;
    dirLight.shadow.camera.right = shadowExtent;
    dirLight.shadow.camera.top = shadowExtent;
    dirLight.shadow.camera.bottom = -shadowExtent;
    dirLight.shadow.camera.near = 4;
    dirLight.shadow.camera.far = 115;
    dirLight.shadow.camera.updateProjectionMatrix();
    scene.add(dirLight.target);
  }

  function updateGrappleLine(
    active: boolean,
    startX = 0,
    startY = 0,
    startZ = 0,
    endX = 0,
    endY = 0,
    endZ = 0
  ) {
    grappleLine.visible = active;
    if (!active) return;
    const pos = grappleLine.geometry.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(0, startX, startY, startZ);
    pos.setXYZ(1, endX, endY, endZ);
    pos.needsUpdate = true;
  }

  function updatePlayerPowerVisuals(
    unlockedCount: number,
    colorHex: string,
    equippedWeaponId: WeaponId = 'weapon-nandaka'
  ) {
    playerRig.setEquippedWeapon(equippedWeaponId);
    const weaponConf = FORGE_WEAPONS.find((w) => w.id === equippedWeaponId);
    const col = new THREE.Color(weaponConf ? weaponConf.colorHex : colorHex);

    if (playerRig.swordBlade.material instanceof THREE.MeshStandardMaterial) {
      playerRig.swordBlade.material.color.copy(col);
      playerRig.swordBlade.material.emissive.copy(col);
      playerRig.swordBlade.material.emissiveIntensity = 1.45 + unlockedCount * 0.25;
    }
    if (playerRig.slashArcMesh.material instanceof THREE.MeshBasicMaterial) {
      playerRig.slashArcMesh.material.color.copy(col);
    }
    const scaleBoost = 1 + unlockedCount * 0.06;
    playerRig.swordGroup.scale.setScalar(scaleBoost);
  }

  function applyTimeOfDay(mode: TimeOfDay) {
    if (mode === 'dawn') {
      scene.background = new THREE.Color(0x0b1528);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(0x162438);
        scene.fog.density = 0.0034;
      }
      skyUniforms.uZenithColor.value.setHex(0x0b1528);
      skyUniforms.uMidSkyColor.value.setHex(0x1e3a5f);
      skyUniforms.uHorizonColor.value.setHex(0xd97706);
      skyUniforms.uSunColor.value.setHex(0xfef08a);
      skyUniforms.uSunDir.value.set(0.0, 0.24, -0.96).normalize();
      hemiLight.color.setHex(0xffdfa8);
      hemiLight.groundColor.setHex(0x122238);
      hemiLight.intensity = 1.25;
      dirLight.color.setHex(0xffd28a);
      dirLight.intensity = 2.85;
      dirLight.position.set(28, 46, -54);
      windGrass.uniforms.uSunIntensity.value = 1.08;
      renderer.toneMappingExposure = 1.16;
    } else if (mode === 'noon') {
      scene.background = new THREE.Color(0x0f294a);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(0x1e3f66);
        scene.fog.density = 0.0028;
      }
      skyUniforms.uZenithColor.value.setHex(0x0c2444);
      skyUniforms.uMidSkyColor.value.setHex(0x2563eb);
      skyUniforms.uHorizonColor.value.setHex(0x7dd3fc);
      skyUniforms.uSunColor.value.setHex(0xffffff);
      skyUniforms.uSunDir.value.set(0.15, 0.62, -0.76).normalize();
      hemiLight.color.setHex(0xffffff);
      hemiLight.groundColor.setHex(0x1e3a2f);
      hemiLight.intensity = 1.42;
      dirLight.color.setHex(0xfffbeb);
      dirLight.intensity = 3.1;
      dirLight.position.set(16, 78, -28);
      windGrass.uniforms.uSunIntensity.value = 1.24;
      renderer.toneMappingExposure = 1.22;
    } else {
      scene.background = new THREE.Color(0x070814);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(0x19102c);
        scene.fog.density = 0.0045;
      }
      skyUniforms.uZenithColor.value.setHex(0x060712);
      skyUniforms.uMidSkyColor.value.setHex(0x2e1065);
      skyUniforms.uHorizonColor.value.setHex(0xbe123c);
      skyUniforms.uSunColor.value.setHex(0xf97316);
      skyUniforms.uSunDir.value.set(-0.22, 0.16, -0.96).normalize();
      hemiLight.color.setHex(0xfda4af);
      hemiLight.groundColor.setHex(0x0f0c1d);
      hemiLight.intensity = 0.95;
      dirLight.color.setHex(0xfb7185);
      dirLight.intensity = 2.15;
      dirLight.position.set(-34, 24, -48);
      windGrass.uniforms.uSunIntensity.value = 0.82;
      renderer.toneMappingExposure = 1.08;
    }
    weatherRig.setTimeOfDay(mode);
  }

  function setWeatherPreset(preset: WeatherPresetId) {
    weatherRig.setWeatherPreset(preset);
  }

  function updateWorldAnimations(
    elapsed: number,
    dt: number,
    activeStopId: string | null,
    nearStopId: string | null,
    attackProgress = 0,
    playerMoveSpeed = 0,
    isGliding = false,
    isParrying = false,
    comboStage: 1 | 2 | 3 = 1,
    isDashing = false
  ) {
    // 1. Update Atmospheric Sky Shader, Wind-Swept Grass, River Water, Silk Banners, Lantern Flames & Fireflies
    skyUniforms.uTime.value = elapsed;
    windGrass.uniforms.uTime.value = elapsed;
    zeldaRiver.uniforms.uTime.value = elapsed;

    // Animate 3D Sky-to-Ground Indra Vajra Lightning Bolt when active
    if (lightningBoltTimer > 0) {
      lightningBoltTimer = Math.max(0, lightningBoltTimer - dt);
      const lifePct = lightningBoltTimer / 0.78;
      lightningBoltGroup.rotation.y = Math.sin(elapsed * 90) * 0.35;
      mainBoltCore.scale.set(0.8 + Math.sin(elapsed * 120) * 0.35, 1, 0.8 + Math.cos(elapsed * 120) * 0.35);
      boltCoreMat.opacity = Math.min(1, lifePct * 1.4);
      boltAuraMat.opacity = lifePct * 0.75;
      boltGoldMat.opacity = lifePct * 0.9;
      boltImpactRing.scale.setScalar(0.6 + (1 - lifePct) * 3.2);
      if (boltLight) boltLight.intensity = lifePct * 22;
      if (lightningBoltTimer <= 0) {
        lightningBoltGroup.visible = false;
        if (boltLight) boltLight.intensity = 0;
      }
    }

    for (let b = 0; b < silkBanners.length; b++) {
      silkBanners[b].rotation.z = Math.sin(elapsed * 2.4 + b * 1.5) * 0.08;
      silkBanners[b].rotation.x = 0.06 + Math.cos(elapsed * 3.1 + b) * 0.05;
    }

    for (let l = 0; l < lanternFlames.length; l++) {
      const fl = lanternFlames[l];
      fl.rotation.y = elapsed * 2.5 + l;
      const flicker = 0.88 + Math.sin(elapsed * 9.5 + l * 1.7) * 0.16;
      fl.scale.setScalar(flicker);
    }

    for (let i = 0; i < fireflySeeds.length; i++) {
      const s = fireflySeeds[i];
      const t = elapsed * s.speed + s.phase;
      ffDummy.position.set(
        s.x + Math.sin(t * 0.8) * 0.7,
        s.y + Math.sin(t * 1.4) * 0.35,
        s.z + Math.cos(t * 0.7) * 0.7
      );
      const pulse = 0.65 + Math.sin(t * 2.8) * 0.35;
      ffDummy.scale.setScalar(pulse);
      ffDummy.updateMatrix();
      fireflyMesh.setMatrixAt(i, ffDummy.matrix);
    }
    fireflyMesh.instanceMatrix.needsUpdate = true;

    const damp = (cur: number, target: number, lambda: number) =>
      THREE.MathUtils.lerp(cur, target, 1 - Math.exp(-lambda * Math.max(0.001, dt)));

    // 2. Update Player Skeletal Animation Mixer & Lock Weapon Hilt Directly Into Right Hand Palm!
    if (playerRig.mixer) {
      const animState: 'idle' | 'walk' | 'run' =
        playerMoveSpeed > 9.0 ? 'run' : playerMoveSpeed > 0.3 ? 'walk' : 'idle';
      const clipSpeed =
        animState === 'run'
          ? Math.max(0.95, playerMoveSpeed / 11.0)
          : animState === 'walk'
          ? Math.max(0.85, playerMoveSpeed / 6.2)
          : 1.0;
      playerRig.setAnimationState(animState, clipSpeed);
      playerRig.mixer.update(dt);

      // Sample exact 3D palm center of Soldier.glb's rightHandBone after mixer update
      if (playerRig.glbRoot && playerRig.rightHandBone) {
        playerRig.glbRoot.updateMatrixWorld(true);
        const palmWorld = new THREE.Vector3(0, 0.06, 0.02);
        playerRig.rightHandBone.localToWorld(palmWorld);
        playerRig.bodyGroup.worldToLocal(palmWorld);
        playerRig.weaponArmPivot.position.copy(palmWorld);
        playerRig.elbowJoint.position.set(0, 0, 0);
        playerRig.wristGrip.position.set(0, 0, 0);
      }
      if (playerRig.glbRoot && playerRig.leftHandBone) {
        const leftPalmWorld = new THREE.Vector3(0, 0.06, 0.02);
        playerRig.leftHandBone.localToWorld(leftPalmWorld);
        playerRig.bodyGroup.worldToLocal(leftPalmWorld);
        playerRig.offhandArmPivot.position.copy(leftPalmWorld);
      }
    }

    // Update Corporate Asuras & Layoff Boss hand-locked weapon positions
    for (const demon of demons) {
      if (!demon.alive || !demon.rightHandBone) continue;
      demon.bodyGroup.updateMatrixWorld(true);
      const dPalm = new THREE.Vector3(0, 0.06, 0);
      demon.rightHandBone.localToWorld(dPalm);
      demon.bodyGroup.worldToLocal(dPalm);
      demon.weaponGroup.position.copy(dPalm);
      if (demon.state === 'windup') {
        demon.weaponGroup.rotation.set(-0.65, 0.2, -0.35);
      } else if (demon.state === 'strike') {
        demon.weaponGroup.rotation.set(1.45, -0.3, 0.25);
      } else {
        demon.weaponGroup.rotation.set(0.95, 0, 0.18);
      }
    }

    if (layoffBoss.awakened && !layoffBoss.defeated) {
      layoffBoss.bodyGroup.updateMatrixWorld(true);
      if (layoffBoss.rightHandBone) {
        const rPalm = new THREE.Vector3(0, 0.08, 0);
        layoffBoss.rightHandBone.localToWorld(rPalm);
        layoffBoss.bodyGroup.worldToLocal(rPalm);
        layoffBoss.rightWeaponGroup.position.copy(rPalm);
      }
      if (layoffBoss.leftHandBone) {
        const lPalm = new THREE.Vector3(0, 0.08, 0);
        layoffBoss.leftHandBone.localToWorld(lPalm);
        layoffBoss.bodyGroup.worldToLocal(lPalm);
        layoffBoss.leftWeaponGroup.position.copy(lPalm);
      }
    }

    if (playerRig.dashRingMesh.material instanceof THREE.MeshBasicMaterial) {
      playerRig.dashRingMesh.material.opacity = isDashing ? 0.82 : 0;
      playerRig.dashRingMesh.rotation.z = -elapsed * 12;
      playerRig.dashRingMesh.scale.setScalar(isDashing ? 1.18 + Math.sin(elapsed * 32) * 0.12 : 0.6);
    }

    playerRig.paragliderGroup.visible = isGliding;
    if (isGliding) {
      playerRig.paragliderGroup.rotation.z = Math.sin(elapsed * 4.5) * 0.06;
    }

    if (playerRig.parryShieldMesh.material instanceof THREE.MeshBasicMaterial) {
      playerRig.parryShieldMesh.material.opacity = isParrying ? 0.88 : 0;
      playerRig.parryShieldMesh.rotation.z = elapsed * 6.5;
      playerRig.parryShieldMesh.scale.setScalar(
        isParrying ? 1.04 + Math.sin(elapsed * 28) * 0.08 : 0.5
      );
    }

    // Orient the hand-locked weapon FORWARD (+Z in bodyGroup space, positive X pitch!) during attacks, parries, and movement
    if (attackProgress > 0) {
      const sinSwing = Math.sin(attackProgress * Math.PI);
      const easeSwing = 1 - Math.pow(1 - attackProgress, 2.2);

      if (comboStage === 1) {
        playerRig.bodyGroup.rotation.y = damp(playerRig.bodyGroup.rotation.y, 0.48 - easeSwing * 1.1, 24);
        playerRig.bodyGroup.rotation.x = damp(playerRig.bodyGroup.rotation.x, sinSwing * 0.2, 24);

        // Diagonal Forward Slash across the front (+Z) of the character
        playerRig.weaponArmPivot.rotation.set(
          0.75 + easeSwing * 0.72,
          0.55 - easeSwing * 1.35,
          0.65 - easeSwing * 1.35
        );
        playerRig.elbowJoint.rotation.set(0, 0, 0);
        playerRig.wristGrip.rotation.set(0, 0, 0);

        playerRig.slashArcMesh.rotation.set(0.22, -0.9 + easeSwing * Math.PI * 1.55, 0.28);
        playerRig.slashArcMesh.scale.setScalar(0.95 + easeSwing * 0.55);
        if (playerRig.slashArcMesh.material instanceof THREE.MeshBasicMaterial) {
          playerRig.slashArcMesh.material.opacity = sinSwing * 0.92;
        }
        if (playerRig.comboSlashRing.material instanceof THREE.MeshBasicMaterial) {
          playerRig.comboSlashRing.material.opacity = 0;
        }
      } else if (comboStage === 2) {
        playerRig.bodyGroup.rotation.y = damp(playerRig.bodyGroup.rotation.y, -0.52 + easeSwing * 1.2, 24);
        playerRig.bodyGroup.rotation.x = damp(playerRig.bodyGroup.rotation.x, sinSwing * 0.22, 24);

        // Ascending Reverse Cross-Slash in front (+Z)
        playerRig.weaponArmPivot.rotation.set(
          1.35 - easeSwing * 0.55,
          -0.75 + easeSwing * 1.45,
          -0.65 + easeSwing * 1.35
        );
        playerRig.elbowJoint.rotation.set(0, 0, 0);
        playerRig.wristGrip.rotation.set(0, 0, 0);
        playerRig.offhandArmPivot.rotation.set(1.05, -0.55 + easeSwing * 1.2, 0.35);

        playerRig.slashArcMesh.rotation.set(-0.24, 0.95 - easeSwing * Math.PI * 1.65, -0.36);
        playerRig.slashArcMesh.scale.setScalar(1.0 + easeSwing * 0.65);
        if (playerRig.slashArcMesh.material instanceof THREE.MeshBasicMaterial) {
          playerRig.slashArcMesh.material.opacity = sinSwing * 0.94;
        }
        playerRig.comboSlashRing.rotation.set(0.28, easeSwing * Math.PI * 1.5, 0.35);
        playerRig.comboSlashRing.scale.setScalar(0.88 + easeSwing * 0.62);
        if (playerRig.comboSlashRing.material instanceof THREE.MeshBasicMaterial) {
          playerRig.comboSlashRing.material.opacity = sinSwing * 0.82;
        }
      } else {
        playerRig.bodyGroup.rotation.y = easeSwing * Math.PI * 2;
        playerRig.bodyGroup.rotation.x = sinSwing * 0.26;

        // 360 Whirlwind Horizontal Cleave extended forward (+Z)
        playerRig.weaponArmPivot.rotation.set(1.38, 0.25 - easeSwing * 0.85, 0.78);
        playerRig.elbowJoint.rotation.set(0, 0, 0);
        playerRig.wristGrip.rotation.set(0, 0, 0);
        playerRig.offhandArmPivot.rotation.set(1.28, -0.65 + easeSwing * 1.4, -0.65);

        playerRig.slashArcMesh.rotation.set(0, easeSwing * Math.PI * 2.4, 0.14);
        playerRig.slashArcMesh.scale.setScalar(1.15 + easeSwing * 0.78);
        if (playerRig.slashArcMesh.material instanceof THREE.MeshBasicMaterial) {
          playerRig.slashArcMesh.material.opacity = sinSwing * 0.96;
        }
        playerRig.comboSlashRing.rotation.set(-0.22, -easeSwing * Math.PI * 2.2, -0.25);
        playerRig.comboSlashRing.scale.setScalar(1.08 + easeSwing * 0.88);
        if (playerRig.comboSlashRing.material instanceof THREE.MeshBasicMaterial) {
          playerRig.comboSlashRing.material.opacity = sinSwing * 0.94;
        }
      }
    } else if (isParrying) {
      playerRig.bodyGroup.rotation.y = damp(playerRig.bodyGroup.rotation.y, -0.22, 18);
      playerRig.bodyGroup.rotation.x = damp(playerRig.bodyGroup.rotation.x, 0.06, 18);
      // Sekiro High Horizontal Deflect Guard in FRONT (+Z) of chest
      playerRig.weaponArmPivot.rotation.set(
        damp(playerRig.weaponArmPivot.rotation.x, 0.68, 20),
        damp(playerRig.weaponArmPivot.rotation.y, -0.42, 20),
        damp(playerRig.weaponArmPivot.rotation.z, -0.82, 20)
      );
      playerRig.elbowJoint.rotation.set(0, 0, 0);
      playerRig.wristGrip.rotation.set(0, 0, 0);
      if (playerRig.slashArcMesh.material instanceof THREE.MeshBasicMaterial) {
        playerRig.slashArcMesh.material.opacity = 0;
      }
      if (playerRig.comboSlashRing.material instanceof THREE.MeshBasicMaterial) {
        playerRig.comboSlashRing.material.opacity = 0;
      }
    } else {
      // Natural Right-Handed Swordsman Ready Grip:
      // Hilt held in right hand at right hip; POSITIVE X rotation (+1.02 rad) pitches the blade FORWARD (+Z) and upward (+Y) in front of the character!
      const speedFactor = THREE.MathUtils.clamp(playerMoveSpeed / 10.5, 0, 1);
      const strideBob = Math.sin(elapsed * (3.2 + speedFactor * 8.5));
      const breathWave = Math.sin(elapsed * 2.4);

      playerRig.bodyGroup.rotation.y = damp(playerRig.bodyGroup.rotation.y, strideBob * 0.04 * speedFactor, 14);
      playerRig.bodyGroup.rotation.x = damp(playerRig.bodyGroup.rotation.x, speedFactor * 0.1, 14);

      const targetGripX = THREE.MathUtils.lerp(
        1.04 + breathWave * 0.03,
        1.18 + strideBob * 0.08,
        speedFactor
      );
      const targetGripY = THREE.MathUtils.lerp(-0.18, -0.24, speedFactor);
      const targetGripZ = THREE.MathUtils.lerp(0.24, 0.32, speedFactor);

      playerRig.weaponArmPivot.rotation.set(
        damp(playerRig.weaponArmPivot.rotation.x, targetGripX, 16),
        damp(playerRig.weaponArmPivot.rotation.y, targetGripY, 16),
        damp(playerRig.weaponArmPivot.rotation.z, targetGripZ, 16)
      );
      playerRig.elbowJoint.rotation.set(0, 0, 0);
      playerRig.wristGrip.rotation.set(0, 0, 0);

      playerRig.offhandArmPivot.rotation.set(
        damp(playerRig.offhandArmPivot.rotation.x, 1.02 + strideBob * 0.1 * speedFactor, 14),
        damp(playerRig.offhandArmPivot.rotation.y, 0.18, 14),
        damp(playerRig.offhandArmPivot.rotation.z, -0.24, 14)
      );

      if (playerRig.slashArcMesh.material instanceof THREE.MeshBasicMaterial) {
        playerRig.slashArcMesh.material.opacity = 0;
      }
      if (playerRig.comboSlashRing.material instanceof THREE.MeshBasicMaterial) {
        playerRig.comboSlashRing.material.opacity = 0;
      }
    }

    // 3. Update Grounded Ambient Companions (Hypo Astro-Bot, Grounded Spirit Foxes, Soaring Birds)
    for (const m of ambientMixers) {
      m.update(dt);
    }

    if (hypoBotGroup) {
      hypoBotGroup.position.y = hypoFloorY + 0.26;
      const dxToPlayer = playerRig.group.position.x - hypoBaseX;
      const dzToPlayer = playerRig.group.position.z - hypoBaseZ;
      const targetYaw = Math.atan2(dxToPlayer, dzToPlayer);
      hypoBotGroup.rotation.y = targetYaw;
    }

    for (const fox of spiritFoxes) {
      const angularSpeed = 0.36;
      const fa = elapsed * angularSpeed + fox.phase;
      const fx = fox.centerX + Math.cos(fa) * fox.radius;
      const fz = fox.centerZ + Math.sin(fa) * fox.radius;
      const fy = groundHeightAt(fx, fz) + fox.footOffsetY - 0.03;

      const nextFa = fa + 0.05;
      const nextFx = fox.centerX + Math.cos(nextFa) * fox.radius;
      const nextFz = fox.centerZ + Math.sin(nextFa) * fox.radius;
      const tangentYaw = Math.atan2(nextFx - fx, nextFz - fz);

      fox.group.position.set(fx, fy, fz);
      fox.group.rotation.set(0, tangentYaw, -0.05);
    }

    for (const bird of soaringBirds) {
      const ba = elapsed * bird.speed + bird.phase;
      const bx = Math.cos(ba) * bird.radius;
      const bz = -10 + Math.sin(ba) * bird.radius * 0.75;
      const by = bird.height + Math.sin(elapsed * 1.5 + bird.phase) * 1.2;

      const nextBa = ba + 0.05;
      const nextBx = Math.cos(nextBa) * bird.radius;
      const nextBz = -10 + Math.sin(nextBa) * bird.radius * 0.75;
      const birdYaw = Math.atan2(nextBx - bx, nextBz - bz);

      bird.group.position.set(bx, by, bz);
      bird.group.rotation.set(0, birdYaw, -0.14);
    }

    // 4. Update Monument Artifacts, Sky-Beams & Floating Scrolls
    monumentRigs.forEach((rig, id) => {
      const isFocused = id === activeStopId || id === nearStopId;
      const rotSpeed = isFocused ? 1.85 : 0.65;
      rig.artifactMesh.rotation.y = elapsed * rotSpeed;
      rig.haloRing.rotation.z = -elapsed * 0.45;

      const scrollObj = rig.scrollPedestalMesh.getObjectByName('FloatingScrollObject');
      if (scrollObj) {
        scrollObj.position.y = 1.68 + Math.sin(elapsed * 2.6 + rig.baseY) * 0.14;
        scrollObj.rotation.y = elapsed * 1.15;
      }

      const pulse = isFocused
        ? 1.06 + Math.sin(elapsed * 5.0) * 0.05
        : 1.0 + Math.sin(elapsed * 2.0) * 0.02;
      rig.haloRing.scale.setScalar(pulse);
    });

    // 5. Update Lotus Relics & Weapon Forge Altars
    relicRigs.forEach((rig) => {
      if (!rig.group.visible) return;
      rig.mesh.rotation.y = elapsed * 1.7;
      rig.mesh.position.y = 1.18 + Math.sin(elapsed * 2.8 + rig.baseY) * 0.14;
    });

    weaponForgeRigs.forEach((wf) => {
      wf.weaponMesh.rotation.y = elapsed * 1.45;
      wf.weaponMesh.position.y = 1.95 + Math.sin(elapsed * 2.6 + wf.baseY) * 0.16;
      wf.haloRing.rotation.z = elapsed * 0.75;
    });

    particlePool.update(dt);
    weatherRig.update(elapsed, dt, playerRig.group.position.x, playerRig.group.position.z);
  }

  function dispose() {
    weatherRig.dispose();
    sandstoneTex.dispose();
    flagstoneTex.dispose();
    terrainTex.dispose();
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }

  return {
    scene,
    playerRig,
    monumentRigs,
    relicRigs,
    weaponForgeRigs,
    demons,
    layoffBoss,
    cameraBlockers,
    particlePool,
    grappleLine,
    triggerLightningBoltVisual,
    updateGrappleLine,
    updateGuidanceTrail,
    updateShadowCamera,
    updatePlayerPowerVisuals,
    updateBossLockHologram,
    applyTimeOfDay,
    setWeatherPreset,
    weatherRig,
    updateWorldAnimations,
    dispose,
  };
}
