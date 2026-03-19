import { SPORTS, PERFORMANCE_LEVELS, MATURATION_STATUS } from '../data/movementSystem';

export default function AthleteInfo({ profile, updateProfile }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-fits-text">Athlete Profile</h2>
        <p className="text-fits-text-muted text-sm mt-1">Enter the athlete's basic information to begin profiling.</p>
      </div>

      <div className="bg-fits-surface rounded-xl border border-fits-border p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-fits-text-muted mb-1.5">Athlete Name *</label>
          <input
            type="text"
            value={profile.name}
            onChange={e => updateProfile({ name: e.target.value })}
            placeholder="Enter athlete name"
            className="w-full bg-fits-surface-2 border border-fits-border rounded-lg px-4 py-2.5 text-fits-text placeholder:text-fits-text-dim focus:outline-none focus:ring-2 focus:ring-fits-accent focus:border-transparent"
          />
        </div>

        {/* Sport & Position */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-fits-text-muted mb-1.5">Sport *</label>
            <select
              value={profile.sport}
              onChange={e => updateProfile({ sport: e.target.value })}
              className="w-full bg-fits-surface-2 border border-fits-border rounded-lg px-4 py-2.5 text-fits-text focus:outline-none focus:ring-2 focus:ring-fits-accent"
            >
              <option value="">Select sport</option>
              {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-fits-text-muted mb-1.5">Position</label>
            <input
              type="text"
              value={profile.position}
              onChange={e => updateProfile({ position: e.target.value })}
              placeholder="e.g., Outside Hitter"
              className="w-full bg-fits-surface-2 border border-fits-border rounded-lg px-4 py-2.5 text-fits-text placeholder:text-fits-text-dim focus:outline-none focus:ring-2 focus:ring-fits-accent"
            />
          </div>
        </div>

        {/* Sex & Age */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-fits-text-muted mb-1.5">Sex</label>
            <div className="flex gap-2">
              {['male', 'female'].map(s => (
                <button
                  key={s}
                  onClick={() => updateProfile({ sex: s })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    profile.sex === s
                      ? 'bg-fits-accent text-white'
                      : 'bg-fits-surface-2 text-fits-text-muted hover:bg-fits-surface-3'
                  }`}
                >
                  {s === 'male' ? 'Male' : 'Female'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-fits-text-muted mb-1.5">Age</label>
            <input
              type="number"
              value={profile.age}
              onChange={e => updateProfile({ age: e.target.value })}
              placeholder="Years"
              className="w-full bg-fits-surface-2 border border-fits-border rounded-lg px-4 py-2.5 text-fits-text placeholder:text-fits-text-dim focus:outline-none focus:ring-2 focus:ring-fits-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fits-text-muted mb-1.5">Training Age</label>
            <input
              type="number"
              value={profile.trainingAge}
              onChange={e => updateProfile({ trainingAge: e.target.value })}
              placeholder="Years"
              className="w-full bg-fits-surface-2 border border-fits-border rounded-lg px-4 py-2.5 text-fits-text placeholder:text-fits-text-dim focus:outline-none focus:ring-2 focus:ring-fits-accent"
            />
          </div>
        </div>

        {/* Performance Level */}
        <div>
          <label className="block text-sm font-medium text-fits-text-muted mb-1.5">Performance Level</label>
          <div className="grid grid-cols-4 gap-2">
            {PERFORMANCE_LEVELS.map(pl => (
              <button
                key={pl.value}
                onClick={() => updateProfile({ performanceLevel: pl.value })}
                className={`py-3 rounded-lg text-center transition-all ${
                  profile.performanceLevel === pl.value
                    ? 'bg-fits-accent text-white ring-2 ring-fits-accent/50'
                    : 'bg-fits-surface-2 text-fits-text-muted hover:bg-fits-surface-3'
                }`}
              >
                <div className="text-sm font-bold">{pl.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{pl.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Maturation Status */}
        <div>
          <label className="block text-sm font-medium text-fits-text-muted mb-1.5">Biological Maturation</label>
          <div className="grid grid-cols-4 gap-2">
            {MATURATION_STATUS.map(m => (
              <button
                key={m.value}
                onClick={() => updateProfile({ maturation: m.value })}
                className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                  profile.maturation === m.value
                    ? 'bg-fits-purple text-white'
                    : 'bg-fits-surface-2 text-fits-text-muted hover:bg-fits-surface-3'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
