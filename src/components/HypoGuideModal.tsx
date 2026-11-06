import React, { useState, useRef, useEffect } from 'react';
import {
  HYPO_GUIDE_CONFIG,
  PORTFOLIO_STOPS,
  RECRUITER_TEMPLE_CONFIG,
  WeaponId,
} from '../data/portfolioStops';
import {
  HypoChatAction,
  HypoChatResponse,
  resolveLocalHypoChat,
} from '../game/hypoBrain';
import { sound } from '../game/sound';

interface HypoGuideModalProps {
  isOpen: boolean;
  visitedStopIds: Set<string>;
  collectedRelicIds: Set<string>;
  aliveDemonsCount: number;
  bossDefeated: boolean;
  onClose: () => void;
  onTeleportToStop: (stopId: string) => void;
  onTeleportToPoint: (x: number, z: number, label: string) => void;
  onOpenRecruiterTemple: () => void;
  onEquipWeapon?: (weaponId: WeaponId) => void;
  onSelectGuidanceTarget?: (
    id: string | null,
    kind?: 'project' | 'jewel' | 'weapon'
  ) => void;
}

interface ChatTurn {
  id: string;
  sender: 'hypo' | 'user';
  text: string;
  action?: HypoChatAction;
  followUpPrompts?: string[];
}

const QUICK_TOPIC_PRESETS = [
  {
    id: 'basics',
    label: '01 · Explore & Glide',
    prompt: 'How do I explore the Portfolio Verse, jump, and use the Garuda Wing-Glider?',
  },
  {
    id: 'combat',
    label: '02 · Asuras & 4 Swords',
    prompt: 'How do I fight the territorial Asuras and switch between the 4 Divine Swords?',
  },
  {
    id: 'boss',
    label: '03 · Boss & [Z] Bolt',
    prompt: 'How do I unlock the [Z] Sky-Lightning Bolt and challenge the September Layoff Boss?',
  },
  {
    id: 'temple',
    label: '04 · Recruiter Temple',
    prompt: 'Tell me about the Temple of Opportunities and how to hire or email Ayush.',
  },
];

export const HypoGuideModal: React.FC<HypoGuideModalProps> = ({
  isOpen,
  visitedStopIds,
  collectedRelicIds,
  aliveDemonsCount,
  bossDefeated,
  onClose,
  onTeleportToStop,
  onTeleportToPoint,
  onOpenRecruiterTemple,
  onEquipWeapon,
  onSelectGuidanceTarget,
}) => {
  const nextUnvisitedStop =
    PORTFOLIO_STOPS.find((s) => !visitedStopIds.has(s.id)) || PORTFOLIO_STOPS[0];

  const [messages, setMessages] = useState<ChatTurn[]>(() => [
    {
      id: 'welcome-turn',
      sender: 'hypo',
      text: `Namaste, Builder! I'm Hypo, your porcelain-and-gold AI companion. Ask me anything about Ayush Dubey's 6 shipped AI & FinTech case studies, career impact, or ask me to guide you anywhere in the Portfolio Verse!`,
      action: {
        type: 'teleport_project',
        targetId: 'stop-1',
        label: 'Visit 01 · CFO AI Workspace (HyperLM Vera)',
      },
      followUpPrompts: [
        'Which project should I see first?',
        "What is Ayush's design background?",
        'Guide me to the Temple of Opportunities',
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<string>('basics');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isThinking, isOpen]);

  if (!isOpen) return null;

  const currentContext = {
    visitedStopIds: Array.from(visitedStopIds),
    collectedRelicIds: Array.from(collectedRelicIds),
    aliveDemonsCount,
    visitedCount: visitedStopIds.size,
    relicsCount: collectedRelicIds.size,
    bossDefeated,
  };

  const executeHypoAction = (action: HypoChatAction) => {
    sound.playHypoVoiceChime();
    if (action.type === 'teleport_project' && action.targetId) {
      onSelectGuidanceTarget?.(action.targetId, 'project');
      onTeleportToStop(action.targetId);
    } else if (action.type === 'track_project' && action.targetId) {
      onSelectGuidanceTarget?.(action.targetId, 'project');
    } else if (action.type === 'teleport_temple') {
      onTeleportToPoint(
        RECRUITER_TEMPLE_CONFIG.position.x,
        RECRUITER_TEMPLE_CONFIG.position.z - 6.2,
        'Temple of Opportunities'
      );
      onOpenRecruiterTemple();
    } else if (action.type === 'teleport_boss') {
      onTeleportToPoint(0, -41.5, 'Northern Boss Challenge Circle');
    } else if (action.type === 'equip_weapon' && action.targetId) {
      onEquipWeapon?.(action.targetId as WeaponId);
    }
  };

  const sendQuestionToHypo = async (rawQuestion: string, topicId?: string) => {
    const trimmed = rawQuestion.trim();
    if (!trimmed || isThinking) return;

    if (topicId) {
      setActiveTopicId(topicId);
    }
    sound.playHypoVoiceChime();

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
    };

    const nextHistory = [...messages, userTurn];
    setMessages(nextHistory);
    setInputValue('');
    setIsThinking(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 850);
      const response = await fetch('/api/hypo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextHistory.slice(-6).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          context: currentContext,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let payload: HypoChatResponse;
      if (response.ok) {
        payload = (await response.json()) as HypoChatResponse;
      } else {
        payload = resolveLocalHypoChat(trimmed, currentContext);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `hypo-${Date.now()}`,
          sender: 'hypo',
          text: payload.reply,
          action: payload.action && payload.action.type !== 'none' ? payload.action : undefined,
          followUpPrompts: payload.followUpPrompts,
        },
      ]);
      sound.playHypoVoiceChime();
    } catch {
      const fallback = resolveLocalHypoChat(trimmed, currentContext);
      setMessages((prev) => [
        ...prev,
        {
          id: `hypo-${Date.now()}`,
          sender: 'hypo',
          text: fallback.reply,
          action: fallback.action && fallback.action.type !== 'none' ? fallback.action : undefined,
          followUpPrompts: fallback.followUpPrompts,
        },
      ]);
      sound.playHypoVoiceChime();
    } finally {
      setIsThinking(false);
    }
  };

  const latestFollowUps =
    [...messages].reverse().find((m) => m.sender === 'hypo' && m.followUpPrompts?.length)
      ?.followUpPrompts || [];

  return (
    <aside
      data-testid="hypo-guide-modal"
      role="region"
      aria-label="Hypo Conversational AI Companion"
      className="fixed bottom-4 left-4 sm:left-6 z-40 w-[355px] sm:w-[415px] max-h-[70vh] flex flex-col bg-[#060d18]/96 border border-[#2dd4bf]/65 text-[#f8f5ee] shadow-[0_20px_60px_rgba(0,0,0,0.94)] backdrop-blur-xl pointer-events-auto overflow-hidden"
    >
      {/* Sleek Companion Header (Non-blocking HUD Dock) */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#062229] via-[#091526] to-[#062229] border-b border-[#2dd4bf]/35 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* High-Finish Porcelain & Gold Hypo Emblem */}
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#fef08a] via-[#d4af37] to-[#0d9488] p-0.5 shadow-[0_0_16px_rgba(45,212,191,0.45)] shrink-0">
            <div className="w-full h-full rounded-full bg-[#06101e] flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="4.5" fill="#d4af37" />
                <circle cx="27" cy="9" r="4.5" fill="#d4af37" />
                <circle cx="9" cy="9" r="2.2" fill="#2dd4bf" />
                <circle cx="27" cy="9" r="2.2" fill="#2dd4bf" />
                <rect
                  x="7"
                  y="10"
                  width="22"
                  height="18"
                  rx="9"
                  fill="#f8f5ee"
                  stroke="#d4af37"
                  strokeWidth="1.5"
                />
                <rect x="10" y="14" width="16" height="7" rx="3.5" fill="#04101c" />
                <circle cx="14.5" cy="17.5" r="1.9" fill="#38bdf8" />
                <circle cx="21.5" cy="17.5" r="1.9" fill="#38bdf8" />
                <path
                  d="M15 24C16.2 25.4 19.8 25.4 21 24"
                  stroke="#d4af37"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#2dd4bf] border border-[#041017] rounded-full" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-[0.2em] uppercase text-[#2dd4bf]">
              <span>AI PORTFOLIO COMPANION</span>
              <span>·</span>
              <span className="text-[#fef08a]">{visitedStopIds.size}/6 SANCTUMS</span>
            </div>
            <h2
              id="hypo-modal-title"
              className="font-display text-sm sm:text-base font-bold text-[#f8f5ee] truncate"
            >
              {HYPO_GUIDE_CONFIG.name} — Live Portfolio Guide
            </h2>
          </div>
        </div>

        <button
          type="button"
          data-testid="close-hypo-modal-btn"
          onClick={onClose}
          className="px-2.5 py-1 border border-[#2dd4bf]/45 bg-[#081b26] hover:bg-[#0f2d3d] font-mono text-[10px] text-[#ccfbf1] cursor-pointer shrink-0"
          title="Minimize Hypo Companion [ESC]"
        >
          [MINIMIZE]
        </button>
      </div>

      {/* Quick Topic Chips (Preserves topic testids + triggers conversational response) */}
      <div className="px-3.5 py-2 bg-[#07111f] border-b border-[#2dd4bf]/20 flex flex-wrap items-center gap-1.5 shrink-0">
        {QUICK_TOPIC_PRESETS.map((topic) => {
          const isSelected = activeTopicId === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              data-testid={`hypo-topic-${topic.id}`}
              onClick={() => sendQuestionToHypo(topic.prompt, topic.id)}
              className={`px-2 py-1 font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer border ${
                isSelected
                  ? 'bg-[#0e2d3b] border-[#2dd4bf] text-[#fef08a] font-bold'
                  : 'bg-[#091424] hover:bg-[#102238] border-[#2dd4bf]/25 text-[#cbd5e1]'
              }`}
            >
              {topic.label}
            </button>
          );
        })}
      </div>

      {/* Conversational Message Stream */}
      <div
        ref={scrollContainerRef}
        data-testid="hypo-chat-stream"
        className="p-3.5 overflow-y-auto space-y-3 flex-1 min-h-[210px] max-h-[320px] text-xs"
      >
        {messages.map((turn) => (
          <div
            key={turn.id}
            className={`flex flex-col ${
              turn.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[92%] px-3 py-2.5 leading-relaxed ${
                turn.sender === 'user'
                  ? 'bg-[#112a3e] border border-[#38bdf8]/45 text-[#f0f9ff]'
                  : 'bg-[#091626] border border-[#2dd4bf]/35 text-[#e2e8f0]'
              }`}
            >
              <div className="font-mono text-[8px] uppercase tracking-[0.18em] mb-1 text-[#2dd4bf]">
                {turn.sender === 'user' ? 'YOU' : 'HYPO · AI GUIDE'}
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-line">{turn.text}</p>

              {turn.action && turn.action.type !== 'none' && (
                <button
                  type="button"
                  onClick={() => executeHypoAction(turn.action!)}
                  className="mt-2 w-full px-2.5 py-1.5 bg-[#d4af37] hover:bg-[#fef08a] text-[#05070b] font-hud text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>◆ {turn.action.label}</span>
                  <span>GO →</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#091626] border border-[#2dd4bf]/30 text-[#2dd4bf] font-mono text-[10px]">
            <span className="w-2 h-2 rounded-full bg-[#2dd4bf] animate-ping" />
            <span>Hypo is consulting the Portfolio Verse Chronicles...</span>
          </div>
        )}

        {/* Contextual Follow-Up Question Chips */}
        {!isThinking && latestFollowUps.length > 0 && (
          <div className="pt-1 flex flex-wrap gap-1.5">
            {latestFollowUps.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendQuestionToHypo(prompt)}
                className="px-2 py-1 bg-[#081a28] hover:bg-[#0e2c42] border border-[#38bdf8]/35 text-[#bae6fd] font-sans text-[10px] cursor-pointer transition-colors text-left"
              >
                💬 {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Natural Language Chat Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendQuestionToHypo(inputValue);
        }}
        className="p-2.5 bg-[#050b14] border-t border-[#2dd4bf]/30 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          data-testid="hypo-chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Hypo about Ayush's work, metrics, or where to go..."
          className="flex-1 px-3 py-2 bg-[#091322] border border-[#2dd4bf]/40 text-[#f8f5ee] text-xs placeholder-[#64748b] focus:outline-none focus:border-[#fef08a]"
        />
        <button
          type="submit"
          data-testid="hypo-chat-send-btn"
          disabled={isThinking || !inputValue.trim()}
          className="px-3.5 py-2 bg-[#2dd4bf] hover:bg-[#5eead4] disabled:opacity-45 text-[#041017] font-hud text-[11px] font-extrabold uppercase tracking-wider cursor-pointer shrink-0"
        >
          ASK
        </button>
      </form>

      {/* Instant In-World Waypoint Bar */}
      <div className="px-3 py-2 bg-[#040911] border-t border-[#2dd4bf]/20 flex items-center justify-between gap-1.5 shrink-0">
        <button
          type="button"
          data-testid="hypo-goto-next-project-btn"
          onClick={() => {
            onSelectGuidanceTarget?.(nextUnvisitedStop.id, 'project');
            onTeleportToStop(nextUnvisitedStop.id);
          }}
          className="flex-1 px-2 py-1.5 bg-[#122036] hover:bg-[#1a2e4d] border border-[#d4af37]/50 text-[#fef08a] font-hud text-[9px] font-bold uppercase tracking-wider cursor-pointer truncate text-center"
        >
          ◆ {nextUnvisitedStop.indexNumber}. {nextUnvisitedStop.title.split(' ')[0]} →
        </button>

        <button
          type="button"
          data-testid="hypo-goto-temple-btn"
          onClick={() => {
            onTeleportToPoint(
              RECRUITER_TEMPLE_CONFIG.position.x,
              RECRUITER_TEMPLE_CONFIG.position.z - 6.2,
              'Temple of Opportunities'
            );
            onOpenRecruiterTemple();
          }}
          className="flex-1 px-2 py-1.5 bg-[#062229] hover:bg-[#0b3842] border border-[#2dd4bf]/60 text-[#ccfbf1] font-hud text-[9px] font-bold uppercase tracking-wider cursor-pointer truncate text-center"
        >
          🏛️ Recruiter Temple →
        </button>

        <button
          type="button"
          data-testid="hypo-goto-boss-circle-btn"
          onClick={() => {
            onTeleportToPoint(0, -41.5, 'Northern Boss Challenge Circle');
          }}
          className="flex-1 px-2 py-1.5 bg-[#240813] hover:bg-[#380c1d] border border-[#f43f5e]/55 text-[#fda4af] font-hud text-[9px] font-bold uppercase tracking-wider cursor-pointer truncate text-center"
        >
          ⚔ Boss Circle →
        </button>
      </div>
    </aside>
  );
};
