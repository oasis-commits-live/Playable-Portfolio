import {
  PORTFOLIO_STOPS,
  UNFINISHED_SANCTUMS,
  LOTUS_RELICS,
  FORGE_WEAPONS,
  LAYOFF_BOSS_CONFIG,
  RECRUITER_TEMPLE_CONFIG,
  HYPO_GUIDE_CONFIG,
  PortfolioStop,
  UnfinishedSanctum,
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

export const WORLD_RADIUS = 175;
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



export interface DirectionalGuidanceResult {
  distance: number;
  bearingDeg: number;
  relativeBearingDeg: number;
  cardinalLabel: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
  turnDirection: 'ahead' | 'left' | 'right' | 'behind';
  turnInstruction: string;
}

/**
 * Computes compass bearing, relative turn angle, cardinal direction, and human-readable turn instruction
 * from the player's current position and camera heading toward a target point.
 */
export function computeDirectionalGuidance(
  playerPos: Vec2XZ,
  targetPos: Vec2XZ,
  headingDeg: number
): DirectionalGuidanceResult {
  const dx = targetPos.x - playerPos.x;
  const dz = targetPos.z - playerPos.z;
  const distance = Math.round(Math.hypot(dx, dz));
  // North is -Z (0 deg), East is +X (90 deg), South is +Z (180 deg), West is -X (270 deg)
  const rad = Math.atan2(dx, -dz);
  const bearingDeg = (((rad * (180 / Math.PI)) % 360) + 360) % 360;
  const relativeBearingDeg = ((bearingDeg - headingDeg + 540) % 360) - 180;

  const cardinals: ('N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW')[] = [
    'N',
    'NE',
    'E',
    'SE',
    'S',
    'SW',
    'W',
    'NW',
  ];
  const cardinalIdx = Math.round(bearingDeg / 45) % 8;
  const cardinalLabel = cardinals[cardinalIdx];

  const absRel = Math.abs(relativeBearingDeg);
  let turnDirection: 'ahead' | 'left' | 'right' | 'behind';
  let turnInstruction: string;

  if (absRel <= 22) {
    turnDirection = 'ahead';
    turnInstruction = 'Straight Ahead';
  } else if (absRel >= 135) {
    turnDirection = 'behind';
    turnInstruction = 'Behind You · Turn Around';
  } else if (relativeBearingDeg < 0) {
    turnDirection = 'left';
    turnInstruction = absRel <= 55 ? 'Bear Left' : 'Turn Left';
  } else {
    turnDirection = 'right';
    turnInstruction = absRel <= 55 ? 'Bear Right' : 'Turn Right';
  }

  return {
    distance,
    bearingDeg,
    relativeBearingDeg,
    cardinalLabel,
    turnDirection,
    turnInstruction,
  };
}

/**
 * Finds the next unvisited PortfolioStop for guidance.
 */
export function findNextGuidanceSanctum(
  playerPos: Vec2XZ,
  visitedStopIds: ReadonlySet<string>,
  stops: PortfolioStop[] = PORTFOLIO_STOPS
): { stop: PortfolioStop; distance: number } | null {
  const unvisited = stops.filter((s) => !visitedStopIds.has(s.id));
  if (unvisited.length === 0) return null;

  const nextByIndex = [...unvisited].sort((a, b) => a.indexNumber.localeCompare(b.indexNumber))[0];
  const distance = Math.hypot(
    playerPos.x - nextByIndex.position.x,
    playerPos.z - nextByIndex.position.z
  );

  return { stop: nextByIndex, distance };
}

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
  // Highland & Hillside Boulder Outcrops
  { x: -64.0, z: -22.0, scale: 1.85 },
  { x: 64.0, z: -22.0, scale: 1.85 },
  { x: -68.0, z: 24.0, scale: 1.9 },
  { x: 68.0, z: 24.0, scale: 1.9 },
  { x: -42.0, z: -64.0, scale: 1.75 },
  { x: 42.0, z: -64.0, scale: 1.75 },
  { x: -44.0, z: 66.0, scale: 1.8 },
  { x: 44.0, z: 66.0, scale: 1.8 },
  { x: -88.0, z: 2.0, scale: 2.1 },
  { x: 88.0, z: 2.0, scale: 2.1 },
  { x: 0.0, z: -84.0, scale: 2.2 },
  { x: 0.0, z: 86.0, scale: 2.1 },
];

export interface TreeGroveNode {
  x: number;
  z: number;
  s: number;
  golden: boolean;
}

/**
 * Canonical 56-Tree Sacred Forest & Highland Grove coordinates shared between
 * 3D scene rendering (`proceduralScene.ts`) and solid trunk collision physics (`getWorldColliders()`).
 */
export const TREE_GROVE_POSITIONS: ReadonlyArray<TreeGroveNode> = [
  // Inner Valley Sacred Banyans & Golden Peepals (18)
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
  { x: -18, z: 52, s: 1.55, golden: true },
  { x: 18, z: 52, s: 1.55, golden: false },
  // Mid-Slope & Sanctum Perimeter Groves (16)
  { x: -34, z: -44, s: 1.6, golden: false },
  { x: 34, z: -44, s: 1.6, golden: true },
  { x: -34, z: 48, s: 1.6, golden: true },
  { x: 34, z: 48, s: 1.6, golden: false },
  { x: -58, z: -20, s: 1.7, golden: true },
  { x: 58, z: -20, s: 1.7, golden: false },
  { x: -58, z: 20, s: 1.7, golden: false },
  { x: 58, z: 20, s: 1.7, golden: true },
  { x: -14, z: 22, s: 1.32, golden: false },
  { x: 14, z: 22, s: 1.32, golden: true },
  { x: -15, z: -16, s: 1.35, golden: true },
  { x: 15, z: -16, s: 1.35, golden: false },
  { x: -28, z: -14, s: 1.42, golden: false },
  { x: 28, z: -14, s: 1.42, golden: true },
  { x: -28, z: 16, s: 1.42, golden: true },
  { x: 28, z: 16, s: 1.42, golden: false },
  // Surrounding Hillside & Highland Ridge Groves (22) — fills the surrounding hills with lush canopy volume!
  { x: -76, z: -12, s: 1.85, golden: false },
  { x: 76, z: -12, s: 1.85, golden: true },
  { x: -78, z: 16, s: 1.85, golden: true },
  { x: 78, z: 16, s: 1.85, golden: false },
  { x: -68, z: -48, s: 1.9, golden: false },
  { x: 68, z: -48, s: 1.9, golden: true },
  { x: -68, z: 50, s: 1.9, golden: true },
  { x: 68, z: 50, s: 1.9, golden: false },
  { x: -46, z: -76, s: 1.85, golden: true },
  { x: 46, z: -76, s: 1.85, golden: false },
  { x: -46, z: 78, s: 1.85, golden: false },
  { x: 46, z: 78, s: 1.85, golden: true },
  { x: -22, z: -82, s: 1.8, golden: false },
  { x: 22, z: -82, s: 1.8, golden: true },
  { x: -22, z: 82, s: 1.8, golden: true },
  { x: 22, z: 82, s: 1.8, golden: false },
  { x: -96, z: -32, s: 2.05, golden: true },
  { x: 96, z: -32, s: 2.05, golden: false },
  { x: -96, z: 32, s: 2.05, golden: false },
  { x: 96, z: 32, s: 2.05, golden: true },
  { x: -84, z: -68, s: 1.95, golden: false },
  { x: 84, z: -68, s: 1.95, golden: true },
];

export const HILL_SHRINE_PILLARS: ReadonlyArray<{ x: number; z: number; scale: number }> = [
  { x: -82, z: 0, scale: 1.35 },
  { x: 82, z: 0, scale: 1.35 },
  { x: -62, z: -62, scale: 1.4 },
  { x: 62, z: -62, scale: 1.4 },
  { x: -62, z: 62, scale: 1.4 },
  { x: 62, z: 62, scale: 1.4 },
  { x: 0, z: -76, scale: 1.45 },
  { x: 0, z: 78, scale: 1.45 },
];

/**
 * Deterministic macro terrain elevation at (x, z) across the expanded 350m diameter Portfolio Verse Valley:
 * - Spawn corridor around (0, 8) sits on a gentle walkable Great Plateau terrace near y = 0.
 * - Northern Sovereign Mandapa (0, -26) sits on an elevated temple hillock (+1.45m).
 * - Far-Northern Rakshasa Citadel / Boss Arena (0, -48) forms a grand ceremonial plateau (+1.75m).
 * - Southern Sankalpa Mandapa / Recruiter Opportunity Temple (0, 54) sits on a royal golden terrace (+1.35m).
 * - East & West Sanctums sit on scenic elevated terraces.
 * - Winding Saraswati turquoise river channel cuts across z ~ -3.5 + sin(x*0.09)*3.4 with an arched stone ford at |x| < 4.5.
 * - Outer perimeter (r > 72m) rises into dramatic Himalayan/Vindhya mountain peaks.
 */
export function groundHeightAt(x: number, z: number): number {
  const distFromCenter = Math.hypot(x, z);

  // Sculpted walkable 3D mountain peaks and passes rising beyond 72m (player can climb right up the slopes!)
  let hillHeight = 0;
  if (distFromCenter > 72) {
    const t = Math.min(1, (distFromCenter - 72) / 86);
    const smooth = t * t * (3 - 2 * t);
    const angle = Math.atan2(z, x);
    // 8 distinct grand mountain peaks around the valley perimeter with climbable passes between them
    const peakCrown = 0.5 + 0.5 * Math.cos(angle * 8 + Math.sin(angle * 3) * 0.6);
    const ridgeWave =
      0.55 * Math.sin(x * 0.075) * Math.cos(z * 0.075) +
      0.45 * Math.cos((x - z) * 0.055);
    hillHeight = smooth * (15.5 + peakCrown * 12.0 + ridgeWave * 4.2);
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

  // Elevated Southern Recruiter Opportunity Temple Plateau at (0, 54)
  const distToRecruiterTemple = Math.hypot(
    x - RECRUITER_TEMPLE_CONFIG.position.x,
    z - RECRUITER_TEMPLE_CONFIG.position.z
  );
  let recruiterPlateau = 0;
  if (distToRecruiterTemple <= 10.5) {
    recruiterPlateau = 1.35;
  } else if (distToRecruiterTemple < 16.0) {
    const rt = 1 - (distToRecruiterTemple - 10.5) / 5.5;
    recruiterPlateau = rt * rt * (3 - 2 * rt) * 1.35;
  }

  // Gentle East, West & Southern Construction Sanctuary Terraces
  let terraceHeight = 0;
  const sideDist = Math.min(
    Math.hypot(x - 38, z - -16),
    Math.hypot(x - 40, z - 24),
    Math.hypot(x - -38, z - 24),
    Math.hypot(x - -38, z - -16),
    Math.hypot(x - 26, z - 44),
    Math.hypot(x - -26, z - 44)
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
  if (!onMainTrail && distFromCenter <= 72) {
    meadowWave = 0.28 * Math.sin(x * 0.12) * Math.cos(z * 0.11);
  }

  return hillHeight + moundHeight + bossPlateau + recruiterPlateau + terraceHeight + riverDip + meadowWave;
}

/**
 * Returns true if the player is standing on a hard stone causeway, bridge, temple plinth, or arena floor
 * (used for stone vs. meadow grass footstep acoustic foley).
 */
export function isOnStoneSurfaceAt(x: number, z: number): boolean {
  // Main North-South Flagstone Causeway (from Northern Boss Arena z=-48 to Southern Recruiter Temple z=54)
  if (Math.abs(x) <= 2.8 && z >= -52 && z <= 60) return true;
  // Northern Boss Arena
  if (Math.hypot(x, z + 48) <= 12.2) return true;
  // Southern Recruiter Opportunity Temple
  if (
    Math.hypot(
      x - RECRUITER_TEMPLE_CONFIG.position.x,
      z - RECRUITER_TEMPLE_CONFIG.position.z
    ) <= 9.0
  ) {
    return true;
  }
  // 6 Project Sanctum Plinths
  for (const stop of PORTFOLIO_STOPS) {
    if (Math.hypot(x - stop.position.x, z - stop.position.z) <= 6.8) return true;
  }
  // 2 Unfinished Construction Sanctum Plinths
  for (const wip of UNFINISHED_SANCTUMS) {
    if (Math.hypot(x - wip.position.x, z - wip.position.z) <= 6.5) return true;
  }
  // 4 Weapon Forge Altars
  for (const wf of FORGE_WEAPONS) {
    if (Math.hypot(x - wf.position.x, z - wf.position.z) <= 2.3) return true;
  }
  return false;
}

/**
 * Computes the true 3D walkable surface elevation at (x, z), accounting for:
 * - Macro terrain (`groundHeightAt`)
 * - Royal Saraswati Bridge deck & approach ramps at (0, -3.5)
 * - 6 Portfolio Sanctum stepped Jagati plinths, upper sanctum decks, and front Sopana staircases
 * - Southern Recruiter Opportunity Temple stepped mandapa & stairs at (0, 54)
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

  // 2A. 2 Unfinished Construction Sanctums (Stepped Foundation Plinths + Front Approach Ramps)
  for (const wip of UNFINISHED_SANCTUMS) {
    const dx = x - wip.position.x;
    const dz = z - wip.position.z;
    const r = Math.hypot(dx, dz);
    if (r > 7.4) continue;

    const wipBaseY = groundHeightAt(wip.position.x, wip.position.z);
    if (Math.abs(dx) <= 1.65 && dz >= 4.2 && dz <= 6.8) {
      const stairT = 1 - Math.max(0, Math.min(1, (dz - 4.4) / 2.2));
      const stairY = wipBaseY + stairT * 0.72;
      if (stairY > bestSurfaceY && canStepOnto(stairY)) {
        bestSurfaceY = stairY;
      }
    }
    if (r <= 5.65) {
      const step1Y = wipBaseY + 0.46;
      if (step1Y > bestSurfaceY && canStepOnto(step1Y)) {
        bestSurfaceY = step1Y;
      }
    }
    if (r <= 4.35) {
      const step2Y = wipBaseY + 0.72;
      if (step2Y > bestSurfaceY && canStepOnto(step2Y)) {
        bestSurfaceY = step2Y;
      }
    }
  }

  // 2B. Southern Recruiter Opportunity Temple (Sankalpa Mandapa) at (0, 54)
  {
    const tx = RECRUITER_TEMPLE_CONFIG.position.x;
    const tz = RECRUITER_TEMPLE_CONFIG.position.z;
    const dx = x - tx;
    const dz = z - tz;
    const r = Math.hypot(dx, dz);
    if (r <= 9.6) {
      const templeBaseY = groundHeightAt(tx, tz);
      // Northern approach staircase (`dz` from -8.8 to -5.5)
      if (Math.abs(dx) <= 2.2 && dz >= -8.8 && dz <= -5.5) {
        const stairT = 1 - Math.max(0, Math.min(1, (-dz - 5.5) / 3.3));
        const stairY = templeBaseY + stairT * 1.05;
        if (stairY > bestSurfaceY && canStepOnto(stairY)) {
          bestSurfaceY = stairY;
        }
      }
      if (r <= 7.8) {
        const step1Y = templeBaseY + 0.52;
        if (step1Y > bestSurfaceY && canStepOnto(step1Y)) {
          bestSurfaceY = step1Y;
        }
      }
      if (r <= 6.2) {
        const step2Y = templeBaseY + 1.05;
        if (step2Y > bestSurfaceY && canStepOnto(step2Y)) {
          bestSurfaceY = step2Y;
        }
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
 * - Territorial Aggro Rule: Asuras ONLY attack when the player enters their dedicated territory zone
 *   (`dist <= demon.aggroRange` AND `playerDistFromHome <= territoryRadius`).
 * - If the player leaves their territory (`playerDistFromHome > territoryRadius + 2.5`), the Asura disengages
 *   and returns to patrolling its territory.
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
    territoryRadius?: number;
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

  const territoryMax = demon.territoryRadius ?? demon.aggroRange + 3.0;
  const playerDistFromHome = Math.hypot(playerPos.x - demon.homeX, playerPos.z - demon.homeZ);
  const isPlayerInTerritory =
    dist <= demon.aggroRange && playerDistFromHome <= territoryMax;

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
      state = isPlayerInTerritory ? 'chase' : 'patrol';
    }
    return { x, z, yaw, state, stateTimer, attackCooldown, didTriggerWindup, didStrikePlayer };
  }

  if (state === 'windup') {
    yaw = Math.atan2(dx, dz);
    if (stateTimer <= 0) {
      state = 'strike';
      stateTimer = 0.24;
      // Lunge burst forward toward player during strike
      if (dist > 0.85) {
        const lungeDist = Math.min(dist - 0.8, 2.25);
        x += (dx / dist) * lungeDist;
        z += (dz / dist) * lungeDist;
      }
      const postLungeDist = Math.hypot(playerPos.x - x, playerPos.z - z);
      if (postLungeDist <= 4.15) {
        didStrikePlayer = true;
      }
    }
    return { x, z, yaw, state, stateTimer, attackCooldown, didTriggerWindup, didStrikePlayer };
  }

  if (state === 'strike') {
    yaw = Math.atan2(dx, dz);
    if (stateTimer <= 0) {
      state = 'recover';
      stateTimer = demon.archetype === 'stalker' ? 0.55 : 0.68;
      attackCooldown = demon.archetype === 'berserker' ? 1.65 : 1.95;
    }
    return { x, z, yaw, state, stateTimer, attackCooldown, didTriggerWindup, didStrikePlayer };
  }

  if (state === 'recover') {
    if (stateTimer <= 0) {
      state = isPlayerInTerritory ? 'chase' : 'patrol';
    }
    return { x, z, yaw, state, stateTimer, attackCooldown, didTriggerWindup, didStrikePlayer };
  }

  // 'patrol' or 'chase' — ONLY chase if player has stepped inside the demon's territory!
  if (isPlayerInTerritory) {
    state = 'chase';
    yaw = Math.atan2(dx, dz);
    const strikeTriggerDist = demon.archetype === 'vanguard' ? 3.7 : 3.4;

    if (dist > strikeTriggerDist) {
      const chaseSpeed = demon.moveSpeed * 1.05;
      const weaveAngle =
        demon.archetype === 'stalker' ? Math.sin(elapsed * 4.2 + demon.homeX) * 0.28 : 0;
      const moveAngle = yaw + weaveAngle;
      const nextX = x + Math.sin(moveAngle) * chaseSpeed * dt;
      const nextZ = z + Math.cos(moveAngle) * chaseSpeed * dt;
      // Clamp demon to its territorial leash
      const distFromHomeNext = Math.hypot(nextX - demon.homeX, nextZ - demon.homeZ);
      if (distFromHomeNext <= territoryMax + 1.5) {
        x = nextX;
        z = nextZ;
      }
    } else if (attackCooldown <= 0) {
      state = 'windup';
      stateTimer = demon.archetype === 'stalker' ? 0.42 : 0.48;
      didTriggerWindup = true;
    }
  } else {
    state = 'patrol';
    const patrolAngle = elapsed * 0.65 + demon.homeX * 0.5;
    const targetX = demon.homeX + Math.cos(patrolAngle) * 3.2;
    const targetZ = demon.homeZ + Math.sin(patrolAngle) * 3.2;
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

  // 3 iterative relaxation passes ensure zero tunneling or corner wedging against bridges, trees, and pillars
  for (let pass = 0; pass < 3; pass++) {
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
 * Builds the static colliders for all solid vertical structures across Portfolio Verse:
 * - All 56 Sacred Banyan, Peepal & Highland Trees (`TREE_GROVE_POSITIONS`)
 * - Continuous Saraswati Bridge side balustrades (impenetrable side walls along z in [-7.8, 0.8])
 * - Grand Torana Gateway columns, Lookout Obelisks, and Hypo Companion Pedestal
 * - 6 Portfolio Project Monument sanctum cores & front staircase balustrade side-walls
 * - Southern Recruiter Opportunity Temple central altar & 8 outer Hoysala columns
 * - 8 Northern Boss Citadel perimeter obelisks & 8 Highland Shrine Pillars
 */
export function getWorldColliders(): CircleCollider[] {
  const cols: CircleCollider[] = [
    // Wide flanking Great Plateau Lookout Obelisks
    { id: 'bastion-left', x: -9.5, z: 6.2, radius: 1.45 },
    { id: 'bastion-right', x: 9.5, z: 6.2, radius: 1.45 },
    // Twin Flanking Sacred Banyan Tree Trunks framing the mid-valley (kept with canonical IDs for backwards compatibility)
    { id: 'banyan-west', x: -13.5, z: -2, radius: 1.15 },
    { id: 'banyan-east', x: 13.5, z: -2, radius: 1.15 },
    // Grand Torana Gateway & Front Celestial Aura Ring Pillars along northern avenue
    { id: 'torana-n-left', x: -4.3, z: -12.5, radius: 0.95 },
    { id: 'torana-n-right', x: 4.3, z: -12.5, radius: 0.95 },
    // Hypo Companion Pedestal at Meru Lookout (3.8, 5.4)
    {
      id: 'col-hypo-pedestal',
      x: HYPO_GUIDE_CONFIG.position.x,
      z: HYPO_GUIDE_CONFIG.position.z,
      radius: 0.78,
    },
    // 6 Portfolio Project Monument central sanctum cores (sized to the inner sanctum structure so outer stepped plinth is walkable!)
    { id: 'col-mandapa', x: 0, z: -26, radius: 2.15 },
    { id: 'col-jantar', x: 38, z: -16, radius: 2.35 },
    { id: 'col-oasis', x: 40, z: 24, radius: 2.15 },
    { id: 'col-ashoka', x: -38, z: 24, radius: 1.45 },
    { id: 'col-gopuram', x: -38, z: -16, radius: 2.35 },
    { id: 'col-stepwell', x: 0, z: 32, radius: 2.35 },
    // 2 Unfinished Construction Sanctum central scaffolding & boulder cores
    { id: 'col-wip-adtech', x: 26, z: 44, radius: 2.35 },
    { id: 'col-wip-sisyphean', x: -26, z: 44, radius: 2.35 },
    // Southern Recruiter Opportunity Temple central altar pedestal
    {
      id: 'col-recruiter-temple-core',
      x: RECRUITER_TEMPLE_CONFIG.position.x,
      z: RECRUITER_TEMPLE_CONFIG.position.z,
      radius: 1.85,
    },
  ];

  // Continuous Saraswati Bridge Side Balustrade Walls (13 densely spaced overlapping colliders per side from z = -7.7 to z = +0.7)
  const bridgeZPoints = [-7.7, -7.0, -6.3, -5.6, -4.9, -4.2, -3.5, -2.8, -2.1, -1.4, -0.7, 0.0, 0.7];
  bridgeZPoints.forEach((bz, idx) => {
    cols.push(
      { id: `bridge-rail-w${idx + 1}`, x: -2.62, z: bz, radius: 0.44 },
      { id: `bridge-rail-e${idx + 1}`, x: 2.62, z: bz, radius: 0.44 }
    );
  });

  // All 56 Sacred Banyan, Peepal & Highland Tree Trunks
  TREE_GROVE_POSITIONS.forEach((tree, idx) => {
    // Skip idx 0 & 1 which are already registered as 'banyan-west' and 'banyan-east'
    if (idx < 2) return;
    cols.push({
      id: `tree-trunk-${idx}`,
      x: tree.x,
      z: tree.z,
      radius: 0.58 * tree.s,
    });
  });

  // Monument Front Staircase Balustrade Side-Walls (so player walks up the steps instead of clipping through side walls)
  for (const stop of PORTFOLIO_STOPS) {
    for (const side of [-1.48, 1.48]) {
      cols.push(
        {
          id: `stair-rail-${stop.id}-${side < 0 ? 'w' : 'e'}-1`,
          x: stop.position.x + side,
          z: stop.position.z + 5.3,
          radius: 0.34,
        },
        {
          id: `stair-rail-${stop.id}-${side < 0 ? 'w' : 'e'}-2`,
          x: stop.position.x + side,
          z: stop.position.z + 6.4,
          radius: 0.34,
        }
      );
    }
  }

  // Southern Recruiter Temple 8 Outer Hoysala Columns
  for (let p = 0; p < 8; p++) {
    const a = (p / 8) * Math.PI * 2 + Math.PI / 8;
    cols.push({
      id: `rec-temple-pillar-${p}`,
      x: RECRUITER_TEMPLE_CONFIG.position.x + Math.cos(a) * 4.4,
      z: RECRUITER_TEMPLE_CONFIG.position.z + Math.sin(a) * 4.4,
      radius: 0.48,
    });
  }

  // Northern Boss Arena Perimeter Obelisks
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    if (Math.sin(a) > 0.45) continue;
    cols.push({
      id: `boss-obelisk-${i}`,
      x: Math.cos(a) * 10.8,
      z: -48 + Math.sin(a) * 10.8,
      radius: 0.55,
    });
  }

  // 8 Highland Shrine Ruin Pillars on the Surrounding Hills
  HILL_SHRINE_PILLARS.forEach((hp, idx) => {
    cols.push({
      id: `hill-shrine-pillar-${idx}`,
      x: hp.x,
      z: hp.z,
      radius: 0.72 * hp.scale,
    });
  });

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
 * Finds the nearest Unfinished / Under-Construction Sanctum (`UNFINISHED_SANCTUMS`) and whether the player is within its interactionRadius.
 */
export function findNearestUnfinishedSanctum(
  playerPos: Vec2XZ,
  sanctums: UnfinishedSanctum[] = UNFINISHED_SANCTUMS
): {
  nearestSanctum: UnfinishedSanctum;
  distance: number;
  inRange: boolean;
} {
  let nearestSanctum = sanctums[0];
  let bestDist = Infinity;

  for (const s of sanctums) {
    const d = Math.hypot(playerPos.x - s.position.x, playerPos.z - s.position.z);
    if (d < bestDist) {
      bestDist = d;
      nearestSanctum = s;
    }
  }

  return {
    nearestSanctum,
    distance: bestDist,
    inRange: bestDist <= nearestSanctum.interactionRadius,
  };
}

/**
 * Checks whether the player is within interaction range of the Southern Recruiter Opportunity Temple.
 */
export function isNearRecruiterTemple(
  playerPos: Vec2XZ,
  interactRadius = RECRUITER_TEMPLE_CONFIG.interactionRadius
): { inRange: boolean; distance: number } {
  const distance = Math.hypot(
    playerPos.x - RECRUITER_TEMPLE_CONFIG.position.x,
    playerPos.z - RECRUITER_TEMPLE_CONFIG.position.z
  );
  return {
    inRange: distance <= interactRadius,
    distance,
  };
}

/**
 * Checks whether the player is within interaction range of Hypo the Companion Guide near Spawn.
 */
export function isNearHypoGuide(
  playerPos: Vec2XZ,
  interactRadius = HYPO_GUIDE_CONFIG.interactionRadius
): { inRange: boolean; distance: number } {
  const distance = Math.hypot(
    playerPos.x - HYPO_GUIDE_CONFIG.position.x,
    playerPos.z - HYPO_GUIDE_CONFIG.position.z
  );
  return {
    inRange: distance <= interactRadius,
    distance,
  };
}

/**
 * Checks whether the player is standing inside or right beside the Northern Boss Challenge Circle at (0, -45.8).
 */
export function isInsideBossChallengeCircle(
  playerPos: Vec2XZ,
  radius = LAYOFF_BOSS_CONFIG.challengeCircleRadius
): { inRange: boolean; distance: number } {
  const distance = Math.hypot(
    playerPos.x - LAYOFF_BOSS_CONFIG.challengeCirclePosition.x,
    playerPos.z - LAYOFF_BOSS_CONFIG.challengeCirclePosition.z
  );
  return {
    inRange: distance <= radius,
    distance,
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
 * - The Layoff Boss CANNOT be challenged without seeing all 6 Project Sanctums first (`visitedStopsCount >= totalStops`).
 * - AND it does NOT auto-spawn when the 6th project is viewed! The player must explicitly challenge the boss
 *   at the Northern Citadel Challenge Circle (`manuallySummoned === true`).
 */
export function shouldAwakenLayoffBoss(
  visitedStopsCount: number,
  _collectedRelicsCount = 0,
  manuallySummoned = false,
  totalStops = PORTFOLIO_STOPS.length
): boolean {
  return visitedStopsCount >= totalStops && Boolean(manuallySummoned);
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
  const nearWip = findNearestUnfinishedSanctum({ x, z });
  if (nearWip.distance <= nearWip.nearestSanctum.interactionRadius + 3.0) {
    return `${nearWip.nearestSanctum.title} · Under Construction`;
  }
  if (
    Math.hypot(
      x - RECRUITER_TEMPLE_CONFIG.position.x,
      z - RECRUITER_TEMPLE_CONFIG.position.z
    ) <= 13.5
  ) {
    return 'Sankalpa Mandapa · Temple of Opportunities';
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
  if (z > 40) {
    return 'Dakshina Patha · Royal Opportunity Promenade';
  }
  if (x > 14) {
    return 'Purva Vana · Solar Forge & Emerald Oasis';
  }
  if (x < -14) {
    return 'Paschima Vana · Twin-Blade Forge & Gopuram Terraces';
  }
  if (Math.hypot(x, z) > 68) {
    return 'Himavat Shikhara · Walkable Mountain Peaks';
  }
  return 'Madhya Mandala · Open Valley of Portfolio Verse';
}

/**
 * Determines whether the Indra Vajra Sky-Lightning Bolt super power is unlocked:
 * Requires all 6 Project Sanctums (`visitedStopsCount >= totalStops`) to be inspected.
 */
export function canCastLightningBolt(
  visitedStopsCount: number,
  totalStops = PORTFOLIO_STOPS.length
): boolean {
  return visitedStopsCount >= totalStops;
}

/**
 * Computes the Layoff Monster's melee damage multiplier:
 * - Before all 6 projects are unlocked, the Layoff Monster has 75% Corporate Shield resistance (0.25x damage), making it nearly impossible to brute-force early.
 * - Even after all 6 projects are unlocked, melee deals 0.65x damage so the player uses the Sky-Lightning Bolt to chunk or finish it!
 */
export function computeBossMeleeMultiplier(
  visitedStopsCount: number,
  totalStops = PORTFOLIO_STOPS.length
): number {
  return visitedStopsCount >= totalStops ? 0.65 : 0.25;
}

/**
 * Computes the Sky-Lightning Bolt damage against the Layoff Monster or a Corporate Asura.
 */
export function computeLightningBoltDamage(isBoss: boolean): {
  hpDamage: number;
  postureDamage: number;
} {
  if (isBoss) {
    return {
      hpDamage: 560,
      postureDamage: 100,
    };
  }
  return {
    hpDamage: 999,
    postureDamage: 100,
  };
}


