import { PORTFOLIO_STOPS, LOTUS_RELICS, PortfolioStop, LotusRelic } from '../data/portfolioStops';

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

export const WORLD_RADIUS = 135;
export const PLAYER_RADIUS = 0.65;
export const BASE_WALK_SPEED = 9.2;
export const SPRINT_MULTIPLIER = 1.55;
export const PARAGLIDE_SPEED_MULTIPLIER = 1.32;
export const PARAGLIDE_TERMINAL_VY = -2.1;
export const RELIC_PICKUP_RADIUS = 2.8;
export const BASE_ATTACK_DAMAGE = 18;
export const BASE_ATTACK_RANGE = 4.6;
export const MAX_GRAPPLE_DISTANCE = 54;

/**
 * Deterministic terrain elevation at (x, z) across the 270m diameter Zelda-inspired Aryavarta Valley:
 * - Spawn corridor around (0, 8) sits on a gentle walkable Great Plateau terrace near y = 0.
 * - Northern Sovereign Mandapa (0, -26) sits on an elevated temple hillock (+1.45m).
 * - Far-Northern Rakshasa Citadel / Boss Arena (0, -48) forms a grand ceremonial plateau (+1.85m).
 * - East & West Sanctums sit on scenic elevated terraces.
 * - Winding Saraswati turquoise river channel cuts across z ~ -3.5 + sin(x*0.09)*3.6 with an arched stone ford at |x| < 4.5.
 * - Outer perimeter (r > 70m) rises into dramatic Himalayan/Vindhya mountain peaks.
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
    // Foothills between 56m and 64m
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

  // Elevated Boss Arena Citadel Plateau at (0, -48) — flat-topped inside r < 11.5m so player stands flush on the arena
  const distToBossArena = Math.hypot(x - 0, z - -48);
  let bossPlateau = 0;
  if (distToBossArena <= 11.5) {
    bossPlateau = 1.75;
  } else if (distToBossArena < 16.5) {
    const bt = 1 - (distToBossArena - 11.5) / 5.0;
    bossPlateau = bt * bt * (3 - 2 * bt) * 1.75;
  }

  // Gentle East & West Sanctuary Terraces (around x = ±38, z = -16 and ±38, z = 24)
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

  // Winding Saraswati river channel depression around z = -3.5 + sin(x * 0.09) * 3.4 (with arched bridge/ford at |x| < 4.4)
  const riverCenterZ = -3.5 + Math.sin(x * 0.09) * 3.4;
  const distToRiver = Math.abs(z - riverCenterZ);
  let riverDip = 0;
  if (distToRiver < 4.2 && Math.abs(x) > 4.0) {
    const bridgeBlend = Math.min(1, (Math.abs(x) - 4.0) / 3.2);
    const rt = 1 - distToRiver / 4.2;
    riverDip = -0.62 * rt * rt * bridgeBlend;
  }

  // Natural rolling Zelda meadow undulation away from main paths
  const onMainTrail = Math.abs(x) < 4.6 || Math.abs(z) < 4.0;
  let meadowWave = 0;
  if (!onMainTrail && distFromCenter <= 64) {
    meadowWave = 0.34 * Math.sin(x * 0.12) * Math.cos(z * 0.11);
  }

  return hillHeight + moundHeight + bossPlateau + terraceHeight + riverDip + meadowWave;
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
 * Computes Zelda-style Garuda Sky-Cloak Paraglider vertical physics when airborne.
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
    // Smoothly damp vertical descent toward gentle terminal glide velocity (-2.1 m/s)
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
 * Finds the best elevated Shrine / Monument Grapple Point within range (Sekiro Shinobi Grapple Hook).
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
  const targetY = groundHeightAt(targetX, targetZ);

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
      staminaRestored: 18,
    };
  }
  if (dodgeIframeRemaining > 0) {
    return {
      hpDamageTaken: 0,
      enemyPostureDamageDealt: Math.round(basePostureCounterDamage * 0.65),
      isPerfectDeflect: false,
      isPerfectDodge: true,
      staminaRestored: 25,
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
    return { rankCode: 'S', rankTitle: 'MAHA-ASTRA SOVEREIGN', damageMultiplier: 1.35 };
  }
  if (comboHits >= 7) {
    return { rankCode: 'A', rankTitle: 'SURYA BLADEMASTER', damageMultiplier: 1.22 };
  }
  if (comboHits >= 3) {
    return { rankCode: 'B', rankTitle: 'STHAPATI STRIKER', damageMultiplier: 1.12 };
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

  let deltaDeg = ((targetBearingDeg - headingDeg + 540) % 360) - 180;
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
 * around monument cores, colonnade pillars, and outer mountain cliffs.
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
 * Builds the default static colliders for the 6 project monuments, wide flanking lookout pillars, and sacred banyan trees.
 */
export function getWorldColliders(): CircleCollider[] {
  return [
    // Wide flanking Great Plateau Lookout Obelisks (set wide at ±9.5m so central vista is 100% open!)
    { id: 'bastion-left', x: -9.5, z: 6.2, radius: 1.45 },
    { id: 'bastion-right', x: 9.5, z: 6.2, radius: 1.45 },
    // Twin Flanking Sacred Banyan Tree Altars framing the mid-valley
    { id: 'banyan-west', x: -13.5, z: -2, radius: 1.75 },
    { id: 'banyan-east', x: 13.5, z: -2, radius: 1.75 },
    // 6 Portfolio Project Monument solid cores
    { id: 'col-mandapa', x: 0, z: -26, radius: 3.8 },
    { id: 'col-jantar', x: 38, z: -16, radius: 4.1 },
    { id: 'col-oasis', x: 40, z: 24, radius: 3.9 },
    { id: 'col-ashoka', x: -38, z: 24, radius: 2.9 },
    { id: 'col-gopuram', x: -38, z: -16, radius: 3.9 },
    { id: 'col-stepwell', x: 0, z: 32, radius: 4.2 },
    // Scenic Torana Gate pillars along northern avenue
    { id: 'torana-n-left', x: -4.2, z: -12.5, radius: 0.55 },
    { id: 'torana-n-right', x: 4.2, z: -12.5, radius: 0.55 },
  ];
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
 * Checks if the player is close enough to pick up any uncollected Sacred Lotus Relic.
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
 * Computes player's current Astra attack damage, posture break power, cleave radius, and active power color
 * based on which Portfolio Project Stops have been visited.
 */
export function computePlayerCombatStats(
  visitedStopIds: ReadonlySet<string>,
  stops: PortfolioStop[] = PORTFOLIO_STOPS
): {
  attackDamage: number;
  postureDamage: number;
  attackRange: number;
  unlockedPowersCount: number;
  activeColorHex: string;
  latestPowerName: string;
} {
  let bonusDamage = 0;
  let bonusRange = 0;
  let unlockedPowersCount = 0;
  let activeColorHex = '#38bdf8';
  let latestPowerName = 'Nandaka Seeker Katana';

  for (const stop of stops) {
    if (visitedStopIds.has(stop.id)) {
      unlockedPowersCount += 1;
      bonusDamage += stop.unlockedPower.bonusDamage;
      bonusRange = Math.max(bonusRange, stop.unlockedPower.rangeBonus);
      activeColorHex = stop.unlockedPower.colorHex;
      latestPowerName = stop.unlockedPower.name;
    }
  }

  const attackDamage = BASE_ATTACK_DAMAGE + bonusDamage;
  return {
    attackDamage,
    postureDamage: Math.round(attackDamage * 1.35),
    attackRange: BASE_ATTACK_RANGE + bonusRange,
    unlockedPowersCount,
    activeColorHex,
    latestPowerName,
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
 * Computes overall portfolio world exploration metrics.
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
 * Returns the named region of Aryavarta for the HUD compass based on player coordinates.
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
    return 'Uttara Patha · Crown Hill Ascent';
  }
  if (x > 14) {
    return 'Purva Vana · Observatory & Emerald Oasis';
  }
  if (x < -14) {
    return 'Paschima Vana · Treasury & Gopuram Terraces';
  }
  return 'Madhya Mandala · Open Valley of Aryavarta';
}
