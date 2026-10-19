/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ModuleId, ModuleProgress, PersonalRecord, UserSettings, ExerciseMetrics } from './types';
import { MODULES } from './data/modules';
import { sound } from './utils/sound';
import { Header } from './components/Header';
import { HUD } from './components/HUD';
import { CampaignView } from './components/CampaignView';
import { FreePracticeView } from './components/FreePracticeView';
import { RecordsView } from './components/RecordsView';
import { AICoachView } from './components/AICoachView';
import { SettingsModal } from './components/SettingsModal';
import { CompletionModal } from './components/CompletionModal';

// Exercise Components
import { TargetClickExercise } from './components/exercises/TargetClickExercise';
import { ActionClicksExercise } from './components/exercises/ActionClicksExercise';
import { DragDropExercise } from './components/exercises/DragDropExercise';
import { ScrollVaultExercise } from './components/exercises/ScrollVaultExercise';
import { BoxSelectExercise } from './components/exercises/BoxSelectExercise';
import { FluidPathExercise } from './components/exercises/FluidPathExercise';

const STORAGE_KEY_PROGRESS = 'mousemaster_progress';
const STORAGE_KEY_RECORDS = 'mousemaster_records';
const STORAGE_KEY_SETTINGS = 'mousemaster_settings';
const STORAGE_KEY_DIFFICULTY = 'mousemaster_difficulty';

const defaultSettings: UserSettings = {
  aiProvider: 'nvidia',
  customNvidiaKey: '',
  selectedNvidiaModel: 'nvidia/nemotron-3.5-lightning-30b-a3b',
  soundEnabled: true,
  highContrastCursor: false,
  autoAdjustDifficulty: true,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'campaign' | 'free_practice' | 'records' | 'coach'>('campaign');
  const [activeModuleId, setActiveModuleId] = useState<ModuleId | null>(null);
  const [activeMode, setActiveMode] = useState<'campaign' | 'free_practice'>('campaign');
  const [difficultyFactor, setDifficultyFactor] = useState<number>(1.0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [completionMetrics, setCompletionMetrics] = useState<ExerciseMetrics | null>(null);
  const [exerciseKey, setExerciseKey] = useState(0);
  const [liveStats, setLiveStats] = useState<{ current: number; total: number; score: number } | undefined>(undefined);

  // User Settings
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
    } catch {}
    return defaultSettings;
  });

  // Module Progress
  const [modulesProgress, setModulesProgress] = useState<Record<ModuleId, ModuleProgress>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      'target-click': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
      'action-clicks': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
      'drag-drop': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
      'scroll-vault': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
      'box-select': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
      'fluid-path': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
    };
  });

  // Personal Records
  const [records, setRecords] = useState<Record<ModuleId, PersonalRecord | undefined>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {} as any;
  });

  // Difficulty Factor
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DIFFICULTY);
      if (saved) setDifficultyFactor(parseFloat(saved));
    } catch {}
  }, []);

  // Sync sound engine enabled flag
  useEffect(() => {
    sound.enabled = userSettings.soundEnabled;
  }, [userSettings.soundEnabled]);

  // Persist settings
  const handleSaveSettings = (newSettings: UserSettings) => {
    setUserSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
    } catch {}
  };

  // Persist difficulty
  const handleUpdateDifficulty = (factor: number) => {
    const clamped = Math.min(2.0, Math.max(0.5, factor));
    setDifficultyFactor(clamped);
    try {
      localStorage.setItem(STORAGE_KEY_DIFFICULTY, clamped.toString());
    } catch {}
  };

  // Start an exercise
  const handleStartModule = (moduleId: ModuleId, mode: 'campaign' | 'free_practice' = 'campaign') => {
    sound.playClick(650);
    setActiveModuleId(moduleId);
    setActiveMode(mode);
    setCompletionMetrics(null);
    setLiveStats(undefined);
    setExerciseKey((prev) => prev + 1);
  };

  // Exercise completed handler
  const handleExerciseComplete = (metrics: ExerciseMetrics) => {
    const moduleId = metrics.moduleName as ModuleId;

    // Update Progress
    setModulesProgress((prev) => {
      const current = prev[moduleId] || { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 };
      const updated: ModuleProgress = {
        stars: Math.max(current.stars, metrics.stars),
        completed: true,
        bestScore: Math.max(current.bestScore, metrics.score),
        bestAccuracy: Math.max(current.bestAccuracy, metrics.accuracy),
        timesPlayed: current.timesPlayed + 1,
      };
      const nextMap = { ...prev, [moduleId]: updated };
      try {
        localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(nextMap));
      } catch {}
      return nextMap;
    });

    // Update Personal Record if better
    setRecords((prev) => {
      const prevRec = prev[moduleId];
      if (!prevRec || metrics.score > prevRec.score) {
        const nextRec: PersonalRecord = {
          moduleId,
          score: metrics.score,
          accuracy: metrics.accuracy,
          date: new Date().toLocaleDateString(),
        };
        const nextMap = { ...prev, [moduleId]: nextRec };
        try {
          localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(nextMap));
        } catch {}
        return nextMap;
      }
      return prev;
    });

    setCompletionMetrics(metrics);
  };

  // Advance to next mission
  const handleNextMission = () => {
    if (!activeModuleId) {
      setCompletionMetrics(null);
      return;
    }
    const currentIdx = MODULES.findIndex((m) => m.id === activeModuleId);
    if (currentIdx >= 0 && currentIdx < MODULES.length - 1) {
      const nextMod = MODULES[currentIdx + 1];
      handleStartModule(nextMod.id, activeMode);
    } else {
      setActiveModuleId(null);
      setCompletionMetrics(null);
      setActiveTab('campaign');
    }
  };

  // Reset current exercise
  const handleResetExercise = () => {
    sound.playClick(500);
    setExerciseKey((prev) => prev + 1);
    setLiveStats(undefined);
  };

  // Exit exercise to current tab
  const handleExitExercise = () => {
    sound.playClick(500);
    setActiveModuleId(null);
    setCompletionMetrics(null);
  };

  // Reset all progress
  const handleResetAllProgress = () => {
    if (confirm('¿Estás seguro de que deseas reiniciar todas tus estrellas y marcas personales?')) {
      localStorage.removeItem(STORAGE_KEY_PROGRESS);
      localStorage.removeItem(STORAGE_KEY_RECORDS);
      localStorage.removeItem(STORAGE_KEY_DIFFICULTY);
      setModulesProgress({
        'target-click': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
        'action-clicks': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
        'drag-drop': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
        'scroll-vault': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
        'box-select': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
        'fluid-path': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
      });
      setRecords({} as any);
      setDifficultyFactor(1.0);
      setIsSettingsOpen(false);
    }
  };

  const totalStars = Object.values(modulesProgress).reduce((acc, curr) => acc + curr.stars, 0);
  const activeModuleDef = MODULES.find((m) => m.id === activeModuleId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setActiveModuleId(null);
          setCompletionMetrics(null);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        totalStars={totalStars}
        soundEnabled={userSettings.soundEnabled}
        onToggleSound={() =>
          handleSaveSettings({ ...userSettings, soundEnabled: !userSettings.soundEnabled })
        }
        aiProviderName={userSettings.aiProvider}
      />

      {/* Main Content Arena */}
      <main className="flex-1 flex flex-col">
        {activeModuleId && activeModuleDef ? (
          /* Active Workout Stage */
          <div className="flex-1 flex flex-col">
            <HUD
              moduleTitle={activeModuleDef.title}
              levelNumber={activeModuleDef.levelNumber}
              difficultyFactor={difficultyFactor}
              onReset={handleResetExercise}
              onExit={handleExitExercise}
              liveStats={liveStats}
            />

            <div className="flex-1 p-4 md:p-6 flex items-center justify-center max-w-6xl w-full mx-auto">
              {activeModuleId === 'target-click' && (
                <TargetClickExercise
                  key={exerciseKey}
                  difficultyFactor={difficultyFactor}
                  mode={activeMode}
                  onComplete={handleExerciseComplete}
                  onLiveUpdate={setLiveStats}
                />
              )}
              {activeModuleId === 'action-clicks' && (
                <ActionClicksExercise
                  key={exerciseKey}
                  difficultyFactor={difficultyFactor}
                  mode={activeMode}
                  onComplete={handleExerciseComplete}
                  onLiveUpdate={setLiveStats}
                />
              )}
              {activeModuleId === 'drag-drop' && (
                <DragDropExercise
                  key={exerciseKey}
                  difficultyFactor={difficultyFactor}
                  mode={activeMode}
                  onComplete={handleExerciseComplete}
                  onLiveUpdate={setLiveStats}
                />
              )}
              {activeModuleId === 'scroll-vault' && (
                <ScrollVaultExercise
                  key={exerciseKey}
                  difficultyFactor={difficultyFactor}
                  mode={activeMode}
                  onComplete={handleExerciseComplete}
                  onLiveUpdate={setLiveStats}
                />
              )}
              {activeModuleId === 'box-select' && (
                <BoxSelectExercise
                  key={exerciseKey}
                  difficultyFactor={difficultyFactor}
                  mode={activeMode}
                  onComplete={handleExerciseComplete}
                  onLiveUpdate={setLiveStats}
                />
              )}
              {activeModuleId === 'fluid-path' && (
                <FluidPathExercise
                  key={exerciseKey}
                  difficultyFactor={difficultyFactor}
                  mode={activeMode}
                  onComplete={handleExerciseComplete}
                  onLiveUpdate={setLiveStats}
                />
              )}
            </div>
          </div>
        ) : (
          /* Navigation Views */
          <div className="flex-1 p-4 md:p-8">
            {activeTab === 'campaign' && (
              <CampaignView
                modulesProgress={modulesProgress}
                totalStars={totalStars}
                onSelectModule={(id) => handleStartModule(id, 'campaign')}
              />
            )}
            {activeTab === 'free_practice' && (
              <FreePracticeView
                modulesProgress={modulesProgress}
                records={records}
                onStartPractice={(id) => handleStartModule(id, 'free_practice')}
              />
            )}
            {activeTab === 'records' && (
              <RecordsView
                modulesProgress={modulesProgress}
                records={records}
                totalStars={totalStars}
              />
            )}
            {activeTab === 'coach' && (
              <AICoachView
                userSettings={userSettings}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}
          </div>
        )}
      </main>

      {/* Completion Modal */}
      {completionMetrics && (
        <CompletionModal
          metrics={completionMetrics}
          userSettings={userSettings}
          onNext={handleNextMission}
          onRetry={handleResetExercise}
          onHome={handleExitExercise}
          onApplyDifficulty={handleUpdateDifficulty}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={userSettings}
          difficultyFactor={difficultyFactor}
          onSaveSettings={handleSaveSettings}
          onUpdateDifficulty={handleUpdateDifficulty}
          onClose={() => setIsSettingsOpen(false)}
          onResetProgress={handleResetAllProgress}
        />
      )}
    </div>
  );
}
