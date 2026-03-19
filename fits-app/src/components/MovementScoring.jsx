import { useState } from 'react';
import {
  RANGE_JOINTS, RANGE_SCORES,
  CORE_SUPPORT_SYSTEMS, QUALITY_SCORES,
  ENGINE_QUALITIES, PERFORMANCE_LEVELS,
  FOUNDATION_MOVEMENTS,
  SPEED_SKILL_CATEGORIES,
  CMD_JOINT_SYSTEMS, CMD_SEVERITIES,
} from '../data/movementSystem';

const TABS = [
  { id: 'range', label: 'Range', icon: '🔄' },
  { id: 'core', label: 'Core Support', icon: '🏋️' },
  { id: 'engine', label: 'Engine', icon: '⚡' },
  { id: 'foundation', label: 'Foundation', icon: '🦵' },
  { id: 'speed', label: 'Speed Skills', icon: '🏃' },
  { id: 'cmd', label: 'CMDs', icon: '⚠️' },
];

function ScoreButton({ value, label, color, isActive, onClick, size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm';
  const colorMap = {
    'fits-red': 'bg-fits-red/20 text-fits-red ring-fits-red',
    'fits-yellow': 'bg-fits-yellow/20 text-fits-yellow ring-fits-yellow',
    'fits-green': 'bg-fits-green/20 text-fits-green ring-fits-green',
    'fits-orange': 'bg-fits-orange/20 text-fits-orange ring-fits-orange',
    'fits-accent': 'bg-fits-accent/20 text-fits-accent ring-fits-accent',
    'fits-cyan': 'bg-fits-cyan/20 text-fits-cyan ring-fits-cyan',
    'fits-purple': 'bg-fits-purple/20 text-fits-purple ring-fits-purple',
  };

  return (
    <button
      onClick={onClick}
      title={label}
      className={`${sizeClasses} rounded-lg font-bold flex items-center justify-center transition-all ${
        isActive
          ? `${colorMap[color] || 'bg-fits-accent/20 text-fits-accent ring-fits-accent'} ring-2 scale-110`
          : 'bg-fits-surface-2 text-fits-text-dim hover:bg-fits-surface-3'
      }`}
    >
      {value}
    </button>
  );
}

function RangeSection({ profile, updateProfile }) {
  const range = profile.range || {};

  const setScore = (jointId, side, score) => {
    const key = side ? `${jointId}_${side}` : jointId;
    updateProfile({
      range: { ...range, [key]: { score, name: RANGE_JOINTS.find(j => j.id === jointId)?.name || jointId } }
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-fits-text-muted">Range is scored 1-3 (prerequisite scale). This is a Layer 1 hardware assessment.</p>
      {RANGE_JOINTS.map(joint => (
        <div key={joint.id} className="bg-fits-surface-2 rounded-lg p-4 flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-fits-text">{joint.name}</div>
            {joint.bilateral && <div className="text-xs text-fits-text-dim">Bilateral</div>}
          </div>
          <div className="flex gap-4">
            {joint.bilateral ? (
              <>
                <div className="text-center">
                  <div className="text-xs text-fits-text-dim mb-1">Left</div>
                  <div className="flex gap-1">
                    {RANGE_SCORES.map(s => (
                      <ScoreButton
                        key={s.value}
                        value={s.value}
                        label={s.label}
                        color={s.color}
                        size="sm"
                        isActive={range[`${joint.id}_L`]?.score === s.value}
                        onClick={() => setScore(joint.id, 'L', s.value)}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-fits-text-dim mb-1">Right</div>
                  <div className="flex gap-1">
                    {RANGE_SCORES.map(s => (
                      <ScoreButton
                        key={s.value}
                        value={s.value}
                        label={s.label}
                        color={s.color}
                        size="sm"
                        isActive={range[`${joint.id}_R`]?.score === s.value}
                        onClick={() => setScore(joint.id, 'R', s.value)}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex gap-1">
                {RANGE_SCORES.map(s => (
                  <ScoreButton
                    key={s.value}
                    value={s.value}
                    label={s.label}
                    color={s.color}
                    isActive={range[joint.id]?.score === s.value}
                    onClick={() => setScore(joint.id, null, s.value)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CoreSupportSection({ profile, updateProfile }) {
  const cs = profile.coreSupport || {};

  const setScore = (systemId, score) => {
    const sys = CORE_SUPPORT_SYSTEMS.find(s => s.id === systemId);
    updateProfile({
      coreSupport: { ...cs, [systemId]: { quality: score, name: sys?.name || systemId } }
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-fits-text-muted">Core Support Quality scored by joint system composite (MOQ 1-3). Simplified for prototype — full version scores all 18 individual CSQs.</p>
      {CORE_SUPPORT_SYSTEMS.map(sys => (
        <div key={sys.id} className="bg-fits-surface-2 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-fits-text">{sys.name}</div>
              <div className="text-xs text-fits-text-dim mt-0.5">
                {sys.qualities.length} qualities: {sys.qualities.join(', ')}
              </div>
            </div>
            <div className="flex gap-1.5">
              {QUALITY_SCORES.map(q => (
                <ScoreButton
                  key={q.value}
                  value={q.value}
                  label={q.label}
                  color={q.color}
                  isActive={cs[sys.id]?.quality === q.value}
                  onClick={() => setScore(sys.id, q.value)}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EngineSection({ profile, updateProfile }) {
  const engine = profile.engine || {};

  const setScore = (qualityId, pl) => {
    const eq = ENGINE_QUALITIES.find(q => q.id === qualityId);
    updateProfile({
      engine: { ...engine, [qualityId]: { pl, name: eq?.name || qualityId } }
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-fits-text-muted">Engine Qualities scored by Performance Level (1-4). These represent force production capacities.</p>
      {ENGINE_QUALITIES.map(eq => (
        <div key={eq.id} className="bg-fits-surface-2 rounded-lg p-4 flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-fits-text">{eq.name}</div>
            <div className="text-xs text-fits-text-dim">{eq.description}</div>
          </div>
          <div className="flex gap-1.5">
            {PERFORMANCE_LEVELS.map(pl => (
              <ScoreButton
                key={pl.value}
                value={pl.value}
                label={pl.label}
                color={pl.value <= 1 ? 'fits-red' : pl.value <= 2 ? 'fits-yellow' : pl.value <= 3 ? 'fits-cyan' : 'fits-green'}
                isActive={engine[eq.id]?.pl === pl.value}
                onClick={() => setScore(eq.id, pl.value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FoundationSection({ profile, updateProfile }) {
  const fm = profile.foundationMovements || {};

  const setScore = (moveId, field, value) => {
    const move = FOUNDATION_MOVEMENTS.find(m => m.id === moveId);
    updateProfile({
      foundationMovements: {
        ...fm,
        [moveId]: { ...fm[moveId], [field]: value, name: move?.name || moveId }
      }
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-fits-text-muted">Foundation Movements scored on dual dimensions: Quality (MOQ 1-3) and Performance Level (1-4).</p>
      {FOUNDATION_MOVEMENTS.map(move => (
        <div key={move.id} className="bg-fits-surface-2 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-fits-text">{move.name}</div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-xs text-fits-text-dim mb-1">Quality</div>
                <div className="flex gap-1">
                  {QUALITY_SCORES.map(q => (
                    <ScoreButton
                      key={q.value}
                      value={q.value}
                      label={q.label}
                      color={q.color}
                      size="sm"
                      isActive={fm[move.id]?.quality === q.value}
                      onClick={() => setScore(move.id, 'quality', q.value)}
                    />
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-fits-text-dim mb-1">Perf Level</div>
                <div className="flex gap-1">
                  {PERFORMANCE_LEVELS.map(pl => (
                    <ScoreButton
                      key={pl.value}
                      value={pl.value}
                      label={pl.label}
                      color={pl.value <= 1 ? 'fits-red' : pl.value <= 2 ? 'fits-yellow' : pl.value <= 3 ? 'fits-cyan' : 'fits-green'}
                      size="sm"
                      isActive={fm[move.id]?.pl === pl.value}
                      onClick={() => setScore(move.id, 'pl', pl.value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SpeedSkillsSection({ profile, updateProfile }) {
  const ss = profile.speedSkills || {};

  const setScore = (skillId, field, value) => {
    updateProfile({
      speedSkills: {
        ...ss,
        [skillId]: { ...ss[skillId], [field]: value }
      }
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-fits-text-muted">Speed Skills scored by category. Quality (MOQ 1-3) and Performance Level (1-4).</p>
      {SPEED_SKILL_CATEGORIES.map(cat => (
        <div key={cat.id}>
          <h4 className="text-sm font-semibold text-fits-accent mb-2">{cat.name}</h4>
          <div className="space-y-2">
            {cat.skills.map(skill => (
              <div key={skill.id} className="bg-fits-surface-2 rounded-lg p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-fits-text">{skill.name}</div>
                  {skill.tiered && <div className="text-xs text-fits-purple">Tiered (3 levels)</div>}
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-xs text-fits-text-dim mb-1">Q</div>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(v => (
                        <ScoreButton
                          key={v} value={v} size="sm"
                          color={v === 1 ? 'fits-red' : v === 2 ? 'fits-yellow' : 'fits-green'}
                          isActive={ss[skill.id]?.quality === v}
                          onClick={() => setScore(skill.id, 'quality', v)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-fits-text-dim mb-1">PL</div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(v => (
                        <ScoreButton
                          key={v} value={v} size="sm"
                          color={v <= 1 ? 'fits-red' : v <= 2 ? 'fits-yellow' : v <= 3 ? 'fits-cyan' : 'fits-green'}
                          isActive={ss[skill.id]?.pl === v}
                          onClick={() => setScore(skill.id, 'pl', v)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CMDSection({ profile, updateProfile }) {
  const cmds = profile.cmds || [];

  const addCMD = (joint, cmd, severity) => {
    const existing = cmds.find(c => c.joint === joint && c.cmd === cmd);
    if (existing) {
      updateProfile({
        cmds: cmds.map(c => c.joint === joint && c.cmd === cmd ? { ...c, severity } : c)
      });
    } else {
      updateProfile({ cmds: [...cmds, { joint, cmd, severity }] });
    }
  };

  const removeCMD = (joint, cmd) => {
    updateProfile({ cmds: cmds.filter(c => !(c.joint === joint && c.cmd === cmd)) });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-fits-text-muted">Flag Common Movement Dysfunctions observed during assessment. Each CMD is tracked by joint system and severity.</p>

      {/* Active CMDs */}
      {cmds.length > 0 && (
        <div className="bg-fits-surface-2 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-fits-orange mb-2">Active CMDs ({cmds.length})</h4>
          <div className="flex flex-wrap gap-2">
            {cmds.map((c, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                c.severity === -3 ? 'bg-fits-red/20 text-fits-red' :
                c.severity === -2 ? 'bg-fits-orange/20 text-fits-orange' :
                'bg-fits-yellow/20 text-fits-yellow'
              }`}>
                <span>{c.joint}: {c.cmd}</span>
                <span className="opacity-60">({c.severity})</span>
                <button onClick={() => removeCMD(c.joint, c.cmd)} className="hover:text-white">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add CMDs */}
      {CMD_JOINT_SYSTEMS.map(joint => (
        <div key={joint.id} className="bg-fits-surface-2 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-fits-text mb-2">{joint.name}</h4>
          <div className="space-y-2">
            {joint.cmds.map(cmd => {
              const active = cmds.find(c => c.joint === joint.name && c.cmd === cmd);
              return (
                <div key={cmd} className="flex items-center justify-between">
                  <span className="text-sm text-fits-text-muted">{cmd}</span>
                  <div className="flex gap-1">
                    {CMD_SEVERITIES.map(sev => (
                      <button
                        key={sev.value}
                        onClick={() => active?.severity === sev.value ? removeCMD(joint.name, cmd) : addCMD(joint.name, cmd, sev.value)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          active?.severity === sev.value
                            ? `bg-${sev.color}/30 text-${sev.color} ring-1 ring-${sev.color}`
                            : 'bg-fits-surface-3 text-fits-text-dim hover:bg-fits-surface'
                        }`}
                      >
                        {sev.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MovementScoring({ profile, updateProfile }) {
  const [activeTab, setActiveTab] = useState('range');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-fits-text">Movement System Scoring</h2>
        <p className="text-fits-text-muted text-sm mt-1">Score each component across the Movement System layers.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-fits-accent text-white'
                : 'bg-fits-surface text-fits-text-dim hover:bg-fits-surface-2'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-fits-surface rounded-xl border border-fits-border p-5">
        {activeTab === 'range' && <RangeSection profile={profile} updateProfile={updateProfile} />}
        {activeTab === 'core' && <CoreSupportSection profile={profile} updateProfile={updateProfile} />}
        {activeTab === 'engine' && <EngineSection profile={profile} updateProfile={updateProfile} />}
        {activeTab === 'foundation' && <FoundationSection profile={profile} updateProfile={updateProfile} />}
        {activeTab === 'speed' && <SpeedSkillsSection profile={profile} updateProfile={updateProfile} />}
        {activeTab === 'cmd' && <CMDSection profile={profile} updateProfile={updateProfile} />}
      </div>
    </div>
  );
}
