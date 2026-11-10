import React, { useEffect, useRef, useState } from 'react';
import {
  CREATOR_PROFILE,
  PORTFOLIO_STOPS,
  UNFINISHED_SANCTUMS,
  STORY_CHAPTERS,
  INITIAL_DEMON_SPAWNS,
  PortfolioStop,
  UnfinishedSanctum,
  LOTUS_RELICS,
  FORGE_WEAPONS,
  WeaponId,
  ForgeWeapon,
} from '../data/portfolioStops';
import { TimeOfDay } from '../game/proceduralScene';
import { WeatherPresetId } from '../game/weatherSystem';
import { computeCompletionStats } from '../game/worldLogic';
import { MobileRpgControlPad } from './MobileRpgPad';
import { ProceduralWeatherSystem } from './ProceduralWeatherSystem';

const SHORT_STOP_LABELS: Record<string, string> = {
  'mandapa-origin': '01 · CFO AI Workspace',
  'jantar-observatory': '02 · NexaTech Bridge',
  'oasis-pavilion': '03 · Oasis Arcade',
  'ashoka-stambha': '04 · Payments Co-Pilot',
  'gopuram-sanctum': '05 · Vendor Portal',
  'chand-stepwell': '06 · Invoice Co-Pilot',
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
  nearUnfinishedSanctum?: UnfinishedSanctum | null;
  nearWeaponForge?: ForgeWeapon | null;
  nearRecruiterTemple?: boolean;
  nearHypoGuide?: boolean;
  nearBossChallengeCircle?: boolean;
  equippedWeaponId?: WeaponId;
  equippedWeaponName?: string;
  trackedTarget?: {
    id: string;
    kind: 'project' | 'jewel' | 'weapon' | 'wip';
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
    subtitle?: string;
    stopId: string;
    indexNumber?: string;
    accentColor?: string;
    isOffScreen?: boolean;
    bearingDeg?: number;
    relativeBearingDeg?: number;
    cardinalLabel?: string;
    turnDirection?: 'ahead' | 'left' | 'right' | 'behind';
    turnInstruction?: string;
  } | null;
  nextGuidanceSanctum?: {
    stopId?: string;
    indexNumber?: string;
    title: string;
    distance: number;
    accentColor?: string;
    bearingDeg?: number;
    relativeBearingDeg?: number;
    cardinalLabel?: string;
    turnDirection?: 'ahead' | 'left' | 'right' | 'behind';
    turnInstruction?: string;
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
  onSelectGuidanceTarget?: (id: string, kind: 'project' | 'jewel' | 'weapon' | 'wip') => void;
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
  onOpenRecruiterTemple?: () => void;
  onOpenHypoGuide?: () => void;
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
  onOpenRecruiterTemple,
  onOpenHypoGuide,
}) => {
  // Collapsed by default so the 3D world and active destination guidance have breathing room
  const [sanctumBarExpanded, setSanctumBarExpanded] = useState(false);
  const [navCategory, setNavCategory] = useState<'projects' | 'jewels' | 'weapons' | 'saga'>(
    'projects'
  );
  const [summaryScrollOpen, setSummaryScrollOpen] = useState(false);
  const [minimapVisible, setMinimapVisible] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight >= 460 : true
  );
  // Only show the mobile virtual thumbstick & 7-button skill wheel by default on touch/compact screens
  const [controlPadVisible, setControlPadVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isTouch =
      window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 900;
    return isTouch;
  });

  // Resolve next unvisited stop in order (01 -> 06)
  const nextUnvisitedStop =
    PORTFOLIO_STOPS.find((s) => !visitedStopIds.has(s.id)) || null;

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

  // Subtle Region Discovery Callout
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
      }, 2400);
      return () => window.clearTimeout(timer);
    }
  }, [telemetry.regionName]);

  // Fast-travel helper for the current recommended objective
  const handleFastTravelToNextObjective = () => {
    if (nextUnvisitedStop) {
      onSelectGuidanceTarget?.(nextUnvisitedStop.id, 'project');
      if (telemetry.nearStop?.id === nextUnvisitedStop.id) {
        onInspectStop(nextUnvisitedStop.id);
        return;
      }
      onTeleportToPoint?.(
        nextUnvisitedStop.position.x,
        nextUnvisitedStop.position.z + 5.2,
        `Sanctum ${nextUnvisitedStop.indexNumber} · ${nextUnvisitedStop.title}`
      );
      return;
    }
    if (!telemetry.bossDefeated) {
      onTeleportToPoint?.(0, -41.5, 'Northern Boss Challenge Circle');
      return;
    }
    onOpenRecruiterTemple?.();
  };

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
        setSanctumBarExpanded((prev) => {
          const nextOpen = !prev || navCategory !== 'saga';
          setNavCategory('saga');
          return nextOpen;
        });
      } else if (e.code === 'KeyT' && gameState === 'playing' && !activeStopId) {
        e.preventDefault();
        handleFastTravelToNextObjective();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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
  const equippedWeapon =
    FORGE_WEAPONS.find((w) => w.id === equippedWeaponId) || FORGE_WEAPONS[0];
  const hurtFlash = telemetry.playerHurtFlash ?? 0;

  const cycleTimeOfDay = () => {
    const order: TimeOfDay[] = ['dawn', 'noon', 'twilight'];
    const next = order[(order.indexOf(timeOfDay) + 1) % order.length];
    onChangeTimeOfDay(next);
  };

  const wp = telemetry.waypointScreen ?? null;
  const nextGuidance = telemetry.nextGuidanceSanctum ?? null;
  const activeStepNumber = Math.min(PORTFOLIO_STOPS.length, visitedStopIds.size + 1);

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

      {/* 0. SUBTLE CENTER RETICLE */}
      {gameState === 'playing' && !activeStopId && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-55">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r={musicMood === 'combat' ? '3' : '1.5'}
              fill={musicMood === 'combat' ? '#f43f5e' : '#fef08a'}
            />
            <path
              d="M12 5V8M12 16V19M5 12H8M16 12H19"
              stroke={telemetry.grappleTargetTitle ? '#2dd4bf' : '#d4af37'}
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />
          </svg>
        </div>
      )}

      {/* 0A. IN-WORLD 3D FLOATING DIAMOND RETICLE & OFF-SCREEN EDGE CHEVRON */}
      {gameState === 'playing' && !activeStopId && wp && !telemetry.bossAwakened && (
        <>
          {!wp.isOffScreen && wp.distance > 4 ? (
            <button
              type="button"
              data-testid="inworld-waypoint-beacon"
              onClick={() => {
                if (wp.stopId === 'boss-circle') {
                  onTeleportToPoint?.(0, -41.5, 'Northern Boss Challenge Circle');
                } else {
                  const wip = UNFINISHED_SANCTUMS.find((u) => u.id === wp.stopId);
                  if (wip) {
                    onTeleportToPoint?.(
                      wip.position.x,
                      wip.position.z + 6.8,
                      `${wip.title} (Under Construction)`
                    );
                    return;
                  }
                  const stop = PORTFOLIO_STOPS.find((s) => s.id === wp.stopId);
                  if (stop) {
                    onTeleportToPoint?.(
                      stop.position.x,
                      stop.position.z + 5.2,
                      `Sanctum ${stop.indexNumber} · ${stop.title}`
                    );
                  }
                }
              }}
              className="absolute -translate-x-1/2 -translate-y-full pointer-events-auto z-10 flex flex-col items-center group cursor-pointer transition-transform duration-150 hover:scale-110"
              style={{ left: `${wp.xPct}%`, top: `${wp.yPct}%` }}
              title={`${wp.title} (${wp.distance}m) — Click to Fast Travel`}
            >
              {/* Compact AAA Diamond Target Reticle (never blocks 3D architecture) */}
              <div className="relative flex items-center justify-center w-7 h-7">
                <div
                  className="w-5 h-5 rotate-45 bg-[#050811]/90 border-2 shadow-[0_0_14px_rgba(254,240,138,0.65)] transition-transform group-hover:scale-110"
                  style={{ borderColor: wp.accentColor || '#fef08a' }}
                />
                <span className="absolute font-mono text-[9px] font-extrabold text-[#fef08a]">
                  {wp.indexNumber || '◆'}
                </span>
              </div>
              <span className="mt-0.5 px-1.5 py-0.2 bg-[#04070e]/75 font-mono text-[9px] font-bold text-[#fef08a] tabular-nums tracking-wider hud-text-shadow">
                {wp.distance}m
              </span>
            </button>
          ) : wp.isOffScreen ? (
            <button
              type="button"
              data-testid="offscreen-waypoint-indicator"
              onClick={handleFastTravelToNextObjective}
              className={`fixed top-1/2 -translate-y-1/2 z-20 pointer-events-auto px-2.5 py-1.5 bg-[#050811]/85 border border-[#d4af37]/60 flex items-center gap-2 cursor-pointer hover:border-[#fef08a] transition-colors ${
                (wp.relativeBearingDeg ?? 0) < 0 ? 'left-4' : 'right-4'
              }`}
              title={`${wp.title} (${wp.distance}m) — Click or press [T] to Fast Travel`}
            >
              {(wp.relativeBearingDeg ?? 0) < 0 && (
                <span className="font-mono text-xs font-bold text-[#fef08a]">◄</span>
              )}
              <div className="w-4 h-4 rotate-45 bg-[#d4af37] text-[#05070b] flex items-center justify-center shrink-0">
                <span className="-rotate-45 font-mono text-[8px] font-extrabold">
                  {wp.indexNumber || '◆'}
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold text-[#fef08a] tabular-nums">
                {wp.distance}m
              </span>
              {(wp.relativeBearingDeg ?? 0) >= 0 && (
                <span className="font-mono text-xs font-bold text-[#fef08a]">►</span>
              )}
            </button>
          ) : null}
        </>
      )}

      {/* 0B. ENGAGED ENEMY 3D AFFORDANCE BARS & BOSS SEAL HOLOGRAM */}
      {gameState === 'playing' &&
        !activeStopId &&
        telemetry.affordanceMarkers &&
        telemetry.affordanceMarkers.map((m) => {
          if (m.kind === 'enemy') {
            const hpPct = Math.max(
              0,
              Math.min(100, Math.round(((m.hp ?? 0) / (m.maxHp ?? 1)) * 100))
            );
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
                  <div className="mb-0.5 px-1.5 py-0.5 bg-[#e11d48] text-white font-hud text-[9px] font-bold tracking-[0.18em] uppercase shadow-lg">
                    危 PERILOUS {m.aiState === 'strike' ? 'STRIKE!' : 'DEFLECT [RMB]!'}
                  </div>
                )}
                <div className="w-28 bg-[#05070d]/85 p-1 border-b border-[#f43f5e]/50">
                  <div className="flex items-center justify-between gap-1 text-[8px] font-hud font-bold uppercase">
                    <span className="text-[#fda4af] truncate">{m.title}</span>
                    <span className="font-mono text-[#fef08a] tabular-nums">{m.hp}</span>
                  </div>
                  <div className="h-1 w-full bg-black/80 mt-0.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#be123c] to-[#fb7185] transition-all duration-100"
                      style={{ width: `${hpPct}%` }}
                    />
                  </div>
                  <div className="h-0.5 w-full bg-black/80 mt-0.5 overflow-hidden">
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
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex items-center gap-2 px-3 py-1 bg-[#050811]/85 border-b border-[#38bdf8]/50"
                style={{ left: '50%', top: '96px' }}
              >
                <span className="font-mono text-[9px] font-bold tracking-[0.14em] uppercase text-[#38bdf8]">
                  {m.subtitle}
                </span>
                <span className="text-[#38bdf8]/40">·</span>
                <span className="font-hud text-[10px] font-bold text-[#fef08a] tracking-wide">
                  {m.title}
                </span>
              </div>
            );
          }

          return null;
        })}

      {/* 0C. FLOATING SCREEN-SPACE COMBAT DAMAGE, DODGE & SEKIRO DEFLECT POPUPS */}
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

      {/* 1. TOP-LEFT: FEATHER-LIGHT DIEGETIC CONSOLE PROMPTS (Zero heavy box!) */}
      <div className="absolute top-4 left-4 lg:top-5 lg:left-6 flex flex-col gap-2 pointer-events-auto z-30">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-gradient-to-r from-[#04070e]/85 via-[#04070e]/55 to-transparent border-l-2 border-[#d4af37]">
          <button
            type="button"
            data-testid="toggle-sanctum-drawer-btn"
            onClick={() => setSanctumBarExpanded((prev) => !prev)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span className="px-1.5 py-0.5 bg-[#d4af37]/20 border border-[#d4af37]/60 font-mono text-[9px] font-bold text-[#fef08a] group-hover:bg-[#d4af37] group-hover:text-[#05070b] transition-colors">
              Tab
            </span>
            <span className="font-hud text-xs font-bold uppercase tracking-[0.14em] text-[#f8f5ee] group-hover:text-[#fef08a] transition-colors hud-text-shadow">
              {sanctumBarExpanded ? 'Close Codex' : `Codex & Map (${stats.visitedStopsCount}/6)`}
            </span>
          </button>

          <span aria-hidden="true" className="text-white/25">
            ·
          </span>

          <button
            type="button"
            data-testid="open-hypo-guide-btn"
            onClick={() => onOpenHypoGuide?.()}
            className="font-hud text-[11px] font-semibold uppercase tracking-wider text-[#2dd4bf] hover:text-white transition-colors cursor-pointer hud-text-shadow"
            title="Ask Hypo AI Portfolio Companion [Key G]"
          >
            Hypo AI
          </button>

          <span aria-hidden="true" className="text-white/25">
            ·
          </span>

          <button
            type="button"
            data-testid="open-summary-scroll-btn"
            onClick={() => setSummaryScrollOpen(true)}
            className="font-hud text-[11px] font-semibold uppercase tracking-wider text-[#cbd5e1] hover:text-white transition-colors cursor-pointer hud-text-shadow"
          >
            Checklist
          </button>

          <span aria-hidden="true" className="text-white/25">
            ·
          </span>

          <button
            type="button"
            data-testid="open-recruiter-temple-btn"
            onClick={() => onOpenRecruiterTemple?.()}
            className="font-hud text-[11px] font-semibold uppercase tracking-wider text-[#fef08a] hover:text-white transition-colors cursor-pointer hud-text-shadow"
          >
            Contact
          </button>
        </div>

        {/* Expandable Sanctums, Jewels, Weapons & Chronicle Drawer */}
        {sanctumBarExpanded && (
          <div
            data-testid="sanctum-navigator-drawer"
            className="glass-panel p-3.5 space-y-3 w-[356px] sm:w-[376px]"
          >
            {/* Segmented Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#040811] border border-white/10">
              {(
                [
                  { id: 'projects', label: `Sanctums ${stats.visitedStopsCount}/6` },
                  { id: 'jewels', label: `Jewels ${stats.collectedRelicsCount}/5` },
                  { id: 'weapons', label: 'Blades (4)' },
                  { id: 'saga', label: 'Chronicle' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setNavCategory(tab.id)}
                  className={`py-1.5 px-1 font-hud text-[9px] font-bold uppercase tracking-wide cursor-pointer transition-colors whitespace-nowrap text-center ${
                    navCategory === tab.id
                      ? 'bg-[#d4af37] text-[#05070b]'
                      : 'text-[#cbd5e1] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: 6 Project Sanctums with Step Order, Status & Instant Travel */}
            {navCategory === 'projects' && (
              <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
                <div className="font-sans text-[11px] text-[#94a3b8] pb-1">
                  Visit all 6 Project Sanctums in order. Click <strong className="text-white">Guide</strong> to set the golden arrow path or <strong className="text-white">Open</strong> to teleport directly.
                </div>
                {PORTFOLIO_STOPS.map((stop) => {
                  const visited = visitedStopIds.has(stop.id);
                  const isNextRecommended = nextUnvisitedStop?.id === stop.id;
                  const dist = Math.round(
                    Math.hypot(stop.position.x - telemetry.x, stop.position.z - telemetry.z)
                  );
                  return (
                    <div
                      key={stop.id}
                      className={`p-2.5 border transition-colors flex items-center justify-between gap-2 ${
                        isNextRecommended
                          ? 'bg-[#111d33] border-[#d4af37]'
                          : visited
                          ? 'bg-[#071519] border-[#2dd4bf]/35'
                          : 'bg-[#080f1d] border-white/10'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider">
                          <span
                            className={
                              visited
                                ? 'text-[#2dd4bf]'
                                : isNextRecommended
                                ? 'text-[#fef08a] font-bold'
                                : 'text-[#94a3b8]'
                            }
                          >
                            {visited
                              ? '✓ VISITED'
                              : isNextRecommended
                              ? '★ NEXT UP'
                              : `SANCTUM ${stop.indexNumber}`}
                          </span>
                          <span aria-hidden="true" className="text-white/30">
                            ·
                          </span>
                          <span className="text-[#94a3b8] tabular-nums">{dist}m away</span>
                        </div>
                        <div className="font-sans text-xs font-semibold text-white truncate mt-0.5">
                          {SHORT_STOP_LABELS[stop.id]}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectGuidanceTarget?.(stop.id, 'project');
                            setSanctumBarExpanded(false);
                          }}
                          className="px-2 py-1 bg-[#0d1b30] hover:bg-[#172e4f] border border-[#d4af37]/40 text-[#fef08a] font-hud text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Guide
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectGuidanceTarget?.(stop.id, 'project');
                            onTeleportToStop(stop.id);
                            setSanctumBarExpanded(false);
                          }}
                          className="px-2.5 py-1 bg-[#d4af37] hover:bg-[#fef08a] text-[#05070b] font-hud text-[9px] font-extrabold uppercase tracking-wider cursor-pointer"
                        >
                          Open →
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Under-Construction / Unfinished Sanctums (Sealed — Workers Building) */}
                <div className="pt-2 mt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.14em] text-[#f59e0b] pb-1.5">
                    <span>🚧 Under Construction (Sealed · WIP)</span>
                    <span>Sthapati Workers Active</span>
                  </div>
                  <div className="space-y-2">
                    {UNFINISHED_SANCTUMS.map((wip) => {
                      const dist = Math.round(
                        Math.hypot(wip.position.x - telemetry.x, wip.position.z - telemetry.z)
                      );
                      return (
                        <div
                          key={wip.id}
                          data-testid={`codex-wip-${wip.id}`}
                          className="p-2.5 bg-[#120d08]/95 border border-[#f59e0b]/40 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-mono text-[8px] font-bold uppercase tracking-wider text-[#fbbf24]">
                                🔒 SEALED SANCTUM · {wip.category} · {dist}m
                              </div>
                              <div className="font-sans text-xs font-bold text-white truncate">
                                {wip.title}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectGuidanceTarget?.(wip.id, 'wip');
                                  setSanctumBarExpanded(false);
                                }}
                                className="px-2 py-1 bg-[#0d1b30] hover:bg-[#172e4f] border border-[#f59e0b]/45 text-[#fef08a] font-hud text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Guide
                              </button>
                              <button
                                type="button"
                                data-testid={`visit-wip-${wip.id}`}
                                onClick={() => {
                                  onSelectGuidanceTarget?.(wip.id, 'wip');
                                  onTeleportToPoint?.(
                                    wip.position.x,
                                    wip.position.z + 6.8,
                                    `${wip.title} (Under Construction)`
                                  );
                                  setSanctumBarExpanded(false);
                                }}
                                className="px-2 py-1 bg-[#f59e0b]/25 hover:bg-[#f59e0b] border border-[#f59e0b]/70 text-[#fef08a] hover:text-[#05070b] font-hud text-[9px] font-extrabold uppercase tracking-wider cursor-pointer transition-colors"
                              >
                                Visit Site →
                              </button>
                            </div>
                          </div>

                          <ul className="space-y-0.5 pl-1">
                            {wip.revealedPoints.map((pt, idx) => (
                              <li
                                key={pt}
                                className="font-sans text-[10px] text-[#fde68a] flex items-start gap-1.5"
                              >
                                <span className="font-mono text-[9px] text-[#f59e0b] font-bold shrink-0">
                                  {idx + 1})
                                </span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: 5 Career Experience Lotus Jewels */}
            {navCategory === 'jewels' && (
              <div className="space-y-1.5 max-h-[52vh] overflow-y-auto pr-1">
                <div className="font-sans text-[11px] text-[#94a3b8] pb-1">
                  Collect the 5 Career Lotus Jewels across the valley to uncover Ayush’s work history.
                </div>
                {LOTUS_RELICS.map((relic) => {
                  const collected = collectedRelicIds.has(relic.id);
                  const dist = Math.round(
                    Math.hypot(relic.position.x - telemetry.x, relic.position.z - telemetry.z)
                  );
                  return (
                    <div
                      key={relic.id}
                      className={`p-2.5 border flex items-center justify-between gap-2 ${
                        collected
                          ? 'bg-[#140b20] border-[#c084fc]/45'
                          : 'bg-[#080f1d] border-white/10'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[9px] text-[#c084fc] uppercase">
                          {collected ? '✓ COLLECTED' : `${relic.era} · ${dist}m`}
                        </div>
                        <div className="font-sans text-xs font-semibold text-white truncate">
                          {relic.company}
                        </div>
                        <div className="font-sans text-[10px] text-[#94a3b8] truncate">
                          {relic.name}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectGuidanceTarget?.(relic.id, 'jewel');
                          onTeleportToPoint?.(
                            relic.position.x,
                            relic.position.z + 1.8,
                            relic.company
                          );
                          setSanctumBarExpanded(false);
                        }}
                        className="px-2.5 py-1 bg-[#c084fc] hover:bg-[#e879f9] text-[#05070b] font-hud text-[9px] font-bold uppercase tracking-wider cursor-pointer shrink-0"
                      >
                        Travel →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 3: 4 Divine Weapons */}
            {navCategory === 'weapons' && (
              <div className="space-y-1.5 max-h-[52vh] overflow-y-auto pr-1">
                <div className="font-sans text-[11px] text-[#94a3b8] pb-1">
                  Press <strong className="text-white">Keys 1–4</strong> anytime to switch blades.
                </div>
                {FORGE_WEAPONS.map((w, idx) => {
                  const active = equippedWeaponId === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => onEquipWeapon?.(w.id)}
                      className={`w-full p-2.5 text-left border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        active
                          ? 'bg-[#10243b] border-[#38bdf8] text-white'
                          : 'bg-[#080f1d] border-white/10 hover:border-white/25 text-[#cbd5e1]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-[9px] text-[#38bdf8] uppercase">
                          KEY [{idx + 1}] · +{w.baseDamageBonus} ATK
                        </div>
                        <div className="font-sans text-xs font-semibold truncate">{w.name}</div>
                      </div>
                      <span className="font-hud text-[9px] font-bold uppercase text-[#fef08a] shrink-0">
                        {active ? 'Equipped' : 'Equip'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab 4: 5-Act Career Chronicle */}
            {navCategory === 'saga' && (
              <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
                {STORY_CHAPTERS.map((chap) => (
                  <div key={chap.act} className="p-2.5 bg-[#080f1d] border border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#d4af37]">
                      <span>{chap.act}</span>
                      <span className="text-[#94a3b8]">{chap.era}</span>
                    </div>
                    <div className="font-mythic text-xs text-white">{chap.title}</div>
                    <p className="font-sans text-[11px] text-[#cbd5e1] leading-relaxed">
                      {chap.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. TOP-CENTER: FRAMELESS HORIZON COMPASS & GUIDING WIND WHISPER (Elden Ring / Ghost of Tsushima style) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center z-20 w-full max-w-[540px] px-4">
        {/* Minimalist Feathered Horizon Compass */}
        <div className="relative w-64 sm:w-72 h-5 overflow-hidden flex items-center justify-center compass-fade-mask bg-[#04070e]/65 border-b border-[#d4af37]/35">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#fef08a] rotate-45 z-10" />

          {COMPASS_CARDINALS.map((c) => {
            const diff = ((c.deg - telemetry.headingDeg + 540) % 360) - 180;
            if (Math.abs(diff) > 90) return null;
            const pct = 50 + (diff / 90) * 46;
            return (
              <div
                key={c.label}
                className="absolute top-0.5 flex flex-col items-center -translate-x-1/2"
                style={{ left: `${pct}%` }}
              >
                <span
                  className={`font-hud text-[9px] tracking-[0.18em] font-bold hud-text-shadow ${
                    c.label === 'N' ? 'text-[#fef08a]' : 'text-white/75'
                  }`}
                >
                  {c.label}
                </span>
              </div>
            );
          })}

          {/* Active Destination Diamond on the Horizon Line */}
          {wp && wp.relativeBearingDeg !== undefined && Math.abs(wp.relativeBearingDeg) <= 95 && (
            <div
              className="absolute bottom-0.5 -translate-x-1/2 z-20 flex items-center gap-0.5 text-[#fef08a] font-mono text-[8px] font-bold hud-text-shadow"
              style={{
                left: `${50 + (wp.relativeBearingDeg / 90) * 44}%`,
              }}
            >
              <span>◆</span>
            </div>
          )}
        </div>

        {/* FRAMELESS GUIDING WIND OBJECTIVE WHISPER (Zero boxy chrome!) */}
        {gameState === 'playing' && !activeStopId && !telemetry.bossAwakened && (
          <div
            data-testid="active-destination-banner"
            className="mt-0.5 px-6 py-1.5 pointer-events-auto flex items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_center,rgba(4,7,14,0.9)_0%,rgba(4,7,14,0.55)_62%,rgba(4,7,14,0)_100%)]"
          >
            {nextUnvisitedStop ? (
              <>
                {/* Rotating Golden Wind Needle */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                  style={{
                    transform: `rotate(${nextGuidance?.relativeBearingDeg ?? 0}deg)`,
                    transition: 'transform 120ms linear',
                  }}
                >
                  <path
                    d="M12 2L18.5 20L12 15.5L5.5 20L12 2Z"
                    fill="#fef08a"
                    stroke="#05070b"
                    strokeWidth="1.5"
                  />
                </svg>

                <div className="text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5 font-mono text-[9px] tracking-[0.14em] text-[#fef08a] uppercase tabular-nums hud-text-shadow">
                    <span>STEP {activeStepNumber}/6</span>
                    <span aria-hidden="true" className="text-white/40">
                      ·
                    </span>
                    <span className="text-[#2dd4bf] font-semibold">
                      {telemetry.nearStop?.id === nextUnvisitedStop.id
                        ? 'ARRIVED'
                        : `${nextGuidance?.turnInstruction || 'Follow Path'} [${
                            nextGuidance?.cardinalLabel || 'N'
                          }]`}
                    </span>
                    <span aria-hidden="true" className="text-white/40">
                      ·
                    </span>
                    <span className="text-white">{nextGuidance?.distance ?? 26}m</span>
                  </div>
                  <div className="font-mythic text-xs sm:text-sm font-bold tracking-wider text-white hud-text-shadow">
                    Next Sanctum: {SHORT_STOP_LABELS[nextUnvisitedStop.id]}
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="fast-travel-next-btn"
                  onClick={handleFastTravelToNextObjective}
                  className="px-2 py-0.5 bg-[#08101f]/90 hover:bg-[#d4af37] text-[#fef08a] hover:text-[#05070b] border border-[#d4af37]/60 font-mono text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap"
                  title={
                    telemetry.nearStop?.id === nextUnvisitedStop.id
                      ? 'Open this Sanctum case study [Key E]'
                      : 'Teleport to the next sanctum entrance [Key T]'
                  }
                >
                  {telemetry.nearStop?.id === nextUnvisitedStop.id ? '[E] Open' : '[T] Travel'}
                </button>
              </>
            ) : !telemetry.bossDefeated ? (
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#fda4af] hud-text-shadow">
                    ALL 6 SANCTUMS AWAKENED · NORTHERN CITADEL
                  </div>
                  <div className="font-mythic text-xs font-bold text-white hud-text-shadow">
                    Challenge The September Layoff Boss
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSummonLayoffBoss()}
                  className="px-2.5 py-0.5 bg-[#e11d48]/90 hover:bg-[#f43f5e] text-white font-mono text-[9px] font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap"
                >
                  [B] Challenge
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#2dd4bf] hud-text-shadow">
                    PORTFOLIO VERSE MASTERED · 6/6 SANCTUMS
                  </div>
                  <div className="font-mythic text-xs font-bold text-white hud-text-shadow">
                    Temple of Opportunities Unlocked
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenRecruiterTemple?.()}
                  className="px-2.5 py-0.5 bg-[#d4af37] text-[#05070b] font-mono text-[9px] font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap"
                >
                  Open →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Transient Region Discovery / Combat Callout Whisper */}
        {!telemetry.nearUnfinishedSanctum &&
          (telemetry.combatCallout || (regionBannerText && !telemetry.bossAwakened && !engagedEnemy)) && (
            <div className="mt-1 px-4 py-0.5 font-mythic text-[11px] tracking-[0.22em] uppercase text-[#fef08a] hud-text-shadow text-center">
              {telemetry.combatCallout || regionBannerText?.split('·')[0].trim()}
            </div>
          )}

        {/* ENGAGED ENEMY HUD */}
        {engagedEnemy && (!telemetry.bossAwakened || telemetry.bossDefeated) && (
          <div
            data-testid="engaged-enemy-hud"
            className="mt-1.5 w-64 px-3 py-1.5 bg-[#050811]/85 border-b border-[#f43f5e]/50 space-y-1"
          >
            <div className="flex items-center justify-between text-[9px] font-hud font-bold uppercase tracking-wider">
              <span className="text-[#fda4af] truncate">{engagedEnemy.name}</span>
              <span className="font-mono text-white/80 tabular-nums">
                {engagedEnemy.hp} / {engagedEnemy.maxHp}
              </span>
            </div>

            <div className="relative h-1.5 w-full bg-white/10 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-white/30 transition-all duration-300"
                style={{ width: `${trailingEnemyPct}%` }}
              />
              <div
                className="relative h-full bg-gradient-to-r from-[#e11d48] to-[#fb7185] transition-all duration-100"
                style={{ width: `${enemyHpPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Sekiro / Elden Ring Colossal September Layoff Boss Bar */}
        {telemetry.bossAwakened && !telemetry.bossDefeated && (
          <div className="mt-2 w-[420px] max-w-[90vw] flex flex-col items-center space-y-1.5">
            <div className="w-64 flex flex-col items-center">
              <div className="text-[10px] font-hud font-bold tracking-[0.2em] uppercase text-[#fef08a] hud-text-shadow">
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
                <span className="font-mythic italic font-bold text-base text-[#ffe4e6] tracking-wide hud-text-shadow">
                  {telemetry.bossName || 'The September Layoff — Severance Sovereign'}
                </span>
                <span className="font-mono text-[10px] text-[#fda4af] tabular-nums hud-text-shadow">
                  {bossHpVal} / {bossMaxHpVal}
                </span>
              </div>
              <div className="relative h-2 w-full bg-[#1a060d]/90 border border-[#d4af37]/60 overflow-hidden">
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

            {/* BOSS FIGHT [Z] SKY-LIGHTNING BOLT AFFORDANCE PROMPT */}
            <button
              type="button"
              data-testid="boss-lightning-prompt"
              onClick={(e) => {
                e.currentTarget.blur();
                onTriggerLightningBolt?.();
              }}
              className="pointer-events-auto mt-1 flex items-center gap-2.5 px-3.5 py-1.5 bg-[#062038]/92 border border-[#38bdf8] hover:brightness-110 transition-all cursor-pointer"
            >
              <span className="px-1.5 py-0.5 bg-[#fef08a] text-[#05070b] font-mono font-extrabold text-[10px]">
                [Z]
              </span>
              <span className="font-hud text-xs font-bold tracking-[0.12em] uppercase text-[#fef08a]">
                {telemetry.lightningCooldown && telemetry.lightningCooldown > 0
                  ? `Recharging Vajra Bolt (${telemetry.lightningCooldown.toFixed(1)}s)`
                  : '⚡ Cast Sky-Lightning Bolt (-560 HP)'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 3. TOP-RIGHT: COMPACT ICON CONTROLS + MINIMAL RING RADAR */}
      <div className="absolute top-4 right-4 lg:top-5 lg:right-6 flex flex-col items-end gap-2 pointer-events-auto z-30">
        <div className="flex items-center gap-1.5">
          {onChangeWeatherPreset ? (
            <ProceduralWeatherSystem
              timeOfDay={timeOfDay}
              weatherPreset={weatherPreset}
              onChangeTimeOfDay={onChangeTimeOfDay}
              onChangeWeatherPreset={onChangeWeatherPreset}
            />
          ) : (
            <button
              type="button"
              onClick={cycleTimeOfDay}
              className="w-7 h-7 flex items-center justify-center bg-[#060a14]/70 border border-white/10 font-mono text-[9px] text-[#fef08a] cursor-pointer"
            >
              {timeOfDay}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMinimapVisible((prev) => !prev)}
            className={`w-7 h-7 flex items-center justify-center bg-[#060a14]/70 border transition-colors cursor-pointer ${
              minimapVisible
                ? 'border-[#d4af37]/60 text-[#fef08a]'
                : 'border-white/10 text-[#94a3b8] hover:text-white'
            }`}
            title="Toggle Wayfinding Radar"
            aria-label="Radar"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <polygon points="12,5 14.5,14.5 12,12.5 9.5,14.5" fill="currentColor" stroke="none" />
            </svg>
          </button>

          <button
            type="button"
            data-testid="toggle-control-pad-btn"
            onClick={() => setControlPadVisible((prev) => !prev)}
            className={`w-7 h-7 flex items-center justify-center bg-[#060a14]/70 border transition-colors cursor-pointer ${
              controlPadVisible
                ? 'border-[#d4af37]/60 text-[#fef08a]'
                : 'border-white/10 text-[#94a3b8] hover:text-white'
            }`}
            title="Toggle On-Screen Touch Pad"
            aria-label="Touch Pad"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="6" width="20" height="12" rx="6" />
              <path d="M6 12H10M8 10V14" />
              <circle cx="15" cy="11" r="1" fill="currentColor" />
              <circle cx="17" cy="13" r="1" fill="currentColor" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label="Mute Audio [M]"
            title="Mute Audio [M]"
            className="w-7 h-7 flex items-center justify-center bg-[#060a14]/70 border border-white/10 hover:border-[#d4af37]/60 text-[#cbd5e1] hover:text-[#fef08a] transition-colors cursor-pointer"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 5L6 9H2V15H6L11 19V5Z" />
              {muted ? (
                <path d="M22 9L16 15M16 9L22 15" stroke="#f43f5e" />
              ) : (
                <path d="M15.5 8.5C16.8 9.8 16.8 14.2 15.5 15.5" />
              )}
            </svg>
          </button>

          <button
            type="button"
            onClick={onTogglePause}
            aria-label="Pause Game [P]"
            title="Pause Game [P]"
            className="w-7 h-7 flex items-center justify-center bg-[#060a14]/70 border border-white/10 hover:border-[#d4af37]/60 text-[#cbd5e1] hover:text-[#fef08a] transition-colors cursor-pointer"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="6" y="5" width="4" height="14" />
              <rect x="14" y="5" width="4" height="14" />
            </svg>
          </button>
        </div>

        {/* Sleek 88px Ring Wayfinding Radar */}
        {minimapVisible && (
          <div
            data-testid="tactical-radar-minimap"
            className="relative w-22 h-22 rounded-full bg-[#04070e]/72 border border-[#d4af37]/35 flex items-center justify-center overflow-hidden shadow-xl"
            title="Wayfinding Radar — Gold line points to your next Sanctum"
          >
            <svg width="84" height="84" viewBox="-62 -62 124 124" className="relative z-10">
              <circle
                cx="0"
                cy="0"
                r="56"
                fill="none"
                stroke="#d4af37"
                strokeOpacity="0.18"
                strokeWidth="1"
              />
              <g transform={`rotate(${-telemetry.headingDeg})`}>
                {nextUnvisitedStop && (
                  <line
                    x1={0}
                    y1={0}
                    x2={Math.max(
                      -50,
                      Math.min(50, (nextUnvisitedStop.position.x - telemetry.x) * 0.85)
                    )}
                    y2={Math.max(
                      -50,
                      Math.min(50, (nextUnvisitedStop.position.z - telemetry.z) * 0.85)
                    )}
                    stroke="#fef08a"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    strokeOpacity="0.9"
                  />
                )}

                {PORTFOLIO_STOPS.map((s) => {
                  const rx = Math.max(-50, Math.min(50, (s.position.x - telemetry.x) * 0.85));
                  const rz = Math.max(-50, Math.min(50, (s.position.z - telemetry.z) * 0.85));
                  const visited = visitedStopIds.has(s.id);
                  const isNext = nextUnvisitedStop?.id === s.id;
                  return (
                    <g key={s.id} transform={`translate(${rx}, ${rz})`}>
                      <circle
                        r={isNext ? '5.5' : '3.8'}
                        fill={visited ? '#2dd4bf' : isNext ? '#fef08a' : '#d4af37'}
                        stroke="#05070b"
                        strokeWidth="1.2"
                      />
                    </g>
                  );
                })}

                {/* 2 Under-Construction Sanctum Markers on Radar (Diamond Construction Pips) */}
                {UNFINISHED_SANCTUMS.map((wip) => {
                  const rx = Math.max(-50, Math.min(50, (wip.position.x - telemetry.x) * 0.85));
                  const rz = Math.max(-50, Math.min(50, (wip.position.z - telemetry.z) * 0.85));
                  return (
                    <g key={wip.id} transform={`translate(${rx}, ${rz}) rotate(45)`}>
                      <rect
                        x="-3.2"
                        y="-3.2"
                        width="6.4"
                        height="6.4"
                        fill={wip.accentColor}
                        stroke="#05070b"
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}

                {!telemetry.bossDefeated && (
                  <circle
                    cx={Math.max(-50, Math.min(50, (0 - telemetry.x) * 0.85))}
                    cy={Math.max(-50, Math.min(50, (-45.8 - telemetry.z) * 0.85))}
                    r="4"
                    fill="#f43f5e"
                  />
                )}
              </g>
              <path d="M0 -6 L 4.5 4.5 L 0 2 L -4.5 4.5 Z" fill="#ffffff" />
            </svg>
          </div>
        )}

        {/* Style Rank Indicator during active combos */}
        {comboHits > 0 && (
          <div className="px-3 py-1 bg-gradient-to-l from-[#050811]/85 to-transparent border-r-2 border-[#fef08a] flex items-center gap-2.5">
            <div className="text-right">
              <div className="font-hud text-[10px] font-bold text-[#fef08a] uppercase tracking-wider hud-text-shadow">
                {comboHits} Hit Chain
              </div>
              <div className="font-mono text-[8px] text-[#2dd4bf] uppercase">{comboTitle}</div>
            </div>
            <span className="font-display text-base font-bold text-[#fef08a] hud-text-shadow">
              {comboRank}
            </span>
          </div>
        )}
      </div>

      {/* Relic / Astra Power Awakened Toast Banner */}
      {recentRelicToast && (
        <div className="absolute top-22 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-[radial-gradient(ellipse_at_center,rgba(6,10,18,0.92)_0%,transparent_85%)] border-y border-[#d4af37]/50 text-xs font-hud font-bold tracking-[0.14em] uppercase text-[#fef08a] pointer-events-none z-30 text-center max-w-[90vw] hud-text-shadow">
          {recentRelicToast}
        </div>
      )}

      {/* 4. BOTTOM-CENTER: PURELY CONTEXTUAL [E] INTERACTION PROMPT OR SEALED UNDER-CONSTRUCTION PLAQUE */}
      {!activeStopId && gameState === 'playing' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-2 z-20">
          {telemetry.nearStop && (
            <button
              type="button"
              data-testid="context-action-pill"
              onClick={() => onInspectStop(telemetry.nearStop!.id)}
              className="px-5 py-2 bg-[radial-gradient(ellipse_at_center,rgba(5,8,16,0.92)_0%,rgba(5,8,16,0.45)_80%,transparent_100%)] border-y border-[#d4af37]/65 text-[#f8f5ee] hover:border-[#fef08a] cursor-pointer transition-transform hover:scale-105 flex items-center gap-3"
            >
              <span className="w-5 h-5 rotate-45 flex items-center justify-center bg-[#d4af37] text-[#05070b] font-mono font-extrabold text-[10px] shrink-0">
                <span className="-rotate-45">E</span>
              </span>
              <span className="font-hud text-xs font-bold uppercase tracking-[0.16em] text-[#fef08a] hud-text-shadow">
                Inspect {telemetry.nearStop.title}
              </span>
            </button>
          )}

          {/* SEALED UNDER-CONSTRUCTION SANCTUM HUD PLAQUE (Cannot be opened — displays only allowed points!) */}
          {!telemetry.nearStop && telemetry.nearUnfinishedSanctum && (
            <div
              data-testid="unfinished-sanctum-hud"
              className="w-[380px] sm:w-[440px] max-w-[92vw] px-5 py-3.5 bg-[radial-gradient(ellipse_at_center,rgba(8,10,18,0.95)_0%,rgba(5,8,15,0.88)_85%,rgba(5,8,15,0.4)_100%)] border-y-2 shadow-2xl space-y-2"
              style={{ borderColor: telemetry.nearUnfinishedSanctum.accentColor }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-[#f59e0b]/20 border border-[#f59e0b]/60 font-mono text-[9px] font-extrabold uppercase tracking-wider text-[#fef08a]">
                    🔒 SEALED · WIP
                  </span>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#fda4af]">
                    CANNOT BE OPENED YET
                  </span>
                </div>
                <span className="font-mono text-[9px] text-[#cbd5e1] uppercase">
                  🔨 {telemetry.nearUnfinishedSanctum.workerCount} Workers Active
                </span>
              </div>

              <div>
                <div className="font-mythic text-sm sm:text-base font-bold text-white tracking-wide hud-text-shadow">
                  {telemetry.nearUnfinishedSanctum.title}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#94a3b8]">
                  {telemetry.nearUnfinishedSanctum.sanskritTitle} · Declassified Preview Intel:
                </div>
              </div>

              <ul
                data-testid="unfinished-sanctum-points"
                className="space-y-1 pt-0.5"
              >
                {telemetry.nearUnfinishedSanctum.revealedPoints.map((point, idx) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 font-sans text-xs font-medium text-[#fef08a] hud-text-shadow"
                  >
                    <span className="font-mono text-[10px] font-extrabold text-[#f59e0b] shrink-0">
                      {idx + 1})
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!telemetry.nearStop && telemetry.nearWeaponForge && (
            <button
              type="button"
              onClick={() => onEquipWeapon?.(telemetry.nearWeaponForge!.id)}
              className="px-5 py-1.5 bg-[radial-gradient(ellipse_at_center,rgba(5,8,16,0.9)_0%,transparent_95%)] border-y border-[#38bdf8]/60 text-[#f8f5ee] cursor-pointer flex items-center gap-3"
            >
              <span className="w-5 h-5 rotate-45 flex items-center justify-center bg-[#38bdf8] text-[#05070b] font-mono font-extrabold text-[10px] shrink-0">
                <span className="-rotate-45">E</span>
              </span>
              <span className="font-hud text-xs font-bold uppercase tracking-[0.14em] hud-text-shadow">
                Equip {telemetry.nearWeaponForge.name} (+{telemetry.nearWeaponForge.baseDamageBonus} ATK)
              </span>
            </button>
          )}

          {!telemetry.nearStop && !telemetry.nearWeaponForge && telemetry.nearHypoGuide && (
            <button
              type="button"
              onClick={() => onOpenHypoGuide?.()}
              className="px-5 py-1.5 bg-[radial-gradient(ellipse_at_center,rgba(5,8,16,0.9)_0%,transparent_95%)] border-y border-[#2dd4bf]/60 text-[#fef08a] cursor-pointer flex items-center gap-3"
            >
              <span className="w-5 h-5 rotate-45 flex items-center justify-center bg-[#2dd4bf] text-[#05070b] font-mono font-extrabold text-[10px] shrink-0">
                <span className="-rotate-45">E</span>
              </span>
              <span className="font-hud text-xs font-bold uppercase tracking-[0.14em] hud-text-shadow">
                Talk to Hypo AI Companion
              </span>
            </button>
          )}

          {!telemetry.nearStop && telemetry.nearRecruiterTemple && (
            <button
              type="button"
              onClick={() => onOpenRecruiterTemple?.()}
              className="px-5 py-1.5 bg-[radial-gradient(ellipse_at_center,rgba(5,8,16,0.9)_0%,transparent_95%)] border-y border-[#d4af37]/60 text-[#fef08a] cursor-pointer flex items-center gap-3"
            >
              <span className="w-5 h-5 rotate-45 flex items-center justify-center bg-[#d4af37] text-[#05070b] font-mono font-extrabold text-[10px] shrink-0">
                <span className="-rotate-45">E</span>
              </span>
              <span className="font-hud text-xs font-bold uppercase tracking-[0.14em] hud-text-shadow">
                Enter Temple of Opportunities
              </span>
            </button>
          )}

          {!telemetry.nearStop && telemetry.nearBossChallengeCircle && (
            <button
              type="button"
              onClick={() => onSummonLayoffBoss()}
              className="px-5 py-1.5 bg-[radial-gradient(ellipse_at_center,rgba(5,8,16,0.9)_0%,transparent_95%)] border-y border-[#f43f5e]/65 text-[#fecdd3] cursor-pointer flex items-center gap-3"
            >
              <span className="w-5 h-5 rotate-45 flex items-center justify-center bg-[#f43f5e] text-white font-mono font-extrabold text-[10px] shrink-0">
                <span className="-rotate-45">E</span>
              </span>
              <span className="font-hud text-xs font-bold uppercase tracking-[0.14em] hud-text-shadow">
                {visitedStopIds.size >= PORTFOLIO_STOPS.length
                  ? 'Challenge The September Layoff Boss'
                  : `Boss Sealed (${visitedStopIds.size}/6 Sanctums Visited)`}
              </span>
            </button>
          )}
        </div>
      )}

      {/* 5. BOTTOM-LEFT: AUTHENTIC ACTION-RPG VITALITY, SANCTUM SEALS & BLADE CREST (Sekiro / Black Myth / Elden Ring style) */}
      {gameState === 'playing' && !activeStopId && (
        <div className="fixed bottom-5 left-5 lg:bottom-6 lg:left-7 z-20 flex items-center gap-4 pointer-events-auto">
          {/* Left: Rotated Diamond Equipped Weapon Crest Socket */}
          <button
            type="button"
            onClick={() => {
              const currentIdx = FORGE_WEAPONS.findIndex((w) => w.id === equippedWeaponId);
              const nextIdx = (currentIdx + 1) % FORGE_WEAPONS.length;
              onEquipWeapon?.(FORGE_WEAPONS[nextIdx].id);
            }}
            title={`Equipped: ${equippedWeapon.name} (${attackDmg} ATK) — Click or press [1-4] to switch blades`}
            className="relative w-11 h-11 flex items-center justify-center shrink-0 cursor-pointer group"
          >
            <div className="w-9 h-9 rotate-45 bg-[#060a14]/92 border-2 border-[#d4af37]/80 group-hover:border-[#fef08a] shadow-[0_4px_18px_rgba(0,0,0,0.9)] transition-colors" />
            {/* Custom Blade Silhouette SVG */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="absolute text-[#fef08a] drop-shadow"
            >
              <path
                d="M19 3L5 17M8 14L10 16M4 20L7 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            {/* ATK Badge at Bottom Vertex */}
            <span className="absolute -bottom-1.5 px-1 bg-[#050811] border border-[#d4af37]/50 font-mono text-[8px] font-bold text-[#fef08a] tabular-nums">
              {attackDmg} ATK
            </span>
          </button>

          {/* Right: Sanctum Seal Pips, Slanted Vitality/Stamina Bars & Compact Stance Dots */}
          <div className="flex flex-col gap-1">
            {/* Row 1: 6 Golden Sanctum Seal Diamonds + 5 Lotus Jewel Pips */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1" title={`${stats.visitedStopsCount}/6 Sanctums Awakened`}>
                {PORTFOLIO_STOPS.map((s) => {
                  const visited = visitedStopIds.has(s.id);
                  return (
                    <span
                      key={s.id}
                      className={`w-2 h-2 rotate-45 border transition-colors ${
                        visited
                          ? 'bg-[#fef08a] border-[#fef08a] shadow-[0_0_6px_#fef08a]'
                          : 'bg-black/60 border-[#d4af37]/45'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-white/20 text-[9px]">·</span>
              <div className="flex items-center gap-1" title={`${stats.collectedRelicsCount}/5 Career Lotus Jewels`}>
                {LOTUS_RELICS.map((r) => {
                  const collected = collectedRelicIds.has(r.id);
                  return (
                    <span
                      key={r.id}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        collected
                          ? 'bg-[#c084fc] shadow-[0_0_6px_#c084fc]'
                          : 'bg-white/20'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="font-mono text-[9px] text-[#cbd5e1]/80 tabular-nums ml-1 hud-text-shadow">
                {pranaValue}/{pranaMax}
              </span>
            </div>

            {/* Row 2: Slanted Crimson-Gold Prana (HP) Bar */}
            <div className="relative h-2 w-48 sm:w-56 bg-[#050811]/85 border border-white/15 clip-slanted-bar overflow-hidden shadow-md">
              <div
                className="absolute inset-y-0 left-0 bg-[#fef08a]/45 transition-all duration-300"
                style={{ width: `${trailingPranaPct}%` }}
              />
              <div
                className="relative h-full bg-gradient-to-r from-[#be123c] via-[#e11d48] to-[#fb7185] transition-all duration-200"
                style={{ width: `${pranaPct}%` }}
              />
            </div>

            {/* Row 3: Razor-Thin Slanted Stamina Bar */}
            <div className="h-1 w-36 sm:w-40 bg-[#050811]/85 clip-slanted-bar overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0d9488] to-[#2dd4bf] transition-all duration-150"
                style={{ width: `${staminaPct}%` }}
              />
            </div>

            {/* Row 4: Whisper-Quiet Blade Stance Tags [1-4] + [Z] */}
            <div
              aria-label="Weapon Switcher Keys 1 to 4"
              className="flex items-center gap-2 pt-0.5"
            >
              {FORGE_WEAPONS.map((w, idx) => {
                const active = equippedWeaponId === w.id;
                const shortName = w.name.split(' ')[0];
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onEquipWeapon?.(w.id)}
                    title={`[${idx + 1}] ${w.name} (+${w.baseDamageBonus} ATK)`}
                    className={`font-mono text-[9px] cursor-pointer transition-colors whitespace-nowrap hud-text-shadow ${
                      active
                        ? 'text-[#fef08a] font-bold border-b border-[#d4af37]'
                        : 'text-white/45 hover:text-white/85'
                    }`}
                  >
                    [{idx + 1}] {shortName}
                  </button>
                );
              })}

              {visitedStopIds.size >= 6 && (
                <button
                  type="button"
                  onClick={() => onTriggerLightningBolt?.()}
                  title="Cast Indra Sky-Lightning Bolt [Key Z]"
                  className="font-mono text-[9px] font-bold text-[#38bdf8] hover:text-[#fef08a] cursor-pointer hud-text-shadow"
                >
                  [Z] ⚡
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. ON-SCREEN MOBILE ACTION-RPG CONTROL PAD (Hidden by default on desktop, toggleable via "Touch Pad") */}
      {gameState === 'playing' && !activeStopId && controlPadVisible && (
        <MobileRpgControlPad
          onVirtualMove={onVirtualMove}
          onVirtualJump={onVirtualJump}
          onTriggerAttack={onTriggerAttack}
          onTriggerLightningBolt={onTriggerLightningBolt}
          onTriggerParry={onTriggerParry}
          onTriggerDash={onTriggerDash}
          onTriggerGrapple={onTriggerGrapple}
          onTogglePause={onTogglePause}
          onCycleWeapon={() => {
            const currentIdx = FORGE_WEAPONS.findIndex((w) => w.id === equippedWeaponId);
            const nextIdx = (currentIdx + 1) % FORGE_WEAPONS.length;
            onEquipWeapon?.(FORGE_WEAPONS[nextIdx].id);
          }}
          onCycleTime={cycleTimeOfDay}
          lightningUnlocked={visitedStopIds.size >= 6}
          lightningCooldown={telemetry.lightningCooldown}
        />
      )}

      {/* 7. PORTFOLIO CHECKLIST & SUMMARY SCROLL MODAL */}
      {summaryScrollOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Portfolio Verse Progress Checklist"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md pointer-events-auto"
          onClick={() => setSummaryScrollOpen(false)}
        >
          <div
            className="w-full max-w-3xl glass-panel border-[#d4af37]/50 flex flex-col max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">
                  PORTFOLIO VERSE CHECKLIST
                </div>
                <h2 className="font-mythic text-lg sm:text-xl text-white">
                  {CREATOR_PROFILE.name} — Exploration &amp; Case Study Summary
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSummaryScrollOpen(false)}
                className="px-3 py-1 border border-white/20 text-xs font-mono text-[#cbd5e1] hover:text-white cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PORTFOLIO_STOPS.map((s) => {
                  const visited = visitedStopIds.has(s.id);
                  return (
                    <div
                      key={s.id}
                      className={`p-3 border flex items-center justify-between gap-2 ${
                        visited
                          ? 'bg-[#07181d] border-[#2dd4bf]/45'
                          : 'bg-[#091120] border-white/10'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-[9px] text-[#fef08a]">
                          SANCTUM {s.indexNumber} · {visited ? 'VISITED' : 'UNVISITED'}
                        </div>
                        <div className="font-sans text-xs font-bold text-white truncate">
                          {s.title}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSummaryScrollOpen(false);
                          onTeleportToStop(s.id);
                        }}
                        className="px-2.5 py-1 bg-[#d4af37] hover:bg-[#fef08a] text-[#05070b] font-hud text-[9px] font-bold uppercase cursor-pointer shrink-0"
                      >
                        Inspect →
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Under-Construction / Unfinished Sanctums in Checklist Modal */}
              <div className="pt-3 border-t border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#f59e0b]">
                    🚧 UNFINISHED SANCTUMS · UNDER CONSTRUCTION (SEALED — CANNOT BE OPENED)
                  </div>
                  <div className="font-mono text-[9px] text-[#94a3b8] uppercase">
                    🔨 Sthapati Workers Active on Map
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {UNFINISHED_SANCTUMS.map((wip) => (
                    <div
                      key={wip.id}
                      className="p-3 bg-[#120d08] border border-[#f59e0b]/45 flex flex-col justify-between gap-2.5"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[9px] font-bold uppercase text-[#fbbf24]">
                            🔒 SEALED · {wip.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSummaryScrollOpen(false);
                              onSelectGuidanceTarget?.(wip.id, 'wip');
                              onTeleportToPoint?.(
                                wip.position.x,
                                wip.position.z + 6.8,
                                `${wip.title} (Under Construction)`
                              );
                            }}
                            className="px-2 py-0.5 bg-[#f59e0b] hover:bg-[#fef08a] text-[#05070b] font-hud text-[9px] font-extrabold uppercase cursor-pointer"
                          >
                            Visit Site →
                          </button>
                        </div>
                        <div className="font-sans text-xs font-bold text-white">{wip.title}</div>
                        <ul className="space-y-0.5">
                          {wip.revealedPoints.map((pt, idx) => (
                            <li
                              key={pt}
                              className="font-sans text-[11px] text-[#fde68a] flex items-start gap-1.5"
                            >
                              <span className="font-mono text-[9px] font-bold text-[#f59e0b] shrink-0">
                                {idx + 1})
                              </span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#050811] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a
                  href={CREATOR_PROFILE.calUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#d4af37] hover:bg-[#fde68a] text-[#05070b] font-hud text-xs font-bold uppercase tracking-wider"
                >
                  Book Call with Ayush
                </a>
                <a
                  href={CREATOR_PROFILE.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 border border-[#d4af37]/60 text-[#f8f5ee] font-hud text-xs font-bold uppercase tracking-wider"
                >
                  Resume PDF
                </a>
              </div>
              <button
                type="button"
                data-testid="continue-exploring-btn"
                onClick={() => {
                  setSummaryScrollOpen(false);
                  onResumeFromMastery();
                }}
                className="px-4 py-2 bg-[#0d9488] hover:bg-[#14b8a6] text-white font-hud text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Continue Exploring →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. GAME OVER / PLAYER DIED FULL-SCREEN MODAL */}
      {(gameState === 'gameover' || gameState === 'player_died') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/92 backdrop-blur-md pointer-events-auto">
          <div className="w-full max-w-xl text-center space-y-8 glass-panel p-8">
            <div className="space-y-3">
              <h2
                className={`font-mythic text-3xl lg:text-5xl tracking-[0.2em] uppercase ${
                  gameState === 'gameover' ? 'text-[#fef08a]' : 'text-[#f43f5e]'
                }`}
              >
                {gameState === 'gameover' ? 'MAHA-ASURA VANQUISHED' : 'PRANA EXTINGUISHED'}
              </h2>
              <p className="font-sans text-xs lg:text-sm text-[#cbd5e1]">
                {gameState === 'gameover'
                  ? 'You have overcome the Colossal Layoff and mastered the Portfolio Verse.'
                  : 'The Workforce Reduction was too great. Return to the valley to continue your journey.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-6 border-y border-white/10">
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-[#94a3b8] uppercase">
                  Sanctums Inspected
                </div>
                <div className="font-mythic text-2xl text-white tabular-nums">
                  {visitedStopIds.size}/6
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-[#94a3b8] uppercase">
                  Career Jewels Collected
                </div>
                <div className="font-mythic text-2xl text-white tabular-nums">
                  {collectedRelicIds.size}/5
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {gameState === 'gameover' && (
                <button
                  type="button"
                  onClick={() => onResumeFromMastery()}
                  className="px-6 py-3 bg-[#d4af37] hover:bg-[#fef08a] text-[#05070b] font-hud text-xs font-extrabold tracking-[0.18em] uppercase cursor-pointer"
                >
                  Continue Exploring World
                </button>
              )}
              <button
                type="button"
                onClick={() => onRestartFromBeginning()}
                className="px-6 py-3 glass-button font-hud text-xs font-bold tracking-[0.18em] uppercase cursor-pointer"
              >
                Restart Journey
              </button>
              <button
                type="button"
                onClick={() => onReturnToTitle()}
                className="px-6 py-3 text-[#94a3b8] hover:text-white font-hud text-xs tracking-[0.18em] uppercase transition-colors cursor-pointer"
              >
                Return to Title
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. PAUSE FULL-SCREEN MODAL */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-sm text-center space-y-6 glass-panel p-7">
            <div className="space-y-2">
              <h2 className="font-mythic text-2xl tracking-[0.2em] uppercase text-white">PAUSED</h2>
              <div className="h-[1px] w-24 mx-auto bg-[#d4af37]/40" />
            </div>

            <nav className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => onTogglePause()}
                className="w-full py-3 bg-[#d4af37] hover:bg-[#fef08a] text-[#05070b] font-hud text-xs font-extrabold tracking-[0.2em] uppercase transition-all cursor-pointer"
              >
                Resume Game
              </button>
              <button
                type="button"
                onClick={() => {
                  onTogglePause();
                  setSanctumBarExpanded(true);
                }}
                className="w-full py-3 glass-button font-hud text-xs tracking-[0.18em] uppercase cursor-pointer"
              >
                Sanctums &amp; Fast Travel
              </button>
              <button
                type="button"
                onClick={() => onResetSpawn()}
                className="w-full py-3 glass-button font-hud text-xs tracking-[0.18em] uppercase cursor-pointer"
              >
                Reset to Spawn
              </button>
              <button
                type="button"
                onClick={() => onReturnToTitle()}
                className="w-full py-2.5 text-[#94a3b8] hover:text-white font-hud text-[11px] tracking-[0.2em] uppercase transition-colors cursor-pointer"
              >
                Exit to Title
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};
