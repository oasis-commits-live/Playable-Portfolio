import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  buildHypoSystemInstruction,
  resolveLocalHypoChat,
  HypoContextState,
} from './src/game/hypoBrain.js';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/hypo-chat', async (req, res) => {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const history: { role?: 'user' | 'hypo'; sender?: 'user' | 'hypo'; text: string }[] =
      Array.isArray(req.body?.history) ? req.body.history : [];
    const context: HypoContextState = {
      visitedStopIds: Array.isArray(req.body?.context?.visitedStopIds)
        ? req.body.context.visitedStopIds
        : [],
      collectedRelicIds: Array.isArray(req.body?.context?.collectedRelicIds)
        ? req.body.context.collectedRelicIds
        : [],
      aliveDemonsCount:
        typeof req.body?.context?.aliveDemonsCount === 'number'
          ? req.body.context.aliveDemonsCount
          : 6,
      bossDefeated: Boolean(req.body?.context?.bossDefeated),
      equippedWeaponId: req.body?.context?.equippedWeaponId,
    };

    if (!message) {
      return res.json(resolveLocalHypoChat('overview', context));
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json(resolveLocalHypoChat(message, context));
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const recentTranscript = history
        .slice(-6)
        .map((m) => `${(m.role || m.sender) === 'user' ? 'Player' : 'Hypo'}: ${m.text}`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: recentTranscript
          ? `Recent Conversation:\n${recentTranscript}\n\nPlayer asks: ${message}`
          : `Player asks: ${message}`,
        config: {
          systemInstruction: buildHypoSystemInstruction(context),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description:
                  'Warm, concise (2-4 sentences) conversational response from Hypo answering the player and referencing Ayush Dubey’s portfolio or world.',
              },
              action: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description:
                      'One of: teleport_project, track_project, teleport_temple, teleport_boss, equip_weapon, none',
                  },
                  targetId: {
                    type: Type.STRING,
                    description:
                      'Project stop ID (mandapa-origin, jantar-observatory, oasis-pavilion, ashoka-stambha, gopuram-sanctum, chand-stepwell) or weapon ID',
                  },
                  label: {
                    type: Type.STRING,
                    description: 'Short CTA button label for the suggested action',
                  },
                },
                required: ['type'],
              },
              followUpPrompts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 or 3 short natural follow-up prompts for the player',
              },
            },
            required: ['reply', 'action', 'followUpPrompts'],
          },
        },
      });

      const rawText = response.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (parsed && typeof parsed.reply === 'string') {
          const stopAliasMap: Record<string, string> = {
            'stop-1': 'mandapa-origin',
            'stop-2': 'jantar-observatory',
            'stop-3': 'oasis-pavilion',
            'stop-4': 'ashoka-stambha',
            'stop-5': 'gopuram-sanctum',
            'stop-6': 'chand-stepwell',
          };
          if (
            parsed.action &&
            typeof parsed.action.targetId === 'string' &&
            stopAliasMap[parsed.action.targetId]
          ) {
            parsed.action.targetId = stopAliasMap[parsed.action.targetId];
          }
          return res.json(parsed);
        }
      }
      return res.json(resolveLocalHypoChat(message, context));
    } catch {
      return res.json(resolveLocalHypoChat(message, context));
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Portfolio Verse Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
