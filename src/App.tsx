/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { PORTFOLIO_STOPS, LOTUS_RELICS, LotusRelic } from './data/portfolioStops';
import { TimeOfDay } from './game/proceduralScene';
import { getNextWeatherPreset, resolveWeatherProfile, WeatherPresetId } from './game/weatherSystem';
import { sound } from './game/sound';
import { WorldCanvas, WorldControllerRef } from './components/WorldCanvas';
import { TitleScreen } from './components/TitleScreen';
import { HudOverlay, HudTelemetry } from './components/HudOverlay';
import { StopModal } from './components/StopModal';
import { LandscapeOrientationGate } from './components/MobileRpgPad';

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

  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [visitedStopIds, setVisitedStopIds] = useState<Set<string>>(() => new Set());
  const [collectedRelicIds, setCollectedRelicIds] = useState<Set<string>>(() => new Set());
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('dawn');
  const [weatherPreset, setWeatherPreset] = useState<WeatherPresetId>('auto');
  const [muted, setMuted] = useState(false);
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [recentRelicToast, setRecentRelicToast] = useState<string | null>(null);
  const [bossAnnounced, setBossAnnounced] = useState(false);

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
  }, [gameState]);

  // Announce the Sky-Lightning Bolt & Layoff Boss awakening once all 6 Project Scrolls are viewed
  useEffect(() => {
    if (
      !bossAnnounced &&
      visitedStopIds.size >= PORTFOLIO_STOPS.length &&
      !activeStopId
    ) {
      setBossAnnounced(true);
      sound.playBossAwaken();
      showToast(
        '⚡ ALL 6 PROJECTS SEEN! SUPER POWER UNLOCKED: Press [Z] to call down INDRA SKY-LIGHTNING BOLT & vanquish the Layoff Monster [B]!',
        7000
      );
    }
  }, [visitedStopIds, activeStopId, bossAnnounced, showToast]);

  const handleStartFromTitle = useCallback(() => {
    document.body.dataset.state = 'playing';
    setGameState('playing');
    sound.playTempleBell(432);
  }, []);

  const handleInspectStop = useCallback(
    (stopId: string) => {
      setActiveStopId(stopId);
      setVisitedStopIds((prev) => {
        if (prev.has(stopId)) return prev;
        const next = new Set(prev);
        next.add(stopId);
        const stopObj = PORTFOLIO_STOPS.find((s) => s.id === stopId);
        if (stopObj) {
          if (next.size >= PORTFOLIO_STOPS.length) {
            showToast(
              `⚡ 6/6 PROJECTS SEEN! SUPER POWER UNLOCKED: INDRA VAJRA SKY-LIGHTNING BOLT [Press Z]!`,
              5500
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
    setGameState('gameover');
  }, []);

  const handlePlayerDied = useCallback(() => {
    setActiveStopId(null);
    setGameState('player_died');
  }, []);

  const handleRestartFromBeginning = useCallback(() => {
    setActiveStopId(null);
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
    setActiveStopId(null);
    setGameState((prev) => {
      if (prev === 'playing') return 'paused';
      if (prev === 'paused') return 'playing';
      return prev;
    });
  }, []);

  const handleResetSpawn = useCallback(() => {
    setActiveStopId(null);
    controllerRef.current?.resetToSpawn();
  }, []);

  const handleReturnToTitle = useCallback(() => {
    setActiveStopId(null);
    setGameState('title');
  }, []);

  const handleResumeFromMastery = useCallback(() => {
    setGameState('playing');
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

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#080b12] select-none">
      {/* Persistent Isolated WebGL 3D World Viewport */}
      <WorldCanvas
        gameState={gameState}
        activeStopId={activeStopId}
        visitedStopIds={visitedStopIds}
        collectedRelicIds={collectedRelicIds}
        onTelemetryUpdate={setTelemetry}
        onInspectStop={handleInspectStop}
        onCloseStop={handleCloseStop}
        onCollectRelic={handleCollectRelic}
        onBossDefeated={handleBossDefeated}
        onPlayerDied={handlePlayerDied}
        onTogglePause={handleTogglePause}
        onStartFromTitle={handleStartFromTitle}
        onGamepadStatusChange={setGamepadConnected}
        controllerRef={controllerRef}
      />

      {/* Title Screen Stage (Live 3D Spline Camera Tour in Background) */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartFromTitle}
          onInspectProject={(stopId) => {
            handleStartFromTitle();
            handleTeleportToStop(stopId);
          }}
          gamepadConnected={gamepadConnected}
        />
      )}

      {/* Playing / Paused / Mastery / Player Died HUD Shell */}
      {gameState !== 'title' && (
        <HudOverlay
          gameState={gameState}
          telemetry={telemetry}
          visitedStopIds={visitedStopIds}
          collectedRelicIds={collectedRelicIds}
          activeStopId={activeStopId}
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
          onResumeFromMastery={handleResumeFromMastery}
          onVirtualMove={(f, r) => controllerRef.current?.setVirtualInput(f, r)}
          onVirtualJump={() => controllerRef.current?.triggerVirtualJump()}
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

      {/* Mobile Landscape-Only Orientation Enforcement Gate */}
      <LandscapeOrientationGate />
    </main>
  );
}
