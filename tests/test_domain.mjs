/**
 * Domain tests for Willowbrook Wilds living-ecosystem model.
 * Run: node tests/test_domain.mjs
 */
import {
  clamp, clampResource, clampPop, MAX_RESOURCE, MAX_POP,
  ORGANISMS, foodWebLinks, createState, cloneState, resetToScenario,
  setConditions, setPopulation, setPopulations, plantGrowthDelta,
  availableFood, consumerDelta, stepEcosystem, assertFiniteState,
  sanitizeState, evaluateBuild, predictOutcome, predictionMatches,
  healthScore, diagnose, stateFingerprint, createProgress, progressPercent,
  runSteps, popOf, activeFoodWeb,
} from '../js/domain.js';

let passed = 0;
let failed = 0;
const errors = [];

function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failed++;
    errors.push(msg);
    console.error('FAIL:', msg);
  }
}

function assertEq(a, b, msg) {
  assert(Object.is(a, b) || a === b, `${msg} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`);
}

// --- clamp / sanitize ---
assertEq(clamp(5, 0, 10), 5, 'clamp mid');
assertEq(clamp(-1, 0, 10), 0, 'clamp lo');
assertEq(clamp(99, 0, 10), 10, 'clamp hi');
assertEq(clamp(NaN, 0, 10), 0, 'clamp NaN → lo');
assertEq(clamp(Infinity, 0, 10), 10, 'clamp Inf → hi');
assertEq(clampResource(12), MAX_RESOURCE, 'clampResource');
assertEq(clampPop(-3), 0, 'clampPop neg');
assertEq(clampPop(100), MAX_POP, 'clampPop max');

// --- food web direction food → consumer ---
const links = foodWebLinks();
assert(links.length >= 4, 'food web has several links');
assert(links.every((l) => l.from && l.to && l.label.includes('→')), 'links labelled food → consumer');
assert(links.some((l) => l.from === 'grass' && l.to === 'grasshoppers'), 'grass → grasshoppers');
assert(links.some((l) => l.from === 'grasshoppers' && l.to === 'frogs'), 'grasshoppers → frogs');
assert(!links.some((l) => l.from === 'frogs' && l.to === 'grass'), 'no reverse frog→grass energy claim');

// --- build evaluation ---
const goodBuild = {
  grass: 5, cattails: 4, wildflowers: 0,
  grasshoppers: 3, snails: 2, frogs: 2,
};
const good = evaluateBuild(goodBuild);
assert(good.viable === true, 'viable habitat with 2 producers, 2 herbivores, 1 predator');
assert(good.relationships.length >= 2, 'relationships explained');

const missingPredator = evaluateBuild({
  grass: 5, cattails: 4, grasshoppers: 2, snails: 2, frogs: 0,
});
assert(missingPredator.viable === false, 'missing predator not viable');

const frogNoFood = evaluateBuild({
  grass: 5, cattails: 4, grasshoppers: 0, snails: 0, frogs: 2,
});
assert(frogNoFood.viable === false, 'predator without prey not viable');
assert(frogNoFood.missingFood.includes('frogs'), 'reports frogs missing food');

const oneProducer = evaluateBuild({
  grass: 5, cattails: 0, grasshoppers: 2, snails: 2, frogs: 1,
});
assert(oneProducer.viable === false, 'need ≥2 producers');

// --- plant growth responds to water ---
assert(plantGrowthDelta(8, 8) > plantGrowthDelta(8, 1), 'lower water → lower plant growth delta');
assert(plantGrowthDelta(2, 8) < 0, 'low sunlight → negative growth delta');
assert(plantGrowthDelta(5, 5) === 0, 'mid resources ≈ steady');
assert(plantGrowthDelta(9, 9) > 0, 'high resources → growth');

// --- lowering water changes plants across steps ---
const wet = createState({
  sunlight: 8, water: 8,
  populations: { grass: 6, cattails: 5, wildflowers: 0, grasshoppers: 0, snails: 0, frogs: 0 },
});
const dry = setConditions(wet, { water: 1 });
const wetRun = runSteps(wet, 3).state;
const dryRun = runSteps(dry, 3).state;
const wetPlants = popOf(wetRun, 'grass') + popOf(wetRun, 'cattails');
const dryPlants = popOf(dryRun, 'grass') + popOf(dryRun, 'cattails');
assert(dryPlants < wetPlants, 'lowering water → explainable plant decline across steps');

// --- consumer without food cannot thrive indefinitely ---
const stranded = createState({
  sunlight: 7, water: 7,
  populations: { grass: 0, cattails: 0, wildflowers: 0, grasshoppers: 6, snails: 0, frogs: 0 },
});
const afterStarve = runSteps(stranded, 5).state;
assert(popOf(afterStarve, 'grasshoppers') < 6, 'herbivore without food declines');
assert(popOf(afterStarve, 'grasshoppers') < popOf(stranded, 'grasshoppers'), 'decline vs start');

const frogOnly = createState({
  sunlight: 7, water: 7,
  populations: { grass: 5, cattails: 5, wildflowers: 0, grasshoppers: 0, snails: 0, frogs: 5 },
});
const frogAfter = runSteps(frogOnly, 4).state;
assert(popOf(frogAfter, 'frogs') < 5, 'predator without prey declines');

// --- restoring resources → recovery ---
const drought = createState({
  sunlight: 7, water: 1,
  populations: { grass: 8, cattails: 7, wildflowers: 0, grasshoppers: 0, snails: 0, frogs: 0 },
});
const afterDrought = runSteps(drought, 2).state;
const plantsAfterDrought = popOf(afterDrought, 'grass') + popOf(afterDrought, 'cattails');
assert(plantsAfterDrought < 8 + 7, 'drought reduced plants');
assert(plantsAfterDrought > 0, 'plants still present to recover');
const restored = setConditions(afterDrought, { water: 8 });
const afterRestore = runSteps(restored, 3).state;
const plantsRestored = popOf(afterRestore, 'grass') + popOf(afterRestore, 'cattails');
assert(plantsRestored > plantsAfterDrought, 'restoring water → model-consistent plant recovery');

// --- determinism ---
const start = createState({
  id: 'det',
  sunlight: 6, water: 4,
  populations: { grass: 5, cattails: 4, wildflowers: 3, grasshoppers: 3, snails: 2, frogs: 2 },
});
const a = runSteps(cloneState(start), 4).state;
const b = runSteps(cloneState(start), 4).state;
assertEq(stateFingerprint(a), stateFingerprint(b), 'identical start+actions → identical results');

// same actions path via setConditions + step
let s1 = cloneState(start);
let s2 = cloneState(start);
s1 = setConditions(s1, { water: 2 });
s2 = setConditions(s2, { water: 2 });
s1 = stepEcosystem(s1).state;
s2 = stepEcosystem(s2).state;
assertEq(stateFingerprint(s1), stateFingerprint(s2), 'step after same condition change identical');

// --- never negative / Inf / NaN ---
const messy = sanitizeState({
  sunlight: NaN, water: -5,
  populations: { grass: Infinity, cattails: -2, wildflowers: NaN, grasshoppers: 3, snails: 1, frogs: 1 },
  step: 0, history: [],
});
assert(assertFiniteState(messy) === true, 'sanitized state finite');
assert(messy.sunlight >= 0 && messy.water >= 0, 'resources non-negative');
for (const id of Object.keys(ORGANISMS)) {
  assert(messy.populations[id] >= 0 && Number.isFinite(messy.populations[id]), `pop ${id} finite non-neg`);
}

const chaos = createState({
  sunlight: 0, water: 0,
  populations: { grass: 20, cattails: 20, wildflowers: 20, grasshoppers: 20, snails: 20, frogs: 20 },
});
const chaosEnd = runSteps(chaos, 10).state;
assert(assertFiniteState(chaosEnd) === true, 'long run stays finite');
for (const id of Object.keys(ORGANISMS)) {
  assert(popOf(chaosEnd, id) >= 0 && popOf(chaosEnd, id) <= MAX_POP, `bounded pop ${id}`);
}

// --- reset restores starting scenario ---
const scenario = {
  id: 'reset-test',
  label: 'Reset test',
  sunlight: 7, water: 7,
  populations: { grass: 6, cattails: 5, wildflowers: 4, grasshoppers: 4, snails: 3, frogs: 2 },
};
let live = createState(scenario);
live = setConditions(live, { water: 1, sunlight: 2 });
live = setPopulation(live, 'frogs', 9);
live = runSteps(live, 3).state;
const reset = resetToScenario(scenario);
assertEq(reset.sunlight, 7, 'reset sunlight');
assertEq(reset.water, 7, 'reset water');
assertEq(popOf(reset, 'frogs'), 2, 'reset frogs');
assertEq(reset.step, 0, 'reset step');
assertEq(reset.history.length, 0, 'reset history');

// --- predictions ---
const beforeP = createState({
  sunlight: 8, water: 8,
  populations: { grass: 6, cattails: 5, wildflowers: 0, grasshoppers: 0, snails: 0, frogs: 0 },
});
const afterLowWater = runSteps(setConditions(beforeP, { water: 1 }), 2).state;
assertEq(predictOutcome(beforeP, afterLowWater), 'plants_down', 'predict plants_down');
assert(predictionMatches('plants_down', beforeP, afterLowWater), 'predictionMatches plants_down');
assert(!predictionMatches('plants_up', beforeP, afterLowWater), 'wrong prediction rejected');

const afterBoost = runSteps(setConditions(
  createState({ sunlight: 5, water: 5, populations: { grass: 4, cattails: 4, wildflowers: 0, grasshoppers: 0, snails: 0, frogs: 0 } }),
  { sunlight: 9, water: 9 },
), 2).state;
const beforeBoost = createState({ sunlight: 5, water: 5, populations: { grass: 4, cattails: 4, wildflowers: 0, grasshoppers: 0, snails: 0, frogs: 0 } });
assert(predictOutcome(beforeBoost, afterBoost) === 'plants_up' || predictOutcome(beforeBoost, afterBoost) === 'plants_same',
  'boost does not decrease plants');

// --- diagnose / health ---
const struggling = createState({
  sunlight: 1, water: 1,
  populations: { grass: 1, cattails: 0, wildflowers: 0, grasshoppers: 4, snails: 0, frogs: 3 },
});
const d = diagnose(struggling);
assert(d.issues.length >= 1, 'diagnose finds issues');
assert(d.status === 'struggling' || d.status === 'collapsed', 'low health status');
assert(healthScore(struggling) < healthScore(createState({
  sunlight: 7, water: 7,
  populations: { grass: 6, cattails: 5, wildflowers: 4, grasshoppers: 3, snails: 3, frogs: 2 },
})), 'healthy scores higher');

// --- active food web ---
const aw = activeFoodWeb(createState({
  sunlight: 7, water: 7,
  populations: { grass: 5, cattails: 0, wildflowers: 0, grasshoppers: 2, snails: 0, frogs: 1 },
}));
assert(aw.some((l) => l.from === 'grass' && l.to === 'grasshoppers'), 'active grass→grasshoppers');
assert(aw.some((l) => l.from === 'grasshoppers' && l.to === 'frogs'), 'active grasshoppers→frogs');
assert(!aw.some((l) => l.from === 'cattails'), 'absent cattails not in active web');

// --- progress ---
const prog = createProgress();
assertEq(progressPercent(prog), 0, 'progress start 0');
prog.onboardingDone = true;
prog.buildDone = true;
prog.experimentDone = true;
prog.restoreDone = true;
assertEq(progressPercent(prog), 100, 'progress complete 100');

// --- availableFood / consumerDelta helpers ---
assertEq(availableFood(createState({
  sunlight: 5, water: 5,
  populations: { grass: 3, wildflowers: 2, cattails: 0, grasshoppers: 1, snails: 0, frogs: 0 },
}), 'grasshoppers'), 5, 'grasshoppers food sum');
assertEq(consumerDelta(4, 0), -2, 'no food sharp decline');
assertEq(consumerDelta(0, 10), 0, 'zero pop stays 0 delta');

// --- setPopulations ---
const sp = setPopulations(createState({ sunlight: 5, water: 5, populations: {} }), { grass: 3, frogs: 1 });
assertEq(popOf(sp, 'grass'), 3, 'setPopulations grass');
assertEq(popOf(sp, 'frogs'), 1, 'setPopulations frogs');

// --- step notes exist ---
const stepped = stepEcosystem(createState({
  sunlight: 8, water: 2,
  populations: { grass: 5, cattails: 4, wildflowers: 0, grasshoppers: 3, snails: 2, frogs: 2 },
}));
assert(stepped.notes.length >= 1, 'step produces explanation notes');
assert(stepped.state.step === 1, 'step increments');

console.log(`\nPassed: ${passed} / Failed: ${failed}`);
if (failed) {
  console.error(errors.join('\n'));
  process.exit(1);
}
