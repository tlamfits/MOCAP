// FITS Program Generation Logic
import { getDiagnosticQuadrant } from './movementSystem';

// Determine priority areas from the profile
export function analyzePriorities(profile) {
  const priorities = [];

  // Check Foundation Movements
  if (profile.foundationMovements) {
    Object.entries(profile.foundationMovements).forEach(([id, scores]) => {
      if (scores.quality && scores.pl) {
        const quad = getDiagnosticQuadrant(scores.quality, scores.pl);
        if (quad.id !== 'target') {
          priorities.push({
            component: id,
            layer: 'Foundation Movement',
            name: scores.name || id,
            quality: scores.quality,
            pl: scores.pl,
            quadrant: quad,
            priority: quad.id === 'hidden_risk' ? 1 : quad.id === 'foundation_gap' ? 2 : 3,
          });
        }
      }
    });
  }

  // Check Engine
  if (profile.engine) {
    Object.entries(profile.engine).forEach(([id, scores]) => {
      if (scores.pl) {
        const pl = scores.pl;
        if (pl <= 2) {
          priorities.push({
            component: id,
            layer: 'Engine',
            name: scores.name || id,
            pl,
            quadrant: { id: 'engine_gap', name: 'Engine Gap', color: 'fits-accent' },
            priority: 3,
          });
        }
      }
    });
  }

  // Check Range
  if (profile.range) {
    Object.entries(profile.range).forEach(([id, scores]) => {
      if (scores.score && scores.score <= 2) {
        priorities.push({
          component: id,
          layer: 'Range',
          name: scores.name || id,
          score: scores.score,
          quadrant: { id: 'foundation_gap', name: 'Range Limitation', color: 'fits-orange' },
          priority: scores.score === 1 ? 1 : 2,
        });
      }
    });
  }

  // Check Core Support
  if (profile.coreSupport) {
    Object.entries(profile.coreSupport).forEach(([id, scores]) => {
      if (scores.quality && scores.quality <= 1) {
        priorities.push({
          component: id,
          layer: 'Core Support',
          name: scores.name || id,
          quality: scores.quality,
          quadrant: { id: 'foundation_gap', name: 'CSQ Deficit', color: 'fits-orange' },
          priority: 2,
        });
      }
    });
  }

  // Sort by priority
  return priorities.sort((a, b) => a.priority - b.priority);
}

// Generate session structure based on PL and priorities
export function generateSessionStructure(athletePL, priorities, context) {
  const session = {
    warmUp: [],
    primaryBlocks: [],
    secondaryBlocks: [],
    coolDown: [],
  };

  const hasRangeIssues = priorities.some(p => p.layer === 'Range');
  const hasCSQIssues = priorities.some(p => p.layer === 'Core Support');
  const hasFoundationIssues = priorities.some(p => p.layer === 'Foundation Movement');
  const hasEngineGaps = priorities.some(p => p.layer === 'Engine');
  const hasHiddenRisk = priorities.some(p => p.quadrant.id === 'hidden_risk');

  // FDR Block (always present)
  const fdrBlock = {
    name: 'Foundation Development Routine (FDR)',
    type: 'foundation',
    phases: [],
  };

  // Activate phase
  fdrBlock.phases.push({
    name: 'A — Activate',
    exercises: [],
    description: 'Sensory awakening, joint prep, core activation',
  });
  if (hasRangeIssues) {
    fdrBlock.phases[0].exercises.push('Range mobility work for flagged joints');
  }
  fdrBlock.phases[0].exercises.push('Core activation sequence (canister breathing, glute bridges)');
  fdrBlock.phases[0].exercises.push('Ankle rooting / foot prep');

  // Challenge phase
  fdrBlock.phases.push({
    name: 'B — Challenge',
    exercises: [],
    description: 'Loaded patterns targeting CSQ priorities',
  });
  if (hasCSQIssues) {
    const csqPriorities = priorities.filter(p => p.layer === 'Core Support');
    csqPriorities.forEach(p => {
      fdrBlock.phases[1].exercises.push(`${p.name} — targeted CSQ challenge exercise`);
    });
  }
  fdrBlock.phases[1].exercises.push('Single-leg stability challenge');
  fdrBlock.phases[1].exercises.push('Anti-rotation / anti-extension core work');

  // Bring It phase
  fdrBlock.phases.push({
    name: 'C — Bring It',
    exercises: [],
    description: 'Integration under higher demand',
  });
  fdrBlock.phases[1].exercises.push('Foundation pattern integration at tempo');

  session.warmUp.push(fdrBlock);

  // Primary Blocks based on PL and priorities
  if (hasHiddenRisk) {
    // Hidden Risk = quality restoration is #1
    session.primaryBlocks.push({
      name: 'Quality Restoration Block',
      type: 'foundation',
      description: 'Address movement quality deficits before progressing demands',
      exercises: priorities.filter(p => p.quadrant.id === 'hidden_risk').map(p =>
        `${p.name} — controlled tempo, quality focus, reduced load`
      ),
    });
  }

  if (athletePL <= 2) {
    // Dev I/II: Foundation-heavy programming
    if (hasFoundationIssues) {
      session.primaryBlocks.push({
        name: 'Foundation Complex (FC)',
        type: 'foundation',
        description: 'Build movement literacy and base strength',
        exercises: [
          'FC.(T) Technical — foundation pattern work with coaching focus',
          'FC.(G) General Strength — loaded foundation patterns',
          ...(athletePL >= 2 ? ['FC.(A) Max Strength introduction'] : []),
        ],
      });
    }

    // Speed Skills (parallel track at all levels)
    session.secondaryBlocks.push({
      name: 'Foundation Speed (F.SPD)',
      type: 'speed',
      description: 'Speed skill development — absorption and elastic foundations',
      exercises: [
        'F.SPD A — Landing progressions',
        'F.SPD B — Low amplitude plyometrics',
        ...(athletePL >= 2 ? ['F.SPD C — Skipping and bounding intro'] : []),
      ],
    });
  } else {
    // HP/Elite: Engine and Speed emphasis
    if (hasEngineGaps) {
      const enginePriorities = priorities.filter(p => p.layer === 'Engine');
      session.primaryBlocks.push({
        name: 'Engine Development Complex',
        type: 'engine',
        description: 'Amplify engine qualities through complex system',
        exercises: enginePriorities.map(p =>
          `${p.name} — potentiation complex targeting PL ${p.pl} → ${p.pl + 1}`
        ),
      });
    }

    session.primaryBlocks.push({
      name: 'Potentiation Complex',
      type: 'engine',
      description: 'Strength primes speed — potentiation pairing',
      exercises: [
        'A:III — Max Strength potentiates Power',
        'C:III — Power Series',
        ...(athletePL >= 4 ? ['E:II — Eccentric potentiates Reactive'] : []),
      ],
    });

    session.secondaryBlocks.push({
      name: 'Flight Complex',
      type: 'speed',
      description: 'Sport-speed integration',
      exercises: [
        'Flight Power — engine + speed skill pairing',
        ...(athletePL >= 4 ? ['Flight Reactive — reactive speed under sport demands'] : []),
      ],
    });
  }

  // Adjust for season context
  if (context?.season === 'in_season' || context?.season === 'tournament') {
    session.primaryBlocks = session.primaryBlocks.slice(0, 1);
    session.secondaryBlocks = session.secondaryBlocks.slice(0, 1);
  }

  // Cool down
  session.coolDown.push({
    name: 'Recovery & Range',
    type: 'recovery',
    exercises: [
      'Targeted range work for session-loaded joints',
      'Breathing / parasympathetic down-regulation',
    ],
  });

  return session;
}

// Generate weekly structure
export function generateWeeklyStructure(athletePL, priorities, context) {
  const sessionsPerWeek = context?.sessionsPerWeek || (athletePL <= 2 ? 3 : 4);
  const season = context?.season || 'off_season';

  const week = [];

  if (athletePL <= 1) {
    // Dev I: 3 sessions, all foundation-focused
    week.push({ day: 'Day 1', focus: 'FDR Full + Foundation Speed A/B', type: 'foundation' });
    week.push({ day: 'Day 2', focus: 'FDR Full + Foundation Complex (T)', type: 'foundation' });
    week.push({ day: 'Day 3', focus: 'FDR Full + Foundation Speed C', type: 'speed' });
  } else if (athletePL <= 2) {
    // Dev II: 3-4 sessions, foundation + engine intro
    week.push({ day: 'Day 1', focus: 'FDR + FC.(G) General Strength', type: 'strength' });
    week.push({ day: 'Day 2', focus: 'FDR + Speed Skills + Decel/Accel', type: 'speed' });
    week.push({ day: 'Day 3', focus: 'FDR + FC.(A) Max Strength + FC.(E) Eccentric', type: 'strength' });
    if (sessionsPerWeek >= 4) {
      week.push({ day: 'Day 4', focus: 'FDR + Speed Patterns + Flight Speed', type: 'speed' });
    }
  } else {
    // HP/Elite: 4-5 sessions, full complex system
    week.push({ day: 'Day 1', focus: 'SPD Set-Up + Flight Complex + Engine III+', type: 'speed_strength', intensity: 'HIGH' });
    week.push({ day: 'Day 2', focus: 'FDR + Foundation Development + ESD', type: 'foundation', intensity: 'LOW' });
    week.push({ day: 'Day 3', focus: 'Potentiation Complex + Sport Speed', type: 'power', intensity: 'HIGH' });
    week.push({ day: 'Day 4', focus: 'FDR + Accessory + Recovery', type: 'recovery', intensity: 'LOW' });
    if (sessionsPerWeek >= 5) {
      week.push({ day: 'Day 5', focus: 'Competition Prep / Sport Speed Expression', type: 'sport_speed', intensity: 'MODERATE' });
    }
  }

  // In-season modification
  if (season === 'in_season') {
    return week.slice(0, Math.min(sessionsPerWeek, 3)).map(d => ({
      ...d,
      focus: d.focus + ' (reduced volume)',
    }));
  }

  return week.slice(0, sessionsPerWeek);
}

// Generate program summary
export function generateProgramSummary(profile, context) {
  const athletePL = profile.performanceLevel || 1;
  const priorities = analyzePriorities(profile);
  const session = generateSessionStructure(athletePL, priorities, context);
  const week = generateWeeklyStructure(athletePL, priorities, context);

  return {
    athleteName: profile.name || 'Athlete',
    performanceLevel: athletePL,
    priorities,
    sampleSession: session,
    weeklyStructure: week,
    keyRecommendations: generateRecommendations(priorities, athletePL, context),
  };
}

function generateRecommendations(priorities, athletePL, context) {
  const recs = [];

  const hiddenRisks = priorities.filter(p => p.quadrant.id === 'hidden_risk');
  if (hiddenRisks.length > 0) {
    recs.push({
      priority: 'CRITICAL',
      text: `Hidden Risk detected in ${hiddenRisks.map(p => p.name).join(', ')}. Address movement quality before increasing demands. This is the highest injury risk profile.`,
      color: 'fits-red',
    });
  }

  const foundationGaps = priorities.filter(p => p.quadrant.id === 'foundation_gap');
  if (foundationGaps.length > 0) {
    recs.push({
      priority: 'HIGH',
      text: `Foundation Gaps in ${foundationGaps.map(p => p.name).join(', ')}. Develop hardware and coordination together through FDR and Development Series work.`,
      color: 'fits-orange',
    });
  }

  const engineGaps = priorities.filter(p => p.quadrant.id === 'engine_gap' || p.layer === 'Engine');
  if (engineGaps.length > 0) {
    recs.push({
      priority: 'MODERATE',
      text: `Engine Gaps in ${engineGaps.map(p => p.name).join(', ')}. Quality is clean — prioritize engine development through progressive loading.`,
      color: 'fits-accent',
    });
  }

  const rangeIssues = priorities.filter(p => p.layer === 'Range');
  if (rangeIssues.length > 0) {
    recs.push({
      priority: 'HIGH',
      text: `Range limitations in ${rangeIssues.map(p => p.name).join(', ')}. Layer 1 prerequisite — address before loading through those positions.`,
      color: 'fits-orange',
    });
  }

  if (context?.fatigue === 'high') {
    recs.push({
      priority: 'HIGH',
      text: 'Elevated fatigue status. Apply Return-to-Development rule — reduce demand levels, prioritize recovery and quality maintenance.',
      color: 'fits-yellow',
    });
  }

  if (recs.length === 0) {
    recs.push({
      priority: 'MAINTAIN',
      text: 'Target Profile across most components. Continue progressive development aligned to performance level targets.',
      color: 'fits-green',
    });
  }

  return recs;
}
