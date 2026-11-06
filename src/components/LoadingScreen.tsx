import React from 'react';

interface LoadingScreenProps {
  progress: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#05070a] overflow-hidden">
      {/* Mythic Background Pattern (Subtle) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_#d4af37_0%,_transparent_70%)]" />
      </div>

      <div className="relative flex flex-col items-center max-w-md w-full px-8">
        {/* Sacred Icon (Glowing Lotus/Chakra) */}
        <div className="mb-12 relative">
          <div className="w-24 h-24 rounded-full border-2 border-[#d4af37]/30 flex items-center justify-center animate-[spin_10s_linear_infinite]">
            <div className="w-16 h-16 border-2 border-[#d4af37] rotate-45 flex items-center justify-center">
              <div className="w-10 h-10 bg-[#d4af37] animate-pulse" />
            </div>
          </div>
          <div className="absolute inset-0 blur-xl bg-[#d4af37]/20 rounded-full" />
        </div>

        {/* Game Title */}
        <h1 className="font-mythic text-4xl lg:text-5xl text-[#f8f5ee] mb-2 tracking-widest text-center drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
          PORTFOLIO VERSE
        </h1>
        <p className="font-hud text-[10px] text-[#d4af37] uppercase tracking-[0.4em] mb-12 opacity-80">
          The Awakening of the Sthapati
        </p>

        {/* Progress Bar (Gilded Scroll Style) */}
        <div className="w-full h-px bg-[#d4af37]/20 relative mb-4">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent shadow-[0_0_20px_#d4af37] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
          {/* Decorative Caps */}
          <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full border border-[#d4af37] bg-[#05070a]" />
          <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full border border-[#d4af37] bg-[#05070a]" />
        </div>

        {/* Progress Percentage */}
        <div className="flex justify-between w-full font-mono text-[9px] text-[#94a3b8] uppercase tracking-widest">
          <span>{Math.round(progress)}% SECALING ASCENT</span>
          <span>LOADING SAGA</span>
        </div>

        {/* Flavor Text */}
        <div className="mt-16 text-center italic text-[#cbd5e1] text-xs font-serif opacity-60">
          "The path of the creator is forged in the fires of discipline."
        </div>
      </div>
      
      {/* Decorative Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_black]" />
    </div>
  );
};
