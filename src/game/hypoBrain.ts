import {
  CREATOR_PROFILE,
  PORTFOLIO_STOPS,
  LOTUS_RELICS,
  FORGE_WEAPONS,
  RECRUITER_TEMPLE_CONFIG,
  LAYOFF_BOSS_CONFIG,
  WeaponId,
} from '../data/portfolioStops';

export interface HypoActionDirective {
  type:
    | 'teleport_project'
    | 'track_project'
    | 'teleport_temple'
    | 'teleport_boss'
    | 'equip_weapon'
    | 'none';
  targetId?: string;
  label?: string;
}

export type HypoChatAction = HypoActionDirective;

export interface HypoChatResponse {
  reply: string;
  action: HypoActionDirective;
  followUpPrompts: string[];
}

export interface HypoContextState {
  visitedStopIds?: string[];
  collectedRelicIds?: string[];
  aliveDemonsCount?: number;
  visitedCount?: number;
  relicsCount?: number;
  bossDefeated: boolean;
  equippedWeaponId?: string;
}

/**
 * Builds the comprehensive system instruction for the server-side Gemini model
 * so Hypo can answer any question about Ayush Dubey's portfolio and direct the player inside Portfolio Verse.
 */
export function buildHypoSystemInstruction(ctx: HypoContextState): string {
  const projectsSummary = PORTFOLIO_STOPS.map(
    (s) =>
      `- [${s.id}] "${s.title}" (${s.sanskritTitle}, Role: ${s.project.role}, Timeline: ${s.project.year}): ${s.project.approachSummary} Key Impact: ${s.project.impactMetric} — ${s.project.resultsImpact}`
  ).join('\n');

  const jewelsSummary = LOTUS_RELICS.map(
    (r) => `- [${r.id}] ${r.company} (${r.era}): ${r.meaning}`
  ).join('\n');

  const weaponsSummary = FORGE_WEAPONS.map(
    (w) => `- [${w.id}] ${w.name} (${w.category}, +${w.baseDamageBonus} ATK): ${w.lore}`
  ).join('\n');

  const visitedLen = ctx.visitedStopIds?.length ?? ctx.visitedCount ?? 0;
  const relicsLen = ctx.collectedRelicIds?.length ?? ctx.relicsCount ?? 0;
  const demonsLeft = ctx.aliveDemonsCount ?? 6;

  return `You are Hypo, the friendly, articulate, and intelligent 3D AI Companion Guide inside "Portfolio Verse" — the playable 3D Action-RPG portfolio world of ${CREATOR_PROFILE.name} (${CREATOR_PROFILE.title}).

CREATOR PROFILE:
- Name: ${CREATOR_PROFILE.name}
- Role: ${CREATOR_PROFILE.title}
- Tagline: ${CREATOR_PROFILE.manifesto}
- Email: ${CREATOR_PROFILE.email}
- Booking Call Link: ${CREATOR_PROFILE.calUrl}
- Story: ${CREATOR_PROFILE.layoffStory}

THE 6 SHIPPED PORTFOLIO PROJECT SANCTUMS IN THIS 3D WORLD:
${projectsSummary}

THE 5 CAREER EXPERIENCE JEWELS IN THIS 3D WORLD:
${jewelsSummary}

THE 4 DIVINE WEAPONS IN THIS 3D WORLD:
${weaponsSummary}

SPECIAL LANDMARKS & MECHANICS:
- Temple of Opportunities (${RECRUITER_TEMPLE_CONFIG.name}) at (0, 54) in the South: Where recruiters and hiring leads can send an opportunity email directly to ${CREATOR_PROFILE.email}, book a 15-min call, or download Ayush's 2026 Resume PDF.
- Northern Citadel Boss Challenge Circle at (0, -45.8): Unlocks after all 6 Project Sanctums are visited. Stepping into the circle and pressing [E] or [B] summons "${LAYOFF_BOSS_CONFIG.name}". Visiting all 6 projects also unlocks the [Z] Indra Vajra Sky-Lightning Bolt (-560 HP).
- Movement & Controls: [WASD] Move, [SPACE] Jump & press [SPACE] again mid-air to deploy the Garuda Sky-Cloak Glider, [G] Grapple Hook to monuments, [Left-Click/F] 3-Stage Sword Combo, [Right-Click/V] Sekiro Deflect, [Shift/X] Shadow-Step Dash, [1-4] Switch Swords.

LIVE PLAYER STATE:
- Visited Projects: ${visitedLen}/6 (${ctx.visitedStopIds?.join(', ') || 'in progress'})
- Collected Career Jewels: ${relicsLen}/5
- Remaining Corporate Asuras: ${demonsLeft}/6
- Layoff Boss Defeated: ${ctx.bossDefeated ? 'Yes' : 'No'}

RESPONSE RULES:
1. Keep your reply conversational, warm, concise (2 to 4 sentences max), and specific to Ayush Dubey's real work or the 3D world.
2. Whenever the user asks about a specific project, skill, hiring/contacting Ayush, weapons, or the boss, set an appropriate "action" in your JSON response so the player can either be guided/teleported there or click the action chip.
3. Return valid JSON matching this schema:
{
  "reply": "string (2-4 concise, helpful sentences)",
  "action": {
    "type": "teleport_project" | "track_project" | "teleport_temple" | "teleport_boss" | "equip_weapon" | "none",
    "targetId": "optional project id (mandapa-origin | jantar-observatory | oasis-pavilion | ashoka-stambha | gopuram-sanctum | chand-stepwell) or weapon id",
    "label": "short button label e.g. 'Teleport to 01. CFO AI Workspace'"
  },
  "followUpPrompts": ["2 or 3 short natural follow-up questions"]
}`;
}

/**
 * Deterministic, zero-latency intelligent conversational fallback for Hypo.
 * Understands natural language queries about Ayush's projects, AI/FinTech work, metrics, hiring/contact,
 * controls, gliding, weapons, and boss fight, and returns structured in-world navigation directives.
 */
export function resolveLocalHypoChat(
  userMessage: string,
  ctx: HypoContextState
): HypoChatResponse {
  const q = userMessage.toLowerCase().trim();
  const visitedSet = new Set(ctx.visitedStopIds ?? []);
  const visitedTotal = ctx.visitedStopIds ? visitedSet.size : (ctx.visitedCount ?? 0);
  const nextUnvisited =
    PORTFOLIO_STOPS.find((s) => !visitedSet.has(s.id)) || PORTFOLIO_STOPS[0];

  // 1. Hiring / Recruiter / Contact / Resume / Email / Opportunity Temple
  if (
    /\b(hire|hiring|recruiter|contact|email|mail|resume|cv|call|opportunity|temple|job|role|reach out|offer)\b/.test(
      q
    )
  ) {
    return {
      reply: `Ayush is currently open to Senior & Founding Product Designer roles in AI, FinTech, and Agentic Systems! You can reach him directly at ${CREATOR_PROFILE.email}, book a 15-minute intro call, or visit the Sankalpa Mandapa (Temple of Opportunities) in the Southern Promenade to dispatch an Opportunity Scroll.`,
      action: {
        type: 'teleport_temple',
        label: 'Visit Temple of Opportunities',
      },
      followUpPrompts: [
        'What are Ayush’s biggest AI impact metrics?',
        'Show me the CFO AI Workspace project',
        'How do I unlock the Layoff Boss?',
      ],
    };
  }

  // 2. Specific Project #1: HyperLM Vera / CFO AI Workspace
  if (/\b(vera|cfo|hyperlm|mandapa|workspace|01|first project)\b/.test(q)) {
    const stop = PORTFOLIO_STOPS[0];
    return {
      reply: `In "${stop.title}", Ayush architected a 0→1 multi-agent CFO workspace at Hyperbots that unifies real-time ERP ledger intelligence, anomaly explanations, and autonomous financial workflows. It reduced executive decision latency by 64% across enterprise finance teams. Shall I guide you straight to its Northern Sun Mandapa?`,
      action: {
        type: 'teleport_project',
        targetId: stop.id,
        label: `Teleport to 01 · ${stop.title}`,
      },
      followUpPrompts: [
        'Tell me about the 80% STP Invoice Co-Pilot',
        'Tell me about the Payments Co-Pilot',
        'Take me to the Temple of Opportunities',
      ],
    };
  }

  // 3. Specific Project #6: Invoice Processing Co-Pilot
  if (/\b(invoice|stp|80%|stepwell|06|ap automation|accounts payable)\b/.test(q)) {
    const stop = PORTFOLIO_STOPS[5];
    return {
      reply: `The "${stop.title}" is one of Ayush’s flagship AI systems at Hyperbots! He designed split-screen confidence heatmaps, 3-way PO matching, and human-in-the-loop exception handling—achieving 80% Straight-Through Processing (STP) and 3.4x faster AP cycle times.`,
      action: {
        type: 'teleport_project',
        targetId: stop.id,
        label: `Teleport to 06 · ${stop.title}`,
      },
      followUpPrompts: [
        'Tell me about the Payments Co-Pilot',
        'What is the CFO AI Workspace?',
        'How can I contact Ayush for a role?',
      ],
    };
  }

  // 4. Specific Project #4: Payments Co-Pilot
  if (/\b(payment|payments|treasury|ashoka|04|cashflow|payout)\b/.test(q)) {
    const stop = PORTFOLIO_STOPS[3];
    return {
      reply: `For the "${stop.title}", Ayush designed an agentic B2B payment orchestration engine handling multi-rail ACH/Wire routing, cash-flow forecasting, and cryptographic fraud guardrails—powering $2B+ in annualized enterprise volume with zero unauthorized payouts.`,
      action: {
        type: 'teleport_project',
        targetId: stop.id,
        label: `Teleport to 04 · ${stop.title}`,
      },
      followUpPrompts: [
        'Show me the Invoice Processing Co-Pilot',
        'What is the Bridge Global Hiring project?',
        'Take me to the Temple of Opportunities',
      ],
    };
  }

  // 5. Specific Project #2: Bridge Global Hiring
  if (/\b(bridge|global hiring|compliance|payroll|jantar|02)\b/.test(q)) {
    const stop = PORTFOLIO_STOPS[1];
    return {
      reply: `In "${stop.title}", Ayush reimagined cross-border contractor onboarding and localized compliance across 140+ countries—turning complex legal & tax workflows into a guided 4-minute self-serve experience.`,
      action: {
        type: 'teleport_project',
        targetId: stop.id,
        label: `Teleport to 02 · ${stop.title}`,
      },
      followUpPrompts: [
        'Tell me about Oasis Gamified Learning',
        'Show me the CFO AI Workspace',
        'How do I glide from the mountains?',
      ],
    };
  }

  // 6. Specific Project #3: Oasis / Gamification / Binca / Skillmatics
  if (/\b(oasis|game|gamified|binca|skillmatics|edtech|03|consumer)\b/.test(q)) {
    const stop = PORTFOLIO_STOPS[2];
    return {
      reply: `Before building enterprise AI at Hyperbots, Ayush honed his interactive craft at Binca Games and Skillmatics! In "${stop.title}", he combined spatial learning loops, tactile micro-interactions, and reward economies to boost D30 learner retention by 42%.`,
      action: {
        type: 'teleport_project',
        targetId: stop.id,
        label: `Teleport to 03 · ${stop.title}`,
      },
      followUpPrompts: [
        'Tell me about the Hypo Mascot System (05)',
        'Show me the CFO AI Workspace (01)',
        'How do I fight the Corporate Asuras?',
      ],
    };
  }

  // 7. Specific Project #5: Hypo Mascot / Brand System
  if (/\b(mascot|brand|gopuram|05|who are you|about yourself|hypo project)\b/.test(q)) {
    const stop = PORTFOLIO_STOPS[4];
    return {
      reply: `That’s my origin story! In "${stop.title}", Ayush created me—Hypo—as a living 3D design system mascot and conversational AI persona that humanizes complex B2B finance workflows with expressive states and micro-animations.`,
      action: {
        type: 'teleport_project',
        targetId: stop.id,
        label: `Teleport to 05 · ${stop.title}`,
      },
      followUpPrompts: [
        'What other AI projects has Ayush shipped?',
        'Take me to the next unvisited project',
        'Open the Temple of Opportunities',
      ],
    };
  }

  // 8. Boss Fight / Layoff Boss / Lightning Bolt [Z]
  if (/\b(boss|layoff|september|lightning|thunderbolt|z key|challenge circle|citadel)\b/.test(q)) {
    const unlocked = visitedTotal >= PORTFOLIO_STOPS.length;
    return {
      reply: unlocked
        ? `You’ve inspected all 6 Project Sanctums! Your [Z] Indra Vajra Sky-Lightning Bolt (-560 Boss HP per strike) is unlocked and ready. Head to the glowing Northern Challenge Circle at (0, -45.8) and press [E] or [B] to summon The September Layoff Boss!`
        : `The September Layoff Boss is sealed inside the Northern Citadel until you inspect all 6 Project Sanctums (you’ve seen ${visitedTotal}/6 so far). Once all 6 are awakened, you’ll unlock the [Z] Sky-Lightning Bolt and the Boss Challenge Circle!`,
      action: unlocked
        ? {
            type: 'teleport_boss',
            label: 'Teleport to Boss Challenge Circle',
          }
        : {
            type: 'teleport_project',
            targetId: nextUnvisited.id,
            label: `Inspect Next Project (${nextUnvisited.indexNumber})`,
          },
      followUpPrompts: [
        `Take me to ${nextUnvisited.title}`,
        'How do I parry and dodge in combat?',
        'How do I switch between the 4 weapons?',
      ],
    };
  }

  // 9. Weapons / Combat / Asuras / Sword switching
  if (/\b(weapon|weapons|sword|katana|odachi|glaive|saber|fight|combat|asura|demon|parry|deflect)\b/.test(q)) {
    return {
      reply: `You can wield 4 Divine Blades using keys [1]–[4]: Nandaka Katana [1], Surya-Vajra Odachi [2], Agni-Vayu Twin Sabers [3], and Brahmastra Celestial Glaive [4]. Corporate Asuras only engage when you enter their crimson territory ring—use [Left-Click/F] for combos, [Right-Click/V] for Sekiro Deflects, and [Shift/X] to Shadow-Step Dash!`,
      action: {
        type: 'equip_weapon',
        targetId: 'weapon-brahmastra-halberd' as WeaponId,
        label: 'Equip [4] Brahmastra Glaive (+32 ATK)',
      },
      followUpPrompts: [
        'How do I unlock the [Z] Lightning Bolt?',
        'Tell me about Ayush’s AI & FinTech portfolio',
        'How do I glide from the mountain peaks?',
      ],
    };
  }

  // 10. Controls / Movement / Gliding / Grapple
  if (/\b(move|control|play|glide|glider|fly|jump|grapple|walk|run|how to)\b/.test(q)) {
    return {
      reply: `Use [WASD] to run across the valley and climb the surrounding mountain ridges. Press [SPACE] to jump, and press [SPACE] again while airborne to unfurl your Garuda Energy Wings and glide smoothly across the sky! Press [G] near any monument to grapple-zip to its courtyard.`,
      action: {
        type: 'track_project',
        targetId: nextUnvisited.id,
        label: `Guide Me to ${nextUnvisited.title}`,
      },
      followUpPrompts: [
        'What are Ayush’s top 3 case studies?',
        'How do I fight the Corporate Asuras?',
        'Take me to the Temple of Opportunities',
      ],
    };
  }

  // 11. General Portfolio Overview / Experience / Summary / Default
  return {
    reply: `Ayush Dubey is a Senior Product Designer specializing in 0→1 Agentic AI, FinTech orchestration, and interactive 3D experiences (Hyperbots, Binca Games, Skillmatics). You have explored ${visitedTotal}/6 Project Sanctums so far—I recommend visiting "${nextUnvisited.title}" next, or ask me about any specific case study!`,
    action: {
      type: 'teleport_project',
      targetId: nextUnvisited.id,
      label: `Visit ${nextUnvisited.indexNumber} · ${nextUnvisited.title}`,
    },
    followUpPrompts: [
      'Tell me about the 80% STP Invoice Co-Pilot',
      'Tell me about the CFO AI Workspace (Vera)',
      'Take me to the Temple of Opportunities',
    ],
  };
}
