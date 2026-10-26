/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { PORTFOLIO_STOPS, LOTUS_RELICS, LotusRelic } from './data/portfolioStops';
import { TimeOfDay } from './game/proceduralScene';
import { sound } from './game/sound';
import { WorldCanvas, WorldControllerRef } from './components/WorldCanvas';
import { TitleScreen } from './components/TitleScreen';
import { HudOverlay, HudTelemetry } from './components/HudOverlay';
import { StopModal } from './components/StopModal';

export default function App() {
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>(() => {
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

  // Announce the Layoff Boss awakening once all 6 Project Scrolls and 5 Career Relics are viewed
  useEffect(() => {
    if (
      !bossAnnounced &&
      visitedStopIds.size >= PORTFOLIO_STOPS.length &&
      collectedRelicIds.size >= LOTUS_RELICS.length &&
      !activeStopId
    ) {
      setBossAnnounced(true);
      sound.playBossAwaken();
      showToast(
        'ALL 6 PROJECT POWERS & 5 RELICS AWAKENED! Fight "THE SEPTEMBER LAYOFF" Boss in the Northern Citadel [Press B]!',
        6500
      );
    }
  }, [visitedStopIds, collectedRelicIds, activeStopId, bossAnnounced, showToast]);

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
          showToast(
            `Astra Power Awakened: ${stopObj.unlockedPower.name} (+${stopObj.unlockedPower.bonusDamage} ATK)`
          );
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

  const handleTeleportToStop = useCallback((stopId: string) => {
    controllerRef.current?.teleportToStop(stopId);
  }, []);

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

  const handleChangeTimeOfDay = useCallback((mode: TimeOfDay) => {
    setTimeOfDay(mode);
    controllerRef.current?.setTimeOfDay(mode);
  }, []);

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
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleToggleMute]);

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
        onTogglePause={handleTogglePause}
        onStartFromTitle={handleStartFromTitle}
        onGamepadStatusChange={setGamepadConnected}
        controllerRef={controllerRef}
      />

      {/* Title Screen Stage (Live 3D Spline Camera Tour in Background) */}
      {gameState === 'title' && (
        <TitleScreen onStart={handleStartFromTitle} gamepadConnected={gamepadConnected} />
      )}

      {/* Playing / Paused / Mastery HUD Shell */}
      {gameState !== 'title' && (
        <HudOverlay
          gameState={gameState}
          telemetry={telemetry}
          visitedStopIds={visitedStopIds}
          collectedRelicIds={collectedRelicIds}
          activeStopId={activeStopId}
          timeOfDay={timeOfDay}
          muted={muted}
          gamepadConnected={gamepadConnected}
          recentRelicToast={recentRelicToast}
          onInspectStop={handleInspectStop}
          onTeleportToStop={handleTeleportToStop}
          onTeleportToPoint={(x, z, label) => controllerRef.current?.teleportToPoint(x, z, label)}
          onEquipWeapon={(weaponId) => controllerRef.current?.equipWeapon(weaponId)}
          onSelectGuidanceTarget={(id, kind) => controllerRef.current?.setGuidanceTarget(id, kind)}
          onTriggerAttack={(isNova) => controllerRef.current?.triggerAttack(isNova)}
          onTriggerParry={() => controllerRef.current?.triggerParryDeflect()}
          onTriggerDash={() => controllerRef.current?.triggerDodgeDash()}
          onTriggerGrapple={() => controllerRef.current?.triggerGrappleHook()}
          onSummonLayoffBoss={() => controllerRef.current?.summonLayoffBoss()}
          onChangeTimeOfDay={handleChangeTimeOfDay}
          onToggleMute={handleToggleMute}
          onTogglePause={handleTogglePause}
          onResetSpawn={handleResetSpawn}
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
    </main>
  );
}
