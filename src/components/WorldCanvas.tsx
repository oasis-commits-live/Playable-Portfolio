import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  PORTFOLIO_STOPS,
  LOTUS_RELICS,
  STORY_CHAPTERS,
  LotusRelic,
} from '../data/portfolioStops';
import {
  groundHeightAt,
  applyRadialDeadzone,
  computeMovementVector,
  computeParagliderPhysics,
  findBestGrappleTarget,
  resolveSekiroDeflect,
  resolveCombatDefense,
  computeDynamicCameraFov,
  computeComboRank,
  dampAngle,
  resolveCollisions,
  findNearestStop,
  checkRelicPickup,
  computePlayerCombatStats,
  shouldAwakenLayoffBoss,
  getWorldColliders,
  getRegionNameAt,
  PLAYER_RADIUS,
  PARAGLIDE_SPEED_MULTIPLIER,
} from '../game/worldLogic';
import { buildAncientWorldScene, TimeOfDay } from '../game/proceduralScene';
import { sound } from '../game/sound';
import { HudTelemetry, CombatFloatingPopup } from './HudOverlay';

export interface WorldControllerRef {
  teleportToStop: (stopId: string) => void;
  resetToSpawn: () => void;
  setVirtualInput: (forward: number, right: number) => void;
  triggerVirtualJump: () => void;
  triggerAttack: (isNova?: boolean) => void;
  triggerParryDeflect: () => void;
  triggerDodgeDash: () => void;
  triggerGrappleHook: () => void;
  summonLayoffBoss: () => void;
  setTimeOfDay: (mode: TimeOfDay) => void;
}

interface WorldCanvasProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  activeStopId: string | null;
  visitedStopIds: Set<string>;
  collectedRelicIds: Set<string>;
  onTelemetryUpdate: (telemetry: HudTelemetry) => void;
  onInspectStop: (stopId: string) => void;
  onCloseStop: () => void;
  onCollectRelic: (relic: LotusRelic) => void;
  onBossDefeated: () => void;
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
      onTogglePause,
      onStartFromTitle,
      onGamepadStatusChange,
    };
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

    // 2. Build Expanded Zelda/Sekiro Ancient India 3D Scene + RoomEnvironment PMREM Reflections
    const world = buildAncientWorldScene(renderer, isSoftwareGl);
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    world.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    if (!isSoftwareGl) {
      renderer.compile(world.scene, camera);
    }

    // 3. Player Momentum Physics, 3-Stage Combo, Sekiro Posture, Shadow-Step Dodge & Free-Mouse Camera State
    const colliders = getWorldColliders();
    const playerState = {
      x: 0,
      z: 8.2,
      y: groundHeightAt(0, 8.2),
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
      stamina: 100,
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
      playerState.grappleTargetY = target.targetY;
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

      const combatStats = computePlayerCombatStats(stateRef.current.visitedStopIds);
      let deflectedSomeone = false;

      for (const demon of world.demons) {
        if (!demon.alive) continue;
        const dist = Math.hypot(demon.x - playerState.x, demon.z - playerState.z);
        if (dist <= 5.4) {
          deflectedSomeone = true;
          const postureDealt = Math.round(combatStats.postureDamage * 1.45);
          demon.posture = Math.min(demon.maxPosture, demon.posture + postureDealt);
          demon.hitFlashTimer = 0.24;
          demon.attackCooldown = 1.65;
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

    // 3-Stage Katana Combo & Surya Nova Execution [Left-Click / Key F / Key Q]
    const performAttack = (isNova = false) => {
      if (playerState.attackCooldown > 0) return;
      const combatStats = computePlayerCombatStats(stateRef.current.visitedStopIds);

      // Advance 3-Stage Katana Combo if chained within 1.15s
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
      const duration = isNova || stage === 3 ? 0.36 : stage === 2 ? 0.28 : 0.25;
      playerState.attackDuration = duration;
      playerState.attackTimer = duration;
      playerState.attackCooldown = isNova ? 0.38 : stage === 3 ? 0.34 : 0.22;

      // Forward Katana Lunge impulse scaled by combo stage
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
      const effectiveRange = combatStats.attackRange * (isNova || stage === 3 ? 1.5 : 1.08);
      const baseDmg = Math.round(combatStats.attackDamage * comboMult);
      const basePostureDmg = Math.round(combatStats.postureDamage * comboMult);

      const comboNames = {
        1: 'I · NANDAKA CLEAVE',
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
        if (dist <= effectiveRange + 0.95) {
          landedAnyHit = true;
          playerState.comboHitCount += 1;
          playerState.comboStreakDecayTimer = 4.5;
          const isDeathblow = demon.posture >= demon.maxPosture * 0.85 || isNova;
          const dealtDmg = isDeathblow ? Math.round(baseDmg * 1.9) : baseDmg;

          demon.hp = Math.max(0, demon.hp - dealtDmg);
          demon.posture = Math.min(demon.maxPosture, demon.posture + basePostureDmg);
          demon.hitFlashTimer = 0.22;

          // Physical knockback impulse + collision resolution
          const inv = 1 / (dist || 1);
          const knockDist = stage === 3 || isNova ? 2.1 : 1.35;
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
              `-${dealtDmg}`,
              isDeathblow || stage === 3 ? 'crit' : 'damage',
              comboNames[stage]
            );
            if (demon.posture >= demon.maxPosture) {
              showCombatCallout('危 POSTURE BROKEN · STRIKE FOR SHINOBI DEATHBLOW!', 1.5);
            } else {
              showCombatCallout(`${comboNames[stage]} · -${dealtDmg} HP`, 1.0);
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
          playerState.comboHitCount += 1;
          playerState.comboStreakDecayTimer = 4.5;
          const isBossDeathblow = boss.posture >= boss.maxPosture;
          const dealtBossDmg = isBossDeathblow ? Math.round(baseDmg * 2.4) : baseDmg;
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
            spawnFloatingPopup(
              boss.x,
              boss.y + 4.0,
              boss.z,
              `-${dealtBossDmg}`,
              stage === 3 ? 'crit' : 'damage',
              comboNames[stage]
            );
          }

          boss.hp = Math.max(0, boss.hp - dealtBossDmg);
          boss.posture = Math.min(boss.maxPosture, boss.posture + basePostureDmg);
          boss.hitFlashTimer = 0.24;
          world.particlePool.spawnBurst(boss.x, boss.y + 2.4, boss.z, 30, true);

          if (boss.hp <= 0) {
            boss.defeated = true;
            boss.group.visible = false;
            sound.playDeathblow();
            sound.playRelicChime(true);
            world.particlePool.spawnBurst(boss.x, boss.y + 2.8, boss.z, 58, true);
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

    const awakenAndFocusLayoffBoss = () => {
      playerState.manualBossSummon = true;
      const boss = world.layoffBoss;
      if (!boss.awakened && !boss.defeated) {
        boss.awakened = true;
        boss.group.visible = true;
        sound.playBossAwaken();
      }
      boss.x = 0;
      boss.z = -48;
      boss.y = groundHeightAt(0, -48);
      boss.group.position.set(boss.x, boss.y, boss.z);

      playerState.x = 0;
      playerState.z = -39.5;
      playerState.y = groundHeightAt(0, -39.5);
      playerState.vx = 0;
      playerState.vz = 0;
      playerState.vy = 0;
      playerState.yaw = Math.PI;
      playerState.grappleActive = false;
      camState.yaw = 0;
      camState.pitch = 0.15;
      camState.currentPos.set(0.36, playerState.y + 2.1, -35.5);
      camState.currentLook.set(0, playerState.y + 1.8, -46);
      world.playerRig.group.position.set(playerState.x, playerState.y, playerState.z);
      world.playerRig.group.rotation.y = playerState.yaw;
      world.particlePool.spawnBurst(0, playerState.y + 0.5, -39.5, 24, true);
      showCombatCallout('ACT V · MAHA-ASURA: THE SEPTEMBER LAYOFF AWAKENS!', 2.8);
    };

    controllerRef.current = {
      teleportToStop(stopId: string) {
        const stop = PORTFOLIO_STOPS.find((s) => s.id === stopId);
        if (!stop) return;
        const dirToCenterX = -stop.position.x;
        const dirToCenterZ = -stop.position.z;
        const len = Math.hypot(dirToCenterX, dirToCenterZ) || 1;
        const standDist = stop.interactionRadius * 0.78;
        playerState.x = stop.position.x + (dirToCenterX / len) * standDist;
        playerState.z = stop.position.z + (dirToCenterZ / len) * standDist;
        playerState.y = groundHeightAt(playerState.x, playerState.z);
        playerState.vx = 0;
        playerState.vz = 0;
        playerState.vy = 0;
        playerState.grounded = true;
        playerState.isGliding = false;
        playerState.grappleActive = false;
        playerState.yaw = Math.atan2(
          stop.position.x - playerState.x,
          stop.position.z - playerState.z
        );
        world.playerRig.group.position.set(playerState.x, playerState.y, playerState.z);
        world.playerRig.group.rotation.y = playerState.yaw;
        world.particlePool.spawnBurst(playerState.x, playerState.y + 0.5, playerState.z, 16, true);
        stateRef.current.onInspectStop(stop.id);
      },
      resetToSpawn() {
        playerState.x = 0;
        playerState.z = 8.2;
        playerState.y = groundHeightAt(0, 8.2);
        playerState.vx = 0;
        playerState.vz = 0;
        playerState.vy = 0;
        playerState.grounded = true;
        playerState.isGliding = false;
        playerState.grappleActive = false;
        playerState.yaw = Math.PI;
        playerState.hp = playerState.maxHp;
        camState.yaw = 0;
        camState.pitch = 0.15;
        camState.distance = 4.15;
        world.playerRig.group.position.set(playerState.x, playerState.y, playerState.z);
        world.playerRig.group.rotation.y = playerState.yaw;
        world.particlePool.spawnBurst(0, playerState.y + 0.4, 8.2, 14, true);
        sound.playTempleBell(528);
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
        } else if (code === 'KeyF' || code === 'KeyJ') {
          e.preventDefault();
          performAttack(false);
        } else if (code === 'KeyQ') {
          e.preventDefault();
          performAttack(true);
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
          const near = findNearestStop({ x: playerState.x, z: playerState.z });
          if (near.inRange) {
            e.preventDefault();
            if (stateRef.current.activeStopId === near.nearestStop.id) {
              stateRef.current.onCloseStop();
            } else {
              stateRef.current.onInspectStop(near.nearestStop.id);
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

    const clearInputsOnBlur = () => {
      keysHeld.clear();
      virtualInput.forward = 0;
      virtualInput.right = 0;
      hasPointerPos = false;
    };

    // Mouse Clicks on 3D Canvas: Left-Click = Katana Combo Strike, Right-Click = Sekiro Deflect
    const onPointerDown = (e: PointerEvent) => {
      if (stateRef.current.gameState !== 'playing' || stateRef.current.activeStopId) return;
      if (e.button === 2) {
        performParryDeflect();
        return;
      }
      if (e.button === 0) {
        performAttack(false);
      }
    };

    // FREE-MOVE MOUSE CAMERA PAN: Rotates camera smoothly on mouse movement alone (no click required!)
    const onPointerMove = (e: PointerEvent) => {
      if (stateRef.current.gameState !== 'playing' || stateRef.current.activeStopId) {
        hasPointerPos = false;
        return;
      }
      if (!hasPointerPos) {
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        hasPointerPos = true;
        return;
      }
      const dx =
        typeof e.movementX === 'number' && Math.abs(e.movementX) < 120
          ? e.movementX
          : e.clientX - lastPointerX;
      const dy =
        typeof e.movementY === 'number' && Math.abs(e.movementY) < 120
          ? e.movementY
          : e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        camState.yaw -= dx * 0.0042;
        camState.pitch = THREE.MathUtils.clamp(camState.pitch + dy * 0.0034, 0.04, 0.88);
        camState.lastMousePanTime = performance.now();
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

      // Sekiro Hit-Stop Micro-Freeze for visceral sword impact feel
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

      // Sync Player Power Visuals
      const combatStats = computePlayerCombatStats(visitedStopsNow);
      world.updatePlayerPowerVisuals(combatStats.unlockedPowersCount, combatStats.activeColorHex);

      // Check if Colossal September Layoff Boss should awaken
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
      }

      if (currentMode === 'title') {
        sound.setMusicMood('silent');
        const tourAngle = elapsedTotal * 0.14;
        const tourRadius = 26;
        _desiredCamPos.set(
          Math.sin(tourAngle) * tourRadius,
          8.4 + Math.sin(elapsedTotal * 0.35) * 1.4,
          Math.cos(tourAngle) * tourRadius - 4
        );
        _desiredLookAt.set(0, 3.2, -16);
        camera.position.lerp(_desiredCamPos, 1 - Math.exp(-4 * frameDt));
        camera.lookAt(_desiredLookAt);

        world.updateWorldAnimations(elapsedTotal, dt, null, null, 0, 0, false, false, 1, false);
      } else if (currentMode === 'paused') {
        sound.setMusicMood('silent');
      } else if (currentMode === 'playing' || currentMode === 'gameover') {
        playerState.attackTimer = Math.max(0, playerState.attackTimer - frameDt);
        playerState.attackCooldown = Math.max(0, playerState.attackCooldown - frameDt);
        playerState.comboResetTimer = Math.max(0, playerState.comboResetTimer - frameDt);
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

        // Passive Prana (HP) regeneration
        if (playerState.hp < playerState.maxHp) {
          playerState.hp = Math.min(
            playerState.maxHp,
            playerState.hp + (4.5 + combatStats.unlockedPowersCount * 2.2) * dt
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
            playerState.y = playerState.grappleTargetY;
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

          // 2. Momentum-Damped Horizontal Physics + Katana Lunge / Shadow-Step Dash Impulse
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

            const stepDist = Math.hypot(resolved.x - playerState.x, resolved.z - playerState.z);
            playerState.x = resolved.x;
            playerState.z = resolved.z;
            playerState.walkCycleDist += stepDist;
            playerState.distanceTraveled += stepDist;

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

            // Only gently align camera behind player if user hasn't panned mouse recently (> 2.4s)
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

          // 3. Jump & Zelda Paraglider Vertical Physics
          const floorY = groundHeightAt(playerState.x, playerState.z);
          if (playerState.grounded) {
            playerState.coyoteTimer = 0.12;
            playerState.isGliding = false;
          } else {
            playerState.coyoteTimer = Math.max(0, playerState.coyoteTimer - dt);
          }

          if (playerState.jumpBufferTimer > 0) {
            playerState.jumpBufferTimer = Math.max(0, playerState.jumpBufferTimer - dt);
            if (playerState.coyoteTimer > 0) {
              playerState.vy = 8.5;
              playerState.grounded = false;
              playerState.coyoteTimer = 0;
              playerState.jumpBufferTimer = 0;
              playerState.scaleX = 0.84;
              playerState.scaleY = 1.2;
              sound.playJump(false);
              world.particlePool.spawnBurst(playerState.x, floorY, playerState.z, 6, false);
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
            if (playerState.y <= floorY) {
              playerState.y = floorY;
              playerState.vy = 0;
              playerState.grounded = true;
              playerState.isGliding = false;
              playerState.scaleX = 1.22;
              playerState.scaleY = 0.78;
              sound.playJump(true);
              world.particlePool.spawnBurst(playerState.x, floorY, playerState.z, 8, false);
            }
          } else {
            playerState.y = floorY;
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

        const floorYNow = groundHeightAt(playerState.x, playerState.z);
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
        if (playerState.attackTimer <= 0) {
          rig.rightArm.rotation.x = Math.sin(gaitPhase) * swingAmp * 0.85;
        }
        rig.cloakMesh.rotation.x =
          0.14 +
          Math.abs(Math.sin(gaitPhase)) * 0.18 * speedRatio +
          (playerState.dodgeIframeTimer > 0 ? 0.35 : playerState.grounded ? 0 : 0.25);

        rig.shadowDisc.position.y = Math.max(0.015, floorYNow - playerState.y + 0.015);
        const heightAboveFloor = Math.max(0, playerState.y - floorYNow);
        rig.shadowDisc.scale.setScalar(Math.max(0.35, 1 - heightAboveFloor * 0.18));

        // 4. Update Roaming Asura Demons AI, Sekiro Posture, Shadow-Step Dodge & Perilous Attacks
        let nearestDemonDist = Infinity;
        let nearestDemonName: string | null = null;
        let aliveDemonsCount = 0;

        for (const demon of world.demons) {
          if (!demon.alive) continue;
          aliveDemonsCount += 1;

          demon.hitFlashTimer = Math.max(0, demon.hitFlashTimer - dt);
          demon.attackCooldown = Math.max(0, demon.attackCooldown - dt);
          if (demon.hitFlashTimer <= 0 && demon.posture < demon.maxPosture) {
            demon.posture = Math.max(0, demon.posture - 2.5 * dt);
          }

          if (demon.mixer) {
            demon.mixer.update(dt);
          }

          const dxToPlayer = playerState.x - demon.x;
          const dzToPlayer = playerState.z - demon.z;
          const distToPlayer = Math.hypot(dxToPlayer, dzToPlayer);

          if (distToPlayer < nearestDemonDist) {
            nearestDemonDist = distToPlayer;
            nearestDemonName = demon.name;
          }

          if (distToPlayer < demon.aggroRange && !activeStopIdNow) {
            const step = 3.9 * dt;
            if (distToPlayer > 1.95) {
              demon.x += (dxToPlayer / distToPlayer) * step;
              demon.z += (dzToPlayer / distToPlayer) * step;
            } else if (demon.attackCooldown <= 0) {
              demon.attackCooldown = 1.45;
              const defenseOutcome = resolveCombatDefense(
                14,
                28,
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
                demon.hitFlashTimer = 0.25;
                sound.playParryClang(true);
                playerState.hitStopTimer = 0.04;
                camState.shakeIntensity = 0.2;
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
                playerState.hp = Math.max(40, playerState.hp - defenseOutcome.hpDamageTaken);
                camState.shakeIntensity = 0.14;
                world.particlePool.spawnBurst(
                  playerState.x,
                  playerState.y + 1.0,
                  playerState.z,
                  8,
                  false
                );
              }
            }
            demon.yaw = Math.atan2(dxToPlayer, dzToPlayer);
          } else {
            const patrolAngle = elapsedTotal * 0.7 + demon.homeX;
            const targetX = demon.homeX + Math.cos(patrolAngle) * 2.8;
            const targetZ = demon.homeZ + Math.sin(patrolAngle) * 2.8;
            const pdx = targetX - demon.x;
            const pdz = targetZ - demon.z;
            demon.x += pdx * 1.5 * dt;
            demon.z += pdz * 1.5 * dt;
            demon.yaw = Math.atan2(pdx, pdz);
          }

          demon.y = groundHeightAt(demon.x, demon.z);
          demon.group.position.set(demon.x, demon.y, demon.z);
          demon.bodyGroup.rotation.y = demon.yaw;

          // Dynamic windup & stagger animatics on demons
          const windup =
            distToPlayer < 3.2 && demon.attackCooldown < 0.45
              ? -1.25 * (1 - demon.attackCooldown / 0.45)
              : Math.sin(elapsedTotal * 5 + demon.homeX) * 0.45;
          demon.leftArm.rotation.x = windup;
          demon.rightArm.rotation.x = -windup;
          demon.bodyGroup.rotation.x = demon.hitFlashTimer > 0 ? -0.28 : 0;

          const hitScale = demon.hitFlashTimer > 0 ? demon.scale * 1.18 : demon.scale;
          demon.bodyGroup.scale.setScalar(hitScale);

          const hpRatio = Math.max(0.02, demon.hp / demon.maxHp);
          demon.hpBarFill.scale.x = hpRatio;
          demon.hpBarFill.lookAt(camera.position);

          const postureRatio = Math.max(0.02, demon.posture / demon.maxPosture);
          demon.postureBarFill.scale.x = postureRatio;
          demon.postureBarFill.lookAt(camera.position);

          demon.kanjiSprite.visible =
            demon.posture >= demon.maxPosture * 0.8 ||
            (distToPlayer < 4.5 && demon.attackCooldown < 0.38);
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

          if (bDist < 32 && bDist > 3.2 && !activeStopIdNow) {
            boss.x += (bdx / bDist) * 2.9 * dt;
            boss.z += (bdz / bDist) * 2.9 * dt;
          } else if (bDist <= 4.3 && boss.attackTimer > 1.75 && !activeStopIdNow) {
            boss.attackTimer = 0;
            const bossDefense = resolveCombatDefense(
              22,
              42,
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
              playerState.hp = Math.max(40, playerState.hp - bossDefense.hpDamageTaken);
              camState.shakeIntensity = 0.22;
            }
          }

          boss.yaw = Math.atan2(bdx, bdz);
          boss.y = groundHeightAt(boss.x, boss.z);
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

        // 6. Adaptive Music Mood Engine: Calm Raga Yaman when exploring, Fierce War-Taiko when fighting!
        const inCombatNow =
          !activeStopIdNow &&
          currentMode === 'playing' &&
          (nearestDemonDist < 14.5 || (boss.awakened && !boss.defeated && bossDistToPlayer < 36));
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

        // Dynamic Camera FOV Kick for AAA speed & combat focus
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
          let waypointScreen: {
            xPct: number;
            yPct: number;
            distance: number;
            title: string;
            stopId: string;
          } | null = null;
          let bestVisibleDist = Infinity;

          for (const candidate of PORTFOLIO_STOPS) {
            const dist = Math.hypot(
              candidate.position.x - playerState.x,
              candidate.position.z - playerState.z
            );
            const stopY = groundHeightAt(candidate.position.x, candidate.position.z) + 5.6;
            _projVec.set(candidate.position.x, stopY, candidate.position.z);
            _projVec.project(camera);

            if (_projVec.z >= -1 && _projVec.z <= 1) {
              const xPct = (_projVec.x * 0.5 + 0.5) * 100;
              const yPct = (-_projVec.y * 0.5 + 0.5) * 100;
              if (xPct >= 10 && xPct <= 90 && yPct >= 14 && yPct <= 82 && dist < bestVisibleDist) {
                bestVisibleDist = dist;
                waypointScreen = {
                  xPct,
                  yPct,
                  distance: Math.round(dist),
                  title: candidate.title,
                  stopId: candidate.id,
                };
              }
            }
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

          // Determine current Story Act from Ayush's 5-Act Saga
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
            distanceTraveled: playerState.distanceTraveled,
            playerHp: Math.round(playerState.hp),
            playerMaxHp: playerState.maxHp,
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
            nearestDemonName: nearestDemonDist < 16 ? nearestDemonName : null,
            bossAwakened: boss.awakened,
            bossDefeated: boss.defeated,
            bossHp: Math.round(boss.hp),
            bossMaxHp: boss.maxHp,
            bossPosture: Math.round(boss.posture),
            bossMaxPosture: boss.maxPosture,
            bossName: boss.name,
            isGliding: playerState.isGliding,
            grappleTargetTitle: grappleCandidate ? grappleCandidate.stop.title : null,
            combatCallout: playerState.combatCallout,
            combatPopups: projectedPopups,
            waypointScreen,
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
      aria-label="Aryavarta 3D Ancient India Portfolio World Viewport"
    />
  );
};
