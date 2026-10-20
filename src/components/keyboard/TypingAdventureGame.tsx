import React, { useState, useEffect, useRef } from 'react';
import { TypingLesson, KeyboardScoreSummary } from '../../types';
import { TYPING_LESSONS } from '../../data/keyboardSongs';
import { sound } from '../../utils/sound';
import { VirtualKeyboardGuide } from './VirtualKeyboardGuide';
import {
  Sparkles,
  Trophy,
  Flame,
  Volume2,
  VolumeX,
  ArrowLeft,
  RotateCcw,
  Zap,
  Target,
  Gamepad2,
} from 'lucide-react';

interface Props {
  onFinish: (summary: KeyboardScoreSummary) => void;
  onExit: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TypingAdventureGame: React.FC<Props> = ({
  onFinish,
  onExit,
  soundEnabled,
  onToggleSound,
}) => {
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [typedCorrectChars, setTypedCorrectChars] = useState(0);
  const [typedMistakes, setTypedMistakes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);
  const [characterAction, setCharacterAction] = useState<'idle' | 'run' | 'jump' | 'hit'>('idle');

  const lesson = TYPING_LESSONS[selectedLessonIndex];
  const currentWord = lesson.words[wordIndex] || '';

  // WPM calculation timer
  useEffect(() => {
    if (!isPlaying || !startTime) return;
    const interval = setInterval(() => {
      const elapsedMin = (Date.now() - startTime) / 60000;
      if (elapsedMin > 0.02) {
        const wordsCalculated = typedCorrectChars / 5;
        setWpm(Math.round(wordsCalculated / elapsedMin));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, startTime, typedCorrectChars]);

  const handleStartGame = () => {
    sound.playHit(1.2);
    setIsPlaying(true);
    setWordIndex(0);
    setCharIndex(0);
    setTypedCorrectChars(0);
    setTypedMistakes(0);
    setCombo(0);
    setMaxCombo(0);
    setWpm(0);
    setStartTime(Date.now());
    setCharacterAction('run');
  };

  // Keyboard listener
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore meta keys
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

      e.preventDefault();
      const pressedKey = e.key;
      setLastKeyPressed(pressedKey.toUpperCase());

      const targetChar = currentWord[charIndex];

      // Case insensitive comparison for accessibility
      if (targetChar && pressedKey.toLowerCase() === targetChar.toLowerCase()) {
        // Correct key hit
        sound.playHit(1.0 + (charIndex / currentWord.length) * 0.5);
        setTypedCorrectChars((c) => c + 1);
        const newCombo = combo + 1;
        setCombo(newCombo);
        setMaxCombo((m) => Math.max(m, newCombo));

        if (charIndex + 1 < currentWord.length) {
          setCharIndex((ci) => ci + 1);
          setCharacterAction('hit');
          setTimeout(() => setCharacterAction('run'), 150);
        } else {
          // Completed current word! Mario-style jump and break block
          sound.playSnap();
          setCharacterAction('jump');
          setTimeout(() => setCharacterAction('run'), 350);

          if (wordIndex + 1 < lesson.words.length) {
            setWordIndex((wi) => wi + 1);
            setCharIndex(0);
          } else {
            // Completed lesson!
            finishLesson();
          }
        }
      } else {
        // Mistake
        sound.playMiss();
        setTypedMistakes((m) => m + 1);
        setCombo(0);
      }
    };

    const handleKeyUp = () => {
      setLastKeyPressed(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, currentWord, charIndex, wordIndex, combo, lesson]);

  const finishLesson = () => {
    setIsPlaying(false);
    sound.playLevelComplete();

    const totalTyped = typedCorrectChars + typedMistakes;
    const accuracy = totalTyped > 0 ? Math.round((typedCorrectChars / totalTyped) * 100) : 100;
    const finalScore = typedCorrectChars * 50 + maxCombo * 100;

    let stars: 0 | 1 | 2 | 3 = 1;
    if (accuracy >= lesson.minAccuracy && wpm >= lesson.targetWpm) {
      stars = 3;
    } else if (accuracy >= 80) {
      stars = 2;
    }

    onFinish({
      songId: lesson.id,
      songTitle: lesson.title,
      score: finalScore,
      maxCombo,
      accuracy,
      stars,
      perfectCount: typedCorrectChars,
      greatCount: 0,
      goodCount: 0,
      missCount: typedMistakes,
      totalNotes: typedCorrectChars,
      wpm,
      mode: 'typing',
    });
  };

  // Lesson selection view
  if (!isPlaying) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>Aventura Mecanográfica</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Estilo Mario Typing
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Aprende a escribir con todos los dedos mientras superas obstáculos y rompes bloques
              </p>
            </div>
          </div>

          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Lesson Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TYPING_LESSONS.map((l, index) => {
            const isSelected = selectedLessonIndex === index;
            return (
              <div
                key={l.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedLessonIndex(index);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'bg-slate-900 border-amber-500/70 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                    : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      NIVEL {l.level}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Meta: {l.targetWpm} WPM</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{l.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{l.description}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {l.keys.map((k) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Lesson Preview & Launch */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h4 className="text-lg font-bold text-white">{lesson.title}</h4>
            <p className="text-xs text-slate-300 mt-1">{lesson.subtitle}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span>{lesson.words.length} Palabras en la misión</span>
              <span>•</span>
              <span>Precisión mínima: {lesson.minAccuracy}%</span>
            </div>
          </div>

          <button
            onClick={handleStartGame}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm tracking-wide flex items-center gap-3 shadow-xl shadow-amber-500/30 cursor-pointer transition-all hover:scale-105"
          >
            <Gamepad2 className="w-5 h-5" />
            <span>COMENZAR AVENTURA</span>
          </button>
        </div>

        {/* Keyboard Preview */}
        <VirtualKeyboardGuide activeKeys={lesson.keys} compact={false} />
      </div>
    );
  }

  // Active typing game view (Arcade style)
  const nextTargetChar = currentWord[charIndex] || '';

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 flex flex-col gap-6 text-white">
      {/* Top HUD */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(false)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-xs text-amber-400 font-bold block">{lesson.title}</span>
            <span className="text-xs text-slate-400">
              Palabra {wordIndex + 1} de {lesson.words.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Velocidad</span>
            <span className="text-xl font-black font-mono text-cyan-400 tabular-nums">{wpm} WPM</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Racha</span>
            <span className="text-xl font-black font-mono text-amber-400 tabular-nums">{combo}</span>
          </div>
        </div>
      </div>

      {/* Arcade Runner Stage */}
      <div className="relative w-full h-56 rounded-3xl bg-slate-950 border-2 border-indigo-500/30 overflow-hidden flex flex-col justify-between p-6 shadow-2xl">
        {/* Background Pixel Grid & Distant Stars */}
        <div className="absolute inset-0 bg-radial from-indigo-900/30 via-slate-950 to-slate-950 pointer-events-none" />

        {/* Current Target Word Floating Banner */}
        <div className="relative z-10 flex flex-col items-center justify-center pt-2">
          <div className="text-xs text-slate-400 font-medium mb-1">Escribe la palabra:</div>
          <div className="flex items-center gap-1.5 p-3 px-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl backdrop-blur-md">
            {currentWord.split('').map((char, i) => {
              const isTyped = i < charIndex;
              const isCurrent = i === charIndex;

              return (
                <span
                  key={i}
                  className={`text-2xl sm:text-3xl font-mono font-black transition-all ${
                    isTyped
                      ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : isCurrent
                      ? 'text-amber-400 scale-125 border-b-2 border-amber-400 animate-pulse'
                      : 'text-slate-500'
                  }`}
                >
                  {char}
                </span>
              );
            })}
          </div>
        </div>

        {/* Ground & Animated Character Platform */}
        <div className="relative z-10 w-full flex items-end justify-between border-b-4 border-amber-600/80 pb-2">
          {/* Animated Runner Hero */}
          <div
            className={`flex items-center gap-2 transition-transform duration-150 ${
              characterAction === 'jump'
                ? '-translate-y-8 scale-110'
                : characterAction === 'hit'
                ? 'translate-x-2'
                : ''
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/40 font-black text-xl border-2 border-white/20">
              🏃
            </div>
            <div className="hidden sm:block text-xs font-bold text-amber-300">
              {characterAction === 'jump' ? '¡SALTO!' : 'CORRIENDO'}
            </div>
          </div>

          {/* Destructible Target Block with Target Key */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Próxima tecla:</span>
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border-2 border-indigo-400 text-indigo-300 flex items-center justify-center font-mono font-black text-2xl shadow-lg shadow-indigo-500/30 animate-bounce">
              {nextTargetChar.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Keyboard with Finger Guidance */}
      <VirtualKeyboardGuide
        activeKeys={[nextTargetChar.toUpperCase()]}
        pressedKey={lastKeyPressed}
        compact={false}
      />
    </div>
  );
};
