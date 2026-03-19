import {
  getDiagnosticQuadrant, PERFORMANCE_LEVELS, QUALITY_SCORES,
  RANGE_JOINTS, CORE_SUPPORT_SYSTEMS, ENGINE_QUALITIES,
  FOUNDATION_MOVEMENTS, SPEED_SKILL_CATEGORIES,
} from '../data/movementSystem';

function QuadrantBadge({ quadrant }) {
  if (!quadrant) return null;
  const colorMap = {
    'fits-green': 'bg-green-500/15 text-green-400 border-green-500/30',
    'fits-red': 'bg-red-500/15 text-red-400 border-red-500/30',
    'fits-accent': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'fits-orange': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorMap[quadrant.color] || ''}`}>
      {quadrant.name}
    </span>
  );
}

function ScoreCell({ value, max = 3, type = 'quality' }) {
  if (!value && value !== 0) return <span className="text-fits-text-dim">—</span>;
  const colors = type === 'quality'
    ? ['', 'text-red-400', 'text-yellow-400', 'text-green-400']
    : ['', 'text-red-400', 'text-yellow-400', 'text-cyan-400', 'text-green-400'];
  return <span className={`font-bold ${colors[value] || 'text-fits-text-dim'}`}>{value}</span>;
}

function BarChart({ value, max, color = 'fits-accent' }) {
  if (!value) return <div className="w-full h-2 bg-fits-surface-3 rounded-full" />;
  const pct = (value / max) * 100;
  const colorMap = {
    'fits-red': 'bg-red-500',
    'fits-yellow': 'bg-yellow-500',
    'fits-green': 'bg-green-500',
    'fits-accent': 'bg-blue-500',
    'fits-cyan': 'bg-cyan-500',
    'fits-orange': 'bg-orange-500',
  };
  return (
    <div className="w-full h-2 bg-fits-surface-3 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${colorMap[color] || 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function RadarPlaceholder({ profile }) {
  // Simple visual representation of the 12-component profile
  const components = [
    { name: 'Range', value: getAvgRange(profile.range), max: 3 },
    { name: 'Core', value: getAvgCoreSupport(profile.coreSupport), max: 3 },
    { name: 'Max Str', value: profile.engine?.max_strength?.pl, max: 4 },
    { name: 'Power', value: profile.engine?.power?.pl, max: 4 },
    { name: 'Speed', value: profile.engine?.speed?.pl, max: 4 },
    { name: 'Reactivity', value: profile.engine?.reactivity?.pl, max: 4 },
    { name: 'Squat', value: profile.foundationMovements?.squat?.pl, max: 4 },
    { name: 'Hinge', value: profile.foundationMovements?.hinge?.pl, max: 4 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {components.map(c => (
        <div key={c.name} className="flex items-center gap-3">
          <div className="w-16 text-xs text-fits-text-muted text-right">{c.name}</div>
          <div className="flex-1">
            <BarChart
              value={c.value}
              max={c.max}
              color={!c.value ? 'fits-red' : c.value <= c.max * 0.33 ? 'fits-red' : c.value <= c.max * 0.66 ? 'fits-yellow' : 'fits-green'}
            />
          </div>
          <div className="w-6 text-xs font-bold text-fits-text">{c.value || '—'}</div>
        </div>
      ))}
    </div>
  );
}

function getAvgRange(range) {
  if (!range) return null;
  const scores = Object.values(range).map(r => r.score).filter(Boolean);
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
}

function getAvgCoreSupport(cs) {
  if (!cs) return null;
  const scores = Object.values(cs).map(c => c.quality).filter(Boolean);
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
}

export default function Dashboard({ profile, context }) {
  const pl = PERFORMANCE_LEVELS.find(p => p.value === profile.performanceLevel);

  // Count diagnostics
  const diagnostics = { target: 0, hidden_risk: 0, engine_gap: 0, foundation_gap: 0, unscored: 0 };
  if (profile.foundationMovements) {
    Object.values(profile.foundationMovements).forEach(fm => {
      if (fm.quality && fm.pl) {
        const q = getDiagnosticQuadrant(fm.quality, fm.pl);
        diagnostics[q.id]++;
      } else {
        diagnostics.unscored++;
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-fits-text">Athlete Dashboard</h2>
        <p className="text-fits-text-muted text-sm mt-1">Movement System Profile overview with diagnostic matrix analysis.</p>
      </div>

      {/* Top Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-fits-surface rounded-xl border border-fits-border p-4 text-center">
          <div className="text-3xl font-bold text-fits-accent">{pl?.label || '—'}</div>
          <div className="text-xs text-fits-text-muted mt-1">Performance Level</div>
        </div>
        <div className="bg-fits-surface rounded-xl border border-fits-border p-4 text-center">
          <div className="text-3xl font-bold text-fits-green">{diagnostics.target}</div>
          <div className="text-xs text-fits-text-muted mt-1">Target Profile</div>
        </div>
        <div className="bg-fits-surface rounded-xl border border-fits-border p-4 text-center">
          <div className="text-3xl font-bold text-fits-red">{diagnostics.hidden_risk}</div>
          <div className="text-xs text-fits-text-muted mt-1">Hidden Risk</div>
        </div>
        <div className="bg-fits-surface rounded-xl border border-fits-border p-4 text-center">
          <div className="text-3xl font-bold text-fits-orange">{diagnostics.engine_gap + diagnostics.foundation_gap}</div>
          <div className="text-xs text-fits-text-muted mt-1">Development Gaps</div>
        </div>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-2 gap-6">
        {/* Component Overview */}
        <div className="bg-fits-surface rounded-xl border border-fits-border p-5">
          <h3 className="text-lg font-semibold text-fits-text mb-4">Component Profile</h3>
          <RadarPlaceholder profile={profile} />
        </div>

        {/* Diagnostic Matrix Visual */}
        <div className="bg-fits-surface rounded-xl border border-fits-border p-5">
          <h3 className="text-lg font-semibold text-fits-text mb-4">Diagnostic Matrix</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-400">{diagnostics.target}</div>
              <div className="text-xs text-green-300/70">Target Profile</div>
              <div className="text-xs text-fits-text-dim mt-1">High Q + High PL</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-red-400">{diagnostics.hidden_risk}</div>
              <div className="text-xs text-red-300/70">Hidden Risk</div>
              <div className="text-xs text-fits-text-dim mt-1">Low Q + High PL</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-400">{diagnostics.engine_gap}</div>
              <div className="text-xs text-blue-300/70">Engine Gap</div>
              <div className="text-xs text-fits-text-dim mt-1">High Q + Low PL</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-orange-400">{diagnostics.foundation_gap}</div>
              <div className="text-xs text-orange-300/70">Foundation Gap</div>
              <div className="text-xs text-fits-text-dim mt-1">Low Q + Low PL</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Sections */}
      {/* Range */}
      <div className="bg-fits-surface rounded-xl border border-fits-border p-5">
        <h3 className="text-lg font-semibold text-fits-text mb-3">Layer 1: Range Assessment</h3>
        <div className="grid grid-cols-2 gap-2">
          {RANGE_JOINTS.map(joint => {
            const scores = [];
            if (joint.bilateral) {
              const l = profile.range?.[`${joint.id}_L`];
              const r = profile.range?.[`${joint.id}_R`];
              scores.push({ side: 'L', score: l?.score });
              scores.push({ side: 'R', score: r?.score });
            } else {
              scores.push({ side: '', score: profile.range?.[joint.id]?.score });
            }
            return (
              <div key={joint.id} className="flex items-center justify-between bg-fits-surface-2 rounded-lg px-3 py-2">
                <span className="text-sm text-fits-text-muted">{joint.name}</span>
                <div className="flex gap-2">
                  {scores.map((s, i) => (
                    <div key={i} className="flex items-center gap-1">
                      {s.side && <span className="text-xs text-fits-text-dim">{s.side}:</span>}
                      <ScoreCell value={s.score} max={3} type="quality" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Foundation Movements */}
      <div className="bg-fits-surface rounded-xl border border-fits-border p-5">
        <h3 className="text-lg font-semibold text-fits-text mb-3">Layer 3: Foundation Movements</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fits-border">
                <th className="text-left py-2 text-fits-text-muted font-medium">Pattern</th>
                <th className="text-center py-2 text-fits-text-muted font-medium">Quality</th>
                <th className="text-center py-2 text-fits-text-muted font-medium">Perf Level</th>
                <th className="text-center py-2 text-fits-text-muted font-medium">Diagnostic</th>
              </tr>
            </thead>
            <tbody>
              {FOUNDATION_MOVEMENTS.map(move => {
                const fm = profile.foundationMovements?.[move.id];
                const quad = fm?.quality && fm?.pl ? getDiagnosticQuadrant(fm.quality, fm.pl) : null;
                return (
                  <tr key={move.id} className="border-b border-fits-border/50">
                    <td className="py-2 text-fits-text">{move.name}</td>
                    <td className="py-2 text-center"><ScoreCell value={fm?.quality} type="quality" /></td>
                    <td className="py-2 text-center"><ScoreCell value={fm?.pl} max={4} type="pl" /></td>
                    <td className="py-2 text-center"><QuadrantBadge quadrant={quad} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Engine */}
      <div className="bg-fits-surface rounded-xl border border-fits-border p-5">
        <h3 className="text-lg font-semibold text-fits-text mb-3">Layer 1: Engine Profile</h3>
        <div className="grid grid-cols-3 gap-3">
          {ENGINE_QUALITIES.map(eq => {
            const val = profile.engine?.[eq.id]?.pl;
            return (
              <div key={eq.id} className="bg-fits-surface-2 rounded-lg p-3 text-center">
                <div className="text-xs text-fits-text-dim mb-1">{eq.name}</div>
                <div className={`text-2xl font-bold ${
                  !val ? 'text-fits-text-dim' : val <= 1 ? 'text-red-400' : val <= 2 ? 'text-yellow-400' : val <= 3 ? 'text-cyan-400' : 'text-green-400'
                }`}>
                  {val || '—'}
                </div>
                <BarChart value={val} max={4} color={!val ? 'fits-red' : val <= 1 ? 'fits-red' : val <= 2 ? 'fits-yellow' : 'fits-green'} />
              </div>
            );
          })}
        </div>
      </div>

      {/* CMDs */}
      {profile.cmds?.length > 0 && (
        <div className="bg-fits-surface rounded-xl border border-red-500/20 p-5">
          <h3 className="text-lg font-semibold text-fits-red mb-3">Active CMDs ({profile.cmds.length})</h3>
          <div className="grid grid-cols-2 gap-2">
            {profile.cmds.map((cmd, i) => (
              <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                cmd.severity === -3 ? 'bg-red-500/10' : cmd.severity === -2 ? 'bg-orange-500/10' : 'bg-yellow-500/10'
              }`}>
                <span className="text-sm text-fits-text">{cmd.joint}: {cmd.cmd}</span>
                <span className={`text-xs font-bold ${
                  cmd.severity === -3 ? 'text-red-400' : cmd.severity === -2 ? 'text-orange-400' : 'text-yellow-400'
                }`}>
                  Severity {cmd.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
