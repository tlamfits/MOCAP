import {
  SEASON_PHASES, EQUIPMENT_OPTIONS, COACHING_ACCESS,
  INJURY_STATUS, FATIGUE_LEVELS, TRAINING_CONTINUITY,
} from '../data/contextualFactors';

function SelectGroup({ label, options, value, onChange, columns = 3 }) {
  return (
    <div>
      <label className="block text-sm font-medium text-fits-text-muted mb-2">{label}</label>
      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`py-2.5 px-3 rounded-lg text-sm font-medium text-center transition-all ${
              value === opt.value
                ? 'bg-fits-accent text-white ring-2 ring-fits-accent/50'
                : 'bg-fits-surface-2 text-fits-text-muted hover:bg-fits-surface-3'
            }`}
          >
            <div>{opt.label}</div>
            {opt.description && <div className="text-xs opacity-60 mt-0.5">{opt.description}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, min = 0, max = 20, unit = '' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-fits-text-muted mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          min={min}
          max={max}
          className="w-24 bg-fits-surface-2 border border-fits-border rounded-lg px-3 py-2 text-fits-text text-center focus:outline-none focus:ring-2 focus:ring-fits-accent"
        />
        {unit && <span className="text-sm text-fits-text-dim">{unit}</span>}
      </div>
    </div>
  );
}

export default function ContextualFactors({ context, updateContext }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-fits-text">Contextual Factors</h2>
        <p className="text-fits-text-muted text-sm mt-1">These factors shape programming decisions beyond the Movement System profile.</p>
      </div>

      {/* Season Phase */}
      <div className="bg-fits-surface rounded-xl border border-fits-border p-6 space-y-5">
        <h3 className="text-lg font-semibold text-fits-text">Seasonal Context</h3>
        <SelectGroup
          label="Current Phase"
          options={SEASON_PHASES}
          value={context.season}
          onChange={v => updateContext({ season: v })}
          columns={3}
        />
      </div>

      {/* Workload */}
      <div className="bg-fits-surface rounded-xl border border-fits-border p-6 space-y-5">
        <h3 className="text-lg font-semibold text-fits-text">Workload & Schedule</h3>
        <div className="grid grid-cols-3 gap-4">
          <NumberInput label="Practice Freq" value={context.practiceFreq} onChange={v => updateContext({ practiceFreq: v })} max={14} unit="/week" />
          <NumberInput label="Competition Freq" value={context.competitionFreq} onChange={v => updateContext({ competitionFreq: v })} max={7} unit="/week" />
          <NumberInput label="AD Sessions" value={context.sessionsPerWeek} onChange={v => updateContext({ sessionsPerWeek: v })} max={7} unit="/week" />
        </div>
        <NumberInput label="Training Time" value={context.trainingTime} onChange={v => updateContext({ trainingTime: v })} min={15} max={120} unit="minutes" />
      </div>

      {/* Resources */}
      <div className="bg-fits-surface rounded-xl border border-fits-border p-6 space-y-5">
        <h3 className="text-lg font-semibold text-fits-text">Resources & Constraints</h3>
        <div className="grid grid-cols-2 gap-6">
          <SelectGroup label="Equipment Access" options={EQUIPMENT_OPTIONS} value={context.equipment} onChange={v => updateContext({ equipment: v })} columns={2} />
          <SelectGroup label="Coaching Access" options={COACHING_ACCESS} value={context.coaching} onChange={v => updateContext({ coaching: v })} columns={1} />
        </div>
      </div>

      {/* Readiness */}
      <div className="bg-fits-surface rounded-xl border border-fits-border p-6 space-y-5">
        <h3 className="text-lg font-semibold text-fits-text">Readiness & Monitoring</h3>
        <div className="grid grid-cols-2 gap-6">
          <SelectGroup label="Injury Status" options={INJURY_STATUS} value={context.injuryStatus} onChange={v => updateContext({ injuryStatus: v })} columns={1} />
          <SelectGroup label="Fatigue Status" options={FATIGUE_LEVELS} value={context.fatigue} onChange={v => updateContext({ fatigue: v })} columns={1} />
        </div>
        <SelectGroup label="Training Continuity" options={TRAINING_CONTINUITY} value={context.continuity} onChange={v => updateContext({ continuity: v })} columns={3} />
      </div>
    </div>
  );
}
