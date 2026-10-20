import React, { useState, useEffect } from 'react';
import { KeyboardScoreSummary, UserSettings } from '../../types';
import { sound } from '../../utils/sound';
import {
  Trophy,
  Sparkles,
  RotateCcw,
  Music,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface Props {
  summary: KeyboardScoreSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  onChangeTrack: () => void;
  userSettings: UserSettings;
}

export const KeyboardScoreModal: React.FC<Props> = ({
  summary,
  isOpen,
  onClose,
  onPlayAgain,
  onChangeTrack,
  userSettings,
}) => {
  const [starsRevealed, setStarsRevealed] = useState(0);
  const [coachTip, setCoachTip] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !summary) {
      setStarsRevealed(0);
      return;
    }

    // Sequenced star reveal sound
    setStarsRevealed(0);
    const starCount = summary.stars || 1;

    for (let i = 1; i <= starCount; i++) {
      setTimeout(() => {
        setStarsRevealed(i);
        sound.playStar(i);
      }, i * 350);
    }

    // Keyboard-specific ergonomic coaching advice
    if (summary.accuracy >= 92) {
      setCoachTip(
        '¡Sincronía sobresaliente! Mantén las muñecas flotando suavemente sobre el escritorio sin apoyarlas con fuerza para prevenir tensión en el túnel carpiano.'
      );
    } else if (summary.missCount > 8) {
      setCoachTip(
        'Observamos desincronización en cambios rápidos de carril. Concéntrate en mantener los dedos índice en los relieves de F y J como punto de anclaje permanente.'
      );
    } else {
      setCoachTip(
        'Buen ritmo sostenido. Respira de forma acompasada con la música; la relajación de hombros y antebrazos aumenta la cadencia natural de pulsación.'
      );
    }
  }, [isOpen, summary]);

  if (!isOpen || !summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Animated Celebration Stars */}
        <div className="flex items-center gap-3 mb-4">
          {[1, 2, 3].map((starIdx) => {
            const isFilled = starIdx <= starsRevealed;
            return (
              <div
                key={starIdx}
                className={`transition-all duration-300 transform ${
                  isFilled ? 'scale-110 rotate-0 text-amber-400' : 'scale-90 text-slate-700'
                }`}
              >
                <Trophy
                  className={`w-10 h-10 ${
                    isFilled
                      ? 'fill-current drop-shadow-[0_0_16px_rgba(251,191,36,0.7)]'
                      : 'stroke-current fill-transparent'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Title & Song Name */}
        <h2 className="text-2xl font-black tracking-tight text-center">
          {summary.stars === 3
            ? '¡DESEMPEÑO MAESTRO!'
            : summary.stars === 2
            ? '¡EXCELENTE RITMO!'
            : '¡DESAFÍO COMPLETADO!'}
        </h2>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-indigo-400" />
          <span>{summary.songTitle}</span>
        </p>

        {/* Big Score Box */}
        <div className="w-full my-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 flex items-center justify-around shadow-inner">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
              Puntaje Total
            </span>
            <span className="text-3xl font-black font-mono text-amber-400 tabular-nums">
              {summary.score.toLocaleString()}
            </span>
          </div>

          <div className="w-px h-10 bg-indigo-500/30" />

          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
              Precisión
            </span>
            <span className="text-3xl font-black font-mono text-emerald-400 tabular-nums">
              {summary.accuracy}%
            </span>
          </div>

          {summary.wpm !== undefined && summary.wpm > 0 && (
            <>
              <div className="w-px h-10 bg-indigo-500/30" />
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
                  Velocidad
                </span>
                <span className="text-3xl font-black font-mono text-cyan-400 tabular-nums">
                  {summary.wpm} WPM
                </span>
              </div>
            </>
          )}
        </div>

        {/* Detailed Breakdown */}
        <div className="w-full grid grid-cols-4 gap-2 mb-6">
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span className="text-[10px] text-amber-300 font-bold block">PERFECT</span>
            <span className="text-base font-black font-mono text-white tabular-nums">
              {summary.perfectCount}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span className="text-[10px] text-emerald-400 font-bold block">GREAT</span>
            <span className="text-base font-black font-mono text-white tabular-nums">
              {summary.greatCount}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span className="text-[10px] text-blue-400 font-bold block">GOOD</span>
            <span className="text-base font-black font-mono text-white tabular-nums">
              {summary.goodCount}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span className="text-[10px] text-rose-400 font-bold block">MISS</span>
            <span className="text-base font-black font-mono text-white tabular-nums">
              {summary.missCount}
            </span>
          </div>
        </div>

        {/* AI Ergonomic Coach Tip */}
        <div className="w-full p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 mb-6 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block mb-0.5">Consejo Ergonómico de Teclado:</span>
            <p className="text-slate-300 leading-relaxed">{coachTip}</p>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="w-full sm:flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Repetir Pista</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onChangeTrack();
            }}
            className="w-full sm:flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Music className="w-4 h-4" />
            <span>Cambiar Canción</span>
          </button>
        </div>
      </div>
    </div>
  );
};
