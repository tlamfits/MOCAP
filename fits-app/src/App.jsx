import { useState } from 'react';
import AthleteInfo from './components/AthleteInfo';
import MovementScoring from './components/MovementScoring';
import ContextualFactors from './components/ContextualFactors';
import Dashboard from './components/Dashboard';
import ProgramView from './components/ProgramView';

const STEPS = [
  { id: 'info', label: 'Athlete Info', icon: '👤' },
  { id: 'scoring', label: 'Movement System', icon: '🏋️' },
  { id: 'context', label: 'Context', icon: '⚙️' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'program', label: 'Program', icon: '📋' },
];

export default function App() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: '',
    sport: '',
    position: '',
    sex: 'male',
    age: '',
    performanceLevel: 2,
    trainingAge: '',
    maturation: 'post_phv',
    range: {},
    coreSupport: {},
    engine: {},
    foundationMovements: {},
    speedSkills: {},
    cmds: [],
  });
  const [context, setContext] = useState({
    season: 'off_season',
    practiceFreq: 3,
    competitionFreq: 1,
    equipment: 'full_gym',
    coaching: 'coached',
    injuryStatus: 'healthy',
    fatigue: 'low',
    sessionsPerWeek: 3,
    trainingTime: 60,
    continuity: 'consistent',
  });

  const updateProfile = (updates) => setProfile(p => ({ ...p, ...updates }));
  const updateContext = (updates) => setContext(c => ({ ...c, ...updates }));

  const canProgress = () => {
    if (step === 0) return profile.name && profile.sport;
    return true;
  };

  return (
    <div className="min-h-screen bg-fits-bg">
      {/* Header */}
      <header className="border-b border-fits-border bg-fits-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-fits-accent to-fits-purple flex items-center justify-center font-bold text-sm">
              F
            </div>
            <div>
              <h1 className="text-lg font-semibold text-fits-text leading-tight">FITS Athletic Development</h1>
              <p className="text-xs text-fits-text-dim">Movement System Profiler</p>
            </div>
          </div>
          {profile.name && (
            <div className="text-sm text-fits-text-muted">
              <span className="text-fits-accent font-medium">{profile.name}</span>
              {profile.sport && <span> — {profile.sport}</span>}
            </div>
          )}
        </div>
      </header>

      {/* Step Navigation */}
      <nav className="border-b border-fits-border bg-fits-surface/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${i === step
                    ? 'bg-fits-accent text-white shadow-lg shadow-fits-accent/20'
                    : i < step
                      ? 'bg-fits-surface-2 text-fits-green hover:bg-fits-surface-3'
                      : 'bg-fits-surface text-fits-text-dim hover:bg-fits-surface-2'
                  }`}
              >
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
                {i < step && <span className="text-fits-green text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {step === 0 && <AthleteInfo profile={profile} updateProfile={updateProfile} />}
        {step === 1 && <MovementScoring profile={profile} updateProfile={updateProfile} />}
        {step === 2 && <ContextualFactors context={context} updateContext={updateContext} />}
        {step === 3 && <Dashboard profile={profile} context={context} />}
        {step === 4 && <ProgramView profile={profile} context={context} />}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-fits-border bg-fits-surface/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-fits-surface-2 text-fits-text-muted hover:bg-fits-surface-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Back
          </button>
          <div className="text-xs text-fits-text-dim self-center">
            Step {step + 1} of {STEPS.length}
          </div>
          <button
            onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
            disabled={step === STEPS.length - 1 || !canProgress()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-fits-accent text-white hover:bg-fits-accent-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-fits-accent/20"
          >
            {step === STEPS.length - 2 ? 'Generate Program →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
