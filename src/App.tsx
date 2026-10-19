/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ModuleId, ModuleProgress, PersonalRecord, UserSettings, ExerciseMetrics, UserProfile } from './types';
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
import { RestorePracticeModal } from './components/RestorePracticeModal';
import { MissionBriefingModal } from './components/MissionBriefingModal';
import { CheckCircle2 } from 'lucide-react';

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
const STORAGE_KEY_USER = 'mousemaster_user_profile';

const defaultSettings: UserSettings = {
  aiProvider: 'nvidia',
  customNvidiaKey: '',
  selectedNvidiaModel: 'nvidia/nemotron-3.5-lightning-30b-a3b',
  soundEnabled: true,
  highContrastCursor: false,
  autoAdjustDifficulty: true,
};

const initialModulesProgress: Record<ModuleId, ModuleProgress> = {
  'target-click': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
  'action-clicks': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
  'drag-drop': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
  'scroll-vault': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
  'box-select': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
  'fluid-path': { stars: 0, completed: false, bestScore: 0, bestAccuracy: 0, timesPlayed: 0 },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'campaign' | 'free_practice' | 'records' | 'coach'>('campaign');
  const [activeModuleId, setActiveModuleId] = useState<ModuleId | null>(null);
  const [activeMode, setActiveMode] = useState<'campaign' | 'free_practice'>('campaign');
  const [difficultyFactor, setDifficultyFactor] = useState<number>(1.0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [completionMetrics, setCompletionMetrics] = useState<ExerciseMetrics | null>(null);
  const [exerciseKey, setExerciseKey] = useState(0);
  const [liveStats, setLiveStats] = useState<{ current: number; total: number; score: number } | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mission Briefing States (indica qué desafío viene y cómo se juega)
  const [pendingModuleId, setPendingModuleId] = useState<ModuleId | null>(null);
  const [pendingMode, setPendingMode] = useState<'campaign' | 'free_practice'>('campaign');
  const [isNextMissionFlow, setIsNextMissionFlow] = useState(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);

  // Active User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Usuario 1',
      userNumber: 1,
      createdAt: new Date().toISOString(),
    };
  });

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
    return initialModulesProgress;
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

  // Request module start (shows mission briefing with instructions first)
  const handleRequestStartModule = (moduleId: ModuleId, mode: 'campaign' | 'free_practice' = 'campaign', isNext: boolean = false) => {
    sound.playClick(650);
    setPendingModuleId(moduleId);
    setPendingMode(mode);
    setIsNextMissionFlow(isNext);
    setCompletionMetrics(null);
    setIsBriefingOpen(true);
  };

  // Confirm start after reading instructions in briefing
  const handleConfirmStartFromBriefing = () => {
    if (!pendingModuleId) return;
    setIsBriefingOpen(false);
    setActiveModuleId(pendingModuleId);
    setActiveMode(pendingMode);
    setLiveStats(undefined);
    setExerciseKey((prev) => prev + 1);
  };

  // Direct start for retries
  const handleStartModuleDirect = (moduleId: ModuleId, mode: 'campaign' | 'free_practice' = 'campaign') => {
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

  // Advance to next mission (opens briefing explaining next challenge and how to play)
  const handleNextMission = () => {
    if (!activeModuleId) {
      setCompletionMetrics(null);
      return;
    }
    const currentIdx = MODULES.findIndex((m) => m.id === activeModuleId);
    if (currentIdx >= 0 && currentIdx < MODULES.length - 1) {
      const nextMod = MODULES[currentIdx + 1];
      setActiveModuleId(null);
      handleRequestStartModule(nextMod.id, activeMode, true);
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

  // Restore practice: Cleans all local records, resets progress and creates new user
  const handleConfirmRestorePractice = (newUserName: string) => {
    sound.playClick(400);

    // 1. Clean all local storage records & progress
    try {
      localStorage.removeItem(STORAGE_KEY_RECORDS);
      localStorage.removeItem(STORAGE_KEY_PROGRESS);
      localStorage.removeItem(STORAGE_KEY_DIFFICULTY);
    } catch {}

    // 2. Reset progress state
    setModulesProgress({ ...initialModulesProgress });
    setRecords({} as any);
    setDifficultyFactor(1.0);

    // 3. Assume new user
    const nextUserNumber = userProfile.userNumber + 1;
    const newUser: UserProfile = {
      name: newUserName || `Usuario ${nextUserNumber}`,
      userNumber: nextUserNumber,
      createdAt: new Date().toISOString(),
    };

    setUserProfile(newUser);
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    } catch {}

    // 4. Return to hub & close modal
    setActiveModuleId(null);
    setCompletionMetrics(null);
    setIsRestoreModalOpen(false);
    setActiveTab('campaign');

    // 5. Toast notification
    setToastMessage(`¡Práctica restaurada con éxito! Sesión iniciada para ${newUser.name}.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const totalStars = Object.values(modulesProgress).reduce((acc, curr) => acc + curr.stars, 0);
  const activeModuleDef = MODULES.find((m) => m.id === activeModuleId);

  return (
    <div className={`bg-slate-50 text-slate-900 flex flex-col font-sans select-none ${
      activeModuleId ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'
    }`}>
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setActiveModuleId(null);
          setCompletionMetrics(null);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRestore={() => setIsRestoreModalOpen(true)}
        userName={userProfile.name}
        totalStars={totalStars}
        soundEnabled={userSettings.soundEnabled}
        onToggleSound={() =>
          handleSaveSettings({ ...userSettings, soundEnabled: !userSettings.soundEnabled })
        }
        aiProviderName={userSettings.aiProvider}
      />

      {/* Main Content Arena */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeModuleId && activeModuleDef ? (
          /* Active Workout Stage */
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <HUD
              moduleTitle={activeModuleDef.title}
              levelNumber={activeModuleDef.levelNumber}
              difficultyFactor={difficultyFactor}
              onReset={handleResetExercise}
              onExit={handleExitExercise}
              liveStats={liveStats}
            />

            <div className="flex-1 min-h-0 overflow-hidden p-2 sm:p-4 flex items-center justify-center max-w-6xl w-full mx-auto">
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
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {activeTab === 'campaign' && (
              <CampaignView
                modulesProgress={modulesProgress}
                totalStars={totalStars}
                onSelectModule={(id) => handleRequestStartModule(id, 'campaign', false)}
              />
            )}
            {activeTab === 'free_practice' && (
              <FreePracticeView
                modulesProgress={modulesProgress}
                records={records}
                onStartPractice={(id) => handleRequestStartModule(id, 'free_practice', false)}
                onOpenRestore={() => setIsRestoreModalOpen(true)}
              />
            )}
            {activeTab === 'records' && (
              <RecordsView
                modulesProgress={modulesProgress}
                records={records}
                totalStars={totalStars}
                userName={userProfile.name}
                onOpenRestore={() => setIsRestoreModalOpen(true)}
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

      {/* Mission Briefing Modal (Indica previamente qué desafío viene y cómo se debe jugar) */}
      {isBriefingOpen && pendingModuleId && (
        <MissionBriefingModal
          module={MODULES.find((m) => m.id === pendingModuleId) || MODULES[0]}
          isNextMission={isNextMissionFlow}
          onStart={handleConfirmStartFromBriefing}
          onBack={() => {
            setIsBriefingOpen(false);
            setPendingModuleId(null);
          }}
        />
      )}

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

      {/* Restore Practice Confirmation Modal */}
      {isRestoreModalOpen && (
        <RestorePracticeModal
          currentUserNumber={userProfile.userNumber}
          onConfirmRestore={handleConfirmRestorePractice}
          onClose={() => setIsRestoreModalOpen(false)}
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
          onResetProgress={() => {
            setIsSettingsOpen(false);
            setIsRestoreModalOpen(true);
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
