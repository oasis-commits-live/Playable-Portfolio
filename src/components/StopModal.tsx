import React, { useRef, useState } from 'react';
import {
  CREATOR_PROFILE,
  CAREER_EXPERIENCE,
  PORTFOLIO_STOPS,
  STORY_CHAPTERS,
  PortfolioStop,
} from '../data/portfolioStops';
import {
  getReferenceCaseStudy,
  REFERENCE_ENDORSEMENTS,
  REFERENCE_TOOL_STACK,
} from '../data/referenceCaseStudies';
import { CaseStudyVisuals } from './CaseStudyVisuals';

interface StopModalProps {
  stop: PortfolioStop;
  onClose: () => void;
  onSelectStop: (stopId: string) => void;
  visitedStopIds: Set<string>;
  dispatchedScrolls: { sender: string; organization: string; message: string; timestamp: string }[];
  onDispatchScroll: (entry: { sender: string; organization: string; message: string }) => void;
}

type ScrollTab = 'project' | 'story' | 'experience' | 'about' | 'contact';
type CaseStudySection = 'overview' | 'workflow' | 'research';

const SHORT_CASE_STUDY_LABELS: Record<string, string> = {
  'cfos-ai-workspace': 'HyperLM Vera',
  'nexatech-bridge': 'Bridge Handoff',
  'oasis-arcade': 'Oasis Arcade',
  'payments-copilot': 'Payments Co-Pilot',
  'hypo-mascot': 'Hypo Mascot',
  'invoice-copilot': 'Invoice Co-Pilot',
};

export const StopModal: React.FC<StopModalProps> = ({
  stop,
  onClose,
  onSelectStop,
  visitedStopIds,
  dispatchedScrolls,
  onDispatchScroll,
}) => {
  const [activeTab, setActiveTab] = useState<ScrollTab>('project');
  const [caseSection, setCaseSection] = useState<CaseStudySection>('overview');
  const [senderName, setSenderName] = useState('');
  const [organization, setOrganization] = useState('');
  const [messageText, setMessageText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const currentIdx = PORTFOLIO_STOPS.findIndex((s) => s.id === stop.id);
  const prevStop = PORTFOLIO_STOPS[(currentIdx - 1 + PORTFOLIO_STOPS.length) % PORTFOLIO_STOPS.length];
  const nextStop = PORTFOLIO_STOPS[(currentIdx + 1) % PORTFOLIO_STOPS.length];

  const proj = stop.project;
  const cs = getReferenceCaseStudy(proj.id);
  const nextCs = getReferenceCaseStudy(nextStop.project.id);
  const nextShortTitle = SHORT_CASE_STUDY_LABELS[nextStop.project.id] || nextCs.externalLabel;
  const projectHref = cs.prototypeUrl || cs.externalUrl || '';
  const projectCtaLabel = cs.prototypeUrl ? 'Live Prototype' : 'Live Product';

  const handleJumpToSection = (sectionId: string) => {
    setActiveTab('project');
    setCaseSection('overview');
    setTimeout(() => {
      const el = document.getElementById(`cs-section-${sectionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
  };

  const handleCommissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !messageText.trim()) {
      setFormError('Please enter both your Name and Message.');
      return;
    }
    setFormError(null);
    onDispatchScroll({
      sender: senderName.trim(),
      organization: organization.trim() || 'Recruiter / Hiring Partner',
      message: messageText.trim(),
    });
    setSenderName('');
    setOrganization('');
    setMessageText('');
    setSubmitSuccess(true);
  };

  const handleDownloadDossier = () => {
    const payload = {
      designer: CREATOR_PROFILE,
      storyChronicle: STORY_CHAPTERS,
      careerExperience: CAREER_EXPERIENCE,
      featuredProjects: PORTFOLIO_STOPS.map((s) => ({
        ...s.project,
        referenceCaseStudy: getReferenceCaseStudy(s.project.id),
      })),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ayush-dubey-portfolio-codex.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stop-modal-title"
      className="fixed inset-0 z-30 flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-[#03050a]/88 pointer-events-auto backdrop-blur-md"
    >
      {/* Widescreen AAA Mythic Codex Split-View */}
      <div className="relative w-full max-w-[1140px] h-[92vh] lg:h-[88vh] bg-[#070b13] border border-[#d4af37]/45 shadow-[0_30px_90px_rgba(0,0,0,0.96)] flex flex-row overflow-hidden text-[#f4efe6]">
        {/* LEFT COLUMN: SANCTUM ARCHIVE SELECTOR, CASE STUDY STRUCTURE & ASTRA WEAPON PANEL */}
        <aside className="w-[210px] sm:w-[240px] lg:w-[295px] bg-[#05080f] border-r border-[#d4af37]/25 p-3 lg:p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-3.5 lg:space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-hud text-[11px] lg:text-xs font-bold tracking-[0.2em] uppercase text-[#d4af37]">
                SANCTUM {stop.indexNumber}/06
              </span>
              <span className="font-mono text-[9px] lg:text-[10px] text-[#2dd4bf]">
                {visitedStopIds.size}/6 AWAKENED
              </span>
            </div>

            {/* Sacred Geometric Astra Mandala SVG */}
            <div className="relative py-2.5 lg:py-3.5 flex flex-col items-center justify-center border border-[#d4af37]/20 bg-[#080d18]">
              <svg width="56" height="56" viewBox="0 0 100 100" className="mb-1 lg:w-[72px] lg:h-[72px]">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={stop.accentColor}
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                />
                <polygon
                  points="50,12 88,50 50,88 12,50"
                  fill="none"
                  stroke="#d4af37"
                  strokeWidth="1.5"
                />
                <polygon
                  points="50,22 78,50 50,78 22,50"
                  fill={stop.accentColor}
                  fillOpacity="0.18"
                  stroke={stop.accentColor}
                  strokeWidth="1.4"
                />
                <circle cx="50" cy="50" r="8" fill="#d4af37" />
              </svg>
              <div className="font-hud text-[11px] lg:text-xs font-bold tracking-[0.16em] uppercase text-[#2dd4bf]">
                +{stop.unlockedPower.bonusDamage} ATK FORGED
              </div>
              <div className="font-mythic italic text-xs text-[#f4efe6] text-center px-2 mt-0.5">
                {stop.unlockedPower.name}
              </div>
            </div>

            {/* Case Study Structure Jump Index (Transferred from Reference Portfolio Sidebar) */}
            <div className="p-3 bg-[#080d18] border border-[#d4af37]/20 space-y-1.5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#94a3b8] pb-1 border-b border-[#d4af37]/15">
                Case Study Structure
              </div>
              {cs.sections.map((sec, idx) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => handleJumpToSection(sec.id)}
                  className="w-full text-left px-2 py-1.5 bg-[#0b1220] hover:bg-[#d4af37] hover:text-[#05070b] text-[#e2e8f0] font-mono text-[11px] transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">
                    {String(idx + 1).padStart(2, '0')}. {sec.title}
                  </span>
                  <span>→</span>
                </button>
              ))}
            </div>

            {/* 01–06 Sanctum Fast-Switch List */}
            <div className="space-y-1">
              <div className="font-hud text-[10px] font-bold tracking-[0.2em] uppercase text-[#94a3b8] pb-1">
                ALL 6 CASE STUDIES
              </div>
              {PORTFOLIO_STOPS.map((s) => {
                const isSelected = s.id === stop.id;
                const isVisited = visitedStopIds.has(s.id);
                const stopCs = getReferenceCaseStudy(s.project.id);
                const shortLabel = SHORT_CASE_STUDY_LABELS[s.project.id] || stopCs.externalLabel;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onSelectStop(s.id);
                      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 lg:px-3 lg:py-2 clip-blade-right text-left transition-all cursor-pointer border-l-2 ${
                      isSelected
                        ? 'bg-[#d4af37] text-[#05070b] border-[#fef9c3] font-bold'
                        : 'bg-[#0a101d] hover:bg-[#111b30] text-[#cbd5e1] border-[#d4af37]/30'
                    }`}
                  >
                    <span className="font-hud text-[11px] uppercase tracking-wider truncate">
                      {s.indexNumber}. {shortLabel}
                    </span>
                    <span
                      className={`font-mono text-[9px] shrink-0 ${
                        isSelected
                          ? 'text-[#05070b]'
                          : isVisited
                          ? 'text-[#2dd4bf]'
                          : 'text-[#64748b]'
                      }`}
                    >
                      {isVisited ? '●' : '○'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prev / Next Sanctum Switcher */}
          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#d4af37]/20 font-hud text-xs uppercase tracking-wider">
            <button
              type="button"
              onClick={() => {
                onSelectStop(prevStop.id);
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-2.5 py-1 bg-[#0c1424] hover:bg-[#16233d] border border-[#d4af37]/30 text-[#e2e8f0] cursor-pointer"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectStop(nextStop.id);
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-2.5 py-1 bg-[#0c1424] hover:bg-[#16233d] border border-[#d4af37]/30 text-[#e2e8f0] cursor-pointer"
            >
              Next →
            </button>
          </div>
        </aside>

        {/* RIGHT COLUMN: EDITORIAL CASE STUDY & PORTFOLIO CODEX */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header */}
          <header className="px-4 lg:px-6 pt-3 lg:pt-4 pb-2.5 lg:pb-3.5 border-b border-[#d4af37]/20 bg-[#080d18] flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 font-hud text-xs font-bold tracking-[0.18em] uppercase text-[#d4af37]">
                <span>{cs.client}</span>
                <span className="text-[#64748b]">·</span>
                <span>{cs.projectType}</span>
                <span className="text-[#64748b]">·</span>
                <span>{cs.year}</span>
                <span className="text-[#64748b]">·</span>
                <span className="text-[#2dd4bf]">{cs.category}</span>
              </div>
              <h2
                id="stop-modal-title"
                className="font-display text-lg sm:text-xl lg:text-2xl font-extrabold text-[#f8f5ee] tracking-tight leading-snug"
              >
                {cs.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {projectHref && (
                <a
                  href={projectHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="header-project-external-link"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#d4af37] hover:bg-[#fde68a] text-[#05070b] font-hud text-xs font-bold tracking-[0.14em] uppercase transition-colors cursor-pointer"
                >
                  <span>{projectCtaLabel}</span>
                  <span>↗</span>
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Ancient Scroll"
                className="px-3.5 py-1.5 clip-blade-right bg-[#131d31] hover:bg-[#d4af37] hover:text-[#05070b] border-l-2 border-[#d4af37] font-hud text-xs font-bold tracking-[0.18em] uppercase text-[#f8f5ee] transition-colors cursor-pointer shrink-0"
              >
                Close [Esc]
              </button>
            </div>
          </header>

          {/* Primary Codex Navigation Tabs + Sub-Section Filter */}
          <div className="px-4 lg:px-6 py-2 bg-[#060a12] border-b border-[#d4af37]/20 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { id: 'project', label: '01. Case Study' },
                  { id: 'story', label: '02. 5-Act Saga' },
                  { id: 'experience', label: '03. Experience' },
                  { id: 'about', label: '04. Craft & Stack' },
                  { id: 'contact', label: '05. Connect' },
                ] as { id: ScrollTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 font-hud text-xs font-bold tracking-[0.14em] uppercase transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#d4af37] text-[#05070b]'
                      : 'text-[#94a3b8] hover:text-[#f8f5ee] hover:bg-[#0e1628]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'project' && (
              <div className="flex items-center gap-1 bg-[#0b1220] p-0.5 border border-[#d4af37]/25">
                {(
                  [
                    { id: 'overview', label: 'Full Case Study' },
                    { id: 'workflow', label: 'Process & Screens' },
                    { id: 'research', label: 'Problem & Impact' },
                  ] as { id: CaseStudySection; label: string }[]
                ).map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setCaseSection(sec.id)}
                    className={`px-2.5 py-0.5 font-hud text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      caseSection === sec.id
                        ? 'bg-[#2dd4bf] text-[#05070b]'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Scrollable Content Area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5"
          >
            {activeTab === 'project' && (
              <>
                <CaseStudyVisuals
                  projectId={proj.id}
                  accentColor={stop.accentColor}
                  activeSection={caseSection}
                />

                {/* Bottom Case Study Navigation Footer (Matching Reference Portfolio) */}
                <div className="pt-4 border-t border-[#d4af37]/25 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 bg-[#0c1424] hover:bg-[#16233d] border border-[#d4af37]/35 font-hud text-xs font-bold uppercase tracking-wider text-[#f8f5ee] cursor-pointer"
                    >
                      ← Return to 3D World
                    </button>
                    {projectHref && (
                      <a
                        href={projectHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-[#091921] hover:bg-[#102d3b] border border-[#2dd4bf]/50 font-hud text-xs font-bold uppercase tracking-wider text-[#2dd4bf] inline-flex items-center gap-2 cursor-pointer"
                      >
                        <span>
                          {projectCtaLabel}: {cs.externalLabel}
                        </span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectStop(nextStop.id);
                      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 clip-blade-right bg-[#d4af37] hover:bg-[#fde68a] text-[#05070b] font-hud text-xs font-bold uppercase tracking-wider inline-flex items-center justify-between sm:justify-center gap-2.5 cursor-pointer"
                  >
                    <span className="opacity-75">Next Case Study:</span>
                    <span className="truncate max-w-[230px]">{nextShortTitle}</span>
                    <span>→</span>
                  </button>
                </div>
              </>
            )}

            {activeTab === 'story' && (
              <div className="space-y-3">
                <div className="p-4 bg-[#1c0811] border border-[#f43f5e]/45 space-y-1">
                  <div className="font-hud text-xs font-bold uppercase tracking-[0.2em] text-[#fda4af]">
                    THE SEPTEMBER LAYOFF CHAPTER
                  </div>
                  <p className="font-sans text-xs text-[#fde68a] leading-relaxed">
                    {CREATOR_PROFILE.layoffStory}
                  </p>
                </div>

                {STORY_CHAPTERS.map((chap) => (
                  <div
                    key={chap.act}
                    className="p-3.5 bg-[#0b111e] border border-[#d4af37]/20 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-hud text-sm font-bold text-[#d4af37]">
                        {chap.act} — {chap.title}
                      </span>
                      <span className="font-mono text-[10px] text-[#2dd4bf]">{chap.era}</span>
                    </div>
                    <p className="font-sans text-xs text-[#cbd5e1] leading-relaxed">
                      {chap.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3.5 bg-[#09101d] border border-[#d4af37]/30">
                  <div>
                    <div className="font-hud text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">
                      CAREER TRACK RECORD &amp; EDUCATION
                    </div>
                    <div className="font-mono text-[11px] text-[#94a3b8]">
                      {CREATOR_PROFILE.education}
                    </div>
                  </div>
                  <a
                    href={CREATOR_PROFILE.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-[#d4af37] hover:bg-[#fde68a] text-[#05070b] font-hud text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0"
                  >
                    View / Download Resume ↗
                  </a>
                </div>

                {CAREER_EXPERIENCE.map((exp, idx) => (
                  <div
                    key={exp.institution}
                    className="p-4 bg-[#0b111e] border border-[#d4af37]/25 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-hud text-sm font-bold text-[#f8f5ee]">
                        0{idx + 1}. {exp.role} · <span className="text-[#d4af37]">{exp.institution}</span>
                      </span>
                      <span className="font-mono text-[10px] text-[#2dd4bf]">{exp.era}</span>
                    </div>
                    <ul className="space-y-1 font-sans text-xs text-[#cbd5e1]">
                      {exp.highlights.map((h, hi) => (
                        <li key={hi} className="flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rotate-45 bg-[#d4af37] shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Collaborator Endorsements from Reference Portfolio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {REFERENCE_ENDORSEMENTS.map((end) => (
                    <div
                      key={end.author}
                      className="p-4 bg-[#09101d] border border-[#d4af37]/20 space-y-2"
                    >
                      <p className="font-sans text-xs italic text-[#e2e8f0] leading-relaxed">
                        “{end.quote}”
                      </p>
                      <div className="font-mono text-[11px] text-[#d4af37]">
                        {end.author} · <span className="text-[#94a3b8]">{end.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#0b111e] border border-[#d4af37]/25 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-hud text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">
                      {CREATOR_PROFILE.name} · {CREATOR_PROFILE.title}
                    </div>
                    <a
                      href={CREATOR_PROFILE.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#d4af37] hover:bg-[#fde68a] text-[#05070b] font-hud text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Open Official Resume PDF ↗
                    </a>
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                    {CREATOR_PROFILE.manifesto}
                  </p>
                  <div className="pt-1 font-mono text-[11px] text-[#2dd4bf]">
                    🎓 {CREATOR_PROFILE.education} · 📍 {CREATOR_PROFILE.location}
                  </div>
                </div>

                {/* Toolkit & Daily Arsenal with Authentic Logos & Links from Reference Portfolio */}
                <div className="p-4 bg-[#09101d] border border-[#d4af37]/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-hud text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">
                      MY STACK · 9 PRIMARY TOOLS &amp; WORKFLOWS
                    </span>
                    <span className="font-mono text-[10px] text-[#2dd4bf]">
                      Click any tool to open
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {REFERENCE_TOOL_STACK.map((item) => (
                      <a
                        key={item.tool}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-[#0b1324] hover:bg-[#13203b] border border-[#d4af37]/25 hover:border-[#d4af37] flex items-center justify-between gap-2.5 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.remoteLogo}
                            alt={`${item.tool} logo`}
                            className="w-8 h-8 object-contain bg-[#060911] p-1 border border-white/10 shrink-0"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="font-hud text-xs font-bold text-[#f8f5ee] truncate">
                              {item.tool}
                            </div>
                            <div className="font-mono text-[10px] text-[#94a3b8] truncate">
                              {item.category}
                            </div>
                          </div>
                        </div>
                        <span className="font-mono text-xs text-[#d4af37] shrink-0">↗</span>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {CREATOR_PROFILE.skills.map((group) => (
                    <div
                      key={group.group}
                      className="p-4 bg-[#0b111e] border border-[#d4af37]/20 space-y-2"
                    >
                      <div className="font-hud text-xs font-bold uppercase tracking-wider text-[#2dd4bf]">
                        {group.group}
                      </div>
                      <div className="font-sans text-xs text-[#cbd5e1] leading-relaxed">
                        {group.items.join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-hud text-xs uppercase tracking-wider">
                  <a
                    href={CREATOR_PROFILE.calUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 clip-blade-right bg-[#d4af37] hover:bg-[#fde68a] text-[#05070b] font-bold text-center cursor-pointer"
                  >
                    Book Discovery Call
                  </a>
                  <a
                    href={CREATOR_PROFILE.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 border border-[#d4af37]/50 bg-[#0b111e] hover:bg-[#142038] text-[#f8f5ee] font-bold text-center cursor-pointer"
                  >
                    Official Resume (PDF)
                  </a>
                  <button
                    type="button"
                    onClick={handleDownloadDossier}
                    className="p-3 border border-[#2dd4bf]/50 bg-[#091921] hover:bg-[#102d3b] text-[#2dd4bf] font-bold text-center cursor-pointer"
                  >
                    Export JSON Dossier
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 p-3.5 bg-[#09101d] border border-[#d4af37]/20 font-mono text-xs text-[#cbd5e1]">
                  <a
                    href={CREATOR_PROFILE.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#d4af37] hover:underline"
                  >
                    LinkedIn ↗
                  </a>
                  <span>/</span>
                  <a
                    href={CREATOR_PROFILE.behanceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#d4af37] hover:underline"
                  >
                    Behance ↗
                  </a>
                  <span>/</span>
                  <a
                    href={CREATOR_PROFILE.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#d4af37] hover:underline"
                  >
                    Instagram ↗
                  </a>
                  <span>/</span>
                  <a
                    href={`mailto:${CREATOR_PROFILE.email}`}
                    className="text-[#2dd4bf] hover:underline"
                  >
                    {CREATOR_PROFILE.email}
                  </a>
                </div>

                <form
                  onSubmit={handleCommissionSubmit}
                  className="p-4 bg-[#0b111e] border border-[#d4af37]/25 space-y-3"
                >
                  <div className="font-hud text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                    Direct Dispatch to Ayush ({CREATOR_PROFILE.email})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your Name *"
                      className="px-3 py-2 bg-[#060911] border border-[#d4af37]/35 text-xs text-[#f8f5ee]"
                    />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Company / Team"
                      className="px-3 py-2 bg-[#060911] border border-[#d4af37]/35 text-xs text-[#f8f5ee]"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Message or role opportunity... *"
                    className="w-full px-3 py-2 bg-[#060911] border border-[#d4af37]/35 text-xs text-[#f8f5ee]"
                  />
                  {formError && <div className="text-xs text-[#f43f5e] font-semibold">{formError}</div>}
                  {submitSuccess && (
                    <div className="text-xs text-[#2dd4bf] font-semibold">Dispatch sealed and sent!</div>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 clip-blade-right bg-[#d4af37] hover:bg-[#fde68a] text-[#05070b] font-hud font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Seal &amp; Dispatch
                  </button>
                </form>

                {dispatchedScrolls.length > 0 && (
                  <div className="space-y-1.5">
                    {dispatchedScrolls.slice(0, 2).map((item, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-[#0a101d] border border-[#d4af37]/20 text-xs"
                      >
                        <strong className="text-[#d4af37]">
                          {item.sender} ({item.organization}):
                        </strong>{' '}
                        <span className="text-[#cbd5e1]">{item.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
