/**
 * Willowbrook Wilds — learning copy, scenarios, organism picker defaults.
 * Separated from UI (app.js) and model (domain.js).
 */

export const THEME = {
  title: 'Living Ecosystem Lab',
  brand: 'Willowbrook Wilds',
  tagline: 'Tend a model meadow-pond habitat — plants, plant-eaters, and a predator',
  ageBand: 'About age 9',
  session: '10–15 minutes',
};

export const ONBOARDING = {
  welcome:
    'Welcome to Willowbrook Wilds! You will build a small model habitat, predict what happens when sunlight or water changes, and help a struggling habitat recover.',
  ageNote:
    'This is a simplified model for learning — not a real wildlife survey. Numbers are model values, not scientific field measurements.',
  steps: [
    'Build a habitat with plants (producers), plant-eaters (herbivores), and a predator.',
    'Predict, then change sunlight or water and step the model to check your idea.',
    'Diagnose a struggling habitat and restore balance — including one unfamiliar case.',
  ],
};

export const CO_PLAY_TIPS = [
  'Ask: “Who makes food from sunlight and water?” (producers / plants).',
  'Ask: “Where does energy go?” Trace arrows from food → consumer.',
  'Remind learners this model is simpler than a real meadow or pond.',
  'Celebrate careful predictions — wrong guesses are useful data, never “bad”.',
];

export const NEXT_PRACTICE = [
  'Draw a food chain from a park or garden you know (still a simple model).',
  'Change only one thing at a time and write what you expect before checking.',
  'List two ways a real ecosystem is more complex than Willowbrook Wilds.',
];

/** Picker options for Build activity — coherent meadow-pond set. */
export const BUILD_OPTIONS = {
  producers: ['grass', 'cattails', 'wildflowers'],
  herbivores: ['grasshoppers', 'snails'],
  predators: ['frogs'],
};

/** Default counts when toggling an organism on in Build. */
export const BUILD_DEFAULT_COUNT = {
  grass: 6,
  cattails: 5,
  wildflowers: 4,
  grasshoppers: 4,
  snails: 3,
  frogs: 2,
};

/**
 * Experiment scenarios (≥3 meaningful starts).
 * Each includes starting conditions and a suggested change for guided practice.
 */
export const EXPERIMENT_SCENARIOS = [
  {
    id: 'sunny-dry',
    label: 'Sunny & drying meadow',
    mode: 'demo',
    blurb: 'Sunlight is high but water is falling. What happens to plants first?',
    sunlight: 8,
    water: 6,
    populations: {
      grass: 6,
      cattails: 5,
      wildflowers: 4,
      grasshoppers: 4,
      snails: 3,
      frogs: 2,
    },
    suggestedChange: { water: 2 },
    suggestedChangeLabel: 'Lower water to 2 (model units)',
  },
  {
    id: 'cloudy-wet',
    label: 'Cloudy wet pond edge',
    mode: 'guided',
    blurb: 'Plenty of water, but weak sunlight. Predict plant change.',
    sunlight: 6,
    water: 8,
    populations: {
      grass: 5,
      cattails: 6,
      wildflowers: 3,
      grasshoppers: 3,
      snails: 4,
      frogs: 2,
    },
    suggestedChange: { sunlight: 2 },
    suggestedChangeLabel: 'Lower sunlight to 2 (model units)',
  },
  {
    id: 'balanced-boost',
    label: 'Balanced habitat boost',
    mode: 'guided',
    blurb: 'Mid resources. Raise both sunlight and water a little.',
    sunlight: 5,
    water: 5,
    populations: {
      grass: 5,
      cattails: 5,
      wildflowers: 4,
      grasshoppers: 3,
      snails: 3,
      frogs: 2,
    },
    suggestedChange: { sunlight: 8, water: 8 },
    suggestedChangeLabel: 'Raise sunlight and water to 8',
  },
  {
    id: 'fresh-apply',
    label: 'Fresh check: sudden shade',
    mode: 'application',
    blurb: 'Apply what you learned — only sunlight drops. Record a prediction first.',
    sunlight: 7,
    water: 7,
    populations: {
      grass: 6,
      cattails: 4,
      wildflowers: 5,
      grasshoppers: 4,
      snails: 2,
      frogs: 2,
    },
    suggestedChange: { sunlight: 1 },
    suggestedChangeLabel: 'Drop sunlight to 1 (keep water)',
  },
];

export const PREDICTION_CHOICES = [
  {
    id: 'plants_down',
    label: 'Total plants will go down',
    hint: 'Think about the resource you changed.',
  },
  {
    id: 'plants_up',
    label: 'Total plants will go up',
    hint: 'More light and water can help producers in this model.',
  },
  {
    id: 'plants_same',
    label: 'Total plants will stay about the same',
    hint: 'Mid resources often hold plants steady for a step or two.',
  },
];

/**
 * Restore-balance scenarios. Last one is unfamiliar transfer (dune-edge twist).
 */
export const RESTORE_SCENARIOS = [
  {
    id: 'drought-meadow',
    label: 'Drought in the meadow',
    mode: 'demo',
    blurb: 'Water crashed. Plants are fading; plant-eaters will follow if nothing changes.',
    sunlight: 7,
    water: 1,
    populations: {
      grass: 3,
      cattails: 2,
      wildflowers: 2,
      grasshoppers: 4,
      snails: 3,
      frogs: 2,
    },
    goal: 'Raise water and let plants recover before consumers thrive again.',
  },
  {
    id: 'hungry-frogs',
    label: 'Frogs without prey',
    mode: 'guided',
    blurb: 'Frogs are present but grasshoppers and snails are gone. Fix the food web.',
    sunlight: 6,
    water: 6,
    populations: {
      grass: 5,
      cattails: 5,
      wildflowers: 3,
      grasshoppers: 0,
      snails: 0,
      frogs: 4,
    },
    goal: 'Restore herbivores (or reduce frogs) so predators are not stranded without food.',
  },
  {
    id: 'shade-collapse',
    label: 'Deep shade collapse',
    mode: 'guided',
    blurb: 'Sunlight is almost gone. Diagnose, then repair.',
    sunlight: 1,
    water: 6,
    populations: {
      grass: 2,
      cattails: 2,
      wildflowers: 1,
      grasshoppers: 3,
      snails: 2,
      frogs: 2,
    },
    goal: 'Restore sunlight so producers can support the rest of the web.',
  },
  {
    id: 'dune-transfer',
    label: 'Unfamiliar: windy dune edge',
    mode: 'transfer',
    blurb:
      'New story, same model rules: a windy dune edge lost water and wildflowers. Transfer what you know — do not memorise the meadow story alone.',
    sunlight: 8,
    water: 2,
    populations: {
      grass: 4,
      cattails: 1,
      wildflowers: 0,
      grasshoppers: 5,
      snails: 1,
      frogs: 2,
    },
    goal: 'Repair water and/or plant mix so grasshoppers (and then frogs) are not stranded.',
  },
];

export const MODEL_ASSUMPTIONS = [
  'Discrete steps; same start + same actions → same results.',
  'Plants need both sunlight and water (bottleneck = the lower one).',
  'Herbivores need their plant foods; frogs need grasshoppers or snails — not sunlight.',
  'Values are model units (0–10 resources, 0–20 populations), not field measurements.',
  'Real ecosystems are far more complex (weather, disease, many species, seasons).',
];

export const DICTIONARY = {
  producer: 'A living thing that makes its own food using sunlight (here: plants).',
  consumer: 'A living thing that gets energy by eating other living things.',
  herbivore: 'A consumer that eats plants.',
  predator: 'A consumer that eats other animals.',
  habitat: 'The place where living things find what they need — modelled here as a meadow-pond.',
  food_web: 'Who-eats-whom links. Our arrows show energy flowing from food → consumer.',
};
