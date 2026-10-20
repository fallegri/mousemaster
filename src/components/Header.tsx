import React from 'react';
import { Settings, Sparkles, Volume2, VolumeX, Award, RotateCcw, User, Mouse, Keyboard } from 'lucide-react';
import { MainAppMode } from '../types';

interface Props {
  mainAppMode: MainAppMode;
  onSelectMainMode: (mode: MainAppMode) => void;
  activeTab: 'campaign' | 'free_practice' | 'records' | 'coach';
  onSelectTab: (tab: 'campaign' | 'free_practice' | 'records' | 'coach') => void;
  onOpenSettings: () => void;
  onOpenRestore: () => void;
  userName: string;
  totalStars: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  aiProviderName: string;
}

export const Header: React.FC<Props> = ({
  mainAppMode,
  onSelectMainMode,
  activeTab,
  onSelectTab,
  onOpenSettings,
  onOpenRestore,
  userName,
  totalStars,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="flex items-center justify-between gap-4 sm:gap-6 px-4 sm:px-6 py-3 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Zone 1: Wordmark & Global Mode Switcher */}
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectMainMode('mouse');
            onSelectTab('campaign');
          }}
          className="text-base sm:text-lg font-black tracking-tight text-slate-900 whitespace-nowrap flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
          <span>MasterSkills</span>
        </a>

        {/* Prominent Global Mode Switcher: Practicar Mouse vs Practicar Teclado */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => {
              onSelectMainMode('mouse');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              mainAppMode === 'mouse'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mouse className="w-3.5 h-3.5 text-emerald-600" />
            <span>Practicar Mouse</span>
          </button>

          <button
            onClick={() => {
              onSelectMainMode('keyboard');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              mainAppMode === 'keyboard'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5 text-amber-400" />
            <span>Practicar Teclado</span>
          </button>
        </div>
      </div>

      {/* Zone 2: Navigation Links for Mouse Mode */}
      {mainAppMode === 'mouse' && (
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('campaign')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'campaign' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
            }`}
          >
            Misiones
          </button>
          <button
            onClick={() => onSelectTab('free_practice')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'free_practice' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
            }`}
          >
            Práctica Libre
          </button>
          <button
            onClick={() => onSelectTab('records')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'records' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
            }`}
          >
            Récords
          </button>
          <button
            onClick={() => onSelectTab('coach')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'coach' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Consejero IA</span>
          </button>
        </nav>
      )}

      {/* Zone 3: Right Action Cluster */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* User identification badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 text-xs font-medium border border-slate-200">
          <User className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate max-w-[90px]">{userName}</span>
        </div>

        {/* Restore Practice Button */}
        <button
          onClick={onOpenRestore}
          title="Restaurar práctica y asumir un nuevo usuario (limpia todos los récords de mouse y teclado)"
          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-600" />
          <span className="hidden md:inline">Restaurar Práctica</span>
          <span className="md:hidden">Restaurar</span>
        </button>

        {/* Total stars counter */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200/80 text-amber-800 text-xs font-semibold">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span className="tabular-nums font-mono">{totalStars}</span>
        </div>

        {/* Mute audio button */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Primary Settings action */}
        <button
          onClick={onOpenSettings}
          className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ajustes & IA</span>
        </button>
      </div>
    </header>
  );
};
