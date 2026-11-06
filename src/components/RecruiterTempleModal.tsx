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
        <div className="p-5 sm:p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN (5 Cols): Executive Designer Profile & Direct Channels */}
          <div className="lg:col-span-5 space-y-6">
            {/* Candidate Dossier Block */}
            <div className="p-5 bg-[#0b1220] border border-[#d4af37]/30 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">
                  CANDIDATE DOSSIER
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#062421] border border-[#2dd4bf]/40 font-mono text-[9px] text-[#2dd4bf] uppercase font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] shadow-[0_0_8px_#2dd4bf]" />
                  Open to Roles
                </span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#fef08a] leading-tight">
                {CREATOR_PROFILE.name}
              </h3>
              <p className="font-sans text-sm text-[#cbd5e1] mt-2 leading-relaxed opacity-90">
                Senior Product Designer specializing in 0→1 Agentic AI Workspaces, B2B FinTech
                Automation, and Interactive Systems.
              </p>

              {/* 3 Key Impact Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-5 mt-5 border-t border-[#d4af37]/20">
                {IMPACT_HIGHLIGHTS.map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="font-hud text-lg font-black text-[#2dd4bf]">
                      {item.metric}
                    </div>
                    <div className="font-sans text-[9px] text-[#94a3b8] uppercase tracking-wider leading-tight mt-1">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Executive Channels */}
            <div className="space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#94a3b8] px-1">
                DIRECT CHANNELS
              </div>

              {/* Channel 1: Direct Email */}
              <div className="group p-4 bg-[#0b1220] border border-[#d4af37]/25 hover:border-[#d4af37]/50 transition-all flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-[#d4af37] opacity-80">
                    ELECTRONIC MAIL
                  </div>
                  <div className="font-mono text-sm font-bold text-[#f8f5ee] truncate mt-0.5">
                    {CREATOR_PROFILE.email}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="p-2 bg-[#111c30] hover:bg-[#1b2c4a] border border-[#d4af37]/35 font-mono text-[10px] text-[#cbd5e1] uppercase cursor-pointer transition-colors"
                  >
                    {copiedEmail ? 'COPIED' : 'COPY'}
                  </button>
                  <a
                    href={`mailto:${CREATOR_PROFILE.email}?subject=${encodeURIComponent(
                      'Senior Product Designer Opportunity — via Portfolio Verse'
                    )}`}
                    className="px-4 py-2 bg-[#d4af37] hover:bg-[#fef08a] text-[#05070b] font-hud text-[11px] font-black uppercase tracking-wider cursor-pointer transition-transform active:scale-95"
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
                className="group p-4 bg-[#0b1220] hover:bg-[#121c32] border border-[#2dd4bf]/25 hover:border-[#2dd4bf]/50 transition-all flex items-center justify-between gap-4 cursor-pointer"
              >
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-[#2dd4bf] opacity-80">
                    CALENDAR BOOKING
                  </div>
                  <div className="font-sans text-sm font-bold text-[#f8f5ee] mt-0.5">
                    Schedule 15-Min Intro Call
                  </div>
                </div>
                <span className="px-4 py-2 bg-[#06242a] border border-[#2dd4bf]/50 font-hud text-[11px] font-black text-[#2dd4bf] uppercase tracking-wider shrink-0 transition-colors group-hover:bg-[#0b3d45]">
                  BOOK →
                </span>
              </a>

              {/* Channel 3: Official 2026 PDF Resume */}
              <a
                href={CREATOR_PROFILE.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 bg-[#0b1220] hover:bg-[#151b2a] border border-[#d4af37]/20 hover:border-[#d4af37]/45 transition-all flex items-center justify-between gap-4 cursor-pointer"
              >
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-[#fef08a] opacity-80">
                    CURRICULUM VITAE
                  </div>
                  <div className="font-sans text-sm font-bold text-[#f8f5ee] mt-0.5">
                    Designer Portfolio PDF
                  </div>
                </div>
                <span className="px-4 py-2 bg-[#161e31] border border-[#d4af37]/45 font-hud text-[11px] font-black text-[#fef08a] uppercase tracking-wider shrink-0 transition-colors group-hover:bg-[#1e2a44]">
                  OPEN ↗
                </span>
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN (7 Cols): Structured Opportunity Offer Composer */}
          <div className="lg:col-span-7 bg-[#0b1220]/80 border border-[#d4af37]/35 p-6 flex flex-col justify-between shadow-2xl relative">
            <div className="space-y-6">
              <div className="border-b border-[#d4af37]/20 pb-4 flex items-end justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">
                    OPPORTUNITY DISPATCH
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#f8f5ee] mt-1">
                    Extend an Invitation
                  </h3>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[9px] text-[#2dd4bf] uppercase font-bold tracking-widest">
                    TEMPLE LEDGER
                  </div>
                  <div className="font-hud text-lg font-black text-[#2dd4bf]">
                    {dispatchedScrolls.length}
                  </div>
                </div>
              </div>

              {sealedSuccessBanner && (
                <div
                  data-testid="temple-dispatch-confirmation"
                  className="p-4 bg-[#062421] border border-[#2dd4bf] text-[#ccfbf1] text-sm flex items-center justify-between gap-3 animate-fade-in"
                >
                  <span className="font-semibold">{sealedSuccessBanner}</span>
                  <span className="font-mono text-[10px] uppercase text-[#fef08a] font-black shrink-0">
                    SEALED ✓
                  </span>
                </div>
              )}

              {/* Sender & Company Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-[#94a3b8] font-bold">
                    Full Name & Title
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g., Sarah Chen, VP of Design"
                    className="w-full px-4 py-3 bg-[#060a12] border border-[#d4af37]/30 text-[#f8f5ee] text-sm placeholder-[#475569] focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-[#94a3b8] font-bold">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g., Stripe / Anthropic"
                    className="w-full px-4 py-3 bg-[#060a12] border border-[#d4af37]/30 text-[#f8f5ee] text-sm placeholder-[#475569] focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                </div>
              </div>

              {/* Role Track - Simplified Grid */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase tracking-widest text-[#94a3b8] font-bold">
                  Engagement Track
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {OPPORTUNITY_TYPES.map((item) => {
                    const valueStr = `${item.label} (${item.sub})`;
                    const active = opportunityType === valueStr;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setOpportunityType(valueStr)}
                        className={`group p-3 text-left border transition-all cursor-pointer ${
                          active
                            ? 'bg-[#17130a] border-[#d4af37] text-[#fef08a] ring-1 ring-[#d4af37]/30'
                            : 'bg-[#060a12] border-[#d4af37]/20 text-[#cbd5e1] hover:border-[#d4af37]/50'
                        }`}
                      >
                        <div className="font-sans text-xs font-black uppercase tracking-tight group-hover:text-[#fef08a] transition-colors">
                          {item.label}
                        </div>
                        <div className="font-mono text-[9px] text-[#94a3b8] mt-1 group-hover:text-[#cbd5e1]">
                          {item.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Area */}
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase tracking-widest text-[#94a3b8] font-bold">
                  Custom Context
                </label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-[#060a12] border border-[#d4af37]/30 text-[#f8f5ee] text-sm leading-relaxed focus:outline-none focus:border-[#2dd4bf] transition-colors"
                />
              </div>

              {/* Primary Actions */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleSealAndEmail(true)}
                  className="flex-1 w-full px-6 py-3.5 bg-[#d4af37] hover:bg-[#fef08a] text-[#05070b] font-hud text-xs font-black uppercase tracking-[0.2em] cursor-pointer transition-all shadow-xl hover:shadow-[#d4af37]/20 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  ✉️ Dispatch Opportunity
                </button>
                <button
                  type="button"
                  onClick={() => handleSealAndEmail(false)}
                  className="w-full sm:w-auto px-6 py-3.5 border-2 border-[#2dd4bf]/40 bg-[#071f24] hover:bg-[#0d333b] text-[#2dd4bf] font-hud text-xs font-black uppercase tracking-[0.2em] cursor-pointer transition-all"
                >
                  📜 Seal in Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
