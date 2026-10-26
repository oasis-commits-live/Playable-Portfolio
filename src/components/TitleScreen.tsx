import React, { useState } from 'react';
import { CREATOR_PROFILE, PORTFOLIO_STOPS, STORY_CHAPTERS } from '../data/portfolioStops';
import { sound } from '../game/sound';

interface TitleScreenProps {
  onStart: () => void;
  gamepadConnected: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, gamepadConnected }) => {
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'saga' | 'sanctums'>('none');

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col justify-between pointer-events-auto select-none"
      style={{
        background:
          'linear-gradient(98deg, rgba(4, 6, 11, 0.94) 0%, rgba(6, 10, 18, 0.76) 44%, rgba(5, 8, 15, 0.14) 100%)',
      }}
    >
      {/* Top Widescreen Cinematic Letterbox Bar */}
      <header className="h-14 px-6 md:px-12 flex items-center justify-between border-b border-[#d4af37]/20 bg-[#04060a]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Sacred Geometric Crest SVG */}
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <polygon
              points="16,2 30,16 16,30 2,16"
              stroke="#d4af37"
              strokeWidth="1.6"
              fill="rgba(212,175,55,0.12)"
            />
            <circle cx="16" cy="16" r="4" fill="#2dd4bf" />
          </svg>
          <span className="font-hud font-bold text-sm tracking-[0.24em] uppercase text-[#f4efe6]">
            {CREATOR_PROFILE.name}
          </span>
          <span className="text-[#d4af37]/40">/</span>
          <span className="font-sans text-xs text-[#94a3b8] hidden sm:inline">
            {CREATOR_PROFILE.title}
          </span>
          <span className="hidden md:inline text-[#d4af37]/40">·</span>
          <span className="hidden md:inline font-mono text-[11px] text-[#2dd4bf]">
            $3M ARR 0→1 IMPACT
          </span>
        </div>

        <div className="flex items-center gap-5 font-hud text-xs tracking-[0.16em] uppercase">
          <a
            href={CREATOR_PROFILE.calUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#e2e8f0] hover:text-[#d4af37] transition-colors py-1 border-b border-transparent hover:border-[#d4af37]"
          >
            Book Call
          </a>
          <a
            href={CREATOR_PROFILE.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#e2e8f0] hover:text-[#d4af37] transition-colors py-1 border-b border-transparent hover:border-[#d4af37]"
          >
            Resume PDF
          </a>
          {gamepadConnected && (
            <span className="text-[#2dd4bf] font-mono text-[10px]">GAMEPAD READY</span>
          )}
        </div>
      </header>

      {/* Main Asymmetric Console Title Lockup + Interactive Preview Drawer */}
      <div className="flex-1 flex flex-col lg:flex-row items-start lg:items-center justify-between px-6 md:px-14 py-6 gap-8 overflow-hidden">
        {/* Left Column: Mythic Title & Katana Blade Menu */}
        <div className="max-w-xl space-y-6 my-auto">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs font-hud font-semibold tracking-[0.3em] uppercase text-[#d4af37]">
              <span className="h-px w-8 bg-[#d4af37]" />
              <span>PORTFOLIO VERSE · INTERACTIVE ACTION-RPG PORTFOLIO</span>
            </div>

            <h1
              className="font-display font-extrabold text-[#f8f5ee] tracking-tight leading-[0.96]"
              style={{
                fontSize: 'clamp(2.8rem, 5.4vw, 4.75rem)',
                textShadow: '0 10px 40px rgba(0, 0, 0, 0.95)',
              }}
            >
              PORTFOLIO VERSE
            </h1>

            <p className="font-mythic italic text-xl md:text-2xl text-[#d4af37] tracking-wide pt-1">
              Ayush Dubey — Six Shipped Products, Five Career Jewels &amp; Four Divine Weapons
            </p>
          </div>

          <p className="font-sans text-sm text-[#cbd5e1]/90 leading-relaxed max-w-md font-light">
            Step into Portfolio Verse as a Royal Sthapati Shinobi. Ascend carved temple staircases,
            wield four forged Astra weapons, awaken complete product case studies, and vanquish the
            boss symbolizing the September layoff.
          </p>

          {/* AAA Console Vertical Blade Menu List */}
          <nav aria-label="Main Game Menu" className="space-y-2.5 pt-2">
            <button
              type="button"
              data-start="true"
              onMouseEnter={() => sound.playTempleBell(528)}
              onClick={(e) => {
                e.currentTarget.blur();
                onStart();
              }}
              className="group w-full max-w-md flex items-center justify-between px-5 py-3.5 clip-blade-right bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#b48628] text-[#05070b] font-hud font-bold text-base tracking-[0.2em] uppercase cursor-pointer shadow-[0_12px_36px_rgba(212,175,55,0.35)] hover:brightness-110 active:translate-x-1 transition-all whitespace-nowrap"
            >
              <span className="flex items-center gap-3">
                <span className="font-mono text-xs opacity-75">I.</span>
                <span>Enter Portfolio Verse</span>
              </span>
              <span className="text-xs tracking-widest group-hover:translate-x-1 transition-transform">
                START →
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveDrawer((prev) => (prev === 'sanctums' ? 'none' : 'sanctums'))
              }
              className={`group w-full max-w-md flex items-center justify-between px-5 py-2.5 clip-blade-right border-l-2 transition-all cursor-pointer font-hud text-sm tracking-[0.18em] uppercase whitespace-nowrap ${
                activeDrawer === 'sanctums'
                  ? 'border-[#2dd4bf] bg-[#0d1926]/90 text-[#2dd4bf]'
                  : 'border-[#d4af37]/40 bg-[#080d16]/75 hover:bg-[#0f1726]/90 hover:border-[#d4af37] text-[#e2e8f0]'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#d4af37]">II.</span>
                <span>6 Sanctum Case Studies</span>
              </span>
              <span className="font-mono text-[10px] text-[#94a3b8]">
                {activeDrawer === 'sanctums' ? 'CLOSE' : 'PREVIEW'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDrawer((prev) => (prev === 'saga' ? 'none' : 'saga'))}
              className={`group w-full max-w-md flex items-center justify-between px-5 py-2.5 clip-blade-right border-l-2 transition-all cursor-pointer font-hud text-sm tracking-[0.18em] uppercase whitespace-nowrap ${
                activeDrawer === 'saga'
                  ? 'border-[#f43f5e] bg-[#1f0913]/90 text-[#fda4af]'
                  : 'border-[#d4af37]/40 bg-[#080d16]/75 hover:bg-[#0f1726]/90 hover:border-[#d4af37] text-[#e2e8f0]'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#d4af37]">III.</span>
                <span>5-Act Saga &amp; Sept Layoff</span>
              </span>
              <span className="font-mono text-[10px] text-[#94a3b8]">
                {activeDrawer === 'saga' ? 'CLOSE' : 'CHRONICLE'}
              </span>
            </button>
          </nav>
        </div>

        {/* Right Column: On-Demand Sleek Glass Preview Panel */}
        {activeDrawer !== 'none' && (
          <div className="w-full max-w-md my-auto p-6 bg-[#070b13]/92 border border-[#d4af37]/35 backdrop-blur-xl shadow-2xl space-y-4 max-h-[64vh] overflow-y-auto">
            {activeDrawer === 'sanctums' ? (
              <>
                <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2.5">
                  <span className="font-hud font-bold text-xs tracking-[0.22em] uppercase text-[#2dd4bf]">
                    SIX SELF-CONTAINED SANCTUM ARCHIVES
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveDrawer('none')}
                    className="font-mono text-[10px] text-[#94a3b8] hover:text-white cursor-pointer"
                  >
                    [ESC]
                  </button>
                </div>
                <div className="space-y-2.5">
                  {PORTFOLIO_STOPS.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-[#0c1322]/90 border border-[#d4af37]/20 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-mono text-[10px] text-[#d4af37]">
                          {s.indexNumber} · {s.project.company} ({s.project.year})
                        </div>
                        <div className="font-sans font-semibold text-xs text-[#f8f5ee]">
                          {s.project.title}
                        </div>
                      </div>
                      <span className="font-hud font-bold text-xs text-[#2dd4bf] shrink-0">
                        +{s.unlockedPower.bonusDamage} ATK
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-[#f43f5e]/30 pb-2.5">
                  <span className="font-hud font-bold text-xs tracking-[0.22em] uppercase text-[#fda4af]">
                    THE 5-ACT SAGA &amp; SEPTEMBER LAYOFF
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveDrawer('none')}
                    className="font-mono text-[10px] text-[#94a3b8] hover:text-white cursor-pointer"
                  >
                    [ESC]
                  </button>
                </div>
                <p className="text-xs text-[#fde68a] leading-relaxed font-sans">
                  {CREATOR_PROFILE.layoffStory}
                </p>
                <div className="space-y-2">
                  {STORY_CHAPTERS.map((chap) => (
                    <div
                      key={chap.act}
                      className="p-2.5 bg-[#0c1322]/90 border border-[#d4af37]/20 space-y-1"
                    >
                      <div className="flex items-center justify-between font-hud text-xs font-bold text-[#d4af37]">
                        <span>
                          {chap.act} — {chap.title}
                        </span>
                        <span className="font-mono text-[10px] text-[#94a3b8]">{chap.era}</span>
                      </div>
                      <p className="text-[11px] text-[#cbd5e1] leading-snug">{chap.summary}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Widescreen Cinematic Letterbox Telemetry Bar */}
      <footer className="h-12 px-6 md:px-12 flex items-center justify-between border-t border-[#d4af37]/20 bg-[#04060a]/85 backdrop-blur-md font-hud text-xs tracking-[0.14em] uppercase text-[#94a3b8]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            <strong className="text-[#d4af37]">MOUSE</strong> FREE-AIM CAMERA
          </span>
          <span>·</span>
          <span>
            <strong className="text-[#d4af37]">WASD</strong> MOVE
          </span>
          <span>·</span>
          <span>
            <strong className="text-[#d4af37]">SHIFT</strong> SHADOW-STEP DASH
          </span>
          <span>·</span>
          <span>
            <strong className="text-[#d4af37]">LMB</strong> KATANA COMBO
          </span>
          <span>·</span>
          <span>
            <strong className="text-[#d4af37]">RMB</strong> SEKIRO DEFLECT
          </span>
          <span>·</span>
          <span>
            <strong className="text-[#d4af37]">G</strong> GRAPPLE
          </span>
        </div>
        <div className="hidden sm:block text-[#2dd4bf] font-mono text-[10px]">
          RAGA YAMAN SITAR · BANSURI · WAR-TAIKO ENGINE
        </div>
      </footer>
    </div>
  );
};
