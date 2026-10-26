import {
  PORTFOLIO_STOPS,
  LOTUS_RELICS,
  FORGE_WEAPONS,
  PortfolioStop,
  LotusRelic,
  ForgeWeapon,
  WeaponId,
  DemonArchetype,
} from '../data/portfolioStops';

export interface Vec2XZ {
  x: number;
  z: number;
}

export interface CircleCollider {
  id: string;
  x: number;
  z: number;
  radius: number;
}

export interface MovementInput {
  forward: number; // -1 to 1 (positive = forward)
  right: number;   // -1 to 1 (positive = right)
  sprint: boolean;
}

export type DemonCombatState = 'patrol' | 'chase' | 'windup' | 'strike' | 'recover' | 'stagger';

export const WORLD_RADIUS = 135;
export const PLAYER_RADIUS = 0.62;
export const BASE_WALK_SPEED = 9.4;
export const SPRINT_MULTIPLIER = 1.56;
export const PARAGLIDE_SPEED_MULTIPLIER = 1.34;
export const PARAGLIDE_TERMINAL_VY = -2.1;
export const RELIC_PICKUP_RADIUS = 2.85;
export const WEAPON_FORGE_INTERACT_RADIUS = 3.6;
export const BASE_ATTACK_DAMAGE = 20;
export const BASE_ATTACK_RANGE = 4.8;
export const MAX_GRAPPLE_DISTANCE = 56;
export const MAX_STEP_UP_HEIGHT = 0.78;

export const BOULDER_OUTCROPS: ReadonlyArray<{ x: number; z: number; scale: number }> = [
  { x: -8.5, z: 4.2, scale: 1.0 },
  { x: 8.8, z: 3.8, scale: 1.05 },
  { x: -9.4, z: -8.5, scale: 1.15 },
  { x: 9.6, z: -9.2, scale: 1.1 },
  { x: -16.5, z: -14.0, scale: 1.4 },
  { x: 16.8, z: -14.5, scale: 1.35 },
  { x: -14.2, z: 14.5, scale: 1.25 },
  { x: 14.8, z: 14.2, scale: 1.2 },
  { x: -28.0, z: -12.0, scale: 1.6 },
  { x: 28.5, z: -12.0, scale: 1.55 },
  { x: -11.5, z: -34.0, scale: 1.3 },
  { x: 11.5, z: -34.0, scale: 1.3 },
];

/**
 * Deterministic macro terrain elevation at (x, z) across the 270m diameter Portfolio Verse Valley:
 * - Spawn corridor around (0, 8) sits on a gentle walkable Great Plateau terrace near y = 0.
 * - Northern Sovereign Mandapa (0, -26) sits on an elevated temple hillock (+1.45m).
 * - Far-Northern Rakshasa Citadel / Boss Arena (0, -48) forms a grand ceremonial plateau (+1.75m).
 * - East & West Sanctums sit on scenic elevated terraces.
 * - Winding Saraswati turquoise river channel cuts across z ~ -3.5 + sin(x*0.09)*3.4 with an arched stone ford at |x| < 4.5.
 * - Outer perimeter (r > 64m) rises into dramatic Himalayan/Vindhya mountain peaks.
 */
export function groundHeightAt(x: number, z: number): number {
  const distFromCenter = Math.hypot(x, z);

  // Dramatic outer mountain range beyond 64m
  let hillHeight = 0;
  if (distFromCenter > 64) {
    const t = Math.min(1, (distFromCenter - 64) / 48);
    const smooth = t * t * (3 - 2 * t);
    const ridgeWave =
      0.65 * Math.sin(x * 0.09) * Math.cos(z * 0.09) +
      0.45 * Math.cos((x + z) * 0.06);
    hillHeight = smooth * (11.5 + ridgeWave * 3.8);
  } else if (distFromCenter > 56) {
    const ft = (distFromCenter - 56) / 8;
    hillHeight = ft * ft * 2.4;
  }

  // Elevated hill mound under the Northern Sovereign Mandapa (x ~ 0, z ~ -26)
  const distToNorthMound = Math.hypot(x - 0, z - -26);
  let moundHeight = 0;
  if (distToNorthMound < 15) {
    const mt = 1 - distToNorthMound / 15;
    moundHeight = mt * mt * (3 - 2 * mt) * 1.45;
  }

  // Elevated Boss Arena Citadel Plateau at (0, -48)
  const distToBossArena = Math.hypot(x - 0, z - -48);
  let bossPlateau = 0;
  if (distToBossArena <= 11.5) {
    bossPlateau = 1.75;
  } else if (distToBossArena < 16.5) {
    const bt = 1 - (distToBossArena - 11.5) / 5.0;
    bossPlateau = bt * bt * (3 - 2 * bt) * 1.75;
  }

  // Gentle East & West Sanctuary Terraces
  let terraceHeight = 0;
  const sideDist = Math.min(
    Math.hypot(x - 38, z - -16),
    Math.hypot(x - 40, z - 24),
    Math.hypot(x - -38, z - 24),
    Math.hypot(x - -38, z - -16)
  );
  if (sideDist < 13) {
    const st = 1 - sideDist / 13;
    terraceHeight = st * st * (3 - 2 * st) * 0.95;
  }

  // Winding Saraswati river channel depression around z = -3.5 + sin(x * 0.09) * 3.4
  const riverCenterZ = -3.5 + Math.sin(x * 0.09) * 3.4;
  const distToRiver = Math.abs(z - riverCenterZ);
  let riverDip = 0;
  if (distToRiver < 4.2 && Math.abs(x) > 4.0) {
    const bridgeBlend = Math.min(1, (Math.abs(x) - 4.0) / 3.2);
    const rt = 1 - distToRiver / 4.2;
    riverDip = -0.62 * rt * rt * bridgeBlend;
  }

  // Natural rolling meadow undulation away from main paths
  const onMainTrail = Math.abs(x) < 4.6 || Math.abs(z) < 4.0;
  let meadowWave = 0;
  if (!onMainTrail && distFromCenter <= 64) {
    meadowWave = 0.34 * Math.sin(x * 0.12) * Math.cos(z * 0.11);
  }

  return hillHeight + moundHeight + bossPlateau + terraceHeight + riverDip + meadowWave;
}

/**
 * Computes the true 3D walkable surface elevation at (x, z), accounting for:
 * - Macro terrain (`groundHeightAt`)
 * - Royal Saraswati Bridge deck & approach ramps at (0, -3.5)
 * - 6 Portfolio Sanctum stepped Jagati plinths, upper sanctum decks, and front Sopana staircases
 * - 4 Vishwakarma Weapon Forge stepped anvil platforms
 * - 5 Sacred Lotus Jewel pedestals
 * - Northern Boss Citadel stone arena ring & steps
 * - 12 Sculpted Rock Outcrops (so the player stands ON TOP of rocks/steps rather than clipping through them)
 */
export function walkableSurfaceHeightAt(
  x: number,
  z: number,
  currentY?: number
): number {
  const baseTerrainY = groundHeightAt(x, z);
  let bestSurfaceY = baseTerrainY;

  const canStepOnto = (candidateY: number) => {
    if (currentY === undefined) return true;
    // Allow stepping up if within step-up tolerance OR if player is already jumping/above the surface
    return candidateY <= currentY + MAX_STEP_UP_HEIGHT;
  };

  // 1. Saraswati Royal Bridge Deck at x in [-2.45, 2.45], z in [-8.3, 1.3]
  if (Math.abs(x) <= 2.45 && z >= -8.3 && z <= 1.3) {
    const dz = Math.abs(z - -3.5);
    let bridgeY = baseTerrainY;
    if (dz <= 3.6) {
      // Gently crowned stone bridge deck
      const arch = Math.cos((dz / 3.6) * (Math.PI * 0.45)) * 0.12;
      bridgeY = Math.max(baseTerrainY, 0.24 + arch);
    } else if (dz <= 4.8) {
      // Smooth approach ramp at north & south bridge thresholds
      const rampT = 1 - (dz - 3.6) / 1.2;
      bridgeY = Math.max(baseTerrainY, baseTerrainY + rampT * 0.24);
    }
    if (bridgeY > bestSurfaceY && canStepOnto(bridgeY)) {
      bestSurfaceY = bridgeY;
    }
  }

  // 2. 6 Portfolio Monument Sanctums: Stepped Jagati Plinths + Front Ceremonial Staircases (Sopana)
  for (const stop of PORTFOLIO_STOPS) {
    const dx = x - stop.position.x;
    const dz = z - stop.position.z;
    const r = Math.hypot(dx, dz);
    if (r > 7.6) continue;

    const monBaseY = groundHeightAt(stop.position.x, stop.position.z);

    // Front Southern Staircase Ramp (`|dx| <= 1.65`, `dz` from 4.4 to 6.9)
    if (Math.abs(dx) <= 1.65 && dz >= 4.3 && dz <= 6.9) {
      const stairT = 1 - Math.max(0, Math.min(1, (dz - 4.5) / 2.3));
      const stairY = monBaseY + stairT * 1.02;
      if (stairY > bestSurfaceY && canStepOnto(stairY)) {
        bestSurfaceY = stairY;
      }
    }

    // Scroll Pedestal Step in front of monument (0, +4.65)
    const distToScroll = Math.hypot(dx, dz - 4.65);
    if (distToScroll <= 0.72) {
      const scrollStepY = monBaseY + 0.52;
      if (scrollStepY > bestSurfaceY && canStepOnto(scrollStepY)) {
        bestSurfaceY = scrollStepY;
      }
    }

    // Lower Jagati Plinth Tier (radius <= 6.05m -> +0.48m)
    if (r <= 6.05) {
      const step1Y = monBaseY + 0.48;
      if (step1Y > bestSurfaceY && canStepOnto(step1Y)) {
        bestSurfaceY = step1Y;
      }
    }

    // Upper Sanctum Mandapa Floor Tier (radius <= 4.88m -> +1.00m)
    if (r <= 4.88) {
      const step2Y = monBaseY + 1.0;
      if (step2Y > bestSurfaceY && canStepOnto(step2Y)) {
        bestSurfaceY = step2Y;
      }
    }

    // Inner Garbhagriha / Altar Dais (radius <= 1.85m -> +1.28m)
    if (r <= 1.85) {
      const altarY = monBaseY + 1.28;
      if (altarY > bestSurfaceY && canStepOnto(altarY)) {
        bestSurfaceY = altarY;
      }
    }
  }

  // 3. 4 Divine Weapon Forge Altars
  for (const weapon of FORGE_WEAPONS) {
    const dx = x - weapon.position.x;
    const dz = z - weapon.position.z;
    const r = Math.hypot(dx, dz);
    if (r <= 2.35) {
      const forgeBaseY = groundHeightAt(weapon.position.x, weapon.position.z);
      const tier1Y = forgeBaseY + 0.32;
      if (tier1Y > bestSurfaceY && canStepOnto(tier1Y)) {
        bestSurfaceY = tier1Y;
      }
      if (r <= 1.35) {
        const tier2Y = forgeBaseY + 0.58;
        if (tier2Y > bestSurfaceY && canStepOnto(tier2Y)) {
          bestSurfaceY = tier2Y;
        }
      }
    }
  }

  // 4. 5 Sacred Career Jewel Plinths
  for (const relic of LOTUS_RELICS) {
    const r = Math.hypot(x - relic.position.x, z - relic.position.z);
    if (r <= 0.78) {
      const relicBaseY = groundHeightAt(relic.position.x, relic.position.z);
      const plinthY = relicBaseY + 0.45;
      if (plinthY > bestSurfaceY && canStepOnto(plinthY)) {
        bestSurfaceY = plinthY;
      }
    }
  }

  // 5. Northern Boss Arena Stone Platform at (0, -48)
  const distToBossCenter = Math.hypot(x - 0, z - -48);
  if (distToBossCenter <= 12.1) {
    const arenaBaseY = groundHeightAt(0, -48);
    const rampBlend =
      distToBossCenter <= 11.4 ? 1 : Math.max(0, 1 - (distToBossCenter - 11.4) / 0.7);
    const arenaFloorY = arenaBaseY + 0.35 * rampBlend;
    if (arenaFloorY > bestSurfaceY && canStepOnto(arenaFloorY)) {
      bestSurfaceY = arenaFloorY;
    }
  }

  // 6. Sculpted Valley Boulder Outcrops (player can step/jump onto boulders without clipping)
  for (const b of BOULDER_OUTCROPS) {
    const r = Math.hypot(x - b.x, z - b.z);
    const rockRadius = 0.95 * b.scale;
    if (r <= rockRadius) {
      const rockBaseY = groundHeightAt(b.x, b.z);
      const domeProfile = Math.cos((r / rockRadius) * (Math.PI * 0.38));
      const rockTopY = rockBaseY + 0.56 * b.scale * domeProfile;
      if (rockTopY > bestSurfaceY && canStepOnto(rockTopY)) {
        bestSurfaceY = rockTopY;
      }
    }
  }

  return bestSurfaceY;
}

/**
 * Applies radial deadzone to gamepad analog stick axes (x, y).
 */
export function applyRadialDeadzone(
  rawX: number,
  rawY: number,
  deadzone = 0.15
): { x: number; y: number } {
  const mag = Math.hypot(rawX, rawY);
  if (mag < deadzone) {
    return { x: 0, y: 0 };
  }
  const normalizedMag = Math.min(1, (mag - deadzone) / (1 - deadzone));
  const scale = normalizedMag / mag;
  return {
    x: rawX * scale,
    y: rawY * scale,
  };
}

/**
 * Computes world-space velocity (vx, vz) and target character facing angle (radians)
 * from local movement input and camera yaw angle.
 */
export function computeMovementVector(
  input: MovementInput,
  cameraYaw: number,
  baseSpeed = BASE_WALK_SPEED
): { vx: number; vz: number; speed: number; targetYaw: number | null } {
  let { forward, right } = input;
  const mag = Math.hypot(forward, right);
  if (mag < 1e-4) {
    return { vx: 0, vz: 0, speed: 0, targetYaw: null };
  }

  if (mag > 1) {
    forward /= mag;
    right /= mag;
  }

  const effectiveMag = Math.min(1, mag);
  const maxSpeed = baseSpeed * (input.sprint ? SPRINT_MULTIPLIER : 1.0);
  const speed = effectiveMag * maxSpeed;

  const sinYaw = Math.sin(cameraYaw);
  const cosYaw = Math.cos(cameraYaw);

  const dirX = -sinYaw * forward + cosYaw * right;
  const dirZ = -cosYaw * forward - sinYaw * right;

  const targetYaw = Math.atan2(dirX, dirZ);

  return {
    vx: dirX * speed,
    vz: dirZ * speed,
    speed,
    targetYaw,
  };
}

/**
 * Computes Garuda Sky-Cloak Paraglider vertical physics when airborne.
 */
export function computeParagliderPhysics(
  currentVy: number,
  wantsGlide: boolean,
  grounded: boolean,
  stamina: number,
  dt: number
): { vy: number; isGliding: boolean; nextStamina: number } {
  if (grounded) {
    return { vy: 0, isGliding: false, nextStamina: Math.min(100, stamina + 28 * dt) };
  }

  const canGlide = wantsGlide && currentVy <= 0.8 && stamina > 2;
  if (canGlide) {
    const dampedVy = Math.max(PARAGLIDE_TERMINAL_VY, currentVy - 4.5 * dt);
    return {
      vy: dampedVy,
      isGliding: true,
      nextStamina: Math.max(0, stamina - 11 * dt),
    };
  }

  return {
    vy: currentVy - 18.5 * dt,
    isGliding: false,
    nextStamina: stamina,
  };
}

/**
 * Finds the best elevated Shrine / Monument Grapple Point within range.
 */
export function findBestGrappleTarget(
  playerPos: Vec2XZ,
  stops: PortfolioStop[] = PORTFOLIO_STOPS,
  maxDist = MAX_GRAPPLE_DISTANCE
): { stop: PortfolioStop; distance: number; targetX: number; targetY: number; targetZ: number } | null {
  let bestStop: PortfolioStop | null = null;
  let bestDist = Infinity;

  for (const stop of stops) {
    const d = Math.hypot(stop.position.x - playerPos.x, stop.position.z - playerPos.z);
    if (d > 4.5 && d <= maxDist && d < bestDist) {
      bestDist = d;
      bestStop = stop;
    }
  }

  if (!bestStop) return null;

  const dirX = playerPos.x - bestStop.position.x;
  const dirZ = playerPos.z - bestStop.position.z;
  const len = Math.hypot(dirX, dirZ) || 1;
  const landingOffset = bestStop.interactionRadius * 0.72;
  const targetX = bestStop.position.x + (dirX / len) * landingOffset;
  const targetZ = bestStop.position.z + (dirZ / len) * landingOffset;
  const targetY = walkableSurfaceHeightAt(targetX, targetZ);

  return {
    stop: bestStop,
    distance: bestDist,
    targetX,
    targetY,
    targetZ,
  };
}

/**
 * Evaluates a Sekiro-style Deflect / Parry against an incoming enemy or boss strike.
 */
export function resolveSekiroDeflect(
  incomingHpDamage: number,
  basePostureCounterDamage: number,
  deflectWindowRemaining: number
): {
  hpDamageTaken: number;
  enemyPostureDamageDealt: number;
  isPerfectDeflect: boolean;
} {
  if (deflectWindowRemaining > 0) {
    return {
      hpDamageTaken: 0,
      enemyPostureDamageDealt: Math.round(basePostureCounterDamage * 1.75),
      isPerfectDeflect: true,
    };
  }
  return {
    hpDamageTaken: incomingHpDamage,
    enemyPostureDamageDealt: 0,
    isPerfectDeflect: false,
  };
}

/**
 * Evaluates full combat defense: Sekiro Deflect window OR Shinobi Shadow-Step Dodge i-frames.
 */
export function resolveCombatDefense(
  incomingHpDamage: number,
  basePostureCounterDamage: number,
  deflectWindowRemaining: number,
  dodgeIframeRemaining: number
): {
  hpDamageTaken: number;
  enemyPostureDamageDealt: number;
  isPerfectDeflect: boolean;
  isPerfectDodge: boolean;
  staminaRestored: number;
} {
  if (deflectWindowRemaining > 0) {
    return {
      hpDamageTaken: 0,
      enemyPostureDamageDealt: Math.round(basePostureCounterDamage * 1.75),
      isPerfectDeflect: true,
      isPerfectDodge: false,
      staminaRestored: 22,
    };
  }
  if (dodgeIframeRemaining > 0) {
    return {
      hpDamageTaken: 0,
      enemyPostureDamageDealt: Math.round(basePostureCounterDamage * 0.75),
      isPerfectDeflect: false,
      isPerfectDodge: true,
      staminaRestored: 28,
    };
  }
  return {
    hpDamageTaken: incomingHpDamage,
    enemyPostureDamageDealt: 0,
    isPerfectDeflect: false,
    isPerfectDodge: false,
    staminaRestored: 0,
  };
}

/**
 * Pure, deterministic AI state machine step for roaming Shadow Asura Demons.
 * Transitions across: 'patrol' -> 'chase' -> 'windup' -> 'strike' -> 'recover' -> 'stagger'
 * and triggers `didStrikePlayer = true` on the active lunge frame so enemies actively attack!
 */
export function stepDemonCombatAI(
  demon: {
    x: number;
    z: number;
    homeX: number;
    homeZ: number;
    yaw: number;
    state: DemonCombatState;
    stateTimer: number;
    attackCooldown: number;
    aggroRange: number;
    moveSpeed: number;
    archetype: DemonArchetype;
  },
  playerPos: Vec2XZ,
  elapsed: number,
  dt: number,
  isModalOpen = false
): {
  x: number;
  z: number;
  yaw: number;
  state: DemonCombatState;
  stateTimer: number;
  attackCooldown: number;
  didTriggerWindup: boolean;
  didStrikePlayer: boolean;
} {
  let { x, z, yaw, state, stateTimer, attackCooldown } = demon;
  attackCooldown = Math.max(0, attackCooldown - dt);
  stateTimer = Math.max(0, stateTimer - dt);

  let didTriggerWindup = false;
  let didStrikePlayer = false;

  const dx = playerPos.x - x;
  const dz = playerPos.z - z;
  const dist = Math.hypot(dx, dz);

  if (isModalOpen) {
    return {
      x,
      z,
      yaw,
      state: 'patrol',
      stateTimer: 0,
      attackCooldown,
      didTriggerWindup: false,
      didStrikePlayer: false,
    };
  }

  if (state === 'stagger') {
    if (stateTimer <= 0) {
      state = dist <= demon.aggroRange ? 'chase' : 'patrol';
    }
    return { x, z, yaw, state, stateTimer, attackCooldown, didTriggerWindup, didStrikePlayer };
  }

  if (state === 'windup') {
    yaw = Math.atan2(dx, dz);
    if (stateTimer <= 0) {
      state = 'strike';
      stateTimer = 0.24;
      // Lunge burst forward toward player during strike
      if (dist > 0.9) {
        const lungeDist = Math.min(dist - 0.85, 1.85);
        x += (dx / dist) * lungeDist;
        z += (dz / dist) * lungeDist;
      }
      const postLungeDist = Math.hypot(playerPos.x - x, playerPos.z - z);
      if (postLungeDist <= 3.85) {
        didStrikePlayer = true;
      }
    }
    return { x, z, yaw, state, stateTimer, attackCooldown, didTriggerWindup, didStrikePlayer };
  }

  if (state === 'strike') {
    yaw = Math.atan2(dx, dz);
    if (stateTimer <= 0) {
      state = 'recover';
      stateTimer = demon.archetype === 'stalker' ? 0.48 : 0.65;
      attackCooldown = demon.archetype === 'berserker' ? 1.05 : 1.35;
    }
    return { x, z, yaw, state, stateTimer, attackCooldown, didTriggerWindup, didStrikePlayer };
  }

  if (state === 'recover') {
    if (stateTimer <= 0) {
      state = dist <= demon.aggroRange ? 'chase' : 'patrol';
    }
    return { x, z, yaw, state, stateTimer, attackCooldown, didTriggerWindup, didStrikePlayer };
  }

  // 'patrol' or 'chase'
  if (dist <= demon.aggroRange) {
    state = 'chase';
    yaw = Math.atan2(dx, dz);
    const strikeTriggerDist = demon.archetype === 'vanguard' ? 3.5 : 3.2;

    if (dist > strikeTriggerDist) {
      const chaseSpeed = demon.moveSpeed;
      // Stalker weaves slightly while closing in; Berserker charges straight; Vanguard marches steadily
      const weaveAngle =
        demon.archetype === 'stalker' ? Math.sin(elapsed * 4.2 + demon.homeX) * 0.28 : 0;
      const moveAngle = yaw + weaveAngle;
      x += Math.sin(moveAngle) * chaseSpeed * dt;
      z += Math.cos(moveAngle) * chaseSpeed * dt;
    } else if (attackCooldown <= 0) {
      state = 'windup';
      stateTimer = demon.archetype === 'stalker' ? 0.36 : 0.45;
      didTriggerWindup = true;
    }
  } else {
    state = 'patrol';
    const patrolAngle = elapsed * 0.75 + demon.homeX * 0.5;
    const targetX = demon.homeX + Math.cos(patrolAngle) * 3.4;
    const targetZ = demon.homeZ + Math.sin(patrolAngle) * 3.4;
    const pdx = targetX - x;
    const pdz = targetZ - z;
    const pDist = Math.hypot(pdx, pdz);
    if (pDist > 0.05) {
      x += (pdx / pDist) * Math.min(pDist, 2.4 * dt);
      z += (pdz / pDist) * Math.min(pDist, 2.4 * dt);
      yaw = Math.atan2(pdx, pdz);
    }
  }

  return { x, z, yaw, state, stateTimer, attackCooldown, didTriggerWindup, didStrikePlayer };
}

/**
 * Computes dynamic camera FOV (degrees) for AAA game speed feel during sprint, dash, grapple, or parry focus.
 */
export function computeDynamicCameraFov(
  currentFov: number,
  horizontalSpeed: number,
  isDashing: boolean,
  isGrappling: boolean,
  isParrying: boolean,
  dt: number
): number {
  let targetFov = 55;
  if (isGrappling) {
    targetFov = 66;
  } else if (isDashing) {
    targetFov = 63;
  } else if (isParrying) {
    targetFov = 52;
  } else if (horizontalSpeed > 9.5) {
    targetFov = 59.5;
  } else if (horizontalSpeed > 4.0) {
    targetFov = 56.5;
  }
  const blend = 1 - Math.exp(-8.5 * Math.max(0.001, dt));
  return currentFov + (targetFov - currentFov) * blend;
}

/**
 * Computes combat style rank and bonus multiplier from consecutive hit streak.
 */
export function computeComboRank(comboHits: number): {
  rankCode: string;
  rankTitle: string;
  damageMultiplier: number;
} {
  if (comboHits >= 12) {
    return { rankCode: 'S', rankTitle: 'MAHA-ASTRA SOVEREIGN', damageMultiplier: 1.38 };
  }
  if (comboHits >= 7) {
    return { rankCode: 'A', rankTitle: 'SURYA BLADEMASTER', damageMultiplier: 1.24 };
  }
  if (comboHits >= 3) {
    return { rankCode: 'B', rankTitle: 'STHAPATI STRIKER', damageMultiplier: 1.14 };
  }
  return { rankCode: 'C', rankTitle: 'NANDAKA SEEKER', damageMultiplier: 1.0 };
}

/**
 * Shortest-path angular interpolation (radians) using frame-rate-independent damping.
 */
export function dampAngle(
  current: number,
  target: number,
  lambda: number,
  dt: number
): number {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  const factor = 1 - Math.exp(-lambda * dt);
  return current + diff * factor;
}

/**
 * Computes the relative horizontal compass offset (-1 to +1 across a 150-degree FOV ribbon)
 * for a target world point given the player's position and current camera heading (degrees, 0 = North/-Z).
 */
export function computeCompassRibbonOffset(
  playerPos: Vec2XZ,
  targetPos: Vec2XZ,
  headingDeg: number
): { normalizedOffset: number; distanceMeters: number; isInFrontArc: boolean } {
  const dx = targetPos.x - playerPos.x;
  const dz = targetPos.z - playerPos.z;
  const distanceMeters = Math.hypot(dx, dz);

  const targetBearingRad = Math.atan2(dx, -dz);
  const targetBearingDeg = ((targetBearingRad * 180) / Math.PI + 360) % 360;

  const deltaDeg = ((targetBearingDeg - headingDeg + 540) % 360) - 180;
  const maxHalfArc = 75;
  const isInFrontArc = Math.abs(deltaDeg) <= maxHalfArc;
  const normalizedOffset = Math.max(-1, Math.min(1, deltaDeg / maxHalfArc));

  return {
    normalizedOffset,
    distanceMeters,
    isInFrontArc,
  };
}

/**
 * Resolves circle colliders and outer world boundary so the player slides smoothly
 * around solid pillars, balustrades, trees, and outer mountain cliffs while still being able
 * to walk up onto monument plinths and stairs.
 */
export function resolveCollisions(
  pos: Vec2XZ,
  playerRadius: number,
  colliders: CircleCollider[],
  worldRadius = WORLD_RADIUS
): Vec2XZ {
  let x = pos.x;
  let z = pos.z;

  for (const col of colliders) {
    const dx = x - col.x;
    const dz = z - col.z;
    const dist = Math.hypot(dx, dz);
    const minDist = playerRadius + col.radius;
    if (dist < minDist) {
      if (dist < 1e-5) {
        x = col.x + minDist;
      } else {
        const push = (minDist - dist) / dist;
        x += dx * push;
        z += dz * push;
      }
    }
  }

  const r = Math.hypot(x, z);
  const maxR = worldRadius - playerRadius;
  if (r > maxR && r > 1e-5) {
    const scale = maxR / r;
    x *= scale;
    z *= scale;
  }

  return { x, z };
}

/**
 * Builds the static colliders for solid vertical structures (obelisks, tree trunks, bridge side-rails,
 * torana gateway columns, and inner sanctum pillars) so the player can step up onto monument plinths
 * without walking through solid stone columns or railings.
 */
export function getWorldColliders(): CircleCollider[] {
  const cols: CircleCollider[] = [
    // Wide flanking Great Plateau Lookout Obelisks
    { id: 'bastion-left', x: -9.5, z: 6.2, radius: 1.45 },
    { id: 'bastion-right', x: 9.5, z: 6.2, radius: 1.45 },
    // Twin Flanking Sacred Banyan Tree Trunks framing the mid-valley
    { id: 'banyan-west', x: -13.5, z: -2, radius: 1.55 },
    { id: 'banyan-east', x: 13.5, z: -2, radius: 1.55 },
    // Grand Torana Gateway & Front Celestial Aura Ring Pillars along northern avenue
    { id: 'torana-n-left', x: -4.3, z: -12.5, radius: 0.95 },
    { id: 'torana-n-right', x: 4.3, z: -12.5, radius: 0.95 },
    // Saraswati Bridge Side Balustrade Posts (keeps player on the bridge deck instead of walking through side rails)
    { id: 'bridge-rail-w1', x: -2.6, z: -6.5, radius: 0.42 },
    { id: 'bridge-rail-w2', x: -2.6, z: -3.5, radius: 0.42 },
    { id: 'bridge-rail-w3', x: -2.6, z: -0.5, radius: 0.42 },
    { id: 'bridge-rail-e1', x: 2.6, z: -6.5, radius: 0.42 },
    { id: 'bridge-rail-e2', x: 2.6, z: -3.5, radius: 0.42 },
    { id: 'bridge-rail-e3', x: 2.6, z: -0.5, radius: 0.42 },
    // 6 Portfolio Project Monument central sanctum cores (sized to the inner sanctum structure so outer stepped plinth is walkable!)
    { id: 'col-mandapa', x: 0, z: -26, radius: 2.15 },
    { id: 'col-jantar', x: 38, z: -16, radius: 2.35 },
    { id: 'col-oasis', x: 40, z: 24, radius: 2.15 },
    { id: 'col-ashoka', x: -38, z: 24, radius: 1.45 },
    { id: 'col-gopuram', x: -38, z: -16, radius: 2.35 },
    { id: 'col-stepwell', x: 0, z: 32, radius: 2.35 },
  ];

  return cols;
}

/**
 * Finds the nearest PortfolioStop and whether the player is within its interactionRadius.
 */
export function findNearestStop(
  playerPos: Vec2XZ,
  stops: PortfolioStop[] = PORTFOLIO_STOPS
): {
  nearestStop: PortfolioStop;
  distance: number;
  inRange: boolean;
} {
  let nearestStop = stops[0];
  let bestDist = Infinity;

  for (const stop of stops) {
    const d = Math.hypot(playerPos.x - stop.position.x, playerPos.z - stop.position.z);
    if (d < bestDist) {
      bestDist = d;
      nearestStop = stop;
    }
  }

  return {
    nearestStop,
    distance: bestDist,
    inRange: bestDist <= nearestStop.interactionRadius,
  };
}

/**
 * Finds the nearest Divine Weapon Forge Altar and whether the player is within interaction range.
 */
export function findNearestWeaponForge(
  playerPos: Vec2XZ,
  weapons: ForgeWeapon[] = FORGE_WEAPONS,
  interactRadius = WEAPON_FORGE_INTERACT_RADIUS
): {
  nearestWeapon: ForgeWeapon;
  distance: number;
  inRange: boolean;
} {
  let nearestWeapon = weapons[0];
  let bestDist = Infinity;

  for (const w of weapons) {
    const d = Math.hypot(playerPos.x - w.position.x, playerPos.z - w.position.z);
    if (d < bestDist) {
      bestDist = d;
      nearestWeapon = w;
    }
  }

  return {
    nearestWeapon,
    distance: bestDist,
    inRange: bestDist <= interactRadius,
  };
}

/**
 * Checks if the player is close enough to pick up any uncollected Sacred Lotus Jewel Relic.
 */
export function checkRelicPickup(
  playerPos: Vec2XZ,
  collectedIds: ReadonlySet<string>,
  relics: LotusRelic[] = LOTUS_RELICS,
  pickupRadius = RELIC_PICKUP_RADIUS
): LotusRelic | null {
  for (const relic of relics) {
    if (collectedIds.has(relic.id)) continue;
    const d = Math.hypot(playerPos.x - relic.position.x, playerPos.z - relic.position.z);
    if (d <= pickupRadius) {
      return relic;
    }
  }
  return null;
}

/**
 * Computes player's current Astra attack damage, posture break power, cleave radius, speed multiplier,
 * and active power color based on visited Portfolio Project Stops AND the currently equipped ForgeWeapon.
 */
export function computePlayerCombatStats(
  visitedStopIds: ReadonlySet<string>,
  stops: PortfolioStop[] = PORTFOLIO_STOPS,
  equippedWeaponId: WeaponId = 'weapon-nandaka'
): {
  attackDamage: number;
  postureDamage: number;
  attackRange: number;
  speedMultiplier: number;
  unlockedPowersCount: number;
  activeColorHex: string;
  latestPowerName: string;
  equippedWeapon: ForgeWeapon;
} {
  const equippedWeapon =
    FORGE_WEAPONS.find((w) => w.id === equippedWeaponId) || FORGE_WEAPONS[0];

  let bonusDamage = equippedWeapon.baseDamageBonus;
  let bonusRange = equippedWeapon.reachBonus;
  let unlockedPowersCount = 0;
  let activeColorHex = equippedWeapon.colorHex;
  let latestPowerName = equippedWeapon.name;

  for (const stop of stops) {
    if (visitedStopIds.has(stop.id)) {
      unlockedPowersCount += 1;
      bonusDamage += stop.unlockedPower.bonusDamage;
      bonusRange = Math.max(bonusRange, stop.unlockedPower.rangeBonus + equippedWeapon.reachBonus * 0.5);
      latestPowerName = `${equippedWeapon.name} · ${stop.unlockedPower.name}`;
    }
  }

  const attackDamage = BASE_ATTACK_DAMAGE + bonusDamage;
  return {
    attackDamage,
    postureDamage: Math.round(attackDamage * 1.38 + equippedWeapon.postureBonus),
    attackRange: BASE_ATTACK_RANGE + bonusRange,
    speedMultiplier: equippedWeapon.speedMultiplier,
    unlockedPowersCount,
    activeColorHex,
    latestPowerName,
    equippedWeapon,
  };
}

/**
 * Determines whether the Colossal Layoff Boss should awaken:
 * Returns true once all Project Stops are seen AND all Experience Relics are viewed, OR if manually summoned.
 */
export function shouldAwakenLayoffBoss(
  visitedStopsCount: number,
  collectedRelicsCount: number,
  manuallySummoned = false,
  totalStops = PORTFOLIO_STOPS.length,
  totalRelics = LOTUS_RELICS.length
): boolean {
  if (manuallySummoned) return true;
  return visitedStopsCount >= totalStops && collectedRelicsCount >= totalRelics;
}

/**
 * Computes overall Portfolio Verse world exploration metrics.
 */
export function computeCompletionStats(
  visitedStopsCount: number,
  collectedRelicsCount: number,
  totalStops = PORTFOLIO_STOPS.length,
  totalRelics = LOTUS_RELICS.length
): {
  visitedStopsCount: number;
  collectedRelicsCount: number;
  totalStops: number;
  totalRelics: number;
  completionPercent: number;
  isMastered: boolean;
} {
  const totalItems = Math.max(1, totalStops + totalRelics);
  const completedItems =
    Math.min(totalStops, visitedStopsCount) + Math.min(totalRelics, collectedRelicsCount);
  const completionPercent = Math.round((completedItems / totalItems) * 100);
  return {
    visitedStopsCount,
    collectedRelicsCount,
    totalStops,
    totalRelics,
    completionPercent,
    isMastered: visitedStopsCount >= totalStops && collectedRelicsCount >= totalRelics,
  };
}

/**
 * Returns the named region of Portfolio Verse for the HUD compass based on player coordinates.
 */
export function getRegionNameAt(x: number, z: number): string {
  const near = findNearestStop({ x, z });
  if (near.distance <= near.nearestStop.interactionRadius + 3.5) {
    return near.nearestStop.title;
  }
  if (z < -36) {
    return 'Rakshasa Ranga · Citadel of the Layoff Colossus';
  }
  if (Math.hypot(x, z - 8) < 6.5) {
    return 'Meru Lookout · Great Plateau Terrace';
  }
  if (Math.hypot(x, z) < 9.5) {
    return 'Saraswati Setu · Sacred River Bridge';
  }
  if (z < -12) {
    return 'Uttara Patha · Celestial Aura Gate & Ascent';
  }
  if (x > 14) {
    return 'Purva Vana · Solar Forge & Emerald Oasis';
  }
  if (x < -14) {
    return 'Paschima Vana · Twin-Blade Forge & Gopuram Terraces';
  }
  return 'Madhya Mandala · Open Valley of Portfolio Verse';
}
