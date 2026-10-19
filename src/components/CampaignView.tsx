import React from 'react';
import { MODULES } from '../data/modules';
import { ModuleId, ModuleProgress } from '../types';
import { Star, Lock, Play, CheckCircle2, Crosshair, MousePointerClick, Hand, ArrowUpDown, SquareDashed, Spline } from 'lucide-react';

interface Props {
  modulesProgress: Record<ModuleId, ModuleProgress>;
  totalStars: number;
  onSelectModule: (moduleId: ModuleId) => void;
}

export const CampaignView: React.FC<Props> = ({
  modulesProgress,
  totalStars,
  onSelectModule,
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

  // Find next playable module
  const nextPlayable = MODULES.find((m, idx) => {
    if (idx === 0) return !modulesProgress[m.id]?.completed;
    const prevMod = MODULES[idx - 1];
    return modulesProgress[prevMod.id]?.completed && !modulesProgress[m.id]?.completed;
  }) || MODULES[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Campaign Hero Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            Ruta de Aprendizaje Gamificada
          </div>
          <h1 className="text-2xl font-bold">Domina el Ratón Paso a Paso</h1>
          <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
            Completa cada misión para desbloquear la siguiente destreza. Obtén hasta 3 estrellas por precisión, velocidad de respuesta y suavidad de trazo.
          </p>

          <div className="pt-2 flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Progreso Global</span>
              <span className="font-bold text-amber-400 font-mono tabular-nums">{totalStars} / 18 estrellas</span>
            </div>
            <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${(totalStars / 18) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => onSelectModule(nextPlayable.id)}
          className="px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl text-xs font-bold transition-all shadow-md hover:shadow-indigo-500/20 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Continuar: {nextPlayable.shortName}</span>
        </button>
      </div>

      {/* Level Path Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULES.map((mod, idx) => {
          const progress = modulesProgress[mod.id] || { stars: 0, completed: false, bestScore: 0 };
          const isFirst = idx === 0;
          const prevCompleted = isFirst || modulesProgress[MODULES[idx - 1].id]?.completed;
          const isLocked = !prevCompleted;

          return (
            <div
              key={mod.id}
              className={`rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                isLocked
                  ? 'bg-slate-100/60 border-slate-200 opacity-60'
                  : progress.completed
                  ? 'bg-white border-slate-200 shadow-xs hover:border-emerald-300'
                  : 'bg-white border-indigo-200 shadow-sm ring-2 ring-indigo-500/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      {getIcon(mod.iconName)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                        Nivel {mod.levelNumber}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{mod.title}</h3>
                    </div>
                  </div>

                  {/* Star indicators */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          progress.stars >= s
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 fill-slate-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">{mod.description}</p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-mono">
                  {progress.bestScore > 0 ? `Récord: ${progress.bestScore} pts` : 'No completado'}
                </div>

                {isLocked ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Bloqueado</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectModule(mod.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      progress.completed
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{progress.completed ? 'Repetir' : 'Jugar Nivel'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
