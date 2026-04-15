import { generateProgramSummary } from '../data/programGenerator';
import { PERFORMANCE_LEVELS } from '../data/movementSystem';

function PriorityBadge({ priority }) {
  const colors = {
    CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    MODERATE: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    MAINTAIN: 'bg-green-500/15 text-green-400 border-green-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${colors[priority] || ''}`}>
      {priority}
    </span>
  );
}

function BlockCard({ block, index }) {
  const typeColors = {
    foundation: 'border-l-orange-500',
    engine: 'border-l-blue-500',
    speed: 'border-l-cyan-500',
    recovery: 'border-l-green-500',
  };

  return (
    <div className={`bg-fits-surface-2 rounded-lg border-l-4 ${typeColors[block.type] || 'border-l-fits-accent'} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-fits-text">{block.name}</h4>
        <span className="text-xs text-fits-text-dim capitalize">{block.type}</span>
      </div>
      {block.description && (
        <p className="text-xs text-fits-text-muted mb-2">{block.description}</p>
      )}
      {block.exercises && (
        <ul className="space-y-1">
          {block.exercises.map((ex, i) => (
            <li key={i} className="text-sm text-fits-text-muted flex items-start gap-2">
              <span className="text-fits-accent mt-0.5">•</span>
              <span>{ex}</span>
            </li>
          ))}
        </ul>
      )}
      {block.phases && block.phases.map((phase, i) => (
        <div key={i} className="mt-3">
          <div className="text-xs font-semibold text-fits-accent mb-1">{phase.name}</div>
          <p className="text-xs text-fits-text-dim mb-1">{phase.description}</p>
          <ul className="space-y-0.5">
            {phase.exercises.map((ex, j) => (
              <li key={j} className="text-sm text-fits-text-muted flex items-start gap-2">
                <span className="text-fits-accent mt-0.5">•</span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function DayCard({ day }) {
  const typeColors = {
    foundation: 'bg-orange-500/10 border-orange-500/20',
    strength: 'bg-blue-500/10 border-blue-500/20',
    speed: 'bg-cyan-500/10 border-cyan-500/20',
    speed_strength: 'bg-purple-500/10 border-purple-500/20',
    power: 'bg-yellow-500/10 border-yellow-500/20',
    recovery: 'bg-green-500/10 border-green-500/20',
    sport_speed: 'bg-pink-500/10 border-pink-500/20',
  };

  const intensityColors = {
    HIGH: 'text-red-400',
    MODERATE: 'text-yellow-400',
    LOW: 'text-green-400',
  };

  return (
    <div className={`rounded-lg border p-4 ${typeColors[day.type] || 'bg-fits-surface-2 border-fits-border'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-fits-text">{day.day}</span>
        {day.intensity && (
          <span className={`text-xs font-bold ${intensityColors[day.intensity] || ''}`}>
            {day.intensity}
          </span>
        )}
      </div>
      <p className="text-sm text-fits-text-muted">{day.focus}</p>
    </div>
  );
}

export default function ProgramView({ profile, context }) {
  const program = generateProgramSummary(profile, context);
  const pl = PERFORMANCE_LEVELS.find(p => p.value === profile.performanceLevel);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-fits-text">Generated Program</h2>
        <p className="text-fits-text-muted text-sm mt-1">
          Programming for <span className="text-fits-accent font-medium">{program.athleteName}</span> at{' '}
          <span className="text-fits-accent font-medium">{pl?.label}</span> level.
        </p>
      </div>

      {/* Key Recommendations */}
      <div className="bg-fits-surface rounded-xl border border-fits-border p-5">
        <h3 className="text-lg font-semibold text-fits-text mb-3">Key Recommendations</h3>
        <div className="space-y-3">
          {program.keyRecommendations.map((rec, i) => (
            <div key={i} className={`rounded-lg p-4 ${
              rec.priority === 'CRITICAL' ? 'bg-red-500/10 border border-red-500/20' :
              rec.priority === 'HIGH' ? 'bg-orange-500/10 border border-orange-500/20' :
              rec.priority === 'MODERATE' ? 'bg-blue-500/10 border border-blue-500/20' :
              'bg-green-500/10 border border-green-500/20'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <PriorityBadge priority={rec.priority} />
              </div>
              <p className="text-sm text-fits-text">{rec.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Areas */}
      {program.priorities.length > 0 && (
        <div className="bg-fits-surface rounded-xl border border-fits-border p-5">
          <h3 className="text-lg font-semibold text-fits-text mb-3">Priority Development Areas</h3>
          <div className="grid grid-cols-2 gap-2">
            {program.priorities.slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-fits-surface-2 rounded-lg px-3 py-2">
                <div>
                  <div className="text-sm text-fits-text">{p.name}</div>
                  <div className="text-xs text-fits-text-dim">{p.layer}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  p.quadrant.id === 'hidden_risk' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                  p.quadrant.id === 'foundation_gap' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                  'bg-blue-500/15 text-blue-400 border-blue-500/30'
                }`}>
                  {p.quadrant.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Structure */}
      <div className="bg-fits-surface rounded-xl border border-fits-border p-5">
        <h3 className="text-lg font-semibold text-fits-text mb-3">Weekly Structure</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {program.weeklyStructure.map((day, i) => (
            <DayCard key={i} day={day} />
          ))}
        </div>
      </div>

      {/* Sample Session */}
      <div className="bg-fits-surface rounded-xl border border-fits-border p-5">
        <h3 className="text-lg font-semibold text-fits-text mb-3">Sample Session Breakdown</h3>

        {/* Warm Up / FDR */}
        {program.sampleSession.warmUp.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-fits-orange mb-2">Warm-Up / FDR</h4>
            <div className="space-y-3">
              {program.sampleSession.warmUp.map((block, i) => (
                <BlockCard key={i} block={block} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Primary Blocks */}
        {program.sampleSession.primaryBlocks.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-fits-accent mb-2">Primary Blocks</h4>
            <div className="space-y-3">
              {program.sampleSession.primaryBlocks.map((block, i) => (
                <BlockCard key={i} block={block} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Secondary Blocks */}
        {program.sampleSession.secondaryBlocks.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-fits-cyan mb-2">Secondary Blocks</h4>
            <div className="space-y-3">
              {program.sampleSession.secondaryBlocks.map((block, i) => (
                <BlockCard key={i} block={block} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Cool Down */}
        {program.sampleSession.coolDown.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-fits-green mb-2">Cool Down</h4>
            <div className="space-y-3">
              {program.sampleSession.coolDown.map((block, i) => (
                <BlockCard key={i} block={block} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Context Summary */}
      <div className="bg-fits-surface rounded-xl border border-fits-border p-5">
        <h3 className="text-lg font-semibold text-fits-text mb-3">Programming Context</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-fits-surface-2 rounded-lg p-3 text-center">
            <div className="text-xs text-fits-text-dim">Season</div>
            <div className="text-sm font-medium text-fits-text capitalize">{context.season?.replace('_', ' ')}</div>
          </div>
          <div className="bg-fits-surface-2 rounded-lg p-3 text-center">
            <div className="text-xs text-fits-text-dim">Sessions/Week</div>
            <div className="text-sm font-medium text-fits-text">{context.sessionsPerWeek}</div>
          </div>
          <div className="bg-fits-surface-2 rounded-lg p-3 text-center">
            <div className="text-xs text-fits-text-dim">Equipment</div>
            <div className="text-sm font-medium text-fits-text capitalize">{context.equipment?.replace('_', ' ')}</div>
          </div>
          <div className="bg-fits-surface-2 rounded-lg p-3 text-center">
            <div className="text-xs text-fits-text-dim">Fatigue</div>
            <div className={`text-sm font-medium capitalize ${
              context.fatigue === 'high' ? 'text-red-400' : context.fatigue === 'moderate' ? 'text-yellow-400' : 'text-green-400'
            }`}>{context.fatigue}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
