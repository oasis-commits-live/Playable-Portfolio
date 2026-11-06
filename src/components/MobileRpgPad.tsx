import React, { useCallback, useEffect, useRef, useState } from 'react';

interface LandscapeGateProps {
  children?: React.ReactNode;
}

/**
 * Enforces Landscape-Only mode on mobile/tablet viewports (when height > width and width < 1024).
 * Provides one-tap Fullscreen + Screen Orientation Lock API support and a manual simulation override
 * so users in locked portrait webviews or desktop narrow test panes are never permanently blocked.
 */
export const LandscapeOrientationGate: React.FC<LandscapeGateProps> = () => {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [bypassLock, setBypassLock] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Portrait orientation on mobile / tablet widths
      setIsPortraitMobile(h > w && w < 1024);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleRequestLandscapeFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      const scrOrientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: string) => Promise<void>;
      };
      if (scrOrientation && typeof scrOrientation.lock === 'function') {
        await scrOrientation.lock('landscape');
      }
    } catch {
      // If browser blocks fullscreen/orientation lock, allow immediate landscape UI continuation
      setBypassLock(true);
    }
  };

  if (!isPortraitMobile || bypassLock) return null;

  return (
    <div
      data-testid="landscape-orientation-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="landscape-gate-title"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#04070e]/98 backdrop-blur-xl text-center select-none pointer-events-auto"
    >
      {/* Sacred Mandala Background Rings */}
      <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
        <svg
          width="128"
          height="128"
          viewBox="0 0 128 128"
          className="absolute inset-0 w-full h-full animate-spin"
          style={{ animationDuration: '18s' }}
          aria-hidden="true"
        >
          <circle
            cx="64"
            cy="64"
            r="58"
            fill="none"
            stroke="#d4af37"
            strokeWidth="1.2"
            strokeDasharray="6 4"
            strokeOpacity="0.45"
          />
          <polygon
            points="64,10 118,64 64,118 10,64"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1"
            strokeOpacity="0.3"
          />
        </svg>

        {/* Animated Rotating Mobile Device Icon (Portrait -> Landscape) */}
        <div className="relative flex items-center justify-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            className="text-[#d4af37] transition-transform duration-700 -rotate-90"
            aria-hidden="true"
          >
            <rect
              x="18"
              y="8"
              width="28"
              height="48"
              rx="4"
              stroke="#d4af37"
              strokeWidth="2.5"
              fill="rgba(212, 175, 55, 0.12)"
            />
            <circle cx="32" cy="50" r="2" fill="#2dd4bf" />
            <line x1="27" y1="13" x2="37" y2="13" stroke="#d4af37" strokeWidth="1.8" strokeLinecap="round" />
            <path
              d="M48 20C53 25 53 39 48 44"
              stroke="#2dd4bf"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <polygon points="46,46 52,44 48,39" fill="#2dd4bf" />
          </svg>
        </div>
      </div>

      <div className="max-w-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0b1324] border border-[#d4af37]/40 font-hud text-[11px] font-bold tracking-[0.24em] uppercase text-[#d4af37]">
          <span className="w-1.5 h-1.5 rotate-45 bg-[#2dd4bf]" />
          <span>MOBILE ACTION-RPG · WIDESCREEN ONLY</span>
        </div>

        <h2
          id="landscape-gate-title"
          className="font-display text-2xl font-extrabold tracking-tight text-[#f8f5ee]"
        >
          ROTATE DEVICE TO LANDSCAPE
        </h2>

        <p className="font-sans text-xs text-[#cbd5e1] leading-relaxed">
          <strong className="text-[#fde68a]">Portfolio Verse</strong> is architected as a widescreen
          3D Action-RPG with dual-thumb on-screen controls. Please rotate your phone horizontally to
          unlock the Virtual Thumbstick, Radial Combat Wheel, and Sanctum Codex.
        </p>

        <div className="pt-4 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleRequestLandscapeFullscreen}
            className="w-full py-3 px-5 clip-blade-right bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#b48628] text-[#05070b] font-hud font-bold text-xs tracking-[0.2em] uppercase cursor-pointer shadow-[0_10px_30px_rgba(212,175,55,0.35)] active:scale-95 transition-transform"
          >
            AUTO-LOCK LANDSCAPE FULLSCREEN →
          </button>

          <button
            type="button"
            onClick={() => setBypassLock(true)}
            className="w-full py-2 px-4 border border-[#d4af37]/35 bg-[#090f1d] text-[#94a3b8] hover:text-white font-mono text-[10px] tracking-[0.16em] uppercase cursor-pointer"
          >
            CONTINUE WITHOUT ROTATION LOCK
          </button>
        </div>
      </div>
    </div>
  );
};

interface MobileRpgControlPadProps {
  onVirtualMove: (forward: number, right: number) => void;
  onVirtualJump: () => void;
  onTriggerAttack: (isNova?: boolean) => void;
  onTriggerLightningBolt?: () => void;
  onTriggerParry: () => void;
  onTriggerDash?: () => void;
  onTriggerGrapple: () => void;
  onInteractContext?: () => void;
  contextActionLabel?: string | null;
  comboStage?: 1 | 2 | 3;
  grappleAvailable?: boolean;
  isGliding?: boolean;
  lightningUnlocked?: boolean;
  unlockedProjectsCount?: number;
}

/**
 * AAA Mobile Action-RPG Dual-Thumb On-Screen Control Pad:
 * - Left Thumb Zone: 360° Virtual Analog Thumbstick + 4-Way Tactical D-Pad Ring
 * - Right Thumb Zone: Radial Combat & Traversal Wheel (Primary Slash + Arc of Parry, Dash, Jump/Glide, Nova, Lightning Bolt, Grapple & Context Action)
 */
export const MobileRpgControlPad: React.FC<MobileRpgControlPadProps> = ({
  onVirtualMove,
  onVirtualJump,
  onTriggerAttack,
  onTriggerLightningBolt,
  onTriggerParry,
  onTriggerDash,
  onTriggerGrapple,
  onInteractContext,
  contextActionLabel,
  comboStage = 1,
  grappleAvailable = false,
  isGliding = false,
  lightningUnlocked = false,
  unlockedProjectsCount = 0,
}) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingStick, setIsDraggingStick] = useState(false);
  const [activeDpadDir, setActiveDpadDir] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  const maxRadius = 38;

  const updateStickFromClientXY = useCallback(
    (clientX: number, clientY: number) => {
      const el = padRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      const clampedDist = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);
      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      setKnobOffset({ x: kx, y: ky });

      // Normalize to [-1, 1]; screen -Y is forward (+1), screen +X is right (+1)
      const normRight = clampedDist > 5 ? kx / maxRadius : 0;
      const normForward = clampedDist > 5 ? -ky / maxRadius : 0;
      onVirtualMove(normForward, normRight);
    },
    [onVirtualMove]
  );

  const resetStick = useCallback(() => {
    activePointerIdRef.current = null;
    setIsDraggingStick(false);
    setKnobOffset({ x: 0, y: 0 });
    onVirtualMove(0, 0);
  }, [onVirtualMove]);

  const handleStickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointerIdRef.current = e.pointerId;
    setIsDraggingStick(true);
    updateStickFromClientXY(e.clientX, e.clientY);
  };

  const handleStickPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    updateStickFromClientXY(e.clientX, e.clientY);
  };

  const handleStickPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    resetStick();
  };

  const handleDpadPress = (
    dir: 'up' | 'down' | 'left' | 'right',
    forward: number,
    right: number,
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    setActiveDpadDir(dir);
    setKnobOffset({ x: right * 28, y: -forward * 28 });
    onVirtualMove(forward, right);
  };

  const handleDpadRelease = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setActiveDpadDir(null);
    setKnobOffset({ x: 0, y: 0 });
    onVirtualMove(0, 0);
  };

  return (
    <>
      {/* 1. LEFT THUMB ZONE: VIRTUAL ANALOG JOYSTICK + 4-WAY DIRECTIONAL RING */}
      <div
        data-testid="mobile-rpg-joystick"
        className="fixed bottom-3 left-4 sm:bottom-5 sm:left-6 z-30 pointer-events-auto select-none touch-none flex flex-col items-center"
      >
        <div
          ref={padRef}
          onPointerDown={handleStickPointerDown}
          onPointerMove={handleStickPointerMove}
          onPointerUp={handleStickPointerUp}
          onPointerCancel={handleStickPointerUp}
          role="application"
          aria-label="Virtual Analog Movement Thumbstick"
          className={`relative w-[112px] h-[112px] sm:w-[126px] sm:h-[126px] rounded-full bg-[#050912]/82 border-2 transition-colors flex items-center justify-center shadow-[0_10px_32px_rgba(0,0,0,0.9)] backdrop-blur-md cursor-grab active:cursor-grabbing ${
            isDraggingStick || activeDpadDir ? 'border-[#d4af37]' : 'border-[#d4af37]/50'
          }`}
        >
          {/* Sacred Geometric Compass Etching Inside Joystick Base */}
          <svg
            width="110"
            height="110"
            viewBox="0 0 110 110"
            className="absolute inset-0 w-full h-full pointer-events-none opacity-45"
            aria-hidden="true"
          >
            <circle
              cx="55"
              cy="55"
              r="46"
              fill="none"
              stroke="#d4af37"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <circle cx="55" cy="55" r="24" fill="none" stroke="#38bdf8" strokeWidth="0.8" />
            <line x1="55" y1="8" x2="55" y2="22" stroke="#d4af37" strokeWidth="1.2" />
            <line x1="55" y1="88" x2="55" y2="102" stroke="#d4af37" strokeWidth="1.2" />
            <line x1="8" y1="55" x2="22" y2="55" stroke="#d4af37" strokeWidth="1.2" />
            <line x1="88" y1="55" x2="102" y2="55" stroke="#d4af37" strokeWidth="1.2" />
            {/* Active deflection vector line */}
            {(Math.abs(knobOffset.x) > 2 || Math.abs(knobOffset.y) > 2) && (
              <line
                x1="55"
                y1="55"
                x2={55 + knobOffset.x}
                y2={55 + knobOffset.y}
                stroke="#fef08a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* 4-Way Discrete D-Pad Quadrant Buttons for Tap/Hold Precision */}
          <button
            type="button"
            aria-label="Move Forward"
            onPointerDown={(e) => handleDpadPress('up', 1, 0, e)}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            onPointerCancel={handleDpadRelease}
            className={`absolute top-1 left-1/2 -translate-x-1/2 w-8 h-6 flex items-start justify-center pt-0.5 text-[10px] font-hud font-bold cursor-pointer ${
              activeDpadDir === 'up' ? 'text-[#fef08a] scale-125' : 'text-[#d4af37]/80 hover:text-white'
            }`}
          >
            ▲
          </button>
          <button
            type="button"
            aria-label="Move Backward"
            onPointerDown={(e) => handleDpadPress('down', -1, 0, e)}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            onPointerCancel={handleDpadRelease}
            className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-6 flex items-end justify-center pb-0.5 text-[10px] font-hud font-bold cursor-pointer ${
              activeDpadDir === 'down'
                ? 'text-[#fef08a] scale-125'
                : 'text-[#d4af37]/80 hover:text-white'
            }`}
          >
            ▼
          </button>
          <button
            type="button"
            aria-label="Move Left"
            onPointerDown={(e) => handleDpadPress('left', 0, -1, e)}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            onPointerCancel={handleDpadRelease}
            className={`absolute left-1 top-1/2 -translate-y-1/2 w-6 h-8 flex items-center justify-start pl-0.5 text-[10px] font-hud font-bold cursor-pointer ${
              activeDpadDir === 'left'
                ? 'text-[#fef08a] scale-125'
                : 'text-[#d4af37]/80 hover:text-white'
            }`}
          >
            ◀
          </button>
          <button
            type="button"
            aria-label="Move Right"
            onPointerDown={(e) => handleDpadPress('right', 0, 1, e)}
            onPointerUp={handleDpadRelease}
            onPointerLeave={handleDpadRelease}
            onPointerCancel={handleDpadRelease}
            className={`absolute right-1 top-1/2 -translate-y-1/2 w-6 h-8 flex items-center justify-end pr-0.5 text-[10px] font-hud font-bold cursor-pointer ${
              activeDpadDir === 'right'
                ? 'text-[#fef08a] scale-125'
                : 'text-[#d4af37]/80 hover:text-white'
            }`}
          >
            ▶
          </button>

          {/* Draggable 360° Golden Chakra Thumbstick Knob */}
          <div
            className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#d4af37] via-[#b48628] to-[#78350f] border-2 border-[#fef08a] shadow-[0_0_18px_rgba(212,175,55,0.65)] flex items-center justify-center pointer-events-none transition-transform duration-75"
            style={{
              transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
            }}
          >
            <div className="w-4 h-4 rotate-45 border border-[#05070b] bg-[#fef08a]/90" />
          </div>
        </div>
        <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.2em] text-[#94a3b8]/80 pointer-events-none">
          MOVE PAD
        </span>
      </div>

      {/* 2. RIGHT THUMB ZONE: RADIAL ACTION-RPG COMBAT & TRAVERSAL SKILL WHEEL */}
      <div
        data-testid="mobile-rpg-skill-wheel"
        className="fixed bottom-3 right-4 sm:bottom-5 sm:right-6 z-30 w-[172px] h-[156px] sm:w-[192px] sm:h-[172px] pointer-events-none select-none touch-none"
      >
        {/* Contextual Interact / Inspect Button (Appears when near a Sanctum or Weapon Forge) */}
        {contextActionLabel && onInteractContext && (
          <button
            type="button"
            aria-label={contextActionLabel}
            onClick={(e) => {
              e.stopPropagation();
              onInteractContext();
            }}
            className="pointer-events-auto absolute -top-9 right-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f59e0b] text-[#05070b] border-2 border-[#fef08a] font-hud text-[10px] font-extrabold tracking-[0.16em] uppercase shadow-[0_0_20px_rgba(212,175,55,0.75)] animate-pulse active:scale-95 cursor-pointer whitespace-nowrap"
          >
            ★ {contextActionLabel}
          </button>
        )}

        {/* Arc Slot 1 (Left of Primary): SEKIRO DEFLECT / PARRY */}
        <button
          type="button"
          aria-label="RPG Pad Deflect Parry"
          onPointerDown={(e) => {
            e.stopPropagation();
            onTriggerParry();
          }}
          className="pointer-events-auto absolute left-0 bottom-2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#090e1a]/90 hover:bg-[#162038] active:scale-90 border-2 border-[#fef08a] shadow-[0_6px_20px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center cursor-pointer transition-transform"
          title="Sekiro Deflect Parry [RMB / V]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3L4 7V12C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 12V7L12 3Z"
              stroke="#fef08a"
              strokeWidth="2"
              fill="rgba(254, 240, 138, 0.15)"
            />
          </svg>
          <span className="font-hud text-[8px] font-bold tracking-wider uppercase text-[#fef08a] leading-none mt-0.5">
            PARRY
          </span>
        </button>

        {/* Arc Slot 2 (Mid-Left): SHINOBI SHADOW-STEP DASH */}
        <button
          type="button"
          aria-label="RPG Pad Shadow Dash"
          onPointerDown={(e) => {
            e.stopPropagation();
            onTriggerDash?.();
          }}
          className="pointer-events-auto absolute left-4 bottom-[58px] sm:left-5 sm:bottom-[66px] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#071526]/90 hover:bg-[#0e2947] active:scale-90 border-2 border-[#38bdf8] shadow-[0_6px_20px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center cursor-pointer transition-transform"
          title="Shinobi Shadow-Step Dash [Shift]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M13 3L4 14H12L11 21L20 10H12L13 3Z"
              stroke="#38bdf8"
              strokeWidth="2"
              fill="rgba(56, 189, 248, 0.18)"
            />
          </svg>
          <span className="font-hud text-[8px] font-bold tracking-wider uppercase text-[#bae6fd] leading-none mt-0.5">
            DASH
          </span>
        </button>

        {/* Arc Slot 3 (Top-Center): JUMP & GARUDA SKY-CLOAK GLIDER */}
        <button
          type="button"
          aria-label="RPG Pad Jump Glide"
          onPointerDown={(e) => {
            e.stopPropagation();
            onVirtualJump();
          }}
          className={`pointer-events-auto absolute left-[56px] bottom-[96px] sm:left-[64px] sm:bottom-[108px] w-11 h-11 sm:w-12 sm:h-12 rounded-full active:scale-90 border-2 shadow-[0_6px_20px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center cursor-pointer transition-transform ${
            isGliding
              ? 'bg-[#0d9488] border-white text-[#05070b]'
              : 'bg-[#061c1b]/90 hover:bg-[#0c3633] border-[#2dd4bf]'
          }`}
          title="Jump / Deploy Garuda Sky-Cloak Paraglider [Space]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 4L5 12H9V20H15V12H19L12 4Z"
              stroke={isGliding ? '#05070b' : '#2dd4bf'}
              strokeWidth="2"
              fill="rgba(45, 212, 191, 0.18)"
            />
          </svg>
          <span
            className={`font-hud text-[8px] font-bold tracking-wider uppercase leading-none mt-0.5 ${
              isGliding ? 'text-[#05070b]' : 'text-[#ccfbf1]'
            }`}
          >
            {isGliding ? 'GLIDE' : 'JUMP'}
          </span>
        </button>

        {/* Arc Slot 4 (Top-Right): SURYA WHIRLWIND NOVA ULTIMATE */}
        <button
          type="button"
          aria-label="RPG Pad Whirlwind Nova"
          onPointerDown={(e) => {
            e.stopPropagation();
            onTriggerAttack(true);
          }}
          className="pointer-events-auto absolute right-1 bottom-[88px] sm:right-1.5 sm:bottom-[98px] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#240713]/92 hover:bg-[#3d0c21] active:scale-90 border-2 border-[#f43f5e] shadow-[0_6px_20px_rgba(244,63,94,0.4)] flex flex-col items-center justify-center cursor-pointer transition-transform"
          title="360° Surya Whirlwind Nova [Key Q]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="7"
              stroke="#f43f5e"
              strokeWidth="2"
              fill="rgba(244, 63, 94, 0.22)"
            />
            <polygon points="12,3 15,12 12,21 9,12" fill="#fda4af" />
          </svg>
          <span className="font-hud text-[8px] font-bold tracking-wider uppercase text-[#fecdd3] leading-none mt-0.5">
            NOVA
          </span>
        </button>

        {/* Elevated Grapple Hook Medallion */}
        <button
          type="button"
          aria-label="RPG Pad Grapple Hook"
          onPointerDown={(e) => {
            e.stopPropagation();
            onTriggerGrapple();
          }}
          className={`pointer-events-auto absolute left-0 bottom-[106px] sm:bottom-[118px] w-10 h-10 rounded-full active:scale-90 border flex flex-col items-center justify-center cursor-pointer transition-transform shadow-lg ${
            grappleAvailable
              ? 'bg-[#0d9488]/95 border-[#fef08a] animate-bounce'
              : 'bg-[#070d19]/85 border-[#2dd4bf]/50 opacity-85 hover:opacity-100'
          }`}
          title="Shinobi Grapple Hook [Key G]"
        >
          <span className="font-hud text-[8px] font-bold tracking-wider uppercase text-[#ccfbf1]">
            HOOK
          </span>
        </button>

        {/* Super Power Medallion: INDRA VAJRA SKY-LIGHTNING BOLT (Unlocked at 6/6 Projects) */}
        {onTriggerLightningBolt && (
          <button
            type="button"
            data-testid="mobile-rpg-lightning-btn"
            aria-label="Indra Vajra Sky-Lightning Bolt"
            onPointerDown={(e) => {
              e.stopPropagation();
              onTriggerLightningBolt();
            }}
            className={`pointer-events-auto absolute right-0 bottom-[140px] sm:bottom-[152px] px-2.5 h-9 rounded-full active:scale-90 border-2 flex items-center gap-1 justify-center cursor-pointer transition-all shadow-xl ${
              lightningUnlocked
                ? 'bg-gradient-to-r from-[#0284c7] via-[#38bdf8] to-[#fef08a] text-[#05070b] border-white shadow-[0_0_24px_rgba(56,189,248,0.85)] animate-pulse font-extrabold'
                : 'bg-[#070d19]/90 border-[#38bdf8]/40 text-[#94a3b8]'
            }`}
            title={
              lightningUnlocked
                ? 'Strike Sky-Lightning Bolt on Layoff Monster [Key Z]'
                : `Awaken all 6 Project Sanctums (${unlockedProjectsCount}/6) to unlock Sky-Lightning Bolt [Key Z]`
            }
          >
            <span className="text-xs leading-none">⚡</span>
            <span className="font-hud text-[8px] font-bold tracking-wider uppercase leading-none">
              {lightningUnlocked ? 'BOLT [Z]' : `⚡ ${unlockedProjectsCount}/6`}
            </span>
          </button>
        )}

        {/* PRIMARY LARGE ATTACK MEDALLION (Bottom-Right Corner Anchor) */}
        <button
          type="button"
          aria-label="RPG Pad Primary Slash"
          onPointerDown={(e) => {
            e.stopPropagation();
            onTriggerAttack(false);
          }}
          className="pointer-events-auto absolute right-1 bottom-1 w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] rounded-full bg-gradient-to-br from-[#d4af37] via-[#b48628] to-[#78350f] hover:brightness-110 active:scale-90 border-[3px] border-[#fef08a] shadow-[0_0_28px_rgba(212,175,55,0.65)] flex flex-col items-center justify-center cursor-pointer transition-transform"
          title="Primary 3-Stage Weapon Slash [LMB / F]"
        >
          <div className="absolute inset-1 rounded-full border border-[#05070b]/40 pointer-events-none" />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M19 5L5 19M19 5H13M19 5V11"
              stroke="#05070b"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14.5 9.5L9.5 14.5"
              stroke="#fef08a"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-hud text-[10px] font-extrabold tracking-[0.16em] uppercase text-[#05070b] leading-none mt-0.5">
            SLASH
          </span>
          <span className="font-mono text-[7px] font-bold text-[#05070b]/80 leading-none">
            STAGE {comboStage === 3 ? 'III' : comboStage === 2 ? 'II' : 'I'}
          </span>
        </button>
      </div>
    </>
  );
};
