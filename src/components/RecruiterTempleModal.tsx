import React, { useState } from 'react';
import {
  CREATOR_PROFILE,
  RECRUITER_TEMPLE_CONFIG,
} from '../data/portfolioStops';
import { sound } from '../game/sound';

interface RecruiterTempleModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatchedScrolls: { sender: string; organization: string; message: string; timestamp: string }[];
  onDispatchScroll: (entry: { sender: string; organization: string; message: string }) => void;
}

const OPPORTUNITY_TYPES = [
  {
    id: 'senior-ai',
    label: 'Senior / Staff Product Designer',
    sub: 'AI Native & B2B SaaS Systems',
  },
  {
    id: 'founding-0-1',
    label: 'Founding Product Designer',
    sub: '0→1 Agentic & FinTech Workflows',
  },
  {
    id: 'principal-systems',
    label: 'Principal UX & Systems Architect',
    sub: 'Multi-Agent Co-Pilots & Design Systems',
  },
  {
    id: 'advisory-sprint',
    label: 'Advisory / High-Impact Design Sprint',
    sub: 'Product Strategy & Interactive Prototypes',
  },
];

const IMPACT_HIGHLIGHTS = [
  { metric: '80% STP', label: 'AI Invoice & Payment Automation' },
  { metric: '0 → 1', label: 'HyperLM Vera CFO AI Workspace' },
  { metric: '6 Shipped', label: 'Enterprise AI, FinTech & Gaming Flagships' },
];

export const RecruiterTempleModal: React.FC<RecruiterTempleModalProps> = ({
  isOpen,
  onClose,
  dispatchedScrolls,
  onDispatchScroll,
}) => {
  const [senderName, setSenderName] = useState('');
  const [organization, setOrganization] = useState('');
  const [opportunityType, setOpportunityType] = useState(
    `${OPPORTUNITY_TYPES[0].label} (${OPPORTUNITY_TYPES[0].sub})`
  );
  const [customMessage, setCustomMessage] = useState(
    'Hi Ayush, we explored your playable Portfolio Verse and were impressed by your 0→1 AI & FinTech systems work. We would love to connect regarding a Senior Product Designer opportunity.'
  );
  const [sealedSuccessBanner, setSealedSuccessBanner] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const buildMailtoHref = () => {
    const cleanSender = senderName.trim() || 'Recruiter / Hiring Lead';
    const cleanOrg = organization.trim() || 'Product Team';
    const subject = encodeURIComponent(
      `[Portfolio Verse Opportunity] ${opportunityType} — ${cleanOrg}`
    );
    const body = encodeURIComponent(
      `${customMessage.trim()}\n\n---\nFrom: ${cleanSender}\nOrganization: ${cleanOrg}\nRole / Track: ${opportunityType}\nDispatched from Sankalpa Mandapa — Temple of Opportunities`
    );
    return `mailto:${CREATOR_PROFILE.email}?subject=${subject}&body=${body}`;
  };

  const handleCopyEmail = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(CREATOR_PROFILE.email).catch(() => {});
    }
    sound.playRelicChime(false);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2400);
  };

  const handleSealAndEmail = (launchEmailClient: boolean) => {
    const cleanSender = senderName.trim() || 'Hiring Partner';
    const cleanOrg = organization.trim() || 'Product Studio';
    const fullMsg = `[${opportunityType}] ${customMessage.trim()}`;

    onDispatchScroll({
      sender: cleanSender,
      organization: cleanOrg,
      message: fullMsg,
    });
    sound.playRelicChime(true);

    setSealedSuccessBanner(
      launchEmailClient
        ? `Opportunity Scroll sealed & opening mail client to ${CREATOR_PROFILE.email}`
        : `Opportunity Scroll recorded in the Sankalpa Mandapa Temple Ledger`
    );

    if (launchEmailClient && typeof window !== 'undefined') {
      const link = document.createElement('a');
      link.href = buildMailtoHref();
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      data-testid="recruiter-temple-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recruiter-temple-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#03060c]/90 backdrop-blur-xl pointer-events-auto"
    >
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#070b14] border border-[#d4af37]/45 text-[#f8f5ee] shadow-[0_32px_90px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Top Architectural Header */}
        <header className="px-6 py-4 bg-gradient-to-r from-[#0c1220] via-[#12192b] to-[#0c1220] border-b border-[#d4af37]/30 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Custom Architectural Temple Mandala SVG */}
            <div className="w-11 h-11 shrink-0 flex items-center justify-center bg-[#0b1322] border border-[#d4af37]/45">
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <polygon
                  points="16,3 28,10 28,22 16,29 4,22 4,10"
                  stroke="#d4af37"
                  strokeWidth="1.4"
                  fill="rgba(212,175,55,0.08)"
                />
                <polygon
                  points="16,7 24,16 16,25 8,16"
                  stroke="#2dd4bf"
                  strokeWidth="1.2"
                  fill="rgba(45,212,191,0.12)"
                />
                <circle cx="16" cy="16" r="2.5" fill="#fef08a" />
              </svg>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-[#2dd4bf]">
                <span>SOUTHERN SANCTUARY</span>
                <span className="text-[#d4af37]/50">·</span>
                <span className="text-[#d4af37]">{RECRUITER_TEMPLE_CONFIG.subtitle}</span>
              </div>
              <h2
                id="recruiter-temple-title"
                className="font-display text-lg sm:text-2xl font-bold text-[#f8f5ee] tracking-wide truncate mt-0.5"
              >
                {RECRUITER_TEMPLE_CONFIG.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-recruiter-temple-btn"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-[#d4af37]/40 bg-[#0c1424] hover:bg-[#16233d] font-mono text-xs text-[#fef08a] tracking-wider uppercase cursor-pointer transition-colors shrink-0"
          >
            [ESC · RETURN TO WORLD]
          </button>
        </header>

        {/* Main 12-Column Architectural Body */}
        <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN (5 Cols): Executive Designer Profile & Direct Channels */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Candidate Dossier Block */}
              <div className="p-4 bg-[#0b1220] border border-[#d4af37]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">
                    CANDIDATE DOSSIER
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#062421] border border-[#2dd4bf]/40 font-mono text-[9px] text-[#2dd4bf] uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]" />
                    Open to Roles
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#fef08a]">
                    {CREATOR_PROFILE.name}
                  </h3>
                  <p className="font-sans text-xs text-[#cbd5e1] mt-1 leading-relaxed">
                    Senior Product Designer specializing in 0→1 Agentic AI Workspaces, B2B FinTech
                    Automation, and Interactive Systems.
                  </p>
                </div>

                {/* 3 Key Impact Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#d4af37]/20">
                  {IMPACT_HIGHLIGHTS.map((item, i) => (
                    <div key={i} className="p-2 bg-[#070c16] border border-[#d4af37]/15">
                      <div className="font-hud text-xs sm:text-sm font-bold text-[#2dd4bf]">
                        {item.metric}
                      </div>
                      <div className="font-sans text-[10px] text-[#94a3b8] leading-tight mt-0.5">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Executive Channels (Clean Stacked Cards — Zero Jumbled Buttons) */}
              <div className="space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#94a3b8]">
                  DIRECT CHANNELS &amp; CREDENTIALS
                </div>

                {/* Channel 1: Direct Email + Copy */}
                <div className="p-3 bg-[#0b1220] border border-[#d4af37]/35 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-[#d4af37]">
                      DIRECT ELECTRONIC MAIL
                    </div>
                    <div className="font-mono text-xs font-bold text-[#f8f5ee] truncate mt-0.5">
                      {CREATOR_PROFILE.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="px-2.5 py-1 bg-[#111c30] hover:bg-[#1b2c4a] border border-[#d4af37]/35 font-mono text-[10px] text-[#cbd5e1] uppercase cursor-pointer"
                    >
                      {copiedEmail ? 'COPIED ✓' : 'COPY'}
                    </button>
                    <a
                      href={`mailto:${CREATOR_PROFILE.email}?subject=${encodeURIComponent(
                        'Senior Product Designer Opportunity — via Portfolio Verse'
                      )}`}
                      data-testid="temple-direct-mailto-link"
                      className="px-3 py-1 bg-[#d4af37] hover:bg-[#fef08a] text-[#05070b] font-hud text-[10px] font-extrabold uppercase tracking-wider cursor-pointer"
                    >
                      MAIL →
                    </a>
                  </div>
                </div>

                {/* Channel 2: 15-Min Discovery Call */}
                <a
                  href={CREATOR_PROFILE.calUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[#0b1220] hover:bg-[#101c30] border border-[#2dd4bf]/35 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-wider text-[#2dd4bf]">
                      INSTANT CALENDAR BOOKING
                    </div>
                    <div className="font-sans text-xs font-semibold text-[#f8f5ee] mt-0.5">
                      Schedule a 15-Minute Intro Call (Cal.com)
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-[#06242a] border border-[#2dd4bf]/50 font-hud text-[10px] font-bold text-[#2dd4bf] uppercase tracking-wider shrink-0">
                    BOOK →
                  </span>
                </a>

                {/* Channel 3: Official 2026 PDF Resume */}
                <a
                  href={CREATOR_PROFILE.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[#0b1220] hover:bg-[#101c30] border border-[#d4af37]/30 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-wider text-[#fef08a]">
                      CURRICULUM VITAE (PDF)
                    </div>
                    <div className="font-sans text-xs font-semibold text-[#f8f5ee] mt-0.5">
                      Ayush Dubey — Senior Product Designer 2026
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-[#161e31] border border-[#d4af37]/45 font-hud text-[10px] font-bold text-[#fef08a] uppercase tracking-wider shrink-0">
                    OPEN PDF ↗
                  </span>
                </a>
              </div>
            </div>

            {/* Live Temple Ledger Summary */}
            <div className="p-3.5 bg-[#090f1c] border border-[#2dd4bf]/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#2dd4bf]">
                  SEALED TEMPLE LEDGER ({dispatchedScrolls.length})
                </span>
                <span className="font-mono text-[9px] text-[#64748b] uppercase">
                  VERIFIED OFFERS
                </span>
              </div>
              <div className="space-y-1.5 max-h-[88px] overflow-y-auto pr-1">
                {dispatchedScrolls.map((scroll, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-[#060a12] border border-[#d4af37]/20 space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#fef08a] font-semibold truncate">
                        {scroll.sender} · {scroll.organization}
                      </span>
                      <span className="text-[#2dd4bf] shrink-0">{scroll.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] line-clamp-1 leading-snug">
                      {scroll.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (7 Cols): Structured Opportunity Offer Composer */}
          <div className="lg:col-span-7 bg-[#0b1220] border border-[#d4af37]/35 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="border-b border-[#d4af37]/20 pb-2.5 flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">
                    OPPORTUNITY DISPATCH SCROLL
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#f8f5ee] mt-0.5">
                    Extend an Opportunity or Interview Invitation
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-[#2dd4bf] uppercase">
                  STEP ONTO THE ALTAR
                </span>
              </div>

              {sealedSuccessBanner && (
                <div
                  data-testid="temple-dispatch-confirmation"
                  className="p-3 bg-[#062421] border border-[#2dd4bf] text-[#ccfbf1] text-xs flex items-center justify-between gap-3"
                >
                  <span className="font-medium">{sealedSuccessBanner}</span>
                  <span className="font-mono text-[10px] uppercase text-[#fef08a] shrink-0">
                    SEALED ✓
                  </span>
                </div>
              )}

              {/* Sender & Company Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#cbd5e1] mb-1">
                    Your Name &amp; Title
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g., Sarah Chen, VP of Design"
                    className="w-full px-3 py-2 bg-[#060a12] border border-[#d4af37]/35 text-[#f8f5ee] text-xs sm:text-sm placeholder-[#64748b] focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#cbd5e1] mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g., Stripe / Anthropic / Series B AI"
                    className="w-full px-3 py-2 bg-[#060a12] border border-[#d4af37]/35 text-[#f8f5ee] text-xs sm:text-sm placeholder-[#64748b] focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>
              </div>

              {/* Role Track 2x2 Grid */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#cbd5e1] mb-1.5">
                  Select Role / Engagement Track
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OPPORTUNITY_TYPES.map((item) => {
                    const valueStr = `${item.label} (${item.sub})`;
                    const active = opportunityType === valueStr;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setOpportunityType(valueStr)}
                        className={`p-2.5 text-left border transition-all cursor-pointer ${
                          active
                            ? 'bg-[#17130a] border-[#d4af37] text-[#fef08a] shadow-[0_4px_18px_rgba(212,175,55,0.18)]'
                            : 'bg-[#060a12] border-[#d4af37]/20 text-[#cbd5e1] hover:border-[#d4af37]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-sans text-xs font-bold">{item.label}</span>
                          <span className="font-mono text-[10px] text-[#d4af37]">
                            {active ? '◆' : '◇'}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-[#94a3b8] mt-0.5">
                          {item.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Area */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#cbd5e1] mb-1">
                  Note &amp; Role Context for Ayush
                </label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#060a12] border border-[#d4af37]/35 text-[#f8f5ee] text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-[#2dd4bf]"
                />
              </div>
            </div>

            {/* Clean Primary & Secondary Action Bar */}
            <div className="pt-3 border-t border-[#d4af37]/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                data-testid="temple-send-email-btn"
                onClick={() => handleSealAndEmail(true)}
                className="flex-1 px-5 py-2.5 bg-[#d4af37] hover:bg-[#fef08a] text-[#05070b] font-hud text-xs font-extrabold uppercase tracking-[0.14em] cursor-pointer transition-colors text-center shadow-[0_10px_28px_rgba(212,175,55,0.3)]"
              >
                ✉️ Dispatch via Email &amp; Seal Scroll
              </button>

              <button
                type="button"
                data-testid="temple-seal-only-btn"
                onClick={() => handleSealAndEmail(false)}
                className="px-4 py-2.5 border border-[#2dd4bf]/60 bg-[#071f24] hover:bg-[#0d333b] text-[#ccfbf1] font-hud text-xs font-bold uppercase tracking-[0.14em] cursor-pointer transition-colors text-center"
              >
                📜 Seal in Temple Ledger
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
