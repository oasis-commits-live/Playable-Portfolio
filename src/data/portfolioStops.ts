export type MonumentType =
  | 'sun_mandapa'
  | 'jantar_yantra'
  | 'stepwell'
  | 'ashoka_stambha'
  | 'gopuram_sanctum'
  | 'oasis_pavilion';

export interface UnlockedAstraPower {
  id: string;
  name: string;
  sanskritName: string;
  bonusDamage: number;
  rangeBonus: number;
  colorHex: string;
  description: string;
}

export interface WorkflowStage {
  step: string;
  title: string;
  detail: string;
}

export interface ProjectArtifact {
  id: string;
  title: string;
  subtitle?: string;
  company: string;
  role: string;
  domain: string;
  year: string;
  impactMetric: string;
  problemStatement: string;
  researchInsights: string[];
  approachSummary: string;
  workflowArchitecture: WorkflowStage[];
  keyFeatures: string[];
  designDecisions: { title: string; rationale: string }[];
  resultsImpact: string;
  techStack: string[];
}

export interface TimelineEdict {
  era: string;
  role: string;
  institution: string;
  location: string;
  chapterTitle: string;
  highlights: string[];
  metric: string;
}

export interface StoryChapter {
  act: string;
  title: string;
  era: string;
  summary: string;
  unlockCondition: string;
}

export interface PortfolioStop {
  id: string;
  indexNumber: string;
  title: string;
  sanskritTitle: string;
  category: string;
  monumentType: MonumentType;
  position: { x: number; z: number };
  interactionRadius: number;
  cameraFocusOffset: { x: number; y: number; z: number };
  lookAtOffset: { x: number; y: number; z: number };
  accentColor: string;
  shortHook: string;
  architecturalLore: string;
  headline: string;
  narrativeProse: string[];
  keyMetrics: { label: string; value: string; context: string }[];
  unlockedPower: UnlockedAstraPower;
  project: ProjectArtifact;
}

export interface LotusRelic {
  id: string;
  name: string;
  era: string;
  role: string;
  company: string;
  meaning: string;
  details: string[];
  position: { x: number; z: number };
}

export const CREATOR_PROFILE = {
  name: 'Ayush Dubey',
  title: 'Lead Product Designer · 0→1 AI & SaaS Builder · Hybrid Athlete',
  lineageTag: 'FinTech AI Co-Pilots · B2B SaaS · Gaming & EdTech · 3D & Motion',
  location: 'India (IST / UTC+5:30)',
  email: 'ayush.dubeypd@gmail.com',
  calUrl: 'https://cal.com/ayush-dubey-rhfsyb/30min?overlayCalendar=true',
  resumeUrl: 'https://drive.google.com/file/d/1pFktwF_hnzaS-aj2Calwz7wzFasCyjEG/view?usp=sharing',
  linkedinUrl: 'https://www.linkedin.com/in/ayush-dubey-8827481a9/',
  behanceUrl: 'https://www.behance.net/ayushdubey07',
  instagramUrl: 'https://www.instagram.com/ayushdubey.id/',
  manifesto:
    "I craft standout 0→1 products and design systems for early-stage organizations across FinTech AI, SaaS, EdTech, and Gaming — transforming dense operational workflows into intuitive human experiences. I view myself as a complete builder rather than a single label: the true measure of design is the business and human impact it leaves behind. In September, after shipping an organization-wide brand design system and internal Ops platform as Lead Product Designer at Cheggout, I experienced a sudden restructuring layoff. This world is my answer: a playable testament that a layoff can end a role, but never the craft, velocity, or fire of the creator.",
  layoffStory:
    "In September 2026, right after architecting Cheggout's organization-wide brand design system, internal multi-channel Ops reward engine, and partner banking Mystery Box UX as Lead Product Designer, a sudden restructuring layoff hit. Rather than letting a layoff define the narrative, I forged Portfolio Verse — turning 4+ years of shipped 0→1 FinTech AI ($3M ARR at Hyperbots), SaaS, and gaming craft into Astra weapons to vanquish the September Layoff Colossus.",
  skills: [
    {
      group: 'Core Product & Design Craft',
      items: [
        '0→1 Product & UX Architecture',
        'Enterprise Design Systems',
        'Agentic AI Co-Pilot Workflows',
        'Interactive Prototyping & Code',
        'Character Illustration & Brand Mascots',
        'High-Density Financial Data Viz',
      ],
    },
    {
      group: 'Engineering & Creative Tool Stack',
      items: [
        'Figma & Figma Make',
        'Cursor & Antigravity (AI Building)',
        'Blender (3D Modelling & Animatics)',
        'Jitter (Motion Design)',
        'Supabase (Auth, DB & Edge Functions)',
        'Adobe Creative Suite',
      ],
    },
  ],
};

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    act: 'ACT I',
    title: 'Origins in Play: BINCA Games & Skillmatics',
    era: 'Jan 2022 — Jul 2023',
    summary:
      'Began as a Game Thinker at BINCA Games shipping physical phonics & board games to Hamleys shelves, followed by Skillmatics crafting educational games for ages 6–10 and 3D toy prototypes.',
    unlockCondition: 'Begin your quest in Portfolio Verse',
  },
  {
    act: 'ACT II',
    title: 'The 0→1 FinTech AI Engine at Hyperbots ($3M ARR)',
    era: 'Nov 2023 — Jan 2026',
    summary:
      'Engineered the 0→1 UX for US mid-market Accounts Payable AI Co-Pilots: 80% STP Invoice Co-Pilot (11 days → <1 min), Payments Co-Pilot (+10% cash outflow), HyperLM Vera CFO Workspace, and the Hypo Mascot (10k → 28k LinkedIn followers).',
    unlockCondition: 'Inspect 2 Project Scrolls in the Valley',
  },
  {
    act: 'ACT III',
    title: 'Velocity & Full-Stack AI: Bridge & Oasis Arcade',
    era: '2025',
    summary:
      'Built "Bridge" in a 24-hour sprint to eliminate Slack POD handoff drops, and shipped "Oasis" — a playable retro arcade powered by Figma Make and Supabase Edge Functions (100+ week-1 players).',
    unlockCondition: 'Inspect 4 Project Scrolls in the Valley',
  },
  {
    act: 'ACT IV',
    title: 'Lead Product Designer at Cheggout & The September Layoff',
    era: 'May 2026 — Sept 2026',
    summary:
      'Led org-wide brand design systems, internal multi-channel Ops reward platforms, and banking Mystery Box UX at Cheggout — before a sudden September restructuring layoff struck.',
    unlockCondition: 'Inspect all 6 Scrolls or Awaken the September Layoff Boss',
  },
  {
    act: 'ACT V',
    title: 'Craft Prevails: Vanquishing The September Layoff',
    era: 'Present · Ready for the Next Chapter',
    summary:
      'Armed with 6 shipped product powers and 4 years of cross-disciplinary mastery, confront and defeat the September Layoff Colossus in the Northern Citadel.',
    unlockCondition: 'Defeat Maha-Asura: The September Layoff',
  },
];

export const CAREER_EXPERIENCE: TimelineEdict[] = [
  {
    era: 'May 2026 — Sept 2026',
    role: 'Lead Product Designer',
    institution: 'Cheggout Services Pvt Ltd.',
    location: 'India',
    chapterTitle: 'Chapter IV · Enterprise Brand Systems & The September Layoff',
    highlights: [
      'Architected a unified organization-wide brand design system adopted across core Product and marketing communications.',
      'Designed an internal Ops campaign platform enabling operations teams to configure and launch multi-channel brand offers, banners, instant rewards, and flash deals.',
      'Redesigned the in-app Scratch Card flow and Mystery Box offer redemption journey for partner banking apps, reducing cognitive load and lifting conversion CTR.',
      'Crafted a fresh social identity on LinkedIn and standardized executive pitch deck guidelines — right before the sudden September restructuring layoff.',
    ],
    metric: 'Org-Wide Design System · Ops Offer Engine · Banking Mystery Box UX',
  },
  {
    era: 'Nov 2023 — Jan 2026',
    role: 'Associate Product Designer',
    institution: 'Hyperbots Inc.',
    location: 'US Mid-Market / India',
    chapterTitle: 'Chapter III · 0→1 Agentic AI FinTech Suite ($3M ARR)',
    highlights: [
      'Spearheaded 0→1 MVP product design for an Agentic AI Accounts Payable & Procure-to-Pay platform targeting US mid-market enterprises, scaling to $3M ARR.',
      'Designed the flagship Invoice Processing Co-Pilot (80% Straight-Through Processing), Payments Co-Pilot (+10% cash outflow optimization), and HyperLM Vera CFO AI Workspace.',
      'Illustrated and humanized the company AI mascot "Hypo", propelling LinkedIn community growth from 10,000 to 28,000 followers (+180%).',
      'Founded the PeopleX internal culture program and led cross-team design critiques and company events.',
    ],
    metric: '0→1 MVP to $3M ARR · 80% STP Automation · 10k→28k Audience Surge',
  },
  {
    era: 'Jan 2023 — Jul 2023',
    role: 'Junior Designer',
    institution: 'Skillmatics (Grasper Global)',
    location: 'India',
    chapterTitle: 'Chapter II · Global Educational Play & 3D Toy Prototyping',
    highlights: [
      'Designed tactile educational play experiences and learning mechanics for children aged 6–10 across global retail markets.',
      'Created original character and board illustrations for card and tabletop games to elevate shelf appeal.',
      'Utilized Blender 3D modeling and rendering to prototype and test new physical toy form factors.',
    ],
    metric: 'Global Educational Games (Ages 6–10) & 3D Physical Toy Prototypes',
  },
  {
    era: 'Jan 2022 — Jul 2022',
    role: 'Intern Designer / Game Thinker',
    institution: 'BINCA Games',
    location: 'India',
    chapterTitle: 'Chapter I · Physical Phonics Play & Hamleys Retail Launch',
    highlights: [
      'Completed graduation thesis designing an active phonics game for children aged 2–6 that united physical movement with early language acquisition.',
      'Co-developed educational board games that shipped to retail shelves at Hamleys.',
    ],
    metric: 'Shipped Commercial Board Games to Hamleys Retail Shelves',
  },
];

export const PORTFOLIO_STOPS: PortfolioStop[] = [
  {
    id: 'mandapa-origin',
    indexNumber: '01',
    title: 'CFO AI Workspace (HyperLM Vera)',
    sanskritTitle: 'Surya Mandapa · Hyperbots Inc. (2025)',
    category: 'Agentic AI Workspace · FinTech',
    monumentType: 'sun_mandapa',
    position: { x: 0, z: -26 },
    interactionRadius: 8.5,
    cameraFocusOffset: { x: 0, y: 6.5, z: -13 },
    lookAtOffset: { x: 0, y: 3.4, z: -26 },
    accentColor: '#f59e0b',
    shortHook: 'Designing HyperLM Vera — an AI-powered digital twin workspace for the CFO & finance office.',
    architecturalLore:
      'Sanctum of the All-Seeing Surya Chakra. Inspecting this scroll bestows Surya Drishti — the Solar Insight Astra.',
    headline: 'HyperLM Vera — Designing an AI Digital-Twin Workspace for the Modern CFO’s Office',
    narrativeProse: [
      'Vera is an AI-powered executive workspace engineered to transform how CFOs and finance controllers make daily strategic decisions. Acting as a human-in-the-loop "digital twin", Vera consolidates fragmented email threads, calendar rituals, live external market signals, and deep ledger Q&A into one conversational command center.',
      'Across a $12B+ mid-market finance automation landscape (50,000+ enterprises growing at 23% CAGR), CFOs suffer from severe context switching across 15+ disconnected tools. By benchmarking Notion, Perplexity, Genspark, and Grok alongside partner CFO consultants, I architected a high-trust financial workspace with zero hallucination ambiguity.',
    ],
    keyMetrics: [
      { label: 'Target Market', value: '$12B+', context: '23% CAGR across 50,000+ mid-market finance teams' },
      { label: 'Tool Consolidation', value: '15+ → 1', context: 'Unifies emails, ERP docs, forecasting & market news' },
      { label: 'AI Paradigm', value: 'Digital Twin', context: 'Human-in-the-loop conversational finance companion' },
    ],
    unlockedPower: {
      id: 'power-vera',
      name: 'Surya Drishti (Solar CFO Insight)',
      sanskritName: 'सूर्य दृष्टि · Solar Insight Blade',
      bonusDamage: 18,
      rangeBonus: 1.2,
      colorHex: '#f59e0b',
      description: 'Infuses your Nandaka Katana with golden solar clarity, dealing +18 damage & +25 posture break.',
    },
    project: {
      id: 'cfos-ai-workspace',
      title: 'HyperLM Vera — AI Workspace for the CFO',
      company: 'Hyperbots Inc.',
      role: 'Lead 0→1 Product Designer (with CFO Advisory Partners)',
      domain: 'B2B FinTech & Agentic AI Workspace',
      year: '2025',
      impactMetric: 'Consolidated 15+ Disconnected Finance Tools into 1 Executive AI Command Center',
      problemStatement:
        'CFOs have critical financial data scattered across 15+ tools (ERPs, spreadsheets, BI dashboards, Slack, email), rely on manual follow-ups across controllers for status updates, keep an email tab open all day to avoid missing board/vendor replies, and cannot easily correlate external macroeconomic news with internal cash-flow scenarios.',
      researchInsights: [
        'Shadowed partner CFOs and discovered 62% of their morning ritual is spent triaging emails and chasing controller sign-offs rather than strategic scenario modeling.',
        'Benchmarked Perplexity, Notion AI, Grok, and ChatGPT: generic chat UIs fail in finance because numbers require side-by-side source citations, tabular drill-downs, and one-click ERP actions.',
        'Executives distrust "black-box" AI summaries unless every forecasted metric links directly to the underlying GL voucher, invoice, or market filing.',
      ],
      approachSummary:
        'Co-designed an executive-grade split-pane workspace around four daily CFO pillars: Morning Pulse (Email + Calendar Triage), Conversational Ledger Q&A (powered by HyperLM), Scenario Forecasting Canvas, and Live External Market Radar.',
      workflowArchitecture: [
        {
          step: '01',
          title: 'Morning Pulse & Triage',
          detail: 'Vera ingests overnight controller emails, flags urgent vendor/audit blockers, and drafts context-aware replies linked to live ERP balances.',
        },
        {
          step: '02',
          title: 'Cited Financial Q&A',
          detail: 'Ask natural-language questions ("Why did Q3 opex spike in logistics?") and receive instant tabular breakdowns with clickable GL citations.',
        },
        {
          step: '03',
          title: 'Macro-to-Micro Radar',
          detail: 'Correlates live external interest-rate, tariff, and supply-chain news directly against internal cash-flow runway projections.',
        },
        {
          step: '04',
          title: 'One-Click Delegation',
          detail: 'Convert any AI insight into an assigned controller task with SLA tracking without leaving the workspace.',
        },
      ],
      keyFeatures: [
        'Conversational financial forecasting & real-time board-ready report generation',
        'Integrated Email & Calendar co-pilot so critical audit or vendor replies are never missed',
        'Internal + External Context Intelligence connecting live market signals to company ledgers',
        'High-contrast tabular financial typography with inline source-document verification',
      ],
      designDecisions: [
        {
          title: 'Split-Canvas Citation Drawer instead of Pure Chat',
          rationale: 'Kept conversational prompts on the left while pinning live spreadsheets, PDF invoices, and variance charts on the right so CFOs never lose numerical context.',
        },
        {
          title: 'Proactive Morning Brief Cards',
          rationale: 'Eliminated blank-canvas prompt paralysis by greeting the CFO each morning with 4 prioritized action cards synthesized from overnight ERP & email activity.',
        },
      ],
      resultsImpact:
        'Established the flagship executive interface for Hyperbots’ HyperLM model suite, transforming CFO workflows from fragmented manual reporting into unified, cited AI decision-making.',
      techStack: ['Figma', 'Agentic AI UX', 'Design Systems', 'Financial Data Viz', 'HyperLM Architecture'],
    },
  },
  {
    id: 'jantar-observatory',
    indexNumber: '02',
    title: 'Bridge — Super Handoff Tool',
    sanskritTitle: 'Yantra Setu · SourceCode Tech (2025)',
    category: 'B2B Developer & Design Productivity',
    monumentType: 'jantar_yantra',
    position: { x: 38, z: -16 },
    interactionRadius: 8.5,
    cameraFocusOffset: { x: 25, y: 7.0, z: -7 },
    lookAtOffset: { x: 38, y: 3.5, z: -16 },
    accentColor: '#f97316',
    shortHook: 'Built in a 24-hour sprint to supercharge POD handoffs and deployment velocity.',
    architecturalLore:
      'The Celestial Observatory of Synchronization. Reading this scroll awakens Vayu Setu — the Wind-Bridge Haste Power.',
    headline: 'Bridge — A 24-Hour Sprint Super-Handoff Engine for High-Velocity Product PODs',
    narrativeProse: [
      'In fast-moving engineering organizations structured around cross-functional PODs, handing off Figma specs, PRDs, and QA builds over Slack threads leads to dropped context whenever team bandwidth is stretched thin.',
      'Conceived, architected, and prototyped during an intensive 24-hour design sprint at SourceCode Tech, Bridge gives engineering managers and squad leads a visual command center to assemble PODs, define time-boxed handoff chains, fire automated Slack webhooks to the next builder in line, and rebalance workloads seamlessly when teammates take leave.',
    ],
    keyMetrics: [
      { label: 'Sprint Execution', value: '24 Hours', context: 'From problem discovery to complete interactive system' },
      { label: 'Workflow Model', value: 'POD Chains', context: 'Automated Slack handoffs & real-time SLA tracking' },
      { label: 'Cultural Impact', value: 'Townhall Saved', context: 'Reclaimed Friday sync hours for team wellness & ideation' },
    ],
    unlockedPower: {
      id: 'power-bridge',
      name: 'Vayu Setu (POD Velocity Surge)',
      sanskritName: 'वायु सेतु · Swift Handoff Strike',
      bonusDamage: 18,
      rangeBonus: 1.5,
      colorHex: '#f97316',
      description: 'Accelerates your katana combos and unleashes fiery orange shockwaves (+18 ATK, +1.5m Reach).',
    },
    project: {
      id: 'nexatech-bridge',
      title: 'Bridge — Super Handoff Tool for Product PODs',
      company: 'SourceCode Tech',
      role: 'Product Designer (24-Hour Intensive Sprint)',
      domain: 'B2B Developer & Design Productivity',
      year: '2025',
      impactMetric: 'Eliminated Slack Handoff Drops & Reclaimed Weekly Townhall Status Hours',
      problemStatement:
        'When squads operate in multi-disciplinary PODs (designers, frontend, backend, QA handling n handoffs daily), critical Figma links and API specs sent in Slack channels get buried under chatter — delaying deployments and turning Friday townhalls into exhausting status interrogations.',
      researchInsights: [
        'Mapped internal POD communication and found 70% of deployment delays occurred at the boundary between two roles (e.g., Design → Frontend or Backend → QA) rather than during coding itself.',
        'Engineers hated context-switching into heavy project management tools just to mark a ticket ready, preferring instant Slack-native triggers paired with a visual pipeline.',
        'When a single POD member went on unplanned leave, downstream handoffs stalled silently because ownership reassignment required manual manager intervention.',
      ],
      approachSummary:
        'Designed a desktop-first visual POD studio in 24 hours where managers drag-and-drop squad chains, attach mandatory handoff artifacts (Figma/GitHub/PRD links), track On-Time vs. Overdue SLAs at a glance, and trigger automated Slack handoff pings.',
      workflowArchitecture: [
        {
          step: '01',
          title: 'POD Squad Assembly',
          detail: 'Managers spin up a dedicated POD lane, assign role owners, and set stage-by-stage SLA timers.',
        },
        {
          step: '02',
          title: 'Structured Artifact Gate',
          detail: 'Completing a stage requires attaching verified spec links before Bridge unlocks the next handoff node.',
        },
        {
          step: '03',
          title: 'Automated Slack Relay',
          detail: 'Fires an instant, context-rich Slack payload to the next builder in the chain with all上游 artifacts attached.',
        },
        {
          step: '04',
          title: 'One-Click Leave Reallocation',
          detail: 'If a teammate is away, managers reassign their active handoff node with zero lost history or broken links.',
        },
      ],
      keyFeatures: [
        'Centralized POD Studio for squad creation, capacity visibility, and stage ownership',
        'Time-boxed handoff chains with automatic Slack webhook dispatches to the next builder',
        'Live On-Time vs. Overdue SLA health telemetry across all active company PODs',
        'Instant PTO / Leave workload reallocation to prevent silent deployment bottlenecks',
      ],
      designDecisions: [
        {
          title: 'Visual Node-Chain over Kanban Boards',
          rationale: 'Kanban hides sequential dependencies; a horizontal relay-chain makes it immediately obvious who holds the baton and who is next in line.',
        },
        {
          title: 'Zero-Meeting Friday Telemetry View',
          rationale: 'Created an executive summary header that replaced 90 minutes of Friday townhall status readouts with a 30-second live SLA snapshot.',
        },
      ],
      resultsImpact:
        'Made cross-POD handoffs completely transparent, eliminated dropped Slack specs, and returned Friday townhall hours to employees for wellness and product experimentation.',
      techStack: ['Figma', '24-Hr Rapid Prototyping', 'Slack Webhook UX', 'B2B SaaS', 'Design Systems'],
    },
  },
  {
    id: 'oasis-pavilion',
    indexNumber: '03',
    title: 'Oasis — Retro Gaming Arcade',
    sanskritTitle: 'Ananda Mandapa · AI-Built Arcade (2025)',
    category: 'B2C Gaming · AI Design-to-Code',
    monumentType: 'oasis_pavilion',
    position: { x: 40, z: 24 },
    interactionRadius: 8.5,
    cameraFocusOffset: { x: 27, y: 6.8, z: 15 },
    lookAtOffset: { x: 40, y: 3.5, z: 24 },
    accentColor: '#10b981',
    shortHook: 'A playable nostalgic gaming arcade built end-to-end with Figma, AI code generation, and Supabase.',
    architecturalLore:
      'The Emerald Pavilion of Play. Inspecting this scroll awakens Agni Kridana — the Retro Arcade Nova.',
    headline: 'Oasis — Shipping a Full-Stack Playable Retro Gaming Arcade via AI-Native Workflows',
    narrativeProse: [
      'Sparked during a work break by childhood memories of handheld Mitashi brick consoles and Indian bazaar pixel games (*Block Jump*, *Retro Snake*, and *Zen Stack*), Oasis was conceived as a joyful digital sanctuary for designers and engineers to recharge between sprints.',
      'Beyond nostalgia, Oasis validated a complete AI-native design-to-production engineering pipeline: crafting the tactile retro UI system in Figma, authoring rigorous physics & state-machine PRDs with ChatGPT and Perplexity, compiling interactive frontend code in Figma Make, and wiring a live Supabase backend with PostgreSQL leaderboards, Edge Functions, and retro chiptune storage buckets.',
    ],
    keyMetrics: [
      { label: 'Week-1 Adoption', value: '100+ Players', context: 'Organic active users within the first 7 days of launch' },
      { label: 'Session Lift', value: '+10 Mins', context: 'Average playtime increase after shipping Zen Stack' },
      { label: 'Full-Stack AI', value: 'Figma → Supabase', context: 'Live auth, Edge Functions, leaderboards & audio buckets' },
    ],
    unlockedPower: {
      id: 'power-oasis',
      name: 'Agni Kridana (Arcade Emerald Blast)',
      sanskritName: 'अग्नि क्रीडन · Pixel Pulse Wave',
      bonusDamage: 18,
      rangeBonus: 1.5,
      colorHex: '#10b981',
      description: 'Channels retro arcade energy into emerald plasma waves (+18 ATK & wider cleave radius).',
    },
    project: {
      id: 'oasis-arcade',
      title: 'Oasis — Playable Retro Gaming Arcade',
      company: 'Self-Initiated Full-Stack Product',
      role: 'Creator · Product Designer & AI Full-Stack Builder',
      domain: 'B2C Gaming · AI Design-to-Development',
      year: '2025',
      impactMetric: '100+ Active Players in Week 1 · +10 Min Session Lift with Zen Stack Release',
      problemStatement:
        'Traditional design-to-engineering handoffs make shipping experimental consumer games slow and expensive. The challenge was to solo-ship a polished, multi-game arcade with real multiplayer leaderboards and audio streaming using an AI-augmented workflow.',
      researchInsights: [
        'Studied classic 90s handheld LCD and 8-bit consoles (Mitashi, Game Boy, Nokia Snake) to distil tactile button micro-interactions and zero-tutorial onboarding.',
        'Discovered that AI code generators fail on complex game loops unless fed deterministic state-machine PRDs specifying collision bounds, tick rates, and scoring curves.',
        'Post-launch telemetry showed players wanted a calmer, precision-stacking mode alongside fast reflex games — directly inspiring the iterative release of Zen Stack.',
      ],
      approachSummary:
        'Built a custom pixel-crt design system in Figma, authored structured game-loop PRDs via ChatGPT & Perplexity, generated and refined the playable React/Canvas code in Figma Make, and integrated Supabase for persistent player profiles, global high-score tables, and streamed chiptune SFX.',
      workflowArchitecture: [
        {
          step: '01',
          title: 'Retro Design System',
          detail: 'Crafted arcade cabinet frames, tactile D-pad controls, CRT scanline shaders, and pixel typography in Figma.',
        },
        {
          step: '02',
          title: 'PRD Prompt Engineering',
          detail: 'Structured exact collision math, speed-scaling formulas, and state transitions with Perplexity & ChatGPT.',
        },
        {
          step: '03',
          title: 'Supabase Backend Wiring',
          detail: 'Configured PostgreSQL tables, Edge Functions for anti-cheat score submission, and Storage buckets for retro audio.',
        },
        {
          step: '04',
          title: 'Live Telemetry Iteration',
          detail: 'Shipped "Zen Stack" post-launch based on player retention data, boosting session length by +10 minutes.',
        },
      ],
      keyFeatures: [
        'Three fully playable arcade titles: Block Jump, Retro Snake, and Zen Stack',
        'Supabase Edge Functions & PostgreSQL database powering real-time global leaderboards',
        'Dedicated Supabase Storage buckets streaming nostalgic 8-bit chiptune tracks and SFX',
        'Responsive keyboard and mobile touch-arcade controls with instant cabinet switching',
      ],
      designDecisions: [
        {
          title: 'Zero-Friction Guest-to-Leaderboard Flow',
          rationale: 'Allowed players to jump into a game in 1 click and claim their leaderboard handle after setting a high score, maximizing week-1 conversion.',
        },
        {
          title: 'Iterative Game Drop (Zen Stack)',
          rationale: 'Treated the arcade as a live service; adding Zen Stack in week 2 re-engaged early users and lifted average session duration by +10 minutes.',
        },
      ],
      resultsImpact:
        'Attracted 100+ active players in week one, proved that a product designer can solo-architect and ship a full-stack database-backed gaming product with AI, and established a repeatable Figma → Supabase pipeline.',
      techStack: ['Figma Make', 'Supabase', 'PostgreSQL & Edge Functions', 'AI PRD Architecture', 'Game UX'],
    },
  },
  {
    id: 'ashoka-stambha',
    indexNumber: '04',
    title: 'Payments Co-Pilot (+10% Cash Outflow)',
    sanskritTitle: 'Kubera Stambha · Hyperbots Inc. (2024)',
    category: 'B2B FinTech · Agentic Payments',
    monumentType: 'ashoka_stambha',
    position: { x: -38, z: 24 },
    interactionRadius: 8.5,
    cameraFocusOffset: { x: -25, y: 6.8, z: 15 },
    lookAtOffset: { x: -38, y: 4.0, z: 24 },
    accentColor: '#eab308',
    shortHook: '0→1 AI Payments Co-Pilot for mid-sized enterprises boosting cash outflow efficiency by 10%.',
    architecturalLore:
      'Pillar of Sovereign Treasury. Inspecting this scroll awakens Sudarshana Chakra — the Golden Treasury Disc.',
    headline: 'Payments Co-Pilot — Optimizing Enterprise Cash Outflow by +10% on the Path to $3M ARR',
    narrativeProse: [
      'Manual payment runs cost mid-market finance teams tens of thousands of dollars in missed early-payment discounts (2/10 Net 30), late payment penalties, duplicate disbursements, and strained vendor relationships.',
      'Designed in close partnership with CFO advisors at Hyperbots Inc., the Payments Co-Pilot pairs specialized ML payment-timing models with an intuitive, high-density tabular workbench — automating multi-rail disbursements, preventing fraud, reconciling directly with ERPs, and helping propel Hyperbots from 0→1 to $3M ARR.',
    ],
    keyMetrics: [
      { label: 'Cash Outflow Boost', value: '+10%', context: 'Via ML payment timing & early-discount capture' },
      { label: 'Platform Growth', value: '$3M ARR', context: '0→1 foundational design system & enterprise rollout' },
      { label: 'ERP Write-Back', value: '100% Sync', context: 'Automated ledger reconciliation & audit trail generation' },
    ],
    unlockedPower: {
      id: 'power-payments',
      name: 'Sudarshana Chakra (Treasury Gold Disc)',
      sanskritName: 'सुदर्शन चक्र · Golden Equilibrium',
      bonusDamage: 18,
      rangeBonus: 1.5,
      colorHex: '#eab308',
      description: 'Summons a spinning golden Chakra on every strike (+18 ATK & high posture damage).',
    },
    project: {
      id: 'payments-copilot',
      title: 'Hyperbots Payments Co-Pilot',
      company: 'Hyperbots Inc.',
      role: '0→1 Associate Product Designer',
      domain: 'B2B FinTech · Accounts Payable & Treasury Automation',
      year: '2024',
      impactMetric: '+10% Cash Outflow Efficiency · Anchored 0→1 Platform Growth to $3M ARR',
      problemStatement:
        'AP controllers and treasury teams manage hundreds of weekly vendor invoices across spreadsheets and legacy banking portals — missing lucrative early-payment discount windows, incurring late fees, and risking duplicate or fraudulent wire transfers.',
      researchInsights: [
        'Interviewed mid-market controllers who revealed they intentionally paid invoices early or late in bulk simply because calculating optimal discount windows across 400+ vendors manually was impossible.',
        'Finance users rejected consumer-style card grids; they demanded Excel-level information density with sticky headers, keyboard navigation, and instant batch selection.',
        'Audit compliance required every AI payment recommendation to display its exact discount math, vendor risk score, and multi-level approval state.',
      ],
      approachSummary:
        'Built on the foundational Hyperbots Design System, I architected a 3-bucket payment workbench (Recommended Today, Scheduled Runs, Disbursed & Reconciled) topped with executive mini-dashboards that quantify working-capital savings in real time.',
      workflowArchitecture: [
        {
          step: '01',
          title: 'ML Discount & Timing Engine',
          detail: 'AI scans approved invoices and ranks payment dates to capture 100% of available early-payment discounts without straining cash reserves.',
        },
        {
          step: '02',
          title: 'Fraud & Duplicate Shield',
          detail: 'Flags anomalous bank-account changes, duplicate invoice numbers, and vendor compliance gaps before funds leave the account.',
        },
        {
          step: '03',
          title: 'Batch Multi-Rail Execution',
          detail: 'Controllers review and approve segregated payment runs across ACH, Wire, and Virtual Card in a single unified flow.',
        },
        {
          step: '04',
          title: 'Automated ERP Reconciliation',
          detail: 'Writes payment confirmations and remittance advice back to NetSuite, SAP, or QuickBooks with zero manual ledger entry.',
        },
      ],
      keyFeatures: [
        'ML-driven payment timing recommendations that capture early-payment discounts automatically',
        'Segregated high-density tabular views with instant status tags and ERP write-back indicators',
        'Built-in vendor bank-change anomaly detection and immutable audit trails',
        'Executive mini-dashboard translating complex AP cash-flow trade-offs into clear dollar savings',
      ],
      designDecisions: [
        {
          title: 'Excel-Familiar High-Density Tables + Executive Infographics',
          rationale: 'Balanced the needs of daily AP operators (dense filterable rows) and CFOs (top-level cash-outflow & discount capture KPIs) on a single screen.',
        },
        {
          title: 'Explicit "Why Today?" AI Tooltip Breakdown',
          rationale: 'Surfaced the exact dollar discount saved vs. treasury opportunity cost on hover so controllers trusted and approved AI-scheduled runs.',
        },
      ],
      resultsImpact:
        'Delivered a verified +10% improvement in cash outflow utilization for mid-market enterprises and served as a core pillar of Hyperbots’ $3M ARR Procure-to-Pay platform.',
      techStack: ['FinTech UX', '0→1 Design Systems', 'High-Density Data Tables', 'ERP Integration UX', 'Figma'],
    },
  },
  {
    id: 'gopuram-sanctum',
    indexNumber: '05',
    title: 'Hypo — Humanizing AI Mascot Design',
    sanskritTitle: 'Mitra Gopuram · Brand & Character (2024)',
    category: 'Character Design · Brand Identity',
    monumentType: 'gopuram_sanctum',
    position: { x: -38, z: -16 },
    interactionRadius: 8.5,
    cameraFocusOffset: { x: -25, y: 7.0, z: -7 },
    lookAtOffset: { x: -38, y: 4.5, z: -16 },
    accentColor: '#ec4899',
    shortHook: 'Reimagining the "Hypo" AI mascot to convey warmth and human collaboration (10k → 28k followers).',
    architecturalLore:
      'Sanctum of Living Expression. Reading this scroll awakens Prana Kavacha — the Empathy Shield & Prana Renewal.',
    headline: 'Hypo — Humanizing Enterprise FinTech AI & Growing LinkedIn Community from 10k to 28k',
    narrativeProse: [
      'Hyperbots’ core mission is to free finance professionals from soul-crushing manual data entry across 2,000+ enterprises. Yet the original company mascot "Hypo" had rigid, blocky, mechanical geometry that unintentionally felt cold and intimidating — feeding user anxiety that AI was coming to replace human accountants.',
      'Through hand-sketched character exploration synchronized with a company-wide brand mark redesign, I reimagined Hypo into a warm, expressive, geometrically harmonized companion across in-product AI Co-Pilots and social storytelling — propelling Hyperbots’ LinkedIn audience from 10,000 to 28,000 followers (+180%).',
    ],
    keyMetrics: [
      { label: 'Community Surge', value: '10k → 28k', context: '+180% LinkedIn follower growth via mascot storytelling' },
      { label: 'Mission Scale', value: '2,000+ Cos', context: 'Humanized AI adoption for mid-market finance teams' },
      { label: 'Omnichannel', value: 'Product + Social', context: 'Unified across Co-Pilot UI states, video & events' },
    ],
    unlockedPower: {
      id: 'power-mascot',
      name: 'Prana Kavacha (Empathy Resonance)',
      sanskritName: 'प्राण कवच · Warmth & Vitality Aura',
      bonusDamage: 18,
      rangeBonus: 1.5,
      colorHex: '#ec4899',
      description: 'Radiates rose-gold empathy energy (+18 ATK & accelerates continuous Prana regeneration).',
    },
    project: {
      id: 'hypo-mascot',
      title: 'Hypo — Friendly AI Mascot & Brand Identity System',
      company: 'Hyperbots Inc.',
      role: 'Character Illustrator & Brand Product Designer',
      domain: 'Character Design · Product Onboarding & Brand Strategy',
      year: '2024',
      impactMetric: 'Grew LinkedIn Following from 10k to 28k (+180%) & Humanized In-App AI Co-Pilots',
      problemStatement:
        'Enterprise finance buyers often view AI automation with skepticism or fear of job displacement. Hyperbots’ early robotic mascot reinforced a cold, mechanical tone that clashed with our vision of supportive human-in-the-loop collaboration.',
      researchInsights: [
        'Audited B2B SaaS and consumer mascots (Duolingo, Mailchimp, Astro Bot) and found that rounded silhouettes, expressive eye states, and floating posture immediately signal "helpful assistant" rather than "rigid authority".',
        'Ran an internal company-wide vote across 3 new corporate logo directions and realized the mascot’s head and torso geometry should directly echo the winning logo mark for instant brand recall.',
        'Social media analytics showed technical B2B finance carousels had 3x higher engagement when anchored by a relatable character reacting to everyday accounting pain points.',
      ],
      approachSummary:
        'Translated hand-drawn pencil sketches into a modular vector & 3D-ready character rig with a library of micro-emotions (thinking, celebrating 80% STP, flagging an anomaly, waving), deployed across both the core SaaS UI and external marketing.',
      workflowArchitecture: [
        {
          step: '01',
          title: 'Hand-Sketched Silhouette Study',
          detail: 'Explored 20+ character proportions on paper, replacing sharp 90-degree corners with approachable curved visor and torso forms.',
        },
        {
          step: '02',
          title: 'Logo-Harmonized Geometry',
          detail: 'Aligned Hypo’s silhouette and color blocking directly with the newly voted Hyperbots corporate emblem.',
        },
        {
          step: '03',
          title: 'In-Product Co-Pilot States',
          detail: 'Embedded Hypo into empty states, AI reasoning loaders, and onboarding tooltips across Invoice & Payments Co-Pilots.',
        },
        {
          step: '04',
          title: 'High-Velocity Social Engine',
          detail: 'Created reusable comic & carousel templates featuring Hypo that scaled LinkedIn reach from 10k to 28k followers.',
        },
      ],
      keyFeatures: [
        'Modular character pose & expression library (Idle, Thinking, Anomaly Alert, Celebration)',
        'Direct geometric harmony with the Hyperbots corporate logo and color tokens',
        'In-app AI Co-Pilot empty states, conversational avatars, and onboarding guides',
        'Signature visual anchor for LinkedIn carousels, trade-show booths, and video thumbnails',
      ],
      designDecisions: [
        {
          title: 'Expressive LED Visor Eyes instead of Mechanical Lenses',
          rationale: 'Allowed Hypo to convey instant emotional feedback (happy arcs, focused scan lines, curious tilt) even at 24px avatar sizes inside dense finance tables.',
        },
        {
          title: 'Bringing Hypo into This 3D World',
          rationale: 'Look next to the Great Plateau Lookout in this very game — Hypo is rendered in 3D waving at you as your companion!',
        },
      ],
      resultsImpact:
        'Transformed dense B2B accounting automation into a warm, memorable human brand — driving a +180% surge in LinkedIn followers (10k → 28k) and making AI feel like a trusted teammate.',
      techStack: ['Character Illustration', 'Adobe Illustrator', 'Brand Systems', 'Figma', 'Motion & 3D'],
    },
  },
  {
    id: 'chand-stepwell',
    indexNumber: '06',
    title: 'Invoice Co-Pilot (80% Auto-Processing)',
    sanskritTitle: 'Vajra Baori · Hyperbots Inc. (2023)',
    category: 'B2B AI Automation · 0→1 Flagship',
    monumentType: 'stepwell',
    position: { x: 0, z: 32 },
    interactionRadius: 8.5,
    cameraFocusOffset: { x: 0, y: 6.8, z: 19 },
    lookAtOffset: { x: 0, y: 1.5, z: 32 },
    accentColor: '#14b8a6',
    shortHook: 'Achieving 80% Straight-Through Processing (STP) and cutting invoice cycle time from 11 days to <1 min.',
    architecturalLore:
      'The Stepwell of Deep Automation. Unlocking this scroll grants Indra Vajra — the Lightning Automation Strike.',
    headline: 'Invoice Processing Co-Pilot — Achieving 80% Straight-Through Processing in Under 1 Minute',
    narrativeProse: [
      'Manual Accounts Payable invoice processing is a grueling bottleneck of PDF data entry, OCR extraction failures, broken 2-way/3-way PO matching, and misassigned GL codes — taking an industry average of 11 days per invoice.',
      'As the 0→1 designer for Hyperbots’ flagship Invoice Processing Co-Pilot, I architected a transparent, multi-agent AI workbench that segregates Ready-to-Process (AI 2/3-way matched), Pending Review, and Processed GL-Posted invoices — slashing processing time from 11 days to under 60 seconds with 80% autonomous Straight-Through Processing (STP).',
    ],
    keyMetrics: [
      { label: 'Automation Rate', value: '80% STP', context: 'Straight-through processing without human touch' },
      { label: 'Cycle Time Cut', value: '11d → <1m', context: 'From 11-day industry average to under 60 seconds' },
      { label: 'Revenue Impact', value: '$3M ARR', context: '0→1 flagship product & foundational design system' },
    ],
    unlockedPower: {
      id: 'power-invoice',
      name: 'Indra Vajra (80% STP Lightning)',
      sanskritName: 'इन्द्र वज्र · Autonomous Thunderbolt',
      bonusDamage: 24,
      rangeBonus: 2.0,
      colorHex: '#14b8a6',
      description: 'Unleashes turquoise thunderbolts that obliterate bottlenecks (+24 ATK & Maximum Reach).',
    },
    project: {
      id: 'invoice-copilot',
      title: 'Invoice Processing Co-Pilot (80% STP Flagship)',
      company: 'Hyperbots Inc.',
      role: 'Founding 0→1 Product Designer',
      domain: 'B2B Agentic AI · Accounts Payable Automation',
      year: '2023 — 2025',
      impactMetric: '80% Autonomous Straight-Through Processing · 11 Days Reduced to < 1 Minute',
      problemStatement:
        'AP teams drown in thousands of multi-format vendor PDFs, legacy OCR errors, manual PO line-item matching, and slow approval routing — inflating per-invoice processing costs and delaying month-end close.',
      researchInsights: [
        'Worked directly with US mid-market CFOs and AP clerks: legacy OCR tools failed because they dumped raw extracted text onto users without explaining whether line items matched the Purchase Order (PO) and Goods Receipt Note (GRN).',
        'Operators needed instant visual segregation between invoices the AI had 100% verified vs. the 20% edge cases requiring human judgment (e.g., price/quantity variance beyond tolerance).',
        'Side-by-side PDF bounding-box highlighting was essential so reviewers could verify any extracted line item in under 3 seconds.',
      ],
      approachSummary:
        'Designed the foundational 0→1 Hyperbots Design System and structured the Invoice Co-Pilot around three crystal-clear workflow buckets (Ready to Process, Pending Review, Processed to GL) with granular multi-agent verification tags and live STP telemetry.',
      workflowArchitecture: [
        {
          step: '01',
          title: 'Multi-Agent Ingestion & Vision Extraction',
          detail: 'AI ingests vendor emails/PDFs and extracts header + line-item fields with >99% accuracy and bounding-box coordinates.',
        },
        {
          step: '02',
          title: 'Autonomous 2-Way / 3-Way Matching',
          detail: 'Cross-verifies invoice lines against ERP Purchase Orders and Goods Receipt Notes automatically.',
        },
        {
          step: '03',
          title: 'Smart GL Coding & Exception Triage',
          detail: '80% of clean invoices pass straight through to the ERP; the remaining 20% surface in "Pending Review" with exact variance callouts.',
        },
        {
          step: '04',
          title: 'One-Click ERP Posting',
          detail: 'Writes approved vouchers directly into the General Ledger in under 60 seconds end-to-end.',
        },
      ],
      keyFeatures: [
        'Three-tier workflow segregation: Ready to Process, Pending Review, and Processed to GL',
        'Granular AI status badges: Auto-Approved (2/3-Way Match), Variance Flagged, Written to ERP',
        'Interactive split-screen PDF viewer with live field-to-document bounding-box highlights',
        'Executive STP telemetry header tracking real-time automation ratios and cycle-time savings',
      ],
      designDecisions: [
        {
          title: 'Exception-First UX for the 20% Human-in-the-Loop Cases',
          rationale: 'Since 80% of invoices process autonomously, designed the UI to spotlight only the specific mismatched line item on the remaining 20%, cutting human review time to seconds.',
        },
        {
          title: 'Foundational Token & Table Architecture',
          rationale: 'Built a reusable component library from scratch that scaled seamlessly across all subsequent Hyperbots Co-Pilots (Payments, Accruals, Vendor Management, and Vera).',
        },
      ],
      resultsImpact:
        'Achieved 80% Straight-Through Processing without human touch, slashed invoice turnaround from 11 days to under 1 minute, and anchored Hyperbots’ growth from 0→1 to $3M ARR.',
      techStack: ['0→1 Product Design', 'Agentic AI UX', 'Design Systems', 'B2B FinTech', 'Figma'],
    },
  },
];

export const LOTUS_RELICS: LotusRelic[] = [
  {
    id: 'relic-cheggout',
    name: 'Padma of Cheggout Services',
    era: 'May 2026 — Sept 2026',
    role: 'Lead Product Designer',
    company: 'Cheggout Services Pvt Ltd.',
    meaning: 'Org-Wide Brand Design System, Ops Offer Platform & Banking Mystery Box UX (Before Sept Layoff)',
    details: [
      'Created the organization-wide brand design system across Product and marketing.',
      'Designed the internal Ops campaign platform for Banners, Instant Rewards, and Deals.',
      'Redesigned Scratch Card & Mystery Box offer redemption flows for partner banking apps to boost CTR — right before the September restructuring layoff.',
    ],
    position: { x: 0, z: -12 },
  },
  {
    id: 'relic-hyperbots',
    name: 'Padma of Hyperbots Inc.',
    era: 'Nov 2023 — Jan 2026',
    role: 'Associate Product Designer',
    company: 'Hyperbots Inc.',
    meaning: '0→1 FinTech AI Co-Pilots ($3M ARR), Hypo Mascot & PeopleX Culture Program',
    details: [
      'Engineered 0→1 MVP for US mid-market AP & Order-to-Cash AI Co-Pilots ($3M ARR).',
      'Created the Hypo mascot and grew LinkedIn community from 10k to 28k followers.',
      'Founded PeopleX culture program to elevate employee satisfaction and team events.',
    ],
    position: { x: 20, z: -6 },
  },
  {
    id: 'relic-skillmatics',
    name: 'Padma of Skillmatics',
    era: 'Jan 2023 — Jul 2023',
    role: 'Junior Designer',
    company: 'Skillmatics (Grasper Global)',
    meaning: 'Educational Play Experiences (Ages 6–10), Card Game Illustration & 3D Toy Modeling',
    details: [
      'Developed educational play experiences and board/card game illustrations for ages 6–10.',
      'Used 3D modeling and rendering to prototype new physical toy product designs.',
    ],
    position: { x: -20, z: -6 },
  },
  {
    id: 'relic-binca',
    name: 'Padma of BINCA Games',
    era: 'Jan 2022 — Jul 2022',
    role: 'Intern Designer / Game Thinker',
    company: 'BINCA Games',
    meaning: 'Phonics Physical-Play Game (Ages 2–6) & Retail Board Games at Hamleys',
    details: [
      'Designed a graduation phonics game integrating physical movement for children aged 2–6.',
      'Supported educational games now stocked at Hamleys retail stores.',
    ],
    position: { x: -18, z: 14 },
  },
  {
    id: 'relic-hybrid-stack',
    name: 'Padma of the Hybrid Creator',
    era: 'Builder · Creator · Hybrid Athlete',
    role: 'Figma · Blender · Cursor · Antigravity · Supabase · Jitter',
    company: 'Ayush Dubey Craft',
    meaning: 'Multi-Disciplinary Craft Uniting UI/UX, 3D Animatics, Motion, AI Building & Athletics',
    details: [
      'Full-spectrum stack: Figma, Adobe Suite, Blender 3D, Jitter Motion, Cursor, Antigravity, and Supabase.',
      'Driven by impact-first creativity and hybrid athlete discipline.',
    ],
    position: { x: 18, z: 14 },
  },
];

export type WeaponId =
  | 'weapon-nandaka'
  | 'weapon-surya-greatsword'
  | 'weapon-agni-twinblades'
  | 'weapon-brahmastra-halberd';

export interface ForgeWeapon {
  id: WeaponId;
  keySlot: 1 | 2 | 3 | 4;
  name: string;
  sanskritName: string;
  category: string;
  craftInspiration: string;
  baseDamageBonus: number;
  postureBonus: number;
  reachBonus: number;
  speedMultiplier: number;
  colorHex: string;
  lore: string;
  position: { x: number; z: number };
}

export const FORGE_WEAPONS: ForgeWeapon[] = [
  {
    id: 'weapon-nandaka',
    keySlot: 1,
    name: 'Nandaka Sovereign Katana',
    sanskritName: 'नन्दक खड्ग · Precision Design Blade',
    category: 'Balanced Single-Edge Katana',
    craftInspiration: '0→1 Product Architecture & Figma Precision',
    baseDamageBonus: 8,
    postureBonus: 14,
    reachBonus: 0.4,
    speedMultiplier: 1.15,
    colorHex: '#38bdf8',
    lore: 'Forged at the Meru Lookout Anvil. Balanced for razor-sharp 3-stage combos and frame-perfect Sekiro deflects.',
    position: { x: 6.5, z: 3.5 },
  },
  {
    id: 'weapon-surya-greatsword',
    keySlot: 2,
    name: 'Surya-Vajra Odachi Greatsword',
    sanskritName: 'सूर्य वज्र · Enterprise System Cleaver',
    category: 'Heavy Solar Great-Blade',
    craftInspiration: '$3M ARR FinTech AI & Enterprise Design Systems',
    baseDamageBonus: 26,
    postureBonus: 34,
    reachBonus: 1.35,
    speedMultiplier: 0.92,
    colorHex: '#f59e0b',
    lore: 'Enshrined at the Eastern Solar Forge. Massive golden broad-blade that shatters enemy posture in two cleaves.',
    position: { x: 15.5, z: -12.5 },
  },
  {
    id: 'weapon-agni-twinblades',
    keySlot: 3,
    name: 'Agni-Vayu Twin Sabers',
    sanskritName: 'अग्नि वायु · 24-Hr Velocity Scimitars',
    category: 'Dual-Wielded Curved Sabers',
    craftInspiration: 'Rapid Prototyping, Jitter Motion & AI Sprints',
    baseDamageBonus: 18,
    postureBonus: 22,
    reachBonus: 0.75,
    speedMultiplier: 1.38,
    colorHex: '#10b981',
    lore: 'Enshrined at the Western Emerald Forge. Blazing twin emerald scimitars that unleash relentless cross-slashes.',
    position: { x: -15.5, z: -12.5 },
  },
  {
    id: 'weapon-brahmastra-halberd',
    keySlot: 4,
    name: 'Brahmastra Celestial Naginata',
    sanskritName: 'ब्रह्मास्त्र शूल · Full-Stack Sovereign Spear',
    category: 'Long-Reach Polearm Glaive',
    craftInspiration: 'Full-Stack AI + Blender 3D + Supabase Engineering',
    baseDamageBonus: 32,
    postureBonus: 38,
    reachBonus: 2.1,
    speedMultiplier: 1.05,
    colorHex: '#ec4899',
    lore: 'Forged before the Northern Citadel Gate. Supreme reach and sweeping 360-degree crimson-gold shockwaves.',
    position: { x: -5.5, z: -34.0 },
  },
];

export type DemonArchetype = 'berserker' | 'stalker' | 'vanguard';

export interface DemonSpawnConfig {
  id: string;
  name: string;
  title: string;
  archetype: DemonArchetype;
  position: { x: number; z: number };
  maxHp: number;
  attackDamage: number;
  aggroRange: number;
  moveSpeed: number;
  scale: number;
  colorHex: number;
}

export const INITIAL_DEMON_SPAWNS: DemonSpawnConfig[] = [
  {
    id: 'demon-fragmentation',
    name: 'Asura of Siloed Data',
    title: '15-Tab Fragmentation Fiend',
    archetype: 'vanguard',
    position: { x: -7.5, z: -16.5 },
    maxHp: 90,
    attackDamage: 26,
    aggroRange: 21,
    moveSpeed: 5.4,
    scale: 1.12,
    colorHex: 0xdc2626,
  },
  {
    id: 'demon-slackdrop',
    name: 'Asura of Lost Handoffs',
    title: 'Buried Thread Phantom',
    archetype: 'stalker',
    position: { x: 18.5, z: -15.5 },
    maxHp: 85,
    attackDamage: 24,
    aggroRange: 22,
    moveSpeed: 6.2,
    scale: 1.08,
    colorHex: 0xea580c,
  },
  {
    id: 'demon-burnout',
    name: 'Asura of Sprint Burnout',
    title: 'Monotony Marauder',
    archetype: 'berserker',
    position: { x: 21.0, z: 10.5 },
    maxHp: 105,
    attackDamage: 30,
    aggroRange: 22,
    moveSpeed: 5.8,
    scale: 1.16,
    colorHex: 0x9333ea,
  },
  {
    id: 'demon-latefee',
    name: 'Asura of Late Penalties',
    title: 'Cash-Flow Leech',
    archetype: 'vanguard',
    position: { x: -21.0, z: 10.5 },
    maxHp: 100,
    attackDamage: 28,
    aggroRange: 21,
    moveSpeed: 5.5,
    scale: 1.14,
    colorHex: 0xb91c1c,
  },
  {
    id: 'demon-coldbot',
    name: 'Asura of Soulless AI',
    title: 'Mechanical Jargon Golem',
    archetype: 'stalker',
    position: { x: -19.5, z: -7.5 },
    maxHp: 90,
    attackDamage: 25,
    aggroRange: 22,
    moveSpeed: 6.0,
    scale: 1.08,
    colorHex: 0xdb2777,
  },
  {
    id: 'demon-ocrerror',
    name: 'Asura of 11-Day Backlogs',
    title: 'Manual Data-Entry Demon',
    archetype: 'berserker',
    position: { x: -8.5, z: -10.5 },
    maxHp: 110,
    attackDamage: 32,
    aggroRange: 20,
    moveSpeed: 5.7,
    scale: 1.14,
    colorHex: 0xdc2626,
  },
];

export const LAYOFF_BOSS_CONFIG = {
  id: 'boss-corporate-layoff',
  name: 'MAHA-ASURA: THE SEPTEMBER LAYOFF',
  subtitle: 'The Sudden September Restructuring Colossus · Final Trial of Resilience',
  spawnPosition: { x: 0, z: -48 },
  maxHp: 420,
  scale: 2.75,
};
