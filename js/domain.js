/**
 * Willowbrook Wilds — deterministic living-ecosystem model.
 * Pure functions — no DOM. Model values are labelled as model units, not field measurements.
 *
 * Assumptions (documented for educators):
 * - Discrete time steps; identical start + actions → identical results.
 * - Plants grow from sunlight AND water (bottleneck = min of both factors).
 * - Herbivores need matching plant food; predators need matching prey.
 * - Populations / resources are clamped to [0, MAX]; never negative / Inf / NaN.
 * - Energy-flow arrows: food → consumer (who receives energy).
 */

export const MAX_RESOURCE = 10;
export const MAX_POP = 20;
export const MIN_VIABLE = 0;

/** Clamp a number into [lo, hi]; non-finite → lo. */
export function clamp(n, lo, hi) {
  const x = Number(n);
  if (Number.isNaN(x)) return lo;
  // Infinity / -Infinity handled by min/max into [lo, hi]
  return Math.max(lo, Math.min(hi, x));
}

export function clampResource(n) {
  return clamp(n, 0, MAX_RESOURCE);
}

export function clampPop(n) {
  return clamp(Math.round(Number(n) || 0), 0, MAX_POP);
}

/** Organism catalogue (ids used in state). */
export const ORGANISMS = {
  grass: {
    id: 'grass',
    name: 'Meadow grass',
    role: 'producer',
    emoji: '🌿',
    eats: null,
    description: 'A plant producer. Needs sunlight and water (model units).',
  },
  cattails: {
    id: 'cattails',
    name: 'Pond cattails',
    role: 'producer',
    emoji: '🌾',
    eats: null,
    description: 'A wetland plant producer. Needs sunlight and water.',
  },
  wildflowers: {
    id: 'wildflowers',
    name: 'Wildflowers',
    role: 'producer',
    emoji: '🌼',
    eats: null,
    description: 'Flowering plant producer. Needs sunlight and water.',
  },
  grasshoppers: {
    id: 'grasshoppers',
    name: 'Grasshoppers',
    role: 'herbivore',
    emoji: '🦗',
    eats: ['grass', 'wildflowers'],
    description: 'Herbivore consumer. Eats grass and wildflowers.',
  },
  snails: {
    id: 'snails',
    name: 'Pond snails',
    role: 'herbivore',
    emoji: '🐌',
    eats: ['cattails'],
    description: 'Herbivore consumer. Eats cattails in the model.',
  },
  frogs: {
    id: 'frogs',
    name: 'Frogs',
    role: 'predator',
    emoji: '🐸',
    eats: ['grasshoppers', 'snails'],
    description: 'Predator consumer. Eats grasshoppers and snails (not plants or sunlight).',
  },
};

/** Food-web links: energy flows from food → consumer. */
export function foodWebLinks() {
  const links = [];
  for (const org of Object.values(ORGANISMS)) {
    if (!org.eats) continue;
    for (const foodId of org.eats) {
      links.push({
        from: foodId,
        to: org.id,
        fromName: ORGANISMS[foodId].name,
        toName: org.name,
        label: `Energy: ${ORGANISMS[foodId].name} → ${org.name}`,
      });
    }
  }
  return links;
}

/** Links among currently present organisms (pop > 0). */
export function activeFoodWeb(state) {
  return foodWebLinks().filter(
    (l) => popOf(state, l.from) > 0 && popOf(state, l.to) > 0,
  );
}

export function popOf(state, id) {
  return clampPop(state?.populations?.[id] ?? 0);
}

export function createEmptyPopulations() {
  const p = {};
  for (const id of Object.keys(ORGANISMS)) p[id] = 0;
  return p;
}

/**
 * Build initial state from a scenario template.
 * @param {{ sunlight:number, water:number, populations:Object<string,number>, label?:string }} scenario
 */
export function createState(scenario) {
  const populations = createEmptyPopulations();
  const src = scenario?.populations || {};
  for (const id of Object.keys(ORGANISMS)) {
    populations[id] = clampPop(src[id] ?? 0);
  }
  return {
    sunlight: clampResource(scenario?.sunlight ?? 7),
    water: clampResource(scenario?.water ?? 7),
    populations,
    step: 0,
    history: [],
    label: scenario?.label || 'Custom',
    scenarioId: scenario?.id || 'custom',
  };
}

export function cloneState(state) {
  return {
    sunlight: clampResource(state.sunlight),
    water: clampResource(state.water),
    populations: { ...createEmptyPopulations(), ...state.populations },
    step: state.step | 0,
    history: Array.isArray(state.history) ? state.history.slice() : [],
    label: state.label,
    scenarioId: state.scenarioId,
  };
}

/** Reset to a fresh copy of the given starting scenario. */
export function resetToScenario(scenario) {
  return createState(scenario);
}

export function setConditions(state, { sunlight, water } = {}) {
  const next = cloneState(state);
  if (sunlight !== undefined) next.sunlight = clampResource(sunlight);
  if (water !== undefined) next.water = clampResource(water);
  return next;
}

export function setPopulation(state, id, value) {
  if (!ORGANISMS[id]) return cloneState(state);
  const next = cloneState(state);
  next.populations[id] = clampPop(value);
  return next;
}

export function setPopulations(state, map) {
  const next = cloneState(state);
  for (const [id, v] of Object.entries(map || {})) {
    if (ORGANISMS[id]) next.populations[id] = clampPop(v);
  }
  return next;
}

/**
 * Plant growth factor from sunlight & water (model units 0–10).
 * Bottleneck: min(lightFactor, waterFactor). Mid resources ≈ stable; high ≈ growth.
 */
export function plantGrowthDelta(sunlight, water) {
  const s = clampResource(sunlight);
  const w = clampResource(water);
  const bottleneck = Math.min(s, w);
  // Clear tiers so learners can explain “low water → plants decline”.
  if (bottleneck <= 2) return -1;
  if (bottleneck <= 4) return -1;
  if (bottleneck <= 6) return 0;
  if (bottleneck <= 8) return 1;
  return 2;
}

/** Available food units for a consumer from current populations. */
export function availableFood(state, consumerId) {
  const org = ORGANISMS[consumerId];
  if (!org || !org.eats) return 0;
  return org.eats.reduce((sum, foodId) => sum + popOf(state, foodId), 0);
}

/**
 * Consumer change: need roughly 1 food unit per 2 individuals to hold steady.
 * Excess food → small growth; shortage → decline. Never NaN/negative after clamp.
 */
export function consumerDelta(pop, foodAvailable) {
  const p = clampPop(pop);
  if (p === 0) return 0;
  const need = Math.ceil(p / 2);
  if (foodAvailable >= need + 2) return 1;
  if (foodAvailable >= need) return 0;
  if (foodAvailable >= Math.ceil(need / 2)) return -1;
  return -2;
}

/**
 * Advance one deterministic model step.
 * Order: producers (from light/water) → herbivores (from plants) → predators (from prey).
 * Plant populations are also reduced slightly when heavily grazed (food consumption).
 */
export function stepEcosystem(state) {
  const prev = cloneState(state);
  const next = cloneState(state);
  const notes = [];

  const growth = plantGrowthDelta(next.sunlight, next.water);
  for (const id of Object.keys(ORGANISMS)) {
    if (ORGANISMS[id].role !== 'producer') continue;
    const before = popOf(next, id);
    if (before === 0 && growth <= 0) continue;
    // Producers present (or seed if somehow >0) respond to resources
    if (before > 0 || growth > 0) {
      // Only grow/decline if already present — zero stays zero unless scenario seeds them
      if (before > 0) {
        const after = clampPop(before + growth);
        next.populations[id] = after;
        if (after !== before) {
          notes.push({
            kind: 'producer',
            id,
            before,
            after,
            reason:
              growth < 0
                ? `Low sunlight (${next.sunlight}) or water (${next.water}) slowed ${ORGANISMS[id].name} (model).`
                : growth > 0
                  ? `Enough sunlight and water helped ${ORGANISMS[id].name} grow (model).`
                  : `${ORGANISMS[id].name} held steady (model).`,
          });
        }
      }
    }
  }

  // Herbivores
  for (const id of Object.keys(ORGANISMS)) {
    if (ORGANISMS[id].role !== 'herbivore') continue;
    const before = popOf(next, id);
    if (before === 0) continue;
    const food = availableFood(next, id);
    const d = consumerDelta(before, food);
    const after = clampPop(before + d);
    next.populations[id] = after;
    // Light grazing: each herbivore "uses" plant food conceptually — reduce plants a little if thriving
    if (d >= 0 && food > 0) {
      for (const foodId of ORGANISMS[id].eats) {
        const fp = popOf(next, foodId);
        if (fp > 1) next.populations[foodId] = clampPop(fp - 1);
      }
    }
    notes.push({
      kind: 'herbivore',
      id,
      before,
      after,
      food,
      reason:
        after < before
          ? `${ORGANISMS[id].name} lacked enough plant food (model food=${food}) and declined.`
          : after > before
            ? `${ORGANISMS[id].name} found enough plants to increase (model).`
            : `${ORGANISMS[id].name} held steady with available plants (model).`,
    });
  }

  // Predators
  for (const id of Object.keys(ORGANISMS)) {
    if (ORGANISMS[id].role !== 'predator') continue;
    const before = popOf(next, id);
    if (before === 0) continue;
    const food = availableFood(next, id);
    const d = consumerDelta(before, food);
    const after = clampPop(before + d);
    next.populations[id] = after;
    if (d >= 0 && food > 0) {
      for (const foodId of ORGANISMS[id].eats) {
        const fp = popOf(next, foodId);
        if (fp > 1) next.populations[foodId] = clampPop(fp - 1);
      }
    }
    notes.push({
      kind: 'predator',
      id,
      before,
      after,
      food,
      reason:
        after < before
          ? `${ORGANISMS[id].name} lacked enough prey and declined (model). Predators do not eat sunlight.`
          : after > before
            ? `${ORGANISMS[id].name} found enough prey to increase (model).`
            : `${ORGANISMS[id].name} held steady with available prey (model).`,
    });
  }

  next.step = (prev.step | 0) + 1;
  next.history = (prev.history || []).concat([
    {
      step: next.step,
      sunlight: next.sunlight,
      water: next.water,
      populations: { ...next.populations },
      notes,
    },
  ]);

  assertFiniteState(next);
  return { state: next, notes, prev };
}

/** Assert no negative / Inf / NaN in resources or populations. */
export function assertFiniteState(state) {
  const nums = [state.sunlight, state.water, ...Object.values(state.populations || {})];
  for (const n of nums) {
    if (!Number.isFinite(n) || n < 0) {
      throw new Error(`Invalid model value: ${n}`);
    }
  }
  return true;
}

/** Sanitize any state (repair NaN/negatives). */
export function sanitizeState(state) {
  const next = cloneState(state);
  next.sunlight = clampResource(next.sunlight);
  next.water = clampResource(next.water);
  for (const id of Object.keys(ORGANISMS)) {
    next.populations[id] = clampPop(next.populations[id]);
  }
  return next;
}

/**
 * Habitat viability for Build activity.
 * Viable: ≥2 producers present, ≥2 herbivores, ≥1 predator, and every consumer
 * has at least one of its food sources present.
 */
export function evaluateBuild(selection) {
  const present = Object.entries(selection || {})
    .filter(([, v]) => Number(v) > 0)
    .map(([id]) => id);

  const producers = present.filter((id) => ORGANISMS[id]?.role === 'producer');
  const herbivores = present.filter((id) => ORGANISMS[id]?.role === 'herbivore');
  const predators = present.filter((id) => ORGANISMS[id]?.role === 'predator');

  const missingFood = [];
  for (const id of [...herbivores, ...predators]) {
    const foods = ORGANISMS[id].eats || [];
    const ok = foods.some((f) => present.includes(f));
    if (!ok) missingFood.push(id);
  }

  const viable =
    producers.length >= 2 &&
    herbivores.length >= 2 &&
    predators.length >= 1 &&
    missingFood.length === 0;

  const relationships = [];
  for (const id of [...herbivores, ...predators]) {
    if (missingFood.includes(id)) continue;
    for (const f of ORGANISMS[id].eats) {
      if (present.includes(f)) {
        relationships.push({
          from: f,
          to: id,
          text: `${ORGANISMS[f].name} → ${ORGANISMS[id].name} (energy to consumer)`,
        });
      }
    }
  }

  return {
    viable,
    producers,
    herbivores,
    predators,
    missingFood,
    relationships,
    feedback: viable
      ? 'This habitat has producers, plant-eaters, and a predator, with food links that make sense in the model.'
      : buildFeedback(producers, herbivores, predators, missingFood),
  };
}

function buildFeedback(producers, herbivores, predators, missingFood) {
  const tips = [];
  if (producers.length < 2) tips.push('Add at least two producers (plants).');
  if (herbivores.length < 2) tips.push('Add at least two herbivores (plant-eaters).');
  if (predators.length < 1) tips.push('Add at least one predator.');
  if (missingFood.length) {
    tips.push(
      missingFood
        .map((id) => `${ORGANISMS[id].name} needs its food present: ${(ORGANISMS[id].eats || []).map((f) => ORGANISMS[f].name).join(' or ')}.`)
        .join(' '),
    );
  }
  return tips.join(' ');
}

/**
 * Prediction options for experiment activity.
 * Keys: plants_down | plants_up | plants_same | consumers_down | mixed
 */
export function predictOutcome(before, after) {
  const plantIds = Object.keys(ORGANISMS).filter((id) => ORGANISMS[id].role === 'producer');
  const plantBefore = plantIds.reduce((s, id) => s + popOf(before, id), 0);
  const plantAfter = plantIds.reduce((s, id) => s + popOf(after, id), 0);
  if (plantAfter < plantBefore) return 'plants_down';
  if (plantAfter > plantBefore) return 'plants_up';
  return 'plants_same';
}

export function predictionMatches(choice, before, after) {
  const actual = predictOutcome(before, after);
  return choice === actual;
}

/** Health score 0–100 based on diversity + food links + mid resources. */
export function healthScore(state) {
  const present = Object.keys(ORGANISMS).filter((id) => popOf(state, id) > 0);
  const producers = present.filter((id) => ORGANISMS[id].role === 'producer').length;
  const herbivores = present.filter((id) => ORGANISMS[id].role === 'herbivore').length;
  const predators = present.filter((id) => ORGANISMS[id].role === 'predator').length;
  let score = producers * 12 + herbivores * 12 + predators * 16;
  const links = activeFoodWeb(state).length;
  score += Math.min(24, links * 6);
  // Prefer mid resources
  const res = (clampResource(state.sunlight) + clampResource(state.water)) / 2;
  score += res >= 4 && res <= 8 ? 16 : res > 0 ? 6 : 0;
  // Penalize zeros of key roles when others exist
  if (producers === 0 && (herbivores > 0 || predators > 0)) score = Math.max(0, score - 30);
  return clamp(score, 0, 100);
}

export function diagnose(state) {
  const issues = [];
  if (state.water < 4) issues.push({ code: 'low_water', text: 'Water is low (model). Plants will struggle.' });
  if (state.sunlight < 4) issues.push({ code: 'low_sun', text: 'Sunlight is low (model). Plants will struggle.' });
  if (state.water > 9 && state.sunlight > 9) {
    issues.push({ code: 'extreme_high', text: 'Resources are very high — still a simplified model, not a real flood/sun guarantee.' });
  }
  for (const id of Object.keys(ORGANISMS)) {
    const org = ORGANISMS[id];
    if (org.role === 'producer') continue;
    if (popOf(state, id) > 0 && availableFood(state, id) === 0) {
      issues.push({
        code: 'no_food_' + id,
        text: `${org.name} has no food source in the habitat (model).`,
      });
    }
  }
  const producers = Object.keys(ORGANISMS).filter(
    (id) => ORGANISMS[id].role === 'producer' && popOf(state, id) > 0,
  );
  if (producers.length === 0) {
    issues.push({ code: 'no_producers', text: 'No producers left — consumers cannot thrive indefinitely.' });
  }
  const score = healthScore(state);
  let status = 'healthy';
  if (score < 35) status = 'collapsed';
  else if (score < 60) status = 'struggling';
  return { issues, score, status };
}

/**
 * Compare two runs for determinism: same serializable snapshot.
 */
export function stateFingerprint(state) {
  const pops = {};
  for (const id of Object.keys(ORGANISMS).sort()) {
    pops[id] = popOf(state, id);
  }
  return JSON.stringify({
    s: clampResource(state.sunlight),
    w: clampResource(state.water),
    p: pops,
    step: state.step | 0,
  });
}

export function createProgress() {
  return {
    onboardingDone: false,
    buildDone: false,
    experimentDone: false,
    restoreDone: false,
    scaffold: 'more-help',
  };
}

export function progressPercent(progress) {
  let n = 0;
  if (progress.onboardingDone) n += 10;
  if (progress.buildDone) n += 30;
  if (progress.experimentDone) n += 30;
  if (progress.restoreDone) n += 30;
  return n;
}

/** Run N steps; return final state (deterministic). */
export function runSteps(state, n) {
  let s = cloneState(state);
  const allNotes = [];
  const steps = Math.max(0, Math.floor(Number(n) || 0));
  for (let i = 0; i < steps; i++) {
    const r = stepEcosystem(s);
    s = r.state;
    allNotes.push(...r.notes);
  }
  return { state: s, notes: allNotes };
}
