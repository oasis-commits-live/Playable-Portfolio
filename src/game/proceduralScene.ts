import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {
  PORTFOLIO_STOPS,
  LOTUS_RELICS,
  INITIAL_DEMON_SPAWNS,
  LAYOFF_BOSS_CONFIG,
  MonumentType,
} from '../data/portfolioStops';
import { groundHeightAt } from './worldLogic';

export type TimeOfDay = 'dawn' | 'noon' | 'twilight';

export interface PlayerRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  cloakMesh: THREE.Mesh;
  chakraHaloGroup: THREE.Group;
  dashRingMesh: THREE.Mesh;
  swordGroup: THREE.Group;
  swordBlade: THREE.Mesh;
  slashArcMesh: THREE.Mesh;
  comboSlashRing: THREE.Mesh;
  parryShieldMesh: THREE.Mesh;
  paragliderGroup: THREE.Group;
  powerOrbitals: THREE.Mesh[];
  shadowDisc: THREE.Mesh;
  glbRoot: THREE.Object3D | null;
  mixer: THREE.AnimationMixer | null;
  actions: {
    idle?: THREE.AnimationAction;
    walk?: THREE.AnimationAction;
    run?: THREE.AnimationAction;
  };
  activeActionName: 'idle' | 'walk' | 'run';
  setAnimationState: (state: 'idle' | 'walk' | 'run', speedMultiplier?: number) => void;
}

export interface DemonEntity {
  id: string;
  name: string;
  title: string;
  group: THREE.Group;
  bodyGroup: THREE.Group;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
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
}

export interface LayoffBossEntity {
  id: string;
  name: string;
  subtitle: string;
  group: THREE.Group;
  bodyGroup: THREE.Group;
  arms: THREE.Object3D[];
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
  demons: DemonEntity[];
  layoffBoss: LayoffBossEntity;
  cameraBlockers: THREE.Object3D[];
  particlePool: ParticleBurstPool;
  grappleLine: THREE.Line;
  updateGrappleLine: (
    active: boolean,
    startX?: number,
    startY?: number,
    startZ?: number,
    endX?: number,
    endY?: number,
    endZ?: number
  ) => void;
  updatePlayerPowerVisuals: (unlockedCount: number, colorHex: string) => void;
  applyTimeOfDay: (mode: TimeOfDay) => void;
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
 * Builds the Hero Character Rig ("Sthapati Royal Shinobi") with:
 * - Immediate articulated armor + asynchronous `/models/Soldier.glb` skeletal character with `Idle`, `Walk`, `Run` animations
 * - Ornate Prabhamandala Golden Back-Halo + Layered Obsidian-Gold Shoulder Pauldrons + Hip Saya Scabbard
 * - Flowing Royal Crimson-Gold Silk Scarf/Mantle that billows with speed & glide
 * - Deployable Garuda Sky-Cloak Paraglider Wings (Zelda BotW style)
 * - Blazing Nandaka Katana + Dual Combo Slash Arc Ribbons + Sekiro Golden Parry Shield + Shadow-Step Dash Ring
 * - 6 Orbiting Divine Astra Power Gems
 */
function createPlayerCharacter(): PlayerRig {
  const group = new THREE.Group();
  group.name = 'SeekerPlayer';

  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  const fallbackHeroGroup = new THREE.Group();
  bodyGroup.add(fallbackHeroGroup);

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xc68652,
    roughness: 0.45,
    metalness: 0.08,
  });
  const royalTunicMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.28,
    metalness: 0.45,
    sheen: 0.85,
    sheenColor: new THREE.Color(0x38bdf8),
  });
  const dhotiMat = new THREE.MeshPhysicalMaterial({
    color: 0xd97706,
    roughness: 0.38,
    metalness: 0.2,
    sheen: 0.75,
    sheenColor: new THREE.Color(0xfde68a),
  });
  const capeMat = new THREE.MeshPhysicalMaterial({
    color: 0x881337,
    roughness: 0.32,
    metalness: 0.18,
    sheen: 0.92,
    sheenColor: new THREE.Color(0xfbbf24),
    side: THREE.DoubleSide,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.18,
    metalness: 0.92,
    emissive: 0x78350f,
    emissiveIntensity: 0.32,
  });
  const obsidianLacquerMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.2,
    metalness: 0.85,
  });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.19, 0.66, 16), royalTunicMat);
  torso.position.y = 0.98;
  torso.castShadow = true;
  fallbackHeroGroup.add(torso);

  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.28), goldMat);
  chestPlate.position.set(0, 1.05, 0.03);
  fallbackHeroGroup.add(chestPlate);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 16), skinMat);
  head.position.y = 1.54;
  head.castShadow = true;
  fallbackHeroGroup.add(head);

  const mukutaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.15, 16), goldMat);
  mukutaBase.position.y = 1.68;
  fallbackHeroGroup.add(mukutaBase);

  const mukutaSpire = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 12), goldMat);
  mukutaSpire.position.y = 1.88;
  fallbackHeroGroup.add(mukutaSpire);

  // Royal Sthapati Shoulder Pauldrons for procedural fallback hero
  for (const side of [-1, 1]) {
    const pauldronGrp = new THREE.Group();
    pauldronGrp.position.set(side * 0.28, 1.36, 0.02);
    pauldronGrp.rotation.z = side * -0.32;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.26), obsidianLacquerMat);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.28), goldMat);
    rim.position.y = -0.03;
    pauldronGrp.add(plate, rim);
    fallbackHeroGroup.add(pauldronGrp);
  }

  // Sacred Prabhamandala Golden Back-Halo floating behind upper back
  const chakraHaloGroup = new THREE.Group();
  chakraHaloGroup.position.set(0, 1.48, 0.24);
  const haloOuter = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.014, 10, 32), goldMat);
  chakraHaloGroup.add(haloOuter);
  for (let s = 0; s < 8; s++) {
    const a = (s / 8) * Math.PI * 2;
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.08, 6), goldMat);
    fin.position.set(Math.cos(a) * 0.38, Math.sin(a) * 0.38, 0);
    fin.rotation.z = a - Math.PI / 2;
    chakraHaloGroup.add(fin);
  }
  bodyGroup.add(chakraHaloGroup);

  // Flowing Royal Silk Mantle for procedural fallback hero
  const cloakMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.98, 6, 8), capeMat);
  cloakMesh.position.set(0, 0.98, 0.21);
  cloakMesh.rotation.x = 0.16;
  cloakMesh.castShadow = true;
  bodyGroup.add(cloakMesh);

  // Left-Hip Lacquered Katana Saya (Scabbard)
  const scabbardGrp = new THREE.Group();
  scabbardGrp.position.set(-0.22, 0.88, 0.05);
  scabbardGrp.rotation.set(0.55, 0.1, 0.15);
  const sayaBody = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.018, 0.95, 8), obsidianLacquerMat);
  const sayaKojiri = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.02, 0.12, 8), goldMat);
  sayaKojiri.position.y = -0.44;
  scabbardGrp.add(sayaBody, sayaKojiri);
  bodyGroup.add(scabbardGrp);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.12, 0.65, 0);
  const leftLegMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.42, 8, 12), dhotiMat);
  leftLegMesh.position.y = -0.25;
  leftLeg.add(leftLegMesh);
  fallbackHeroGroup.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.12, 0.65, 0);
  const rightLegMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.42, 8, 12), dhotiMat);
  rightLegMesh.position.y = -0.25;
  rightLeg.add(rightLegMesh);
  fallbackHeroGroup.add(rightLeg);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.3, 1.24, 0);
  const leftArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.36, 8, 12), skinMat);
  leftArmMesh.position.y = -0.18;
  leftArm.add(leftArmMesh);
  fallbackHeroGroup.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.32, 1.22, 0);
  const rightArmMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.36, 8, 12), skinMat);
  rightArmMesh.position.y = -0.18;
  rightArm.add(rightArmMesh);
  fallbackHeroGroup.add(rightArm);

  const swordGroup = new THREE.Group();
  swordGroup.position.set(0.34, 1.05, -0.15);
  swordGroup.rotation.x = Math.PI / 2.2;
  bodyGroup.add(swordGroup);

  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.3, 10), obsidianLacquerMat);
  swordGroup.add(hilt);

  const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.048, 0), goldMat);
  pommel.position.y = -0.16;
  swordGroup.add(pommel);

  const crossguard = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.024, 8, 16), goldMat);
  crossguard.position.y = 0.15;
  crossguard.rotation.x = Math.PI / 2;
  swordGroup.add(crossguard);

  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.65,
    roughness: 0.08,
    metalness: 0.96,
  });
  const swordBlade = new THREE.Mesh(new THREE.ConeGeometry(0.055, 1.52, 6), bladeMat);
  swordBlade.scale.set(0.52, 1, 1.82);
  swordBlade.position.y = 0.9;
  swordGroup.add(swordBlade);

  // Primary Sekiro / Zelda Katana Slash Ribbon Arc
  const slashArcGeo = new THREE.RingGeometry(1.15, 2.95, 32, 1, -Math.PI * 0.68, Math.PI * 1.36);
  slashArcGeo.rotateX(-Math.PI / 2);
  const slashArcMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const slashArcMesh = new THREE.Mesh(slashArcGeo, slashArcMat);
  slashArcMesh.position.set(0, 1.08, -0.35);
  group.add(slashArcMesh);

  // Secondary Golden Cross-Slash & Whirlwind Ribbon for Combo Stage 2 & Stage 3
  const comboRingGeo = new THREE.RingGeometry(1.35, 3.25, 32, 1, -Math.PI * 0.85, Math.PI * 1.7);
  comboRingGeo.rotateX(-Math.PI / 2);
  const comboRingMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const comboSlashRing = new THREE.Mesh(comboRingGeo, comboRingMat);
  comboSlashRing.position.set(0, 1.16, -0.35);
  group.add(comboSlashRing);

  // Sekiro Golden Deflect / Parry Aura Shield Ring
  const parryShieldGeo = new THREE.TorusGeometry(1.08, 0.065, 12, 36);
  const parryShieldMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0,
  });
  const parryShieldMesh = new THREE.Mesh(parryShieldGeo, parryShieldMat);
  parryShieldMesh.position.set(0, 1.15, -0.45);
  group.add(parryShieldMesh);

  // Shinobi Shadow-Step Dash Wind Aura Ring
  const dashRingGeo = new THREE.RingGeometry(0.65, 1.35, 28);
  dashRingGeo.rotateX(-Math.PI / 2);
  const dashRingMat = new THREE.MeshBasicMaterial({
    color: 0x2dd4bf,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const dashRingMesh = new THREE.Mesh(dashRingGeo, dashRingMat);
  dashRingMesh.position.set(0, 0.18, 0);
  group.add(dashRingMesh);

  // Zelda BotW / TotK Garuda Sky-Cloak Paraglider
  const paragliderGroup = new THREE.Group();
  paragliderGroup.position.set(0, 2.35, 0);
  paragliderGroup.visible = false;
  group.add(paragliderGroup);

  const gliderBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.9, 10), goldMat);
  gliderBar.rotation.z = Math.PI / 2;
  gliderBar.position.y = -0.32;
  paragliderGroup.add(gliderBar);

  const wingGeo = new THREE.ConeGeometry(1.45, 2.2, 5);
  wingGeo.rotateZ(Math.PI / 2);
  wingGeo.scale(1, 0.14, 0.68);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.85,
    roughness: 0.22,
    metalness: 0.35,
  });
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-0.95, 0, 0.1);
  leftWing.rotation.y = 0.22;
  paragliderGroup.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.scale.x = -1;
  rightWing.position.set(0.95, 0, 0.1);
  rightWing.rotation.y = -0.22;
  paragliderGroup.add(rightWing);

  const centerFin = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), goldMat);
  centerFin.scale.set(0.8, 0.3, 1.6);
  paragliderGroup.add(centerFin);

  // 6 Floating Astra Power Orbitals
  const powerOrbitals: THREE.Mesh[] = [];
  const orbitalColors = [0xf59e0b, 0xf97316, 0x10b981, 0xeab308, 0xec4899, 0x14b8a6];
  for (let i = 0; i < 6; i++) {
    const orbMat = new THREE.MeshStandardMaterial({
      color: orbitalColors[i],
      emissive: orbitalColors[i],
      emissiveIntensity: 1.55,
      roughness: 0.12,
      metalness: 0.88,
    });
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.115, 0), orbMat);
    orb.visible = false;
    group.add(orb);
    powerOrbitals.push(orb);
  }

  // Grounding Contact Shadow Disc
  const shadowGeo = new THREE.CircleGeometry(0.58, 24);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x080503,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.position.y = 0.02;
  group.add(shadowDisc);

  const rig: PlayerRig = {
    group,
    bodyGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    cloakMesh,
    chakraHaloGroup,
    dashRingMesh,
    swordGroup,
    swordBlade,
    slashArcMesh,
    comboSlashRing,
    parryShieldMesh,
    paragliderGroup,
    powerOrbitals,
    shadowDisc,
    glbRoot: null,
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
  };

  // Load real rigged 3D character `Soldier.glb` and outfit with Sthapati Royal Armor
  const loader = new GLTFLoader();
  loader.load(
    'https://threejs.org/examples/models/gltf/Soldier.glb',
    (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(1.08);
      model.rotation.y = Math.PI;
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.castShadow = true;
          m.receiveShadow = true;
          if (m.material instanceof THREE.MeshStandardMaterial) {
            const mat = m.material.clone();
            mat.metalness = 0.48;
            mat.roughness = 0.32;
            mat.emissive = new THREE.Color(0x1e1b4b);
            mat.emissiveIntensity = 0.24;
            m.material = mat;
          }
        }
      });

      fallbackHeroGroup.visible = false;
      cloakMesh.visible = false;
      bodyGroup.add(model);
      rig.glbRoot = model;

      const mixer = new THREE.AnimationMixer(model);
      rig.mixer = mixer;

      const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'Idle') || gltf.animations[0];
      const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'Walk') || gltf.animations[3] || idleClip;
      const runClip = THREE.AnimationClip.findByName(gltf.animations, 'Run') || gltf.animations[1] || walkClip;

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
 * Builds an Asura Demon Enemy Rig with Vitality Bar, Sekiro Posture Bar, and Perilous Kanji Warning
 */
function createDemonRig(config: (typeof INITIAL_DEMON_SPAWNS)[number]): DemonEntity {
  const group = new THREE.Group();
  const y = groundHeightAt(config.position.x, config.position.z);
  group.position.set(config.position.x, y, config.position.z);

  const bodyGroup = new THREE.Group();
  bodyGroup.scale.setScalar(config.scale);
  group.add(bodyGroup);

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x18101c,
    roughness: 0.28,
    metalness: 0.78,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: config.colorHex,
    emissive: config.colorHex,
    emissiveIntensity: 1.55,
    roughness: 0.18,
    metalness: 0.55,
  });
  const hornMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: config.colorHex,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.88,
  });

  const fallbackCore = new THREE.Group();
  fallbackCore.name = 'FallbackDemonCore';
  bodyGroup.add(fallbackCore);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.28, 1.15, 10), armorMat);
  torso.position.y = 0.95;
  torso.castShadow = true;
  fallbackCore.add(torso);

  const coreGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), glowMat);
  coreGem.position.set(0, 1.28, 0.24);
  bodyGroup.add(coreGem);

  const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), armorMat);
  head.position.y = 1.72;
  fallbackCore.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.22), glowMat);
  visor.position.set(0, 1.66, 0.16);
  bodyGroup.add(visor);

  const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.44, 8), hornMat);
  leftHorn.position.set(-0.18, 1.96, 0);
  leftHorn.rotation.z = 0.38;
  bodyGroup.add(leftHorn);

  const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.44, 8), hornMat);
  rightHorn.position.set(0.18, 1.96, 0);
  rightHorn.rotation.z = -0.38;
  bodyGroup.add(rightHorn);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.46, 1.32, 0);
  const leftClub = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.72, 7), glowMat);
  leftClub.position.y = -0.32;
  leftClub.rotation.x = Math.PI;
  leftArm.add(leftClub);
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.46, 1.32, 0);
  const rightClub = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.72, 7), glowMat);
  rightClub.position.y = -0.32;
  rightClub.rotation.x = Math.PI;
  rightArm.add(rightClub);
  bodyGroup.add(rightArm);

  const hpBarFill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.13),
    new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
  );
  hpBarFill.position.y = 2.55 * config.scale;
  group.add(hpBarFill);

  const postureBarFill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.08),
    new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide })
  );
  postureBarFill.position.y = 2.38 * config.scale;
  postureBarFill.scale.x = 0.05;
  group.add(postureBarFill);

  const kanjiSprite = createKanjiWarningSprite('危');
  kanjiSprite.position.y = 3.15 * config.scale;
  group.add(kanjiSprite);

  return {
    id: config.id,
    name: config.name,
    title: config.title,
    group,
    bodyGroup,
    leftArm,
    rightArm,
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
    maxPosture: 60,
    scale: config.scale,
    alive: true,
    hitFlashTimer: 0,
    attackCooldown: 0,
    perilousTimer: 0,
    aggroRange: 13.5,
    mixer: null,
    actions: {},
    activeClip: 'idle',
  };
}

/**
 * Builds the Colossal "September Layoff" Maha-Asura Final Boss in the Northern Citadel Arena
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

  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x0f0714,
    roughness: 0.22,
    metalness: 0.88,
  });
  const crimsonMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    emissive: 0xbe123c,
    emissiveIntensity: 1.75,
    roughness: 0.15,
    metalness: 0.65,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.55,
    roughness: 0.2,
    metalness: 0.92,
  });

  const fallbackBossCore = new THREE.Group();
  fallbackBossCore.name = 'FallbackBossCore';
  bodyGroup.add(fallbackBossCore);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.38, 1.45, 12), obsidianMat);
  torso.position.y = 1.1;
  torso.castShadow = true;
  fallbackBossCore.add(torso);

  const coreHeart = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), crimsonMat);
  coreHeart.position.set(0, 1.38, 0.28);
  bodyGroup.add(coreHeart);

  const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1), obsidianMat);
  head.position.y = 2.05;
  fallbackBossCore.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.24), crimsonMat);
  visor.position.set(0, 1.88, 0.18);
  bodyGroup.add(visor);

  const crownRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.055, 12, 32), goldMat);
  crownRing.position.set(0, 2.22, -0.12);
  bodyGroup.add(crownRing);

  const arms: THREE.Object3D[] = [];
  const armOffsets = [
    { x: -0.68, y: 1.55, z: 0, rotZ: 0.45 },
    { x: 0.68, y: 1.55, z: 0, rotZ: -0.45 },
    { x: -0.62, y: 1.1, z: 0.1, rotZ: 0.78 },
    { x: 0.62, y: 1.1, z: 0.1, rotZ: -0.78 },
  ];
  for (const off of armOffsets) {
    const armPivot = new THREE.Group();
    armPivot.position.set(off.x, off.y, off.z);
    armPivot.rotation.z = off.rotZ;
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.08, 6), crimsonMat);
    blade.position.y = -0.48;
    blade.rotation.x = Math.PI;
    armPivot.add(blade);
    bodyGroup.add(armPivot);
    arms.push(armPivot);
  }

  const shockGeo = new THREE.RingGeometry(1.2, 1.75, 36);
  shockGeo.rotateX(-Math.PI / 2);
  const shockMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
  });
  const shockwaveRing = new THREE.Mesh(shockGeo, shockMat);
  shockwaveRing.position.y = 0.08;
  group.add(shockwaveRing);

  const kanjiSprite = createKanjiWarningSprite('忍殺');
  kanjiSprite.scale.set(2.2, 2.2, 1);
  kanjiSprite.position.y = 6.8;
  group.add(kanjiSprite);

  return {
    id: LAYOFF_BOSS_CONFIG.id,
    name: LAYOFF_BOSS_CONFIG.name,
    subtitle: LAYOFF_BOSS_CONFIG.subtitle,
    group,
    bodyGroup,
    arms,
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
 */
function createFloatingScrollPedestal(
  stoneMat: THREE.Material,
  goldMat: THREE.Material,
  accentHex: string
): THREE.Group {
  const scrollRoot = new THREE.Group();

  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.15, 12), stoneMat);
  pillar.position.y = 0.58;
  scrollRoot.add(pillar);

  const floatGroup = new THREE.Group();
  floatGroup.name = 'FloatingScrollObject';
  floatGroup.position.y = 1.65;

  const parchmentMat = new THREE.MeshStandardMaterial({
    color: 0xf5e1be,
    emissive: new THREE.Color(accentHex),
    emissiveIntensity: 0.32,
    roughness: 0.45,
    side: THREE.DoubleSide,
  });
  const parchment = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.05), parchmentMat);
  parchment.rotation.x = -0.25;
  floatGroup.add(parchment);

  const topRoller = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.02, 12), goldMat);
  topRoller.rotation.z = Math.PI / 2;
  topRoller.position.set(0, 0.48, -0.12);
  floatGroup.add(topRoller);

  const botRoller = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.02, 12), goldMat);
  botRoller.rotation.z = Math.PI / 2;
  botRoller.position.set(0, -0.48, 0.12);
  floatGroup.add(botRoller);

  scrollRoot.add(floatGroup);
  return scrollRoot;
}

/**
 * Creates a sculpted Hoysala / Chalukya Lathe-Turned Temple Pillar Geometry
 */
function createHoysalaLathePillarGeometry(height = 3.8): THREE.LatheGeometry {
  const profile: THREE.Vector2[] = [
    new THREE.Vector2(0.42, 0.0),
    new THREE.Vector2(0.42, 0.28),
    new THREE.Vector2(0.32, 0.34),
    new THREE.Vector2(0.34, 0.58),
    new THREE.Vector2(0.24, 0.72),
    new THREE.Vector2(0.26, height * 0.42),
    new THREE.Vector2(0.33, height * 0.48), // central bell ring
    new THREE.Vector2(0.23, height * 0.54),
    new THREE.Vector2(0.21, height * 0.74),
    new THREE.Vector2(0.34, height * 0.82), // kumbha cushion capital
    new THREE.Vector2(0.19, height * 0.88),
    new THREE.Vector2(0.44, height * 0.95), // flared abacus bracket
    new THREE.Vector2(0.44, height),
  ];
  const geo = new THREE.LatheGeometry(profile, 16);
  geo.translate(0, -height * 0.5, 0);
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

  const emissiveMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 1.65,
    roughness: 0.18,
    metalness: 0.86,
  });

  // Multi-tiered carved Jagati Plinth with gold lotus molding
  const baseStep1 = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.0, 0.48, 16), darkStoneMat);
  baseStep1.position.y = 0.24;
  baseStep1.receiveShadow = true;
  group.add(baseStep1);

  const goldMolding = new THREE.Mesh(new THREE.CylinderGeometry(4.95, 5.1, 0.14, 16), goldMat);
  goldMolding.position.y = 0.54;
  group.add(goldMolding);

  const baseStep2 = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.85, 0.52, 16), stoneMat);
  baseStep2.position.y = 0.86;
  baseStep2.receiveShadow = true;
  group.add(baseStep2);

  // Corner Sacred Agni Braziers on every Sanctum Plinth
  for (let c = 0; c < 4; c++) {
    const ca = (c / 4) * Math.PI * 2 + Math.PI / 4;
    const bx = Math.cos(ca) * 4.85;
    const bz = Math.sin(ca) * 4.85;
    const brazierPost = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.85, 8), darkStoneMat);
    brazierPost.position.set(bx, 0.9, bz);
    const brazierCup = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.16, 0.24, 8), goldMat);
    brazierCup.position.set(bx, 1.42, bz);
    const ember = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), emissiveMat);
    ember.position.set(bx, 1.66, bz);
    group.add(brazierPost, brazierCup, ember);
  }

  const haloGeo = new THREE.RingGeometry(5.8, 6.35, 48);
  haloGeo.rotateX(-Math.PI / 2);
  const haloMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.76,
  });
  const haloRing = new THREE.Mesh(haloGeo, haloMat);
  haloRing.position.y = 0.08;
  group.add(haloRing);

  // Volumetric God-Ray Sky Column
  const skyBeamGeo = new THREE.CylinderGeometry(0.12, 1.25, 38, 16, 1, true);
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
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.36, 5.8), darkStoneMat);
    cornice.position.y = 5.05;
    group.add(cornice);

    const goldCorniceTrim = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.12, 6.0), goldMat);
    goldCorniceTrim.position.y = 5.28;
    group.add(goldCorniceTrim);

    for (let t = 0; t < 5; t++) {
      const w = 4.8 - t * 0.72;
      const tier = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.62, w),
        t % 2 === 0 ? stoneMat : darkStoneMat
      );
      tier.position.y = 5.65 + t * 0.58;
      tier.castShadow = true;
      group.add(tier);
    }

    // 4 Corner Urusringa Turrets
    for (const [ux, uz] of [
      [-1.75, -1.75],
      [1.75, -1.75],
      [-1.75, 1.75],
      [1.75, 1.75],
    ]) {
      const turret = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.85, 8), stoneMat);
      turret.position.set(ux, 6.25, uz);
      const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), goldMat);
      finial.position.set(ux, 7.25, uz);
      group.add(turret, finial);
    }

    // Fluted Amalaka Crown & Kalasha Finial
    const amalaka = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.28, 12, 24), stoneMat);
    amalaka.rotation.x = Math.PI / 2;
    amalaka.position.y = 8.65;
    group.add(amalaka);

    const kalasha = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 12), goldMat);
    kalasha.position.y = 9.35;
    const spireTip = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.75, 10), goldMat);
    spireTip.position.y = 9.95;
    group.add(kalasha, spireTip);

    const chakraGroup = new THREE.Group();
    chakraGroup.position.y = 2.85;
    const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.1, 16, 32), goldMat);
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.06, 12, 24), emissiveMat);
    innerRing.rotation.y = Math.PI / 3;
    const hub = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), emissiveMat);
    chakraGroup.add(wheelRing, innerRing, hub);
    group.add(chakraGroup);
    artifactMesh = chakraGroup;
  } else if (type === 'jantar_yantra') {
    const dial = new THREE.Mesh(
      new THREE.TorusGeometry(2.7, 0.28, 16, 40, Math.PI * 1.45),
      stoneMat
    );
    dial.position.y = 3.2;
    dial.rotation.x = 0.48;
    dial.castShadow = true;
    group.add(dial);

    const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.8, 3.8), darkStoneMat);
    ramp.position.set(0, 3.1, -0.4);
    ramp.rotation.x = 0.52;
    ramp.castShadow = true;
    group.add(ramp);

    const armillary = new THREE.Group();
    armillary.position.set(0, 4.5, 0.5);
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.06, 12, 32), goldMat);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.05, 12, 32), emissiveMat);
    ring2.rotation.y = Math.PI / 2;
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), emissiveMat);
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
      new THREE.SphereGeometry(3.05, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
      darkStoneMat
    );
    dome.position.y = 4.65;
    group.add(dome);

    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.1, 12), goldMat);
    finial.position.y = 8.05;
    group.add(finial);

    const arcadeCubeGroup = new THREE.Group();
    arcadeCubeGroup.position.y = 2.9;
    const holoCube = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), emissiveMat);
    const holoRing = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.07, 12, 28), goldMat);
    holoRing.rotation.x = Math.PI / 3;
    arcadeCubeGroup.add(holoCube, holoRing);
    group.add(arcadeCubeGroup);
    artifactMesh = arcadeCubeGroup;
  } else if (type === 'ashoka_stambha') {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.68, 6.8, 20), stoneMat);
    shaft.position.y = 4.4;
    shaft.castShadow = true;
    group.add(shaft);

    const lotusBell = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.52, 0.78, 16), goldMat);
    lotusBell.position.y = 8.05;
    group.add(lotusBell);

    const dharmachakra = new THREE.Group();
    dharmachakra.position.y = 9.35;
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.1, 12, 28), emissiveMat);
    const centerGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), goldMat);
    dharmachakra.add(wheel, centerGem);
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
        new THREE.BoxGeometry(t.w, t.h, t.d),
        idx % 2 === 0 ? stoneMat : darkStoneMat
      );
      box.position.y = t.y;
      box.castShadow = true;
      group.add(box);
      const goldBand = new THREE.Mesh(new THREE.BoxGeometry(t.w + 0.16, 0.1, t.d + 0.16), goldMat);
      goldBand.position.y = t.y + t.h * 0.5;
      group.add(goldBand);
    });

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 1.2, 1.2, 6), goldMat);
    crown.position.y = 6.85;
    crown.rotation.z = Math.PI / 2;
    group.add(crown);

    const yantra = new THREE.Group();
    yantra.position.set(0, 2.7, 2.1);
    const outerTri = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 8, 3), emissiveMat);
    const innerTri = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 8, 3), goldMat);
    innerTri.rotation.z = Math.PI;
    yantra.add(outerTri, innerTri);
    group.add(yantra);
    artifactMesh = yantra;
  } else {
    for (let i = 0; i < 4; i++) {
      const rOuter = 4.4 - i * 0.65;
      const ringWall = new THREE.Mesh(
        new THREE.CylinderGeometry(rOuter, rOuter, 0.58, 12, 1, true),
        i % 2 === 0 ? stoneMat : darkStoneMat
      );
      ringWall.position.y = 1.45 - i * 0.25;
      group.add(ringWall);
    }

    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.7, 24), waterMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 1.14;
    group.add(pool);

    const vajraLotus = new THREE.Group();
    vajraLotus.position.y = 2.45;
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.72, 0), emissiveMat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.06, 10, 28), goldMat);
    ring.rotation.x = Math.PI / 2;
    vajraLotus.add(crystal, ring);
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
  const geo = new THREE.OctahedronGeometry(0.095, 0);
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

  const stoneMat = new THREE.MeshStandardMaterial({
    map: sandstoneTex,
    bumpMap: sandstoneTex,
    bumpScale: 0.042,
    roughness: 0.54,
    metalness: 0.18,
  });
  const darkStoneMat = new THREE.MeshStandardMaterial({
    color: 0x261c18,
    bumpMap: sandstoneTex,
    bumpScale: 0.036,
    roughness: 0.62,
    metalness: 0.28,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe5c158,
    roughness: 0.16,
    metalness: 0.94,
    emissive: 0x78350f,
    emissiveIntensity: 0.32,
  });
  const monumentWaterMat = new THREE.MeshStandardMaterial({
    color: 0x0d9488,
    roughness: 0.08,
    metalness: 0.78,
    emissive: 0x0f766e,
    emissiveIntensity: 0.36,
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

  const skyGeo = new THREE.SphereGeometry(250, 36, 24);
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

  // Distant Sculpted Himalayan / Vindhya Mountain Range Ring (No Cone Pyramids!)
  const mountainGeo = new THREE.CylinderGeometry(148, 166, 54, 180, 14, true);
  const mPos = mountainGeo.attributes.position;
  const mColors = new Float32Array(mPos.count * 3);
  const cFoot = new THREE.Color(0x111e30);
  const cMid = new THREE.Color(0x1e324a);
  const cSnow = new THREE.Color(0xd6c7b2);
  const cTemp = new THREE.Color();

  for (let i = 0; i < mPos.count; i++) {
    const vx = mPos.getX(i);
    const vy = mPos.getY(i);
    const vz = mPos.getZ(i);
    const angle = Math.atan2(vz, vx);
    const heightPct = THREE.MathUtils.clamp((vy + 27) / 54, 0, 1);

    // Multi-octave craggy ridge profile (never a single cone point)
    const ridgeWave =
      0.45 * Math.abs(Math.sin(angle * 4.0 + 0.5) * Math.cos(angle * 2.5)) +
      0.32 * Math.abs(Math.sin(angle * 9.0 - 1.2)) +
      0.16 * Math.sin(angle * 19.0 + heightPct * 3.0) +
      0.09 * Math.cos(angle * 37.0);

    const maxPeakH = 12 + ridgeWave * 42;
    const newY = -4 + heightPct * maxPeakH;
    const cragRadial =
      (1 - heightPct * 0.22) *
      (1 + 0.055 * Math.sin(angle * 17.0 + heightPct * 5.0) + 0.03 * Math.cos(angle * 31.0));

    mPos.setXYZ(i, vx * cragRadial, newY, vz * cragRadial);

    if (heightPct < 0.62) {
      cTemp.copy(cFoot).lerp(cMid, heightPct / 0.62);
    } else {
      cTemp.copy(cMid).lerp(cSnow, (heightPct - 0.62) / 0.38);
    }
    mColors[i * 3] = cTemp.r;
    mColors[i * 3 + 1] = cTemp.g;
    mColors[i * 3 + 2] = cTemp.b;
  }
  mountainGeo.setAttribute('color', new THREE.BufferAttribute(mColors, 3));
  mountainGeo.computeVertexNormals();

  const mountainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    metalness: 0.05,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const mountainRingMesh = new THREE.Mesh(mountainGeo, mountainMat);
  scene.add(mountainRingMesh);

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

  // 3. Vast 320m x 320m Valley Terrain Mesh
  const terrainGeo = new THREE.PlaneGeometry(320, 320, 128, 128);
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    posAttr.setY(i, groundHeightAt(vx, vz));
  }
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    map: terrainTex,
    bumpMap: terrainTex,
    bumpScale: 0.028,
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
  const flowerGeo = new THREE.OctahedronGeometry(0.11, 0);
  flowerGeo.scale(1.2, 0.55, 1.2);
  const flowerMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.45,
    roughness: 0.4,
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

  // Chiseled Angular Mossy Temple Ruin Outcrops & Carved Stele Stones (No smooth brown spheres!)
  const craggyRockGeo = new THREE.IcosahedronGeometry(0.82, 1);
  const rPos = craggyRockGeo.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    const rx = rPos.getX(i);
    const ry = rPos.getY(i);
    const rz = rPos.getZ(i);
    const jag = 1 + 0.26 * Math.sin(rx * 4.5 + rz * 3.2) - 0.18 * Math.cos(ry * 5.1);
    rPos.setXYZ(i, rx * jag * 1.25, Math.max(-0.25, ry * jag * 0.62), rz * jag * 0.95);
  }
  craggyRockGeo.computeVertexNormals();

  const mossyGraniteMat = new THREE.MeshStandardMaterial({
    color: 0x3f4d42,
    bumpMap: sandstoneTex,
    bumpScale: 0.05,
    roughness: 0.92,
    metalness: 0.08,
    flatShading: true,
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

    // Carved Ancient Ruin Stele Tablet leaning beside the outcrop
    const steleSlab = new THREE.Mesh(
      new THREE.BoxGeometry(0.46 * bs, 0.95 * bs, 0.18 * bs),
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

  const lilyPadMat = new THREE.MeshStandardMaterial({
    color: 0x14532d,
    roughness: 0.55,
    metalness: 0.1,
  });
  const padmaPetalMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: 0xe11d48,
    emissiveIntensity: 0.55,
    roughness: 0.3,
  });
  const riverLotusCoords = [
    [-18, -4.2], [-14, -2.1], [-9, -4.8], [8, -2.2], [13, -4.6], [19, -2.4], [26, -4.1], [-25, -2.8],
  ];
  for (const [lx, lz] of riverLotusCoords) {
    const padGrp = new THREE.Group();
    const curveZ = -3.5 + Math.sin(lx * 0.09) * 3.4 + (lz + 3.5) * 0.45;
    padGrp.position.set(lx, -0.13, curveZ);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.02, 12), lilyPadMat);
    const flower = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), padmaPetalMat);
    flower.position.y = 0.08;
    padGrp.add(pad, flower);
    scene.add(padGrp);
  }

  // Royal Basalt & Gold Temple Bridge at (0, 0, -3.5)
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(0, 0, -3.5);
  const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.28, 8.8), darkStoneMat);
  bridgeDeck.position.y = 0.06;
  bridgeDeck.receiveShadow = true;
  bridgeGroup.add(bridgeDeck);

  for (const sideX of [-2.55, 2.55]) {
    const balustrade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.58, 8.8), stoneMat);
    balustrade.position.set(sideX, 0.4, 0);
    bridgeGroup.add(balustrade);
    const railGold = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 8.9), goldMat);
    railGold.position.set(sideX, 0.72, 0);
    bridgeGroup.add(railGold);
    for (const postZ of [-4.1, -1.4, 1.4, 4.1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.12, 8), darkStoneMat);
      post.position.set(sideX, 0.6, postZ);
      const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), goldMat);
      finial.position.set(sideX, 1.26, postZ);
      bridgeGroup.add(post, finial);
    }
  }
  scene.add(bridgeGroup);

  // Dark Basalt & Gold-Inlaid Temple Causeway
  const pathMat = new THREE.MeshStandardMaterial({
    map: flagstoneTex,
    bumpMap: flagstoneTex,
    bumpScale: 0.035,
    roughness: 0.48,
    metalness: 0.26,
  });
  const nsPathGeo = new THREE.PlaneGeometry(4.6, 98, 8, 64);
  nsPathGeo.rotateX(-Math.PI / 2);
  const nsPos = nsPathGeo.attributes.position;
  for (let i = 0; i < nsPos.count; i++) {
    const px = nsPos.getX(i);
    const pz = nsPos.getZ(i) - 10;
    nsPos.setZ(i, pz);
    nsPos.setY(i, groundHeightAt(px, pz) + 0.038);
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
  const shortLathePillar = createHoysalaLathePillarGeometry(1.45);
  for (const [lx, lz] of lanternCoords) {
    const ly = groundHeightAt(lx, lz);
    const lGrp = new THREE.Group();
    lGrp.position.set(lx, ly, lz);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.34, 0.58), darkStoneMat);
    base.position.y = 0.17;
    const shaft = new THREE.Mesh(shortLathePillar, stoneMat);
    shaft.scale.set(0.52, 1, 0.52);
    shaft.position.y = 1.04;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.36, 6), goldMat);
    cap.position.y = 2.08;
    const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), lanternFlameMat);
    flame.position.y = 1.8;
    lGrp.add(base, shaft, cap, flame);
    scene.add(lGrp);
    lanternFlames.push(flame);
  }

  // Atmospheric Instanced Golden Prana Fireflies & Falling Blossom Petals
  const fireflyCount = isSoftwareGl ? 48 : 130;
  const fireflyGeo = new THREE.OctahedronGeometry(0.065, 0);
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
  for (const side of [-1, 1]) {
    const obeliskGroup = new THREE.Group();
    const ox = side * 9.5;
    const oz = 6.2;
    obeliskGroup.position.set(ox, groundHeightAt(ox, oz), oz);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 2.4), darkStoneMat);
    plinth.position.y = 0.6;
    obeliskGroup.add(plinth);

    const column = new THREE.Mesh(tallLathePillar, stoneMat);
    column.scale.set(1.35, 1, 1.35);
    column.position.y = 3.6;
    column.castShadow = true;
    obeliskGroup.add(column);

    const brazierBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.45, 0.55, 12), goldMat);
    brazierBowl.position.y = 6.45;
    obeliskGroup.add(brazierBowl);

    const flame = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.55, 0),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
    );
    flame.position.y = 7.1;
    obeliskGroup.add(flame);

    scene.add(obeliskGroup);
  }

  // Ornate Carved Sanchi / Hampi Royal Torana Gateway at (0, -12.5) with Swaying Silk Banners & Bronze Bells
  const toranaGroup = new THREE.Group();
  toranaGroup.position.set(0, groundHeightAt(0, -12.5), -12.5);
  const toranaPillarGeo = createHoysalaLathePillarGeometry(6.2);
  const silkBannerMat = new THREE.MeshStandardMaterial({
    color: 0x9f1239,
    emissive: 0x4c0519,
    emissiveIntensity: 0.35,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  const silkBanners: THREE.Mesh[] = [];

  for (const side of [-1, 1]) {
    const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.4), darkStoneMat);
    basePlinth.position.set(side * 4.3, 0.45, 0);
    const post = new THREE.Mesh(toranaPillarGeo, stoneMat);
    post.scale.set(1.25, 1, 1.25);
    post.position.set(side * 4.3, 3.6, 0);
    post.castShadow = true;
    const capitalLion = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), goldMat);
    capitalLion.position.set(side * 4.3, 6.85, 0);

    // Hanging Crimson-Gold Temple Silk Banner
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 3.2, 2, 6), silkBannerMat);
    banner.position.set(side * 3.55, 3.6, 0.25);
    silkBanners.push(banner);

    toranaGroup.add(basePlinth, post, capitalLion, banner);
  }

  // 3 Curved Sanchi Architrave Beams with Scroll Volute Ends
  for (let b = 0; b < 3; b++) {
    const by = 5.45 + b * 0.72;
    const bw = 11.2 - b * 0.6;
    const archBeam = new THREE.Mesh(
      new THREE.BoxGeometry(bw, 0.34, 0.78),
      b === 1 ? goldMat : stoneMat
    );
    archBeam.position.set(0, by, 0);
    archBeam.castShadow = true;
    const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.2, 0.08, 0.84), goldMat);
    goldTrim.position.set(0, by + 0.19, 0);
    toranaGroup.add(archBeam, goldTrim);

    for (const endSide of [-1, 1]) {
      const volute = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.84, 12), goldMat);
      volute.rotation.x = Math.PI / 2;
      volute.position.set(endSide * (bw * 0.5 + 0.1), by, 0);
      toranaGroup.add(volute);
    }
  }

  // Crowning Golden Dharmachakra Finial atop the Torana Gateway
  const toranaChakra = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.08, 12, 28), goldMat);
  toranaChakra.position.set(0, 7.75, 0);
  toranaGroup.add(toranaChakra);
  scene.add(toranaGroup);

  // Northern Rakshasa Boss Arena Ring at (0, -48)
  const bossArenaGroup = new THREE.Group();
  const arenaY = groundHeightAt(0, -48);
  bossArenaGroup.position.set(0, arenaY, -48);
  const arenaFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(11.5, 12.2, 0.35, 36),
    darkStoneMat
  );
  arenaFloor.position.y = 0.17;
  arenaFloor.receiveShadow = true;
  bossArenaGroup.add(arenaFloor);

  const arenaRuneRing = new THREE.Mesh(
    new THREE.RingGeometry(9.8, 10.6, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0xe11d48,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.72,
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
  scene.add(bossArenaGroup);

  // 7. Sculpted Multi-Branching Sacred Banyan & Golden Flame-of-the-Forest Trees (TubeGeometry + Organic Leaf Fronds)
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

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x3b2314,
    bumpMap: sandstoneTex,
    bumpScale: 0.04,
    roughness: 0.88,
  });
  const canopyDeepMat = new THREE.MeshStandardMaterial({
    color: 0x143820,
    roughness: 0.9,
    metalness: 0.04,
    flatShading: true,
  });
  const canopyJadeMat = new THREE.MeshStandardMaterial({
    color: 0x245e32,
    emissive: 0x0c2914,
    emissiveIntensity: 0.16,
    roughness: 0.86,
    metalness: 0.04,
    flatShading: true,
  });
  const blossomGoldMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    emissive: 0x92400e,
    emissiveIntensity: 0.28,
    roughness: 0.82,
    metalness: 0.05,
    flatShading: true,
  });
  const blossomCrimsonMat = new THREE.MeshStandardMaterial({
    color: 0xbe123c,
    emissive: 0x881337,
    emissiveIntensity: 0.26,
    roughness: 0.82,
    metalness: 0.05,
    flatShading: true,
  });

  // Sculpted Ruffled Botanical Foliage Cluster (No smooth pancake discs!)
  const frondGeo = new THREE.IcosahedronGeometry(0.86, 2);
  const fPos = frondGeo.attributes.position;
  for (let i = 0; i < fPos.count; i++) {
    const fx = fPos.getX(i);
    const fy = fPos.getY(i);
    const fz = fPos.getZ(i);
    const lobe =
      1 +
      0.24 * Math.sin(fx * 5.2 + fz * 4.1) * Math.cos(fy * 4.6) +
      0.15 * Math.cos(fx * 8.3 - fy * 6.2);
    fPos.setXYZ(i, fx * lobe * 1.28, fy * lobe * 0.66, fz * lobe * 1.18);
  }
  frondGeo.computeVertexNormals();

  for (let tIdx = 0; tIdx < treeCoords.length; tIdx++) {
    const tc = treeCoords[tIdx];
    const ty = groundHeightAt(tc.x, tc.z);
    const treeGrp = new THREE.Group();
    treeGrp.position.set(tc.x, ty, tc.z);
    treeGrp.scale.setScalar(tc.s);
    treeGrp.rotation.y = tIdx * 1.1;

    // Gnarled curving main trunk via CatmullRomCurve3 + TubeGeometry
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.1, 0),
      new THREE.Vector3(0.14, 1.0, -0.08),
      new THREE.Vector3(-0.1, 2.1, 0.12),
      new THREE.Vector3(0.05, 3.1, 0.0),
    ]);
    const trunkMesh = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 10, 0.36, 8, false), trunkMat);
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
      const bough = new THREE.Mesh(new THREE.TubeGeometry(boughCurve, 7, 0.16, 6, false), trunkMat);
      bough.castShadow = true;
      treeGrp.add(bough);

      // Hanging Banyan Aerial Prop Root
      const aerialRoot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.055, 3.4, 6),
        trunkMat
      );
      aerialRoot.position.set(bx * 1.55, 1.7, bz * 1.55);
      aerialRoot.rotation.set(bz * 0.06, 0, -bx * 0.06);
      treeGrp.add(aerialRoot);

      // Layered Botanical Foliage Cloud Clusters along each bough (No spherical bowling balls!)
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

  // 9. Build the 5 Collectible Career Experience Lotus Relics
  const relicRigs = new Map<string, RelicRig>();
  const lotusMat = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: 0x9333ea,
    emissiveIntensity: 1.25,
    roughness: 0.2,
    metalness: 0.85,
  });

  for (const relic of LOTUS_RELICS) {
    const rGroup = new THREE.Group();
    const baseY = groundHeightAt(relic.position.x, relic.position.z);
    rGroup.position.set(relic.position.x, baseY, relic.position.z);

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.58, 0.45, 12), stoneMat);
    plinth.position.y = 0.225;
    rGroup.add(plinth);

    const gemGroup = new THREE.Group();
    gemGroup.position.y = 1.18;
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), lotusMat);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 8, 24), goldMat);
    halo.rotation.x = Math.PI / 2;
    gemGroup.add(core, halo);
    rGroup.add(gemGroup);

    scene.add(rGroup);
    relicRigs.set(relic.id, {
      id: relic.id,
      group: rGroup,
      mesh: gemGroup,
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

  // Load `Xbot.glb` once and clone skeletal meshes into the 6 Demons + Layoff Boss
  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    'https://threejs.org/examples/models/gltf/Xbot.glb',
    (gltf) => {
      const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'idle') || gltf.animations[0];
      const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'walk') || gltf.animations[2] || idleClip;
      const runClip = THREE.AnimationClip.findByName(gltf.animations, 'run') || gltf.animations[1] || walkClip;

      for (const demon of demons) {
        const fb = demon.bodyGroup.getObjectByName('FallbackDemonCore');
        if (fb) fb.visible = false;
        const cloned = SkeletonUtils.clone(gltf.scene);
        cloned.scale.setScalar(1.12);
        cloned.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.material = new THREE.MeshStandardMaterial({
              color: 0x1a0b1e,
              emissive: new THREE.Color(
                INITIAL_DEMON_SPAWNS.find((c) => c.id === demon.id)?.colorHex ?? 0xdc2626
              ),
              emissiveIntensity: 0.45,
              roughness: 0.25,
              metalness: 0.8,
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

      const bossFb = layoffBoss.bodyGroup.getObjectByName('FallbackBossCore');
      if (bossFb) bossFb.visible = false;
      const bossClone = SkeletonUtils.clone(gltf.scene);
      bossClone.scale.setScalar(1.22);
      bossClone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.material = new THREE.MeshStandardMaterial({
            color: 0x0f0514,
            emissive: new THREE.Color(0xe11d48),
            emissiveIntensity: 0.65,
            roughness: 0.2,
            metalness: 0.9,
          });
        }
      });
      layoffBoss.bodyGroup.add(bossClone);
      const bossMixer = new THREE.AnimationMixer(bossClone);
      layoffBoss.mixer = bossMixer;
      if (walkClip) {
        const act = bossMixer.clipAction(walkClip);
        act.timeScale = 0.75;
        act.play();
      }
    },
    undefined,
    () => {}
  );

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
    new THREE.CylinderGeometry(0.68, 0.82, 0.26, 16),
    darkStoneMat
  );
  hypoPlinth.position.set(hypoBaseX, hypoFloorY + 0.13, hypoBaseZ);
  hypoPlinth.receiveShadow = true;
  scene.add(hypoPlinth);

  const hypoHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 0.92, 24).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xec4899, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
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
            m.castShadow = true;
            if (m.material instanceof THREE.MeshStandardMaterial) {
              const mat = m.material.clone();
              mat.emissive = new THREE.Color(0xd97706);
              mat.emissiveIntensity = 0.28;
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

  function updatePlayerPowerVisuals(unlockedCount: number, colorHex: string) {
    const col = new THREE.Color(colorHex);
    if (playerRig.swordBlade.material instanceof THREE.MeshStandardMaterial) {
      playerRig.swordBlade.material.color.copy(col);
      playerRig.swordBlade.material.emissive.copy(col);
      playerRig.swordBlade.material.emissiveIntensity = 1.35 + unlockedCount * 0.28;
    }
    if (playerRig.slashArcMesh.material instanceof THREE.MeshBasicMaterial) {
      playerRig.slashArcMesh.material.color.copy(col);
    }
    const scaleBoost = 1 + unlockedCount * 0.12;
    playerRig.swordBlade.scale.set(0.52 * scaleBoost, scaleBoost, 1.82 * scaleBoost);
    playerRig.chakraHaloGroup.scale.setScalar(0.85 + unlockedCount * 0.08);

    for (let i = 0; i < playerRig.powerOrbitals.length; i++) {
      playerRig.powerOrbitals[i].visible = i < unlockedCount;
    }
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
    toranaChakra.rotation.z = -elapsed * 0.9;

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

    // 2. Update Player Skeletal Animation Mixer, Prabhamandala Halo, Dash Ring, Paraglider & 3-Stage Combo
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
    }

    playerRig.chakraHaloGroup.rotation.z = elapsed * 0.85;

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

    for (let i = 0; i < playerRig.powerOrbitals.length; i++) {
      const orb = playerRig.powerOrbitals[i];
      if (!orb.visible) continue;
      const angle = elapsed * 2.6 + (i / 6) * Math.PI * 2;
      orb.position.set(
        Math.cos(angle) * 0.92,
        1.15 + Math.sin(elapsed * 3.4 + i) * 0.16,
        Math.sin(angle) * 0.92
      );
      orb.rotation.y = elapsed * 3;
      orb.rotation.x = elapsed * 2;
    }

    // 3-Stage Sekiro / Zelda Katana Combo Animatics (Diagonal Cleave -> Cross-Slash -> Whirlwind Spin)
    if (attackProgress > 0) {
      const sinSwing = Math.sin(attackProgress * Math.PI);
      if (comboStage === 1) {
        // Stage 1: Horizontal-diagonal cleave + forward torso lean
        playerRig.bodyGroup.rotation.y = sinSwing * 0.42;
        playerRig.bodyGroup.rotation.x = sinSwing * 0.18;
        playerRig.rightArm.rotation.x = -1.4 + sinSwing * 2.1;
        playerRig.swordGroup.rotation.y = -1.25 + attackProgress * 2.5;
        playerRig.slashArcMesh.rotation.set(0, attackProgress * Math.PI * 1.65, 0.18);
        playerRig.slashArcMesh.scale.setScalar(0.9 + attackProgress * 0.55);
        if (playerRig.slashArcMesh.material instanceof THREE.MeshBasicMaterial) {
          playerRig.slashArcMesh.material.opacity = sinSwing * 0.9;
        }
        if (playerRig.comboSlashRing.material instanceof THREE.MeshBasicMaterial) {
          playerRig.comboSlashRing.material.opacity = 0;
        }
      } else if (comboStage === 2) {
        // Stage 2: Reverse ascending cross-slash + dual ribbons
        playerRig.bodyGroup.rotation.y = -sinSwing * 0.48;
        playerRig.bodyGroup.rotation.x = sinSwing * 0.22;
        playerRig.rightArm.rotation.x = -1.55 + sinSwing * 2.3;
        playerRig.swordGroup.rotation.y = 1.35 - attackProgress * 2.7;
        playerRig.slashArcMesh.rotation.set(0, -attackProgress * Math.PI * 1.75, -0.36);
        playerRig.slashArcMesh.scale.setScalar(0.95 + attackProgress * 0.65);
        if (playerRig.slashArcMesh.material instanceof THREE.MeshBasicMaterial) {
          playerRig.slashArcMesh.material.opacity = sinSwing * 0.92;
        }
        playerRig.comboSlashRing.rotation.set(0.28, attackProgress * Math.PI * 1.5, 0.35);
        playerRig.comboSlashRing.scale.setScalar(0.85 + attackProgress * 0.6);
        if (playerRig.comboSlashRing.material instanceof THREE.MeshBasicMaterial) {
          playerRig.comboSlashRing.material.opacity = sinSwing * 0.78;
        }
      } else {
        // Stage 3: 360° Surya Whirlwind Finisher + blazing double rings
        playerRig.bodyGroup.rotation.y = attackProgress * Math.PI * 2;
        playerRig.bodyGroup.rotation.x = sinSwing * 0.26;
        playerRig.rightArm.rotation.x = -1.6 + sinSwing * 2.4;
        playerRig.swordGroup.rotation.y = -1.5 + attackProgress * 3.2;
        playerRig.slashArcMesh.rotation.set(0, attackProgress * Math.PI * 2.4, 0.22);
        playerRig.slashArcMesh.scale.setScalar(1.1 + attackProgress * 0.75);
        if (playerRig.slashArcMesh.material instanceof THREE.MeshBasicMaterial) {
          playerRig.slashArcMesh.material.opacity = sinSwing * 0.96;
        }
        playerRig.comboSlashRing.rotation.set(-0.22, -attackProgress * Math.PI * 2.2, -0.25);
        playerRig.comboSlashRing.scale.setScalar(1.05 + attackProgress * 0.85);
        if (playerRig.comboSlashRing.material instanceof THREE.MeshBasicMaterial) {
          playerRig.comboSlashRing.material.opacity = sinSwing * 0.92;
        }
      }
    } else {
      playerRig.bodyGroup.rotation.y = 0;
      playerRig.bodyGroup.rotation.x = 0;
      playerRig.swordGroup.rotation.y = 0;
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
      // Keep Hypo firmly grounded on his stone plinth and smoothly turn toward the player
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

      // Exact velocity tangent vector along the circular meadow path so the fox faces forward along its stride
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

    // 5. Update Lotus Relics
    relicRigs.forEach((rig) => {
      if (!rig.group.visible) return;
      rig.mesh.rotation.y = elapsed * 1.7;
      rig.mesh.position.y = 1.18 + Math.sin(elapsed * 2.8 + rig.baseY) * 0.14;
    });

    particlePool.update(dt);
  }

  function dispose() {
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
    demons,
    layoffBoss,
    cameraBlockers,
    particlePool,
    grappleLine,
    updateGrappleLine,
    updatePlayerPowerVisuals,
    applyTimeOfDay,
    updateWorldAnimations,
    dispose,
  };
}
