import React from 'react';
import { ModuleDefinition } from '../types';
import { Play, ArrowLeft, MousePointer, Info, Lightbulb, CheckCircle2, Crosshair, MousePointerClick, Hand, ArrowUpDown, SquareDashed, Spline } from 'lucide-react';
import { sound } from '../utils/sound';

interface Props {
  module: ModuleDefinition;
  isNextMission?: boolean;
  onStart: () => void;
  onBack: () => void;
}

export const MissionBriefingModal: React.FC<Props> = ({
  module,
  isNextMission = false,
  onStart,
  onBack,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Crosshair':
        return <Crosshair className="w-6 h-6 text-indigo-600" />;
      case 'MousePointerClick':
        return <MousePointerClick className="w-6 h-6 text-amber-600" />;
      case 'Hand':
        return <Hand className="w-6 h-6 text-teal-600" />;
      case 'ArrowUpDown':
        return <ArrowUpDown className="w-6 h-6 text-sky-600" />;
      case 'SquareDashed':
        return <SquareDashed className="w-6 h-6 text-blue-600" />;
      case 'Spline':
        return <Spline className="w-6 h-6 text-purple-600" />;
      default:
        return <Crosshair className="w-6 h-6 text-indigo-600" />;
    }
  };

  const handleStart = () => {
    sound.playClick(650);
    onStart();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              {getIcon(module.iconName)}
            </div>
            <div>
              <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <span>{isNextMission ? 'Siguiente Desafío' : 'Instrucciones de Misión'}</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">Nivel {module.levelNumber}</span>
              </div>
              <h2 className="text-lg font-bold text-white leading-tight">{module.title}</h2>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Section 1: ¿Qué desafío viene? */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>¿Qué desafío viene?</span>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">
              {module.objective || module.description}
            </p>
          </div>

          {/* Section 2: ¿Cómo se debe jugar? */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¿Cómo se debe jugar? (Paso a Paso)</span>
            </h3>

            <div className="space-y-2">
              {module.howToPlay && module.howToPlay.length > 0 ? (
                module.howToPlay.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-slate-700"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="leading-relaxed font-medium">{step}</div>
                  </div>
                ))
              ) : (
                <p className="text-slate-600">{module.description}</p>
              )}
            </div>
          </div>

          {/* Section 3: Controles del ratón */}
          {module.controls && module.controls.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800 text-[11px] block">Controles que utilizarás:</span>
              <div className="flex flex-wrap gap-2">
                {module.controls.map((ctrl, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    <MousePointer className="w-3 h-3 text-indigo-600" />
                    <span>{ctrl}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Pro-Tip */}
          {module.proTip && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-950">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-bold">Consejo de técnica:</strong> {module.proTip}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Menú</span>
          </button>

          <button
            onClick={handleStart}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
          >
            <span>¡Comenzar Desafío!</span>
            <Play className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
