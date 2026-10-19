import React, { useEffect, useState } from 'react';
import { ExerciseMetrics, AIFeedbackResult, UserSettings } from '../types';
import { sound } from '../utils/sound';
import { Star, Sparkles, ArrowRight, RotateCcw, Home, ShieldAlert, Cpu } from 'lucide-react';

interface Props {
  metrics: ExerciseMetrics;
  userSettings: UserSettings;
  onNext: () => void;
  onRetry: () => void;
  onHome: () => void;
  onApplyDifficulty: (newFactor: number) => void;
}

export const CompletionModal: React.FC<Props> = ({
  metrics,
  userSettings,
  onNext,
  onRetry,
  onHome,
  onApplyDifficulty,
}) => {
  const [aiResult, setAiResult] = useState<AIFeedbackResult | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(true);
  const [displayedStars, setDisplayedStars] = useState(0);

  // Sound fanfare and star animation
  useEffect(() => {
    sound.playLevelComplete();

    // Staggered star reveal
    for (let s = 1; s <= metrics.stars; s++) {
      setTimeout(() => {
        setDisplayedStars(s);
        sound.playStar(s);
      }, s * 300);
    }
  }, [metrics.stars]);

  // Request AI diagnostic feedback from backend proxy
  useEffect(() => {
    let isMounted = true;
    setIsLoadingAI(true);

    const fetchAIFeedback = async () => {
      try {
        const response = await fetch('/api/ai-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: userSettings.aiProvider,
            nvidiaApiKey: userSettings.customNvidiaKey,
            nvidiaModel: userSettings.selectedNvidiaModel,
            metrics,
          }),
        });

        if (!response.ok) {
          throw new Error('Error al conectar con el servidor de análisis');
        }

        const data = await response.json();
        if (isMounted) {
          setAiResult(data);
          // If auto adjust difficulty is on, apply new factor automatically
          if (userSettings.autoAdjustDifficulty && typeof data.suggestedDifficultyFactor === 'number') {
            onApplyDifficulty(data.suggestedDifficultyFactor);
          }
        }
      } catch (err: any) {
        console.warn('AI feedback fetch failed, using local fallback:', err);
        if (isMounted) {
          setAiResult({
            feedback: `Completado con ${metrics.accuracy}% de precisión y ${metrics.averageReactionTimeMs}ms de reacción. Buen control global.`,
            ergonomicTip: 'Mantén el ratón paralelo a tu antebrazo para no doblar la muñeca.',
            suggestedDifficultyChange: metrics.accuracy > 85 ? 'increase' : 'maintain',
            suggestedDifficultyFactor: metrics.accuracy > 85 ? Math.min(2.0, metrics.difficultyFactor + 0.15) : metrics.difficultyFactor,
            providerUsed: 'Motor Local (Respaldo)',
            modelUsed: 'Heuristic-Local',
          });
        }
      } finally {
        if (isMounted) setIsLoadingAI(false);
      }
    };

    fetchAIFeedback();
    return () => {
      isMounted = false;
    };
  }, [metrics, userSettings]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header Celebration banner */}
        <div className="bg-gradient-to-b from-indigo-50 to-white px-6 pt-6 pb-3 text-center border-b border-slate-100">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            {metrics.mode === 'campaign' ? 'Misión Superada' : 'Sesión de Práctica'}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{metrics.moduleTitle}</h2>

          {/* Animated Stars */}
          <div className="flex items-center justify-center gap-2 mt-4 mb-1">
            {[1, 2, 3].map((starIdx) => (
              <div
                key={starIdx}
                className={`transition-all duration-300 transform ${
                  displayedStars >= starIdx ? 'scale-110 text-amber-400 fill-amber-400' : 'scale-90 text-slate-200'
                }`}
              >
                <Star
                  className={`w-9 h-9 ${displayedStars >= starIdx ? 'fill-amber-400 drop-shadow-sm' : 'fill-slate-100'}`}
                />
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {metrics.stars === 3
              ? '¡Rendimiento Magistral!'
              : metrics.stars === 2
              ? '¡Muy Buen Desempeño!'
              : '¡Nivel Completado! Puedes practicar para lograr 3 estrellas'}
          </div>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-4 gap-2 px-6 py-4 bg-slate-50/70 border-b border-slate-100 text-center">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Puntos</div>
            <div className="text-base font-bold text-slate-900 font-mono tabular-nums">{metrics.score}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Precisión</div>
            <div className="text-base font-bold text-emerald-600 font-mono tabular-nums">{metrics.accuracy}%</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Reacción</div>
            <div className="text-base font-bold text-slate-800 font-mono tabular-nums">{metrics.averageReactionTimeMs}ms</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Fluidez</div>
            <div className="text-base font-bold text-indigo-600 font-mono tabular-nums">{metrics.smoothIndex}/100</div>
          </div>
        </div>

        {/* AI Coach Suggestion Card */}
        <div className="p-6 space-y-3">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Análisis del Consejero IA</span>
              </div>
              {aiResult && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Cpu className="w-3 h-3 text-slate-400" />
                  <span>{aiResult.providerUsed}</span>
                </div>
              )}
            </div>

            {isLoadingAI ? (
              <div className="py-3 text-center text-slate-500 flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Analizando vectores de movimiento y fluidez con IA...</span>
              </div>
            ) : aiResult ? (
              <>
                <p className="text-slate-700 leading-relaxed">{aiResult.feedback}</p>
                <div className="pt-2 border-t border-indigo-100/80 flex items-start gap-2 text-indigo-900 font-medium">
                  <span className="text-slate-500 shrink-0">Consejo ergonómico:</span>
                  <span>{aiResult.ergonomicTip}</span>
                </div>
                {aiResult.warning && (
                  <div className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                    {aiResult.warning}
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Difficulty Adjustment Notice */}
          {aiResult && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="text-slate-600">Dificultad adaptativa sugerida:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {aiResult.suggestedDifficultyFactor.toFixed(2)}x
                </span>
                <button
                  onClick={() => onApplyDifficulty(aiResult.suggestedDifficultyFactor)}
                  className="px-2 py-0.5 text-[11px] font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md transition-colors cursor-pointer"
                >
                  Calibrar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex items-center gap-3">
          <button
            onClick={onHome}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Volver al Menú"
          >
            <Home className="w-4 h-4" />
          </button>
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repetir Desafío</span>
          </button>
          <button
            onClick={onNext}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Siguiente Nivel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
