// FITS Movement System Data Models

export const PERFORMANCE_LEVELS = [
  { value: 1, label: 'Dev I', description: 'Recreational / New Athletes' },
  { value: 2, label: 'Dev II', description: 'Club-Level' },
  { value: 3, label: 'HP', description: 'Provincial / State / Collegiate' },
  { value: 4, label: 'Elite', description: 'National / International' },
];

export const QUALITY_SCORES = [
  { value: 1, label: 'Development', description: '<50% principles', color: 'fits-red' },
  { value: 2, label: 'Competent', description: '50-75% principles', color: 'fits-yellow' },
  { value: 3, label: 'Advanced', description: '>75% principles', color: 'fits-green' },
];

export const RANGE_SCORES = [
  { value: 1, label: 'Severe Limitation', color: 'fits-red' },
  { value: 2, label: 'Mild Limitation', color: 'fits-yellow' },
  { value: 3, label: 'Ideal', color: 'fits-green' },
];

// Range Joint Systems
export const RANGE_JOINTS = [
  { id: 'ankle_df', name: 'Ankle Dorsiflexion', bilateral: true },
  { id: 'hip_ir', name: 'Hip Internal Rotation', bilateral: true },
  { id: 'hip_er', name: 'Hip External Rotation', bilateral: true },
  { id: 'hip_flexion', name: 'Hip Flexion Depth', bilateral: false },
  { id: 'thoracic_rotation', name: 'Thoracic Rotation', bilateral: true },
  { id: 'shoulder_flexion', name: 'Shoulder Flexion', bilateral: true },
  { id: 'shoulder_er', name: 'Shoulder External Rotation', bilateral: true },
];

// Core Support - 5 Joint System Composites (simplified for prototype)
export const CORE_SUPPORT_SYSTEMS = [
  {
    id: 'hip', name: 'Hip', icon: '🦴',
    qualities: [
      'Extension Control', 'Abduction Control', 'Hinge Control',
      'Integrated Rotation Control', 'Adduction Control', 'Hip Flexor Length Control'
    ]
  },
  {
    id: 'knee', name: 'Knee', icon: '🦵',
    qualities: ['Integrated Knee Stability']
  },
  {
    id: 'ankle_foot', name: 'Ankle & Foot', icon: '🦶',
    qualities: ['Arch Control', 'Toe Control & Big Toe Pressure']
  },
  {
    id: 'shoulder', name: 'Shoulder', icon: '💪',
    qualities: ['GH Centration', 'Scapular Control', 'Trunk-Scapular Linkage']
  },
  {
    id: 'trunk', name: 'Trunk', icon: '🏋️',
    qualities: [
      'Integrated Canister Control', 'Integrated Neutral Spine Control',
      'Integrated Rotation Control', 'Trunk Flexion Control',
      'Trunk Extension Control', 'Trunk Lateral Flexion Control'
    ]
  },
];

// Engine Qualities
export const ENGINE_QUALITIES = [
  { id: 'max_strength', name: 'Maximum Strength', icon: '⚡', description: 'Peak force production capacity' },
  { id: 'power', name: 'Power', icon: '💥', description: 'Force × velocity output (CMJ, SJ, med ball)' },
  { id: 'speed', name: 'Speed', icon: '🏃', description: 'Sprint testing, bar speed' },
  { id: 'psi', name: 'Position-Specific Isometric', icon: '🎯', description: 'ISO at specific joint angles' },
  { id: 'eccentric', name: 'Eccentric Control', icon: '🛑', description: 'Deceleration quality' },
  { id: 'reactivity', name: 'Reactivity', icon: '⚡', description: 'RSI, drop jump' },
];

// Foundation Movements
export const FOUNDATION_MOVEMENTS = [
  { id: 'squat', name: 'Squat', icon: '🏋️' },
  { id: 'oh_squat', name: 'Overhead Squat', icon: '🙌' },
  { id: 'lateral_squat', name: 'Lateral Squat', icon: '↔️' },
  { id: 'sl_squat', name: 'Single-Leg Squat', icon: '🦩', bilateral: true },
  { id: 'hinge', name: 'Hinge', icon: '🔄' },
  { id: 'lunge', name: 'Lunge / Split Stance', icon: '🚶', bilateral: true },
  { id: 'push_up', name: 'Push-Up', icon: '👐' },
  { id: 'pull_up', name: 'Pull-Up', icon: '💪' },
];

// Speed Skill Categories (simplified for prototype)
export const SPEED_SKILL_CATEGORIES = [
  {
    id: 'cat_a', name: 'Cat A: Absorption & Control',
    skills: [
      { id: 'landing', name: 'Landing', tiered: true },
      { id: 'lap', name: 'Low Amplitude Plyo (LAP)' },
      { id: 'lprf', name: 'Low Position Reactive Feet (LPRF)' },
      { id: 'tbj', name: 'Triple Broad Jump' },
      { id: 'triple_hop', name: 'Triple Hop' },
      { id: 'lat_hop_single', name: 'Lateral Hop Single' },
      { id: 'deceleration', name: 'Deceleration', tiered: true },
    ]
  },
  {
    id: 'cat_b', name: 'Cat B: Rhythmic / Elastic',
    skills: [
      { id: 'skipping', name: 'Skipping' },
    ]
  },
  {
    id: 'cat_c', name: 'Cat C: Reactive / Elastic',
    skills: [
      { id: 'pogo', name: 'Reactive Jump / Pogo' },
      { id: 'triple_hop_reactive', name: 'Triple Hop Reactive' },
      { id: 'lat_hop_reactive', name: 'Lateral Hop Reactive' },
      { id: 'bounding', name: 'Bounding' },
      { id: 'sl_bounding', name: 'Single-Leg Bounding' },
    ]
  },
  {
    id: 'cat_d', name: 'Cat D: Projection / Sprint',
    skills: [
      { id: 'horizontal_impulse', name: 'Horizontal Impulse SL' },
      { id: 'accel_3step', name: 'Acceleration First 3 Steps', tiered: true },
      { id: 'drive_phase', name: 'Drive Phase' },
      { id: 'max_velocity', name: 'Max Velocity Running' },
    ]
  },
  {
    id: 'cat_e', name: 'Cat E: Redirection / Multi-Directional',
    skills: [
      { id: 'cod', name: 'Speed Patterns COD', tiered: true },
    ]
  },
];

// CMD Joint Systems
export const CMD_JOINT_SYSTEMS = [
  { id: 'ankle', name: 'Ankle', cmds: ['Overpronation', 'Poor Dorsiflexion', 'Sloppy Rooting'] },
  { id: 'knee', name: 'Knee', cmds: ['Dynamic Valgus', 'Poor Tracking', 'Poor Shin Angles'] },
  { id: 'hip', name: 'Hip', cmds: ['Anterior Tilt', 'Weak Glutes', 'Hip Shift', 'Pelvic Rotation'] },
  { id: 'trunk', name: 'Trunk', cmds: ['Rounded Low Back', 'Rib Flare', 'Poor Core Integration', 'Butt Wink'] },
  { id: 'shoulder', name: 'Shoulder', cmds: ['GH Instability', 'Scapular Winging', 'Poor Centration', 'Thoracic Collapse'] },
];

export const CMD_SEVERITIES = [
  { value: -1, label: 'Mild', color: 'fits-yellow' },
  { value: -2, label: 'Moderate', color: 'fits-orange' },
  { value: -3, label: 'Severe', color: 'fits-red' },
];

// Diagnostic Matrix Logic
export function getDiagnosticQuadrant(quality, performanceLevel) {
  const highQ = quality >= 2;
  const highPL = performanceLevel >= 3;
  if (highQ && highPL) return { id: 'target', name: 'Target Profile', color: 'fits-green', action: 'Maintain quality, progress demands' };
  if (!highQ && highPL) return { id: 'hidden_risk', name: 'Hidden Risk', color: 'fits-red', action: 'Address quality FIRST — highest injury risk' };
  if (highQ && !highPL) return { id: 'engine_gap', name: 'Engine Gap', color: 'fits-accent', action: 'Build hardware capacity within quality framework' };
  return { id: 'foundation_gap', name: 'Foundation Gap', color: 'fits-orange', action: 'Address hardware + software together' };
}

// Sports list for selection
export const SPORTS = [
  'Volleyball', 'Basketball', 'Soccer', 'Football', 'Hockey', 'Baseball',
  'Tennis', 'Swimming', 'Track & Field', 'Lacrosse', 'Rugby', 'Softball',
  'Wrestling', 'Gymnastics', 'Figure Skating', 'Other'
];

export const MATURATION_STATUS = [
  { value: 'pre_phv', label: 'Pre-PHV' },
  { value: 'circa_phv', label: 'Circa-PHV' },
  { value: 'post_phv', label: 'Post-PHV' },
  { value: 'mature', label: 'Mature' },
];
