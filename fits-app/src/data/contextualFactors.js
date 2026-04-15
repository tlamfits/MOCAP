// FITS Contextual Factors for Programming

export const SEASON_PHASES = [
  { value: 'off_season', label: 'Off-Season', description: 'Highest training volume tolerance' },
  { value: 'pre_season', label: 'Pre-Season', description: 'Progressive demand escalation' },
  { value: 'in_season', label: 'In-Season', description: 'Volume drops, intensity maintained' },
  { value: 'post_season', label: 'Post-Season / Active Recovery', description: 'Restore quality, address flags' },
  { value: 'tournament', label: 'Tournament Block', description: 'Activation & readiness focus' },
];

export const EQUIPMENT_OPTIONS = [
  { value: 'full_gym', label: 'Full Gym' },
  { value: 'bands_bw', label: 'Bands & Bodyweight Only' },
  { value: 'field_only', label: 'Field Only' },
  { value: 'home', label: 'Home Setup' },
];

export const COACHING_ACCESS = [
  { value: 'coached', label: 'Coached' },
  { value: 'semi_independent', label: 'Semi-Independent' },
  { value: 'independent', label: 'Independent' },
];

export const INJURY_STATUS = [
  { value: 'healthy', label: 'Healthy' },
  { value: 'managing', label: 'Managing' },
  { value: 'returning', label: 'Returning' },
];

export const FATIGUE_LEVELS = [
  { value: 'low', label: 'Low', color: 'fits-green' },
  { value: 'moderate', label: 'Moderate', color: 'fits-yellow' },
  { value: 'high', label: 'High', color: 'fits-red' },
];

export const TRAINING_CONTINUITY = [
  { value: 'consistent', label: 'Consistent' },
  { value: 'short_gap', label: 'Short Gap (1-2 wks)' },
  { value: 'extended_gap', label: 'Extended Gap (3+ wks)' },
];
