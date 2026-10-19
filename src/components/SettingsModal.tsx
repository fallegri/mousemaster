import React, { useState } from 'react';
import { UserSettings, AIProvider } from '../types';
import { X, Cpu, Key, Sparkles, CheckCircle2, AlertCircle, Volume2, Gauge, Trash2 } from 'lucide-react';

interface Props {
  settings: UserSettings;
  difficultyFactor: number;
  onSaveSettings: (newSettings: UserSettings) => void;
  onUpdateDifficulty: (factor: number) => void;
  onClose: () => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<Props> = ({
  settings,
  difficultyFactor,
  onSaveSettings,
  onUpdateDifficulty,
  onClose,
  onResetProgress,
}) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>({ ...settings });
  const [testStatus, setTestStatus] = useState<{ loading: boolean; message: string; ok?: boolean } | null>(null);

  const handleProviderChange = (provider: AIProvider) => {
    setLocalSettings((prev) => ({ ...prev, aiProvider: provider }));
  };

  const handleTestApiKey = async () => {
    setTestStatus({ loading: true, message: 'Probando conexión con Nvidia NIM...' });
    try {
      const response = await fetch('/api/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'nvidia',
          nvidiaApiKey: localSettings.customNvidiaKey,
          nvidiaModel: localSettings.selectedNvidiaModel,
          metrics: {
            moduleName: 'test',
            moduleTitle: 'Test de Conexión',
            mode: 'free_practice',
            score: 100,
            accuracy: 95,
            averageReactionTimeMs: 400,
            jitterScore: 12,
            smoothIndex: 90,
            difficultyFactor: 1.0,
            missedClicks: 0,
            totalAttempts: 10,
            overshootsCount: 0,
            durationSeconds: 10,
          },
        }),
      });

      const data = await response.json();
      if (data.warning) {
        setTestStatus({ loading: false, message: data.warning, ok: false });
      } else if (data.feedback) {
        setTestStatus({
          loading: false,
          message: `Conexión exitosa con ${data.modelUsed || 'Nvidia NIM'}.`,
          ok: true,
        });
      } else {
        setTestStatus({ loading: false, message: 'Respuesta inesperada de la API.', ok: false });
      }
    } catch (e: any) {
      setTestStatus({
        loading: false,
        message: 'No se pudo conectar con el servidor proxy.',
        ok: false,
      });
    }
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Configuración & Inteligencia Artificial</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* AI Provider Section */}
          <div className="space-y-3">
            <label className="font-bold text-slate-800 text-sm block">Motor de Sugerencias y Diagnóstico IA</label>

            {/* Provider Segmented Selector */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleProviderChange('nvidia')}
                className={`py-2 px-3 rounded-lg font-medium transition-all cursor-pointer text-center ${
                  localSettings.aiProvider === 'nvidia'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nvidia NIM
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`py-2 px-3 rounded-lg font-medium transition-all cursor-pointer text-center ${
                  localSettings.aiProvider === 'gemini'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Google Gemini
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange('local')}
                className={`py-2 px-3 rounded-lg font-medium transition-all cursor-pointer text-center ${
                  localSettings.aiProvider === 'local'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Motor Local (Offline)
              </button>
            </div>

            {/* Nvidia Details */}
            {localSettings.aiProvider === 'nvidia' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="text-slate-600 leading-relaxed">
                  Conexión directa con <span className="font-mono font-medium text-slate-800">integrate.api.nvidia.com/v1</span> para análisis biomecánico con modelos acelerados.
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Modelo de Nvidia</label>
                  <select
                    value={localSettings.selectedNvidiaModel}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({ ...prev, selectedNvidiaModel: e.target.value }))
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="nvidia/nemotron-3.5-lightning-30b-a3b">
                      nvidia/nemotron-3.5-lightning-30b-a3b (Recomendado)
                    </option>
                    <option value="meta/llama-3.3-70b-instruct">
                      meta/llama-3.3-70b-instruct (Nvidia NIM)
                    </option>
                    <option value="nvidia/llama-3.1-nemotron-70b-instruct">
                      nvidia/llama-3.1-nemotron-70b-instruct
                    </option>
                    <option value="mistralai/mistral-large-2-instruct">
                      mistralai/mistral-large-2-instruct
                    </option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-slate-500" />
                      <span>Tu API Key de Nvidia (Opcional)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Guardado localmente</span>
                  </div>
                  <input
                    type="password"
                    placeholder="nvapi-..."
                    value={localSettings.customNvidiaKey}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({ ...prev, customNvidiaKey: e.target.value }))
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Si dejas este campo vacío, el servidor usará la clave predeterminada del sistema o cambiará automáticamente al motor local.
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={testStatus?.loading}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>{testStatus?.loading ? 'Comprobando...' : 'Probar conexión'}</span>
                  </button>

                  {testStatus && !testStatus.loading && (
                    <div
                      className={`text-[11px] font-medium flex items-center gap-1 ${
                        testStatus.ok ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {testStatus.ok ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>{testStatus.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gemini Details */}
            {localSettings.aiProvider === 'gemini' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 leading-relaxed">
                Utiliza el SDK oficial <span className="font-semibold text-slate-800">@google/genai</span> con Gemini 2.5 Flash alojado en el backend seguro.
              </div>
            )}

            {/* Local Engine Details */}
            {localSettings.aiProvider === 'local' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 leading-relaxed">
                Análisis biomecánico 100% autónomo. Evalúa la ley de Fitts, aceleración de frenado, overshoots y micro-temblores en el navegador con latencia cero y sin enviar datos al exterior.
              </div>
            )}
          </div>

          {/* Difficulty & Calibrator Section */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Ajuste Dinámico de Dificultad (DDA)</span>
                <span className="text-slate-500 text-[11px]">
                  Calibra los objetivos según tu precisión y velocidad
                </span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.autoAdjustDifficulty}
                onChange={(e) =>
                  setLocalSettings((prev) => ({ ...prev, autoAdjustDifficulty: e.target.checked }))
                }
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                  <Gauge className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Factor de dificultad manual:</span>
                </span>
                <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {difficultyFactor.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={difficultyFactor}
                onChange={(e) => onUpdateDifficulty(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.5x (Objetivos amplios)</span>
                <span>1.0x (Estándar)</span>
                <span>2.0x (Alta precisión)</span>
              </div>
            </div>
          </div>

          {/* Preferences & Reset */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Efectos de sonido (Web Audio)</span>
              <input
                type="checkbox"
                checked={localSettings.soundEnabled}
                onChange={(e) =>
                  setLocalSettings((prev) => ({ ...prev, soundEnabled: e.target.checked }))
                }
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onResetProgress}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reiniciar progreso y récords guardados</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
