import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { processAiFeedback } from './src/services/aiService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      const result = await processAiFeedback(req.body);
      return res.json(result);
    } catch (err: any) {
      console.error('Server error in /api/ai-feedback:', err);
      return res.status(500).json({ error: err?.message || 'Error interno al procesar el análisis de IA' });
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
