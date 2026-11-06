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
import { computeCompletionStats } from '../game/worldLogic';
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
  nearRecruiterTemple?: boolean;
  nearHypoGuide?: boolean;
  nearBossChallengeCircle?: boolean;
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
  nextGuidanceSanctum?: {
    title: string;
    distance: number;
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r={musicMood === 'combat' ? '3.5' : '1.5'}
              fill={musicMood === 'combat' ? '#f43f5e' : '#d4af37'}
            />
            <path
              d="M12 4V7M12 17V20M4 12H7M17 12H20"
              stroke={telemetry.grappleTargetTitle ? '#2dd4bf' : '#d4af37'}
              strokeWidth="1"
              strokeOpacity="0.4"
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
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex items-center gap-2 px-3 py-1 glass-panel border-[#38bdf8]/40 shadow-xl"
                style={{ left: '50%', top: '64px' }}
              >
                <span className="font-mono text-[8px] font-bold tracking-[0.18em] uppercase text-[#38bdf8]">
                  {m.subtitle}
                </span>
                <span className="text-[#38bdf8]/40">·</span>
                <span className="font-hud text-[10px] font-bold text-[#fef08a] tracking-wide">
                  “{m.title}”
                </span>
              </div>
            );
          }

          return null;
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

      {/* 1. TOP-LEFT CONSOLIDATED TACTICAL MENU */}
      <div className="absolute top-4 left-4 lg:top-6 lg:left-8 flex flex-col gap-3 pointer-events-auto max-w-[320px]">
        {/* Main Menu Toggle & Completion Stats */}
        <div className="flex flex-col gap-1 border-l-2 border-[#d4af37] pl-3 py-0.5">
          <div className="flex items-center gap-2 font-hud text-[9px] font-bold tracking-[0.2em] text-[#d4af37]/80 uppercase">
            <span>TACTICAL OVERLAY</span>
            <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
          </div>
          
          <div className="flex items-center gap-3">
            <h1 className="font-mythic text-lg lg:text-xl text-[#f8f5ee] tracking-tight leading-none">
              {telemetry.storyTitle || 'The Builder’s Awakening'}
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 glass-panel rounded-full text-[9px] font-mono text-[#d4af37]">
              <span className="text-[#2dd4bf]">{stats.visitedStopsCount}/6</span>
              <span className="opacity-40">·</span>
              <span className="text-[#e879f9]">{stats.collectedRelicsCount}/5</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Utility Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pl-3">
          <button
            type="button"
            onClick={() => setSanctumBarExpanded(!sanctumBarExpanded)}
            className={`px-3 py-1 glass-button rounded-md font-hud text-[9px] font-bold tracking-[0.15em] uppercase ${sanctumBarExpanded ? 'active' : ''}`}
          >
            {sanctumBarExpanded ? 'Collapse' : 'Inventory'}
          </button>
          
          <button
            type="button"
            onClick={() => setStoryDrawerOpen(!storyDrawerOpen)}
            className={`px-3 py-1 glass-button rounded-md font-hud text-[9px] font-bold tracking-[0.15em] uppercase ${storyDrawerOpen ? 'active' : ''}`}
          >
            Saga
          </button>

          {!telemetry.bossDefeated && (
            <button
              type="button"
              onClick={() => onSummonLayoffBoss()}
              className={`px-3 py-1 glass-button rounded-md font-hud text-[9px] font-bold tracking-[0.15em] uppercase ${
                telemetry.bossAwakened ? 'border-[#f43f5e] text-[#fda4af]' : 'text-[#fef08a]'
              }`}
            >
              {telemetry.bossAwakened ? 'Boss Active' : 'Challenge Boss'}
            </button>
          )}
        </div>

        {/* Expandable Inventory/Navigator */}
        {sanctumBarExpanded && (
          <div className="ml-3 p-3 glass-panel rounded-xl space-y-3 animate-fade-in">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/5 pb-2">
              {(['projects', 'jewels', 'weapons'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNavCategory(cat)}
                  className={`px-2 py-1 text-[8px] font-hud font-bold uppercase tracking-widest transition-colors ${
                    navCategory === cat ? 'text-[#d4af37]' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Content Grids */}
            <div className="max-h-40 overflow-y-auto pr-1">
              {navCategory === 'projects' && (
                <div className="grid grid-cols-2 gap-1">
                  {PORTFOLIO_STOPS.map((stop) => {
                    const visited = visitedStopIds.has(stop.id);
                    const active = activeStopId === stop.id || telemetry.nearStop?.id === stop.id;
                    return (
                      <button
                        key={stop.id}
                        onClick={() => {
                          onSelectGuidanceTarget?.(stop.id, 'project');
                          onTeleportToStop(stop.id);
                        }}
                        className={`px-2 py-1.5 text-left rounded border transition-all ${
                          active 
                            ? 'bg-[#d4af37] border-[#d4af37] text-[#05070b]' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-[9px] font-hud font-bold truncate leading-tight">
                          {SHORT_STOP_LABELS[stop.id].split(' ').slice(1).join(' ')}
                        </div>
                        <div className={`text-[7px] font-mono uppercase ${active ? 'text-[#05070b]/60' : 'text-white/30'}`}>
                          {visited ? 'Visited' : 'Locked'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {navCategory === 'jewels' && (
                <div className="grid grid-cols-2 gap-1">
                  {LOTUS_RELICS.map((relic, idx) => {
                    const collected = collectedRelicIds.has(relic.id);
                    return (
                      <button
                        key={relic.id}
                        onClick={() => {
                          onSelectGuidanceTarget?.(relic.id, 'jewel');
                          onTeleportToPoint?.(relic.position.x, relic.position.z + 1.8, relic.company);
                        }}
                        className={`px-2 py-1.5 text-left rounded border bg-white/5 border-white/5 hover:bg-white/10 transition-all`}
                      >
                        <div className="text-[9px] font-hud font-bold truncate leading-tight text-white/80">
                          {relic.company}
                        </div>
                        <div className="text-[7px] font-mono text-[#c084fc] uppercase">
                          {collected ? 'Collected' : `Jewel 0${idx + 1}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {navCategory === 'weapons' && (
                <div className="flex flex-col gap-1">
                  {FORGE_WEAPONS.map((w, idx) => {
                    const active = equippedWeaponId === w.id;
                    return (
                      <button
                        key={w.id}
                        onClick={() => onEquipWeapon?.(w.id)}
                        className={`px-2 py-1.5 flex items-center justify-between rounded border transition-all ${
                          active 
                            ? 'bg-[#38bdf8] border-[#38bdf8] text-[#05070b]' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-[9px] font-hud font-bold uppercase">{w.name}</div>
                        <div className="text-[7px] font-mono uppercase opacity-60">+{w.baseDamageBonus} ATK</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Story Drawer */}
        {storyDrawerOpen && (
          <div className="ml-3 p-4 glass-panel rounded-xl max-h-[50vh] overflow-y-auto space-y-3 animate-fade-in">
            <div className="border-b border-white/5 pb-2">
              <h3 className="font-hud text-xs font-bold text-[#d4af37] uppercase tracking-wider">Chronicle of Growth</h3>
            </div>
            <div className="space-y-4">
              {STORY_CHAPTERS.map((chap) => (
                <div key={chap.act} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-hud font-bold text-white/90">
                    <span>{chap.act}</span>
                    <span className="font-mono text-[8px] text-white/40">{chap.era}</span>
                  </div>
                  <h4 className="text-[11px] font-mythic italic text-[#fef08a]">{chap.title}</h4>
                  <p className="text-[10px] text-white/50 leading-relaxed font-sans">{chap.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. TOP-CENTER MINIMALIST COMPASS */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center">
        <div className="relative w-72 h-8 overflow-hidden flex items-center justify-center">
          {/* Compass Ribbon */}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-white/10" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#d4af37] rotate-45 z-10" />

          {COMPASS_CARDINALS.map((c) => {
            const diff = ((c.deg - telemetry.headingDeg + 540) % 360) - 180;
            if (Math.abs(diff) > 90) return null;
            const pct = 50 + (diff / 90) * 46;
            return (
              <div
                key={c.label}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `${pct}%` }}
              >
                <span
                  className={`font-hud text-[8px] tracking-[0.2em] font-bold ${
                    c.label === 'N' ? 'text-[#d4af37]' : 'text-white/40'
                  }`}
                >
                  {c.label}
                </span>
                <div className={`w-px h-1 mt-1 ${c.label === 'N' ? 'bg-[#d4af37]' : 'bg-white/10'}`} />
              </div>
            );
          })}
        </div>

        {/* Cinematic Region Discovery Callout */}
        {regionBannerText && !telemetry.bossAwakened && !engagedEnemy && (
          <div className="mt-4 flex flex-col items-center animate-fade-in">
            <span className="font-mythic italic text-xl text-[#fef08a] tracking-widest drop-shadow-lg">
              {regionBannerText.split('·')[0].trim()}
            </span>
            <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mt-1" />
            <span className="font-hud text-[8px] font-bold text-[#d4af37]/60 tracking-[0.3em] uppercase mt-1">
              REGION DISCOVERED
            </span>
          </div>
        )}

        {/* Transient Combat / Paraglider Callout */}
        {telemetry.combatCallout && (
          <div className="mt-0.5 lg:mt-2 px-3 lg:px-4 py-0.5 bg-gradient-to-r from-transparent via-[#090e1a]/90 to-transparent border-y border-[#d4af37]/50 font-hud text-[9px] lg:text-xs font-bold tracking-[0.14em] lg:tracking-[0.2em] uppercase text-[#fef08a] max-w-[260px] lg:max-w-[540px] truncate text-center">
            {telemetry.combatCallout}
          </div>
        )}

        {/* ENGAGED ENEMY HUD */}
        {engagedEnemy && (!telemetry.bossAwakened || telemetry.bossDefeated) && (
          <div
            data-testid="engaged-enemy-hud"
            className="mt-4 w-72 glass-panel p-3 space-y-1.5 rounded-lg border-[#f43f5e]/30"
          >
            <div className="flex items-center justify-between text-[8px] font-hud font-bold uppercase tracking-widest">
              <span className="text-[#fda4af] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" />
                {engagedEnemy.name}
              </span>
              <span className="font-mono text-white/60">
                {engagedEnemy.hp} / {engagedEnemy.maxHp}
              </span>
            </div>

            <div className="relative h-1.5 w-full bg-white/5 overflow-hidden rounded-full">
              <div
                className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-400"
                style={{ width: `${trailingEnemyPct}%` }}
              />
              <div
                className="relative h-full bg-gradient-to-r from-[#e11d48] to-[#fb7185] transition-all duration-100"
                style={{ width: `${enemyHpPct}%` }}
              />
            </div>
            
            <div className="h-[1px] w-full bg-white/5" />
            
            <div className="flex items-center justify-between text-[7px] font-mono uppercase text-white/40">
              <span>Posture</span>
              <span>{engagedEnemy.aiState}</span>
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

      {/* 3. TOP-RIGHT TACTICAL OVERLAY */}
      <div className="absolute top-6 right-8 flex flex-col items-end gap-3 pointer-events-auto">
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-lg px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
          {/* Time & Weather */}
          <button
            onClick={() => cycleTimeOfDay()}
            className="flex items-center gap-2 text-[10px] font-hud font-bold text-[#d4af37] uppercase tracking-widest hover:text-white transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
            {timeOfDay}
          </button>
          
          <span className="w-[1px] h-3 bg-white/10" />

          {/* Mute & Pause */}
          <div className="flex items-center gap-3">
            <button onClick={() => onToggleMute()} className="text-white/40 hover:text-[#d4af37] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2V15H6L11 19V5Z" />
                {muted ? <path d="M22 9L16 15M16 9L22 15" stroke="#f43f5e" /> : <path d="M15.5 8.5C16.8 9.8 16.8 14.2 15.5 15.5" />}
              </svg>
            </button>
            <button onClick={() => onTogglePause()} className="text-white/40 hover:text-[#d4af37] transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            </button>
          </div>
        </div>

        {/* Minimalist Tactical Radar */}
        {minimapVisible && (
          <div className="relative w-28 h-28 rounded-full glass-panel flex items-center justify-center overflow-hidden border-white/5 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/5 to-transparent animate-spin duration-[6000ms]" />
            <svg width="96" height="96" viewBox="-60 -60 120 120" className="relative z-10 opacity-60">
              <circle cx="0" cy="0" r="58" fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
              <circle cx="0" cy="0" r="30" fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
              <g transform={`rotate(${telemetry.headingDeg})`}>
                <path d="M0 -8 L 5 5 L 0 2 L -5 5 Z" fill="white" />
              </g>
              {PORTFOLIO_STOPS.map((s) => (
                <circle
                  key={s.id}
                  cx={s.position.x * 0.8}
                  cy={s.position.z * 0.8}
                  r="2.5"
                  fill={visitedStopIds.has(s.id) ? '#2dd4bf' : '#d4af37'}
                />
              ))}
            </svg>
          </div>
        )}

        {/* Style Rank */}
        {comboHits > 0 && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="text-right">
              <div className="font-hud text-[9px] font-bold text-[#fef08a] uppercase tracking-widest">{comboHits} Chain</div>
              <div className="font-mono text-[8px] text-[#2dd4bf] uppercase opacity-50">{comboTitle}</div>
            </div>
            <div className="w-10 h-10 glass-panel border-[#d4af37]/40 flex items-center justify-center rotate-45">
              <span className="-rotate-45 font-display text-lg font-bold text-[#fef08a]">{comboRank}</span>
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

      {/* 4. PROXIMITY ACTION PILLS */}
      {!activeStopId && gameState === 'playing' && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-2 z-20">
          {telemetry.nearStop && (
            <button
              onClick={() => onInspectStop(telemetry.nearStop!.id)}
              className="px-6 py-2 glass-panel border-[#d4af37]/40 text-[#f8f5ee] rounded-full animate-bounce-subtle"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center bg-[#d4af37] text-[#05070b] font-mono font-bold text-[10px] rounded">E</span>
                <span className="font-hud text-[11px] font-bold uppercase tracking-widest">Inspect {telemetry.nearStop.title}</span>
              </div>
            </button>
          )}

          {telemetry.nearHypoGuide && (
            <button
              onClick={() => onOpenHypoGuide?.()}
              className="px-6 py-2 glass-panel border-[#2dd4bf]/40 text-[#fef08a] rounded-full"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center bg-[#2dd4bf] text-[#05070b] font-mono font-bold text-[10px] rounded">E</span>
                <span className="font-hud text-[11px] font-bold uppercase tracking-widest">Talk to Hypo AI</span>
              </div>
            </button>
          )}

          {telemetry.nearRecruiterTemple && (
            <button
              onClick={() => onOpenRecruiterTemple?.()}
              className="px-6 py-2 glass-panel border-[#d4af37]/40 text-[#fef08a] rounded-full"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center bg-[#d4af37] text-[#05070b] font-mono font-bold text-[10px] rounded">E</span>
                <span className="font-hud text-[11px] font-bold uppercase tracking-widest">Temple of Opportunities</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* 5. BOTTOM VITALS BAR */}
      {gameState === 'playing' && !activeStopId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 w-full max-w-[400px]">
          {/* Vitals Container */}
          <div className="w-full glass-panel rounded-full px-5 py-2.5 border-white/5 flex items-center gap-4">
            {/* Sudarshana Medallion */}
            <div className="w-10 h-10 rounded-full glass-panel border-[#d4af37]/40 flex items-center justify-center shrink-0">
               <span className="font-hud text-[10px] font-bold text-[#fef08a]">{attackDmg}</span>
            </div>

            {/* Bars */}
            <div className="flex-1 flex flex-col gap-1.5">
              {/* HP Bar */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#e11d48] to-[#fb7185] transition-all duration-300"
                  style={{ width: `${pranaPct}%` }}
                />
              </div>
              {/* Stamina Bar */}
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#0d9488] to-[#2dd4bf] transition-all duration-150"
                  style={{ width: `${staminaPct}%` }}
                />
              </div>
            </div>

            {/* Weapon Indicator */}
            <div className="text-right shrink-0">
               <div className="font-hud text-[8px] font-bold text-[#38bdf8] uppercase tracking-widest">Weapon</div>
               <div className="font-mono text-[9px] text-white/80">{telemetry.equippedWeaponName?.split(' ')[0] || 'Nandaka'}</div>
            </div>
          </div>
        </div>
      )}

      {/* 5B. WEAPON SELECTION LEGEND */}
      {gameState === 'playing' && !activeStopId && (
        <aside className="fixed right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 w-48">
          <div className="flex items-center justify-between px-2 border-b border-white/5 pb-1">
            <span className="font-hud text-[9px] font-bold tracking-widest uppercase text-white/40">Armory</span>
            <span className="font-mono text-[8px] text-[#38bdf8]">KEYS [1-4]</span>
          </div>

          <div className="flex flex-col gap-1">
            {FORGE_WEAPONS.map((w, idx) => {
              const active = equippedWeaponId === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => onEquipWeapon?.(w.id)}
                  className={`group relative flex items-center gap-3 p-2 rounded transition-all border ${
                    active 
                      ? 'glass-panel border-[#d4af37] bg-[#d4af37]/10' 
                      : 'bg-white/5 border-transparent hover:border-white/10'
                  }`}
                >
                  <span className={`font-mono text-[9px] ${active ? 'text-[#d4af37]' : 'text-white/20'}`}>0{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[10px] font-hud font-bold uppercase truncate ${active ? 'text-white' : 'text-white/60'}`}>
                      {w.name}
                    </div>
                  </div>
                  {active && <div className="w-1 h-1 rounded-full bg-[#d4af37] animate-pulse" />}
                </button>
              );
            })}
          </div>

          {/* Lightning Power */}
          <button
            onClick={() => onTriggerLightningBolt?.()}
            className={`mt-2 p-2 rounded border flex items-center gap-3 transition-all ${
              visitedStopIds.size >= 6 
                ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8] animate-hud-pulse' 
                : 'bg-white/5 border-transparent text-white/20'
            }`}
          >
            <span className="font-mono text-[9px]">Z</span>
            <span className="font-hud text-[10px] font-bold uppercase tracking-widest">
              {visitedStopIds.size >= 6 ? 'Indra Bolt' : 'Indra Locked'}
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

      {/* 7. GAME OVER / PLAYER DIED FULL-SCREEN MODAL */}
      {(gameState === 'gameover' || gameState === 'player_died') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-md pointer-events-auto">
          <div className="w-full max-w-xl text-center space-y-10 animate-fade-in-slow">
             <div className="space-y-4">
                <h2 className={`font-mythic text-4xl lg:text-6xl tracking-[0.25em] uppercase ${gameState === 'gameover' ? 'text-[#fef08a] neon-glow-yellow' : 'text-[#f43f5e] neon-glow-red'}`}>
                  {gameState === 'gameover' ? 'MAHA-ASURA VANQUISHED' : 'PRANA EXTINGUISHED'}
                </h2>
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <p className="font-hud text-xs lg:text-sm text-white/50 tracking-[0.2em] uppercase">
                   {gameState === 'gameover' 
                     ? 'You have overcome the Colossal Layoff and reclaimed the valley.' 
                     : 'The Workforce Reduction was too great. Return to the Sankalpa to begin anew.'}
                </p>
             </div>

             <div className="grid grid-cols-2 gap-4 py-8 border-y border-white/5">
                <div className="space-y-1">
                   <div className="text-[10px] font-mono text-white/30 uppercase">Projects Seen</div>
                   <div className="font-mythic text-2xl text-white">{visitedStopIds.size}/6</div>
                </div>
                <div className="space-y-1">
                   <div className="text-[10px] font-mono text-white/30 uppercase">Jewels Collected</div>
                   <div className="font-mythic text-2xl text-white">{collectedRelicIds.size}/5</div>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                <button
                   onClick={() => onRestartFromBeginning()}
                   className="px-10 py-3 glass-button font-mythic text-sm tracking-[0.2em] uppercase text-white hover:scale-105 active:scale-95 transition-all"
                >
                   Retry Journey
                </button>
                <button
                   onClick={() => onReturnToTitle()}
                   className="px-10 py-3 text-white/40 hover:text-white font-hud text-[11px] tracking-[0.3em] uppercase transition-colors"
                >
                   Return to Title
                </button>
             </div>
          </div>
        </div>
      )}

      {/* 8. PAUSE FULL-SCREEN MODAL */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-sm text-center space-y-8 animate-fade-in">
             <div className="space-y-2">
                <h2 className="font-mythic text-3xl tracking-[0.2em] uppercase text-white">PAUSED</h2>
                <div className="h-[1px] w-24 mx-auto bg-[#d4af37]/40" />
             </div>

             <nav className="flex flex-col gap-3">
                <button 
                  onClick={() => onTogglePause()}
                  className="w-full py-4 glass-panel border-[#d4af37]/20 hover:bg-[#d4af37]/10 text-white font-mythic text-sm tracking-[0.2em] uppercase transition-all"
                >
                  Resume
                </button>
                <button 
                  onClick={() => onResetSpawn()}
                  className="w-full py-3 bg-white/5 border border-white/10 text-white/60 hover:text-white font-hud text-[10px] tracking-[0.2em] uppercase transition-all"
                >
                  Reset to Spawn
                </button>
                <button 
                  onClick={() => onReturnToTitle()}
                  className="w-full py-3 text-white/30 hover:text-white font-hud text-[9px] tracking-[0.2em] uppercase transition-colors"
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
