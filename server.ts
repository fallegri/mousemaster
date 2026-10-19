import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SessionMetrics {
  moduleName: string;
  moduleTitle: string;
  mode: 'campaign' | 'free_practice';
  score: number;
  accuracy: number; // 0 - 100%
  averageReactionTimeMs: number;
  jitterScore: number; // 0 - 100
  smoothIndex: number; // 0 - 100
  difficultyFactor: number; // 0.5 - 2.0
  missedClicks: number;
  totalAttempts: number;
  overshootsCount: number;
  durationSeconds: number;
}

function generateLocalHeuristicFeedback(metrics: SessionMetrics) {
  const { accuracy, averageReactionTimeMs, jitterScore, smoothIndex, overshootsCount, difficultyFactor } = metrics;
  
  let change: 'increase' | 'maintain' | 'decrease' = 'maintain';
  let newFactor = difficultyFactor;
  const tips: string[] = [];
  const observations: string[] = [];

  // Precision analysis
  if (accuracy >= 90 && averageReactionTimeMs < 600) {
    observations.push('¡Excelente puntería y tiempo de reacción rápido!');
    change = 'increase';
    newFactor = Math.min(2.0, Number((difficultyFactor + 0.15).toFixed(2)));
  } else if (accuracy < 60 || overshootsCount > 5) {
    observations.push('Se detectan sobrepasos del objetivo (overshoots) al frenar el cursor.');
    change = 'decrease';
    newFactor = Math.max(0.5, Number((difficultyFactor - 0.15).toFixed(2)));
  } else {
    observations.push('Ritmo consistente y buena adaptación a los requerimientos de la tarea.');
  }

  // Smoothness & Jitter analysis
  if (jitterScore > 35) {
    tips.push('Apoya el antebrazo sobre el escritorio para reducir la tensión en la muñeca y ganar estabilidad.');
  } else if (smoothIndex < 60) {
    tips.push('Intenta realizar movimientos en un solo trazo continuo en lugar de micro-pausas sucesivas.');
  } else {
    tips.push('Tu agarre del ratón muestra gran control motriz en las curvas.');
  }

  if (averageReactionTimeMs > 1000) {
    tips.push('Configura una sensibilidad de ratón (DPI) intermedia para no tener que levantar el mouse de la alfombrilla.');
  }

  const feedbackText = `${observations.join(' ')} Precisión del ${Math.round(accuracy)}% con ${Math.round(averageReactionTimeMs)}ms de reacción promedio. Tu índice de fluidez de trazado es de ${Math.round(smoothIndex)}/100.`;

  return {
    feedback: feedbackText,
    ergonomicTip: tips[0] || 'Mantén los hombros relajados y el ratón alineado con el codo para evitar fatiga.',
    suggestedDifficultyChange: change,
    suggestedDifficultyFactor: newFactor,
    providerUsed: 'Motor Biomecánico Local',
    modelUsed: 'Heuristic-Motion-v1',
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '2mb' }));

  // Endpoint de configuración para el frontend
  app.get('/api/config', (_req, res) => {
    res.json({
      hasServerNvidiaKey: Boolean(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.trim().length > 5),
      hasServerGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5),
      defaultNvidiaModel: 'nvidia/nemotron-3.5-lightning-30b-a3b',
      availableNvidiaModels: [
        { id: 'nvidia/nemotron-3.5-lightning-30b-a3b', name: 'Nvidia Nemotron 3.5 Lightning (30B A3B)' },
        { id: 'meta/llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B Instruct (Nvidia NIM)' },
        { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nvidia Llama 3.1 Nemotron 70B' },
        { id: 'mistralai/mistral-large-2-instruct', name: 'Mistral Large 2 Instruct (Nvidia NIM)' },
      ],
    });
  });

  // Endpoint principal para evaluación inteligente
  app.post('/api/ai-feedback', async (req, res) => {
    try {
      const {
        provider = 'nvidia',
        nvidiaApiKey,
        nvidiaModel = 'nvidia/nemotron-3.5-lightning-30b-a3b',
        metrics,
      } = req.body as {
        provider: 'nvidia' | 'gemini' | 'local';
        nvidiaApiKey?: string;
        nvidiaModel?: string;
        metrics: SessionMetrics;
      };

      if (!metrics) {
        return res.status(400).json({ error: 'Faltan métricas de sesión' });
      }

      // Si el proveedor seleccionado es Local, respondemos inmediatamente
      if (provider === 'local') {
        const localResult = generateLocalHeuristicFeedback(metrics);
        return res.json(localResult);
      }

      // Proveedor Nvidia NIM
      if (provider === 'nvidia') {
        const effectiveKey = (nvidiaApiKey && nvidiaApiKey.trim().length > 5)
          ? nvidiaApiKey.trim()
          : (process.env.NVIDIA_API_KEY || '').trim();

        if (!effectiveKey) {
          // Si no hay key disponible de Nvidia, degradar elegantemente al motor local
          const fallback = generateLocalHeuristicFeedback(metrics);
          return res.json({
            ...fallback,
            warning: 'No se detectó API Key de Nvidia. Se utilizó el Motor Biomecánico Local.',
          });
        }

        const promptText = `Eres el entrenador biomecánico y de ergonomía de "MouseMaster". 
Analiza el desempeño motriz del usuario en el ejercicio "${metrics.moduleTitle}":
- Modo: ${metrics.mode === 'campaign' ? 'Misión de Campaña' : 'Práctica Libre'}
- Puntuación obtenida: ${metrics.score}
- Precisión: ${metrics.accuracy.toFixed(1)}%
- Tiempo de reacción promedio: ${metrics.averageReactionTimeMs.toFixed(0)} ms
- Índice de temblor/vibración (Jitter): ${metrics.jitterScore.toFixed(0)} / 100 (valores altos indican temblor o vacilación)
- Suavidad de trayectoria: ${metrics.smoothIndex.toFixed(0)} / 100
- Sobrepasos (overshoots): ${metrics.overshootsCount}
- Clics errados: ${metrics.missedClicks}
- Factor de dificultad actual: ${metrics.difficultyFactor.toFixed(2)}x

Responde ÚNICAMENTE en formato JSON con la siguiente estructura exacta:
{
  "feedback": "Evaluación clara, motivadora y concisa en 2-3 oraciones en español.",
  "ergonomicTip": "Un consejo práctico específico de ergonomía o agarre del ratón en 1 oración.",
  "suggestedDifficultyChange": "increase" | "maintain" | "decrease",
  "suggestedDifficultyFactor": 1.15
}`;

        try {
          const nvidiaResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${effectiveKey}`,
            },
            body: JSON.stringify({
              model: nvidiaModel || 'nvidia/nemotron-3.5-lightning-30b-a3b',
              messages: [
                {
                  role: 'system',
                  content: 'Eres un analista ergónomo y entrenador deportivo-motriz experto en accesibilidad e interacción humano-computadora. Responde siempre con un JSON válido.',
                },
                {
                  role: 'user',
                  content: promptText,
                },
              ],
              temperature: 0.3,
              max_tokens: 450,
            }),
          });

          if (!nvidiaResponse.ok) {
            const errBody = await nvidiaResponse.text();
            console.warn('Nvidia NIM API status error:', nvidiaResponse.status, errBody);
            // Fallback a motor local
            const localFallback = generateLocalHeuristicFeedback(metrics);
            return res.json({
              ...localFallback,
              warning: `Respuesta de Nvidia NIM (${nvidiaResponse.status}). Se utilizó el motor local.`,
            });
          }

          const nvidiaData = await nvidiaResponse.json() as any;
          const rawContent = nvidiaData?.choices?.[0]?.message?.content || '';
          
          // Extraer JSON
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return res.json({
              feedback: parsed.feedback,
              ergonomicTip: parsed.ergonomicTip,
              suggestedDifficultyChange: parsed.suggestedDifficultyChange || 'maintain',
              suggestedDifficultyFactor: typeof parsed.suggestedDifficultyFactor === 'number'
                ? Math.min(2.0, Math.max(0.5, parsed.suggestedDifficultyFactor))
                : metrics.difficultyFactor,
              providerUsed: 'Nvidia NIM',
              modelUsed: nvidiaModel,
            });
          } else {
            return res.json({
              feedback: rawContent.slice(0, 300),
              ergonomicTip: 'Mantén el ratón a una distancia donde tu brazo forme un ángulo de 90 grados.',
              suggestedDifficultyChange: 'maintain',
              suggestedDifficultyFactor: metrics.difficultyFactor,
              providerUsed: 'Nvidia NIM',
              modelUsed: nvidiaModel,
            });
          }
        } catch (fetchErr: any) {
          console.warn('Error connecting to Nvidia NIM:', fetchErr?.message);
          const fallback = generateLocalHeuristicFeedback(metrics);
          return res.json({
            ...fallback,
            warning: 'No se pudo conectar a Nvidia NIM. Se aplicó análisis heurístico local.',
          });
        }
      }

      // Proveedor Gemini
      if (provider === 'gemini') {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
          const fallback = generateLocalHeuristicFeedback(metrics);
          return res.json({
            ...fallback,
            warning: 'GEMINI_API_KEY no configurada. Se aplicó análisis local.',
          });
        }

        try {
          const ai = new GoogleGenAI();
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analiza el desempeño con el ratón en "${metrics.moduleTitle}":
Precisión: ${metrics.accuracy.toFixed(1)}%, Reacción: ${metrics.averageReactionTimeMs}ms, Temblor: ${metrics.jitterScore}/100, Fluidez: ${metrics.smoothIndex}/100, Sobrepasos: ${metrics.overshootsCount}, Factor dificultad actual: ${metrics.difficultyFactor}x.
Responde ÚNICAMENTE en JSON con los campos: "feedback", "ergonomicTip", "suggestedDifficultyChange" (increase|maintain|decrease), "suggestedDifficultyFactor" (número entre 0.5 y 2.0).`,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const parsed = JSON.parse(response.text || '{}');
          return res.json({
            feedback: parsed.feedback || 'Buen progreso en la sesión.',
            ergonomicTip: parsed.ergonomicTip || 'Asegura un apoyo cómodo para la muñeca.',
            suggestedDifficultyChange: parsed.suggestedDifficultyChange || 'maintain',
            suggestedDifficultyFactor: typeof parsed.suggestedDifficultyFactor === 'number'
              ? Math.min(2.0, Math.max(0.5, parsed.suggestedDifficultyFactor))
              : metrics.difficultyFactor,
            providerUsed: 'Google Gemini',
            modelUsed: 'gemini-2.5-flash',
          });
        } catch (geminiErr: any) {
          console.warn('Gemini error:', geminiErr?.message);
          const fallback = generateLocalHeuristicFeedback(metrics);
          return res.json(fallback);
        }
      }

      // Por defecto
      return res.json(generateLocalHeuristicFeedback(metrics));
    } catch (err: any) {
      console.error('Server error in /api/ai-feedback:', err);
      return res.status(500).json({ error: 'Error interno al procesar el análisis de IA' });
    }
  });

  // Integración de Vite en desarrollo o estáticos en producción
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MouseMaster running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
