import React, { useState } from 'react';
import {
  CREATOR_PROFILE,
  CAREER_EXPERIENCE,
  PORTFOLIO_STOPS,
  STORY_CHAPTERS,
  PortfolioStop,
} from '../data/portfolioStops';

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

  const currentIdx = PORTFOLIO_STOPS.findIndex((s) => s.id === stop.id);
  const prevStop = PORTFOLIO_STOPS[(currentIdx - 1 + PORTFOLIO_STOPS.length) % PORTFOLIO_STOPS.length];
  const nextStop = PORTFOLIO_STOPS[(currentIdx + 1) % PORTFOLIO_STOPS.length];

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
      featuredProjects: PORTFOLIO_STOPS.map((s) => s.project),
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

  const proj = stop.project;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stop-modal-title"
      className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6 bg-[#03050a]/88 pointer-events-auto backdrop-blur-md"
    >
      {/* Widescreen AAA Mythic Codex Split-View */}
      <div className="relative w-full max-w-[1040px] h-[84vh] bg-[#070b13] border border-[#d4af37]/45 shadow-[0_30px_90px_rgba(0,0,0,0.96)] flex flex-col lg:flex-row overflow-hidden text-[#f4efe6]">
        {/* LEFT COLUMN: SANCTUM ARCHIVE SELECTOR & FORGED ASTRA WEAPON PANEL */}
        <aside className="w-full lg:w-[290px] bg-[#05080f] border-b lg:border-b-0 lg:border-r border-[#d4af37]/25 p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-hud text-xs font-bold tracking-[0.24em] uppercase text-[#d4af37]">
                SANCTUM ARCHIVE {stop.indexNumber}/06
              </span>
              <span className="font-mono text-[10px] text-[#2dd4bf]">
                {visitedStopIds.size}/6 AWAKENED
              </span>
            </div>

            {/* Sacred Geometric Astra Mandala SVG */}
            <div className="relative py-4 flex flex-col items-center justify-center border border-[#d4af37]/20 bg-[#080d18]">
              <svg width="84" height="84" viewBox="0 0 100 100" className="mb-2">
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
              <div className="font-hud text-xs font-bold tracking-[0.18em] uppercase text-[#2dd4bf]">
                +{stop.unlockedPower.bonusDamage} ATK FORGED
              </div>
              <div className="font-mythic italic text-sm text-[#f4efe6] text-center px-3 mt-0.5">
                {stop.unlockedPower.name}
              </div>
            </div>

            {/* 01–06 Sanctum Fast-Switch List */}
            <div className="hidden lg:block space-y-1">
              <div className="font-hud text-[10px] font-bold tracking-[0.2em] uppercase text-[#94a3b8] pb-1">
                ALL 6 SHIPPED PRODUCTS
              </div>
              {PORTFOLIO_STOPS.map((s) => {
                const isSelected = s.id === stop.id;
                const isVisited = visitedStopIds.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelectStop(s.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 clip-blade-right text-left transition-all cursor-pointer border-l-2 ${
                      isSelected
                        ? 'bg-[#d4af37] text-[#05070b] border-[#fef9c3] font-bold'
                        : 'bg-[#0a101d] hover:bg-[#111b30] text-[#cbd5e1] border-[#d4af37]/30'
                    }`}
                  >
                    <span className="font-hud text-xs uppercase tracking-wider truncate">
                      {s.indexNumber}. {s.project.title.split('—')[0].trim()}
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
          <div className="hidden lg:flex items-center justify-between gap-2 pt-3 border-t border-[#d4af37]/20 font-hud text-xs uppercase tracking-wider">
            <button
              type="button"
              onClick={() => onSelectStop(prevStop.id)}
              className="px-2.5 py-1.5 bg-[#0c1424] hover:bg-[#16233d] border border-[#d4af37]/30 text-[#e2e8f0] cursor-pointer"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => onSelectStop(nextStop.id)}
              className="px-2.5 py-1.5 bg-[#0c1424] hover:bg-[#16233d] border border-[#d4af37]/30 text-[#e2e8f0] cursor-pointer"
            >
              Next →
            </button>
          </div>
        </aside>

        {/* RIGHT COLUMN: EDITORIAL CASE STUDY & PORTFOLIO CODEX */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header */}
          <header className="px-6 pt-5 pb-4 border-b border-[#d4af37]/20 bg-[#080d18] flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 font-hud text-xs font-bold tracking-[0.2em] uppercase text-[#d4af37]">
                <span>{proj.company}</span>
                <span className="text-[#64748b]">/</span>
                <span>{proj.year}</span>
                <span className="text-[#64748b]">/</span>
                <span className="text-[#2dd4bf]">{proj.subtitle ?? proj.domain}</span>
              </div>
              <h2
                id="stop-modal-title"
                className="font-display text-xl sm:text-2xl font-extrabold text-[#f8f5ee] tracking-tight leading-snug"
              >
                {proj.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Ancient Scroll"
              className="px-3.5 py-1.5 clip-blade-right bg-[#131d31] hover:bg-[#d4af37] hover:text-[#05070b] border-l-2 border-[#d4af37] font-hud text-xs font-bold tracking-[0.18em] uppercase text-[#f8f5ee] transition-colors cursor-pointer shrink-0"
            >
              Close [Esc]
            </button>
          </header>

          {/* Primary Codex Navigation Tabs + Sub-Section Switcher */}
          <div className="px-6 py-2.5 bg-[#060a12] border-b border-[#d4af37]/20 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { id: 'project', label: '01. Case Study' },
                  { id: 'story', label: '02. 5-Act Saga' },
                  { id: 'experience', label: '03. 4 Career Roles' },
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
                    { id: 'overview', label: 'Overview' },
                    { id: 'workflow', label: 'Architecture' },
                    { id: 'research', label: 'Research & UX' },
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
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {activeTab === 'project' && caseSection === 'overview' && (
              <>
                {/* 3 High-Impact Quantitative Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {stop.keyMetrics.map((m) => (
                    <div
                      key={m.label}
                      className="p-4 bg-[#0b111e] border border-[#d4af37]/25 space-y-1"
                    >
                      <div className="font-hud text-2xl font-bold text-[#d4af37] tabular-nums">
                        {m.value}
                      </div>
                      <div className="font-sans text-xs font-semibold text-[#f8f5ee]">{m.label}</div>
                      <div className="font-sans text-[11px] text-[#94a3b8] leading-snug">
                        {m.context}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Narrative Executive Overview */}
                <div className="p-5 bg-[#0a101d] border border-[#d4af37]/20 space-y-2.5">
                  <h3 className="font-mythic italic text-xl text-[#d4af37]">{stop.headline}</h3>
                  {stop.narrativeProse.map((p, idx) => (
                    <p key={idx} className="font-sans text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>

                {/* Problem & Architecture Split */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 bg-[#0b111e] border border-[#d4af37]/20 space-y-1.5">
                    <div className="font-hud text-xs font-bold uppercase tracking-[0.18em] text-[#f43f5e]">
                      The Challenge
                    </div>
                    <p className="font-sans text-xs text-[#cbd5e1] leading-relaxed">
                      {proj.problemStatement}
                    </p>
                  </div>
                  <div className="p-4 bg-[#0b111e] border border-[#d4af37]/20 space-y-1.5">
                    <div className="font-hud text-xs font-bold uppercase tracking-[0.18em] text-[#2dd4bf]">
                      Architecture &amp; Solution
                    </div>
                    <p className="font-sans text-xs text-[#cbd5e1] leading-relaxed">
                      {proj.approachSummary}
                    </p>
                  </div>
                </div>

                {/* Outcome & Stack */}
                <div className="p-4 bg-[#0c1424] border border-[#d4af37]/30 flex flex-wrap items-center justify-between gap-3">
                  <div className="font-sans text-xs text-[#f8f5ee]">
                    <strong className="font-hud text-[#d4af37] uppercase tracking-wider mr-2">
                      Measured Impact:
                    </strong>
                    {proj.resultsImpact}
                  </div>
                  <div className="flex flex-wrap gap-2 font-mono text-[10px] text-[#2dd4bf]">
                    {proj.techStack.map((t, i) => (
                      <span key={t}>
                        {t}
                        {i < proj.techStack.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'project' && caseSection === 'workflow' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {proj.workflowArchitecture.map((stage) => (
                    <div
                      key={stage.step}
                      className="p-4 bg-[#0b111e] border border-[#d4af37]/25 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#d4af37]">
                          {stage.step}.
                        </span>
                        <span className="font-hud text-sm font-bold uppercase tracking-wider text-[#f8f5ee]">
                          {stage.title}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-[#cbd5e1] leading-relaxed">
                        {stage.detail}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-[#0a101d] border border-[#d4af37]/20 space-y-2.5">
                  <div className="font-hud text-xs font-bold uppercase tracking-[0.18em] text-[#2dd4bf]">
                    Shipped Product Capabilities
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans text-xs text-[#cbd5e1]">
                    {proj.keyFeatures.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rotate-45 bg-[#d4af37] shrink-0" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {activeTab === 'project' && caseSection === 'research' && (
              <>
                <div className="p-4 bg-[#0b111e] border border-[#d4af37]/25 space-y-2.5">
                  <div className="font-hud text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">
                    User Research &amp; Discovery Insights
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {proj.researchInsights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#070b14] border border-[#d4af37]/15 font-sans text-xs text-[#cbd5e1] leading-snug"
                      >
                        <strong className="font-mono text-[#2dd4bf] mr-1.5">R{idx + 1}.</strong>
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#0a101d] border border-[#d4af37]/20 space-y-2.5">
                  <div className="font-hud text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">
                    Key UX &amp; Architecture Decisions
                  </div>
                  <ul className="space-y-2 font-sans text-xs text-[#cbd5e1]">
                    {proj.designDecisions.map((dec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rotate-45 bg-[#2dd4bf] shrink-0" />
                        <span className="leading-snug">
                          <strong className="text-[#f8f5ee]">{dec.title}:</strong> {dec.rationale}
                        </span>
                      </li>
                    ))}
                  </ul>
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
              <div className="space-y-3">
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
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-3.5">
                <div className="p-4 bg-[#0b111e] border border-[#d4af37]/25 space-y-1.5">
                  <div className="font-hud text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">
                    {CREATOR_PROFILE.name} · {CREATOR_PROFILE.title}
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                    {CREATOR_PROFILE.manifesto}
                  </p>
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
