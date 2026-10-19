import React from 'react';
import { MODULES } from '../data/modules';
import { ModuleId, ModuleProgress, PersonalRecord } from '../types';
import { Award, Target, Zap, Clock, ShieldCheck, Star } from 'lucide-react';

interface Props {
  modulesProgress: Record<ModuleId, ModuleProgress>;
  records: Record<ModuleId, PersonalRecord | undefined>;
  totalStars: number;
}

export const RecordsView: React.FC<Props> = ({
  modulesProgress,
  records,
  totalStars,
}) => {
  // Compute global accuracy and score
  const completedCount = Object.values(modulesProgress).filter((p) => p.completed).length;
  const accuracies = Object.values(modulesProgress)
    .filter((p) => p.bestAccuracy > 0)
    .map((p) => p.bestAccuracy);
  const avgAccuracy = accuracies.length > 0
    ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length)
    : 0;
  const totalScore = Object.values(modulesProgress).reduce((sum, p) => sum + p.bestScore, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Estrellas Ganadas</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalStars} <span className="text-xs text-slate-400 font-normal">/ 18</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Target className="w-4 h-4 text-emerald-500" />
            <span>Precisión Media</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {avgAccuracy}%
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Zap className="w-4 h-4 text-indigo-500" />
            <span>Puntos Acumulados</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalScore}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <ShieldCheck className="w-4 h-4 text-sky-500" />
            <span>Misiones Superadas</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {completedCount} <span className="text-xs text-slate-400 font-normal">/ 6</span>
          </div>
        </div>
      </div>

      {/* Module Records Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Desglose de Habilidades y Récords</h2>
          <span className="text-xs text-slate-400">Actualizado en tiempo real</span>
        </div>

        <div className="divide-y divide-slate-100">
          {MODULES.map((mod) => {
            const progress = modulesProgress[mod.id];
            const record = records[mod.id];

            return (
              <div key={mod.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                    {mod.levelNumber}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">{mod.title}</div>
                    <div className="text-[11px] text-slate-500">{mod.category}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          (progress?.stars || 0) >= s
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 fill-slate-100'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Best Accuracy */}
                  <div className="w-20 text-right">
                    <span className="text-[10px] text-slate-400 block">Precisión</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-800">
                      {progress?.bestAccuracy ? `${progress.bestAccuracy}%` : '-'}
                    </span>
                  </div>

                  {/* Best Score */}
                  <div className="w-24 text-right">
                    <span className="text-[10px] text-slate-400 block">Mejor Puntuación</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900">
                      {record ? `${record.score} pts` : (progress?.bestScore ? `${progress.bestScore} pts` : '-')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
