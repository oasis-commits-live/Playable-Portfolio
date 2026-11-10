import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  groundHeightAt,
  walkableSurfaceHeightAt,
  isOnStoneSurfaceAt,
  isNearRecruiterTemple,
  isNearHypoGuide,
  isInsideBossChallengeCircle,
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
  canCastLightningBolt,
  computeBossMeleeMultiplier,
  computeLightningBoltDamage,
  findNearestUnfinishedSanctum,
  BASE_WALK_SPEED,
  SPRINT_MULTIPLIER,
  PARAGLIDE_TERMINAL_VY,
  WORLD_RADIUS,
} from './worldLogic';
import {
  PORTFOLIO_STOPS,
  UNFINISHED_SANCTUMS,
  LOTUS_RELICS,
  FORGE_WEAPONS,
  INITIAL_DEMON_SPAWNS,
  RECRUITER_TEMPLE_CONFIG,
  LAYOFF_BOSS_CONFIG,
  HYPO_GUIDE_CONFIG,
} from '../data/portfolioStops';

test('groundHeightAt keeps central path walkable, elevates northern mound & southern temple, and rises on outer mountain peaks', () => {
  const spawnY = groundHeightAt(0, 8);
  assert.ok(Math.abs(spawnY) < 0.05, 'Spawn lookout terrace path should be near y = 0');

  const northMoundY = groundHeightAt(0, -26);
  assert.ok(northMoundY > 1.2, 'Northern Sovereign Mandapa sits on an elevated hillock');

  const southTempleY = groundHeightAt(0, 54);
  assert.ok(southTempleY > 1.0, 'Southern Recruiter Opportunity Temple sits on an elevated sanctuary terrace');

  const outerMountainY = groundHeightAt(118, 0);
  assert.ok(outerMountainY > 10.0, 'Outer mountain peaks beyond 72m should form tall climbable mountains');
});

test('walkableSurfaceHeightAt elevates player onto monument plinths, bridge deck, southern recruiter temple, and weapon forges', () => {
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

  // Southern Recruiter Temple altar at (0, 54)
  const templeGround = groundHeightAt(0, 54);
  const templeAltarY = walkableSurfaceHeightAt(0, 54);
  assert.ok(templeAltarY >= templeGround + 1.0, 'Southern Recruiter Temple dais should elevate player');

  // Weapon Forge platform at FORGE_WEAPONS[0]
  const w0 = FORGE_WEAPONS[0];
  const forgeGround = groundHeightAt(w0.position.x, w0.position.z);
  const forgeSurfaceY = walkableSurfaceHeightAt(w0.position.x, w0.position.z);
  assert.ok(forgeSurfaceY >= forgeGround + 0.5, 'Weapon forge anvil platform should elevate player');
});

test('isOnStoneSurfaceAt, isNearRecruiterTemple, isNearHypoGuide, and isInsideBossChallengeCircle detect zones accurately', () => {
  assert.equal(isOnStoneSurfaceAt(0, 8), true, 'Central stone promenade should be detected as stone');
  assert.equal(isOnStoneSurfaceAt(0, 54), true, 'Southern Recruiter Temple should be detected as stone');
  assert.equal(isOnStoneSurfaceAt(20, 20), false, 'Outer meadow should be detected as grass');

  assert.equal(isNearRecruiterTemple(RECRUITER_TEMPLE_CONFIG.position).inRange, true);
  assert.equal(isNearRecruiterTemple({ x: 0, z: 8 }).inRange, false);

  assert.equal(isNearHypoGuide(HYPO_GUIDE_CONFIG.position).inRange, true);
  assert.equal(isNearHypoGuide({ x: 0, z: -25 }).inRange, false);

  assert.equal(isInsideBossChallengeCircle({ x: 0, z: -45.8 }).inRange, true);
  assert.equal(isInsideBossChallengeCircle({ x: 0, z: 8 }).inRange, false);
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

test('stepDemonCombatAI enforces strict territorial aggro (never attacks at spawn, only attacks inside territory)', () => {
  // Verify none of the 6 INITIAL_DEMON_SPAWNS aggro when player starts at spawn (0, 8.2)
  for (const spawn of INITIAL_DEMON_SPAWNS) {
    const stepAtSpawn = stepDemonCombatAI(
      {
        x: spawn.position.x,
        z: spawn.position.z,
        homeX: spawn.position.x,
        homeZ: spawn.position.z,
        yaw: 0,
        state: 'patrol',
        stateTimer: 0,
        attackCooldown: 0,
        aggroRange: spawn.aggroRange,
        moveSpeed: spawn.moveSpeed,
        archetype: spawn.archetype,
      },
      { x: 0, z: 8.2 },
      1.0,
      0.1
    );
    assert.equal(
      stepAtSpawn.state,
      'patrol',
      `Demon ${spawn.id} must remain on patrol when player is at spawn (0, 8.2)`
    );
  }

  const baseDemon = {
    x: -24,
    z: -25,
    homeX: -24,
    homeZ: -25,
    yaw: 0,
    state: 'patrol' as const,
    stateTimer: 0,
    attackCooldown: 0,
    aggroRange: 11.5,
    moveSpeed: 6.0,
    archetype: 'berserker' as const,
  };

  // Player enters demon territory (6m from demon home) -> should transition to chase
  const chaseStep = stepDemonCombatAI(baseDemon, { x: -24, z: -19 }, 1.0, 0.1);
  assert.equal(chaseStep.state, 'chase');
  assert.ok(chaseStep.z > -25, 'Demon should actively advance toward player inside its territory');

  // Player within melee range (2.2m away) -> should trigger windup telegraph
  const windupInput = {
    ...baseDemon,
    ...chaseStep,
    x: -24,
    z: -21.2,
  };
  const windupStep = stepDemonCombatAI(windupInput, { x: -24, z: -19 }, 1.1, 0.05);
  assert.equal(windupStep.state, 'windup');
  assert.equal(windupStep.didTriggerWindup, true);

  // Advance past windup timer -> should lunge and deal strike to player!
  const strikeInput = {
    ...baseDemon,
    ...windupStep,
  };
  const strikeStep = stepDemonCombatAI(strikeInput, { x: -24, z: -19 }, 1.6, 0.5);
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

test('resolveCollisions pushes player outside monument collider and clamps expanded 175m world perimeter', () => {
  const colliders = getWorldColliders();
  const insideBastion = resolveCollisions({ x: -9.5, z: 6.2 }, 0.62, colliders);
  const distFromBastion = Math.hypot(insideBastion.x - -9.5, insideBastion.z - 6.2);
  assert.ok(distFromBastion >= 1.45 + 0.62 - 1e-4);

  const outsideWorld = resolveCollisions({ x: 210, z: 0 }, 0.62, colliders);
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

test('shouldAwakenLayoffBoss requires both 6 visited projects AND explicit challenge circle summon (never auto-spawns)', () => {
  assert.equal(shouldAwakenLayoffBoss(3, 2, false), false);
  assert.equal(shouldAwakenLayoffBoss(5, 5, true), false, 'Boss cannot be challenged before seeing all 6 projects');
  assert.equal(
    shouldAwakenLayoffBoss(6, 5, false),
    false,
    'Boss must NOT auto-spawn when 6 projects are viewed until player challenges at the circle'
  );
  assert.equal(
    shouldAwakenLayoffBoss(6, 5, true),
    true,
    'Boss awakens once all 6 projects are viewed AND player challenges the boss at the circle'
  );

  assert.equal(canCastLightningBolt(5), false);
  assert.equal(canCastLightningBolt(6), true);

  assert.equal(computeBossMeleeMultiplier(2), 0.25);
  assert.equal(computeBossMeleeMultiplier(6), 0.65);

  const boltBoss = computeLightningBoltDamage(true);
  assert.equal(boltBoss.hpDamage, 560);

  const full = computeCompletionStats(6, 5, 6, 5);
  assert.equal(full.completionPercent, 100);
  assert.equal(full.isMastered, true);

  const valleyRegion = getRegionNameAt(0, 16);
  assert.ok(valleyRegion.includes('Portfolio Verse'));

  const southTempleRegion = getRegionNameAt(0, 54);
  assert.ok(southTempleRegion.includes('Sankalpa Mandapa'));
});

test('all 6 PORTFOLIO_STOPS map to REFERENCE_CASE_STUDIES with exact framerusercontent images and live links', async () => {
  const { getReferenceCaseStudy } = await import('../data/referenceCaseStudies');
  for (const stop of PORTFOLIO_STOPS) {
    const cs = getReferenceCaseStudy(stop.project.id);
    assert.equal(cs.id, stop.project.id);
    assert.ok(cs.heroImage.startsWith('https://framerusercontent.com/images/'), `Hero image for ${cs.id} must be from framerusercontent.com`);
    assert.ok(cs.galleryImages.length >= 5, `Gallery for ${cs.id} should contain all reference screens`);
    assert.ok(
      Boolean(cs.prototypeUrl || cs.externalUrl),
      `Project ${cs.id} must preserve its exact prototypeUrl or externalUrl`
    );
    assert.ok(cs.sections.length >= 4, `Project ${cs.id} must include all 4 case study sections`);
  }
});

test('procedural weather system resolves time-of-day profiles and wraps particles within cylinder and terrain bounds', async () => {
  const {
    resolveWeatherProfile,
    createInitialWeatherParticles,
    stepWeatherParticleInPlace,
    getNextWeatherPreset,
    WEATHER_FIELD_RADIUS,
  } = await import('./weatherSystem');

  const dawnProfile = resolveWeatherProfile('dawn', 'auto');
  assert.equal(dawnProfile.kind, 'petals');
  assert.equal(dawnProfile.title, 'Sacred Petal Breeze');
  assert.ok(dawnProfile.petalVisibility > 0.9);

  const noonProfile = resolveWeatherProfile('noon', 'auto');
  assert.equal(noonProfile.kind, 'dust_motes');
  assert.equal(noonProfile.title, 'Solar Dust Motes');
  assert.ok(noonProfile.moteVisibility > 0.9);

  const twilightProfile = resolveWeatherProfile('twilight', 'auto');
  assert.equal(twilightProfile.kind, 'spirit_fog');
  assert.equal(twilightProfile.title, 'Mystic Spirit Fog');
  assert.ok(twilightProfile.fogDensity > noonProfile.fogDensity);

  // Manual override should take precedence over time of day
  const overridePetalsAtNoon = resolveWeatherProfile('noon', 'petals');
  assert.equal(overridePetalsAtNoon.kind, 'petals');
  assert.equal(overridePetalsAtNoon.presetId, 'petals');

  assert.equal(getNextWeatherPreset('auto'), 'petals');
  assert.equal(getNextWeatherPreset('petals'), 'dust_motes');
  assert.equal(getNextWeatherPreset('dust_motes'), 'spirit_fog');
  assert.equal(getNextWeatherPreset('spirit_fog'), 'auto');

  const particles = createInitialWeatherParticles(20, 20);
  assert.equal(particles.length, 40);
  assert.equal(particles[0].isPetal, true);
  assert.equal(particles[25].isPetal, false);

  // Place a petal far outside the radius and below the ground, then step it
  const farPetal = { ...particles[0], x: 95, z: 95, y: -15 };
  stepWeatherParticleInPlace(farPetal, dawnProfile, 0, 8, 2.5, 0.05);
  const distFromPlayer = Math.hypot(farPetal.x - 0, farPetal.z - 8);
  assert.ok(
    distFromPlayer <= WEATHER_FIELD_RADIUS + 0.1,
    'Particle should wrap inside WEATHER_FIELD_RADIUS cylinder around player'
  );
  const localFloor = groundHeightAt(farPetal.x, farPetal.z);
  assert.ok(farPetal.y >= localFloor, 'Particle should wrap above local terrain height');
});

test('getWorldColliders enforces solid physics on all 56 tree trunks, Saraswati bridge balustrades, and Highland Shrine Pillars', async () => {
  const { TREE_GROVE_POSITIONS, HILL_SHRINE_PILLARS } = await import('./worldLogic');
  const colliders = getWorldColliders();
  assert.equal(TREE_GROVE_POSITIONS.length, 56, 'Should include 56 valley and hillside trees');
  assert.equal(HILL_SHRINE_PILLARS.length, 8, 'Should include 8 highland shrine pillars');

  // Verify player cannot walk through a tree trunk
  const sampleTree = TREE_GROVE_POSITIONS[0];
  const pushedFromTree = resolveCollisions(
    { x: sampleTree.x + 0.05, z: sampleTree.z },
    0.62,
    colliders
  );
  const distFromTreeCenter = Math.hypot(
    pushedFromTree.x - sampleTree.x,
    pushedFromTree.z - sampleTree.z
  );
  assert.ok(
    distFromTreeCenter > 0.62 + 0.35,
    'Solid tree trunk collider must push player outside trunk radius'
  );

  // Verify player cannot run sideways through the Saraswati Bridge stone balustrade at (2.62, -3.5)
  const pushedFromBridgeRail = resolveCollisions({ x: 2.55, z: -3.5 }, 0.62, colliders);
  assert.ok(
    Math.abs(pushedFromBridgeRail.x - 2.62) > 0.55,
    'Saraswati bridge side-rail collider must prevent clipping through bridge parapet'
  );

  // Verify Highland Shrine Pillar blocks clipping
  const pillar = HILL_SHRINE_PILLARS[0];
  const pushedFromPillar = resolveCollisions({ x: pillar.x + 0.1, z: pillar.z }, 0.62, colliders);
  assert.ok(
    Math.hypot(pushedFromPillar.x - pillar.x, pushedFromPillar.z - pillar.z) >
      pillar.scale * 0.72 + 0.5,
    'Highland shrine pillar must block clipping'
  );
});

test('resolveLocalHypoChat answers conversational questions about portfolio projects, career background, and Recruiter Temple with in-world actions', async () => {
  const { resolveLocalHypoChat } = await import('./hypoBrain');
  const validStopIds = new Set(PORTFOLIO_STOPS.map((s) => s.id));

  const veraResp = resolveLocalHypoChat('Tell me about HyperLM Vera CFO AI project', {
    visitedCount: 1,
    relicsCount: 1,
    bossDefeated: false,
  });
  assert.ok(veraResp.reply.includes('Vera'), 'Should describe HyperLM Vera project');
  assert.equal(veraResp.action?.type, 'teleport_project');
  assert.equal(veraResp.action?.targetId, 'mandapa-origin');
  assert.ok(validStopIds.has(veraResp.action?.targetId || ''));

  for (const query of [
    'Which project should I see first?',
    'Show me Bridge handoff tool',
    'Tell me about Oasis gaming arcade',
    'Payments Co-Pilot',
    'Invoice Processing Co-Pilot',
    'Hyperbots Vendor Portal',
  ]) {
    const resp = resolveLocalHypoChat(query, {
      visitedStopIds: ['mandapa-origin'],
      visitedCount: 1,
      relicsCount: 0,
      bossDefeated: false,
    });
    if (resp.action?.type === 'teleport_project' || resp.action?.type === 'track_project') {
      assert.ok(
        validStopIds.has(resp.action.targetId || ''),
        `Action targetId "${resp.action.targetId}" for query "${query}" must be a valid PORTFOLIO_STOPS id`
      );
    }
  }

  const hireResp = resolveLocalHypoChat('How can I hire or email Ayush?', {
    visitedCount: 3,
    relicsCount: 2,
    bossDefeated: false,
  });
  assert.ok(hireResp.reply.includes('ayush.dubeypd@gmail.com'));
  assert.equal(hireResp.action?.type, 'teleport_temple');
});

test('computeDirectionalGuidance and findNextGuidanceSanctum provide step-by-step bearings and turn instructions', async () => {
  const { computeDirectionalGuidance, findNextGuidanceSanctum } = await import('./worldLogic');

  // At spawn (0, 8.2), first unvisited sanctum must be 01 (mandapa-origin)
  const visited = new Set<string>();
  const firstStep = findNextGuidanceSanctum({ x: 0, z: 8.2 }, visited);
  assert.ok(firstStep, 'Should find first unvisited sanctum');
  assert.equal(firstStep!.stop.id, 'mandapa-origin');
  assert.equal(firstStep!.stop.indexNumber, '01');

  // After visiting 01, next sanctum must be 02 (jantar-observatory)
  visited.add('mandapa-origin');
  const secondStep = findNextGuidanceSanctum({ x: 0, z: 8.2 }, visited);
  assert.equal(secondStep!.stop.id, 'jantar-observatory');
  assert.equal(secondStep!.stop.indexNumber, '02');

  // Looking straight North (headingDeg = 0) toward a target straight North (0, -20)
  const straightNorth = computeDirectionalGuidance({ x: 0, z: 0 }, { x: 0, z: -20 }, 0);
  assert.equal(straightNorth.cardinalLabel, 'N');
  assert.equal(straightNorth.turnDirection, 'ahead');
  assert.equal(straightNorth.turnInstruction, 'Straight Ahead');
  assert.equal(straightNorth.distance, 20);

  // Looking North (0 deg) when target is due East (25, 0) -> Turn Right [E]
  const turnEast = computeDirectionalGuidance({ x: 0, z: 0 }, { x: 25, z: 0 }, 0);
  assert.equal(turnEast.cardinalLabel, 'E');
  assert.equal(turnEast.turnDirection, 'right');
  assert.equal(turnEast.turnInstruction, 'Turn Right');

  // Looking North (0 deg) when target is due West (-25, 0) -> Turn Left [W]
  const turnWest = computeDirectionalGuidance({ x: 0, z: 0 }, { x: -25, z: 0 }, 0);
  assert.equal(turnWest.cardinalLabel, 'W');
  assert.equal(turnWest.turnDirection, 'left');
  assert.equal(turnWest.turnInstruction, 'Turn Left');

  // Looking North (0 deg) when target is due South (0, 30) -> Behind You
  const behindSouth = computeDirectionalGuidance({ x: 0, z: 0 }, { x: 0, z: 30 }, 0);
  assert.equal(behindSouth.cardinalLabel, 'S');
  assert.equal(behindSouth.turnDirection, 'behind');
});

test('UNFINISHED_SANCTUMS enforce exact allowed reveal points, do not interfere with any existing sanctum/landmark, and detect proximity accurately', () => {
  assert.equal(UNFINISHED_SANCTUMS.length, 2, 'Should define exactly 2 unfinished sanctums');

  const adtech = UNFINISHED_SANCTUMS.find((s) => s.id === 'wip-adtech-sanctum');
  assert.ok(adtech, 'Should include the unfinished AdTech sanctum');
  assert.deepEqual(adtech.revealedPoints, [
    'AdTech',
    'Sped up the process of publishing ads on different platforms',
    'Increased productivity in sales ops team',
    'Idea to Product in 4 days',
  ]);
  assert.ok(adtech.workerCount >= 3, 'AdTech sanctum should have multiple workers around it');

  const sisyphean = UNFINISHED_SANCTUMS.find((s) => s.id === 'wip-sisyphean-game');
  assert.ok(sisyphean, 'Should include the unfinished Sisyphean Rage Game sanctum');
  assert.deepEqual(sisyphean.revealedPoints, [
    'Sisyphean game based on rage',
    'Coming soon on Steam',
  ]);
  assert.ok(sisyphean.workerCount >= 3, 'Sisyphean sanctum should have multiple workers around it');

  // Verify neither unfinished sanctum interferes with any of the 6 PORTFOLIO_STOPS, Recruiter Temple, or Boss Arena
  for (const wip of UNFINISHED_SANCTUMS) {
    for (const stop of PORTFOLIO_STOPS) {
      const dist = Math.hypot(wip.position.x - stop.position.x, wip.position.z - stop.position.z);
      assert.ok(
        dist > 20,
        `Unfinished sanctum ${wip.id} must be > 20m away from ${stop.id} (got ${dist.toFixed(1)}m)`
      );
    }

    const templeDist = Math.hypot(
      wip.position.x - RECRUITER_TEMPLE_CONFIG.position.x,
      wip.position.z - RECRUITER_TEMPLE_CONFIG.position.z
    );
    assert.ok(templeDist > 20, `Unfinished sanctum ${wip.id} must not overlap Recruiter Temple`);

    const bossDist = Math.hypot(
      wip.position.x - LAYOFF_BOSS_CONFIG.spawnPosition.x,
      wip.position.z - LAYOFF_BOSS_CONFIG.spawnPosition.z
    );
    assert.ok(bossDist > 50, `Unfinished sanctum ${wip.id} must not overlap Boss Arena`);

    // Standing at an unfinished sanctum approach should trigger findNearestUnfinishedSanctum, NOT findNearestStop
    const approachPos = { x: wip.position.x, z: wip.position.z + 5.5 };
    const nearWip = findNearestUnfinishedSanctum(approachPos);
    assert.equal(nearWip.inRange, true);
    assert.equal(nearWip.nearestSanctum.id, wip.id);

    const nearRegularStop = findNearestStop(approachPos);
    assert.equal(
      nearRegularStop.inRange,
      false,
      `Approaching unfinished sanctum ${wip.id} must not trigger any openable PORTFOLIO_STOP`
    );

    const regionName = getRegionNameAt(approachPos.x, approachPos.z);
    assert.ok(
      regionName.includes('Under Construction'),
      `Region name at ${wip.id} should indicate Under Construction`
    );
  }
});


