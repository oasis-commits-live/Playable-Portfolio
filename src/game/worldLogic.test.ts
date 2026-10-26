import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  groundHeightAt,
  walkableSurfaceHeightAt,
  applyRadialDeadzone,
  computeMovementVector,
  computeParagliderPhysics,
  findBestGrappleTarget,
  resolveSekiroDeflect,
  resolveCombatDefense,
  stepDemonCombatAI,
  computeDynamicCameraFov,
  computeComboRank,
  dampAngle,
  computeCompassRibbonOffset,
  resolveCollisions,
  findNearestStop,
  findNearestWeaponForge,
  checkRelicPickup,
  computeCompletionStats,
  computePlayerCombatStats,
  shouldAwakenLayoffBoss,
  getWorldColliders,
  getRegionNameAt,
  BASE_WALK_SPEED,
  SPRINT_MULTIPLIER,
  PARAGLIDE_TERMINAL_VY,
  WORLD_RADIUS,
} from './worldLogic';
import { PORTFOLIO_STOPS, LOTUS_RELICS, FORGE_WEAPONS } from '../data/portfolioStops';

test('groundHeightAt keeps central path walkable, elevates northern mound, and rises on outer mountains', () => {
  const spawnY = groundHeightAt(0, 8);
  assert.ok(Math.abs(spawnY) < 0.05, 'Spawn lookout terrace path should be near y = 0');

  const northMoundY = groundHeightAt(0, -26);
  assert.ok(northMoundY > 1.2, 'Northern Sovereign Mandapa sits on an elevated hillock');

  const outerMountainY = groundHeightAt(92, 0);
  assert.ok(outerMountainY > 4.0, 'Outer mountain peaks beyond 64m should rise dramatically');
});

test('walkableSurfaceHeightAt elevates player onto monument plinths, bridge deck, weapon forges, and boulders', () => {
  // Saraswati Bridge center at (0, -3.5) should be elevated above river ground
  const bridgeTerrainY = groundHeightAt(0, -3.5);
  const bridgeDeckY = walkableSurfaceHeightAt(0, -3.5);
  assert.ok(bridgeDeckY > bridgeTerrainY + 0.25, 'Bridge deck should elevate player above ground');

  // Monument Plinth at Surya Mandapa (0, -23.0) (r = 3.0m from (0, -26))
  const mandapaGround = groundHeightAt(0, -26);
  const mandapaPlinthY = walkableSurfaceHeightAt(0, -23.0);
  assert.ok(
    Math.abs(mandapaPlinthY - (mandapaGround + 1.0)) < 0.05,
    'Walking onto upper monument Jagati plinth should elevate player by +1.0m instead of clipping through'
  );

  // Weapon Forge platform at FORGE_WEAPONS[0]
  const w0 = FORGE_WEAPONS[0];
  const forgeGround = groundHeightAt(w0.position.x, w0.position.z);
  const forgeSurfaceY = walkableSurfaceHeightAt(w0.position.x, w0.position.z);
  assert.ok(forgeSurfaceY >= forgeGround + 0.5, 'Weapon forge anvil platform should elevate player');
});

test('applyRadialDeadzone zeroes small stick drift and scales full deflection smoothly', () => {
  const drift = applyRadialDeadzone(0.05, -0.08, 0.15);
  assert.equal(drift.x, 0);
  assert.equal(drift.y, 0);

  const fullRight = applyRadialDeadzone(1, 0, 0.15);
  assert.ok(Math.abs(fullRight.x - 1) < 1e-6);
  assert.ok(Math.abs(fullRight.y) < 1e-6);
});

test('computeMovementVector normalizes diagonal input so speed never exceeds base walk speed', () => {
  const diag = computeMovementVector({ forward: 1, right: 1, sprint: false }, 0);
  assert.ok(Math.abs(diag.speed - BASE_WALK_SPEED) < 1e-5);

  const sprintVec = computeMovementVector({ forward: 1, right: 0, sprint: true }, 0);
  assert.ok(Math.abs(sprintVec.speed - BASE_WALK_SPEED * SPRINT_MULTIPLIER) < 1e-5);
});

test('computeParagliderPhysics activates low-gravity glide descent when airborne with stamina', () => {
  const gliding = computeParagliderPhysics(-5.0, true, false, 80, 0.05);
  assert.equal(gliding.isGliding, true);
  assert.equal(gliding.vy, PARAGLIDE_TERMINAL_VY);
  assert.ok(gliding.nextStamina < 80);

  const grounded = computeParagliderPhysics(0, true, true, 50, 0.05);
  assert.equal(grounded.isGliding, false);
  assert.ok(grounded.nextStamina > 50);
});

test('findBestGrappleTarget locates nearest elevated shrine within grapple range', () => {
  const grapple = findBestGrappleTarget({ x: 0, z: 8 });
  assert.ok(grapple, 'Should find a grapple target from spawn');
  assert.equal(grapple.stop.id, 'chand-stepwell');
  assert.ok(grapple.distance < 30);
});

test('resolveSekiroDeflect negates HP damage and deals posture counter-damage on perfect deflect', () => {
  const perfect = resolveSekiroDeflect(24, 30, 0.2);
  assert.equal(perfect.isPerfectDeflect, true);
  assert.equal(perfect.hpDamageTaken, 0);
  assert.ok(perfect.enemyPostureDamageDealt >= 50);

  const missed = resolveSekiroDeflect(24, 30, 0);
  assert.equal(missed.isPerfectDeflect, false);
  assert.equal(missed.hpDamageTaken, 24);
  assert.equal(missed.enemyPostureDamageDealt, 0);
});

test('stepDemonCombatAI transitions from patrol to chase, windup, and active lunge strike against player', () => {
  const baseDemon = {
    x: 0,
    z: -10,
    homeX: 0,
    homeZ: -10,
    yaw: 0,
    state: 'patrol' as const,
    stateTimer: 0,
    attackCooldown: 0,
    aggroRange: 20,
    moveSpeed: 6.0,
    archetype: 'berserker' as const,
  };

  // Player within aggro range (8m away) -> should chase
  const chaseStep = stepDemonCombatAI(baseDemon, { x: 0, z: -2 }, 1.0, 0.1);
  assert.equal(chaseStep.state, 'chase');
  assert.ok(chaseStep.z > -10, 'Demon should actively advance toward player');

  // Player within melee range (2.2m away) -> should trigger windup telegraph
  const windupInput = {
    ...baseDemon,
    ...chaseStep,
    x: 0,
    z: -4.2,
  };
  const windupStep = stepDemonCombatAI(windupInput, { x: 0, z: -2 }, 1.1, 0.05);
  assert.equal(windupStep.state, 'windup');
  assert.equal(windupStep.didTriggerWindup, true);

  // Advance past windup timer -> should lunge and deal strike to player!
  const strikeInput = {
    ...baseDemon,
    ...windupStep,
  };
  const strikeStep = stepDemonCombatAI(strikeInput, { x: 0, z: -2 }, 1.6, 0.5);
  assert.equal(strikeStep.state, 'strike');
  assert.equal(strikeStep.didStrikePlayer, true, 'Demon should execute active lunge strike on player');
});

test('resolveCombatDefense handles dodge i-frames and computeDynamicCameraFov + computeComboRank scale properly', () => {
  const dodged = resolveCombatDefense(20, 30, 0, 0.18);
  assert.equal(dodged.isPerfectDodge, true);
  assert.equal(dodged.hpDamageTaken, 0);
  assert.ok(dodged.staminaRestored > 0);

  const grappleFov = computeDynamicCameraFov(55, 12, false, true, false, 0.1);
  assert.ok(grappleFov > 58, 'Grappling should widen camera FOV for speed feel');

  const rankS = computeComboRank(14);
  assert.equal(rankS.rankCode, 'S');
  assert.ok(rankS.damageMultiplier > 1.3);
});

test('dampAngle interpolates across the -PI / +PI boundary via shortest arc', () => {
  const start = Math.PI - 0.1;
  const end = -Math.PI + 0.1;
  const next = dampAngle(start, end, 10, 0.05);
  assert.ok(next > start || next < -Math.PI + 0.2);
});

test('computeCompassRibbonOffset centers target straight ahead when looking North', () => {
  const res = computeCompassRibbonOffset({ x: 0, z: 8 }, { x: 0, z: -26 }, 0);
  assert.ok(Math.abs(res.normalizedOffset) < 1e-4);
  assert.equal(res.isInFrontArc, true);
  assert.equal(Math.round(res.distanceMeters), 34);
});

test('resolveCollisions pushes player outside monument collider and clamps expanded world perimeter', () => {
  const colliders = getWorldColliders();
  const insideBastion = resolveCollisions({ x: -9.5, z: 6.2 }, 0.62, colliders);
  const distFromBastion = Math.hypot(insideBastion.x - -9.5, insideBastion.z - 6.2);
  assert.ok(distFromBastion >= 1.45 + 0.62 - 1e-4);

  const outsideWorld = resolveCollisions({ x: 180, z: 0 }, 0.62, colliders);
  assert.ok(outsideWorld.x <= WORLD_RADIUS - 0.62 + 1e-4);
});

test('findNearestStop and findNearestWeaponForge detect proximity accurately', () => {
  const nearMandapa = findNearestStop({ x: 0, z: -21 });
  assert.equal(nearMandapa.nearestStop.id, 'mandapa-origin');
  assert.equal(nearMandapa.inRange, true);

  const w0 = FORGE_WEAPONS[0];
  const nearForge = findNearestWeaponForge({ x: w0.position.x + 1.0, z: w0.position.z });
  assert.equal(nearForge.nearestWeapon.id, w0.id);
  assert.equal(nearForge.inRange, true);
});

test('checkRelicPickup detects uncollected lotus relic and ignores already collected ones', () => {
  const targetRelic = LOTUS_RELICS[0];
  const emptySet = new Set<string>();
  const found = checkRelicPickup(
    { x: targetRelic.position.x + 0.4, z: targetRelic.position.z - 0.3 },
    emptySet
  );
  assert.ok(found);
  assert.equal(found.id, targetRelic.id);

  const collectedSet = new Set<string>([targetRelic.id]);
  const ignored = checkRelicPickup(
    { x: targetRelic.position.x, z: targetRelic.position.z },
    collectedSet
  );
  assert.equal(ignored, null);
});

test('computePlayerCombatStats scales with visited stops and equipped weapon from FORGE_WEAPONS', () => {
  const baseStats = computePlayerCombatStats(new Set(), PORTFOLIO_STOPS, 'weapon-nandaka');
  assert.equal(baseStats.unlockedPowersCount, 0);
  assert.ok(baseStats.attackDamage >= 28);

  const halberdStats = computePlayerCombatStats(
    new Set([PORTFOLIO_STOPS[0].id]),
    PORTFOLIO_STOPS,
    'weapon-brahmastra-halberd'
  );
  assert.equal(halberdStats.unlockedPowersCount, 1);
  assert.ok(halberdStats.attackDamage > baseStats.attackDamage + 20);
  assert.ok(halberdStats.attackRange > baseStats.attackRange + 1.0);
});

test('shouldAwakenLayoffBoss, computeCompletionStats, and getRegionNameAt use Portfolio Verse naming', () => {
  assert.equal(shouldAwakenLayoffBoss(3, 2, false), false);
  assert.equal(shouldAwakenLayoffBoss(6, 5, false), true);
  assert.equal(shouldAwakenLayoffBoss(1, 0, true), true);

  const full = computeCompletionStats(6, 5, 6, 5);
  assert.equal(full.completionPercent, 100);
  assert.equal(full.isMastered, true);

  const valleyRegion = getRegionNameAt(0, 16);
  assert.ok(valleyRegion.includes('Portfolio Verse'));
});
