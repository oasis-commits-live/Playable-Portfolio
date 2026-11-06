/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { PORTFOLIO_STOPS, LotusRelic } from './data/portfolioStops';
import { TimeOfDay } from './game/proceduralScene';
import { getNextWeatherPreset, resolveWeatherProfile, WeatherPresetId } from './game/weatherSystem';
import { sound } from './game/sound';
import { WorldCanvas, WorldControllerRef } from './components/WorldCanvas';
import { TitleScreen } from './components/TitleScreen';
import { HudOverlay, HudTelemetry } from './components/HudOverlay';
import { StopModal } from './components/StopModal';
import { HypoGuideModal } from './components/HypoGuideModal';
import { RecruiterTempleModal } from './components/RecruiterTempleModal';
import { LandscapeOrientationGate } from './components/MobileRpgPad';
import { db } from './firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

export type GameMode = 'portfolio' | 'survival';

export default function App() {
  const [gameState, setGameState] = useState<
    'title' | 'playing' | 'paused' | 'gameover' | 'player_died'
  >(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'playing';
      }
    }
    return 'title';
  });

  const [gameMode, setGameMode] = useState<GameMode>('portfolio');
  const [survivalWave, setSurvivalWave] = useState(1);
  const [survivalScore, setSurvivalScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number; wave: number }[]>([]);

  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [visitedStopIds, setVisitedStopIds] = useState<Set<string>>(() => new Set());
  const [collectedRelicIds, setCollectedRelicIds] = useState<Set<string>>(() => new Set());
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('dawn');
  const [weatherPreset, setWeatherPreset] = useState<WeatherPresetId>('auto');
  const [muted, setMuted] = useState(false);
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [recentRelicToast, setRecentRelicToast] = useState<string | null>(null);
  const [bossAnnounced, setBossAnnounced] = useState(false);
  const [hypoGuideOpen, setHypoGuideOpen] = useState(false);
  const [recruiterTempleOpen, setRecruiterTempleOpen] = useState(false);

  const [dispatchedScrolls, setDispatchedScrolls] = useState<
    { sender: string; organization: string; message: string; timestamp: string }[]
  >([
    {
      sender: 'CFO Advisory Partner',
      organization: 'Hyperbots Inc.',
      message:
        'Commending the 0→1 design of the 80% STP Invoice Co-Pilot, Payments Co-Pilot, and HyperLM Vera CFO Workspace.',
      timestamp: 'Verified Case Study',
    },
  ]);

  const [telemetry, setTelemetry] = useState<HudTelemetry>({
    x: 0,
    z: 8.2,
    headingDeg: 0,
    regionName: 'Meru Lookout · Great Plateau Terrace',
    nearStop: null,
    nearDistance: 24,
    distanceTraveled: 0,
  });

  const controllerRef = useRef<WorldControllerRef | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string, duration = 3800) => {
    setRecentRelicToast(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setRecentRelicToast(null);
    }, duration);
  }, []);

  // Mirror game state to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = gameState;
    document.body.dataset.mode = gameMode;
  }, [gameState, gameMode]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const entries = querySnapshot.docs.map(doc => doc.data() as { name: string; score: number; wave: number });
      setLeaderboard(entries);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, []);

  useEffect(() => {
    if (gameState === 'title') {
      fetchLeaderboard();
    }
  }, [gameState, fetchLeaderboard]);

  const saveSurvivalScore = useCallback(async (name: string, score: number, wave: number) => {
    try {
      await addDoc(collection(db, 'leaderboard'), {
        name,
        score,
        wave,
        timestamp: serverTimestamp(),
      });
      fetchLeaderboard();
    } catch (err) {
      console.error('Failed to save score:', err);
    }
  }, [fetchLeaderboard]);

  // Announce that the Boss Challenge Circle & Sky-Lightning Bolt are unlocked once all 6 Project Scrolls are viewed (without auto-spawning the boss!)
  useEffect(() => {
    if (
      !bossAnnounced &&
      visitedStopIds.size >= PORTFOLIO_STOPS.length &&
      !activeStopId
    ) {
      setBossAnnounced(true);
      sound.playRelicChime(true);
      showToast(
        '⚔ ALL 6 PROJECTS SEEN! Go to the Northern Challenge Circle & press [E] or [B] to challenge the Layoff Boss with [Z] ⚡ SKY-LIGHTNING!',
        7500
      );
    }
  }, [visitedStopIds, activeStopId, bossAnnounced, showToast]);

  const handleStartFromTitle = useCallback((mode: GameMode = 'portfolio') => {
    setGameMode(mode);
    setSurvivalWave(1);
    setSurvivalScore(0);
    document.body.dataset.state = 'playing';
    setGameState('playing');
    sound.playTempleBell(432);
  }, []);

  const handleInspectStop = useCallback(
    (stopId: string) => {
      setHypoGuideOpen(false);
      setRecruiterTempleOpen(false);
      setActiveStopId(stopId);
      setVisitedStopIds((prev) => {
        if (prev.has(stopId)) return prev;
        const next = new Set(prev);
        next.add(stopId);
        const stopObj = PORTFOLIO_STOPS.find((s) => s.id === stopId);
        if (stopObj) {
          if (next.size >= PORTFOLIO_STOPS.length) {
            showToast(
              `⚔ 6/6 PROJECTS SEEN! BOSS CHALLENGE CIRCLE & [Z] ⚡ SKY-LIGHTNING UNLOCKED — Head to the Northern Citadel to challenge the Layoff Boss!`,
              6500
            );
          } else {
            showToast(
              `Astra Power Awakened (${next.size}/6): ${stopObj.unlockedPower.name} (+${stopObj.unlockedPower.bonusDamage} ATK)`
            );
          }
        }
        return next;
      });
      sound.playTempleBell(432);
    },
    [showToast]
  );

  const handleCloseStop = useCallback(() => {
    setActiveStopId(null);
  }, []);

  const handleTeleportToStop = useCallback(
    (stopId: string) => {
      controllerRef.current?.teleportToStop(stopId);
      handleInspectStop(stopId);
    },
    [handleInspectStop]
  );

  const handleCollectRelic = useCallback(
    (relic: LotusRelic) => {
      setCollectedRelicIds((prev) => {
        if (prev.has(relic.id)) return prev;
        const next = new Set(prev);
        next.add(relic.id);
        return next;
      });
      sound.playRelicChime(false);
      showToast(`${relic.company} (${relic.era}) — ${relic.meaning}`);
    },
    [showToast]
  );

  const handleBossDefeated = useCallback(() => {
    setActiveStopId(null);
    setHypoGuideOpen(false);
    setRecruiterTempleOpen(false);
    setGameState('gameover');
  }, []);

  const handlePlayerDied = useCallback(() => {
    setActiveStopId(null);
    setHypoGuideOpen(false);
    setRecruiterTempleOpen(false);
    setGameState('player_died');
  }, []);

  const handleRestartFromBeginning = useCallback(() => {
    setActiveStopId(null);
    setHypoGuideOpen(false);
    setRecruiterTempleOpen(false);
    setVisitedStopIds(new Set());
    setCollectedRelicIds(new Set());
    setBossAnnounced(false);
    controllerRef.current?.restartFromBeginning();
    setGameState('playing');
  }, []);

  const handleChangeTimeOfDay = useCallback(
    (mode: TimeOfDay) => {
      setTimeOfDay(mode);
      controllerRef.current?.setTimeOfDay(mode);
      const profile = resolveWeatherProfile(mode, weatherPreset);
      showToast(
        `Atmosphere: ${mode === 'twilight' ? 'Dusk' : mode.toUpperCase()} · ${profile.title} (${profile.subtitle})`,
        3200
      );
    },
    [weatherPreset, showToast]
  );

  const handleChangeWeatherPreset = useCallback(
    (preset: WeatherPresetId) => {
      setWeatherPreset(preset);
      controllerRef.current?.setWeatherPreset(preset);
      const profile = resolveWeatherProfile(timeOfDay, preset);
      showToast(
        `Weather System: ${profile.title} (${
          preset === 'auto' ? 'Auto Time-Synced' : 'Manual Mode'
        })`,
        3200
      );
    },
    [timeOfDay, showToast]
  );

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      sound.muted = next;
      return next;
    });
  }, []);

  const handleTogglePause = useCallback(() => {
    if (hypoGuideOpen) {
      setHypoGuideOpen(false);
      return;
    }
    if (recruiterTempleOpen) {
      setRecruiterTempleOpen(false);
      return;
    }
    setActiveStopId(null);
    setGameState((prev) => {
      if (prev === 'playing') return 'paused';
      if (prev === 'paused') return 'playing';
      return prev;
    });
  }, [hypoGuideOpen, recruiterTempleOpen]);

  const handleResetSpawn = useCallback(() => {
    setActiveStopId(null);
    setHypoGuideOpen(false);
    setRecruiterTempleOpen(false);
    controllerRef.current?.resetToSpawn();
  }, []);

  const handleReturnToTitle = useCallback(() => {
    setActiveStopId(null);
    setHypoGuideOpen(false);
    setRecruiterTempleOpen(false);
    setGameState('title');
  }, []);

  const handleResumeFromMastery = useCallback(() => {
    setGameState('playing');
  }, []);

  const handleOpenHypoGuide = useCallback(() => {
    setActiveStopId(null);
    setRecruiterTempleOpen(false);
    sound.playHypoVoiceChime();
    setHypoGuideOpen(true);
  }, []);

  const handleOpenRecruiterTemple = useCallback(() => {
    setActiveStopId(null);
    setHypoGuideOpen(false);
    sound.playTempleBell(528);
    setRecruiterTempleOpen(true);
  }, []);

  const handleDispatchScroll = useCallback(
    (entry: { sender: string; organization: string; message: string }) => {
      sound.playRelicChime(true);
      setDispatchedScrolls((prev) => [
        {
          ...entry,
          timestamp: 'Just Sealed',
        },
        ...prev,
      ]);
    },
    []
  );

  // Global keyboard shortcut for Mute [M]
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      if (e.code === 'KeyM') {
        handleToggleMute();
      } else if (e.code === 'KeyN') {
        const order: TimeOfDay[] = ['dawn', 'noon', 'twilight'];
        const nextMode = order[(order.indexOf(timeOfDay) + 1) % order.length];
        handleChangeTimeOfDay(nextMode);
      } else if (e.code === 'KeyG') {
        const nextPreset = getNextWeatherPreset(weatherPreset);
        handleChangeWeatherPreset(nextPreset);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleToggleMute, timeOfDay, weatherPreset, handleChangeTimeOfDay, handleChangeWeatherPreset]);

  const activeStop = activeStopId
    ? PORTFOLIO_STOPS.find((s) => s.id === activeStopId) || null
    : null;
  const anyOverlayOpen =
    activeStopId || (recruiterTempleOpen ? 'modal-open' : null);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#080b12] select-none">
      {/* Persistent Isolated WebGL 3D World Viewport */}
      <WorldCanvas
        gameState={gameState}
        activeStopId={anyOverlayOpen}
        visitedStopIds={visitedStopIds}
        collectedRelicIds={collectedRelicIds}
        gameMode={gameMode}
        onTelemetryUpdate={setTelemetry}
        onInspectStop={handleInspectStop}
        onCloseStop={() => {
          handleCloseStop();
          setHypoGuideOpen(false);
          setRecruiterTempleOpen(false);
        }}
        onCollectRelic={handleCollectRelic}
        onBossDefeated={handleBossDefeated}
        onPlayerDied={handlePlayerDied}
        onTogglePause={handleTogglePause}
        onStartFromTitle={handleStartFromTitle}
        onGamepadStatusChange={setGamepadConnected}
        onOpenRecruiterTemple={handleOpenRecruiterTemple}
        onOpenHypoGuide={handleOpenHypoGuide}
        controllerRef={controllerRef}
      />

      {/* Title Screen Stage (Live 3D Spline Camera Tour in Background) */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartFromTitle}
          onInspectProject={(stopId) => {
            handleStartFromTitle('portfolio');
            handleTeleportToStop(stopId);
          }}
          leaderboard={leaderboard}
          gamepadConnected={gamepadConnected}
        />
      )}

      {/* Playing / Paused / Mastery / Player Died HUD Shell */}
      {gameState !== 'title' && (
        <HudOverlay
          gameState={gameState}
          gameMode={gameMode}
          telemetry={telemetry}
          visitedStopIds={visitedStopIds}
          collectedRelicIds={collectedRelicIds}
          activeStopId={anyOverlayOpen}
          timeOfDay={timeOfDay}
          weatherPreset={weatherPreset}
          muted={muted}
          gamepadConnected={gamepadConnected}
          recentRelicToast={recentRelicToast}
          onInspectStop={handleInspectStop}
          onTeleportToStop={handleTeleportToStop}
          onTeleportToPoint={(x, z, label) => controllerRef.current?.teleportToPoint(x, z, label)}
          onEquipWeapon={(weaponId) => controllerRef.current?.equipWeapon(weaponId)}
          onSelectGuidanceTarget={(id, kind) => controllerRef.current?.setGuidanceTarget(id, kind)}
          onTriggerAttack={(isNova) => controllerRef.current?.triggerAttack(isNova)}
          onTriggerLightningBolt={() => controllerRef.current?.triggerLightningBolt()}
          onTriggerParry={() => controllerRef.current?.triggerParryDeflect()}
          onTriggerDash={() => controllerRef.current?.triggerDodgeDash()}
          onTriggerGrapple={() => controllerRef.current?.triggerGrappleHook()}
          onSummonLayoffBoss={() => controllerRef.current?.summonLayoffBoss()}
          onChangeTimeOfDay={handleChangeTimeOfDay}
          onChangeWeatherPreset={handleChangeWeatherPreset}
          onToggleMute={handleToggleMute}
          onTogglePause={handleTogglePause}
          onResetSpawn={handleResetSpawn}
          onRestartFromBeginning={handleRestartFromBeginning}
          onReturnToTitle={handleReturnToTitle}
          onSaveScore={saveSurvivalScore}
          onResumeFromMastery={handleResumeFromMastery}
          onVirtualMove={(f, r) => controllerRef.current?.setVirtualInput(f, r)}
          onVirtualJump={() => controllerRef.current?.triggerVirtualJump()}
          onOpenRecruiterTemple={handleOpenRecruiterTemple}
          onOpenHypoGuide={handleOpenHypoGuide}
        />
      )}

      {/* Active Monument Ancient Royal Scroll Modal */}
      {activeStop && gameState === 'playing' && (
        <StopModal
          stop={activeStop}
          onClose={handleCloseStop}
          onSelectStop={handleTeleportToStop}
          visitedStopIds={visitedStopIds}
          dispatchedScrolls={dispatchedScrolls}
          onDispatchScroll={handleDispatchScroll}
        />
      )}

      {/* Interactive Conversational Hypo AI Companion Dock */}
      <HypoGuideModal
        isOpen={hypoGuideOpen && gameState === 'playing'}
        visitedStopIds={visitedStopIds}
        collectedRelicIds={collectedRelicIds}
        aliveDemonsCount={telemetry.aliveDemonsCount ?? 6}
        bossDefeated={Boolean(telemetry.bossDefeated)}
        onClose={() => setHypoGuideOpen(false)}
        onTeleportToStop={handleTeleportToStop}
        onTeleportToPoint={(x, z, label) => controllerRef.current?.teleportToPoint(x, z, label)}
        onOpenRecruiterTemple={handleOpenRecruiterTemple}
        onEquipWeapon={(weaponId) => controllerRef.current?.equipWeapon(weaponId)}
        onSelectGuidanceTarget={(id, kind) => {
          if (id && kind) controllerRef.current?.setGuidanceTarget(id, kind);
        }}
      />

      {/* Southern Sankalpa Mandapa — Recruiter & Opportunity Temple Modal */}
      <RecruiterTempleModal
        isOpen={recruiterTempleOpen && gameState === 'playing'}
        onClose={() => setRecruiterTempleOpen(false)}
        dispatchedScrolls={dispatchedScrolls}
        onDispatchScroll={handleDispatchScroll}
      />

      {/* Mobile Landscape-Only Orientation Enforcement Gate */}
      <LandscapeOrientationGate />
    </main>
  );
}
