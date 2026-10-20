export type ModuleId =
  | 'target-click'
  | 'action-clicks'
  | 'drag-drop'
  | 'scroll-vault'
  | 'box-select'
  | 'fluid-path';

export interface ModuleDefinition {
  id: ModuleId;
  title: string;
  shortName: string;
  category: string;
  description: string;
  iconName: string;
  levelNumber: number;
  objective: string;
  howToPlay: string[];
  controls: string[];
  proTip: string;
}

export interface ExerciseMetrics {
  moduleName: string;
  moduleTitle: string;
  mode: 'campaign' | 'free_practice';
  score: number;
  accuracy: number; // 0 - 100
  averageReactionTimeMs: number;
  jitterScore: number; // 0 - 100 (lower is calmer/smoother)
  smoothIndex: number; // 0 - 100 (higher is smoother)
  difficultyFactor: number; // 0.5 - 2.0
  missedClicks: number;
  totalAttempts: number;
  overshootsCount: number;
  durationSeconds: number;
  stars: 0 | 1 | 2 | 3;
}

export type AIProvider = 'nvidia' | 'gemini' | 'local';

export interface AIFeedbackResult {
  feedback: string;
  ergonomicTip: string;
  suggestedDifficultyChange: 'increase' | 'maintain' | 'decrease';
  suggestedDifficultyFactor: number;
  providerUsed: string;
  modelUsed: string;
  warning?: string;
}

export interface UserSettings {
  aiProvider: AIProvider;
  customNvidiaKey: string;
  selectedNvidiaModel: string;
  soundEnabled: boolean;
  highContrastCursor: boolean;
  autoAdjustDifficulty: boolean;
}

export interface ModuleProgress {
  stars: number;
  completed: boolean;
  bestScore: number;
  bestAccuracy: number;
  timesPlayed: number;
}

export interface PersonalRecord {
  moduleId: ModuleId;
  score: number;
  accuracy: number;
  date: string;
}

export type MainAppMode = 'mouse' | 'keyboard';

export interface UserProfile {
  name: string;
  userNumber: number;
  createdAt: string;
}

export type KeyboardSubMode = 'rhythm' | 'typing_adventure' | 'records';

export interface RhythmNote {
  id: string;
  time: number; // in seconds
  lane: number; // 0, 1, 2, 3
  key: string;  // e.g. 'D', 'F', 'J', 'K'
  duration?: number;
  hit?: boolean;
  judgement?: 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';
}

export interface KeyboardSong {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  duration: number; // in seconds
  difficulty: 'easy' | 'normal' | 'hard';
  genre: string;
  coverGradient: string;
  laneKeys: string[]; // default 4 keys or 8 keys bimanual
  audioSynthType: 'synthwave' | 'chiptune' | 'lofi' | 'techno' | 'custom';
  customAudioUrl?: string;
  notes: RhythmNote[];
  levelNumber?: number;
  categoryLabel?: string;
  handLayout?: '4-keys' | '8-keys-bimanual';
  leftHandKeys?: string[];
  rightHandKeys?: string[];
  descriptionTip?: string;
}

export interface KeyboardScoreSummary {
  songId: string;
  songTitle: string;
  score: number;
  maxCombo: number;
  accuracy: number;
  stars: 0 | 1 | 2 | 3;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  totalNotes: number;
  wpm?: number;
  mode: 'rhythm' | 'typing';
}

export interface TypingLesson {
  id: string;
  title: string;
  level: number;
  subtitle: string;
  description: string;
  keys: string[];
  words: string[];
  targetWpm: number;
  minAccuracy: number;
}

