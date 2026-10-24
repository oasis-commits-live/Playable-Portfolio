import { test } from 'node:test';
import assert from 'node:assert/strict';
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
  computeCompassRibbonOffset,
  resolveCollisions,
  findNearestStop,
  checkRelicPickup,
  computeCompletionStats,
  computePlayerCombatStats,
  shouldAwakenLayoffBoss,
  getWorldColliders,
  BASE_WALK_SPEED,
  SPRINT_MULTIPLIER,
  PARAGLIDE_TERMINAL_VY,
  WORLD_RADIUS,
} from './worldLogic';
import { PORTFOLIO_STOPS, LOTUS_RELICS } from '../data/portfolioStops';

test('groundHeightAt keeps central path walkable, elevates northern mound, and rises on outer mountains', () => {
  const spawnY = groundHeightAt(0, 8);
  assert.ok(Math.abs(spawnY) < 0.05, 'Spawn lookout terrace path should be near y = 0');

  const northMoundY = groundHeightAt(0, -26);
  assert.ok(northMoundY > 1.2, 'Northern Sovereign Mandapa sits on an elevated hillock');

  const outerMountainY = groundHeightAt(92, 0);
  assert.ok(outerMountainY > 4.0, 'Outer mountain peaks beyond 64m should rise dramatically');
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
  const insideBastion = resolveCollisions({ x: -9.5, z: 6.2 }, 0.65, colliders);
  const distFromBastion = Math.hypot(insideBastion.x - -9.5, insideBastion.z - 6.2);
  assert.ok(distFromBastion >= 1.45 + 0.65 - 1e-4);

  const outsideWorld = resolveCollisions({ x: 180, z: 0 }, 0.65, colliders);
  assert.ok(outsideWorld.x <= WORLD_RADIUS - 0.65 + 1e-4);
});

test('findNearestStop detects proximity when player approaches a monument stop', () => {
  const nearMandapa = findNearestStop({ x: 0, z: -21 });
  assert.equal(nearMandapa.nearestStop.id, 'mandapa-origin');
  assert.equal(nearMandapa.inRange, true);
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

test('computePlayerCombatStats increases attack damage, posture damage, and range as project scrolls are inspected', () => {
  const baseStats = computePlayerCombatStats(new Set());
  assert.equal(baseStats.unlockedPowersCount, 0);
  assert.equal(baseStats.attackDamage, 18);

  const twoStops = new Set<string>([PORTFOLIO_STOPS[0].id, PORTFOLIO_STOPS[1].id]);
  const boostedStats = computePlayerCombatStats(twoStops);
  assert.equal(boostedStats.unlockedPowersCount, 2);
  assert.ok(boostedStats.attackDamage > baseStats.attackDamage);
  assert.ok(boostedStats.postureDamage > baseStats.postureDamage);
  assert.ok(boostedStats.attackRange > baseStats.attackRange);
});

test('shouldAwakenLayoffBoss triggers when all 6 projects and 5 relics are viewed or when manually summoned', () => {
  assert.equal(shouldAwakenLayoffBoss(3, 2, false), false);
  assert.equal(shouldAwakenLayoffBoss(6, 5, false), true);
  assert.equal(shouldAwakenLayoffBoss(1, 0, true), true);
});

test('computeCompletionStats calculates accurate discovery percentage and mastery state', () => {
  const half = computeCompletionStats(3, 2, 6, 5);
  assert.equal(half.completionPercent, 45);
  assert.equal(half.isMastered, false);

  const full = computeCompletionStats(6, 5, 6, 5);
  assert.equal(full.completionPercent, 100);
  assert.equal(full.isMastered, true);
});
