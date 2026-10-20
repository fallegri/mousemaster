import React, { useState } from 'react';
import { KeyboardSong, KeyboardScoreSummary, UserSettings } from '../../types';
import { PRESET_SONGS } from '../../data/keyboardSongs';
import { RhythmHighwayGame } from './RhythmHighwayGame';
import { TypingAdventureGame } from './TypingAdventureGame';
import { SongSelectorModal } from './SongSelectorModal';
import { KeyboardScoreModal } from './KeyboardScoreModal';
import { VirtualKeyboardGuide } from './VirtualKeyboardGuide';
import { sound } from '../../utils/sound';
import {
  Music,
  Flame,
  Gamepad2,
  Trophy,
  Upload,
  Play,
  Sparkles,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  userSettings: UserSettings;
  soundEnabled: boolean;
  onToggleSound: () => void;
  keyboardRecords: Record<string, { score: number; stars: number; maxCombo: number; accuracy: number; date: string }>;
  onSaveRecord: (record: KeyboardScoreSummary) => void;
}

export const KeyboardHub: React.FC<Props> = ({
  userSettings,
  soundEnabled,
  onToggleSound,
  keyboardRecords,
  onSaveRecord,
}) => {
  const [subMode, setSubMode] = useState<'hub' | 'playing_rhythm' | 'playing_typing'>('hub');
  const [selectedSong, setSelectedSong] = useState<KeyboardSong>(PRESET_SONGS[0]); // Level 1 default
  const [isSongSelectorOpen, setIsSongSelectorOpen] = useState(false);
  const [activeSummary, setActiveSummary] = useState<KeyboardScoreSummary | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  // Calculate next song in the preset progression
  const currentSongIndex = PRESET_SONGS.findIndex((s) => s.id === selectedSong.id);
  const nextSong =
    currentSongIndex !== -1 && currentSongIndex < PRESET_SONGS.length - 1
      ? PRESET_SONGS[currentSongIndex + 1]
      : null;

  const handleFinishGame = (summary: KeyboardScoreSummary) => {
    setActiveSummary(summary);
    setIsScoreModalOpen(true);
    onSaveRecord(summary);
  };

  if (subMode === 'playing_rhythm') {
    return (
      <>
        <RhythmHighwayGame
          song={selectedSong}
          onFinish={handleFinishGame}
          onExit={() => setSubMode('hub')}
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
        />
        <KeyboardScoreModal
          summary={activeSummary}
          isOpen={isScoreModalOpen}
          onClose={() => {
            setIsScoreModalOpen(false);
            setSubMode('hub');
          }}
          onPlayAgain={() => {
            setIsScoreModalOpen(false);
            // Re-render game
            setSubMode('hub');
            setTimeout(() => setSubMode('playing_rhythm'), 50);
          }}
          onNextLevel={
            nextSong
              ? () => {
                  setSelectedSong(nextSong);
                  setIsScoreModalOpen(false);
                  setSubMode('hub');
                  setTimeout(() => setSubMode('playing_rhythm'), 50);
                }
              : undefined
          }
          nextLevelTitle={nextSong ? `Nivel ${nextSong.levelNumber}: ${nextSong.title}` : undefined}
          onChangeTrack={() => {
            setIsScoreModalOpen(false);
            setSubMode('hub');
            setIsSongSelectorOpen(true);
          }}
          userSettings={userSettings}
        />
      </>
    );
  }

  if (subMode === 'playing_typing') {
    return (
      <>
        <TypingAdventureGame
          onFinish={handleFinishGame}
          onExit={() => setSubMode('hub')}
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
        />
        <KeyboardScoreModal
          summary={activeSummary}
          isOpen={isScoreModalOpen}
          onClose={() => {
            setIsScoreModalOpen(false);
            setSubMode('hub');
          }}
          onPlayAgain={() => {
            setIsScoreModalOpen(false);
            setSubMode('hub');
            setTimeout(() => setSubMode('playing_typing'), 50);
          }}
          onChangeTrack={() => {
            setIsScoreModalOpen(false);
            setSubMode('hub');
          }}
          userSettings={userSettings}
        />
      </>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Entrenador Dactilar de Próxima Generación</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Domina el Teclado al Compás de la Música
          </h1>

          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Aprende digitación táctil con pistas de ritmo estilo <strong>Beatstar / Guitar Hero</strong> y
            desafíos mecánicos inspirados en <strong>Mario Teaches Typing</strong>.
          </p>

          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={() => {
                sound.playClick();
                setSubMode('playing_rhythm');
              }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-black text-sm flex items-center gap-2.5 shadow-xl shadow-indigo-600/30 cursor-pointer transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Jugar Canción Actual</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setIsSongSelectorOpen(true);
              }}
              className="px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Music className="w-4 h-4 text-indigo-400" />
              <span>Elegir o Subir Canción</span>
            </button>
          </div>
        </div>

        {/* Current Active Song Showcase Card */}
        <div
          onClick={() => {
            sound.playClick();
            setIsSongSelectorOpen(true);
          }}
          className={`relative w-full md:w-84 aspect-16/11 rounded-2xl bg-gradient-to-br ${selectedSong.coverGradient} p-5 flex flex-col justify-between border border-white/20 shadow-2xl cursor-pointer hover:scale-102 transition-transform group`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {selectedSong.levelNumber && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-slate-950 uppercase tracking-wider">
                  NIVEL {selectedSong.levelNumber}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/40 text-white border border-white/20 uppercase tracking-wider backdrop-blur-xs">
                Pista Activa
              </span>
            </div>
            <div className="flex items-center gap-1 text-amber-300 text-xs font-bold bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
              <Flame className="w-3.5 h-3.5" />
              <span>{selectedSong.bpm} BPM</span>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black text-white drop-shadow-md group-hover:text-amber-200 transition-colors">
              {selectedSong.title}
            </h3>
            <p className="text-xs text-white/80 font-medium">
              {selectedSong.categoryLabel || selectedSong.artist}
            </p>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {selectedSong.laneKeys.length === 8 ? (
                <>
                  <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-lg border border-cyan-400/40">
                    {selectedSong.laneKeys.slice(0, 4).map((k) => (
                      <span
                        key={k}
                        className="w-6 h-6 rounded bg-cyan-500/30 text-cyan-200 flex items-center justify-center font-mono font-bold text-xs"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                  <span className="text-white/60 font-bold text-xs">+</span>
                  <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-lg border border-fuchsia-400/40">
                    {selectedSong.laneKeys.slice(4, 8).map((k) => (
                      <span
                        key={k}
                        className="w-6 h-6 rounded bg-fuchsia-500/30 text-fuchsia-200 flex items-center justify-center font-mono font-bold text-xs"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                selectedSong.laneKeys.map((k) => (
                  <span
                    key={k}
                    className="w-7 h-7 rounded-lg bg-black/50 border border-white/30 text-white flex items-center justify-center font-mono font-bold text-xs"
                  >
                    {k}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main 2 Gameplay Modes Selector (2 primero y luego 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mode 1: Rhythm Highway Game */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Music className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Modo Ritmo (Estilo Beatstar)
              </span>
            </div>

            <h3 className="text-xl font-bold text-white">Ritmo & Teclas (Falling Notes)</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Las notas caen por una pista en perspectiva 3D dividida en 4 carriles (D, F, J, K). Presiona
              cada tecla cuando la nota llegue a la diana inferior para construir combos de hasta x4.
            </p>

            <div className="mt-4 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Canciones libres de derechos con audio sintetizado de baja latencia</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Detector de picos para jugar con cualquier archivo MP3 o WAV propio</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.playClick();
                setSubMode('playing_rhythm');
              }}
              className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Jugar Pista de Ritmo</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setIsSongSelectorOpen(true);
              }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              title="Cambiar canción"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode 2: Mario Teaches Typing Adventure */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Aventura Mecanográfica
              </span>
            </div>

            <h3 className="text-xl font-bold text-white">Mecanografía Arcade (Mario Typing)</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Supera carreras de obstáculos tecleando letras y palabras en cascada. Entrena la fila guía
              (ASDF - JKLÑ), la fila superior y la velocidad pura de palabras por minuto (WPM).
            </p>

            <div className="mt-4 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>4 Niveles progresivos de mecanografía guiada con cálculo en vivo de WPM</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Guía visual ergonómica indicando qué dedo utilizar en cada tecla</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setSubMode('playing_typing');
            }}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Iniciar Aventura de Mecanografía</span>
          </button>
        </div>
      </div>

      {/* Interactive Virtual Keyboard Reference */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Guía Dactiloscópica Universal</h3>
            <p className="text-xs text-slate-400">
              Coloca tus manos con los índices en F y J. Cada color representa el dedo correspondiente.
            </p>
          </div>
        </div>
        <VirtualKeyboardGuide activeKeys={['D', 'F', 'J', 'K']} compact={false} />
      </div>

      {/* Song Selector Modal */}
      <SongSelectorModal
        isOpen={isSongSelectorOpen}
        onClose={() => setIsSongSelectorOpen(false)}
        onSelectSong={(song) => setSelectedSong(song)}
        selectedSongId={selectedSong.id}
        bestScores={keyboardRecords}
      />
    </div>
  );
};
