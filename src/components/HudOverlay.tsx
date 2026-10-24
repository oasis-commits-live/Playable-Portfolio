import React, { useEffect, useRef, useState } from 'react';
import {
  CREATOR_PROFILE,
  PORTFOLIO_STOPS,
  STORY_CHAPTERS,
  PortfolioStop,
  LOTUS_RELICS,
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

export interface HudTelemetry {
  x: number;
  z: number;
  headingDeg: number;
  regionName: string;
  nearStop: PortfolioStop | null;
  nearDistance: number;
  distanceTraveled: number;
  playerHp?: number;
  playerMaxHp?: number;
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
  const [storyDrawerOpen, setStoryDrawerOpen] = useState(false);
  const [minimapVisible, setMinimapVisible] = useState(true);

  // Delayed damage trail for Player HP and Boss HP (Sekiro / Elden Ring white-gold drain bar)
  const pranaValue = telemetry.playerHp ?? 320;
  const pranaMax = telemetry.playerMaxHp ?? 320;
  const pranaPct = Math.max(0, Math.min(100, Math.round((pranaValue / pranaMax) * 100)));
  const [trailingPranaPct, setTrailingPranaPct] = useState(pranaPct);

  const bossHpVal = telemetry.bossHp ?? 320;
  const bossMaxHpVal = telemetry.bossMaxHp ?? 320;
  const bossHpPct = Math.max(0, Math.min(100, Math.round((bossHpVal / bossMaxHpVal) * 100)));
  const [trailingBossPct, setTrailingBossPct] = useState(bossHpPct);

  // Cinematic Region Discovery Banner (Elden Ring / Ghost of Tsushima style)
  const [regionBannerText, setRegionBannerText] = useState<string | null>(null);
  const lastRegionRef = useRef<string>('');

  useEffect(() => {
    const t = window.setTimeout(() => {
      setTrailingPranaPct((prev) => (pranaPct < prev ? pranaPct : pranaPct));
    }, 450);
    return () => window.clearTimeout(t);
  }, [pranaPct]);

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
  const attackDmg = telemetry.attackDamage ?? 18;
  const aliveDemons = telemetry.aliveDemonsCount ?? 6;
  const bossPosture = telemetry.bossPosture ?? 0;
  const bossMaxPosture = telemetry.bossMaxPosture ?? 180;
  const musicMood = telemetry.musicMood ?? 'calm';
  const comboHits = telemetry.comboHitCount ?? 0;
  const comboRank = telemetry.comboRankCode ?? 'D';
  const comboTitle = telemetry.comboRankTitle ?? '';

  const cycleTimeOfDay = () => {
    const order: TimeOfDay[] = ['dawn', 'noon', 'twilight'];
    const next = order[(order.indexOf(timeOfDay) + 1) % order.length];
    onChangeTimeOfDay(next);
  };

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none cinematic-vignette">
      {/* 0. DYNAMIC CENTER RETICLE (Reacts to Grapple Target & Combat Mode) */}
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

      {/* 1. TOP-LEFT FRAMELESS QUEST TRACKER & SANCTUM FAST-TRAVEL CHAPTERS (Ghost of Tsushima Tale Style) */}
      <div className="absolute top-5 left-6 flex flex-col gap-2 pointer-events-auto">
        {/* Active Tale / Act Header with Left Golden Vertical Blade */}
        <div className="flex items-center gap-3 pl-3 border-l-2 border-[#d4af37]">
          <div>
            <div className="flex items-center gap-2 font-hud text-[11px] font-bold tracking-[0.22em] uppercase text-[#d4af37]">
              <span>{telemetry.storyAct || 'ACT I'}</span>
              <span>·</span>
              <span className="text-[#2dd4bf]">{stats.visitedStopsCount}/6 SANCTUMS AWAKENED</span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
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

        {/* Sleek Chapter Fast-Travel Nodes (01–06 Sanctums) */}
        {sanctumBarExpanded ? (
          <div className="flex flex-wrap items-center gap-1 pl-3">
            {PORTFOLIO_STOPS.map((stop) => {
              const isVisited = visitedStopIds.has(stop.id);
              const isCurrent = activeStopId === stop.id || telemetry.nearStop?.id === stop.id;
              return (
                <button
                  key={stop.id}
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onTeleportToStop(stop.id);
                  }}
                  className={`px-2 py-0.5 clip-blade-right font-hud text-[11px] font-semibold tracking-wider uppercase transition-all cursor-pointer border-l ${
                    isCurrent
                      ? 'bg-[#d4af37] text-[#05070b] border-[#fef08a] font-bold'
                      : isVisited
                      ? 'bg-[#091820]/85 text-[#2dd4bf] border-[#2dd4bf] hover:bg-[#112836]'
                      : 'bg-[#070b14]/75 text-[#cbd5e1] border-[#d4af37]/40 hover:text-white hover:border-[#d4af37]'
                  }`}
                  title={`Fast-Travel & Inspect Sanctum: ${stop.title}`}
                >
                  {SHORT_STOP_LABELS[stop.id]}
                </button>
              );
            })}
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                setSanctumBarExpanded(false);
              }}
              className="px-1.5 py-0.5 font-mono text-[9px] text-[#94a3b8] hover:text-white cursor-pointer"
              title="Toggle Sanctum Fast-Travel Strip [Tab / H]"
            >
              [HIDE]
            </button>
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
            + SHOW 6 SANCTUMS [TAB]
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

      {/* 2. TOP-CENTER FRAMELESS SKYLINE COMPASS + ELDEN RING BOSS BAR + REGION BANNER */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none hidden sm:flex flex-col items-center">
        {/* Frameless Horizon Compass Ribbon */}
        <div className="relative w-72 h-6 overflow-hidden flex items-center border-b border-[#d4af37]/30">
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

        {/* Cinematic Region Discovery Callout (Fades out automatically after 2.8s) */}
        {regionBannerText && !telemetry.bossAwakened && (
          <div className="mt-4 flex flex-col items-center animate-fade-in">
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

        {/* Sekiro / Elden Ring Colossal September Layoff Boss Bar */}
        {telemetry.bossAwakened && !telemetry.bossDefeated && (
          <div className="mt-3 w-[420px] max-w-[90vw] flex flex-col items-center space-y-1.5">
            {/* Sekiro Central Posture Bar */}
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

            {/* Elden Ring Wide Boss Vitality Bar with Delayed White-Gold Trail */}
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
                {/* Delayed White-Gold Damage Drain Bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-[#fef08a]/80 transition-all duration-500"
                  style={{ width: `${trailingBossPct}%` }}
                />
                {/* Active Crimson Boss HP Bar */}
                <div
                  className="relative h-full bg-gradient-to-r from-[#881337] via-[#e11d48] to-[#f43f5e] transition-all duration-100"
                  style={{ width: `${bossHpPct}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. TOP-RIGHT SYSTEM GLYPHS, RADAR & KINETIC COMBO STYLE RANK */}
      <div className="absolute top-4 right-6 flex flex-col items-end gap-2.5 pointer-events-auto">
        <div className="flex items-center gap-2 bg-[#060a12]/80 border-b border-[#d4af37]/35 px-2.5 py-1 backdrop-blur-md">
          {/* Time-of-Day Cycle */}
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

          {/* Toggle Radar */}
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

          {/* Mute Audio [M] */}
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

          {/* Pause & World Atlas [P] */}
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

        {/* Sacred Mandala Circular Radar */}
        {minimapVisible && (
          <div
            className="relative w-20 h-20 rounded-full border border-[#d4af37]/50 bg-[#050911]/90 overflow-hidden"
            style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.85)' }}
          >
            <svg width="80" height="80" viewBox="-70 -70 140 140" className="w-full h-full">
              <circle cx="0" cy="0" r="66" fill="#070d17" />
              <circle cx="0" cy="0" r="44" fill="none" stroke="#d4af37" strokeOpacity="0.16" strokeWidth="1" />
              <path
                d="M -65 -4 Q 0 -10 65 -4"
                stroke="#0d9488"
                strokeWidth="4.5"
                fill="none"
                opacity="0.6"
              />
              <circle cx="0" cy="-48" r="4" fill="#f43f5e" />

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

        {/* Devil May Cry / Ghost of Tsushima Kinetic Combo Rank Emblem */}
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

      {/* 4. IN-WORLD FLOATING 3D WAYPOINT DIAMOND */}
      {telemetry.waypointScreen && !activeStopId && gameState === 'playing' && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-10 transition-all duration-75"
          style={{
            left: `${telemetry.waypointScreen.xPct}%`,
            top: `${telemetry.waypointScreen.yPct}%`,
          }}
        >
          <button
            type="button"
            onClick={() => onTeleportToStop(telemetry.waypointScreen!.stopId)}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-4 h-4 rotate-45 border border-[#fef9c3] bg-[#d4af37]/90 flex items-center justify-center shadow-[0_0_14px_rgba(212,175,55,0.75)] group-hover:scale-125 transition-transform">
              <div className="w-1.5 h-1.5 bg-[#05070b]" />
            </div>
            <div className="mt-1 px-1.5 py-0.5 bg-[#05070b]/85 border-b border-[#d4af37]/60 text-[10px] font-hud font-bold tracking-wider text-[#f4efe6] tabular-nums whitespace-nowrap">
              {telemetry.waypointScreen.distance}m · [G]
            </div>
          </button>
        </div>
      )}

      {/* Relic / Astra Power Awakened Banner */}
      {recentRelicToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-transparent via-[#060a14]/95 to-transparent border-y border-[#d4af37] text-xs font-hud font-bold tracking-[0.18em] uppercase text-[#fef08a] pointer-events-none z-30">
          {recentRelicToast}
        </div>
      )}

      {/* Proximity Sanctum Scroll Interaction Callout */}
      {telemetry.nearStop && !activeStopId && gameState === 'playing' && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            type="button"
            onClick={() => onInspectStop(telemetry.nearStop!.id)}
            className="flex items-center gap-3 px-5 py-2 clip-blade-right bg-[#070b14]/95 border-l-2 border-[#d4af37] hover:bg-[#101829] text-left shadow-2xl transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span className="px-2 py-0.5 bg-[#d4af37] text-[#05070b] font-hud font-bold text-xs tracking-wider uppercase">
              [E] INSPECT CODEX
            </span>
            <span className="font-mythic italic text-base text-[#f8f5ee]">
              {telemetry.nearStop.title}
            </span>
          </button>
        </div>
      )}

      {/* 5. BOTTOM-LEFT AAA HERO VITALS & SUDARSHANA CHAKRA MEDALLION (Black Myth: Wukong / Sekiro Style) */}
      {gameState === 'playing' && (
        <div className="fixed bottom-5 left-6 z-20 flex items-end gap-3 pointer-events-none">
          {/* Sacred 6-Petal Sudarshana Chakra SVG Medallion */}
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg width="56" height="56" viewBox="0 0 64 64" className="w-full h-full">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="rgba(6, 10, 18, 0.9)"
                stroke="#d4af37"
                strokeWidth="1.5"
              />
              {/* 6 Petal Sockets representing the 6 Project Astra Powers */}
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

          {/* Tapered Prana & Stamina Blade Bars with Delayed White-Gold Damage Trail */}
          <div className="flex flex-col gap-1.5 pb-1">
            <div className="flex items-center justify-between gap-6 font-hud text-[11px] tracking-[0.18em] uppercase">
              <span className="text-[#f8f5ee] font-bold">
                PRANA <span className="text-[#fda4af] tabular-nums">{pranaValue}</span>
              </span>
              <span className="text-[#94a3b8]">
                {stats.collectedRelicsCount}/5 RELICS
              </span>
            </div>

            {/* Double-Layer Health Blade Bar */}
            <div className="relative w-52 sm:w-64 h-2.5 clip-blade-right bg-[#1a070e]/90 border-l-2 border-[#d4af37] overflow-hidden">
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
            <div className="w-40 sm:w-48 h-1.5 clip-blade-right bg-[#061c1b]/90 border-l-2 border-[#2dd4bf] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0d9488] to-[#2dd4bf] transition-all duration-100"
                style={{ width: `${staminaPct}%` }}
              />
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
            title="Katana 3-Hit Combo [Left-Click or F]"
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
                  WORLD ATLAS · PAUSED
                </div>
                <h2 id="pause-modal-title" className="font-display text-xl font-bold text-[#f8f5ee]">
                  Ayush Dubey Portfolio
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
                SEPTEMBER LAYOFF VANQUISHED
              </div>
              <h2 id="mastery-modal-title" className="font-display text-2xl font-bold text-[#f8f5ee] mt-1">
                Resilience Forged Through 6 Shipped Products
              </h2>
              <p className="text-xs text-[#cbd5e1] mt-1.5 leading-relaxed">
                A sudden workforce reduction in September ended Ayush Dubey’s chapter at Cheggout,
                but his 0→1 craft and $3M ARR impact endure.
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
