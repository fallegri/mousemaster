export default function handler(req: any, res: any) {
  // Configuración de cabeceras CORS si fuera necesario
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
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
}
