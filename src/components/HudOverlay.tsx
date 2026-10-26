import React, { useEffect, useRef, useState } from 'react';
import {
  CREATOR_PROFILE,
  PORTFOLIO_STOPS,
  STORY_CHAPTERS,
  PortfolioStop,
  LOTUS_RELICS,
  FORGE_WEAPONS,
  WeaponId,
  ForgeWeapon,
} from '../data/portfolioStops';
import { TimeOfDay } from '../game/proceduralScene';
import { computeCompletionStats, computeCompassRibbonOffset } from '../game/worldLogic';

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
  kind: 'project' | 'jewel' | 'weapon' | 'enemy';
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
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  telemetry: HudTelemetry;
  visitedStopIds: Set<string>;
  collectedRelicIds: Set<string>;
  activeStopId: string | null;
  timeOfDay: TimeOfDay;
  muted: boolean;
  gamepadConnected: boolean;
  recentRelicToast: string | null;
  onInspectStop: (stopId: string) => void;
  onTeleportToStop: (stopId: string) => void;
  onTeleportToPoint?: (x: number, z: number, label: string) => void;
  onEquipWeapon?: (weaponId: WeaponId) => void;
  onSelectGuidanceTarget?: (id: string, kind: 'project' | 'jewel' | 'weapon') => void;
  onTriggerAttack: (isNova?: boolean) => void;
  onTriggerParry: () => void;
  onTriggerDash?: () => void;
  onTriggerGrapple: () => void;
  onSummonLayoffBoss: () => void;
  onChangeTimeOfDay: (mode: TimeOfDay) => void;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onResetSpawn: () => void;
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
  muted,
  recentRelicToast,
  onInspectStop,
  onTeleportToStop,
  onTeleportToPoint,
  onEquipWeapon,
  onSelectGuidanceTarget,
  onTriggerAttack,
  onTriggerParry,
  onTriggerDash,
  onTriggerGrapple,
  onSummonLayoffBoss,
  onChangeTimeOfDay,
  onToggleMute,
  onTogglePause,
  onResetSpawn,
  onReturnToTitle,
  onResumeFromMastery,
}) => {
  const [sanctumBarExpanded, setSanctumBarExpanded] = useState(true);
  const [navCategory, setNavCategory] = useState<'projects' | 'jewels' | 'weapons'>('projects');
  const [storyDrawerOpen, setStoryDrawerOpen] = useState(false);
  const [minimapVisible, setMinimapVisible] = useState(true);

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
                  className={`px-2.5 py-1 ${badgeMeta.bg} border-l-2 ${badgeMeta.border} backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform text-left`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-mono text-[8px] font-bold tracking-[0.18em] uppercase ${badgeMeta.tagColor}`}
                    >
                      {badgeMeta.icon} {badgeMeta.tag}
                    </span>
                    <span className="font-mono text-[9px] text-[#fef08a] tabular-nums">
                      {m.distance}m
                    </span>
                  </div>
                  <div className="font-hud text-[11px] font-bold text-[#f8f5ee] tracking-wide whitespace-nowrap">
                    {m.title}
                  </div>
                  <div className="font-mono text-[8px] text-[#94a3b8] uppercase tracking-wider">
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
      <div className="absolute top-5 left-6 flex flex-col gap-2 pointer-events-auto max-w-[460px]">
        {/* Active Tale / Act Header with Left Golden Vertical Blade */}
        <div className="flex items-center gap-3 pl-3 border-l-2 border-[#d4af37]">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-hud text-[11px] font-bold tracking-[0.2em] uppercase text-[#d4af37]">
              <span>PORTFOLIO VERSE</span>
              <span>·</span>
              <span className="text-[#2dd4bf]">{stats.visitedStopsCount}/6 PROJECTS</span>
              <span>·</span>
              <span className="text-[#e879f9]">{stats.collectedRelicsCount}/5 JEWELS</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setStoryDrawerOpen((prev) => !prev);
                }}
                className="font-mythic italic text-lg text-[#f8f5ee] hover:text-[#d4af37] transition-colors cursor-pointer leading-none"
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
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSummonLayoffBoss();
                  }}
                  className="px-2 py-0.5 clip-blade-right bg-[#881337]/90 hover:bg-[#be123c] border-l-2 border-[#fda4af] font-hud text-[10px] font-bold tracking-[0.14em] uppercase text-[#ffe4e6] transition-all cursor-pointer"
                  title="Challenge the September Layoff Boss [Key B]"
                >
                  {telemetry.bossAwakened ? 'Boss Active [B]' : 'Layoff Boss [B]'}
                </button>
              )}
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
            className="pl-3 font-hud text-[11px] tracking-[0.18em] uppercase text-[#94a3b8] hover:text-[#d4af37] text-left cursor-pointer"
          >
            + SHOW NAVIGATOR (PROJECTS · JEWELS · WEAPONS) [TAB]
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
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none hidden sm:flex flex-col items-center">
        {/* Frameless Horizon Compass Ribbon */}
        <div className="relative w-80 h-6 overflow-hidden flex items-center border-b border-[#d4af37]/30">
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
          <div className="mt-3 flex flex-col items-center animate-fade-in">
            <span className="font-mythic italic text-lg text-[#d4af37] tracking-wide drop-shadow">
              {regionBannerText.split('·')[0].trim()}
            </span>
            <div className="h-px w-36 bg-gradient-to-r from-transparent via-[#d4af37]/70 to-transparent mt-0.5" />
          </div>
        )}

        {/* Transient Combat / Paraglider Callout */}
        {telemetry.combatCallout && (
          <div className="mt-2 px-4 py-0.5 bg-gradient-to-r from-transparent via-[#090e1a]/90 to-transparent border-y border-[#d4af37]/50 font-hud text-xs font-bold tracking-[0.2em] uppercase text-[#fef08a]">
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
          </div>
        )}
      </div>

      {/* 3. TOP-RIGHT SYSTEM GLYPHS, COLOR-CODED RADAR & KINETIC COMBO STYLE RANK */}
      <div className="absolute top-4 right-6 flex flex-col items-end gap-2.5 pointer-events-auto">
        <div className="flex items-center gap-2 bg-[#060a12]/80 border-b border-[#d4af37]/35 px-2.5 py-1 backdrop-blur-md">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              cycleTimeOfDay();
            }}
            title={`Atmosphere: ${timeOfDay} (Click to cycle)`}
            className="px-2 h-6 font-hud text-xs font-bold tracking-[0.16em] uppercase text-[#d4af37] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rotate-45 bg-[#d4af37]" />
            <span>{timeOfDay === 'twilight' ? 'Dusk' : timeOfDay}</span>
          </button>

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
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-2">
          {telemetry.nearStop && (
            <button
              type="button"
              onClick={() => onInspectStop(telemetry.nearStop!.id)}
              className="flex items-center gap-3 px-5 py-2 clip-blade-right bg-[#070b14]/95 border-l-2 border-[#d4af37] hover:bg-[#101829] text-left shadow-2xl transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span className="px-2 py-0.5 bg-[#d4af37] text-[#05070b] font-hud font-bold text-xs tracking-wider uppercase">
                [E] INSPECT PROJECT CODEX
              </span>
              <span className="font-mythic italic text-base text-[#f8f5ee]">
                {telemetry.nearStop.title}
              </span>
            </button>
          )}
          {telemetry.nearWeaponForge && (
            <button
              type="button"
              onClick={() => onEquipWeapon?.(telemetry.nearWeaponForge!.id)}
              className="flex items-center gap-3 px-5 py-1.5 clip-blade-right bg-[#091524]/95 border-l-2 border-[#38bdf8] hover:bg-[#12253d] text-left shadow-2xl transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span className="px-2 py-0.5 bg-[#38bdf8] text-[#05070b] font-hud font-bold text-xs tracking-wider uppercase">
                [E] EQUIP DIVINE WEAPON
              </span>
              <span className="font-hud text-sm font-bold text-[#e0f2fe]">
                {telemetry.nearWeaponForge.name} (+{telemetry.nearWeaponForge.baseDamageBonus} ATK)
              </span>
            </button>
          )}
        </div>
      )}

      {/* 5. BOTTOM-LEFT AAA HERO VITALS, SUDARSHANA MEDALLION & EQUIPPED WEAPON BAR */}
      {gameState === 'playing' && (
        <div className="fixed bottom-5 left-6 z-20 flex items-end gap-3 pointer-events-auto">
          {/* Sacred 6-Petal Sudarshana Chakra SVG Medallion */}
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0 pointer-events-none">
            <svg width="56" height="56" viewBox="0 0 64 64" className="w-full h-full">
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
              <span className="font-hud text-xs font-bold text-[#fef08a] leading-none">{attackDmg}</span>
              <span className="font-mono text-[7px] text-[#d4af37] uppercase">ATK</span>
            </div>
          </div>

          {/* Tapered Prana & Stamina Blade Bars + Quick Weapon Switcher [1-4] */}
          <div className="flex flex-col gap-1.5 pb-0.5">
            <div className="flex items-center justify-between gap-4 font-hud text-[11px] tracking-[0.16em] uppercase pointer-events-none">
              <span className="text-[#f8f5ee] font-bold">
                PRANA{' '}
                <span className="text-[#fda4af] tabular-nums">
                  {pranaValue}/{pranaMax}
                </span>
              </span>
              <span className="text-[#38bdf8] font-bold">
                ⚔ {telemetry.equippedWeaponName || 'Nandaka Sovereign Katana'}
              </span>
            </div>

            {/* Double-Layer Health Blade Bar with Delayed White-Gold Trail */}
            <div
              data-testid="player-hp-bar"
              className="relative w-56 sm:w-68 h-2.5 clip-blade-right bg-[#1a070e]/90 border-l-2 border-[#d4af37] overflow-hidden pointer-events-none"
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
            <div className="w-44 sm:w-52 h-1.5 clip-blade-right bg-[#061c1b]/90 border-l-2 border-[#2dd4bf] overflow-hidden pointer-events-none">
              <div
                className="h-full bg-gradient-to-r from-[#0d9488] to-[#2dd4bf] transition-all duration-100"
                style={{ width: `${staminaPct}%` }}
              />
            </div>

            {/* 4-Weapon Armory Hotbar [Keys 1 - 4] */}
            <div className="flex items-center gap-1 pt-0.5">
              {FORGE_WEAPONS.map((w, idx) => {
                const active = equippedWeaponId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onEquipWeapon?.(w.id);
                    }}
                    className={`px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider cursor-pointer transition-all border ${
                      active
                        ? 'bg-[#d4af37] text-[#05070b] border-[#fef08a] font-bold'
                        : 'bg-[#070b14]/85 text-[#94a3b8] border-[#d4af37]/30 hover:text-white'
                    }`}
                    title={`Press [${idx + 1}] to equip ${w.name} (${w.category})`}
                  >
                    [{idx + 1}] {w.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. BOTTOM-RIGHT TACTICAL COMBAT STANCE & SKILL CLUSTER */}
      {gameState === 'playing' && (
        <div className="fixed bottom-5 right-6 z-20 hidden md:flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerAttack(false);
            }}
            className="group flex items-center gap-1.5 px-3 py-1.5 clip-blade-right bg-[#080d18]/88 hover:bg-[#162038] border-l-2 border-[#d4af37] font-hud text-xs font-bold tracking-[0.14em] uppercase text-[#f8f5ee] cursor-pointer transition-all"
            title="Weapon 3-Hit Combo [Left-Click or F]"
          >
            <span className="text-[#d4af37]">LMB</span>
            <span>Slash</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerParry();
            }}
            className="group flex items-center gap-1.5 px-3 py-1.5 clip-blade-right bg-[#080d18]/88 hover:bg-[#162038] border-l-2 border-[#fef08a] font-hud text-xs font-bold tracking-[0.14em] uppercase text-[#fef08a] cursor-pointer transition-all"
            title="Sekiro Deflect [Right-Click or V]"
          >
            <span className="text-[#d4af37]">RMB</span>
            <span>Deflect</span>
          </button>

          {onTriggerDash && (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onTriggerDash();
              }}
              className="group flex items-center gap-1.5 px-3 py-1.5 clip-blade-right bg-[#080d18]/88 hover:bg-[#162038] border-l-2 border-[#38bdf8] font-hud text-xs font-bold tracking-[0.14em] uppercase text-[#bae6fd] cursor-pointer transition-all"
              title="Shinobi Shadow-Step Dash with i-frames [Shift or X]"
            >
              <span className="text-[#38bdf8]">SHIFT</span>
              <span>Dash</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerGrapple();
            }}
            className="group flex items-center gap-1.5 px-3 py-1.5 clip-blade-right bg-[#080d18]/88 hover:bg-[#162038] border-l-2 border-[#2dd4bf] font-hud text-xs font-bold tracking-[0.14em] uppercase text-[#ccfbf1] cursor-pointer transition-all"
            title="Grapple Hook [Key G]"
          >
            <span className="text-[#2dd4bf]">G</span>
            <span>Grapple</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerAttack(true);
            }}
            className="group flex items-center gap-1.5 px-3 py-1.5 clip-blade-right bg-[#1f0812]/90 hover:bg-[#380e20] border-l-2 border-[#f43f5e] font-hud text-xs font-bold tracking-[0.14em] uppercase text-[#fecdd3] cursor-pointer transition-all"
            title="Surya Whirlwind Nova [Key Q]"
          >
            <span className="text-[#f43f5e]">Q</span>
            <span>Nova</span>
          </button>
        </div>
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

      {/* Victory / September Layoff Vanquished Modal Card */}
      {gameState === 'gameover' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mastery-modal-title"
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#04060b]/90 backdrop-blur-md pointer-events-auto"
        >
          <div className="w-full max-w-md bg-[#070b14] border border-[#d4af37] p-6 text-[#f4efe6] space-y-4 shadow-2xl">
            <div>
              <div className="text-xs font-hud font-bold text-[#2dd4bf] uppercase tracking-[0.24em]">
                PORTFOLIO VERSE · SEPTEMBER LAYOFF VANQUISHED
              </div>
              <h2 id="mastery-modal-title" className="font-display text-2xl font-bold text-[#f8f5ee] mt-1">
                Resilience Forged Through 6 Shipped Products
              </h2>
              <p className="text-xs text-[#cbd5e1] mt-1.5 leading-relaxed">
                A sudden workforce reduction in September ended Ayush Dubey’s chapter at Cheggout,
                but his 0→1 craft and $3M ARR impact endure across Portfolio Verse.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-hud text-xs uppercase tracking-wider">
              <a
                href={CREATOR_PROFILE.calUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 clip-blade-right bg-[#d4af37] hover:bg-[#fde68a] text-[#05070b] font-bold text-center cursor-pointer"
              >
                Book Call with Ayush
              </a>
              <a
                href={CREATOR_PROFILE.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 border border-[#d4af37] bg-[#0c1322] hover:bg-[#172338] text-[#f8f5ee] font-bold text-center cursor-pointer"
              >
                Resume (PDF)
              </a>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#d4af37]/20 font-hud text-xs uppercase tracking-wider">
              <button
                type="button"
                onClick={onReturnToTitle}
                className="px-3.5 py-1.5 border border-[#d4af37]/35 bg-[#0c1322] text-[#cbd5e1] cursor-pointer"
              >
                Title Screen
              </button>
              <button
                type="button"
                onClick={onResumeFromMastery}
                className="px-4 py-1.5 clip-blade-right bg-[#0d9488] hover:bg-[#14b8a6] text-[#f8f5ee] font-bold cursor-pointer"
              >
                Continue Exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
