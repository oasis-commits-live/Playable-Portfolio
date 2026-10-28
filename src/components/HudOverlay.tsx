import React, { useEffect, useRef, useState } from 'react';
import {
  CREATOR_PROFILE,
  PORTFOLIO_STOPS,
  STORY_CHAPTERS,
  INITIAL_DEMON_SPAWNS,
  PortfolioStop,
  LOTUS_RELICS,
  FORGE_WEAPONS,
  WeaponId,
  ForgeWeapon,
} from '../data/portfolioStops';
import { TimeOfDay } from '../game/proceduralScene';
import { WeatherPresetId } from '../game/weatherSystem';
import { computeCompletionStats, computeCompassRibbonOffset } from '../game/worldLogic';
import { MobileRpgControlPad } from './MobileRpgPad';
import { ProceduralWeatherSystem } from './ProceduralWeatherSystem';

const SHORT_STOP_LABELS: Record<string, string> = {
  'mandapa-origin': '01 Vera AI',
  'jantar-observatory': '02 Bridge',
  'oasis-pavilion': '03 Oasis',
  'ashoka-stambha': '04 Payments',
  'gopuram-sanctum': '05 Hypo',
  'chand-stepwell': '06 Invoice',
};

const COMPASS_CARDINALS = [
  { label: 'N', deg: 0 },
  { label: 'NE', deg: 45 },
  { label: 'E', deg: 90 },
  { label: 'SE', deg: 135 },
  { label: 'S', deg: 180 },
  { label: 'SW', deg: 225 },
  { label: 'W', deg: 270 },
  { label: 'NW', deg: 315 },
];

export interface CombatFloatingPopup {
  id: number;
  xPct: number;
  yPct: number;
  text: string;
  subtext?: string;
  kind: 'damage' | 'crit' | 'parry' | 'deathblow';
}

export interface WorldAffordanceMarker {
  id: string;
  kind: 'project' | 'jewel' | 'weapon' | 'enemy' | 'boss_hologram';
  xPct: number;
  yPct: number;
  distance: number;
  title: string;
  subtitle: string;
  accentColor: string;
  completed?: boolean;
  equipped?: boolean;
  hp?: number;
  maxHp?: number;
  posture?: number;
  maxPosture?: number;
  aiState?: string;
}

export interface EngagedDemonTelemetry {
  id: string;
  name: string;
  title: string;
  archetype: string;
  hp: number;
  maxHp: number;
  posture: number;
  maxPosture: number;
  aiState: string;
  distance: number;
}

export interface HudTelemetry {
  x: number;
  z: number;
  headingDeg: number;
  regionName: string;
  nearStop: PortfolioStop | null;
  nearDistance: number;
  nearWeaponForge?: ForgeWeapon | null;
  equippedWeaponId?: WeaponId;
  equippedWeaponName?: string;
  trackedTarget?: {
    id: string;
    kind: 'project' | 'jewel' | 'weapon';
    title: string;
    subtitle: string;
    distance: number;
    accentColor: string;
  } | null;
  distanceTraveled: number;
  playerHp?: number;
  playerMaxHp?: number;
  playerHurtFlash?: number;
  stamina?: number;
  attackDamage?: number;
  unlockedPowersCount?: number;
  latestPowerName?: string;
  comboStage?: 1 | 2 | 3;
  comboHitCount?: number;
  comboRankCode?: string;
  comboRankTitle?: string;
  musicMood?: 'silent' | 'calm' | 'combat';
  storyAct?: string;
  storyTitle?: string;
  storyEra?: string;
  storySummary?: string;
  aliveDemonsCount?: number;
  nearestDemonName?: string | null;
  engagedDemon?: EngagedDemonTelemetry | null;
  bossAwakened?: boolean;
  bossDefeated?: boolean;
  bossHp?: number;
  bossMaxHp?: number;
  bossPosture?: number;
  bossMaxPosture?: number;
  bossName?: string;
  lightningUnlocked?: boolean;
  lightningCooldown?: number;
  vanquishedDemonIds?: string[];
  isGliding?: boolean;
  grappleTargetTitle?: string | null;
  combatCallout?: string | null;
  combatPopups?: CombatFloatingPopup[];
  affordanceMarkers?: WorldAffordanceMarker[];
  waypointScreen?: {
    xPct: number;
    yPct: number;
    distance: number;
    title: string;
    stopId: string;
  } | null;
}

interface HudOverlayProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover' | 'player_died';
  telemetry: HudTelemetry;
  visitedStopIds: Set<string>;
  collectedRelicIds: Set<string>;
  activeStopId: string | null;
  timeOfDay: TimeOfDay;
  weatherPreset?: WeatherPresetId;
  muted: boolean;
  gamepadConnected: boolean;
  recentRelicToast: string | null;
  onInspectStop: (stopId: string) => void;
  onTeleportToStop: (stopId: string) => void;
  onTeleportToPoint?: (x: number, z: number, label: string) => void;
  onEquipWeapon?: (weaponId: WeaponId) => void;
  onSelectGuidanceTarget?: (id: string, kind: 'project' | 'jewel' | 'weapon') => void;
  onTriggerAttack: (isNova?: boolean) => void;
  onTriggerLightningBolt?: () => void;
  onTriggerParry: () => void;
  onTriggerDash?: () => void;
  onTriggerGrapple: () => void;
  onSummonLayoffBoss: () => void;
  onChangeTimeOfDay: (mode: TimeOfDay) => void;
  onChangeWeatherPreset?: (preset: WeatherPresetId) => void;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onResetSpawn: () => void;
  onRestartFromBeginning: () => void;
  onReturnToTitle: () => void;
  onResumeFromMastery: () => void;
  onVirtualMove: (forward: number, right: number) => void;
  onVirtualJump: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  gameState,
  telemetry,
  visitedStopIds,
  collectedRelicIds,
  activeStopId,
  timeOfDay,
  weatherPreset = 'auto',
  muted,
  recentRelicToast,
  onInspectStop,
  onTeleportToStop,
  onTeleportToPoint,
  onEquipWeapon,
  onSelectGuidanceTarget,
  onTriggerAttack,
  onTriggerLightningBolt,
  onTriggerParry,
  onTriggerDash,
  onTriggerGrapple,
  onSummonLayoffBoss,
  onChangeTimeOfDay,
  onChangeWeatherPreset,
  onToggleMute,
  onTogglePause,
  onResetSpawn,
  onRestartFromBeginning,
  onReturnToTitle,
  onResumeFromMastery,
  onVirtualMove,
  onVirtualJump,
}) => {
  const [sanctumBarExpanded, setSanctumBarExpanded] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight >= 520 : true
  );
  const [navCategory, setNavCategory] = useState<'projects' | 'jewels' | 'weapons'>('projects');
  const [storyDrawerOpen, setStoryDrawerOpen] = useState(false);
  const [summaryScrollOpen, setSummaryScrollOpen] = useState(false);
  const [minimapVisible, setMinimapVisible] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight >= 460 : true
  );
  const [controlPadVisible, setControlPadVisible] = useState(true);

  useEffect(() => {
    const syncCompactLandscape = () => {
      if (window.innerHeight < 520) {
        setSanctumBarExpanded(false);
      }
      if (window.innerHeight < 460) {
        setMinimapVisible(false);
      }
    };
    syncCompactLandscape();
    window.addEventListener('resize', syncCompactLandscape);
    return () => window.removeEventListener('resize', syncCompactLandscape);
  }, []);

  // Delayed damage trail for Player HP, Engaged Enemy HP, and Boss HP
  const pranaValue = telemetry.playerHp ?? 320;
  const pranaMax = telemetry.playerMaxHp ?? 320;
  const pranaPct = Math.max(0, Math.min(100, Math.round((pranaValue / pranaMax) * 100)));
  const [trailingPranaPct, setTrailingPranaPct] = useState(pranaPct);

  const engagedEnemy = telemetry.engagedDemon ?? null;
  const enemyHpPct = engagedEnemy
    ? Math.max(0, Math.min(100, Math.round((engagedEnemy.hp / engagedEnemy.maxHp) * 100)))
    : 100;
  const [trailingEnemyPct, setTrailingEnemyPct] = useState(enemyHpPct);

  const bossHpVal = telemetry.bossHp ?? 320;
  const bossMaxHpVal = telemetry.bossMaxHp ?? 320;
  const bossHpPct = Math.max(0, Math.min(100, Math.round((bossHpVal / bossMaxHpVal) * 100)));
  const [trailingBossPct, setTrailingBossPct] = useState(bossHpPct);

  // Cinematic Region Discovery Banner
  const [regionBannerText, setRegionBannerText] = useState<string | null>(null);
  const lastRegionRef = useRef<string>('');

  useEffect(() => {
    const t = window.setTimeout(() => {
      setTrailingPranaPct(pranaPct);
    }, 450);
    return () => window.clearTimeout(t);
  }, [pranaPct]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setTrailingEnemyPct(enemyHpPct);
    }, 380);
    return () => window.clearTimeout(t);
  }, [enemyHpPct]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setTrailingBossPct(bossHpPct);
    }, 450);
    return () => window.clearTimeout(t);
  }, [bossHpPct]);

  useEffect(() => {
    const cleanRegion = telemetry.regionName.split('·')[0].trim();
    if (cleanRegion && cleanRegion !== lastRegionRef.current) {
      lastRegionRef.current = cleanRegion;
      setRegionBannerText(telemetry.regionName);
      const timer = window.setTimeout(() => {
        setRegionBannerText(null);
      }, 2800);
      return () => window.clearTimeout(timer);
    }
  }, [telemetry.regionName]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      if (e.code === 'KeyH' || e.code === 'Tab') {
        if (e.code === 'Tab') e.preventDefault();
        setSanctumBarExpanded((prev) => !prev);
      } else if (e.code === 'KeyL') {
        setStoryDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const stats = computeCompletionStats(
    visitedStopIds.size,
    collectedRelicIds.size,
    PORTFOLIO_STOPS.length,
    LOTUS_RELICS.length
  );

  const staminaPct = telemetry.stamina ?? 100;
  const attackDmg = telemetry.attackDamage ?? 22;
  const aliveDemons = telemetry.aliveDemonsCount ?? 6;
  const bossPosture = telemetry.bossPosture ?? 0;
  const bossMaxPosture = telemetry.bossMaxPosture ?? 180;
  const musicMood = telemetry.musicMood ?? 'calm';
  const comboHits = telemetry.comboHitCount ?? 0;
  const comboRank = telemetry.comboRankCode ?? 'D';
  const comboTitle = telemetry.comboRankTitle ?? '';
  const equippedWeaponId = telemetry.equippedWeaponId ?? 'weapon-nandaka';
  const hurtFlash = telemetry.playerHurtFlash ?? 0;

  const cycleTimeOfDay = () => {
    const order: TimeOfDay[] = ['dawn', 'noon', 'twilight'];
    const next = order[(order.indexOf(timeOfDay) + 1) % order.length];
    onChangeTimeOfDay(next);
  };

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none cinematic-vignette">
      {/* PLAYER DAMAGE HIT FLASH OVERLAY */}
      {hurtFlash > 0.02 && (
        <div
          className="fixed inset-0 pointer-events-none z-10 transition-opacity duration-100"
          style={{
            background:
              'radial-gradient(circle at center, transparent 45%, rgba(225, 29, 72, 0.55) 100%)',
            opacity: Math.min(0.85, hurtFlash),
          }}
        />
      )}

      {/* 0. DYNAMIC CENTER RETICLE */}
      {gameState === 'playing' && !activeStopId && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-70">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle
              cx="14"
              cy="14"
              r={musicMood === 'combat' ? '5' : '2'}
              fill={musicMood === 'combat' ? '#f43f5e' : '#d4af37'}
            />
            <path
              d="M14 2V6M14 22V26M2 14H6M22 14H26"
              stroke={telemetry.grappleTargetTitle ? '#2dd4bf' : '#d4af37'}
              strokeWidth="1.2"
              strokeOpacity="0.65"
            />
          </svg>
        </div>
      )}

      {/* 0A. IN-WORLD 3D AFFORDANCE BADGES (DISTINGUISHING PROJECTS, JEWELS, WEAPONS & ENEMY HP BARS) */}
      {gameState === 'playing' &&
        !activeStopId &&
        telemetry.affordanceMarkers &&
        telemetry.affordanceMarkers.map((m) => {
          if (m.kind === 'enemy') {
            const hpPct = Math.max(0, Math.min(100, Math.round(((m.hp ?? 0) / (m.maxHp ?? 1)) * 100)));
            const posPct = Math.max(
              0,
              Math.min(100, Math.round(((m.posture ?? 0) / (m.maxPosture ?? 1)) * 100))
            );
            const isPerilous = m.aiState === 'windup' || m.aiState === 'strike';
            return (
              <div
                key={m.id}
                className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-10 flex flex-col items-center transition-all duration-75"
                style={{ left: `${m.xPct}%`, top: `${m.yPct}%` }}
              >
                {isPerilous && (
                  <div className="mb-0.5 px-1.5 py-0.2 bg-[#e11d48] text-white font-hud text-[9px] font-bold tracking-[0.2em] uppercase animate-pulse shadow-lg">
                    危 PERILOUS {m.aiState === 'strike' ? 'STRIKE!' : 'ATTACK — DEFLECT [RMB]!'}
                  </div>
                )}
                <div className="px-2 py-1 bg-[#09040a]/92 border border-[#f43f5e]/70 shadow-[0_6px_18px_rgba(0,0,0,0.9)] min-w-[126px]">
                  <div className="flex items-center justify-between gap-2 text-[9px] font-hud font-bold tracking-wider uppercase">
                    <span className="text-[#fda4af] truncate max-w-[85px]">{m.title}</span>
                    <span className="font-mono text-[#fef08a] tabular-nums">
                      {m.hp}/{m.maxHp}
                    </span>
                  </div>
                  {/* Enemy Vitality Bar */}
                  <div className="h-1.5 w-full bg-[#240610] border border-[#f43f5e]/40 mt-0.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#be123c] via-[#f43f5e] to-[#fb7185] transition-all duration-100"
                      style={{ width: `${hpPct}%` }}
                    />
                  </div>
                  {/* Enemy Sekiro Posture Bar */}
                  <div className="h-1 w-full bg-[#1c1306] mt-0.5 overflow-hidden">
                    <div
                      className="h-full bg-[#f59e0b] transition-all duration-100"
                      style={{ width: `${posPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          }

          if (m.kind === 'boss_hologram') {
            return (
              <div
                key={m.id}
                data-testid="boss-lock-hologram-badge"
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center animate-pulse"
                style={{ left: `${m.xPct}%`, top: `${m.yPct}%` }}
              >
                <div className="px-3.5 py-2 bg-[#04182b]/95 border-2 border-[#38bdf8] shadow-[0_0_28px_rgba(56,189,248,0.65)] backdrop-blur-md text-center max-w-[310px]">
                  <div className="font-mono text-[9px] font-bold tracking-[0.2em] uppercase text-[#38bdf8]">
                    {m.subtitle}
                  </div>
                  <div className="font-hud text-xs sm:text-sm font-bold text-[#fef08a] tracking-wide mt-0.5">
                    “{m.title}”
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rotate-45 bg-[#38bdf8] -mt-1 border border-[#04182b]" />
              </div>
            );
          }

          const badgeMeta =
            m.kind === 'project'
              ? {
                  tag: 'PROJECT SANCTUM',
                  bg: 'bg-[#07111e]/90',
                  border: 'border-[#d4af37]',
                  tagColor: 'text-[#d4af37]',
                  icon: '◆',
                }
              : m.kind === 'jewel'
              ? {
                  tag: 'CAREER JEWEL',
                  bg: 'bg-[#170926]/90',
                  border: 'border-[#c084fc]',
                  tagColor: 'text-[#e879f9]',
                  icon: '❖',
                }
              : {
                  tag: 'WEAPON FORGE',
                  bg: 'bg-[#1a1005]/90',
                  border: 'border-[#38bdf8]',
                  tagColor: 'text-[#38bdf8]',
                  icon: '⚔',
                };

          return (
            <div
              key={m.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-10 transition-all duration-75"
              style={{ left: `${m.xPct}%`, top: `${m.yPct}%` }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  if (m.kind === 'project') {
                    onTeleportToStop(m.id);
                  } else if (m.kind === 'weapon' && onEquipWeapon) {
                    onEquipWeapon(m.id as WeaponId);
                    onSelectGuidanceTarget?.(m.id, 'weapon');
                  } else if (m.kind === 'jewel') {
                    onSelectGuidanceTarget?.(m.id, 'jewel');
                  }
                }}
                className={`group flex flex-col items-center cursor-pointer`}
              >
                <div
                  className={`px-2 py-0.5 lg:px-2.5 lg:py-1 ${badgeMeta.bg} border-l-2 ${badgeMeta.border} backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform text-left max-w-[175px] lg:max-w-none`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-mono text-[8px] font-bold tracking-[0.16em] uppercase ${badgeMeta.tagColor}`}
                    >
                      {badgeMeta.icon} {badgeMeta.tag}
                    </span>
                    <span className="font-mono text-[9px] text-[#fef08a] tabular-nums">
                      {m.distance}m
                    </span>
                  </div>
                  <div className="font-hud text-[10px] lg:text-[11px] font-bold text-[#f8f5ee] tracking-wide truncate">
                    {m.title}
                  </div>
                  <div className="hidden lg:block font-mono text-[8px] text-[#94a3b8] uppercase tracking-wider">
                    {m.subtitle}
                  </div>
                </div>
                <div className="w-2 h-2 rotate-45 bg-[#d4af37] -mt-1 border border-[#05070b]" />
              </button>
            </div>
          );
        })}

      {/* 0B. FLOATING SCREEN-SPACE COMBAT DAMAGE, DODGE & SEKIRO DEFLECT POPUPS */}
      {telemetry.combatPopups &&
        telemetry.combatPopups.map((pop) => (
          <div
            key={pop.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center"
            style={{
              left: `${pop.xPct}%`,
              top: `${pop.yPct}%`,
              textShadow: '0 4px 16px rgba(0,0,0,0.98)',
            }}
          >
            <span
              className={`font-hud font-bold tracking-wider uppercase tabular-nums ${
                pop.kind === 'deathblow'
                  ? 'text-2xl text-[#f43f5e]'
                  : pop.kind === 'crit'
                  ? 'text-xl text-[#d4af37]'
                  : pop.kind === 'parry'
                  ? 'text-base text-[#2dd4bf]'
                  : 'text-lg text-[#f8f5ee]'
              }`}
            >
              {pop.text}
            </span>
            {pop.subtext && (
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#fef08a]">
                {pop.subtext}
              </span>
            )}
          </div>
        ))}

      {/* 1. TOP-LEFT UNIFIED PORTFOLIO VERSE NAVIGATOR (PROJECTS · JEWELS · WEAPONS) */}
      <div className="absolute top-3 left-4 lg:top-5 lg:left-6 flex flex-col gap-1.5 lg:gap-2 pointer-events-auto max-w-[310px] lg:max-w-[460px]">
        {/* Active Tale / Act Header with Left Golden Vertical Blade */}
        <div className="flex items-center gap-3 pl-2.5 lg:pl-3 border-l-2 border-[#d4af37]">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 lg:gap-2 font-hud text-[10px] lg:text-[11px] font-bold tracking-[0.16em] lg:tracking-[0.2em] uppercase text-[#d4af37]">
              <span>PORTFOLIO VERSE</span>
              <span>·</span>
              <span className="text-[#2dd4bf]">{stats.visitedStopsCount}/6 PROJECTS</span>
              <span>·</span>
              <span className="text-[#e879f9]">{stats.collectedRelicsCount}/5 JEWELS</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setStoryDrawerOpen((prev) => !prev);
                }}
                className="font-mythic italic text-sm lg:text-lg text-[#f8f5ee] hover:text-[#d4af37] transition-colors cursor-pointer leading-none"
                title="Open 5-Act Saga & September Layoff Chronicle [Key L]"
              >
                {telemetry.storyTitle || 'The Builder’s Awakening'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setStoryDrawerOpen((prev) => !prev);
                }}
                className="font-mono text-[9px] text-[#94a3b8] hover:text-[#d4af37] cursor-pointer"
              >
                [L · SAGA]
              </button>
              {!telemetry.bossDefeated && (
                <button
                  type="button"
                  data-testid="summon-boss-btn"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSummonLayoffBoss();
                  }}
                  className={`px-2 py-0.5 clip-blade-right border-l-2 font-hud text-[9px] lg:text-[10px] font-bold tracking-[0.14em] uppercase transition-all cursor-pointer ${
                    visitedStopIds.size >= 6
                      ? 'bg-[#881337]/90 hover:bg-[#be123c] border-[#fda4af] text-[#ffe4e6]'
                      : 'bg-[#081b2e]/90 hover:bg-[#0e2a47] border-[#38bdf8] text-[#bae6fd]'
                  }`}
                  title={
                    visitedStopIds.size >= 6
                      ? 'Challenge the September Layoff Boss [Key B]'
                      : `Unlock fight after seeing all the projects (${visitedStopIds.size}/6 seen) [Key B]`
                  }
                >
                  {telemetry.bossAwakened
                    ? '⚔ Boss Active [B]'
                    : visitedStopIds.size >= 6
                    ? '⚔ Challenge Boss [B]'
                    : `🔒 Boss (${visitedStopIds.size}/6) [B]`}
                </button>
              )}
              <button
                type="button"
                data-testid="open-summary-scroll-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setSummaryScrollOpen(true);
                }}
                className="px-2 py-0.5 clip-blade-right bg-[#0c1d2c]/90 hover:bg-[#16344d] border-l-2 border-[#2dd4bf] font-hud text-[9px] lg:text-[10px] font-bold tracking-[0.14em] uppercase text-[#ccfbf1] transition-all cursor-pointer"
                title="Open World Exploration & Unseen Relics Summary Scroll"
              >
                📜 Summary Scroll
              </button>
            </div>
          </div>
        </div>

        {/* Category Switcher Tabs: PROJECTS (6) | JEWELS (5) | WEAPONS (4) */}
        {sanctumBarExpanded ? (
          <div className="pl-3 space-y-1.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setNavCategory('projects');
                }}
                className={`px-2.5 py-0.5 font-hud text-[10px] font-bold tracking-[0.18em] uppercase cursor-pointer transition-colors ${
                  navCategory === 'projects'
                    ? 'bg-[#d4af37] text-[#05070b]'
                    : 'bg-[#070b14]/85 text-[#cbd5e1] border border-[#d4af37]/30 hover:text-white'
                }`}
              >
                ◆ Projects ({stats.visitedStopsCount}/6)
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setNavCategory('jewels');
                }}
                className={`px-2.5 py-0.5 font-hud text-[10px] font-bold tracking-[0.18em] uppercase cursor-pointer transition-colors ${
                  navCategory === 'jewels'
                    ? 'bg-[#c084fc] text-[#05070b]'
                    : 'bg-[#070b14]/85 text-[#e9d5ff] border border-[#c084fc]/30 hover:text-white'
                }`}
              >
                ❖ Jewels ({stats.collectedRelicsCount}/5)
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setNavCategory('weapons');
                }}
                className={`px-2.5 py-0.5 font-hud text-[10px] font-bold tracking-[0.18em] uppercase cursor-pointer transition-colors ${
                  navCategory === 'weapons'
                    ? 'bg-[#38bdf8] text-[#05070b]'
                    : 'bg-[#070b14]/85 text-[#bae6fd] border border-[#38bdf8]/30 hover:text-white'
                }`}
              >
                ⚔ Weapons (4)
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setSanctumBarExpanded(false);
                }}
                className="px-1.5 py-0.5 font-mono text-[9px] text-[#94a3b8] hover:text-white cursor-pointer"
                title="Toggle Navigator [Tab / H]"
              >
                [HIDE]
              </button>
            </div>

            {/* Category 1: 6 Shipped Project Sanctums */}
            {navCategory === 'projects' && (
              <div className="flex flex-wrap items-center gap-1">
                {PORTFOLIO_STOPS.map((stop) => {
                  const isVisited = visitedStopIds.has(stop.id);
                  const isCurrent =
                    activeStopId === stop.id ||
                    telemetry.nearStop?.id === stop.id ||
                    telemetry.trackedTarget?.id === stop.id;
                  return (
                    <button
                      key={stop.id}
                      type="button"
                      data-testid={`hud-project-btn-${stop.id}`}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSelectGuidanceTarget?.(stop.id, 'project');
                        onTeleportToStop(stop.id);
                      }}
                      className={`px-2 py-0.5 clip-blade-right font-hud text-[11px] font-semibold tracking-wider uppercase transition-all cursor-pointer border-l ${
                        isCurrent
                          ? 'bg-[#d4af37] text-[#05070b] border-[#fef08a] font-bold'
                          : isVisited
                          ? 'bg-[#091820]/85 text-[#2dd4bf] border-[#2dd4bf] hover:bg-[#112836]'
                          : 'bg-[#070b14]/75 text-[#cbd5e1] border-[#d4af37]/40 hover:text-white hover:border-[#d4af37]'
                      }`}
                      title={`Track & Teleport to Project Sanctum: ${stop.title}`}
                    >
                      {SHORT_STOP_LABELS[stop.id]}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Category 2: 5 Career Experience Lotus Jewels */}
            {navCategory === 'jewels' && (
              <div className="flex flex-wrap items-center gap-1">
                {LOTUS_RELICS.map((relic, idx) => {
                  const isCollected = collectedRelicIds.has(relic.id);
                  const isTracked = telemetry.trackedTarget?.id === relic.id;
                  return (
                    <button
                      key={relic.id}
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onSelectGuidanceTarget?.(relic.id, 'jewel');
                        onTeleportToPoint?.(
                          relic.position.x,
                          relic.position.z + 1.8,
                          `JEWEL · ${relic.company}`
                        );
                      }}
                      className={`px-2 py-0.5 clip-blade-right font-hud text-[11px] font-semibold tracking-wider uppercase transition-all cursor-pointer border-l ${
                        isTracked
                          ? 'bg-[#c084fc] text-[#05070b] border-white font-bold'
                          : isCollected
                          ? 'bg-[#190d26]/85 text-[#e879f9] border-[#c084fc] hover:bg-[#2a1440]'
                          : 'bg-[#070b14]/80 text-[#cbd5e1] border-[#c084fc]/45 hover:text-white'
                      }`}
                      title={`${relic.name} (${relic.era}) — Click to Track & Teleport`}
                    >
                      J0{idx + 1} · {relic.company.split(' ')[0]} {isCollected ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Category 3: 4 Divine Weapons & Armory Forges */}
            {navCategory === 'weapons' && (
              <div className="flex flex-wrap items-center gap-1">
                {FORGE_WEAPONS.map((w, idx) => {
                  const isEquipped = equippedWeaponId === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onEquipWeapon?.(w.id);
                        onSelectGuidanceTarget?.(w.id, 'weapon');
                      }}
                      className={`px-2 py-0.5 clip-blade-right font-hud text-[11px] font-semibold tracking-wider uppercase transition-all cursor-pointer border-l ${
                        isEquipped
                          ? 'bg-[#38bdf8] text-[#05070b] border-white font-bold'
                          : 'bg-[#070b14]/80 text-[#bae6fd] border-[#38bdf8]/45 hover:text-white'
                      }`}
                      title={`[${idx + 1}] Equip ${w.name} (+${w.baseDamageBonus} ATK · ${w.category})`}
                    >
                      [{idx + 1}] {w.name.split(' ')[0]} {isEquipped ? '★' : `+${w.baseDamageBonus}`}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active 3D Guidance Trail Indicator */}
            {telemetry.trackedTarget && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#fef08a] bg-[#060a14]/80 px-2 py-0.5 border-l border-[#d4af37]">
                <span>GOLDEN TRAIL →</span>
                <span className="font-bold text-white">{telemetry.trackedTarget.title}</span>
                <span className="text-[#2dd4bf]">({telemetry.trackedTarget.distance}m)</span>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              setSanctumBarExpanded(true);
            }}
            className="pl-2.5 lg:pl-3 font-hud text-[9px] lg:text-[11px] tracking-[0.16em] uppercase text-[#94a3b8] hover:text-[#d4af37] text-left cursor-pointer"
          >
            + NAVIGATOR [TAB]
          </button>
        )}

        {/* On-Demand Expandable 5-Act Story Drawer */}
        {storyDrawerOpen && (
          <div className="mt-1 p-4 bg-[#060a12]/94 border-l-2 border-[#d4af37] backdrop-blur-xl text-[#f4efe6] space-y-2.5 max-w-[350px] max-h-[48vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-1.5">
              <span className="font-hud text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
                5-Act Career &amp; Sept Layoff Saga
              </span>
              <button
                type="button"
                onClick={() => setStoryDrawerOpen(false)}
                className="text-[10px] font-mono text-[#fda4af] cursor-pointer"
              >
                [ESC]
              </button>
            </div>
            <p className="text-[11px] text-[#fde68a] leading-relaxed">
              {CREATOR_PROFILE.layoffStory}
            </p>
            <div className="space-y-1.5">
              {STORY_CHAPTERS.map((chap) => (
                <div
                  key={chap.act}
                  className="p-2 border-l border-[#d4af37]/40 bg-[#0b111e]/90 space-y-0.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-hud font-bold text-[#d4af37]">
                    <span>
                      {chap.act} · {chap.title}
                    </span>
                    <span className="font-mono text-[9px] text-[#94a3b8]">{chap.era}</span>
                  </div>
                  <p className="text-[11px] text-[#cbd5e1] leading-snug">{chap.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. TOP-CENTER FRAMELESS SKYLINE COMPASS + ENGAGED ASURA BAR / ELDEN RING BOSS BAR */}
      <div className="absolute top-3 lg:top-4 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center">
        {/* Frameless Horizon Compass Ribbon (Desktop/Tablet >= 1024px) */}
        <div className="relative w-80 h-6 overflow-hidden hidden lg:flex items-center border-b border-[#d4af37]/30">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-[#d4af37] z-20" />

          {COMPASS_CARDINALS.map((c) => {
            const diff = ((c.deg - telemetry.headingDeg + 540) % 360) - 180;
            if (Math.abs(diff) > 90) return null;
            const pct = 50 + (diff / 90) * 46;
            return (
              <div
                key={c.label}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${pct}%` }}
              >
                <span
                  className={`font-hud tracking-widest leading-none ${
                    c.label === 'N'
                      ? 'text-xs font-bold text-[#d4af37]'
                      : c.label.length === 1
                      ? 'text-[10px] font-semibold text-[#f4efe6]/85'
                      : 'text-[9px] text-[#94a3b8]/55'
                  }`}
                >
                  {c.label}
                </span>
              </div>
            );
          })}

          {PORTFOLIO_STOPS.map((stop) => {
            const compassInfo = computeCompassRibbonOffset(
              { x: telemetry.x, z: telemetry.z },
              stop.position,
              telemetry.headingDeg
            );
            const pct = 50 + compassInfo.normalizedOffset * 44;
            const visited = visitedStopIds.has(stop.id);
            return (
              <div
                key={stop.id}
                className="absolute bottom-0.5 -translate-x-1/2 z-10"
                style={{ left: `${pct}%` }}
              >
                <div
                  className={`w-1.5 h-1.5 rotate-45 ${
                    visited ? 'bg-[#2dd4bf]' : 'bg-[#d4af37]'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Cinematic Region Discovery Callout */}
        {regionBannerText && !telemetry.bossAwakened && !engagedEnemy && (
          <div className="mt-1 lg:mt-3 hidden lg:flex flex-col items-center animate-fade-in">
            <span className="font-mythic italic text-lg text-[#d4af37] tracking-wide drop-shadow">
              {regionBannerText.split('·')[0].trim()}
            </span>
            <div className="h-px w-36 bg-gradient-to-r from-transparent via-[#d4af37]/70 to-transparent mt-0.5" />
          </div>
        )}

        {/* Transient Combat / Paraglider Callout */}
        {telemetry.combatCallout && (
          <div className="mt-0.5 lg:mt-2 px-3 lg:px-4 py-0.5 bg-gradient-to-r from-transparent via-[#090e1a]/90 to-transparent border-y border-[#d4af37]/50 font-hud text-[9px] lg:text-xs font-bold tracking-[0.14em] lg:tracking-[0.2em] uppercase text-[#fef08a] max-w-[260px] lg:max-w-[540px] truncate text-center">
            {telemetry.combatCallout}
          </div>
        )}

        {/* ENGAGED ASURA ENEMY TARGET VITALITY & POSTURE BAR (Shows live decreasing HP during fights!) */}
        {engagedEnemy && (!telemetry.bossAwakened || telemetry.bossDefeated) && (
          <div
            data-testid="engaged-enemy-hud"
            className="mt-2.5 w-[350px] max-w-[86vw] bg-[#08040c]/88 border border-[#f43f5e]/55 px-3.5 py-2 backdrop-blur-md shadow-2xl space-y-1"
          >
            <div className="flex items-center justify-between text-[10px] font-hud uppercase tracking-[0.18em]">
              <span className="text-[#fda4af] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rotate-45 bg-[#f43f5e]" />
                <span>
                  {engagedEnemy.name} · {engagedEnemy.title}
                </span>
              </span>
              <span className="font-mono text-[#fef08a] tabular-nums">
                {engagedEnemy.hp} / {engagedEnemy.maxHp} HP
              </span>
            </div>

            {/* Enemy Vitality Bar with Delayed White-Gold Damage Trail */}
            <div className="relative h-2.5 w-full bg-[#1f0610] border border-[#f43f5e]/50 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[#fef08a]/85 transition-all duration-400"
                style={{ width: `${trailingEnemyPct}%` }}
              />
              <div
                className="relative h-full bg-gradient-to-r from-[#9f1239] via-[#e11d48] to-[#fb7185] transition-all duration-100"
                style={{ width: `${enemyHpPct}%` }}
              />
            </div>

            {/* Enemy Posture Bar & AI Status */}
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <div className="flex-1 h-1.5 bg-[#1c1306] border border-[#d4af37]/35 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#f59e0b] to-[#fef08a] transition-all duration-100"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((engagedEnemy.posture / engagedEnemy.maxPosture) * 100)
                    )}%`,
                  }}
                />
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#fde68a]">
                {engagedEnemy.aiState === 'windup'
                  ? '危 WINDUP — DEFLECT [RMB]!'
                  : engagedEnemy.aiState === 'strike'
                  ? '危 LUNGING STRIKE!'
                  : engagedEnemy.posture >= engagedEnemy.maxPosture * 0.85
                  ? '忍殺 DEATHBLOW READY!'
                  : `POSTURE ${Math.round(engagedEnemy.posture)}/${engagedEnemy.maxPosture}`}
              </span>
            </div>
          </div>
        )}

        {/* Sekiro / Elden Ring Colossal September Layoff Boss Bar */}
        {telemetry.bossAwakened && !telemetry.bossDefeated && (
          <div className="mt-3 w-[420px] max-w-[90vw] flex flex-col items-center space-y-1.5">
            <div className="w-64 flex flex-col items-center">
              <div className="text-[10px] font-hud font-bold tracking-[0.2em] uppercase text-[#fef08a]">
                {bossPosture >= bossMaxPosture
                  ? '危 DEATHBLOW READY — STRIKE NOW!'
                  : `POSTURE · ${bossPosture}/${bossMaxPosture}`}
              </div>
              <div className="h-1.5 w-full bg-[#1a1105]/90 border border-[#d4af37]/40 overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#f59e0b] via-[#fef08a] to-[#f59e0b] transition-all duration-100"
                  style={{
                    width: `${Math.min(100, Math.round((bossPosture / bossMaxPosture) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="w-full space-y-0.5">
              <div className="flex items-baseline justify-between px-1">
                <span className="font-mythic italic font-bold text-base text-[#ffe4e6] tracking-wide drop-shadow">
                  {telemetry.bossName || 'The September Layoff — Severance Sovereign'}
                </span>
                <span className="font-mono text-[10px] text-[#fda4af] tabular-nums">
                  {bossHpVal} / {bossMaxHpVal}
                </span>
              </div>
              <div className="relative h-2.5 w-full bg-[#1a060d]/90 border border-[#d4af37]/60 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#fef08a]/80 transition-all duration-500"
                  style={{ width: `${trailingBossPct}%` }}
                />
                <div
                  className="relative h-full bg-gradient-to-r from-[#881337] via-[#e11d48] to-[#f43f5e] transition-all duration-100"
                  style={{ width: `${bossHpPct}%` }}
                />
              </div>
            </div>

            {/* ANIMATED BOSS FIGHT [Z] SKY-LIGHTNING BOLT AFFORDANCE PROMPT */}
            <button
              type="button"
              data-testid="boss-lightning-prompt"
              onClick={(e) => {
                e.currentTarget.blur();
                onTriggerLightningBolt?.();
              }}
              className="pointer-events-auto mt-1.5 w-full flex items-center justify-between gap-2.5 px-3.5 py-2 bg-gradient-to-r from-[#041d33]/95 via-[#073459]/95 to-[#041d33]/95 border-2 border-[#38bdf8] shadow-[0_0_26px_rgba(56,189,248,0.75)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer animate-pulse"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 flex items-center justify-center bg-[#fef08a] text-[#05070b] font-mono font-extrabold text-xs border border-white shadow-[0_0_14px_rgba(254,240,138,0.95)] animate-bounce">
                  [Z]
                </span>
                <div className="text-left">
                  <div className="font-hud text-xs sm:text-sm font-bold tracking-[0.14em] uppercase text-[#fef08a] flex items-center gap-1.5">
                    <span>⚡ PRESS [Z] TO STRIKE DOWN SKY-LIGHTNING BOLT!</span>
                  </div>
                  <div className="font-mono text-[9px] text-[#7dd3fc] tracking-wider uppercase">
                    {telemetry.lightningCooldown && telemetry.lightningCooldown > 0
                      ? `RECHARGING VAJRA BOLT (${telemetry.lightningCooldown.toFixed(1)}s)...`
                      : 'CALLS DOWN INDRA THUNDERBOLT FROM ABOVE · -560 BOSS HP PER STRIKE'}
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 bg-[#38bdf8] text-[#05070b] font-hud font-bold text-[10px] tracking-widest uppercase shrink-0">
                STRIKE ⚡
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 3. TOP-RIGHT SYSTEM GLYPHS, COLOR-CODED RADAR & KINETIC COMBO STYLE RANK */}
      <div className="absolute top-4 right-6 flex flex-col items-end gap-2.5 pointer-events-auto">
        <div className="flex items-center gap-2 bg-[#060a12]/90 border-b border-[#d4af37]/35 px-2.5 py-1">
          <button
            type="button"
            tabIndex={-1}
            data-testid="cycle-time-of-day-btn"
            onClick={(e) => {
              e.currentTarget.blur();
              cycleTimeOfDay();
            }}
            title={`Time of Day: ${timeOfDay} (Click or press [N] to cycle)`}
            className="px-2 h-6 font-hud text-xs font-bold tracking-[0.16em] uppercase text-[#d4af37] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rotate-45 bg-[#d4af37]" />
            <span>{timeOfDay === 'twilight' ? 'Dusk' : timeOfDay}</span>
          </button>

          <span className="text-[#d4af37]/25">|</span>

          <ProceduralWeatherSystem
            timeOfDay={timeOfDay}
            weatherPreset={weatherPreset}
            onChangeTimeOfDay={onChangeTimeOfDay}
            onChangeWeatherPreset={(preset) => onChangeWeatherPreset?.(preset)}
          />

          <span className="text-[#d4af37]/25">|</span>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              setMinimapVisible((prev) => !prev);
            }}
            title="Toggle Tactical Radar"
            className={`px-1.5 h-6 font-hud text-xs font-bold tracking-[0.16em] uppercase transition-colors cursor-pointer ${
              minimapVisible ? 'text-[#2dd4bf]' : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Radar
          </button>

          <span className="text-[#d4af37]/25">|</span>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              setControlPadVisible((prev) => !prev);
            }}
            title="Toggle On-Screen RPG Control Pad"
            className={`px-1.5 h-6 font-hud text-xs font-bold tracking-[0.16em] uppercase transition-colors cursor-pointer ${
              controlPadVisible ? 'text-[#d4af37]' : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Pad
          </button>

          <span className="text-[#d4af37]/25">|</span>

          <button
            type="button"
            tabIndex={-1}
            aria-label={muted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
            title={muted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-6 h-6 flex items-center justify-center text-[#f4efe6] hover:text-[#d4af37] transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M11 5L6 9H2V15H6L11 19V5Z"
                stroke="#d4af37"
                strokeWidth="1.8"
              />
              {muted ? (
                <path d="M22 9L16 15M16 9L22 15" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path
                  d="M15.5 8.5C16.8 9.8 16.8 14.2 15.5 15.5"
                  stroke={musicMood === 'combat' ? '#f43f5e' : '#2dd4bf'}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Pause & World Atlas [P]"
            title="Pause & World Atlas [P]"
            onClick={(e) => {
              e.currentTarget.blur();
              onTogglePause();
            }}
            className="w-6 h-6 flex items-center justify-center text-[#f4efe6] hover:text-[#d4af37] transition-colors cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" stroke="#d4af37" strokeWidth="1.8" />
              <rect x="14" y="5" width="4" height="14" stroke="#d4af37" strokeWidth="1.8" />
            </svg>
          </button>
        </div>

        {/* Sacred Mandala Circular Radar showing Projects (Gold), Jewels (Purple), Weapons (Cyan), Boss (Crimson) */}
        {minimapVisible && (
          <div
            className="relative w-24 h-24 rounded-full border border-[#d4af37]/50 bg-[#050911]/90 overflow-hidden"
            style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.85)' }}
          >
            <svg width="96" height="96" viewBox="-70 -70 140 140" className="w-full h-full">
              <circle cx="0" cy="0" r="66" fill="#070d17" />
              <circle cx="0" cy="0" r="44" fill="none" stroke="#d4af37" strokeOpacity="0.16" strokeWidth="1" />
              <path
                d="M -65 -4 Q 0 -10 65 -4"
                stroke="#0d9488"
                strokeWidth="4.5"
                fill="none"
                opacity="0.6"
              />
              {/* Boss Citadel */}
              <circle cx="0" cy="-48" r="4.2" fill="#f43f5e" />

              {/* 6 Project Sanctums (Diamonds) */}
              {PORTFOLIO_STOPS.map((s) => {
                const visited = visitedStopIds.has(s.id);
                return (
                  <g key={s.id} transform={`translate(${s.position.x}, ${s.position.z})`}>
                    <polygon
                      points="0,-4.5 4.5,0 0,4.5 -4.5,0"
                      fill={visited ? '#2dd4bf' : '#d4af37'}
                    />
                  </g>
                );
              })}

              {/* 5 Career Jewels (Purple Dots) */}
              {LOTUS_RELICS.map((r) => {
                if (collectedRelicIds.has(r.id)) return null;
                return (
                  <circle
                    key={r.id}
                    cx={r.position.x}
                    cy={r.position.z}
                    r="2.6"
                    fill="#c084fc"
                  />
                );
              })}

              {/* 4 Weapon Forges (Cyan Squares) */}
              {FORGE_WEAPONS.map((w) => (
                <rect
                  key={w.id}
                  x={w.position.x - 2.2}
                  y={w.position.z - 2.2}
                  width="4.4"
                  height="4.4"
                  fill={equippedWeaponId === w.id ? '#fef08a' : '#38bdf8'}
                />
              ))}

              {/* Player Heading Arrow */}
              <g
                transform={`translate(${Math.max(-60, Math.min(60, telemetry.x))}, ${Math.max(
                  -60,
                  Math.min(60, telemetry.z)
                )}) rotate(${Math.round(telemetry.headingDeg)})`}
              >
                <polygon points="0,-7 5,5.5 0,3 -5,5.5" fill="#ffffff" />
              </g>
            </svg>
            <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[8px] font-hud font-bold text-[#d4af37]">
              N
            </span>
          </div>
        )}

        {/* Kinetic Combo Rank Emblem */}
        {comboHits > 0 && (
          <div className="flex items-center gap-3 pr-1 pointer-events-none">
            <div className="text-right">
              <div className="font-hud text-sm font-bold tracking-[0.14em] text-[#fef08a] tabular-nums">
                {comboHits} HIT CHAIN
              </div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-[#2dd4bf]">
                {comboTitle}
              </div>
            </div>
            <div className="w-8 h-8 rotate-45 bg-gradient-to-br from-[#d4af37] to-[#92400e] border border-[#fef9c3] flex items-center justify-center shadow-[0_0_16px_rgba(212,175,55,0.5)]">
              <span className="-rotate-45 font-display text-sm font-extrabold text-[#05070b]">
                {comboRank}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Relic / Astra Power Awakened Banner */}
      {recentRelicToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-transparent via-[#060a14]/95 to-transparent border-y border-[#d4af37] text-xs font-hud font-bold tracking-[0.18em] uppercase text-[#fef08a] pointer-events-none z-30">
          {recentRelicToast}
        </div>
      )}

      {/* Proximity Sanctum Scroll OR Weapon Forge Interaction Callout */}
      {!activeStopId && gameState === 'playing' && (telemetry.nearStop || telemetry.nearWeaponForge) && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-1.5 z-20">
          {telemetry.nearStop && (
            <button
              type="button"
              onClick={() => onInspectStop(telemetry.nearStop!.id)}
              className="flex items-center gap-2.5 px-4 py-1.5 clip-blade-right bg-[#070b14]/95 border-l-2 border-[#d4af37] hover:bg-[#101829] text-left shadow-2xl transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span className="px-2 py-0.5 bg-[#d4af37] text-[#05070b] font-hud font-bold text-[11px] tracking-wider uppercase">
                [E] INSPECT PROJECT CODEX
              </span>
              <span className="font-mythic italic text-sm sm:text-base text-[#f8f5ee]">
                {telemetry.nearStop.title}
              </span>
            </button>
          )}
          {telemetry.nearWeaponForge && (
            <button
              type="button"
              onClick={() => onEquipWeapon?.(telemetry.nearWeaponForge!.id)}
              className="flex items-center gap-2.5 px-4 py-1.5 clip-blade-right bg-[#091524]/95 border-l-2 border-[#38bdf8] hover:bg-[#12253d] text-left shadow-2xl transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span className="px-2 py-0.5 bg-[#38bdf8] text-[#05070b] font-hud font-bold text-[11px] tracking-wider uppercase">
                [E] EQUIP DIVINE WEAPON
              </span>
              <span className="font-hud text-xs sm:text-sm font-bold text-[#e0f2fe]">
                {telemetry.nearWeaponForge.name} (+{telemetry.nearWeaponForge.baseDamageBonus} ATK)
              </span>
            </button>
          )}
        </div>
      )}

      {/* 5. BOTTOM-CENTER AAA HERO VITALS, SUDARSHANA MEDALLION & EQUIPPED WEAPON BAR */}
      {gameState === 'playing' && !activeStopId && (
        <div className="fixed bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3 py-1.5 bg-[#050811]/88 border border-[#d4af37]/35 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.85)] pointer-events-auto">
          {/* Sacred 6-Petal Sudarshana Chakra SVG Medallion */}
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 pointer-events-none">
            <svg width="48" height="48" viewBox="0 0 64 64" className="w-full h-full">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="rgba(6, 10, 18, 0.9)"
                stroke="#d4af37"
                strokeWidth="1.5"
              />
              {PORTFOLIO_STOPS.map((s, idx) => {
                const angle = (idx / 6) * Math.PI * 2 - Math.PI / 2;
                const cx = 32 + Math.cos(angle) * 20;
                const cy = 32 + Math.sin(angle) * 20;
                const unlocked = visitedStopIds.has(s.id);
                return (
                  <circle
                    key={s.id}
                    cx={cx}
                    cy={cy}
                    r="3.6"
                    fill={unlocked ? '#2dd4bf' : 'rgba(148, 163, 184, 0.2)'}
                    stroke={unlocked ? '#ccfbf1' : '#d4af37'}
                    strokeWidth="1"
                  />
                );
              })}
              <polygon
                points="32,18 46,32 32,46 18,32"
                fill="rgba(212, 175, 55, 0.16)"
                stroke="#d4af37"
                strokeWidth="1.2"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-hud text-[11px] font-bold text-[#fef08a] leading-none">{attackDmg}</span>
              <span className="font-mono text-[6px] text-[#d4af37] uppercase">ATK</span>
            </div>
          </div>

          {/* Tapered Prana & Stamina Blade Bars + Quick Weapon Switcher [1-4] */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3 font-hud text-[10px] tracking-[0.14em] uppercase pointer-events-none">
              <span className="text-[#f8f5ee] font-bold">
                PRANA{' '}
                <span className="text-[#fda4af] tabular-nums">
                  {pranaValue}/{pranaMax}
                </span>
              </span>
              <span className="text-[#38bdf8] font-bold truncate max-w-[145px] sm:max-w-[190px]">
                ⚔ {telemetry.equippedWeaponName || 'Nandaka Sovereign Katana'}
              </span>
            </div>

            {/* Double-Layer Health Blade Bar with Delayed White-Gold Trail */}
            <div
              data-testid="player-hp-bar"
              className="relative w-48 sm:w-60 h-2 clip-blade-right bg-[#1a070e]/90 border-l-2 border-[#d4af37] overflow-hidden pointer-events-none"
            >
              <div
                className="absolute inset-y-0 left-0 bg-[#fef08a]/85 transition-all duration-500"
                style={{ width: `${trailingPranaPct}%` }}
              />
              <div
                className="relative h-full bg-gradient-to-r from-[#9f1239] via-[#e11d48] to-[#fb7185] transition-all duration-150"
                style={{ width: `${pranaPct}%` }}
              />
            </div>

            {/* Celadon Stamina / Spirit Gauge */}
            <div className="w-40 sm:w-48 h-1 clip-blade-right bg-[#061c1b]/90 border-l-2 border-[#2dd4bf] overflow-hidden pointer-events-none">
              <div
                className="h-full bg-gradient-to-r from-[#0d9488] to-[#2dd4bf] transition-all duration-100"
                style={{ width: `${staminaPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5B. RIGHT-HAND SIDE SWORD & WEAPON SELECTION LEGEND (KEYS 1–4 + [Z] SKY-LIGHTNING) */}
      {gameState === 'playing' && !activeStopId && (
        <aside
          data-testid="right-weapon-legend"
          aria-label="Sword and Weapon Selection Legend"
          className="fixed right-3 lg:right-5 top-1/2 -translate-y-1/2 z-20 pointer-events-auto flex flex-col gap-1.5 w-[178px] sm:w-[215px] bg-[#050914]/92 border-r-2 border-y border-l border-[#d4af37]/55 p-2.5 backdrop-blur-md shadow-[0_14px_36px_rgba(0,0,0,0.9)]"
        >
          <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-1">
            <span className="font-hud text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase text-[#d4af37]">
              ⚔ SWORD LEGEND
            </span>
            <span className="font-mono text-[8px] sm:text-[9px] text-[#38bdf8] uppercase">
              KEYS [1–4]
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {FORGE_WEAPONS.map((w, idx) => {
              const active = equippedWeaponId === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  data-testid={`weapon-legend-btn-${idx + 1}`}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onEquipWeapon?.(w.id);
                  }}
                  className={`group w-full flex items-center justify-between gap-1.5 px-2 py-1.5 text-left transition-all cursor-pointer border ${
                    active
                      ? 'bg-gradient-to-r from-[#d4af37] via-[#f59e0b] to-[#d4af37] text-[#05070b] border-[#fef08a] shadow-[0_0_14px_rgba(212,175,55,0.45)]'
                      : 'bg-[#08101f]/90 hover:bg-[#111e36] text-[#e2e8f0] border-[#d4af37]/25 hover:border-[#d4af37]/75'
                  }`}
                  title={`Press Key [${idx + 1}] or Click to equip ${w.name} (${w.category})`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 flex items-center justify-center font-mono text-[10px] font-bold shrink-0 border ${
                        active
                          ? 'bg-[#05070b] text-[#fef08a] border-[#05070b]'
                          : 'bg-[#04070e] text-[#d4af37] border-[#d4af37]/40'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`font-hud text-[10px] sm:text-[11px] font-bold tracking-wide truncate ${
                          active ? 'text-[#05070b]' : 'text-[#f8f5ee]'
                        }`}
                      >
                        {w.name.split(' ').slice(0, 2).join(' ')}
                      </div>
                      <div
                        className={`font-mono text-[8px] uppercase tracking-wider truncate ${
                          active ? 'text-[#05070b]/80 font-bold' : 'text-[#94a3b8]'
                        }`}
                      >
                        {w.category.split(' ').slice(-1)[0]} · +{w.baseDamageBonus} ATK
                      </div>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-[8px] font-bold uppercase px-1 py-0.5 shrink-0 ${
                      active
                        ? 'bg-[#05070b] text-[#fef08a]'
                        : 'text-[#38bdf8] group-hover:text-[#fef08a]'
                    }`}
                  >
                    {active ? 'ACTIVE' : 'EQUIP'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Unlockable Super Power: INDRA VAJRA SKY-LIGHTNING BOLT [Key Z] */}
          <button
            type="button"
            data-testid="hud-lightning-bolt-btn"
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerLightningBolt?.();
            }}
            className={`mt-0.5 w-full flex items-center justify-between gap-1.5 px-2 py-1.5 font-hud text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border ${
              visitedStopIds.size >= 6
                ? 'bg-gradient-to-r from-[#0284c7] via-[#38bdf8] to-[#fef08a] text-[#05070b] border-white shadow-[0_0_16px_rgba(56,189,248,0.85)] animate-pulse'
                : 'bg-[#071120]/90 text-[#7dd3fc] border-[#38bdf8]/40 hover:border-[#38bdf8]'
            }`}
            title={
              visitedStopIds.size >= 6
                ? 'Strike Sky-Lightning Bolt from above to crush the Layoff Monster [Key Z]'
                : `Inspect all 6 Project Sanctums (${visitedStopIds.size}/6) to unlock the Sky-Lightning Bolt Super Power [Key Z]`
            }
          >
            <span className="flex items-center gap-1.5 truncate">
              <span className="px-1 py-0.2 bg-[#05070b] text-[#fef08a] font-mono text-[9px] font-bold">
                [Z]
              </span>
              <span className="truncate">
                {visitedStopIds.size >= 6
                  ? '⚡ SKY-LIGHTNING'
                  : `🔒 LIGHTNING (${visitedStopIds.size}/6)`}
              </span>
            </span>
            <span className="font-mono text-[8px]">
              {visitedStopIds.size >= 6 ? 'READY' : 'LOCKED'}
            </span>
          </button>
        </aside>
      )}

      {/* 6. ON-SCREEN MOBILE ACTION-RPG CONTROL PAD (LEFT VIRTUAL ANALOG JOYSTICK + RIGHT RADIAL SKILL WHEEL) */}
      {gameState === 'playing' && !activeStopId && controlPadVisible && (
        <MobileRpgControlPad
          onVirtualMove={onVirtualMove}
          onVirtualJump={onVirtualJump}
          onTriggerAttack={onTriggerAttack}
          onTriggerLightningBolt={onTriggerLightningBolt}
          onTriggerParry={onTriggerParry}
          onTriggerDash={onTriggerDash}
          onTriggerGrapple={onTriggerGrapple}
          onInteractContext={
            telemetry.nearStop
              ? () => onInspectStop(telemetry.nearStop!.id)
              : telemetry.nearWeaponForge
              ? () => onEquipWeapon?.(telemetry.nearWeaponForge!.id)
              : undefined
          }
          contextActionLabel={
            telemetry.nearStop
              ? 'INSPECT'
              : telemetry.nearWeaponForge
              ? 'EQUIP'
              : null
          }
          comboStage={telemetry.comboStage}
          grappleAvailable={Boolean(telemetry.grappleTargetTitle)}
          isGliding={Boolean(telemetry.isGliding)}
          lightningUnlocked={visitedStopIds.size >= 6}
          unlockedProjectsCount={visitedStopIds.size}
        />
      )}

      {/* Pause Modal Card */}
      {gameState === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-modal-title"
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#04060b]/88 backdrop-blur-md pointer-events-auto"
        >
          <div className="w-full max-w-md bg-[#070b14] border border-[#d4af37]/45 p-6 text-[#f4efe6] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-3">
              <div>
                <div className="text-[10px] font-hud font-bold text-[#d4af37] uppercase tracking-[0.22em]">
                  PORTFOLIO VERSE ATLAS · PAUSED
                </div>
                <h2 id="pause-modal-title" className="font-display text-xl font-bold text-[#f8f5ee]">
                  Ayush Dubey — Portfolio Verse
                </h2>
              </div>
              <div className="font-hud text-xs font-bold text-[#2dd4bf] tracking-wider">
                {stats.visitedStopsCount}/6 SANCTUMS · {6 - aliveDemons}/6 ASURAS
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              {PORTFOLIO_STOPS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onTogglePause();
                    onTeleportToStop(s.id);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 clip-blade-right bg-[#0c1322] hover:bg-[#152138] border-l-2 border-[#d4af37]/50 text-left cursor-pointer transition-colors"
                >
                  <span className="font-sans font-medium text-[#f8f5ee]">
                    {s.indexNumber}. {s.title}
                  </span>
                  <span
                    className={`font-hud text-xs font-bold uppercase tracking-wider ${
                      visitedStopIds.has(s.id) ? 'text-[#2dd4bf]' : 'text-[#d4af37]'
                    }`}
                  >
                    {visitedStopIds.has(s.id) ? 'Awakened' : 'Fast Travel'}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-[#d4af37]/20 font-hud text-xs uppercase tracking-wider">
              <button
                type="button"
                onClick={onReturnToTitle}
                className="px-3.5 py-1.5 border border-[#d4af37]/35 bg-[#0c1322] hover:bg-[#172338] text-[#cbd5e1] cursor-pointer"
              >
                Title Screen
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetSpawn();
                  onTogglePause();
                }}
                className="px-3.5 py-1.5 border border-[#d4af37]/35 bg-[#0c1322] hover:bg-[#172338] text-[#f8f5ee] cursor-pointer"
              >
                Reset Spawn
              </button>
              <button
                type="button"
                onClick={onTogglePause}
                className="px-5 py-1.5 clip-blade-right bg-[#d4af37] hover:bg-[#fde68a] text-[#05070b] font-bold cursor-pointer"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRUE PLAYER DEATH / GAME OVER MODAL — Forces Full Restart from the Beginning */}
      {gameState === 'player_died' && (
        <div
          data-testid="player-died-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="player-died-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090205]/95 backdrop-blur-xl pointer-events-auto"
        >
          <div className="w-full max-w-lg bg-[#0d0509] border-2 border-[#e11d48] p-6 sm:p-8 text-[#f8f5ee] space-y-5 shadow-[0_0_60px_rgba(225,29,72,0.45)] text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#2e0714] border border-[#f43f5e]/60 font-hud text-[11px] font-bold tracking-[0.26em] uppercase text-[#fda4af]">
              <span>死 · PRANA EXTINGUISHED IN COMBAT</span>
            </div>

            <h2
              id="player-died-title"
              className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#ffe4e6]"
            >
              YOU HAVE FALLEN
            </h2>

            <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed max-w-md mx-auto">
              Your Prana vitality dropped to zero against the Corporate Asuras of Portfolio Verse.
              Hint: Inspect all <strong className="text-[#fef08a]">6 Project Sanctums</strong> to
              unlock the <strong className="text-[#38bdf8]">⚡ Indra Vajra Sky-Lightning Bolt [Key Z]</strong>{' '}
              and use <strong className="text-[#2dd4bf]">[RMB / V] Sekiro Deflect</strong> to shatter enemy posture!
            </p>

            <div className="p-3 bg-[#190810] border border-[#f43f5e]/30 text-left font-mono text-[11px] text-[#fda4af] space-y-1">
              <div>• Projects Awakened before fall: {visitedStopIds.size} / 6</div>
              <div>• Career Jewels Collected before fall: {collectedRelicIds.size} / 5</div>
              <div>• Corporate Asuras Vanquished: {6 - aliveDemons} / 6</div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 font-hud text-xs uppercase tracking-[0.18em]">
              <button
                type="button"
                data-testid="restart-from-beginning-btn"
                onClick={onRestartFromBeginning}
                className="w-full sm:w-auto px-6 py-3 clip-blade-right bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#be123c] hover:brightness-110 text-white font-extrabold cursor-pointer shadow-[0_10px_28px_rgba(225,29,72,0.5)]"
              >
                ↻ RESTART FROM THE BEGINNING
              </button>
              <button
                type="button"
                onClick={onReturnToTitle}
                className="w-full sm:w-auto px-4 py-3 border border-[#f43f5e]/40 bg-[#14070d] hover:bg-[#240b16] text-[#fda4af] font-bold cursor-pointer"
              >
                Title Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POST-COMPLETION SUMMARY SCROLL MODAL (Shows Seen & Unlocked vs. Still Left Unseen to Explore) */}
      {(gameState === 'gameover' || summaryScrollOpen) && (
        <div
          data-testid="summary-scroll-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mastery-modal-title"
          className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-[#04060b]/92 backdrop-blur-xl pointer-events-auto"
        >
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#070b14] border-2 border-[#d4af37] text-[#f4efe6] shadow-[0_24px_70px_rgba(0,0,0,0.95)] overflow-hidden">
            {/* Scroll Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#130d04] via-[#0c1322] to-[#130d04] border-b border-[#d4af37]/40 flex items-start justify-between gap-4 shrink-0">
              <div>
                <div className="text-[10px] sm:text-xs font-hud font-bold text-[#2dd4bf] uppercase tracking-[0.24em]">
                  {telemetry.bossDefeated
                    ? '📜 ROYAL SUMMARY SCROLL · SEPTEMBER LAYOFF VANQUISHED!'
                    : '📜 ROYAL SUMMARY SCROLL · PORTFOLIO VERSE CHRONICLE'}
                </div>
                <h2
                  id="mastery-modal-title"
                  className="font-display text-xl sm:text-2xl font-extrabold text-[#fef08a] mt-0.5"
                >
                  What You Saw &amp; Unlocked — And What Still Awaits in the Verse
                </h2>
                <p className="text-xs text-[#cbd5e1] mt-1">
                  Review every Project Sanctum, Career Jewel, Divine Weapon, and Corporate Asura you
                  have conquered—or teleport directly to anything still left unseen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSummaryScrollOpen(false);
                  if (gameState === 'gameover') {
                    onResumeFromMastery();
                  }
                }}
                className="px-2.5 py-1 border border-[#d4af37]/45 bg-[#0c1322] hover:bg-[#172540] font-mono text-xs text-[#fef08a] cursor-pointer shrink-0"
              >
                [ESC · CLOSE]
              </button>
            </div>

            {/* Scrollable Body: Seen & Unlocked vs. Still Left Unseen */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Top Completion Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 bg-[#0b1322] border-l-2 border-[#2dd4bf]">
                  <div className="font-mono text-[9px] uppercase text-[#94a3b8]">Project Sanctums</div>
                  <div className="font-hud text-base font-extrabold text-[#2dd4bf]">
                    {visitedStopIds.size} / {PORTFOLIO_STOPS.length} Seen
                  </div>
                </div>
                <div className="p-2.5 bg-[#0b1322] border-l-2 border-[#c084fc]">
                  <div className="font-mono text-[9px] uppercase text-[#94a3b8]">Career Jewels</div>
                  <div className="font-hud text-base font-extrabold text-[#e879f9]">
                    {collectedRelicIds.size} / {LOTUS_RELICS.length} Collected
                  </div>
                </div>
                <div className="p-2.5 bg-[#0b1322] border-l-2 border-[#38bdf8]">
                  <div className="font-mono text-[9px] uppercase text-[#94a3b8]">Sky-Lightning Power</div>
                  <div className="font-hud text-base font-extrabold text-[#38bdf8]">
                    {visitedStopIds.size >= 6 ? '⚡ UNLOCKED [Z]' : `LOCKED (${visitedStopIds.size}/6)`}
                  </div>
                </div>
                <div className="p-2.5 bg-[#0b1322] border-l-2 border-[#f43f5e]">
                  <div className="font-mono text-[9px] uppercase text-[#94a3b8]">Corporate Asuras</div>
                  <div className="font-hud text-base font-extrabold text-[#fda4af]">
                    {6 - aliveDemons}/6 + {telemetry.bossDefeated ? 'Boss Slain' : 'Boss Alive'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* COLUMN 1: WHAT YOU SAW, UNLOCKED & VANQUISHED */}
                <div className="p-3.5 bg-[#0a101d] border border-[#2dd4bf]/35 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#2dd4bf]/25 pb-1.5">
                    <span className="font-hud text-xs font-bold uppercase tracking-[0.18em] text-[#2dd4bf]">
                      ✓ SEEN &amp; UNLOCKED ({visitedStopIds.size + collectedRelicIds.size} DISCOVERIES)
                    </span>
                  </div>

                  {/* Seen Projects & Unlocked Astra Powers */}
                  <div className="space-y-1.5">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#d4af37]">
                      Awakened Project Sanctums &amp; Powers ({visitedStopIds.size}/6)
                    </div>
                    {visitedStopIds.size === 0 ? (
                      <div className="text-[11px] text-[#94a3b8] italic">
                        No Project Sanctums inspected yet.
                      </div>
                    ) : (
                      PORTFOLIO_STOPS.filter((s) => visitedStopIds.has(s.id)).map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-2 p-2 bg-[#07161b] border-l-2 border-[#2dd4bf]"
                        >
                          <div>
                            <div className="font-semibold text-[#f8f5ee]">
                              {s.indexNumber}. {s.title}
                            </div>
                            <div className="font-mono text-[9px] text-[#2dd4bf]">
                              Unlocked: {s.unlockedPower.name} (+{s.unlockedPower.bonusDamage} ATK)
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSummaryScrollOpen(false);
                              onResumeFromMastery();
                              onTeleportToStop(s.id);
                            }}
                            className="px-2 py-1 bg-[#0d9488]/30 hover:bg-[#0d9488] text-[#ccfbf1] hover:text-[#05070b] font-hud text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                          >
                            Revisit →
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Collected Career Experience Jewels */}
                  <div className="space-y-1.5 pt-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#e879f9]">
                      Collected Career Jewels ({collectedRelicIds.size}/5)
                    </div>
                    {collectedRelicIds.size === 0 ? (
                      <div className="text-[11px] text-[#94a3b8] italic">
                        No Career Experience Jewels collected yet.
                      </div>
                    ) : (
                      LOTUS_RELICS.filter((r) => collectedRelicIds.has(r.id)).map((r) => (
                        <div
                          key={r.id}
                          className="p-2 bg-[#160b24] border-l-2 border-[#c084fc] space-y-0.5"
                        >
                          <div className="font-semibold text-[#f8f5ee]">
                            ❖ {r.company} ({r.era})
                          </div>
                          <div className="text-[10px] text-[#e9d5ff]">{r.meaning}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Vanquished Corporate Asuras */}
                  <div className="space-y-1 pt-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#fda4af]">
                      Corporate Asuras Vanquished ({(telemetry.vanquishedDemonIds?.length ?? 0) + (telemetry.bossDefeated ? 1 : 0)}/7)
                    </div>
                    {telemetry.bossDefeated && (
                      <div className="p-1.5 bg-[#290915] border-l-2 border-[#f43f5e] text-[10px] font-bold text-[#fecdd3]">
                        ★ THE SEPTEMBER LAYOFF — "YOUR ROLE HAS BEEN IMPACTED" (SLAIN)
                      </div>
                    )}
                    {INITIAL_DEMON_SPAWNS.filter((d) =>
                      telemetry.vanquishedDemonIds?.includes(d.id)
                    ).map((d) => (
                      <div
                        key={d.id}
                        className="p-1.5 bg-[#1b0912] border-l-2 border-[#f43f5e]/70 text-[10px] text-[#fda4af]"
                      >
                        ✓ {d.name} ({d.title})
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMN 2: WHAT YOU COULD NOT SEE YET & IS STILL LEFT UNSEEN TO EXPLORE */}
                <div className="p-3.5 bg-[#0f0c06] border border-[#d4af37]/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-1.5">
                    <span className="font-hud text-xs font-bold uppercase tracking-[0.18em] text-[#fef08a]">
                      ✦ STILL LEFT UNSEEN IN THE WORLD ({6 - visitedStopIds.size + (5 - collectedRelicIds.size)} REMAINING)
                    </span>
                  </div>

                  {/* Unseen Project Sanctums */}
                  <div className="space-y-1.5">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#d4af37]">
                      Unseen Project Sanctums ({6 - visitedStopIds.size} Left)
                    </div>
                    {visitedStopIds.size === PORTFOLIO_STOPS.length ? (
                      <div className="p-2 bg-[#07161b] border border-[#2dd4bf]/40 text-[#2dd4bf] font-semibold text-[11px]">
                        ★ All 6 Project Sanctums have been discovered and awakened!
                      </div>
                    ) : (
                      PORTFOLIO_STOPS.filter((s) => !visitedStopIds.has(s.id)).map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-2 p-2 bg-[#171207] border-l-2 border-[#d4af37]"
                        >
                          <div>
                            <div className="font-semibold text-[#fef08a]">
                              {s.indexNumber}. {s.title}
                            </div>
                            <div className="text-[10px] text-[#cbd5e1]">{s.category}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSummaryScrollOpen(false);
                              onResumeFromMastery();
                              onTeleportToStop(s.id);
                            }}
                            className="px-2.5 py-1 clip-blade-right bg-[#d4af37] hover:bg-[#fef08a] text-[#05070b] font-hud text-[9px] font-extrabold uppercase tracking-wider cursor-pointer shrink-0"
                          >
                            Teleport &amp; See →
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Unseen Career Experience Lotus Jewels */}
                  <div className="space-y-1.5 pt-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#e879f9]">
                      Uncollected Career Jewels ({5 - collectedRelicIds.size} Left)
                    </div>
                    {collectedRelicIds.size === LOTUS_RELICS.length ? (
                      <div className="p-2 bg-[#160b24] border border-[#c084fc]/40 text-[#e879f9] font-semibold text-[11px]">
                        ★ All 5 Career Experience Lotus Jewels collected!
                      </div>
                    ) : (
                      LOTUS_RELICS.filter((r) => !collectedRelicIds.has(r.id)).map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-2 p-2 bg-[#160d21] border-l-2 border-[#c084fc]"
                        >
                          <div>
                            <div className="font-semibold text-[#f3e8ff]">
                              ❖ {r.company} ({r.era})
                            </div>
                            <div className="text-[10px] text-[#cbd5e1]">{r.name}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSummaryScrollOpen(false);
                              onResumeFromMastery();
                              onSelectGuidanceTarget?.(r.id, 'jewel');
                              onTeleportToPoint?.(
                                r.position.x,
                                r.position.z + 1.8,
                                `JEWEL · ${r.company}`
                              );
                            }}
                            className="px-2.5 py-1 clip-blade-right bg-[#c084fc] hover:bg-[#e879f9] text-[#05070b] font-hud text-[9px] font-extrabold uppercase tracking-wider cursor-pointer shrink-0"
                          >
                            Teleport &amp; Collect →
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Unvanquished Corporate Asuras & Boss */}
                  <div className="space-y-1 pt-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#fda4af]">
                      Remaining Corporate Threats in the World ({aliveDemons + (telemetry.bossDefeated ? 0 : 1)} Left)
                    </div>
                    {!telemetry.bossDefeated && (
                      <div className="flex items-center justify-between gap-2 p-2 bg-[#240813] border-l-2 border-[#f43f5e]">
                        <span className="text-[10px] font-bold text-[#fecdd3]">
                          ⚔ THE SEPTEMBER LAYOFF — "YOUR ROLE HAS BEEN IMPACTED"
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSummaryScrollOpen(false);
                            onResumeFromMastery();
                            onSummonLayoffBoss();
                          }}
                          className="px-2 py-0.5 bg-[#e11d48] hover:bg-[#f43f5e] text-white font-hud text-[9px] font-bold uppercase cursor-pointer shrink-0"
                        >
                          Confront Boss →
                        </button>
                      </div>
                    )}
                    {INITIAL_DEMON_SPAWNS.filter(
                      (d) => !telemetry.vanquishedDemonIds?.includes(d.id)
                    ).map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between gap-2 p-1.5 bg-[#170910] border-l border-[#f43f5e]/50 text-[10px] text-[#fda4af]"
                      >
                        <span className="truncate">• {d.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSummaryScrollOpen(false);
                            onResumeFromMastery();
                            onTeleportToPoint?.(d.position.x, d.position.z + 3.5, d.name);
                          }}
                          className="px-2 py-0.5 bg-[#881337] hover:bg-[#be123c] text-white font-hud text-[8px] uppercase cursor-pointer shrink-0"
                        >
                          Hunt →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll Footer Actions */}
            <div className="px-5 py-3.5 bg-[#050811] border-t border-[#d4af37]/30 flex flex-wrap items-center justify-between gap-3 shrink-0 font-hud text-xs uppercase tracking-wider">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={CREATOR_PROFILE.calUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 clip-blade-right bg-[#d4af37] hover:bg-[#fde68a] text-[#05070b] font-extrabold cursor-pointer"
                >
                  Book Call with Ayush
                </a>
                <a
                  href={CREATOR_PROFILE.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 border border-[#d4af37] bg-[#0c1322] hover:bg-[#172338] text-[#f8f5ee] font-bold cursor-pointer"
                >
                  Resume (PDF)
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSummaryScrollOpen(false);
                    onRestartFromBeginning();
                  }}
                  className="px-3.5 py-2 border border-[#f43f5e]/50 bg-[#1f0812] hover:bg-[#380e20] text-[#fda4af] font-bold cursor-pointer"
                >
                  ↻ Restart Verse
                </button>
                <button
                  type="button"
                  data-testid="continue-exploring-btn"
                  onClick={() => {
                    setSummaryScrollOpen(false);
                    onResumeFromMastery();
                  }}
                  className="px-5 py-2 clip-blade-right bg-[#0d9488] hover:bg-[#14b8a6] text-[#f8f5ee] font-extrabold cursor-pointer"
                >
                  Continue Exploring World →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
