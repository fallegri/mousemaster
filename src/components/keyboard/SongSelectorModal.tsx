import React, { useState } from 'react';
import { KeyboardSong } from '../../types';
import { PRESET_SONGS } from '../../data/keyboardSongs';
import { rhythmAudio } from '../../utils/rhythmAudio';
import { sound } from '../../utils/sound';
import {
  Music,
  Upload,
  Play,
  Pause,
  Sparkles,
  Trophy,
  Flame,
  CheckCircle2,
  FileAudio,
  Radio,
  X,
  Volume2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectSong: (song: KeyboardSong) => void;
  selectedSongId?: string;
  bestScores?: Record<string, { score: number; stars: number; maxCombo: number }>;
}

export const SongSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectSong,
  selectedSongId,
  bestScores = {},
}) => {
  const [songsList, setSongsList] = useState<KeyboardSong[]>(PRESET_SONGS);
  const [currentSongId, setCurrentSongId] = useState<string>(selectedSongId || PRESET_SONGS[0].id);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeSong = songsList.find((s) => s.id === currentSongId) || songsList[0];

  const handleTogglePreview = (song: KeyboardSong) => {
    sound.playClick();
    if (previewingId === song.id) {
      rhythmAudio.stop();
      setPreviewingId(null);
    } else {
      rhythmAudio.stop();
      setPreviewingId(song.id);
      rhythmAudio.playSong(song, () => {
        setPreviewingId(null);
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playClick();
    setIsAnalyzing(true);
    setUploadError(null);

    try {
      const result = await rhythmAudio.decodeAndAnalyzeUploadedAudio(file, ['D', 'F', 'J', 'K']);
      const fileNameClean = file.name.replace(/\.[^/.]+$/, '');
      const newSongId = `custom_${Date.now()}`;

      // Register audio in engine for zero-delay local playback
      rhythmAudio.registerCustomSong(newSongId, result.objectUrl, result.buffer);

      const newSong: KeyboardSong = {
        id: newSongId,
        title: fileNameClean.slice(0, 32),
        artist: 'Canción Local del Usuario',
        bpm: result.estimatedBpm,
        duration: Math.round(result.duration),
        difficulty: result.estimatedBpm > 130 ? 'hard' : 'normal',
        genre: 'custom',
        coverGradient: 'from-amber-600 via-rose-600 to-indigo-700',
        laneKeys: ['D', 'F', 'J', 'K'],
        audioSynthType: 'custom',
        customAudioUrl: result.objectUrl,
        notes: result.notes,
      };

      setSongsList((prev) => [newSong, ...prev]);
      setCurrentSongId(newSong.id);
      sound.playHit(1.2);
    } catch (err: any) {
      console.error(err);
      setUploadError('No se pudo procesar el archivo. Comprueba que sea un formato de audio estándar (MP3, WAV o OGG).');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartGame = () => {
    rhythmAudio.stop();
    sound.playHit(1.5);
    onSelectSong(activeSong);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Biblioteca de Canciones & Ritmo</h2>
              <p className="text-xs text-slate-400">
                Pistas libres de derechos y soporte para subir tu propia música local
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              rhythmAudio.stop();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Song List & Upload */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {/* Upload Zone */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-indigo-500/30 bg-indigo-950/20 hover:bg-indigo-950/30 hover:border-indigo-500/50 transition-all flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-indigo-200">¿Tienes tu canción favorita?</h4>
                  <p className="text-xs text-indigo-300/70">
                    Sube un MP3 o WAV; la IA detectará el ritmo para crear tus notas
                  </p>
                </div>
              </div>

              <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30">
                {isAnalyzing ? (
                  <>
                    <Radio className="w-4 h-4 animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <FileAudio className="w-4 h-4" />
                    <span>Subir Canción</span>
                  </>
                )}
                <input
                  type="file"
                  accept="audio/mp3,audio/wav,audio/ogg"
                  onChange={handleFileUpload}
                  disabled={isAnalyzing}
                  className="hidden"
                />
              </label>
            </div>

            {/* Local Privacy Clarification */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>
                <strong>100% Local & Privado:</strong> Tu música se queda en tu navegador (Blob local). No se sube a Vercel ni a ningún servidor externo.
              </span>
            </div>

            {uploadError && (
              <div className="px-3 py-2 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
                {uploadError}
              </div>
            )}

            {/* Song Cards List */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                Canciones Disponibles ({songsList.length})
              </span>

              {songsList.map((song) => {
                const isSelected = song.id === currentSongId;
                const isPlaying = previewingId === song.id;
                const record = bestScores[song.id];

                return (
                  <div
                    key={song.id}
                    onClick={() => {
                      sound.playClick();
                      setCurrentSongId(song.id);
                    }}
                    className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-800/90 border-indigo-500/60 ring-2 ring-indigo-500/30'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Song Cover Avatar */}
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${song.coverGradient} flex items-center justify-center text-white shrink-0 shadow-md`}
                      >
                        <Music className="w-5 h-5 opacity-80" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {song.levelNumber && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-600 text-white uppercase tracking-wider">
                              Nivel {song.levelNumber}
                            </span>
                          )}
                          <h4 className="text-sm font-bold text-white truncate">{song.title}</h4>
                          {song.genre === 'custom' && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Tu Archivo
                            </span>
                          )}
                          {song.laneKeys.length === 8 ? (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              8 Teclas (Bimanual)
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/60 text-slate-300 border border-slate-600/50">
                              4 Teclas
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {song.categoryLabel || song.artist}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 flex-wrap">
                          <span className="tabular-nums font-mono">{song.bpm} BPM</span>
                          <span>•</span>
                          <span className="tabular-nums font-mono text-amber-400 font-semibold">2:00 max</span>
                          <span>•</span>
                          <div className="flex items-center gap-1 font-mono font-bold text-[10px]">
                            <span className="text-cyan-400 bg-cyan-950/50 px-1 rounded border border-cyan-500/30">
                              {song.laneKeys.slice(0, song.laneKeys.length === 8 ? 4 : 2).join(' ')}
                            </span>
                            <span className="text-slate-500">+</span>
                            <span className="text-fuchsia-400 bg-purple-950/50 px-1 rounded border border-purple-500/30">
                              {song.laneKeys.slice(song.laneKeys.length === 8 ? 4 : 2).join(' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {record && record.score > 0 && (
                        <div className="hidden sm:flex flex-col items-end text-right">
                          <div className="flex items-center gap-0.5 text-amber-400 text-xs font-bold">
                            <Trophy className="w-3 h-3" />
                            <span className="tabular-nums">{record.score}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Récord</span>
                        </div>
                      )}

                      {/* Preview Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePreview(song);
                        }}
                        title={isPlaying ? 'Pausar muestra' : 'Escuchar muestra'}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                            : 'bg-slate-700/60 text-slate-300 border-slate-600 hover:text-white hover:bg-slate-600'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Song Preview & Launch Deck (like Beatstar preview) */}
          <div className="md:col-span-5 flex flex-col justify-between bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
            <div>
              {/* Big Cover Header */}
              <div
                className={`w-full aspect-16/10 rounded-2xl bg-gradient-to-br ${activeSong.coverGradient} p-5 flex flex-col justify-between relative overflow-hidden shadow-2xl mb-4`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/40 backdrop-blur-md text-white border border-white/20 uppercase tracking-wider">
                    {activeSong.genre}
                  </span>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-amber-300 text-xs font-bold border border-white/10">
                    <Flame className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{activeSong.notes.length} Notas</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white tracking-tight drop-shadow-md">
                    {activeSong.title}
                  </h3>
                  <p className="text-xs text-white/80 font-medium drop-shadow-sm">{activeSong.artist}</p>
                </div>
              </div>

              {/* Lane Keys Configuration Indicator (4 or 8 Keys grouped by Hand) */}
              <div className="flex flex-col gap-2.5 mb-4 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Teclas de la pista ({activeSong.laneKeys.length} Teclas)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold font-mono">
                    Límite: 2 Minutos
                  </span>
                </div>

                {activeSong.laneKeys.length === 8 ? (
                  <div className="space-y-2">
                    {/* Mano Izquierda */}
                    <div>
                      <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                        Mano Izquierda (Meñique, Anular, Medio, Índice)
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {activeSong.laneKeys.slice(0, 4).map((key, i) => (
                          <div
                            key={i}
                            className="flex flex-col items-center justify-center py-1.5 rounded-lg border border-cyan-500/40 text-cyan-300 bg-cyan-950/30 font-bold font-mono text-sm"
                          >
                            <span className="text-base">{key}</span>
                            <span className="text-[8px] font-normal opacity-70">
                              {i === 0 ? 'Meñ.' : i === 1 ? 'Anu.' : i === 2 ? 'Med.' : 'Índ.'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mano Derecha */}
                    <div>
                      <span className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-wider block mb-1">
                        Mano Derecha (Índice, Medio, Anular, Meñique)
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {activeSong.laneKeys.slice(4, 8).map((key, i) => (
                          <div
                            key={i}
                            className="flex flex-col items-center justify-center py-1.5 rounded-lg border border-purple-500/40 text-purple-300 bg-purple-950/30 font-bold font-mono text-sm"
                          >
                            <span className="text-base">{key}</span>
                            <span className="text-[8px] font-normal opacity-70">
                              {i === 0 ? 'Índ.' : i === 1 ? 'Med.' : i === 2 ? 'Anu.' : 'Meñ.'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {activeSong.laneKeys.map((key, i) => {
                      const colors = [
                        'border-cyan-500/40 text-cyan-400 bg-cyan-950/30',
                        'border-blue-500/40 text-blue-400 bg-blue-950/30',
                        'border-purple-500/40 text-purple-400 bg-purple-950/30',
                        'border-pink-500/40 text-pink-400 bg-pink-950/30',
                      ];
                      return (
                        <div
                          key={i}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border font-bold font-mono text-sm ${colors[i % 4]}`}
                        >
                          <span className="text-base">{key}</span>
                          <span className="text-[9px] font-normal opacity-70">
                            {i === 0 ? 'Med. Izq' : i === 1 ? 'Índ. Izq' : i === 2 ? 'Índ. Der' : 'Med. Der'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeSong.descriptionTip && (
                  <p className="text-[11px] text-indigo-300/80 leading-relaxed pt-1 border-t border-slate-800">
                    💡 {activeSong.descriptionTip}
                  </p>
                )}
              </div>

              {/* Challenge Tips */}
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Presiona las teclas cuando la nota toque el círculo inferior</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>¡Mantén el combo para multiplicar tus puntos hasta x4!</span>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/30 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99]"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>INICIAR DESAFÍO DE RITMO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
