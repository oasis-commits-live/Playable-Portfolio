import React, { useEffect, useState } from 'react';
import {
  CREATOR_PROFILE,
  PORTFOLIO_STOPS,
  STORY_CHAPTERS,
  FORGE_WEAPONS,
} from '../data/portfolioStops';
import { sound } from '../game/sound';
import { getReferenceCaseStudy } from '../data/referenceCaseStudies';

interface TitleScreenProps {
  onStart: () => void;
  onInspectProject?: (stopId: string) => void;
  gamepadConnected: boolean;
}

type ModalSection = null | 'howto' | 'sanctums' | 'saga';

/**
 * Ornate symmetrical pointer flourish flanking the focused menu item (Hollow Knight style)
 */
const MenuPointerLeft: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="40"
    height="16"
    viewBox="0 0 40 16"
    fill="none"
    aria-hidden="true"
    className={`transition-all duration-200 ${
      active ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
    }`}
    style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.7))' }}
  >
    <path
      d="M38 8H12M12 8L19 3M12 8L19 13M2 8L7.5 4.5L13 8L7.5 11.5L2 8Z"
      stroke="#ffffff"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M23 5C26 5 28 8 25 10"
      stroke="#ffffff"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <circle cx="31" cy="8" r="1.5" fill="#ffffff" />
  </svg>
);

const MenuPointerRight: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="40"
    height="16"
    viewBox="0 0 40 16"
    fill="none"
    aria-hidden="true"
    className={`transition-all duration-200 ${
      active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
    }`}
    style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.7))' }}
  >
    <path
      d="M2 8H28M28 8L21 3M28 8L21 13M38 8L32.5 4.5L27 8L32.5 11.5L38 8Z"
      stroke="#ffffff"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 5C14 5 12 8 15 10"
      stroke="#ffffff"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <circle cx="9" cy="8" r="1.5" fill="#ffffff" />
  </svg>
);

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onInspectProject,
  gamepadConnected,
}) => {
  const [hoveredItem, setHoveredItem] = useState<number>(0);
  const [activeModal, setActiveModal] = useState<ModalSection>(null);

  // Keyboard navigation for the vertical title menu (Up/Down/W/S, Esc to close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeModal) {
        if (e.code === 'Escape' || e.code === 'Backspace') {
          e.preventDefault();
          e.stopPropagation();
          setActiveModal(null);
        }
        return;
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        setHoveredItem((prev) => (prev + 1) % 4);
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        setHoveredItem((prev) => (prev - 1 + 4) % 4);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col justify-between items-center pointer-events-auto select-none overflow-hidden text-center px-6 py-6 sm:px-12 sm:py-8"
      style={{
        background:
          'linear-gradient(180deg, rgba(12, 20, 38, 0.55) 0%, rgba(24, 32, 56, 0.35) 38%, rgba(15, 18, 32, 0.62) 72%, rgba(4, 6, 12, 0.92) 100%)',
      }}
    >
      {/* Atmospheric Multi-Plane Horizon & Sun-Shaft Backdrop (Alto's Odyssey + Hollow Knight + The Dust Road) */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none -z-10"
      >
        <defs>
          {/* Soft God-Ray Shafts from Upper Sanctuary */}
          <linearGradient id="godRayGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#fff7ed" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#fed7aa" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="0" />
          </linearGradient>

          {/* Warm Horizon Sun/Moon Glow Behind Title */}
          <radialGradient id="sunOrbGlow" cx="50%" cy="34%" r="32%">
            <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.38" />
            <stop offset="35%" stopColor="#fde68a" stopOpacity="0.14" />
            <stop offset="70%" stopColor="#93c5fd" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#050811" stopOpacity="0" />
          </radialGradient>

          {/* Vignette Frame */}
          <radialGradient id="edgeVignette" cx="50%" cy="46%" r="65%">
            <stop offset="50%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#020307" stopOpacity="0.82" />
          </radialGradient>
        </defs>

        {/* Central Celestial Sun Halo */}
        <rect width="1440" height="900" fill="url(#sunOrbGlow)" />

        {/* Vertical Sanctuary Light Pillars (Hollow Knight Cathedral Beams) */}
        <polygon points="560,0 650,0 610,680 510,680" fill="url(#godRayGrad)" />
        <polygon points="685,0 755,0 755,720 685,720" fill="url(#godRayGrad)" />
        <polygon points="790,0 880,0 930,680 830,680" fill="url(#godRayGrad)" />

        {/* Subtle Luminous Sun Disc in Upper-Center Sky (Alto's Odyssey motif) */}
        <circle cx="720" cy="285" r="86" fill="#fffbeb" fillOpacity="0.11" />
        <circle cx="720" cy="285" r="54" fill="#ffffff" fillOpacity="0.14" />

        {/* Far Misty Mountain Range Silhouette */}
        <path
          d="M0 690 L140 615 L275 655 L430 575 L575 640 L720 595 L865 640 L1010 570 L1165 650 L1310 605 L1440 675 L1440 900 L0 900 Z"
          fill="#0b1220"
          fillOpacity="0.55"
        />

        {/* Mid-Ground Ridge + Distant Sanchi Torana Archway Silhouette */}
        <path
          d="M0 745 L190 685 L350 725 L540 675 L665 715 L775 715 L900 675 L1090 725 L1250 685 L1440 745 L1440 900 L0 900 Z"
          fill="#070b14"
          fillOpacity="0.78"
        />

        {/* Iconic Torana Sanctuary Gateway & Lone Warrior Silhouette on Horizon (The Dust Road + Alto's Odyssey) */}
        <g fill="#04070e" fillOpacity="0.9">
          {/* Left & Right Sanctuary Pillars */}
          <rect x="678" y="654" width="7" height="64" />
          <rect x="755" y="654" width="7" height="64" />
          {/* Three Curved Torana Architraves */}
          <rect x="662" y="650" width="116" height="5" rx="2" />
          <rect x="668" y="662" width="104" height="4.5" rx="2" />
          <rect x="673" y="673" width="94" height="4" rx="2" />
          {/* Top Kalasha Finial */}
          <polygon points="720,636 726,650 714,650" />
        </g>

        {/* Foreground Horizon Ground Plane */}
        <path
          d="M0 790 Q720 755 1440 790 L1440 900 L0 900 Z"
          fill="#03050a"
          fillOpacity="0.94"
        />

        {/* Floating Luminous Spores / Fireflies around the Crest */}
        <g fill="#ffffff">
          <circle cx="490" cy="195" r="2.2" fillOpacity="0.65" />
          <circle cx="545" cy="160" r="1.6" fillOpacity="0.45" />
          <circle cx="645" cy="142" r="2.5" fillOpacity="0.75" />
          <circle cx="720" cy="128" r="2.8" fillOpacity="0.85" />
          <circle cx="792" cy="146" r="2.2" fillOpacity="0.7" />
          <circle cx="885" cy="168" r="1.8" fillOpacity="0.5" />
          <circle cx="955" cy="202" r="2.4" fillOpacity="0.6" />
          <circle cx="442" cy="310" r="1.7" fillOpacity="0.4" />
          <circle cx="998" cy="318" r="1.9" fillOpacity="0.45" />
          <circle cx="585" cy="378" r="1.6" fillOpacity="0.5" />
          <circle cx="852" cy="372" r="1.8" fillOpacity="0.55" />
        </g>

        {/* Deep Edge Vignette */}
        <rect width="1440" height="900" fill="url(#edgeVignette)" />
      </svg>

      {/* Top Whisper-Quiet Corner Marks */}
      <div className="w-full flex items-center justify-between text-[11px] tracking-[0.28em] uppercase text-[#e2e8f0]/55 font-mythic">
        <span>{CREATOR_PROFILE.name}</span>
        <span>{gamepadConnected ? 'Controller Ready' : 'Interactive 3D Portfolio'}</span>
      </div>

      {/* Center Stage: Single-Line Hollow-Knight Crest + Vertical Menu */}
      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col items-center justify-center my-auto">
        {/* Upper Hand-Crafted SVG Filigree Crest */}
        <svg
          width="620"
          height="52"
          viewBox="0 0 620 52"
          fill="none"
          aria-hidden="true"
          className="w-72 sm:w-[460px] lg:w-[600px] h-auto mb-1 opacity-95"
          style={{
            filter: 'drop-shadow(0 0 14px rgba(255, 255, 255, 0.65))',
          }}
        >
          {/* Central Sacred Crown */}
          <path
            d="M310 8L317 22L310 32L303 22L310 8Z"
            stroke="#ffffff"
            strokeWidth="1.6"
            fill="rgba(255, 255, 255, 0.16)"
          />
          <path
            d="M310 14C320 18 328 25 331 32C322 31 315 27 310 22C305 27 298 31 289 32C292 25 300 18 310 14Z"
            stroke="#ffffff"
            strokeWidth="1.45"
          />
          {/* Inner Symmetrical Scrollwork Volutes */}
          <path
            d="M286 32C256 32 242 16 216 16C196 16 186 28 200 35C210 39 220 30 210 24"
            stroke="#ffffff"
            strokeWidth="1.65"
            strokeLinecap="round"
          />
          <path
            d="M334 32C364 32 378 16 404 16C424 16 434 28 420 35C410 39 400 30 410 24"
            stroke="#ffffff"
            strokeWidth="1.65"
            strokeLinecap="round"
          />
          {/* Outer Extended Filigree Arms & Curls */}
          <path
            d="M190 32H88C70 32 58 24 58 16C58 10 66 7 72 12C76 16 72 23 65 22"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M430 32H532C550 32 562 24 562 16C562 10 554 7 548 12C544 16 548 23 555 22"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="250" cy="14" r="2" fill="#ffffff" />
          <circle cx="370" cy="14" r="2" fill="#ffffff" />
          <circle cx="136" cy="22" r="1.8" fill="#ffffff" opacity="0.85" />
          <circle cx="484" cy="22" r="1.8" fill="#ffffff" opacity="0.85" />
        </svg>

        {/* Single-Line Monumental Luminous Title (Hollow Knight Lockup) */}
        <h1
          className="font-mythic font-normal text-[#ffffff] tracking-[0.12em] sm:tracking-[0.16em] leading-none text-center uppercase whitespace-nowrap"
          style={{
            fontSize: 'clamp(1.85rem, 4.8vw, 4.5rem)',
            textShadow:
              '0 0 26px rgba(255, 255, 255, 0.68), 0 0 58px rgba(255, 248, 230, 0.32), 0 8px 28px rgba(0, 0, 0, 0.95)',
          }}
        >
          PORTFOLIO VERSE
        </h1>

        {/* Lower Ornate Crest & Scrollwork Emblem */}
        <svg
          width="680"
          height="68"
          viewBox="0 0 680 68"
          fill="none"
          aria-hidden="true"
          className="w-80 sm:w-[520px] lg:w-[660px] h-auto mt-1.5 opacity-95"
          style={{
            filter: 'drop-shadow(0 0 14px rgba(255, 255, 255, 0.65))',
          }}
        >
          {/* Main Horizontal Crest Wings */}
          <path
            d="M44 12H296M384 12H636"
            stroke="#ffffff"
            strokeWidth="1.55"
            strokeLinecap="round"
          />
          {/* Outer Curling Terminals */}
          <path
            d="M44 12C28 12 18 21 18 31C18 39 27 44 35 39C41 35 39 27 32 26"
            stroke="#ffffff"
            strokeWidth="1.65"
            strokeLinecap="round"
          />
          <path
            d="M636 12C652 12 662 21 662 31C662 39 653 44 645 39C639 35 641 27 648 26"
            stroke="#ffffff"
            strokeWidth="1.65"
            strokeLinecap="round"
          />
          {/* Mid-Wing Volutes */}
          <path
            d="M170 12C152 12 142 26 124 26C112 26 106 18 114 15"
            stroke="#ffffff"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          <path
            d="M510 12C528 12 538 26 556 26C568 26 574 18 566 15"
            stroke="#ffffff"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          {/* Inner Baroque Scrollwork flanking the Central Shield */}
          <path
            d="M296 12C272 12 258 32 232 32C212 32 204 20 216 15C224 12 232 19 225 25"
            stroke="#ffffff"
            strokeWidth="1.55"
            strokeLinecap="round"
          />
          <path
            d="M384 12C408 12 422 32 448 32C468 32 476 20 464 15C456 12 448 19 455 25"
            stroke="#ffffff"
            strokeWidth="1.55"
            strokeLinecap="round"
          />
          <path
            d="M312 17C296 27 282 42 262 42C250 42 245 34 252 30"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M368 17C384 27 398 42 418 42C430 42 435 34 428 30"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* Central Ribbed Carapace Emblem & Finial Point */}
          <ellipse
            cx="340"
            cy="26"
            rx="13"
            ry="18"
            stroke="#ffffff"
            strokeWidth="1.75"
            fill="rgba(255, 255, 255, 0.12)"
          />
          <path d="M328 21H352M327 26H353M329 31H351" stroke="#ffffff" strokeWidth="1.3" />
          <path
            d="M340 44L347 53L340 64L333 53L340 44Z"
            stroke="#ffffff"
            strokeWidth="1.55"
            fill="rgba(255, 255, 255, 0.2)"
          />
        </svg>

        {/*Centered Vertical Game Menu (Hollow Knight Signature Stack) */}
        <nav
          aria-label="Title Screen Menu"
          className="mt-8 sm:mt-11 flex flex-col items-center space-y-2.5 sm:space-y-3.5"
        >
          {/* 1. START GAME */}
          <button
            type="button"
            data-start="true"
            data-testid="enter-aryavarta-btn"
            onMouseEnter={() => {
              setHoveredItem(0);
              sound.playTempleBell(528);
            }}
            onFocus={() => setHoveredItem(0)}
            onClick={(e) => {
              e.currentTarget.blur();
              onStart();
            }}
            className="group flex items-center justify-center gap-4 px-4 py-1 cursor-pointer bg-transparent border-0 focus:outline-none"
          >
            <MenuPointerLeft active={hoveredItem === 0} />
            <span
              className={`font-mythic text-lg sm:text-2xl tracking-[0.22em] uppercase transition-all duration-200 whitespace-nowrap ${
                hoveredItem === 0
                  ? 'text-white scale-105'
                  : 'text-[#e2e8f0]/80 hover:text-white'
              }`}
              style={{
                textShadow:
                  hoveredItem === 0
                    ? '0 0 20px rgba(255, 255, 255, 0.8), 0 4px 16px rgba(0,0,0,0.95)'
                    : '0 4px 14px rgba(0,0,0,0.9)',
              }}
            >
              Start Game
            </span>
            <MenuPointerRight active={hoveredItem === 0} />
          </button>

          {/* 2. HOW TO PLAY */}
          <button
            type="button"
            data-testid="tab-how-to-play"
            onMouseEnter={() => {
              setHoveredItem(1);
              sound.playTempleBell(440);
            }}
            onFocus={() => setHoveredItem(1)}
            onClick={() => setActiveModal(activeModal === 'howto' ? null : 'howto')}
            className="group flex items-center justify-center gap-4 px-4 py-1 cursor-pointer bg-transparent border-0 focus:outline-none"
          >
            <MenuPointerLeft active={hoveredItem === 1 || activeModal === 'howto'} />
            <span
              className={`font-mythic text-sm sm:text-lg tracking-[0.22em] uppercase transition-all duration-200 whitespace-nowrap ${
                hoveredItem === 1 || activeModal === 'howto'
                  ? 'text-white scale-105'
                  : 'text-[#e2e8f0]/75 hover:text-white'
              }`}
              style={{ textShadow: '0 3px 14px rgba(0,0,0,0.92)' }}
            >
              How To Play
            </span>
            <MenuPointerRight active={hoveredItem === 1 || activeModal === 'howto'} />
          </button>

          {/* 3. PROJECT SANCTUMS */}
          <button
            type="button"
            data-testid="tab-sanctums"
            onMouseEnter={() => {
              setHoveredItem(2);
              sound.playTempleBell(480);
            }}
            onFocus={() => setHoveredItem(2)}
            onClick={() => setActiveModal(activeModal === 'sanctums' ? null : 'sanctums')}
            className="group flex items-center justify-center gap-4 px-4 py-1 cursor-pointer bg-transparent border-0 focus:outline-none"
          >
            <MenuPointerLeft active={hoveredItem === 2 || activeModal === 'sanctums'} />
            <span
              className={`font-mythic text-sm sm:text-lg tracking-[0.22em] uppercase transition-all duration-200 whitespace-nowrap ${
                hoveredItem === 2 || activeModal === 'sanctums'
                  ? 'text-white scale-105'
                  : 'text-[#e2e8f0]/75 hover:text-white'
              }`}
              style={{ textShadow: '0 3px 14px rgba(0,0,0,0.92)' }}
            >
              Project Sanctums
            </span>
            <MenuPointerRight active={hoveredItem === 2 || activeModal === 'sanctums'} />
          </button>

          {/* 4. CAREER CHRONICLE */}
          <button
            type="button"
            data-testid="tab-saga"
            onMouseEnter={() => {
              setHoveredItem(3);
              sound.playTempleBell(396);
            }}
            onFocus={() => setHoveredItem(3)}
            onClick={() => setActiveModal(activeModal === 'saga' ? null : 'saga')}
            className="group flex items-center justify-center gap-4 px-4 py-1 cursor-pointer bg-transparent border-0 focus:outline-none"
          >
            <MenuPointerLeft active={hoveredItem === 3 || activeModal === 'saga'} />
            <span
              className={`font-mythic text-sm sm:text-lg tracking-[0.22em] uppercase transition-all duration-200 whitespace-nowrap ${
                hoveredItem === 3 || activeModal === 'saga'
                  ? 'text-white scale-105'
                  : 'text-[#e2e8f0]/75 hover:text-white'
              }`}
              style={{ textShadow: '0 3px 14px rgba(0,0,0,0.92)' }}
            >
              Career Chronicle
            </span>
            <MenuPointerRight active={hoveredItem === 3 || activeModal === 'saga'} />
          </button>
        </nav>
      </main>

      {/* Diegetic Overlay Sheet when How To Play, Project Sanctums, or Career Chronicle is opened */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(3, 5, 10, 0.92)' }}
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-3xl border border-[#f8f5ee]/20 bg-[#060a12] px-6 py-7 sm:px-10 sm:py-9 text-center space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {activeModal === 'howto' && (
              <>
                <div className="space-y-1">
                  <h2 className="font-mythic text-xl sm:text-2xl tracking-[0.22em] uppercase text-white">
                    How To Play
                  </h2>
                  <p className="font-sans text-xs text-[#94a3b8]">
                    Master movement, the four divine blades, and the boss seal before entering
                  </p>
                </div>

                <div className="h-px w-full bg-[#f8f5ee]/15" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                  <div className="space-y-1">
                    <div className="font-mythic text-xs tracking-[0.2em] uppercase text-[#fde68a]">
                      01. Explore &amp; 360° Camera
                    </div>
                    <p className="font-sans text-xs text-[#cbd5e1] leading-relaxed">
                      Run with <strong className="text-white">WASD / Arrow Keys</strong>, press{' '}
                      <strong className="text-white">Space</strong> to Jump and Paraglide, press{' '}
                      <strong className="text-white">G</strong> to grapple elevated shrines, and
                      move your mouse infinitely to pan 360°.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="font-mythic text-xs tracking-[0.2em] uppercase text-[#fde68a]">
                      02. Right-Side Sword Legend (Keys 1–4)
                    </div>
                    <p className="font-sans text-xs text-[#cbd5e1] leading-relaxed">
                      Switch weapons anytime using <strong className="text-white">Keys 1–4</strong>{' '}
                      or the right-hand legend:{' '}
                      {FORGE_WEAPONS.map((w, i) => `[${i + 1}] ${w.name.split(' ')[0]}`).join(' · ')}
                      .
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="font-mythic text-xs tracking-[0.2em] uppercase text-[#fde68a]">
                      03. Unlock The Layoff Boss (6/6 Sanctums)
                    </div>
                    <p className="font-sans text-xs text-[#cbd5e1] leading-relaxed">
                      Follow the golden trail to all{' '}
                      <strong className="text-white">6 Project Sanctums</strong> and press{' '}
                      <strong className="text-white">E</strong> to inspect each case study. The
                      Layoff Boss remains sealed behind a hologram until all 6 projects are seen.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="font-mythic text-xs tracking-[0.2em] uppercase text-[#fde68a]">
                      04. Combat &amp; [Z] Sky-Lightning Bolt
                    </div>
                    <p className="font-sans text-xs text-[#cbd5e1] leading-relaxed">
                      <strong className="text-white">Left-Click / F</strong> to slash,{' '}
                      <strong className="text-white">Right-Click / V</strong> to deflect attacks.
                      Once all 6 projects are seen, press <strong className="text-white">Z</strong>{' '}
                      during the boss fight to call down a Sky-Lightning Bolt.
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeModal === 'sanctums' && (
              <>
                <div className="space-y-1">
                  <h2 className="font-mythic text-xl sm:text-2xl tracking-[0.22em] uppercase text-white">
                    Six Project Sanctums
                  </h2>
                  <p className="font-sans text-xs text-[#94a3b8]">
                    Inspect all six architectural monuments in the valley to unseal the northern
                    citadel
                  </p>
                </div>

                <div className="h-px w-full bg-[#f8f5ee]/15" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-h-[58vh] overflow-y-auto pr-1">
                  {PORTFOLIO_STOPS.map((s) => {
                    const cs = getReferenceCaseStudy(s.project.id);
                    const projectHref = cs.prototypeUrl || cs.externalUrl || '';
                    const projectCtaLabel = cs.prototypeUrl ? 'Live Prototype' : 'Live Product';
                    return (
                      <div
                        key={s.id}
                        className="border border-[#d4af37]/30 bg-[#09101f] p-3 flex flex-col justify-between gap-2.5"
                      >
                        <div className="space-y-2">
                          <div className="relative w-full aspect-[16/10] bg-[#04070e] border border-[#d4af37]/25 overflow-hidden">
                            <img
                              src={cs.heroImage}
                              alt={cs.title}
                              loading="eager"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover object-top"
                            />
                            <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-[#05070b]/85 border border-[#d4af37]/35 font-mono text-[9px] text-[#fde68a]">
                              +{cs.galleryImages.length} screens
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-[#94a3b8] tabular-nums">
                            <span>
                              {s.indexNumber} · {cs.client} · {cs.projectType} · {cs.year}
                            </span>
                            <span className="text-[#2dd4bf]">
                              +{s.unlockedPower.bonusDamage} ATK
                            </span>
                          </div>
                          <div className="font-display text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">
                            {cs.title}
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/10">
                            {cs.impactMetrics.map((m) => (
                              <div key={m.label} className="min-w-0">
                                <div className="font-mono text-[11px] font-bold text-[#fde68a] truncate">
                                  {m.value}
                                </div>
                                <div className="font-sans text-[9px] text-[#94a3b8] truncate">
                                  {m.label}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveModal(null);
                              if (onInspectProject) {
                                onInspectProject(s.id);
                              } else {
                                onStart();
                              }
                            }}
                            className="flex-1 px-2.5 py-1.5 bg-[#d4af37] hover:bg-[#fde68a] text-[#05070b] font-hud text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer"
                          >
                            Read Case Study →
                          </button>
                          {projectHref && (
                            <a
                              href={projectHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-[#0d182c] hover:bg-[#172847] border border-[#d4af37]/40 text-[#f8f5ee] font-hud text-[10px] font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap"
                            >
                              {projectCtaLabel} ↗
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {activeModal === 'saga' && (
              <>
                <div className="space-y-1">
                  <h2 className="font-mythic text-xl sm:text-2xl tracking-[0.22em] uppercase text-white">
                    Five-Act Career Chronicle
                  </h2>
                  <p className="font-sans text-xs text-[#cbd5e1] max-w-xl mx-auto leading-relaxed">
                    {CREATOR_PROFILE.layoffStory}
                  </p>
                </div>

                <div className="h-px w-full bg-[#f8f5ee]/15" />

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-center">
                  {STORY_CHAPTERS.map((chap) => (
                    <div key={chap.act} className="space-y-1">
                      <div className="font-mythic text-xs tracking-[0.18em] text-[#fde68a]">
                        {chap.act}
                      </div>
                      <div className="font-sans text-xs text-white leading-snug">{chap.title}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="pt-2 flex items-center justify-center gap-8">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="font-mythic text-xs tracking-[0.24em] uppercase text-[#cbd5e1] hover:text-white cursor-pointer py-1 border-b border-[#f8f5ee]/30 hover:border-white transition-colors"
              >
                Back To Title [Esc]
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  onStart();
                }}
                className="font-mythic text-xs tracking-[0.24em] uppercase text-[#fde68a] hover:text-white cursor-pointer py-1 border-b border-[#fde68a]/60 hover:border-white transition-colors"
              >
                Start Game [Enter]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimalist Corner Marks & Single-Line Control Hint (Hollow Knight + The Dust Road Signature Footer) */}
      <footer
        data-testid="how-to-play-section"
        className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] tracking-[0.18em] uppercase text-[#cbd5e1]/65 font-hud"
      >
        {/* Bottom-Left: Four subtle emblem icons + edition mark (Hollow Knight bottom-left) */}
        <div className="flex flex-col items-center sm:items-start gap-1">
          <div className="flex items-center gap-2" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#f472b6" strokeWidth="1.4" opacity="0.8" />
              <circle cx="8" cy="8" r="2.2" fill="#f472b6" opacity="0.8" />
            </svg>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2L13 8L8 14L3 8L8 2Z"
                stroke="#f87171"
                strokeWidth="1.4"
                opacity="0.8"
              />
            </svg>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#60a5fa" strokeWidth="1.4" opacity="0.8" />
              <path d="M5 8H11M8 5V11" stroke="#60a5fa" strokeWidth="1.2" opacity="0.8" />
            </svg>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <polygon
                points="8,1.5 14.5,8 8,14.5 1.5,8"
                stroke="#fbbf24"
                strokeWidth="1.4"
                opacity="0.85"
              />
              <circle cx="8" cy="8" r="2" fill="#fbbf24" opacity="0.85" />
            </svg>
          </div>
          <span className="font-mono text-[10px] tracking-[0.16em] text-[#94a3b8]">
            6 SANCTUMS · 5 JEWELS · 4 BLADES
          </span>
        </div>

        {/* Bottom-Center: Single Flat Borderless Inline Control Line */}
        <div className="font-mythic text-[11px] tracking-[0.24em] text-[#e2e8f0]/75 text-center">
          WASD MOVE · KEYS 1–4 BLADES · E INSPECT · Z SKY-LIGHTNING
        </div>

        {/* Bottom-Right: Creator Stamp & Direct Links */}
        <div className="flex items-center gap-5">
          <a
            href={CREATOR_PROFILE.calUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#e2e8f0]/75 hover:text-white transition-colors whitespace-nowrap"
          >
            Book Call
          </a>
          <a
            href={CREATOR_PROFILE.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#e2e8f0]/75 hover:text-white transition-colors whitespace-nowrap"
          >
            Resume PDF
          </a>
        </div>
      </footer>
    </div>
  );
};
