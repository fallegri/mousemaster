import React from 'react';
import { MODULES } from '../data/modules';
import { ModuleId, ModuleProgress, PersonalRecord } from '../types';
import { Crosshair, MousePointerClick, Hand, ArrowUpDown, SquareDashed, Spline, Trophy, Play } from 'lucide-react';

interface Props {
  modulesProgress: Record<ModuleId, ModuleProgress>;
  records: Record<ModuleId, PersonalRecord | undefined>;
  onStartPractice: (moduleId: ModuleId) => void;
}

export const FreePracticeView: React.FC<Props> = ({
  modulesProgress,
  records,
  onStartPractice,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Crosshair':
        return <Crosshair className="w-5 h-5 text-indigo-600" />;
      case 'MousePointerClick':
        return <MousePointerClick className="w-5 h-5 text-amber-600" />;
      case 'Hand':
        return <Hand className="w-5 h-5 text-teal-600" />;
      case 'ArrowUpDown':
        return <ArrowUpDown className="w-5 h-5 text-sky-600" />;
      case 'SquareDashed':
        return <SquareDashed className="w-5 h-5 text-blue-600" />;
      case 'Spline':
        return <Spline className="w-5 h-5 text-purple-600" />;
      default:
        return <Crosshair className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            Entrenamiento Sin Límites
          </div>
          <h1 className="text-xl font-bold text-slate-900">Laboratorio de Práctica Libre</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Entrena de forma aislada cualquiera de las destrezas con retos de mayor duración. Supera tus marcas personales y pon a prueba tu precisión.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-slate-600">Récords guardados localmente</span>
        </div>
      </div>

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((mod) => {
          const record = records[mod.id];
          const progress = modulesProgress[mod.id];

          return (
            <div
              key={mod.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    {getIcon(mod.iconName)}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Nivel {mod.levelNumber}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{mod.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mod.description}</p>
              </div>

              {/* Record Summary */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Récord Personal:</div>
                  <div className="font-bold text-slate-900 font-mono tabular-nums">
                    {record ? `${record.score} pts (${record.accuracy}%)` : (progress?.bestScore ? `${progress.bestScore} pts` : 'Sin registro')}
                  </div>
                </div>

                <button
                  onClick={() => onStartPractice(mod.id)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Comenzar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
