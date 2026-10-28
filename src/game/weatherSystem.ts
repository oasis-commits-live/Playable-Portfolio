import { TimeOfDay } from './proceduralScene';
import { groundHeightAt } from './worldLogic';

export type WeatherPresetId = 'auto' | 'petals' | 'dust_motes' | 'spirit_fog';
export type EffectiveWeatherKind = 'petals' | 'dust_motes' | 'spirit_fog';

export interface WeatherProfile {
  kind: EffectiveWeatherKind;
  presetId: WeatherPresetId;
  timeOfDay: TimeOfDay;
  title: string;
  subtitle: string;
  fogColorHex: number;
  fogDensity: number;
  mistOpacity: number;
  mistColorHex: number;
  windX: number;
  windZ: number;
  fallSpeedMin: number;
  fallSpeedMax: number;
  swayAmplitude: number;
  swayFrequency: number;
  petalVisibility: number;
  moteVisibility: number;
  primaryParticleHex: string;
  secondaryParticleHex: string;
  activeParticleCount: number;
}

export interface WeatherParticleState {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  spinX: number;
  spinY: number;
  spinZ: number;
  baseScale: number;
  phase: number;
  isPetal: boolean;
}

export const WEATHER_FIELD_RADIUS = 36;
export const WEATHER_MAX_HEIGHT = 21;
export const WEATHER_MIN_CLEARANCE = 0.28;

/**
 * Resolves the active procedural weather profile based on TimeOfDay ('dawn' | 'noon' | 'twilight')
 * and optional user preset override ('auto' | 'petals' | 'dust_motes' | 'spirit_fog').
 */
export function resolveWeatherProfile(
  timeOfDay: TimeOfDay,
  presetId: WeatherPresetId = 'auto'
): WeatherProfile {
  const effectiveKind: EffectiveWeatherKind =
    presetId !== 'auto'
      ? presetId
      : timeOfDay === 'dawn'
      ? 'petals'
      : timeOfDay === 'noon'
      ? 'dust_motes'
      : 'spirit_fog';

  // Base atmospheric fog colors matched to each time of day horizon
  const baseFogHex =
    timeOfDay === 'dawn' ? 0x162438 : timeOfDay === 'noon' ? 0x1e3f66 : 0x19102c;
  const baseMistHex =
    timeOfDay === 'dawn' ? 0xfde68a : timeOfDay === 'noon' ? 0xbae6fd : 0xc084fc;

  if (effectiveKind === 'petals') {
    return {
      kind: 'petals',
      presetId,
      timeOfDay,
      title: 'Sacred Petal Breeze',
      subtitle:
        timeOfDay === 'dawn'
          ? 'Dawn Lotus Petals & Saraswati Morning Mist'
          : 'Wind-Borne Temple Blossom Drift',
      fogColorHex: baseFogHex,
      fogDensity: timeOfDay === 'dawn' ? 0.0038 : timeOfDay === 'noon' ? 0.0031 : 0.0046,
      mistOpacity: timeOfDay === 'dawn' ? 0.34 : 0.24,
      mistColorHex: timeOfDay === 'dawn' ? 0xfbcfe8 : baseMistHex,
      windX: 1.75,
      windZ: 0.82,
      fallSpeedMin: 0.95,
      fallSpeedMax: 1.85,
      swayAmplitude: 1.35,
      swayFrequency: 1.65,
      petalVisibility: 1.0,
      moteVisibility: 0.35,
      primaryParticleHex: '#f472b6',
      secondaryParticleHex: '#fef08a',
      activeParticleCount: 280,
    };
  }

  if (effectiveKind === 'dust_motes') {
    return {
      kind: 'dust_motes',
      presetId,
      timeOfDay,
      title: 'Solar Dust Motes',
      subtitle:
        timeOfDay === 'noon'
          ? 'Zenith Golden Prana Motes & Light Horizon Haze'
          : 'Suspended Astral Gold Dust Motes',
      fogColorHex: baseFogHex,
      fogDensity: timeOfDay === 'noon' ? 0.0024 : 0.0032,
      mistOpacity: 0.14,
      mistColorHex: 0xfef08a,
      windX: 0.42,
      windZ: -0.28,
      fallSpeedMin: -0.35, // Gentle thermal updraft & hover
      fallSpeedMax: 0.45,
      swayAmplitude: 0.78,
      swayFrequency: 2.2,
      petalVisibility: 0.18,
      moteVisibility: 1.0,
      primaryParticleHex: '#fef08a',
      secondaryParticleHex: '#2dd4bf',
      activeParticleCount: 310,
    };
  }

  // 'spirit_fog': Twilight / Mystic Valley Fog with drifting ember-petals & luminous motes
  return {
    kind: 'spirit_fog',
    presetId,
    timeOfDay,
    title: 'Mystic Spirit Fog',
    subtitle:
      timeOfDay === 'twilight'
        ? 'Dusk Crimson-Violet Fog, Falling Petals & Prana Motes'
        : 'Dense Valley Mist & Drifting Spirit Spores',
    fogColorHex: timeOfDay === 'twilight' ? 0x1b102e : baseFogHex,
    fogDensity: timeOfDay === 'twilight' ? 0.0052 : 0.0045,
    mistOpacity: 0.48,
    mistColorHex: timeOfDay === 'twilight' ? 0xe879f9 : baseMistHex,
    windX: 0.95,
    windZ: 0.52,
    fallSpeedMin: 0.45,
    fallSpeedMax: 1.15,
    swayAmplitude: 1.1,
    swayFrequency: 1.4,
    petalVisibility: 0.72,
    moteVisibility: 0.92,
    primaryParticleHex: '#c084fc',
    secondaryParticleHex: '#fda4af',
    activeParticleCount: 360,
  };
}

/**
 * Deterministically initializes a pool of procedural weather particles around the origin.
 */
export function createInitialWeatherParticles(
  petalCount = 180,
  moteCount = 180
): WeatherParticleState[] {
  const total = petalCount + moteCount;
  const particles: WeatherParticleState[] = [];

  for (let i = 0; i < total; i++) {
    const isPetal = i < petalCount;
    // Golden-ratio spiral distribution for uniform spatial coverage without clumping
    const goldenAngle = i * 2.399963229728653;
    const radialFrac = Math.sqrt(((i * 73) % total) / total);
    const r = radialFrac * WEATHER_FIELD_RADIUS;
    const x = Math.cos(goldenAngle) * r;
    const z = 8 + Math.sin(goldenAngle) * r;
    const groundY = groundHeightAt(x, z);
    const heightFrac = ((i * 137) % 1000) / 1000;
    const y = groundY + WEATHER_MIN_CLEARANCE + heightFrac * WEATHER_MAX_HEIGHT;

    particles.push({
      id: i,
      x,
      y,
      z,
      vx: 0,
      vy: isPetal ? -(1.0 + (i % 7) * 0.14) : -0.15 + ((i % 9) - 4) * 0.08,
      vz: 0,
      rx: (i * 0.7) % (Math.PI * 2),
      ry: (i * 1.3) % (Math.PI * 2),
      rz: (i * 0.5) % (Math.PI * 2),
      spinX: (isPetal ? 1.4 : 0.6) + (i % 5) * 0.32,
      spinY: (isPetal ? 2.1 : 0.9) + (i % 7) * 0.25,
      spinZ: (isPetal ? 1.1 : 0.4) + (i % 4) * 0.28,
      baseScale: isPetal ? 0.75 + (i % 6) * 0.12 : 0.65 + (i % 5) * 0.14,
      phase: (i * 0.43) % (Math.PI * 2),
      isPetal,
    });
  }

  return particles;
}

/**
 * Advances a single weather particle by `dt` seconds and wraps it seamlessly within
 * a cylindrical volume of radius `WEATHER_FIELD_RADIUS` centered on `(centerX, centerZ)`.
 * Mutates `p` in place for zero-GC in the 60fps animation loop and returns `p`.
 */
export function stepWeatherParticleInPlace(
  p: WeatherParticleState,
  profile: WeatherProfile,
  centerX: number,
  centerZ: number,
  elapsed: number,
  dt: number
): WeatherParticleState {
  const clampedDt = Math.min(Math.max(dt, 0.001), 0.1);
  const wave = elapsed * profile.swayFrequency + p.phase;

  if (p.isPetal) {
    // Falling petal kinematics: wind advection + sinusoidal flutter + gentle descent
    const flutterX = Math.sin(wave) * profile.swayAmplitude;
    const flutterZ = Math.cos(wave * 0.85) * profile.swayAmplitude * 0.8;
    const fallRate =
      profile.fallSpeedMin +
      ((p.id % 11) / 10) * Math.max(0.2, profile.fallSpeedMax - profile.fallSpeedMin);

    p.vx = profile.windX + flutterX;
    p.vz = profile.windZ + flutterZ;
    p.vy = -Math.abs(fallRate) + Math.sin(wave * 1.7) * 0.22;

    p.x += p.vx * clampedDt;
    p.y += p.vy * clampedDt;
    p.z += p.vz * clampedDt;

    p.rx += p.spinX * clampedDt + Math.sin(wave) * 0.02;
    p.ry += p.spinY * clampedDt;
    p.rz += p.spinZ * clampedDt + Math.cos(wave) * 0.02;
  } else {
    // Dust mote / spirit spore kinematics: buoyant thermal suspension + swirling eddies
    const swirlX = Math.cos(wave * 1.15 + p.z * 0.08) * profile.swayAmplitude * 0.75;
    const swirlZ = Math.sin(wave * 0.95 + p.x * 0.08) * profile.swayAmplitude * 0.75;
    const verticalDrift = Math.sin(wave * 1.3) * 0.48 + (profile.kind === 'dust_motes' ? 0.12 : -0.18);

    p.vx = profile.windX * 0.45 + swirlX;
    p.vz = profile.windZ * 0.45 + swirlZ;
    p.vy = verticalDrift;

    p.x += p.vx * clampedDt;
    p.y += p.vy * clampedDt;
    p.z += p.vz * clampedDt;

    p.rx += p.spinX * 0.5 * clampedDt;
    p.ry += p.spinY * 0.5 * clampedDt;
  }

  // Horizontal cylindrical torus wrap around the camera/player center
  const dx = p.x - centerX;
  const dz = p.z - centerZ;
  const distSq = dx * dx + dz * dz;
  const maxR = WEATHER_FIELD_RADIUS;
  if (distSq > maxR * maxR) {
    const dist = Math.sqrt(distSq);
    // Wrap to opposite side of the player's local weather cylinder
    p.x = centerX - (dx / dist) * (maxR - 1.5);
    p.z = centerZ - (dz / dist) * (maxR - 1.5);
  }

  // Vertical wrap relative to local terrain elevation
  const floorY = groundHeightAt(p.x, p.z) + WEATHER_MIN_CLEARANCE;
  const ceilingY = floorY + WEATHER_MAX_HEIGHT;

  if (p.y < floorY) {
    p.y = ceilingY - ((floorY - p.y) % WEATHER_MAX_HEIGHT);
  } else if (p.y > ceilingY) {
    p.y = floorY + ((p.y - ceilingY) % WEATHER_MAX_HEIGHT);
  }

  return p;
}

/**
 * Cycles to the next WeatherPresetId in sequence.
 */
export function getNextWeatherPreset(current: WeatherPresetId): WeatherPresetId {
  const order: WeatherPresetId[] = ['auto', 'petals', 'dust_motes', 'spirit_fog'];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}
