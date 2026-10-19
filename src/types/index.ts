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
