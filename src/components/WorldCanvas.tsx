import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  PORTFOLIO_STOPS,
  LOTUS_RELICS,
  STORY_CHAPTERS,
  FORGE_WEAPONS,
  LAYOFF_BOSS_CONFIG,
  LotusRelic,
  WeaponId,
} from '../data/portfolioStops';
import {
  groundHeightAt,
  walkableSurfaceHeightAt,
  applyRadialDeadzone,
  computeMovementVector,
  computeParagliderPhysics,
  findBestGrappleTarget,
  resolveCombatDefense,
  computeDynamicCameraFov,
  computeComboRank,
  dampAngle,
  resolveCollisions,
  findNearestStop,
  findNearestWeaponForge,
  checkRelicPickup,
  computePlayerCombatStats,
  stepDemonCombatAI,
  shouldAwakenLayoffBoss,
  canCastLightningBolt,
  computeBossMeleeMultiplier,
  computeLightningBoltDamage,
  getWorldColliders,
  getRegionNameAt,
  PLAYER_RADIUS,
  PARAGLIDE_SPEED_MULTIPLIER,
} from '../game/worldLogic';
import { buildAncientWorldScene, TimeOfDay } from '../game/proceduralScene';
import { WeatherPresetId } from '../game/weatherSystem';
import { sound } from '../game/sound';
import {
  HudTelemetry,
  CombatFloatingPopup,
  WorldAffordanceMarker,
  EngagedDemonTelemetry,
} from './HudOverlay';

export interface WorldControllerRef {
  teleportToStop: (stopId: string) => void;
  teleportToPoint: (x: number, z: number, label?: string) => void;
  equipWeapon: (weaponId: WeaponId) => void;
  setGuidanceTarget: (id: string, kind: 'project' | 'jewel' | 'weapon') => void;
  resetToSpawn: () => void;
  restartFromBeginning: () => void;
  setVirtualInput: (forward: number, right: number) => void;
  triggerVirtualJump: () => void;
  triggerAttack: (isNova?: boolean) => void;
  triggerLightningBolt: () => void;
  triggerParryDeflect: () => void;
  triggerDodgeDash: () => void;
  triggerGrappleHook: () => void;
  summonLayoffBoss: () => void;
  setTimeOfDay: (mode: TimeOfDay) => void;
  setWeatherPreset: (preset: WeatherPresetId) => void;
}

interface WorldCanvasProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover' | 'player_died';
  activeStopId: string | null;
  visitedStopIds: Set<string>;
  collectedRelicIds: Set<string>;
  onTelemetryUpdate: (telemetry: HudTelemetry) => void;
  onInspectStop: (stopId: string) => void;
  onCloseStop: () => void;
  onCollectRelic: (relic: LotusRelic) => void;
  onBossDefeated: () => void;
  onPlayerDied: () => void;
  onTogglePause: () => void;
  onStartFromTitle: () => void;
  onGamepadStatusChange: (connected: boolean) => void;
  controllerRef: React.MutableRefObject<WorldControllerRef | null>;
}

// Pre-allocated reusable math vectors outside the render loop (Zero GC)
const _desiredCamPos = new THREE.Vector3();
const _desiredLookAt = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _projVec = new THREE.Vector3();

interface WorldPopupItem {
  id: number;
  worldX: number;
  worldY: number;
  worldZ: number;
  text: string;
  subtext?: string;
  kind: 'damage' | 'crit' | 'parry' | 'deathblow';
  age: number;
  duration: number;
}

export const WorldCanvas: React.FC<WorldCanvasProps> = ({
  gameState,
  activeStopId,
  visitedStopIds,
  collectedRelicIds,
  onTelemetryUpdate,
  onInspectStop,
  onCloseStop,
  onCollectRelic,
  onBossDefeated,
  onPlayerDied,
  onTogglePause,
  onStartFromTitle,
  onGamepadStatusChange,
  controllerRef,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({
    gameState,
    activeStopId,
    visitedStopIds,
    collectedRelicIds,
    onTelemetryUpdate,
    onInspectStop,
    onCloseStop,
    onCollectRelic,
    onBossDefeated,
    onPlayerDied,
    onTogglePause,
    onStartFromTitle,
    onGamepadStatusChange,
  });

  useEffect(() => {
    stateRef.current = {
      gameState,
      activeStopId,
      visitedStopIds,
      collectedRelicIds,
      onTelemetryUpdate,
      onInspectStop,
      onCloseStop,
      onCollectRelic,
      onBossDefeated,
      onPlayerDied,
      onTogglePause,
      onStartFromTitle,
      onGamepadStatusChange,
    };
    if (gameState !== 'playing' || activeStopId) {
      if (typeof document !== 'undefined' && document.pointerLockElement) {
        try {
          document.exitPointerLock?.();
        } catch {
          // ignore pointer lock release errors
        }
      }
    }
  }, [
    gameState,
    activeStopId,
    visitedStopIds,
    collectedRelicIds,
    onTelemetryUpdate,
    onInspectStop,
    onCloseStop,
    onCollectRelic,
    onBossDefeated,
    onPlayerDied,
    onTogglePause,
    onStartFromTitle,
    onGamepadStatusChange,
  ]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Detect software WebGL (SwiftShader / llvmpipe)
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const initialW = container.clientWidth || window.innerWidth;
    const initialH = container.clientHeight || window.innerHeight;
    renderer.setSize(initialW, initialH);
    renderer.domElement.setAttribute('data-testid', 'world-canvas');
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(55, initialW / initialH, 0.2, 320);

    // 2. Build Portfolio Verse 3D Scene + RoomEnvironment PMREM Reflections
    const world = buildAncientWorldScene(renderer, isSoftwareGl);
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    world.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    if (!isSoftwareGl) {
      renderer.compile(world.scene, camera);
    }

    // 3. Player Momentum Physics, 3D Walkable Surface Elevation, 4-Weapon Armory & Combat State
    const colliders = getWorldColliders();
    const playerState = {
      x: 0,
      z: 8.2,
      y: walkableSurfaceHeightAt(0, 8.2, 0),
      vx: 0,
      vz: 0,
      vy: 0,
      yaw: Math.PI,
      bankRoll: 0,
      grounded: true,
      isGliding: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      walkCycleDist: 0,
      lastStepDist: 0,
      distanceTraveled: 0,
      scaleX: 1,
      scaleY: 1,
      hp: 320,
      maxHp: 320,
      outOfCombatTimer: 0,
      hurtFlashTimer: 0,
      stamina: 100,
      equippedWeaponId: 'weapon-nandaka' as WeaponId,
      guidanceTargetId: 'mandapa-origin' as string | null,
      guidanceTargetKind: 'project' as 'project' | 'jewel' | 'weapon',
      attackTimer: 0,
      attackDuration: 0.28,
      attackCooldown: 0,
      comboStage: 1 as 1 | 2 | 3,
      comboResetTimer: 0,
      comboHitCount: 0,
      comboStreakDecayTimer: 0,
      hitStopTimer: 0,
      parryTimer: 0,
      parryCooldown: 0,
      dodgeIframeTimer: 0,
      dodgeCooldown: 0,
      dashTimer: 0,
      dashDirX: 0,
      dashDirZ: 0,
      grappleActive: false,
      grappleTargetX: 0,
      grappleTargetY: 0,
      grappleTargetZ: 0,
      grappleAnchorX: 0,
      grappleAnchorY: 0,
      grappleAnchorZ: 0,
      combatCallout: null as string | null,
      combatCalloutTimer: 0,
      manualBossSummon: false,
      lightningCooldown: 0,
    };

    const camState = {
      yaw: 0,
      pitch: 0.15,
      distance: 4.15,
      shakeIntensity: 0,
      lastMousePanTime: 0,
      currentPos: new THREE.Vector3(0.38, 2.35, 12.3),
      currentLook: new THREE.Vector3(0.12, 1.85, 2.5),
    };

    const activePopups: WorldPopupItem[] = [];
    let popupIdCounter = 1;

    const spawnFloatingPopup = (
      worldX: number,
      worldY: number,
      worldZ: number,
      text: string,
      kind: 'damage' | 'crit' | 'parry' | 'deathblow',
      subtext?: string
    ) => {
      activePopups.push({
        id: popupIdCounter++,
        worldX: worldX + (Math.random() - 0.5) * 0.45,
        worldY,
        worldZ: worldZ + (Math.random() - 0.5) * 0.45,
        text,
        subtext,
        kind,
        age: 0,
        duration: kind === 'deathblow' ? 1.35 : 0.95,
      });
      if (activePopups.length > 10) {
        activePopups.shift();
      }
    };

    const keysHeld = new Set<string>();
    const virtualInput = { forward: 0, right: 0 };
    let hasPointerPos = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const prevGamepadButtons: boolean[] = new Array(16).fill(false);
    let gamepadWasConnected = false;

    const showCombatCallout = (text: string, duration = 1.4) => {
      playerState.combatCallout = text;
      playerState.combatCalloutTimer = duration;
    };

    // Equip one of the 4 Divine Forge Weapons [Keys 1-4 / E at Forge / HUD Click]
    const performEquipWeapon = (weaponId: WeaponId) => {
      const weaponConf = FORGE_WEAPONS.find((w) => w.id === weaponId);
      if (!weaponConf) return;
      playerState.equippedWeaponId = weaponId;
      sound.playWeaponForgeEquip();
      world.particlePool.spawnBurst(playerState.x, playerState.y + 1.1, playerState.z, 22, true);
      showCombatCallout(
        `⚔ EQUIPPED ${weaponConf.name.toUpperCase()} (+${weaponConf.baseDamageBonus} ATK · ${weaponConf.category.toUpperCase()})`,
        1.8
      );
    };

    // Shinobi Shadow-Step Dodge / Dash Execution [Shift / Key X / Dash Button]
    const performDodgeDash = () => {
      if (playerState.dodgeCooldown > 0 || playerState.stamina < 12) return;
      playerState.dodgeCooldown = 0.45;
      playerState.dodgeIframeTimer = 0.34;
      playerState.dashTimer = 0.22;
      playerState.stamina = Math.max(0, playerState.stamina - 14);
      playerState.dashDirX = Math.sin(playerState.yaw);
      playerState.dashDirZ = Math.cos(playerState.yaw);
      playerState.scaleX = 1.18;
      playerState.scaleY = 0.84;

      sound.playDash(false);
      world.particlePool.spawnBurst(playerState.x, playerState.y + 0.5, playerState.z, 16, true);
      showCombatCallout('SHINOBI SHADOW-STEP · I-FRAMES ACTIVE', 0.95);
    };

    // Shinobi Grapple Hook Execution [Key G]
    const performGrappleHook = () => {
      const target = findBestGrappleTarget({ x: playerState.x, z: playerState.z });
      if (!target) return;
      const monRig = world.monumentRigs.get(target.stop.id);
      playerState.grappleActive = true;
      playerState.grounded = false;
      playerState.isGliding = false;
      playerState.grappleTargetX = target.targetX;
      playerState.grappleTargetY = walkableSurfaceHeightAt(
        target.targetX,
        target.targetZ,
        target.targetY
      );
      playerState.grappleTargetZ = target.targetZ;
      playerState.grappleAnchorX = monRig ? monRig.grappleAnchorPos.x : target.stop.position.x;
      playerState.grappleAnchorY = monRig ? monRig.grappleAnchorPos.y : target.targetY + 6.0;
      playerState.grappleAnchorZ = monRig ? monRig.grappleAnchorPos.z : target.stop.position.z;
      playerState.yaw = Math.atan2(
        target.stop.position.x - playerState.x,
        target.stop.position.z - playerState.z
      );
      sound.playGrappleZip();
      showCombatCallout(`SHINOBI GRAPPLE → ${target.stop.title.toUpperCase()}`, 1.5);
    };

    // Sekiro Deflect / Parry Stance Execution [Key V / Right-Click / Parry Button]
    const performParryDeflect = () => {
      if (playerState.parryCooldown > 0) return;
      playerState.parryTimer = 0.48;
      playerState.parryCooldown = 0.32;
      sound.playParryClang(false);

      const combatStats = computePlayerCombatStats(
        stateRef.current.visitedStopIds,
        PORTFOLIO_STOPS,
        playerState.equippedWeaponId
      );
      let deflectedSomeone = false;

      for (const demon of world.demons) {
        if (!demon.alive) continue;
        const dist = Math.hypot(demon.x - playerState.x, demon.z - playerState.z);
        if (dist <= 5.4) {
          deflectedSomeone = true;
          const postureDealt = Math.round(combatStats.postureDamage * 1.45);
          demon.posture = Math.min(demon.maxPosture, demon.posture + postureDealt);
          demon.hitFlashTimer = 0.28;
          demon.state = 'stagger';
          demon.stateTimer = 0.65;
          demon.attackCooldown = 1.45;
          world.particlePool.spawnBurst(demon.x, demon.y + 1.4, demon.z, 24, true);
          spawnFloatingPopup(
            demon.x,
            demon.y + 2.3,
            demon.z,
            `+${postureDealt} POSTURE`,
            'parry',
            'PERFECT DEFLECT'
          );
        }
      }

      const boss = world.layoffBoss;
      if (boss.awakened && !boss.defeated) {
        const bDist = Math.hypot(boss.x - playerState.x, boss.z - playerState.z);
        if (bDist <= 7.8) {
          deflectedSomeone = true;
          const postureDealt = Math.round(combatStats.postureDamage * 1.55);
          boss.posture = Math.min(boss.maxPosture, boss.posture + postureDealt);
          boss.hitFlashTimer = 0.26;
          world.particlePool.spawnBurst(boss.x, boss.y + 2.5, boss.z, 30, true);
          spawnFloatingPopup(
            boss.x,
            boss.y + 4.2,
            boss.z,
            `+${postureDealt} POSTURE`,
            'parry',
            'SEKIRO PARRY'
          );
        }
      }

      if (deflectedSomeone) {
        playerState.comboHitCount += 2;
        playerState.comboStreakDecayTimer = 4.5;
        sound.playParryClang(true);
        playerState.hitStopTimer = 0.04;
        camState.shakeIntensity = 0.2;
        showCombatCallout('PERFECT SEKIRO DEFLECT · POSTURE SHATTERED', 1.5);
      } else {
        showCombatCallout('SEKIRO DEFLECT STANCE READY', 0.9);
      }
    };

    // 3-Stage Weapon Combo & Surya Nova Execution [Left-Click / Key F / Key Q]
    const performAttack = (isNova = false) => {
      if (playerState.attackCooldown > 0) return;
      const combatStats = computePlayerCombatStats(
        stateRef.current.visitedStopIds,
        PORTFOLIO_STOPS,
        playerState.equippedWeaponId
      );

      // Advance 3-Stage Weapon Combo if chained within 1.15s
      if (isNova) {
        playerState.comboStage = 3;
      } else if (playerState.comboResetTimer > 0) {
        playerState.comboStage =
          playerState.comboStage === 1 ? 2 : playerState.comboStage === 2 ? 3 : 1;
      } else {
        playerState.comboStage = 1;
      }
      playerState.comboResetTimer = 1.15;

      const stage = playerState.comboStage;
      const speedFactor = 1 / combatStats.speedMultiplier;
      const duration = (isNova || stage === 3 ? 0.36 : stage === 2 ? 0.28 : 0.25) * speedFactor;
      playerState.attackDuration = duration;
      playerState.attackTimer = duration;
      playerState.attackCooldown = (isNova ? 0.36 : stage === 3 ? 0.32 : 0.2) * speedFactor;

      // Soft Target Lock-On Magnetism: automatically face & lunge toward the nearest enemy within 7.5m before swinging
      let lockTargetDx = 0;
      let lockTargetDz = 0;
      let lockTargetDist = 7.5;
      for (const demon of world.demons) {
        if (!demon.alive) continue;
        const d = Math.hypot(demon.x - playerState.x, demon.z - playerState.z);
        if (d < lockTargetDist) {
          lockTargetDist = d;
          lockTargetDx = demon.x - playerState.x;
          lockTargetDz = demon.z - playerState.z;
        }
      }
      if (world.layoffBoss.awakened && !world.layoffBoss.defeated) {
        const bd = Math.hypot(world.layoffBoss.x - playerState.x, world.layoffBoss.z - playerState.z);
        if (bd < lockTargetDist + 2.0) {
          lockTargetDist = bd;
          lockTargetDx = world.layoffBoss.x - playerState.x;
          lockTargetDz = world.layoffBoss.z - playerState.z;
        }
      }
      if (lockTargetDist < 7.5 && (Math.abs(lockTargetDx) > 0.01 || Math.abs(lockTargetDz) > 0.01)) {
        playerState.yaw = Math.atan2(lockTargetDx, lockTargetDz);
      }

      // Forward Lunge impulse scaled by combo stage
      playerState.dashTimer = stage === 3 ? 0.15 : 0.11;
      playerState.dashDirX = Math.sin(playerState.yaw);
      playerState.dashDirZ = Math.cos(playerState.yaw);
      playerState.scaleX = 1.14;
      playerState.scaleY = 0.88;

      sound.playAstraStrike(combatStats.unlockedPowersCount, isNova, stage);
      world.particlePool.spawnBurst(
        playerState.x + Math.sin(playerState.yaw) * 1.6,
        playerState.y + 1.1,
        playerState.z + Math.cos(playerState.yaw) * 1.6,
        isNova || stage === 3 ? 28 : 15,
        isNova || stage === 3
      );

      const rankBonus = computeComboRank(playerState.comboHitCount).damageMultiplier;
      const comboMult = (isNova ? 1.5 : stage === 3 ? 1.45 : stage === 2 ? 1.2 : 1.0) * rankBonus;
      const effectiveRange = combatStats.attackRange * (isNova || stage === 3 ? 1.5 : 1.12);
      const baseDmg = Math.round(combatStats.attackDamage * comboMult);
      const basePostureDmg = Math.round(combatStats.postureDamage * comboMult);

      const comboNames = {
        1: `I · ${combatStats.equippedWeapon.name.toUpperCase()} CLEAVE`,
        2: 'II · ASCENDING CROSS-SLASH',
        3: isNova ? 'SURYA ASTRA NOVA' : 'III · SURYA WHIRLWIND FINISHER',
      };

      let landedAnyHit = false;

      // Check hits against roaming Asura Demons
      for (const demon of world.demons) {
        if (!demon.alive) continue;
        const dx = demon.x - playerState.x;
        const dz = demon.z - playerState.z;
        const dist = Math.hypot(dx, dz);
        if (dist <= effectiveRange + 1.05) {
          landedAnyHit = true;
          playerState.outOfCombatTimer = 6.5;
          playerState.comboHitCount += 1;
          playerState.comboStreakDecayTimer = 4.5;
          const isDeathblow = demon.posture >= demon.maxPosture * 0.85 || isNova;
          const dealtDmg = isDeathblow ? Math.round(baseDmg * 1.9) : baseDmg;

          demon.hp = Math.max(0, demon.hp - dealtDmg);
          demon.posture = Math.min(demon.maxPosture, demon.posture + basePostureDmg);
          demon.hitFlashTimer = 0.25;
          demon.state = 'stagger';
          demon.stateTimer = 0.42;

          // Auto-face the struck demon for crisp lock-on feel
          playerState.yaw = Math.atan2(dx, dz);

          // Physical knockback impulse
          const inv = 1 / (dist || 1);
          const knockDist = stage === 3 || isNova ? 1.9 : 1.15;
          demon.x += dx * inv * knockDist;
          demon.z += dz * inv * knockDist;
          world.particlePool.spawnBurst(demon.x, demon.y + 1.3, demon.z, 22, true);

          if (demon.hp <= 0) {
            demon.alive = false;
            demon.group.visible = false;
            sound.playDeathblow();
            sound.playRelicChime(false);
            playerState.hitStopTimer = 0.065;
            camState.shakeIntensity = 0.28;
            spawnFloatingPopup(
              demon.x,
              demon.y + 2.4,
              demon.z,
              `忍殺 -${dealtDmg}`,
              'deathblow',
              `${demon.name.toUpperCase()} SLAIN`
            );
            showCombatCallout(`忍殺 SHINOBI DEATHBLOW · ${demon.name.toUpperCase()} VANQUISHED!`, 2.2);
            world.particlePool.spawnBurst(demon.x, demon.y + 1.5, demon.z, 38, true);
          } else {
            sound.playDemonHit(false);
            playerState.hitStopTimer = stage === 3 ? 0.045 : 0.025;
            camState.shakeIntensity = stage === 3 ? 0.16 : 0.09;
            spawnFloatingPopup(
              demon.x,
              demon.y + 2.2,
              demon.z,
              `-${dealtDmg} HP`,
              isDeathblow || stage === 3 ? 'crit' : 'damage',
              `${demon.hp}/${demon.maxHp} HP LEFT`
            );
            if (demon.posture >= demon.maxPosture) {
              showCombatCallout('危 POSTURE BROKEN · STRIKE FOR SHINOBI DEATHBLOW!', 1.5);
            } else {
              showCombatCallout(
                `${comboNames[stage]} · -${dealtDmg} HP (${demon.hp}/${demon.maxHp})`,
                1.1
              );
            }
          }
        }
      }

      // Check hits against the Colossal September Layoff Boss
      const boss = world.layoffBoss;
      if (boss.awakened && !boss.defeated) {
        const dx = boss.x - playerState.x;
        const dz = boss.z - playerState.z;
        const dist = Math.hypot(dx, dz);
        if (dist <= effectiveRange + 2.9) {
          landedAnyHit = true;
          playerState.outOfCombatTimer = 6.5;
          playerState.comboHitCount += 1;
          playerState.comboStreakDecayTimer = 4.5;
          const bossMeleeMult = computeBossMeleeMultiplier(stateRef.current.visitedStopIds.size);
          const isBossDeathblow = boss.posture >= boss.maxPosture;
          const dealtBossDmg = Math.max(
            4,
            Math.round(baseDmg * bossMeleeMult * (isBossDeathblow ? 2.2 : 1.0))
          );
          if (isBossDeathblow) {
            boss.posture = 0;
            sound.playDeathblow();
            playerState.hitStopTimer = 0.075;
            camState.shakeIntensity = 0.36;
            spawnFloatingPopup(
              boss.x,
              boss.y + 4.5,
              boss.z,
              `忍殺 -${dealtBossDmg}`,
              'deathblow',
              'SEPTEMBER LAYOFF SHATTERED'
            );
            showCombatCallout('忍殺 MAHA-ASURA DEATHBLOW CRITICAL!', 1.8);
          } else {
            playerState.hitStopTimer = stage === 3 ? 0.045 : 0.025;
            camState.shakeIntensity = stage === 3 ? 0.18 : 0.1;
            const shieldNote =
              stateRef.current.visitedStopIds.size < 6
                ? 'SHIELDED (UNLOCK ALL 6 PROJECTS FOR ⚡ LIGHTNING!)'
                : 'USE [Z] ⚡ INDRA LIGHTNING BOLT!';
            spawnFloatingPopup(
              boss.x,
              boss.y + 4.0,
              boss.z,
              `-${dealtBossDmg} HP`,
              stage === 3 ? 'crit' : 'damage',
              shieldNote
            );
            if (stateRef.current.visitedStopIds.size < 6) {
              showCombatCallout(
                `⚔ CORPORATE ARMOR RESIST (-${dealtBossDmg} HP) · AWAKEN ALL 6 PROJECTS (${stateRef.current.visitedStopIds.size}/6) TO UNLOCK ⚡ SKY-LIGHTNING!`,
                1.8
              );
            }
          }

          boss.hp = Math.max(0, boss.hp - dealtBossDmg);
          boss.posture = Math.min(boss.maxPosture, boss.posture + Math.round(basePostureDmg * 0.7));
          boss.hitFlashTimer = 0.24;
          world.particlePool.spawnBurst(boss.x, boss.y + 2.4, boss.z, 30, true);

          if (boss.hp <= 0) {
            boss.defeated = true;
            boss.group.visible = false;
            sound.playDeathblow();
            sound.playRelicChime(true);
            world.particlePool.spawnBurst(boss.x, boss.y + 2.8, boss.z, 58, true);
            if (typeof document !== 'undefined' && document.pointerLockElement) {
              try {
                document.exitPointerLock?.();
              } catch {
                // ignore
              }
            }
            stateRef.current.onBossDefeated();
          } else if (!isBossDeathblow) {
            sound.playDemonHit(false);
          }
        }
      }

      if (!landedAnyHit && stage === 3) {
        showCombatCallout(comboNames[stage], 0.9);
      }
    };

    // Super Power: Indra Vajra Sky-Lightning Bolt (Unlocked after all 6 Projects have been seen!) [Key Z]
    const performLightningBolt = () => {
      const unlockedCount = stateRef.current.visitedStopIds.size;
      if (!canCastLightningBolt(unlockedCount)) {
        sound.playPerilousWarning();
        showCombatCallout(
          `⚡ INDRA VAJRA LIGHTNING LOCKED — INSPECT ALL 6 PROJECT SANCTUMS (${unlockedCount}/6 UNLOCKED)!`,
          2.4
        );
        return;
      }
      if (playerState.lightningCooldown > 0) {
        showCombatCallout(
          `⚡ INDRA VAJRA RECHARGING (${playerState.lightningCooldown.toFixed(1)}s)...`,
          1.1
        );
        return;
      }

      playerState.lightningCooldown = 0.55;
      playerState.attackDuration = 0.42;
      playerState.attackTimer = 0.42;
      playerState.comboStage = 3;

      const boss = world.layoffBoss;
      // Prioritize the Layoff Monster if awakened or nearby; otherwise strike nearest Corporate Asura
      let targetDemon: (typeof world.demons)[number] | null = null;
      let nearestDemonDist = 28;
      for (const demon of world.demons) {
        if (!demon.alive) continue;
        const d = Math.hypot(demon.x - playerState.x, demon.z - playerState.z);
        if (d < nearestDemonDist) {
          nearestDemonDist = d;
          targetDemon = demon;
        }
      }

      const bossDist = Math.hypot(boss.x - playerState.x, boss.z - playerState.z);
      const shouldStrikeBoss =
        !boss.defeated && (boss.awakened || bossDist < 36 || !targetDemon);

      if (shouldStrikeBoss && !boss.defeated) {
        if (!boss.awakened) {
          boss.awakened = true;
          boss.group.visible = true;
        }
        playerState.yaw = Math.atan2(boss.x - playerState.x, boss.z - playerState.z);
        world.triggerLightningBoltVisual(boss.x, boss.y, boss.z);
        sound.playLightningThunderbolt();
        playerState.hitStopTimer = 0.085;
        camState.shakeIntensity = 0.48;

        const bolt = computeLightningBoltDamage(true);
        boss.hp = Math.max(0, boss.hp - bolt.hpDamage);
        boss.posture = Math.min(boss.maxPosture, boss.posture + bolt.postureDamage);
        boss.hitFlashTimer = 0.45;
        world.particlePool.spawnBurst(boss.x, boss.y + 2.8, boss.z, 55, true);

        spawnFloatingPopup(
          boss.x,
          boss.y + 4.8,
          boss.z,
          `⚡ -${bolt.hpDamage} HP`,
          'deathblow',
          'INDRA VAJRA SKY-LIGHTNING!'
        );

        if (boss.hp <= 0) {
          boss.defeated = true;
          boss.group.visible = false;
          sound.playDeathblow();
          sound.playRelicChime(true);
          world.particlePool.spawnBurst(boss.x, boss.y + 3.0, boss.z, 70, true);
          showCombatCallout(
            '⚡ INDRA VAJRA THUNDERBOLT OBLITERATED THE SEPTEMBER LAYOFF!',
            3.2
          );
          if (typeof document !== 'undefined' && document.pointerLockElement) {
            try {
              document.exitPointerLock?.();
            } catch {
              // ignore
            }
          }
          stateRef.current.onBossDefeated();
        } else {
          showCombatCallout(
            `⚡ INDRA VAJRA THUNDERBOLT STRUCK LAYOFF MONSTER (-${bolt.hpDamage} HP · ${boss.hp}/${boss.maxHp} LEFT)!`,
            2.4
          );
        }
      } else if (targetDemon) {
        playerState.yaw = Math.atan2(targetDemon.x - playerState.x, targetDemon.z - playerState.z);
        world.triggerLightningBoltVisual(targetDemon.x, targetDemon.y, targetDemon.z);
        sound.playLightningThunderbolt();
        playerState.hitStopTimer = 0.075;
        camState.shakeIntensity = 0.38;

        const dealt = targetDemon.hp;
        targetDemon.hp = 0;
        targetDemon.alive = false;
        targetDemon.group.visible = false;
        sound.playDeathblow();
        world.particlePool.spawnBurst(targetDemon.x, targetDemon.y + 1.5, targetDemon.z, 48, true);
        spawnFloatingPopup(
          targetDemon.x,
          targetDemon.y + 2.8,
          targetDemon.z,
          `⚡ -${dealt} HP`,
          'deathblow',
          `${targetDemon.name.toUpperCase()} VAPORIZED`
        );
        showCombatCallout(
          `⚡ INDRA VAJRA SKY-LIGHTNING VAPORIZED "${targetDemon.name.toUpperCase()}"!`,
          2.4
        );
      } else {
        const strikeX = playerState.x + Math.sin(playerState.yaw) * 5.0;
        const strikeZ = playerState.z + Math.cos(playerState.yaw) * 5.0;
        const strikeY = walkableSurfaceHeightAt(strikeX, strikeZ, playerState.y);
        world.triggerLightningBoltVisual(strikeX, strikeY, strikeZ);
        sound.playLightningThunderbolt();
        camState.shakeIntensity = 0.32;
        showCombatCallout('⚡ INDRA VAJRA SKY-LIGHTNING UNLEASHED!', 1.8);
      }
    };

    const awakenAndFocusLayoffBoss = () => {
      if (stateRef.current.activeStopId) {
        stateRef.current.onCloseStop();
      }
      const visitedCount = stateRef.current.visitedStopIds.size;
      const unlockedAllProjects = visitedCount >= PORTFOLIO_STOPS.length;

      playerState.x = 0;
      playerState.z = -39.5;
      playerState.y = walkableSurfaceHeightAt(0, -39.5, 0);
      playerState.vx = 0;
      playerState.vz = 0;
      playerState.vy = 0;
      playerState.yaw = Math.PI;
      playerState.grappleActive = false;
      camState.yaw = 0;
      camState.pitch = 0.15;
      camState.currentPos.set(0.36, playerState.y + 2.1, -35.2);
      camState.currentLook.set(0, playerState.y + 2.4, -45.8);
      world.playerRig.group.position.set(playerState.x, playerState.y, playerState.z);
      world.playerRig.group.rotation.y = playerState.yaw;
      world.particlePool.spawnBurst(0, playerState.y + 0.5, -39.5, 24, true);

      if (!unlockedAllProjects) {
        sound.playPerilousWarning();
        showCombatCallout(
          `🔒 UNLOCK FIGHT AFTER SEEING ALL THE PROJECTS (${visitedCount}/6 PROJECTS SEEN)`,
          3.4
        );
        return;
      }

      playerState.manualBossSummon = true;
      const boss = world.layoffBoss;
      if (!boss.awakened && !boss.defeated) {
        boss.awakened = true;
        boss.group.visible = true;
        sound.playBossAwaken();
      }
      boss.x = 0;
      boss.z = -48;
      boss.y = walkableSurfaceHeightAt(0, -48, 0);
      boss.group.position.set(boss.x, boss.y, boss.z);
      showCombatCallout(
        'ACT V · MAHA-ASURA AWAKENS! PRESS [Z] TO STRIKE DOWN ⚡ SKY-LIGHTNING BOLT!',
        3.2
      );
    };

    controllerRef.current = {
      teleportToStop(stopId: string) {
        const stop = PORTFOLIO_STOPS.find((s) => s.id === stopId);
        if (!stop) return;
        playerState.guidanceTargetId = stop.id;
        playerState.guidanceTargetKind = 'project';
        // Place player right at the foot of the front ceremonial stairs (+Z approach)
        playerState.x = stop.position.x;
        playerState.z = stop.position.z + 6.8;
        playerState.y = walkableSurfaceHeightAt(playerState.x, playerState.z, 2.0);
        playerState.vx = 0;
        playerState.vz = 0;
        playerState.vy = 0;
        playerState.grounded = true;
        playerState.isGliding = false;
        playerState.grappleActive = false;
        playerState.yaw = Math.PI;
        world.playerRig.group.position.set(playerState.x, playerState.y, playerState.z);
        world.playerRig.group.rotation.y = playerState.yaw;
        world.particlePool.spawnBurst(playerState.x, playerState.y + 0.5, playerState.z, 16, true);
        stateRef.current.onInspectStop(stop.id);
      },
      teleportToPoint(x: number, z: number, label?: string) {
        playerState.x = x;
        playerState.z = z;
        playerState.y = walkableSurfaceHeightAt(x, z, 2.0);
        playerState.vx = 0;
        playerState.vz = 0;
        playerState.vy = 0;
        playerState.grounded = true;
        playerState.isGliding = false;
        playerState.grappleActive = false;
        world.playerRig.group.position.set(playerState.x, playerState.y, playerState.z);
        world.particlePool.spawnBurst(playerState.x, playerState.y + 0.5, playerState.z, 16, true);
        sound.playTempleBell(528);
        if (label) {
          showCombatCallout(`FAST TRAVEL → ${label.toUpperCase()}`, 1.4);
        }
      },
      equipWeapon(weaponId: WeaponId) {
        performEquipWeapon(weaponId);
      },
      setGuidanceTarget(id: string, kind: 'project' | 'jewel' | 'weapon') {
        playerState.guidanceTargetId = id;
        playerState.guidanceTargetKind = kind;
      },
      resetToSpawn() {
        playerState.x = 0;
        playerState.z = 8.2;
        playerState.y = walkableSurfaceHeightAt(0, 8.2, 0);
        playerState.vx = 0;
        playerState.vz = 0;
        playerState.vy = 0;
        playerState.grounded = true;
        playerState.isGliding = false;
        playerState.grappleActive = false;
        playerState.yaw = Math.PI;
        playerState.hp = playerState.maxHp;
        playerState.outOfCombatTimer = 0;
        camState.yaw = 0;
        camState.pitch = 0.15;
        camState.distance = 4.15;
        world.playerRig.group.position.set(playerState.x, playerState.y, playerState.z);
        world.playerRig.group.rotation.y = playerState.yaw;
        world.particlePool.spawnBurst(0, playerState.y + 0.4, 8.2, 14, true);
        sound.playTempleBell(528);
      },
      restartFromBeginning() {
        playerState.x = 0;
        playerState.z = 8.2;
        playerState.y = walkableSurfaceHeightAt(0, 8.2, 0);
        playerState.vx = 0;
        playerState.vz = 0;
        playerState.vy = 0;
        playerState.grounded = true;
        playerState.isGliding = false;
        playerState.grappleActive = false;
        playerState.yaw = Math.PI;
        playerState.hp = playerState.maxHp;
        playerState.stamina = 100;
        playerState.outOfCombatTimer = 0;
        playerState.hurtFlashTimer = 0;
        playerState.equippedWeaponId = 'weapon-nandaka';
        playerState.guidanceTargetId = 'mandapa-origin';
        playerState.guidanceTargetKind = 'project';
        playerState.comboHitCount = 0;
        playerState.comboStage = 1;
        playerState.lightningCooldown = 0;
        playerState.manualBossSummon = false;
        camState.yaw = 0;
        camState.pitch = 0.15;
        camState.distance = 4.15;
        world.playerRig.group.position.set(playerState.x, playerState.y, playerState.z);
        world.playerRig.group.rotation.y = playerState.yaw;

        // Revive all 6 Corporate Asuras at full HP and home coordinates
        for (const demon of world.demons) {
          demon.alive = true;
          demon.hp = demon.maxHp;
          demon.posture = 0;
          demon.x = demon.homeX;
          demon.z = demon.homeZ;
          demon.y = walkableSurfaceHeightAt(demon.homeX, demon.homeZ, 0);
          demon.state = 'patrol';
          demon.stateTimer = 0;
          demon.attackCooldown = 0.8;
          demon.hitFlashTimer = 0;
          demon.group.visible = true;
          demon.group.position.set(demon.x, demon.y, demon.z);
        }

        // Reset Colossal September Layoff Boss to full 1600 HP
        const boss = world.layoffBoss;
        boss.awakened = false;
        boss.defeated = false;
        boss.hp = LAYOFF_BOSS_CONFIG.maxHp;
        boss.maxHp = LAYOFF_BOSS_CONFIG.maxHp;
        boss.posture = 0;
        boss.x = LAYOFF_BOSS_CONFIG.spawnPosition.x;
        boss.z = LAYOFF_BOSS_CONFIG.spawnPosition.z;
        boss.y = walkableSurfaceHeightAt(boss.x, boss.z, 0);
        boss.group.visible = false;
        boss.group.position.set(boss.x, boss.y, boss.z);

        world.particlePool.spawnBurst(0, playerState.y + 0.5, 8.2, 22, true);
        sound.playTempleBell(432);
        showCombatCallout('PORTFOLIO VERSE REBORN · BEGIN YOUR JOURNEY ANEW!', 2.2);
      },
      setVirtualInput(forward: number, right: number) {
        virtualInput.forward = forward;
        virtualInput.right = right;
      },
      triggerVirtualJump() {
        if (!playerState.grounded) {
          playerState.isGliding = !playerState.isGliding;
        } else {
          playerState.jumpBufferTimer = 0.14;
        }
      },
      triggerAttack(isNova = false) {
        performAttack(isNova);
      },
      triggerLightningBolt() {
        performLightningBolt();
      },
      triggerParryDeflect() {
        performParryDeflect();
      },
      triggerDodgeDash() {
        performDodgeDash();
      },
      triggerGrappleHook() {
        performGrappleHook();
      },
      summonLayoffBoss() {
        awakenAndFocusLayoffBoss();
      },
      setTimeOfDay(mode: TimeOfDay) {
        world.applyTimeOfDay(mode);
      },
      setWeatherPreset(preset: WeatherPresetId) {
        world.setWeatherPreset(preset);
      },
    };

    const isTypingInInput = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingInInput(e.target)) return;
      const code = e.code;

      if (stateRef.current.gameState === 'title') {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          keysHeld.clear();
          stateRef.current.onStartFromTitle();
        }
        return;
      }

      if (code === 'Escape') {
        if (stateRef.current.activeStopId) {
          e.preventDefault();
          stateRef.current.onCloseStop();
          return;
        }
        e.preventDefault();
        keysHeld.clear();
        stateRef.current.onTogglePause();
        return;
      }

      if (code === 'KeyP') {
        e.preventDefault();
        keysHeld.clear();
        stateRef.current.onTogglePause();
        return;
      }

      if (stateRef.current.gameState !== 'playing') return;

      if (!keysHeld.has(code)) {
        if (code === 'Space') {
          e.preventDefault();
          if (!playerState.grounded && playerState.vy < 1.5) {
            playerState.isGliding = !playerState.isGliding;
            if (playerState.isGliding) {
              showCombatCallout('GARUDA SKY-CLOAK GLIDER DEPLOYED', 1.2);
            }
          } else {
            playerState.jumpBufferTimer = 0.14;
          }
        } else if (code === 'Digit1') {
          performEquipWeapon('weapon-nandaka');
        } else if (code === 'Digit2') {
          performEquipWeapon('weapon-surya-greatsword');
        } else if (code === 'Digit3') {
          performEquipWeapon('weapon-agni-twinblades');
        } else if (code === 'Digit4') {
          performEquipWeapon('weapon-brahmastra-halberd');
        } else if (code === 'KeyF' || code === 'KeyJ') {
          e.preventDefault();
          performAttack(false);
        } else if (code === 'KeyQ') {
          e.preventDefault();
          performAttack(true);
        } else if (code === 'KeyZ') {
          e.preventDefault();
          performLightningBolt();
        } else if (code === 'KeyV') {
          e.preventDefault();
          performParryDeflect();
        } else if (code === 'KeyX' || code === 'ShiftLeft' || code === 'ShiftRight') {
          performDodgeDash();
        } else if (code === 'KeyG') {
          e.preventDefault();
          performGrappleHook();
        } else if (code === 'KeyB') {
          e.preventDefault();
          awakenAndFocusLayoffBoss();
        } else if (code === 'KeyE' || code === 'Enter') {
          const nearForge = findNearestWeaponForge({ x: playerState.x, z: playerState.z });
          if (nearForge.inRange) {
            e.preventDefault();
            performEquipWeapon(nearForge.nearestWeapon.id);
          } else {
            const near = findNearestStop({ x: playerState.x, z: playerState.z });
            if (near.inRange) {
              e.preventDefault();
              if (stateRef.current.activeStopId === near.nearestStop.id) {
                stateRef.current.onCloseStop();
              } else {
                stateRef.current.onInspectStop(near.nearestStop.id);
              }
            }
          }
        } else if (code === 'KeyR') {
          controllerRef.current?.resetToSpawn();
        }
      }

      keysHeld.add(code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.code);
    };

    let touchLookPointerId: number | null = null;
    let touchStartClientX = 0;
    let touchStartClientY = 0;
    let touchMovedDist = 0;

    // Direct 3D Raycast Picking on Monuments, Scroll Pedestals, Weapon Forges & Lotus Relics
    const _ndcPointer = new THREE.Vector2();
    const tryInteractWith3DWorldAtClientPoint = (clientX: number, clientY: number): boolean => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      _ndcPointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _ndcPointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_ndcPointer, camera);
      _raycaster.near = 0.2;
      _raycaster.far = 55;

      // 1) Check Weapon Forges first (clicking a 3D Forge Altar equips or tracks that weapon)
      for (const wf of FORGE_WEAPONS) {
        const wfRig = world.weaponForgeRigs.get(wf.id);
        if (!wfRig) continue;
        const hits = _raycaster.intersectObject(wfRig.group, true);
        if (hits.length > 0) {
          const dist = Math.hypot(wf.position.x - playerState.x, wf.position.z - playerState.z);
          if (dist <= 12.0) {
            performEquipWeapon(wf.id);
          } else {
            playerState.guidanceTargetId = wf.id;
            playerState.guidanceTargetKind = 'weapon';
            sound.playTempleBell(587.33);
            showCombatCallout(`TRACKING FORGE → ${wf.name.toUpperCase()}`, 1.4);
          }
          return true;
        }
      }

      // 2) Check Scroll Pedestals & Monument Artifacts (clicking an in-range sanctum opens its Codex; clicking a distant one grapples/tracks)
      for (const stop of PORTFOLIO_STOPS) {
        const monRig = world.monumentRigs.get(stop.id);
        if (!monRig) continue;
        const scrollHits = _raycaster.intersectObject(monRig.scrollPedestalMesh, true);
        const artifactHits =
          scrollHits.length > 0 ? scrollHits : _raycaster.intersectObject(monRig.artifactMesh, true);
        if (artifactHits.length > 0) {
          const dist = Math.hypot(
            stop.position.x - playerState.x,
            stop.position.z - playerState.z
          );
          if (dist <= 10.5) {
            stateRef.current.onInspectStop(stop.id);
          } else {
            playerState.guidanceTargetId = stop.id;
            playerState.guidanceTargetKind = 'project';
            sound.playTempleBell(528);
            showCombatCallout(`TRACKING SANCTUM → ${stop.title.toUpperCase()}`, 1.4);
          }
          return true;
        }
      }

      // 3) Check Uncollected Career Experience Lotus Relics
      for (const relic of LOTUS_RELICS) {
        if (stateRef.current.collectedRelicIds.has(relic.id)) continue;
        const rRig = world.relicRigs.get(relic.id);
        if (!rRig || !rRig.group.visible) continue;
        const hits = _raycaster.intersectObject(rRig.group, true);
        if (hits.length > 0) {
          playerState.guidanceTargetId = relic.id;
          playerState.guidanceTargetKind = 'jewel';
          sound.playTempleBell(659.25);
          showCombatCallout(`TRACKING JEWEL → ${relic.company.toUpperCase()}`, 1.4);
          return true;
        }
      }

      return false;
    };

    let mouseEdgePanDirX = 0;
    let mouseEdgePanDirY = 0;

    const clearInputsOnBlur = () => {
      keysHeld.clear();
      virtualInput.forward = 0;
      virtualInput.right = 0;
      hasPointerPos = false;
      touchLookPointerId = null;
      mouseEdgePanDirX = 0;
      mouseEdgePanDirY = 0;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (stateRef.current.gameState !== 'playing' || stateRef.current.activeStopId) return;
      if (e.pointerType === 'touch') {
        if (touchLookPointerId === null) {
          touchLookPointerId = e.pointerId;
          lastPointerX = e.clientX;
          lastPointerY = e.clientY;
          touchStartClientX = e.clientX;
          touchStartClientY = e.clientY;
          touchMovedDist = 0;
          hasPointerPos = true;
        }
        return;
      }
      if (e.button === 2) {
        if (document.pointerLockElement !== renderer.domElement) {
          try {
            renderer.domElement.requestPointerLock?.();
          } catch {
            // fallback to unlocked infinite edge-pan
          }
        }
        performParryDeflect();
        return;
      }
      if (e.button === 0) {
        if (
          document.pointerLockElement !== renderer.domElement &&
          tryInteractWith3DWorldAtClientPoint(e.clientX, e.clientY)
        ) {
          return;
        }
        if (document.pointerLockElement !== renderer.domElement) {
          try {
            renderer.domElement.requestPointerLock?.();
          } catch {
            // fallback to unlocked infinite edge-pan
          }
        }
        performAttack(false);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (stateRef.current.gameState !== 'playing' || stateRef.current.activeStopId) {
        hasPointerPos = false;
        mouseEdgePanDirX = 0;
        mouseEdgePanDirY = 0;
        return;
      }
      if (e.pointerType === 'touch') {
        if (touchLookPointerId !== null && e.pointerId !== touchLookPointerId) return;
        if (touchLookPointerId === null) {
          touchLookPointerId = e.pointerId;
          lastPointerX = e.clientX;
          lastPointerY = e.clientY;
          touchStartClientX = e.clientX;
          touchStartClientY = e.clientY;
          touchMovedDist = 0;
          hasPointerPos = true;
          return;
        }
        touchMovedDist = Math.hypot(
          e.clientX - touchStartClientX,
          e.clientY - touchStartClientY
        );
      }

      const isLocked = document.pointerLockElement === renderer.domElement;
      if (!hasPointerPos && !isLocked) {
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        hasPointerPos = true;
        return;
      }

      // Infinite 360° Mouse Panning: use movementX/movementY directly (whether pointer-locked or unlocked)
      const rawMovementX =
        typeof e.movementX === 'number' && e.pointerType !== 'touch'
          ? THREE.MathUtils.clamp(e.movementX, -320, 320)
          : 0;
      const rawMovementY =
        typeof e.movementY === 'number' && e.pointerType !== 'touch'
          ? THREE.MathUtils.clamp(e.movementY, -320, 320)
          : 0;

      const dx =
        e.pointerType !== 'touch' && (isLocked || Math.abs(rawMovementX) > 0)
          ? rawMovementX
          : e.clientX - lastPointerX;
      const dy =
        e.pointerType !== 'touch' && (isLocked || Math.abs(rawMovementY) > 0)
          ? rawMovementY
          : e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      // Continuous Infinite Edge-Panning fallback when pointer is near viewport borders without Pointer Lock
      if (!isLocked && e.pointerType !== 'touch') {
        const vw = window.innerWidth || 1280;
        const vh = window.innerHeight || 720;
        const edgeZone = Math.min(72, vw * 0.07);
        if (e.clientX <= edgeZone) {
          mouseEdgePanDirX = -((edgeZone - e.clientX) / edgeZone);
        } else if (e.clientX >= vw - edgeZone) {
          mouseEdgePanDirX = (e.clientX - (vw - edgeZone)) / edgeZone;
        } else {
          mouseEdgePanDirX = 0;
        }
        const vEdgeZone = Math.min(54, vh * 0.07);
        if (e.clientY <= vEdgeZone) {
          mouseEdgePanDirY = -((vEdgeZone - e.clientY) / vEdgeZone);
        } else if (e.clientY >= vh - vEdgeZone) {
          mouseEdgePanDirY = (e.clientY - (vh - vEdgeZone)) / vEdgeZone;
        } else {
          mouseEdgePanDirY = 0;
        }
      } else {
        mouseEdgePanDirX = 0;
        mouseEdgePanDirY = 0;
      }

      const sensitivity = e.pointerType === 'touch' ? 0.0062 : 0.0046;
      if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        camState.yaw -= dx * sensitivity;
        camState.pitch = THREE.MathUtils.clamp(
          camState.pitch + dy * (sensitivity * 0.8),
          0.04,
          0.88
        );
        camState.lastMousePanTime = performance.now();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId === touchLookPointerId) {
        if (touchMovedDist < 12 && stateRef.current.gameState === 'playing' && !stateRef.current.activeStopId) {
          tryInteractWith3DWorldAtClientPoint(e.clientX, e.clientY);
        }
        touchLookPointerId = null;
        hasPointerPos = false;
      }
    };

    const onWheel = (e: WheelEvent) => {
      camState.distance = THREE.MathUtils.clamp(camState.distance + e.deltaY * 0.004, 2.8, 12.5);
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputsOnBlur);
    document.addEventListener('visibilitychange', clearInputsOnBlur);
    window.addEventListener('resize', onResize);

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    domElem.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: true });

    let frameId = 0;
    let isDisposed = false;
    let lastTime = performance.now();
    let elapsedTotal = 0;
    let lastHudEmitTime = 0;

    function afterDraw(cb: () => void) {
      if (isDisposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function pollGamepad(dt: number): { forward: number; right: number; sprint: boolean } {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      let activePad: Gamepad | null = null;
      for (let i = 0; i < pads.length; i++) {
        if (pads[i] && pads[i]!.connected) {
          activePad = pads[i];
          break;
        }
      }

      const isConnected = Boolean(activePad);
      if (isConnected !== gamepadWasConnected) {
        gamepadWasConnected = isConnected;
        stateRef.current.onGamepadStatusChange(isConnected);
      }

      if (!activePad) {
        return { forward: 0, right: 0, sprint: false };
      }

      const leftStick = applyRadialDeadzone(activePad.axes[0] || 0, activePad.axes[1] || 0, 0.15);
      let forward = -leftStick.y;
      let right = leftStick.x;

      if (activePad.buttons[12]?.pressed) forward += 1;
      if (activePad.buttons[13]?.pressed) forward -= 1;
      if (activePad.buttons[14]?.pressed) right -= 1;
      if (activePad.buttons[15]?.pressed) right += 1;

      const rightStick = applyRadialDeadzone(activePad.axes[2] || 0, activePad.axes[3] || 0, 0.15);
      if (Math.abs(rightStick.x) > 0 || Math.abs(rightStick.y) > 0) {
        camState.yaw -= rightStick.x * 2.2 * dt;
        camState.pitch = THREE.MathUtils.clamp(camState.pitch + rightStick.y * 1.6 * dt, 0.04, 0.88);
        camState.lastMousePanTime = performance.now();
      }

      const btnA = Boolean(activePad.buttons[0]?.pressed);
      const btnB = Boolean(activePad.buttons[1]?.pressed);
      const btnX = Boolean(activePad.buttons[2]?.pressed);
      const btnY = Boolean(activePad.buttons[3]?.pressed);
      const btnLB = Boolean(activePad.buttons[4]?.pressed);
      const btnStart = Boolean(activePad.buttons[9]?.pressed);

      if (btnStart && !prevGamepadButtons[9]) {
        if (stateRef.current.gameState === 'title') {
          stateRef.current.onStartFromTitle();
        } else {
          stateRef.current.onTogglePause();
        }
      }
      if (btnA && !prevGamepadButtons[0]) {
        if (stateRef.current.gameState === 'title') {
          stateRef.current.onStartFromTitle();
        } else if (stateRef.current.gameState === 'playing') {
          if (!playerState.grounded) {
            playerState.isGliding = !playerState.isGliding;
          } else {
            playerState.jumpBufferTimer = 0.14;
          }
        }
      }
      if (btnX && !prevGamepadButtons[2] && stateRef.current.gameState === 'playing') {
        const near = findNearestStop({ x: playerState.x, z: playerState.z });
        if (near.inRange && !stateRef.current.activeStopId) {
          stateRef.current.onInspectStop(near.nearestStop.id);
        } else {
          performAttack(false);
        }
      }
      if (btnY && !prevGamepadButtons[3] && stateRef.current.gameState === 'playing') {
        performAttack(true);
      }
      if (btnLB && !prevGamepadButtons[4] && stateRef.current.gameState === 'playing') {
        performGrappleHook();
      }
      if (btnB && !prevGamepadButtons[1]) {
        if (stateRef.current.activeStopId) {
          stateRef.current.onCloseStop();
        } else if (stateRef.current.gameState === 'playing') {
          performParryDeflect();
        }
      }

      prevGamepadButtons[0] = btnA;
      prevGamepadButtons[1] = btnB;
      prevGamepadButtons[2] = btnX;
      prevGamepadButtons[3] = btnY;
      prevGamepadButtons[4] = btnLB;
      prevGamepadButtons[9] = btnStart;

      const sprint = Boolean(
        activePad.buttons[10]?.pressed || activePad.buttons[5]?.pressed || activePad.buttons[7]?.pressed
      );
      return { forward, right, sprint };
    }

    function tick() {
      if (isDisposed) return;

      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const frameDt = Math.min(Math.max(rawDt, 0.001), 0.05);

      if (playerState.hitStopTimer > 0) {
        playerState.hitStopTimer = Math.max(0, playerState.hitStopTimer - frameDt);
      }
      const dt = playerState.hitStopTimer > 0 ? frameDt * 0.12 : frameDt;

      const currentMode = stateRef.current.gameState;
      const activeStopIdNow = stateRef.current.activeStopId;
      const visitedStopsNow = stateRef.current.visitedStopIds;
      const collectedRelicsNow = stateRef.current.collectedRelicIds;

      if (currentMode !== 'paused') {
        elapsedTotal += dt;
      }

      const gpInput = pollGamepad(frameDt);

      // Update relic mesh visibility
      for (const relic of LOTUS_RELICS) {
        const rig = world.relicRigs.get(relic.id);
        if (rig) {
          rig.group.visible = !collectedRelicsNow.has(relic.id);
        }
      }

      // Sync Player Power & Equipped Weapon Visuals
      const combatStats = computePlayerCombatStats(
        visitedStopsNow,
        PORTFOLIO_STOPS,
        playerState.equippedWeaponId
      );
      world.updatePlayerPowerVisuals(
        combatStats.unlockedPowersCount,
        combatStats.activeColorHex,
        playerState.equippedWeaponId
      );

      // Check if Colossal September Layoff Boss should awaken (ONLY after all 6 projects have been visited!)
      const boss = world.layoffBoss;
      if (
        !boss.awakened &&
        !boss.defeated &&
        shouldAwakenLayoffBoss(
          visitedStopsNow.size,
          collectedRelicsNow.size,
          playerState.manualBossSummon
        )
      ) {
        boss.awakened = true;
        boss.group.visible = true;
        sound.playBossAwaken();
        showCombatCallout(
          '⚡ ALL 6 PROJECTS SEEN — THE LAYOFF BOSS & [Z] SKY-LIGHTNING BOLT UNLOCKED!',
          3.2
        );
      }

      // Update 3D Boss Lock Hologram at the Northern Citadel (visible during gameplay whenever visitedStopsNow.size < 6)
      world.updateBossLockHologram(
        currentMode === 'title' ? 6 : visitedStopsNow.size,
        boss.awakened,
        boss.defeated,
        elapsedTotal
      );

      for (const d of world.demons) {
        d.hpBarGroup.visible = currentMode !== 'title' && d.alive;
      }

      if (currentMode === 'title') {
        sound.setMusicMood('silent');
        const sway = elapsedTotal * 0.22;
        _desiredCamPos.set(
          Math.sin(sway) * 2.4,
          4.8 + Math.sin(elapsedTotal * 0.35) * 0.25,
          15.2 + Math.cos(sway) * 1.1
        );
        _desiredLookAt.set(Math.sin(sway) * 0.6, 5.4, -22);
        camera.position.lerp(_desiredCamPos, 1 - Math.exp(-5 * frameDt));
        camera.lookAt(_desiredLookAt);

        world.updateWorldAnimations(elapsedTotal, dt, null, null, 0, 0, false, false, 1, false);
      } else if (currentMode === 'paused') {
        sound.setMusicMood('silent');
      } else if (currentMode === 'playing' || currentMode === 'gameover') {
        playerState.attackTimer = Math.max(0, playerState.attackTimer - frameDt);
        playerState.attackCooldown = Math.max(0, playerState.attackCooldown - frameDt);
        playerState.comboResetTimer = Math.max(0, playerState.comboResetTimer - frameDt);
        playerState.outOfCombatTimer = Math.max(0, playerState.outOfCombatTimer - frameDt);
        playerState.hurtFlashTimer = Math.max(0, playerState.hurtFlashTimer - frameDt * 1.8);
        playerState.lightningCooldown = Math.max(0, playerState.lightningCooldown - frameDt);

        // Apply continuous infinite edge-panning when cursor rests near screen edges
        if (!activeStopIdNow && currentMode === 'playing') {
          if (Math.abs(mouseEdgePanDirX) > 0.01) {
            camState.yaw -= mouseEdgePanDirX * 2.15 * frameDt;
            camState.lastMousePanTime = now;
          }
          if (Math.abs(mouseEdgePanDirY) > 0.01) {
            camState.pitch = THREE.MathUtils.clamp(
              camState.pitch + mouseEdgePanDirY * 1.15 * frameDt,
              0.04,
              0.88
            );
            camState.lastMousePanTime = now;
          }
        }

        if (playerState.comboStreakDecayTimer > 0) {
          playerState.comboStreakDecayTimer = Math.max(0, playerState.comboStreakDecayTimer - frameDt);
          if (playerState.comboStreakDecayTimer <= 0) {
            playerState.comboHitCount = 0;
          }
        }
        playerState.parryTimer = Math.max(0, playerState.parryTimer - frameDt);
        playerState.parryCooldown = Math.max(0, playerState.parryCooldown - frameDt);
        playerState.dodgeIframeTimer = Math.max(0, playerState.dodgeIframeTimer - frameDt);
        playerState.dodgeCooldown = Math.max(0, playerState.dodgeCooldown - frameDt);
        playerState.dashTimer = Math.max(0, playerState.dashTimer - frameDt);
        if (playerState.combatCalloutTimer > 0) {
          playerState.combatCalloutTimer = Math.max(0, playerState.combatCalloutTimer - frameDt);
          if (playerState.combatCalloutTimer <= 0) {
            playerState.combatCallout = null;
          }
        }

        // Age floating combat popups
        for (let i = activePopups.length - 1; i >= 0; i--) {
          activePopups[i].age += frameDt;
          activePopups[i].worldY += 0.85 * frameDt;
          if (activePopups[i].age >= activePopups[i].duration) {
            activePopups.splice(i, 1);
          }
        }

        // Out-of-Combat Prana Regeneration ONLY (Never erase damage during active combat!)
        if (playerState.outOfCombatTimer <= 0 && playerState.hp < playerState.maxHp && playerState.hp > 0) {
          playerState.hp = Math.min(
            playerState.maxHp,
            playerState.hp + (5.0 + combatStats.unlockedPowersCount * 1.5) * dt
          );
        }

        let moveForward = gpInput.forward + virtualInput.forward;
        let moveRight = gpInput.right + virtualInput.right;

        if (!activeStopIdNow && currentMode === 'playing') {
          if (keysHeld.has('KeyW') || keysHeld.has('ArrowUp')) moveForward += 1;
          if (keysHeld.has('KeyS') || keysHeld.has('ArrowDown')) moveForward -= 1;
          if (keysHeld.has('KeyD') || keysHeld.has('ArrowRight')) moveRight += 1;
          if (keysHeld.has('KeyA') || keysHeld.has('ArrowLeft')) moveRight -= 1;
          if (keysHeld.has('KeyC')) {
            camState.yaw -= 1.8 * dt;
            camState.lastMousePanTime = now;
          }
        }

        const isSprinting =
          gpInput.sprint || keysHeld.has('ShiftLeft') || keysHeld.has('ShiftRight');

        const moveVec = computeMovementVector(
          { forward: moveForward, right: moveRight, sprint: isSprinting },
          camState.yaw
        );

        let actualHorizontalSpeed = 0;

        // 1. Handle Shinobi Grapple Hook Zip Trajectory
        if (playerState.grappleActive) {
          const gdx = playerState.grappleTargetX - playerState.x;
          const gdz = playerState.grappleTargetZ - playerState.z;
          const gdy = playerState.grappleTargetY - playerState.y;
          const dist3D = Math.hypot(gdx, gdy, gdz);

          world.updateGrappleLine(
            true,
            playerState.x,
            playerState.y + 1.35,
            playerState.z,
            playerState.grappleAnchorX,
            playerState.grappleAnchorY,
            playerState.grappleAnchorZ
          );

          if (dist3D < 1.2) {
            playerState.x = playerState.grappleTargetX;
            playerState.z = playerState.grappleTargetZ;
            playerState.y = walkableSurfaceHeightAt(
              playerState.x,
              playerState.z,
              playerState.grappleTargetY
            );
            playerState.vx = 0;
            playerState.vz = 0;
            playerState.vy = 0;
            playerState.grounded = true;
            playerState.grappleActive = false;
            world.updateGrappleLine(false);
            world.particlePool.spawnBurst(playerState.x, playerState.y + 0.5, playerState.z, 18, true);
          } else {
            const zipSpeed = 34;
            playerState.x += (gdx / dist3D) * zipSpeed * dt;
            playerState.z += (gdz / dist3D) * zipSpeed * dt;
            playerState.y += (gdy / dist3D) * zipSpeed * dt + 2.8 * dt;
            playerState.distanceTraveled += zipSpeed * dt;
            actualHorizontalSpeed = zipSpeed;
          }
        } else {
          world.updateGrappleLine(false);

          // 2. Momentum-Damped Horizontal Physics + Step-Height / Wall Check
          const glideSpeedMult = playerState.isGliding ? PARAGLIDE_SPEED_MULTIPLIER : 1.0;
          const targetVx = moveVec.vx * glideSpeedMult;
          const targetVz = moveVec.vz * glideSpeedMult;

          const hasMoveInput = moveVec.speed > 0.05;
          const inertiaRate = playerState.grounded
            ? hasMoveInput
              ? 18.0
              : 13.0
            : hasMoveInput
            ? 8.5
            : 4.5;
          const inertiaBlend = 1 - Math.exp(-inertiaRate * dt);

          playerState.vx = THREE.MathUtils.lerp(playerState.vx, targetVx, inertiaBlend);
          playerState.vz = THREE.MathUtils.lerp(playerState.vz, targetVz, inertiaBlend);

          const dashBurstSpeed = playerState.dodgeIframeTimer > 0 ? 15.5 : 12.5;
          const dashVx = playerState.dashTimer > 0 ? playerState.dashDirX * dashBurstSpeed : 0;
          const dashVz = playerState.dashTimer > 0 ? playerState.dashDirZ * dashBurstSpeed : 0;

          const totalVx = playerState.vx + dashVx;
          const totalVz = playerState.vz + dashVz;
          actualHorizontalSpeed = Math.hypot(totalVx, totalVz);

          if (actualHorizontalSpeed > 0.02) {
            const nextX = playerState.x + totalVx * dt;
            const nextZ = playerState.z + totalVz * dt;
            const resolved = resolveCollisions({ x: nextX, z: nextZ }, PLAYER_RADIUS, colliders);

            // Prevent walking horizontally through tall un-steppable platform ledges (>0.72m high) unless jumping above them
            const highSurfaceAtNext = walkableSurfaceHeightAt(resolved.x, resolved.z, playerState.y + 1.4);
            const stepRise = highSurfaceAtNext - playerState.y;
            if (stepRise <= 0.72 || !playerState.grounded) {
              const stepDist = Math.hypot(resolved.x - playerState.x, resolved.z - playerState.z);
              playerState.x = resolved.x;
              playerState.z = resolved.z;
              playerState.walkCycleDist += stepDist;
              playerState.distanceTraveled += stepDist;
            } else {
              // Slide along the platform edge instead of clipping inside it
              const tryX = walkableSurfaceHeightAt(resolved.x, playerState.z, playerState.y + 1.4);
              const tryZ = walkableSurfaceHeightAt(playerState.x, resolved.z, playerState.y + 1.4);
              if (tryX - playerState.y <= 0.72) {
                playerState.x = resolved.x;
              } else if (tryZ - playerState.y <= 0.72) {
                playerState.z = resolved.z;
              }
            }

            if (moveVec.targetYaw !== null) {
              const prevYaw = playerState.yaw;
              playerState.yaw = dampAngle(playerState.yaw, moveVec.targetYaw, 13, dt);
              const yawDelta = playerState.yaw - prevYaw;
              playerState.bankRoll = THREE.MathUtils.lerp(
                playerState.bankRoll,
                THREE.MathUtils.clamp(-yawDelta * 2.2, -0.18, 0.18),
                1 - Math.exp(-10 * dt)
              );
            }

            if (now - camState.lastMousePanTime > 2400 && hasMoveInput) {
              const desiredCamYaw = playerState.yaw + Math.PI;
              camState.yaw = dampAngle(camState.yaw, desiredCamYaw, 0.95, dt);
            }

            if (playerState.grounded && playerState.walkCycleDist - playerState.lastStepDist > 1.85) {
              playerState.lastStepDist = playerState.walkCycleDist;
              sound.playFootstep(isSprinting);
              world.particlePool.spawnBurst(playerState.x, playerState.y, playerState.z, 4, false);
            }
          } else {
            playerState.bankRoll = THREE.MathUtils.lerp(playerState.bankRoll, 0, 1 - Math.exp(-12 * dt));
          }

          // 3. 3D Walkable Surface Elevation (Stairs, Plinths, Bridges, Pedestals, Boulders) + Jump & Paraglider
          const surfaceY = walkableSurfaceHeightAt(playerState.x, playerState.z, playerState.y);
          if (playerState.grounded) {
            playerState.coyoteTimer = 0.12;
            playerState.isGliding = false;
          } else {
            playerState.coyoteTimer = Math.max(0, playerState.coyoteTimer - dt);
          }

          if (playerState.jumpBufferTimer > 0) {
            playerState.jumpBufferTimer = Math.max(0, playerState.jumpBufferTimer - dt);
            if (playerState.coyoteTimer > 0) {
              playerState.vy = 8.8;
              playerState.grounded = false;
              playerState.coyoteTimer = 0;
              playerState.jumpBufferTimer = 0;
              playerState.scaleX = 0.84;
              playerState.scaleY = 1.2;
              sound.playJump(false);
              world.particlePool.spawnBurst(playerState.x, surfaceY, playerState.z, 6, false);
            }
          }

          if (!playerState.grounded || playerState.vy > 0) {
            const wantsGlide =
              playerState.isGliding || (keysHeld.has('Space') && playerState.vy < -0.5);
            const glideStep = computeParagliderPhysics(
              playerState.vy,
              wantsGlide,
              false,
              playerState.stamina,
              dt
            );
            playerState.vy = glideStep.vy;
            playerState.isGliding = glideStep.isGliding;
            playerState.stamina = glideStep.nextStamina;

            playerState.y += playerState.vy * dt;
            if (playerState.y <= surfaceY && playerState.vy <= 0) {
              playerState.y = surfaceY;
              playerState.vy = 0;
              playerState.grounded = true;
              playerState.isGliding = false;
              playerState.scaleX = 1.22;
              playerState.scaleY = 0.78;
              sound.playJump(true);
              world.particlePool.spawnBurst(playerState.x, surfaceY, playerState.z, 8, false);
            }
          } else {
            // Smoothly step up/down onto temple staircases, plinths, bridges, and pedestals
            const heightDiff = surfaceY - playerState.y;
            if (heightDiff < -0.55) {
              // Stepped off a high ledge -> start falling naturally
              playerState.grounded = false;
              playerState.vy = 0;
            } else {
              playerState.y = THREE.MathUtils.lerp(
                playerState.y,
                surfaceY,
                1 - Math.exp(-26 * dt)
              );
            }

            if (actualHorizontalSpeed > 7.5) {
              playerState.stamina = Math.max(15, playerState.stamina - 14 * dt);
            } else {
              playerState.stamina = Math.min(100, playerState.stamina + 26 * dt);
            }
          }
        }

        const scaleDamp = 1 - Math.exp(-14 * dt);
        playerState.scaleX = THREE.MathUtils.lerp(playerState.scaleX, 1, scaleDamp);
        playerState.scaleY = THREE.MathUtils.lerp(playerState.scaleY, 1, scaleDamp);

        const surfaceYNow = walkableSurfaceHeightAt(playerState.x, playerState.z, playerState.y);
        const rig = world.playerRig;
        rig.group.position.set(playerState.x, playerState.y, playerState.z);
        rig.group.rotation.y = playerState.yaw;
        rig.group.rotation.z = playerState.bankRoll;
        rig.bodyGroup.scale.set(playerState.scaleX, playerState.scaleY, playerState.scaleX);

        const speedRatio = Math.min(1, actualHorizontalSpeed / 8.5);
        const gaitPhase = playerState.walkCycleDist * 2.2;
        const swingAmp = 0.58 * speedRatio;
        rig.leftLeg.rotation.x = Math.sin(gaitPhase) * swingAmp;
        rig.rightLeg.rotation.x = -Math.sin(gaitPhase) * swingAmp;
        rig.leftArm.rotation.x = -Math.sin(gaitPhase) * swingAmp * 0.85;
        rig.cloakMesh.rotation.x =
          0.14 +
          Math.abs(Math.sin(gaitPhase)) * 0.18 * speedRatio +
          (playerState.dodgeIframeTimer > 0 ? 0.35 : playerState.grounded ? 0 : 0.25);

        rig.shadowDisc.position.y = Math.max(0.015, surfaceYNow - playerState.y + 0.015);
        const heightAboveFloor = Math.max(0, playerState.y - surfaceYNow);
        rig.shadowDisc.scale.setScalar(Math.max(0.35, 1 - heightAboveFloor * 0.18));

        // Update Dynamic Shadow Camera Frustum around the Player
        world.updateShadowCamera(playerState.x, playerState.z);

        // 4. Update Roaming Asura Demons Active Combat AI (Patrol -> Chase -> Windup -> Lunge Strike -> Recover)
        let nearestDemonDist = Infinity;
        let nearestDemonName: string | null = null;
        let engagedDemonEntity: (typeof world.demons)[number] | null = null;
        let aliveDemonsCount = 0;

        for (const demon of world.demons) {
          if (!demon.alive) continue;
          aliveDemonsCount += 1;

          demon.hitFlashTimer = Math.max(0, demon.hitFlashTimer - dt);
          if (demon.hitFlashTimer <= 0 && demon.posture < demon.maxPosture && demon.state === 'patrol') {
            demon.posture = Math.max(0, demon.posture - 2.0 * dt);
          }

          if (demon.mixer) {
            demon.mixer.update(dt);
          }

          const prevState = demon.state;
          const aiStep = stepDemonCombatAI(
            {
              x: demon.x,
              z: demon.z,
              homeX: demon.homeX,
              homeZ: demon.homeZ,
              aggroRange: demon.aggroRange,
              moveSpeed: demon.moveSpeed,
              archetype: demon.archetype,
              state: demon.state,
              stateTimer: demon.stateTimer,
              attackCooldown: demon.attackCooldown,
              yaw: demon.yaw,
            },
            { x: playerState.x, z: playerState.z },
            elapsedTotal,
            dt,
            Boolean(activeStopIdNow)
          );

          demon.x = aiStep.x;
          demon.z = aiStep.z;
          demon.yaw = aiStep.yaw;
          demon.state = aiStep.state;
          demon.stateTimer = aiStep.stateTimer;
          demon.attackCooldown = aiStep.attackCooldown;

          const distToPlayer = Math.hypot(playerState.x - demon.x, playerState.z - demon.z);
          if (distToPlayer < nearestDemonDist) {
            nearestDemonDist = distToPlayer;
            nearestDemonName = demon.name;
            engagedDemonEntity = demon;
          }

          // Switch skeletal clip based on AI state
          if (demon.state === 'chase' || demon.state === 'strike') {
            demon.setClip('run');
          } else {
            demon.setClip('walk');
          }

          // Play Perilous Warning chime when an enemy begins its attack windup!
          if (prevState !== 'windup' && demon.state === 'windup') {
            sound.playPerilousWarning();
          }

          // Execute Enemy Lunge Strike against the Player!
          if (aiStep.didStrikePlayer) {
            playerState.outOfCombatTimer = 6.5;
            const defenseOutcome = resolveCombatDefense(
              demon.attackDamage,
              32,
              playerState.parryTimer,
              playerState.dodgeIframeTimer
            );

            if (defenseOutcome.isPerfectDeflect) {
              playerState.comboHitCount += 2;
              playerState.comboStreakDecayTimer = 4.5;
              playerState.stamina = Math.min(100, playerState.stamina + defenseOutcome.staminaRestored);
              demon.posture = Math.min(
                demon.maxPosture,
                demon.posture + defenseOutcome.enemyPostureDamageDealt
              );
              demon.hitFlashTimer = 0.28;
              demon.state = 'stagger';
              demon.stateTimer = 0.7;
              sound.playParryClang(true);
              playerState.hitStopTimer = 0.045;
              camState.shakeIntensity = 0.22;
              spawnFloatingPopup(
                demon.x,
                demon.y + 2.3,
                demon.z,
                `+${defenseOutcome.enemyPostureDamageDealt} POSTURE`,
                'parry',
                'PERFECT DEFLECT'
              );
              showCombatCallout('PERFECT SEKIRO DEFLECT!', 1.4);
              world.particlePool.spawnBurst(demon.x, demon.y + 1.4, demon.z, 24, true);
            } else if (defenseOutcome.isPerfectDodge) {
              playerState.comboHitCount += 1;
              playerState.comboStreakDecayTimer = 4.5;
              playerState.stamina = Math.min(100, playerState.stamina + defenseOutcome.staminaRestored);
              demon.posture = Math.min(
                demon.maxPosture,
                demon.posture + defenseOutcome.enemyPostureDamageDealt
              );
              sound.playDash(true);
              spawnFloatingPopup(
                playerState.x,
                playerState.y + 2.1,
                playerState.z,
                'SHADOW STEP',
                'parry',
                '+25 STAMINA'
              );
              showCombatCallout('PERFECT SHADOW-STEP DODGE · +25 STAMINA', 1.3);
            } else {
              // Real Player HP Reduction + Hurt Sound + Red Vignette + Knockback!
              const dmg = defenseOutcome.hpDamageTaken;
              playerState.hp = Math.max(0, playerState.hp - dmg);
              playerState.hurtFlashTimer = 0.75;
              camState.shakeIntensity = 0.22;
              sound.playPlayerHurt();
              spawnFloatingPopup(
                playerState.x,
                playerState.y + 2.0,
                playerState.z,
                `-${dmg} PRANA`,
                'deathblow',
                `${demon.name.toUpperCase()} STRIKE`
              );
              world.particlePool.spawnBurst(
                playerState.x,
                playerState.y + 1.1,
                playerState.z,
                16,
                false
              );

              if (playerState.hp <= 0) {
                playerState.hp = 0;
                sound.playPlayerDeath();
                showCombatCallout(`SLAIN BY ${demon.name.toUpperCase()} — PRANA EXTINGUISHED!`, 3.0);
                if (typeof document !== 'undefined' && document.pointerLockElement) {
                  try {
                    document.exitPointerLock?.();
                  } catch {
                    // ignore
                  }
                }
                stateRef.current.onPlayerDied();
              } else {
                showCombatCallout(
                  `STRUCK BY ${demon.name.toUpperCase()} (-${dmg} HP) · PRESS [RMB] TO DEFLECT!`,
                  1.5
                );
              }
            }
          }

          demon.y = walkableSurfaceHeightAt(demon.x, demon.z, demon.y);
          demon.group.position.set(demon.x, demon.y, demon.z);
          demon.bodyGroup.rotation.y = demon.yaw;

          // Demon Windup, Lunge Slash Arc & Telegraph Ring Visuals
          if (demon.state === 'windup') {
            const windPct = 1 - demon.stateTimer / 0.48;
            demon.leftArm.rotation.x = -1.45 * windPct;
            demon.rightArm.rotation.x = -1.45 * windPct;
            demon.bodyGroup.rotation.x = -0.18 * windPct;
            if (demon.telegraphRingMesh.material instanceof THREE.MeshBasicMaterial) {
              demon.telegraphRingMesh.material.opacity = 0.35 + windPct * 0.55;
              demon.telegraphRingMesh.scale.setScalar(0.8 + windPct * 0.45);
            }
            if (demon.slashArcMesh.material instanceof THREE.MeshBasicMaterial) {
              demon.slashArcMesh.material.opacity = 0;
            }
          } else if (demon.state === 'strike') {
            const strikePct = 1 - demon.stateTimer / 0.26;
            demon.leftArm.rotation.x = 0.95;
            demon.rightArm.rotation.x = 1.15;
            demon.bodyGroup.rotation.x = 0.28;
            demon.slashArcMesh.rotation.y = -1.2 + strikePct * 2.5;
            demon.slashArcMesh.scale.setScalar(0.95 + strikePct * 0.45);
            if (demon.slashArcMesh.material instanceof THREE.MeshBasicMaterial) {
              demon.slashArcMesh.material.opacity = Math.sin(strikePct * Math.PI) * 0.92;
            }
            if (demon.telegraphRingMesh.material instanceof THREE.MeshBasicMaterial) {
              demon.telegraphRingMesh.material.opacity = 0.25;
            }
          } else {
            const swing = Math.sin(elapsedTotal * 5 + demon.homeX) * 0.45;
            demon.leftArm.rotation.x = swing;
            demon.rightArm.rotation.x = -swing;
            demon.bodyGroup.rotation.x = demon.hitFlashTimer > 0 ? -0.32 : 0;
            if (demon.slashArcMesh.material instanceof THREE.MeshBasicMaterial) {
              demon.slashArcMesh.material.opacity = 0;
            }
            if (demon.telegraphRingMesh.material instanceof THREE.MeshBasicMaterial) {
              demon.telegraphRingMesh.material.opacity = 0;
            }
          }

          const hitScale = demon.hitFlashTimer > 0 ? demon.scale * 1.16 : demon.scale;
          demon.bodyGroup.scale.setScalar(hitScale);

          // Update Left-Aligned Framed 3D Vitality & Posture Bars above Demon
          demon.hpBarGroup.lookAt(camera.position);
          const hpRatio = THREE.MathUtils.clamp(demon.hp / demon.maxHp, 0.0, 1.0);
          demon.hpBarFill.scale.x = Math.max(0.001, hpRatio);

          const postureRatio = THREE.MathUtils.clamp(demon.posture / demon.maxPosture, 0.0, 1.0);
          demon.postureBarFill.scale.x = Math.max(0.001, postureRatio);

          demon.kanjiSprite.visible =
            demon.posture >= demon.maxPosture * 0.8 ||
            demon.state === 'windup' ||
            demon.state === 'strike';
        }

        // 5. Update Colossal September Layoff Boss AI, Sekiro Posture & Perilous Attacks
        let bossDistToPlayer = Infinity;
        if (boss.awakened && !boss.defeated) {
          boss.hitFlashTimer = Math.max(0, boss.hitFlashTimer - dt);
          boss.attackTimer += dt;
          boss.crownRing.rotation.z = elapsedTotal * 1.4;
          if (boss.mixer) {
            boss.mixer.update(dt);
          }

          const bdx = playerState.x - boss.x;
          const bdz = playerState.z - boss.z;
          const bDist = Math.hypot(bdx, bdz);
          bossDistToPlayer = bDist;

          if (bDist < 36 && bDist > 3.1 && !activeStopIdNow) {
            boss.x += (bdx / bDist) * 4.25 * dt;
            boss.z += (bdz / bDist) * 4.25 * dt;
          } else if (bDist <= 5.3 && boss.attackTimer > 1.85 && !activeStopIdNow) {
            boss.attackTimer = 0;
            playerState.outOfCombatTimer = 6.5;
            const bossDefense = resolveCombatDefense(
              26,
              52,
              playerState.parryTimer,
              playerState.dodgeIframeTimer
            );
            if (bossDefense.isPerfectDeflect) {
              playerState.comboHitCount += 2;
              playerState.comboStreakDecayTimer = 4.5;
              playerState.stamina = Math.min(100, playerState.stamina + bossDefense.staminaRestored);
              boss.posture = Math.min(
                boss.maxPosture,
                boss.posture + bossDefense.enemyPostureDamageDealt
              );
              boss.hitFlashTimer = 0.28;
              sound.playParryClang(true);
              playerState.hitStopTimer = 0.05;
              camState.shakeIntensity = 0.28;
              spawnFloatingPopup(
                boss.x,
                boss.y + 4.4,
                boss.z,
                `+${bossDefense.enemyPostureDamageDealt} POSTURE`,
                'parry',
                'BOSS PARRIED'
              );
              showCombatCallout('PERFECT BOSS DEFLECT · POSTURE SURGE!', 1.5);
              world.particlePool.spawnBurst(boss.x, boss.y + 2.4, boss.z, 32, true);
            } else if (bossDefense.isPerfectDodge) {
              playerState.comboHitCount += 1;
              playerState.comboStreakDecayTimer = 4.5;
              playerState.stamina = Math.min(100, playerState.stamina + bossDefense.staminaRestored);
              boss.posture = Math.min(
                boss.maxPosture,
                boss.posture + bossDefense.enemyPostureDamageDealt
              );
              sound.playDash(true);
              spawnFloatingPopup(
                playerState.x,
                playerState.y + 2.2,
                playerState.z,
                'SHADOW STEP',
                'parry',
                'BOSS EVADED'
              );
              showCombatCallout('PERFECT SHADOW-STEP · BOSS STRIKE EVADED!', 1.4);
            } else {
              const bDmg = bossDefense.hpDamageTaken;
              playerState.hp = Math.max(0, playerState.hp - bDmg);
              playerState.hurtFlashTimer = 0.92;
              camState.shakeIntensity = 0.34;
              sound.playPlayerHurt();
              spawnFloatingPopup(
                playerState.x,
                playerState.y + 2.1,
                playerState.z,
                `-${bDmg} PRANA`,
                'deathblow',
                'WORKFORCE REDUCTION CLEAVE'
              );
              world.particlePool.spawnBurst(
                playerState.x,
                playerState.y + 1.1,
                playerState.z,
                22,
                false
              );
              if (playerState.hp <= 0) {
                playerState.hp = 0;
                sound.playPlayerDeath();
                showCombatCallout(
                  'TERMINATED BY THE SEPTEMBER LAYOFF — PRANA EXTINGUISHED!',
                  3.0
                );
                if (typeof document !== 'undefined' && document.pointerLockElement) {
                  try {
                    document.exitPointerLock?.();
                  } catch {
                    // ignore
                  }
                }
                stateRef.current.onPlayerDied();
              } else {
                showCombatCallout(
                  `CRUSHED BY THE SEPTEMBER LAYOFF (-${bDmg} HP) · UNLOCK ALL 6 PROJECTS FOR [Z] ⚡ LIGHTNING BOLT!`,
                  1.8
                );
              }
            }
          }

          boss.yaw = Math.atan2(bdx, bdz);
          boss.y = walkableSurfaceHeightAt(boss.x, boss.z, boss.y);
          boss.group.position.set(boss.x, boss.y, boss.z);
          boss.bodyGroup.rotation.y = boss.yaw;
          boss.bodyGroup.rotation.x = boss.hitFlashTimer > 0 ? -0.22 : 0;

          boss.arms.forEach((arm, idx) => {
            arm.rotation.x = Math.sin(elapsedTotal * 4.2 + idx * 1.4) * 0.72;
          });
          const pulseWave = 1 + ((elapsedTotal * 1.8) % 3.5);
          boss.shockwaveRing.scale.setScalar(pulseWave);
          if (boss.shockwaveRing.material instanceof THREE.MeshBasicMaterial) {
            boss.shockwaveRing.material.opacity = Math.max(0, 0.75 - (pulseWave - 1) * 0.22);
          }
          boss.bodyGroup.scale.setScalar(boss.hitFlashTimer > 0 ? 2.95 : 2.65);
          boss.kanjiSprite.visible = boss.posture >= boss.maxPosture * 0.85 || bDist < 6.5;
        }

        // 6. Adaptive Music Mood Engine
        const inCombatNow =
          !activeStopIdNow &&
          currentMode === 'playing' &&
          (nearestDemonDist < 16.0 || (boss.awakened && !boss.defeated && bossDistToPlayer < 36));
        sound.setMusicMood(inCombatNow ? 'combat' : 'calm');

        // Check Sacred Experience Lotus Relic Pickup
        const pickedRelic = checkRelicPickup(
          { x: playerState.x, z: playerState.z },
          collectedRelicsNow
        );
        if (pickedRelic) {
          world.particlePool.spawnBurst(
            pickedRelic.position.x,
            groundHeightAt(pickedRelic.position.x, pickedRelic.position.z) + 1.0,
            pickedRelic.position.z,
            24,
            true
          );
          stateRef.current.onCollectRelic(pickedRelic);
        }

        const nearInfo = findNearestStop({ x: playerState.x, z: playerState.z });
        const nearStop = nearInfo.inRange ? nearInfo.nearestStop : null;
        const nearForgeInfo = findNearestWeaponForge({ x: playerState.x, z: playerState.z });
        const nearWeaponForge = nearForgeInfo.inRange ? nearForgeInfo.nearestWeapon : null;

        // 7. Update 3D Golden Prana Guidance Trail toward Tracked Objective
        let resolvedTracked: HudTelemetry['trackedTarget'] = null;
        if (playerState.guidanceTargetKind === 'project') {
          let targetStop = PORTFOLIO_STOPS.find((s) => s.id === playerState.guidanceTargetId);
          if (!targetStop || visitedStopsNow.has(targetStop.id)) {
            const firstUnvisited = PORTFOLIO_STOPS.find((s) => !visitedStopsNow.has(s.id));
            if (firstUnvisited) targetStop = firstUnvisited;
          }
          if (targetStop) {
            const d = Math.round(
              Math.hypot(targetStop.position.x - playerState.x, targetStop.position.z - playerState.z)
            );
            resolvedTracked = {
              id: targetStop.id,
              kind: 'project',
              title: targetStop.title,
              subtitle: `Project Sanctum ${targetStop.indexNumber}`,
              distance: d,
              accentColor: targetStop.accentColor,
            };
            world.updateGuidanceTrail(
              !activeStopIdNow,
              playerState.x,
              playerState.z,
              targetStop.position.x,
              targetStop.position.z + 5.5,
              targetStop.accentColor,
              elapsedTotal
            );
          }
        } else if (playerState.guidanceTargetKind === 'jewel') {
          const targetRelic =
            LOTUS_RELICS.find((r) => r.id === playerState.guidanceTargetId) ||
            LOTUS_RELICS.find((r) => !collectedRelicsNow.has(r.id)) ||
            LOTUS_RELICS[0];
          const d = Math.round(
            Math.hypot(targetRelic.position.x - playerState.x, targetRelic.position.z - playerState.z)
          );
          resolvedTracked = {
            id: targetRelic.id,
            kind: 'jewel',
            title: `${targetRelic.company} Jewel`,
            subtitle: targetRelic.era,
            distance: d,
            accentColor: '#c084fc',
          };
          world.updateGuidanceTrail(
            !activeStopIdNow,
            playerState.x,
            playerState.z,
            targetRelic.position.x,
            targetRelic.position.z,
            '#c084fc',
            elapsedTotal
          );
        } else if (playerState.guidanceTargetKind === 'weapon') {
          const targetWeapon =
            FORGE_WEAPONS.find((w) => w.id === playerState.guidanceTargetId) || FORGE_WEAPONS[0];
          const d = Math.round(
            Math.hypot(
              targetWeapon.position.x - playerState.x,
              targetWeapon.position.z - playerState.z
            )
          );
          resolvedTracked = {
            id: targetWeapon.id,
            kind: 'weapon',
            title: targetWeapon.name,
            subtitle: `+${targetWeapon.baseDamageBonus} ATK Forge`,
            distance: d,
            accentColor: targetWeapon.colorHex,
          };
          world.updateGuidanceTrail(
            !activeStopIdNow,
            playerState.x,
            playerState.z,
            targetWeapon.position.x,
            targetWeapon.position.z,
            targetWeapon.colorHex,
            elapsedTotal
          );
        }

        const inspectedStop = activeStopIdNow
          ? PORTFOLIO_STOPS.find((s) => s.id === activeStopIdNow) || null
          : null;

        if (inspectedStop) {
          _desiredCamPos.set(
            inspectedStop.cameraFocusOffset.x,
            inspectedStop.cameraFocusOffset.y,
            inspectedStop.cameraFocusOffset.z
          );
          _desiredLookAt.set(
            inspectedStop.lookAtOffset.x,
            inspectedStop.lookAtOffset.y,
            inspectedStop.lookAtOffset.z
          );
        } else {
          const horizDist = camState.distance * Math.cos(camState.pitch);
          const vertDist = camState.distance * Math.sin(camState.pitch);
          const shoulderRightX = Math.cos(camState.yaw) * 0.36;
          const shoulderRightZ = -Math.sin(camState.yaw) * 0.36;

          _desiredLookAt.set(
            playerState.x - Math.sin(camState.yaw) * 5.4 + shoulderRightX * 0.35,
            playerState.y + 1.78 - Math.sin(camState.pitch) * 2.2,
            playerState.z - Math.cos(camState.yaw) * 5.4 + shoulderRightZ * 0.35
          );
          _desiredCamPos.set(
            playerState.x + Math.sin(camState.yaw) * horizDist + shoulderRightX,
            playerState.y + 1.58 + vertDist,
            playerState.z + Math.cos(camState.yaw) * horizDist + shoulderRightZ
          );

          _rayOrigin.set(playerState.x, playerState.y + 1.55, playerState.z);
          _rayDir.subVectors(_desiredCamPos, _rayOrigin);
          const fullDist = _rayDir.length();
          if (fullDist > 0.1 && world.cameraBlockers.length > 0) {
            _rayDir.divideScalar(fullDist);
            _raycaster.set(_rayOrigin, _rayDir);
            _raycaster.near = 0.2;
            _raycaster.far = fullDist;
            const hits = _raycaster.intersectObjects(world.cameraBlockers, false);
            if (hits.length > 0 && hits[0].distance < fullDist) {
              const safeDist = Math.max(1.8, hits[0].distance - 0.45);
              _desiredCamPos.copy(_rayOrigin).addScaledVector(_rayDir, safeDist);
            }
          }

          const camGround = groundHeightAt(_desiredCamPos.x, _desiredCamPos.z);
          if (_desiredCamPos.y < camGround + 0.85) {
            _desiredCamPos.y = camGround + 0.85;
          }
        }

        const nextFov = computeDynamicCameraFov(
          camera.fov,
          actualHorizontalSpeed,
          playerState.dodgeIframeTimer > 0 || playerState.dashTimer > 0,
          playerState.grappleActive,
          playerState.parryTimer > 0,
          frameDt
        );
        if (Math.abs(nextFov - camera.fov) > 0.05) {
          camera.fov = nextFov;
          camera.updateProjectionMatrix();
        }

        const camDamp = 1 - Math.exp(-9.5 * frameDt);
        camState.currentPos.lerp(_desiredCamPos, camDamp);
        camState.currentLook.lerp(_desiredLookAt, camDamp);

        if (camState.shakeIntensity > 0.005) {
          camState.shakeIntensity = Math.max(0, camState.shakeIntensity - 1.5 * frameDt);
          camera.position.set(
            camState.currentPos.x + (Math.random() - 0.5) * camState.shakeIntensity,
            camState.currentPos.y + (Math.random() - 0.5) * camState.shakeIntensity,
            camState.currentPos.z
          );
        } else {
          camera.position.copy(camState.currentPos);
        }
        camera.lookAt(camState.currentLook);

        const attackProgress =
          playerState.attackTimer > 0
            ? 1 - playerState.attackTimer / playerState.attackDuration
            : 0;

        world.updateWorldAnimations(
          elapsedTotal,
          dt,
          activeStopIdNow,
          nearStop ? nearStop.id : null,
          Math.max(0, Math.min(1, attackProgress)),
          actualHorizontalSpeed,
          playerState.isGliding,
          playerState.parryTimer > 0,
          playerState.comboStage,
          playerState.dodgeIframeTimer > 0
        );

        // Throttle HUD React state updates to <= 10Hz
        if (now - lastHudEmitTime >= 100) {
          lastHudEmitTime = now;
          const headingRad = Math.atan2(
            camState.currentLook.x - camera.position.x,
            -(camState.currentLook.z - camera.position.z)
          );
          const headingDeg = ((THREE.MathUtils.radToDeg(headingRad) % 360) + 360) % 360;

          camera.updateMatrixWorld();

          // Project 3D Affordance Markers for Projects, Jewels, Weapons & Active Enemies
          const affordanceMarkers: WorldAffordanceMarker[] = [];

          // 1) Project Sanctums (within 52m or tracked)
          for (const stop of PORTFOLIO_STOPS) {
            const dist = Math.hypot(
              stop.position.x - playerState.x,
              stop.position.z - playerState.z
            );
            if (dist > 52 && resolvedTracked?.id !== stop.id) continue;
            const stopY = groundHeightAt(stop.position.x, stop.position.z) + 5.8;
            _projVec.set(stop.position.x, stopY, stop.position.z).project(camera);
            if (_projVec.z >= -1 && _projVec.z <= 1) {
              const xPct = (_projVec.x * 0.5 + 0.5) * 100;
              const yPct = (-_projVec.y * 0.5 + 0.5) * 100;
              if (xPct >= 8 && xPct <= 92 && yPct >= 14 && yPct <= 84) {
                affordanceMarkers.push({
                  id: stop.id,
                  kind: 'project',
                  xPct,
                  yPct,
                  distance: Math.round(dist),
                  title: `${stop.indexNumber}. ${stop.title}`,
                  subtitle: visitedStopsNow.has(stop.id)
                    ? '✓ AWAKENED · [E] OPEN CODEX'
                    : '[E] INSPECT · [G] GRAPPLE',
                  accentColor: stop.accentColor,
                  completed: visitedStopsNow.has(stop.id),
                });
              }
            }
          }

          // 2) Uncollected Career Experience Jewels (within 40m or tracked)
          for (const relic of LOTUS_RELICS) {
            if (collectedRelicsNow.has(relic.id)) continue;
            const dist = Math.hypot(
              relic.position.x - playerState.x,
              relic.position.z - playerState.z
            );
            if (dist > 40 && resolvedTracked?.id !== relic.id) continue;
            const rY = groundHeightAt(relic.position.x, relic.position.z) + 2.35;
            _projVec.set(relic.position.x, rY, relic.position.z).project(camera);
            if (_projVec.z >= -1 && _projVec.z <= 1) {
              const xPct = (_projVec.x * 0.5 + 0.5) * 100;
              const yPct = (-_projVec.y * 0.5 + 0.5) * 100;
              if (xPct >= 8 && xPct <= 92 && yPct >= 14 && yPct <= 84) {
                affordanceMarkers.push({
                  id: relic.id,
                  kind: 'jewel',
                  xPct,
                  yPct,
                  distance: Math.round(dist),
                  title: `${relic.company} (${relic.era})`,
                  subtitle: 'WALK OVER TO COLLECT JEWEL',
                  accentColor: '#c084fc',
                });
              }
            }
          }

          // 3) Weapon Forges (within 36m or tracked)
          for (const wf of FORGE_WEAPONS) {
            const dist = Math.hypot(wf.position.x - playerState.x, wf.position.z - playerState.z);
            if (dist > 36 && resolvedTracked?.id !== wf.id) continue;
            const wY = groundHeightAt(wf.position.x, wf.position.z) + 3.1;
            _projVec.set(wf.position.x, wY, wf.position.z).project(camera);
            if (_projVec.z >= -1 && _projVec.z <= 1) {
              const xPct = (_projVec.x * 0.5 + 0.5) * 100;
              const yPct = (-_projVec.y * 0.5 + 0.5) * 100;
              if (xPct >= 8 && xPct <= 92 && yPct >= 14 && yPct <= 84) {
                const isEq = playerState.equippedWeaponId === wf.id;
                affordanceMarkers.push({
                  id: wf.id,
                  kind: 'weapon',
                  xPct,
                  yPct,
                  distance: Math.round(dist),
                  title: wf.name,
                  subtitle: isEq
                    ? `★ EQUIPPED (+${wf.baseDamageBonus} ATK)`
                    : `[E] EQUIP (+${wf.baseDamageBonus} ATK)`,
                  accentColor: wf.colorHex,
                  equipped: isEq,
                });
              }
            }
          }

          // 4) Hostile Asura Enemies (within 16m or engaged — live decreasing HP & Posture bars!)
          for (const demon of world.demons) {
            if (!demon.alive) continue;
            const dist = Math.hypot(demon.x - playerState.x, demon.z - playerState.z);
            if (dist > 16 && demon.hp >= demon.maxHp) continue;
            _projVec.set(demon.x, demon.y + 2.9, demon.z).project(camera);
            if (_projVec.z >= -1 && _projVec.z <= 1) {
              const xPct = (_projVec.x * 0.5 + 0.5) * 100;
              const yPct = (-_projVec.y * 0.5 + 0.5) * 100;
              if (xPct >= 18 && xPct <= 82 && yPct >= 18 && yPct <= 64) {
                affordanceMarkers.push({
                  id: demon.id,
                  kind: 'enemy',
                  xPct,
                  yPct,
                  distance: Math.round(dist),
                  title: demon.name,
                  subtitle: demon.title,
                  accentColor: '#f43f5e',
                  hp: Math.round(demon.hp),
                  maxHp: demon.maxHp,
                  posture: Math.round(demon.posture),
                  maxPosture: demon.maxPosture,
                  aiState: demon.state,
                });
              }
            }
          }

          // 5) Locked Boss Arena Hologram Affordance (guides from 14m–38m; steps aside within 14m so the 3D Hologram Billboard is 100% unobstructed)
          if (visitedStopsNow.size < PORTFOLIO_STOPS.length && !boss.awakened && !boss.defeated) {
            const holoDist = Math.hypot(0 - playerState.x, -45.8 - playerState.z);
            if (holoDist > 14 && holoDist <= 38) {
              const holoY = groundHeightAt(0, -45.8) + 3.6;
              _projVec.set(0, holoY, -45.8).project(camera);
              if (_projVec.z >= -1 && _projVec.z <= 1) {
                const xPct = (_projVec.x * 0.5 + 0.5) * 100;
                const yPct = (-_projVec.y * 0.5 + 0.5) * 100;
                if (xPct >= 8 && xPct <= 92 && yPct >= 10 && yPct <= 84) {
                  affordanceMarkers.push({
                    id: 'boss-lock-hologram',
                    kind: 'boss_hologram',
                    xPct,
                    yPct,
                    distance: Math.round(holoDist),
                    title: 'Unlock fight after seeing all the projects',
                    subtitle: `🔒 BOSS SEALED · ${visitedStopsNow.size}/6 PROJECTS SEEN`,
                    accentColor: '#38bdf8',
                  });
                }
              }
            }
          }

          // Keep the screen clean by sorting by distance, restricting to central corridor, and capping count on mobile landscape
          const isCompactLandscape = window.innerHeight < 520;
          const maxMarkerCount = isCompactLandscape ? 2 : 4;
          const maxMarkerDist = isCompactLandscape ? 20 : 28;
          affordanceMarkers.sort((a, b) => a.distance - b.distance);
          const trimmedMarkers: WorldAffordanceMarker[] = [];
          for (const candidate of affordanceMarkers) {
            if (trimmedMarkers.length >= maxMarkerCount) break;
            if (candidate.distance > maxMarkerDist) continue;
            candidate.xPct = THREE.MathUtils.clamp(candidate.xPct, 24, 76);
            candidate.yPct = THREE.MathUtils.clamp(candidate.yPct, 22, 56);
            // Push apart badges that project too close together on screen
            for (const placed of trimmedMarkers) {
              if (Math.abs(candidate.xPct - placed.xPct) < 18 && Math.abs(candidate.yPct - placed.yPct) < 11) {
                candidate.yPct = THREE.MathUtils.clamp(placed.yPct - 12, 20, 56);
              }
            }
            trimmedMarkers.push(candidate);
          }

          // Engaged Enemy Target Bar at Top-Center when actively fighting (within 7.2m, damaged, or attacking)
          let engagedDemonHud: EngagedDemonTelemetry | null = null;
          if (
            engagedDemonEntity &&
            (nearestDemonDist <= 7.2 ||
              engagedDemonEntity.hp < engagedDemonEntity.maxHp ||
              engagedDemonEntity.state === 'windup' ||
              engagedDemonEntity.state === 'strike')
          ) {
            engagedDemonHud = {
              id: engagedDemonEntity.id,
              name: engagedDemonEntity.name,
              title: engagedDemonEntity.title,
              archetype: engagedDemonEntity.archetype,
              hp: Math.round(engagedDemonEntity.hp),
              maxHp: engagedDemonEntity.maxHp,
              posture: Math.round(engagedDemonEntity.posture),
              maxPosture: engagedDemonEntity.maxPosture,
              aiState: engagedDemonEntity.state,
              distance: Math.round(nearestDemonDist),
            };
          }

          // Project active 3D combat damage popups to screen space
          const projectedPopups: CombatFloatingPopup[] = [];
          for (const pop of activePopups) {
            _projVec.set(pop.worldX, pop.worldY, pop.worldZ);
            _projVec.project(camera);
            if (_projVec.z >= -1 && _projVec.z <= 1) {
              const xPct = (_projVec.x * 0.5 + 0.5) * 100;
              const yPct = (-_projVec.y * 0.5 + 0.5) * 100;
              if (xPct >= 5 && xPct <= 95 && yPct >= 8 && yPct <= 90) {
                projectedPopups.push({
                  id: pop.id,
                  xPct,
                  yPct,
                  text: pop.text,
                  subtext: pop.subtext,
                  kind: pop.kind,
                });
              }
            }
          }

          const storyChapter = boss.defeated
            ? STORY_CHAPTERS[4]
            : boss.awakened
            ? STORY_CHAPTERS[3]
            : visitedStopsNow.size >= 4
            ? STORY_CHAPTERS[2]
            : visitedStopsNow.size >= 2
            ? STORY_CHAPTERS[1]
            : STORY_CHAPTERS[0];

          const grappleCandidate = findBestGrappleTarget({ x: playerState.x, z: playerState.z });
          const comboRank = computeComboRank(playerState.comboHitCount);

          stateRef.current.onTelemetryUpdate({
            x: playerState.x,
            z: playerState.z,
            headingDeg,
            regionName: getRegionNameAt(playerState.x, playerState.z),
            nearStop,
            nearDistance: nearInfo.distance,
            nearWeaponForge,
            equippedWeaponId: playerState.equippedWeaponId,
            equippedWeaponName: combatStats.equippedWeapon.name,
            trackedTarget: resolvedTracked,
            distanceTraveled: playerState.distanceTraveled,
            playerHp: Math.round(playerState.hp),
            playerMaxHp: playerState.maxHp,
            playerHurtFlash: playerState.hurtFlashTimer,
            stamina: Math.round(playerState.stamina),
            attackDamage: Math.round(combatStats.attackDamage * comboRank.damageMultiplier),
            unlockedPowersCount: combatStats.unlockedPowersCount,
            latestPowerName: combatStats.latestPowerName,
            comboStage: playerState.comboStage,
            comboHitCount: playerState.comboHitCount,
            comboRankCode: comboRank.rankCode,
            comboRankTitle: comboRank.rankTitle,
            musicMood: inCombatNow ? 'combat' : 'calm',
            storyAct: storyChapter.act,
            storyTitle: storyChapter.title,
            storyEra: storyChapter.era,
            storySummary: storyChapter.summary,
            aliveDemonsCount,
            nearestDemonName: nearestDemonDist < 18 ? nearestDemonName : null,
            engagedDemon: engagedDemonHud,
            bossAwakened: boss.awakened,
            bossDefeated: boss.defeated,
            bossHp: Math.round(boss.hp),
            bossMaxHp: boss.maxHp,
            bossPosture: Math.round(boss.posture),
            bossMaxPosture: boss.maxPosture,
            bossName: boss.name,
            lightningUnlocked: canCastLightningBolt(visitedStopsNow.size),
            lightningCooldown: Number(playerState.lightningCooldown.toFixed(1)),
            vanquishedDemonIds: world.demons.filter((d) => !d.alive).map((d) => d.id),
            isGliding: playerState.isGliding,
            grappleTargetTitle: grappleCandidate ? grappleCandidate.stop.title : null,
            combatCallout: playerState.combatCallout,
            combatPopups: projectedPopups,
            affordanceMarkers: trimmedMarkers,
            waypointScreen: null,
          });
        }
      }

      renderer.render(world.scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      isDisposed = true;
      sound.setMusicMood('silent');
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputsOnBlur);
      document.removeEventListener('visibilitychange', clearInputsOnBlur);
      window.removeEventListener('resize', onResize);
      domElem.removeEventListener('pointerdown', onPointerDown);
      domElem.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      world.dispose();
      renderer.dispose();
      if (domElem.parentNode === container) {
        container.removeChild(domElem);
      }
    };
  }, [controllerRef]);

  return (
    <div
      ref={canvasMountRef}
      className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-[#1a1009]"
      aria-label="Portfolio Verse 3D Interactive Action-RPG World Viewport"
    />
  );
};
