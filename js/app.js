/**
 * Willowbrook Wilds — Living Ecosystem Lab
 * Demo + guided practice + fresh application; localStorage with reset.
 */
import {
  ORGANISMS,
  createState,
  cloneState,
  resetToScenario,
  setConditions,
  setPopulation,
  setPopulations,
  stepEcosystem,
  runSteps,
  evaluateBuild,
  predictOutcome,
  predictionMatches,
  diagnose,
  healthScore,
  activeFoodWeb,
  popOf,
  createProgress,
  progressPercent,
  foodWebLinks,
} from './domain.js';
import {
  THEME,
  ONBOARDING,
  CO_PLAY_TIPS,
  NEXT_PRACTICE,
  BUILD_OPTIONS,
  BUILD_DEFAULT_COUNT,
  EXPERIMENT_SCENARIOS,
  PREDICTION_CHOICES,
  RESTORE_SCENARIOS,
  MODEL_ASSUMPTIONS,
  DICTIONARY,
} from './data.js';

const STORAGE_KEY = 'willowbrook-wilds-v1';

const state = {
  screen: 'home',
  progress: createProgress(),
  lastFeedback: '',
  // build
  buildSelection: {
    grass: 0, cattails: 0, wildflowers: 0,
    grasshoppers: 0, snails: 0, frogs: 0,
  },
  buildResult: null,
  // experiment
  expIndex: 0,
  expState: null,
  expBaseline: null,
  expPrediction: null,
  expCompared: false,
  expNotes: [],
  // restore
  restoreIndex: 0,
  restoreState: null,
  restoreBaseline: null,
  restoreNotes: [],
  restoreFixed: false,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved && saved.progress) {
      state.progress = { ...createProgress(), ...saved.progress };
      state.screen = saved.screen || 'home';
      state.expIndex = saved.expIndex || 0;
      state.restoreIndex = saved.restoreIndex || 0;
      if (saved.buildSelection) state.buildSelection = { ...state.buildSelection, ...saved.buildSelection };
    }
  } catch (_) { /* ignore */ }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      progress: state.progress,
      screen: state.screen,
      expIndex: state.expIndex,
      restoreIndex: state.restoreIndex,
      buildSelection: state.buildSelection,
    }));
  } catch (_) { /* private mode */ }
}

function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  Object.assign(state, {
    screen: 'home',
    progress: createProgress(),
    lastFeedback: '',
    buildSelection: {
      grass: 0, cattails: 0, wildflowers: 0,
      grasshoppers: 0, snails: 0, frogs: 0,
    },
    buildResult: null,
    expIndex: 0,
    expState: null,
    expBaseline: null,
    expPrediction: null,
    expCompared: false,
    expNotes: [],
    restoreIndex: 0,
    restoreState: null,
    restoreBaseline: null,
    restoreNotes: [],
    restoreFixed: false,
  });
  render();
}

function prepareExperiment(index) {
  const sc = EXPERIMENT_SCENARIOS[index] || EXPERIMENT_SCENARIOS[0];
  state.expIndex = index;
  state.expBaseline = createState(sc);
  state.expState = cloneState(state.expBaseline);
  state.expPrediction = null;
  state.expCompared = false;
  state.expNotes = [];
}

function prepareRestore(index) {
  const sc = RESTORE_SCENARIOS[index] || RESTORE_SCENARIOS[0];
  state.restoreIndex = index;
  state.restoreBaseline = createState(sc);
  state.restoreState = cloneState(state.restoreBaseline);
  state.restoreNotes = [];
  state.restoreFixed = false;
}

function scaffoldControls(parent) {
  const row = document.createElement('div');
  row.className = 'scaffold-toggle';
  row.innerHTML = `<span class="label">Help level:</span>`;
  for (const [val, label] of [['more-help', 'More help'], ['less-help', 'Less help']]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.setAttribute('aria-pressed', state.progress.scaffold === val ? 'true' : 'false');
    if (state.progress.scaffold === val) b.classList.add('primary');
    b.addEventListener('click', () => {
      state.progress.scaffold = val;
      save();
      render();
    });
    row.appendChild(b);
  }
  parent.appendChild(row);
}

function navBar(root) {
  const nav = document.createElement('nav');
  nav.className = 'nav-steps';
  nav.setAttribute('aria-label', 'Lesson activities');
  const steps = [
    { id: 'build', label: '1. Build habitat' },
    { id: 'experiment', label: '2. Predict & try' },
    { id: 'restore', label: '3. Restore balance' },
  ];
  steps.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s.label;
    b.setAttribute('data-nav', s.id);
    if (state.screen === s.id) b.setAttribute('aria-current', 'page');
    b.addEventListener('click', () => {
      state.screen = s.id;
      if (s.id === 'experiment' && !state.expState) prepareExperiment(state.expIndex);
      if (s.id === 'restore' && !state.restoreState) prepareRestore(state.restoreIndex);
      save();
      render();
    });
    nav.appendChild(b);
  });
  root.appendChild(nav);
}

function header(root) {
  const h = document.createElement('header');
  h.className = 'app-header';
  h.innerHTML = `
    <div class="brand">
      <div class="brand-mark" aria-hidden="true">🌿</div>
      <div>
        <h1>${THEME.title}</h1>
        <p>${THEME.brand} — ${THEME.tagline}</p>
      </div>
    </div>
  `;
  const tb = document.createElement('div');
  tb.className = 'toolbar';
  const home = document.createElement('button');
  home.type = 'button';
  home.className = 'ghost';
  home.textContent = 'Home';
  home.addEventListener('click', () => {
    state.screen = 'home';
    save();
    render();
  });
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'warn';
  reset.textContent = 'Reset';
  reset.setAttribute('aria-label', 'Reset all progress stored in this browser');
  reset.addEventListener('click', () => {
    if (confirm('Clear saved progress in this browser and start over?')) resetAll();
  });
  tb.append(home, reset);
  h.appendChild(tb);
  root.appendChild(h);

  const pw = document.createElement('div');
  pw.className = 'progress-wrap';
  const pct = progressPercent(state.progress);
  pw.innerHTML = `<div class="progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Lesson progress"><span style="width:${pct}%"></span></div>
    <div class="progress-label">Progress: ${pct}% (saved only in this browser — Reset clears it)</div>`;
  root.appendChild(pw);
}

function renderIndicators(container, ecoState, title) {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<h3>${title || 'Model indicators'}</h3>
    <p class="subprompt">Numbers are <strong>model values</strong>, not scientific field measurements.</p>`;
  const res = document.createElement('div');
  res.className = 'indicator-grid';
  res.innerHTML = `
    <div class="indicator" role="group" aria-label="Sunlight model units">
      <div class="name">Sunlight</div>
      <div class="count">${ecoState.sunlight}</div>
      <div class="cue">☀ model 0–10</div>
    </div>
    <div class="indicator" role="group" aria-label="Water model units">
      <div class="name">Water</div>
      <div class="count">${ecoState.water}</div>
      <div class="cue">💧 model 0–10</div>
    </div>
    <div class="indicator" role="group" aria-label="Model health score">
      <div class="name">Health score</div>
      <div class="count">${healthScore(ecoState)}</div>
      <div class="cue">model score</div>
    </div>
  `;
  wrap.appendChild(res);

  const pops = document.createElement('div');
  pops.className = 'indicator-grid';
  pops.style.marginTop = '8px';
  for (const id of Object.keys(ORGANISMS)) {
    const org = ORGANISMS[id];
    const n = popOf(ecoState, id);
    const el = document.createElement('div');
    el.className = 'indicator' + (n === 0 ? ' zero' : '');
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', `${org.name}: ${n}`);
    el.innerHTML = `
      <div class="name">${org.emoji} ${org.name}</div>
      <div class="count">${n}</div>
      <div class="cue">${org.role}</div>
    `;
    pops.appendChild(el);
  }
  wrap.appendChild(pops);

  // Accessible table alternative
  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-scroll';
  const rows = Object.keys(ORGANISMS).map((id) => {
    const org = ORGANISMS[id];
    return `<tr><td>${org.name}</td><td>${org.role}</td><td>${popOf(ecoState, id)}</td></tr>`;
  }).join('');
  tableWrap.innerHTML = `<table class="data-table">
    <caption>Same populations as indicators (table)</caption>
    <thead><tr><th scope="col">Organism</th><th scope="col">Role</th><th scope="col">Model count</th></tr></thead>
    <tbody>
      <tr><td>Sunlight</td><td>resource</td><td>${ecoState.sunlight}</td></tr>
      <tr><td>Water</td><td>resource</td><td>${ecoState.water}</td></tr>
      ${rows}
    </tbody>
  </table>`;
  wrap.appendChild(tableWrap);
  container.appendChild(wrap);
}

function renderFoodWebList(container, ecoState) {
  const links = ecoState ? activeFoodWeb(ecoState) : foodWebLinks();
  const box = document.createElement('div');
  box.className = 'food-web';
  box.innerHTML = `<h3>Food relationships</h3>
    <p class="subprompt">Arrows show <strong>energy flow from food → consumer</strong> (who receives energy).</p>`;
  const ul = document.createElement('ul');
  if (!links.length) {
    const li = document.createElement('li');
    li.textContent = 'Add organisms so food links can appear.';
    ul.appendChild(li);
  } else {
    links.forEach((l) => {
      const li = document.createElement('li');
      li.textContent = l.label || `${l.fromName} → ${l.toName}`;
      ul.appendChild(li);
    });
  }
  box.appendChild(ul);
  container.appendChild(box);
}

function renderHome(main) {
  const panel = document.createElement('section');
  panel.className = 'panel home-hero';
  panel.innerHTML = `
    <div class="big-emoji" aria-hidden="true">🌿🦗🐸</div>
    <h2>${THEME.brand}</h2>
    <p>A focused ${THEME.session} lesson for ${THEME.ageBand.toLowerCase()}. Build a meadow-pond habitat, predict what sunlight and water do, then restore balance. No scores that shame you — explore and retry anytime.</p>
  `;
  const start = document.createElement('button');
  start.type = 'button';
  start.className = 'primary';
  start.setAttribute('data-action', 'begin');
  start.textContent = state.progress.onboardingDone ? 'Continue lab' : 'Start lab';
  start.addEventListener('click', () => {
    state.screen = state.progress.onboardingDone ? 'build' : 'onboard';
    save();
    render();
  });
  panel.appendChild(start);
  main.appendChild(panel);

  const adult = document.createElement('section');
  adult.className = 'panel adult-box';
  adult.innerHTML = `<h2>Adult / educator tips</h2>`;
  const ul = document.createElement('ul');
  ul.className = 'tips-list';
  CO_PLAY_TIPS.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    ul.appendChild(li);
  });
  adult.appendChild(ul);
  const exitNote = document.createElement('p');
  exitNote.className = 'subprompt';
  exitNote.textContent = 'See EDUCATOR_GUIDE.md for objectives and references. Home or Reset anytime.';
  adult.appendChild(exitNote);
  main.appendChild(adult);
}

function renderOnboard(main) {
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `<h2>Briefing</h2><p>${ONBOARDING.welcome}</p><p class="subprompt">${ONBOARDING.ageNote}</p>`;
  const list = document.createElement('ol');
  ONBOARDING.steps.forEach((line) => {
    const li = document.createElement('li');
    li.textContent = line;
    list.appendChild(li);
  });
  panel.appendChild(list);

  const dict = document.createElement('dl');
  dict.className = 'dict';
  dict.innerHTML = `
    <dt>Producer</dt><dd>${DICTIONARY.producer}</dd>
    <dt>Consumer</dt><dd>${DICTIONARY.consumer}</dt>
    <dt>Food web</dt><dd>${DICTIONARY.food_web}</dd>
  `.replace('</dt>', '</dd>'); // fix typo safely below
  // rewrite cleanly
  dict.innerHTML = '';
  for (const [k, v] of [['Producer', DICTIONARY.producer], ['Consumer', DICTIONARY.consumer], ['Food web', DICTIONARY.food_web]]) {
    const dt = document.createElement('dt');
    dt.textContent = k;
    const dd = document.createElement('dd');
    dd.textContent = v;
    dict.append(dt, dd);
  }
  panel.appendChild(dict);

  const fb = document.createElement('div');
  fb.className = 'feedback hint';
  fb.textContent = 'You can change help level later. Ready when you are.';
  state.lastFeedback = fb.textContent;
  panel.appendChild(fb);

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'primary';
  next.textContent = 'Next: Build a habitat';
  next.addEventListener('click', () => {
    state.progress.onboardingDone = true;
    state.screen = 'build';
    save();
    render();
  });
  panel.appendChild(next);
  main.appendChild(panel);
}

function toggleBuildOrganism(id) {
  const cur = state.buildSelection[id] || 0;
  state.buildSelection[id] = cur > 0 ? 0 : (BUILD_DEFAULT_COUNT[id] || 3);
  state.buildResult = null;
  save();
  render();
}

function renderBuild(main) {
  navBar(main);
  scaffoldControls(main);
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `<h2>1. Build a habitat</h2>
    <p>Assemble a Willowbrook meadow-pond: at least <strong>two producers</strong>, <strong>two herbivores</strong>, and <strong>one predator</strong>. Tap to include or remove (keyboard-friendly — no dragging).</p>`;

  if (state.progress.scaffold === 'more-help') {
    const hint = document.createElement('div');
    hint.className = 'feedback hint';
    hint.id = 'build-hint';
    hint.textContent = 'Hint: Grasshoppers eat grass/wildflowers; snails eat cattails; frogs eat grasshoppers or snails — not sunlight.';
    panel.appendChild(hint);
  }

  function section(title, ids, roleClass) {
    const h = document.createElement('h3');
    h.textContent = title;
    panel.appendChild(h);
    const grid = document.createElement('div');
    grid.className = 'chip-grid';
    ids.forEach((id) => {
      const org = ORGANISMS[id];
      const on = (state.buildSelection[id] || 0) > 0;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `chip ${roleClass}`;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', `${on ? 'Remove' : 'Add'} ${org.name}, ${org.role}`);
      b.innerHTML = `<span aria-hidden="true">${org.emoji}</span><strong>${org.name}</strong>
        <span class="role">${org.role}${on ? ` · model count ${state.buildSelection[id]}` : ''}</span>`;
      b.addEventListener('click', () => toggleBuildOrganism(id));
      grid.appendChild(b);
    });
    panel.appendChild(grid);
  }

  section('Producers (plants)', BUILD_OPTIONS.producers, 'producer');
  section('Herbivores (plant-eaters)', BUILD_OPTIONS.herbivores, 'herbivore');
  section('Predators', BUILD_OPTIONS.predators, 'predator');

  const actions = document.createElement('div');
  actions.className = 'row-actions';
  const check = document.createElement('button');
  check.type = 'button';
  check.className = 'primary';
  check.setAttribute('data-action', 'build-check');
  check.textContent = 'Check habitat';
  check.addEventListener('click', () => {
    state.buildResult = evaluateBuild(state.buildSelection);
    if (state.buildResult.viable) {
      state.progress.buildDone = true;
      save();
    }
    render();
  });
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'ghost';
  clear.textContent = 'Clear selection';
  clear.addEventListener('click', () => {
    state.buildSelection = {
      grass: 0, cattails: 0, wildflowers: 0,
      grasshoppers: 0, snails: 0, frogs: 0,
    };
    state.buildResult = null;
    save();
    render();
  });
  actions.append(check, clear);
  panel.appendChild(actions);

  const fb = document.createElement('div');
  fb.className = 'feedback';
  fb.id = 'build-feedback';
  if (state.buildResult) {
    fb.classList.add(state.buildResult.viable ? 'good' : 'warn');
    fb.textContent = state.buildResult.feedback;
    state.lastFeedback = fb.textContent;
  } else {
    fb.textContent = 'Select organisms, then check. You can retry as often as you like.';
  }
  panel.appendChild(fb);

  if (state.buildResult && state.buildResult.relationships.length) {
    const rel = document.createElement('div');
    rel.className = 'food-web';
    rel.innerHTML = `<h3>Explained relationships</h3>`;
    const ul = document.createElement('ul');
    state.buildResult.relationships.forEach((r) => {
      const li = document.createElement('li');
      li.textContent = r.text;
      ul.appendChild(li);
    });
    rel.appendChild(ul);
    panel.appendChild(rel);
  }

  const demo = document.createElement('div');
  demo.className = 'model-note';
  demo.innerHTML = `<strong>Demo idea:</strong> Try grass + cattails + grasshoppers + snails + frogs — a coherent meadow-pond web.`;
  panel.appendChild(demo);

  if (state.buildResult?.viable) {
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'primary';
    next.textContent = 'Next: Predict & experiment';
    next.addEventListener('click', () => {
      state.screen = 'experiment';
      prepareExperiment(0);
      save();
      render();
    });
    panel.appendChild(next);
  }

  main.appendChild(panel);
}

function applySuggestedChange() {
  const sc = EXPERIMENT_SCENARIOS[state.expIndex];
  if (!sc?.suggestedChange || !state.expState) return;
  state.expState = setConditions(state.expState, sc.suggestedChange);
  state.expCompared = false;
  state.expNotes = [];
  render();
}

function renderExperiment(main) {
  navBar(main);
  scaffoldControls(main);
  if (!state.expState) prepareExperiment(state.expIndex);
  const sc = EXPERIMENT_SCENARIOS[state.expIndex];
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `<h2>2. Predict & experiment</h2>
    <p><strong>${sc.label}</strong> <span class="subprompt">(${sc.mode})</span></p>
    <p>${sc.blurb}</p>`;

  // Scenario picker
  const picker = document.createElement('div');
  picker.className = 'row-actions';
  picker.setAttribute('aria-label', 'Starting scenarios');
  EXPERIMENT_SCENARIOS.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${i + 1}. ${s.label}`;
    b.setAttribute('aria-pressed', i === state.expIndex ? 'true' : 'false');
    if (i === state.expIndex) b.classList.add('primary');
    b.addEventListener('click', () => {
      prepareExperiment(i);
      save();
      render();
    });
    picker.appendChild(b);
  });
  panel.appendChild(picker);

  if (state.progress.scaffold === 'more-help') {
    const hint = document.createElement('div');
    hint.className = 'feedback hint';
    hint.textContent = `Hint: ${sc.suggestedChangeLabel}. Plants need both sunlight and water — the lower one limits growth in this model.`;
    panel.appendChild(hint);
  }

  // Condition controls
  const meters = document.createElement('div');
  meters.className = 'meter-row';
  meters.innerHTML = `
    <div class="meter">
      <label for="exp-sun">Sunlight <span class="val" id="exp-sun-val">${state.expState.sunlight}</span></label>
      <input id="exp-sun" type="range" min="0" max="10" step="1" value="${state.expState.sunlight}" aria-valuetext="${state.expState.sunlight} model units" />
    </div>
    <div class="meter">
      <label for="exp-water">Water <span class="val" id="exp-water-val">${state.expState.water}</span></label>
      <input id="exp-water" type="range" min="0" max="10" step="1" value="${state.expState.water}" aria-valuetext="${state.expState.water} model units" />
    </div>
  `;
  panel.appendChild(meters);

  const sun = meters.querySelector('#exp-sun');
  const water = meters.querySelector('#exp-water');
  sun.addEventListener('input', () => {
    state.expState = setConditions(state.expState, { sunlight: Number(sun.value) });
    meters.querySelector('#exp-sun-val').textContent = String(state.expState.sunlight);
    sun.setAttribute('aria-valuetext', `${state.expState.sunlight} model units`);
    state.expCompared = false;
  });
  water.addEventListener('input', () => {
    state.expState = setConditions(state.expState, { water: Number(water.value) });
    meters.querySelector('#exp-water-val').textContent = String(state.expState.water);
    water.setAttribute('aria-valuetext', `${state.expState.water} model units`);
    state.expCompared = false;
  });

  const sug = document.createElement('button');
  sug.type = 'button';
  sug.className = 'ghost';
  sug.textContent = 'Apply suggested change';
  sug.setAttribute('aria-label', sc.suggestedChangeLabel);
  sug.addEventListener('click', applySuggestedChange);
  panel.appendChild(sug);

  // Predictions
  const predH = document.createElement('h3');
  predH.textContent = 'Your prediction (before stepping)';
  panel.appendChild(predH);
  const choices = document.createElement('div');
  choices.className = 'choice-list';
  PREDICTION_CHOICES.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = c.label;
    b.setAttribute('aria-pressed', state.expPrediction === c.id ? 'true' : 'false');
    if (state.expPrediction === c.id) b.classList.add('selected');
    b.addEventListener('click', () => {
      state.expPrediction = c.id;
      state.expCompared = false;
      render();
    });
    choices.appendChild(b);
  });
  panel.appendChild(choices);

  renderIndicators(panel, state.expState, 'Current model state');

  const actions = document.createElement('div');
  actions.className = 'row-actions';
  const stepBtn = document.createElement('button');
  stepBtn.type = 'button';
  stepBtn.className = 'primary';
  stepBtn.setAttribute('data-action', 'exp-step');
  stepBtn.textContent = 'Advance 1 step';
  stepBtn.addEventListener('click', () => {
    if (!state.expPrediction) {
      state.lastFeedback = 'Pick a prediction first — then step the model.';
      render();
      return;
    }
    const before = cloneState(state.expState);
    const result = stepEcosystem(state.expState);
    state.expState = result.state;
    state.expNotes = result.notes;
    const actual = predictOutcome(before, state.expState);
    const match = predictionMatches(state.expPrediction, before, state.expState);
    state.expCompared = true;
    state.lastFeedback = match
      ? `Nice thinking — the model matched your prediction (${actual.replace('_', ' ')}). Check the step notes.`
      : `Interesting! You predicted ${state.expPrediction.replace(/_/g, ' ')}; the model showed ${actual.replace(/_/g, ' ')}. Read why below — retry anytime.`;
    // Mark done after trying at least one scenario with comparison
    state.progress.experimentDone = true;
    // Prefer completing after seeing application scenario too, but one solid compare is enough for progress
    save();
    render();
  });
  const step3 = document.createElement('button');
  step3.type = 'button';
  step3.textContent = 'Advance 3 steps';
  step3.addEventListener('click', () => {
    if (!state.expPrediction) {
      state.lastFeedback = 'Pick a prediction first — then step the model.';
      render();
      return;
    }
    const before = cloneState(state.expState);
    const result = runSteps(state.expState, 3);
    state.expState = result.state;
    state.expNotes = result.notes.slice(-8);
    const actual = predictOutcome(before, state.expState);
    const match = predictionMatches(state.expPrediction, before, state.expState);
    state.expCompared = true;
    state.lastFeedback = match
      ? `After 3 steps, the model matched your plant prediction (${actual.replace(/_/g, ' ')}).`
      : `After 3 steps: you predicted ${state.expPrediction.replace(/_/g, ' ')}; model showed ${actual.replace(/_/g, ' ')}.`;
    state.progress.experimentDone = true;
    save();
    render();
  });
  const resetSc = document.createElement('button');
  resetSc.type = 'button';
  resetSc.className = 'warn';
  resetSc.textContent = 'Reset scenario';
  resetSc.addEventListener('click', () => {
    prepareExperiment(state.expIndex);
    render();
  });
  actions.append(stepBtn, step3, resetSc);
  panel.appendChild(actions);

  const fb = document.createElement('div');
  fb.className = 'feedback' + (state.expCompared ? (state.lastFeedback.startsWith('Nice') || state.lastFeedback.startsWith('After 3 steps, the model matched') ? ' good' : ' warn') : '');
  fb.id = 'exp-feedback';
  fb.textContent = state.lastFeedback || 'Change a condition, choose a prediction, then advance the simulation.';
  panel.appendChild(fb);

  if (state.expNotes.length) {
    const nh = document.createElement('h3');
    nh.textContent = 'What changed (inspectable steps)';
    panel.appendChild(nh);
    const ul = document.createElement('ul');
    ul.className = 'notes-list';
    state.expNotes.slice(-10).forEach((n) => {
      const li = document.createElement('li');
      li.textContent = n.reason || JSON.stringify(n);
      ul.appendChild(li);
    });
    panel.appendChild(ul);
  }

  renderFoodWebList(panel, state.expState);

  if (state.progress.experimentDone) {
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'primary';
    next.textContent = 'Next: Restore balance';
    next.addEventListener('click', () => {
      state.screen = 'restore';
      prepareRestore(0);
      save();
      render();
    });
    panel.appendChild(next);
  }

  main.appendChild(panel);
}

function renderRestore(main) {
  navBar(main);
  scaffoldControls(main);
  if (!state.restoreState) prepareRestore(state.restoreIndex);
  const sc = RESTORE_SCENARIOS[state.restoreIndex];
  const diag = diagnose(state.restoreState);

  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `<h2>3. Restore balance</h2>
    <p><strong>${sc.label}</strong> <span class="subprompt">(${sc.mode})</span></p>
    <p>${sc.blurb}</p>
    <p class="subprompt"><strong>Goal:</strong> ${sc.goal}</p>`;

  const badge = document.createElement('div');
  badge.className = `status-badge ${diag.status}`;
  badge.textContent = `Status: ${diag.status} · score ${diag.score}`;
  badge.setAttribute('aria-label', `Habitat status ${diag.status}, score ${diag.score}`);
  panel.appendChild(badge);

  const picker = document.createElement('div');
  picker.className = 'row-actions';
  RESTORE_SCENARIOS.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${i + 1}. ${s.label}`;
    b.setAttribute('aria-pressed', i === state.restoreIndex ? 'true' : 'false');
    if (i === state.restoreIndex) b.classList.add('primary');
    b.addEventListener('click', () => {
      prepareRestore(i);
      save();
      render();
    });
    picker.appendChild(b);
  });
  panel.appendChild(picker);

  if (state.progress.scaffold === 'more-help') {
    const hint = document.createElement('div');
    hint.className = 'feedback hint';
    hint.textContent = diag.issues.length
      ? `Hint: ${diag.issues[0].text}`
      : 'Hint: Raise the limiting resource or restore missing food links, then step the model.';
    panel.appendChild(hint);
  }

  if (diag.issues.length) {
    const iss = document.createElement('ul');
    iss.className = 'notes-list';
    iss.setAttribute('aria-label', 'Diagnosis');
    diag.issues.forEach((i) => {
      const li = document.createElement('li');
      li.textContent = i.text;
      iss.appendChild(li);
    });
    panel.appendChild(iss);
  }

  // Condition meters
  const meters = document.createElement('div');
  meters.className = 'meter-row';
  meters.innerHTML = `
    <div class="meter">
      <label for="res-sun">Sunlight <span class="val" id="res-sun-val">${state.restoreState.sunlight}</span></label>
      <input id="res-sun" type="range" min="0" max="10" step="1" value="${state.restoreState.sunlight}" />
    </div>
    <div class="meter">
      <label for="res-water">Water <span class="val" id="res-water-val">${state.restoreState.water}</span></label>
      <input id="res-water" type="range" min="0" max="10" step="1" value="${state.restoreState.water}" />
    </div>
  `;
  panel.appendChild(meters);
  meters.querySelector('#res-sun').addEventListener('input', (e) => {
    state.restoreState = setConditions(state.restoreState, { sunlight: Number(e.target.value) });
    meters.querySelector('#res-sun-val').textContent = String(state.restoreState.sunlight);
  });
  meters.querySelector('#res-water').addEventListener('input', (e) => {
    state.restoreState = setConditions(state.restoreState, { water: Number(e.target.value) });
    meters.querySelector('#res-water-val').textContent = String(state.restoreState.water);
  });

  // Organism adjust (non-drag)
  const oh = document.createElement('h3');
  oh.textContent = 'Adjust organisms (tap + / −)';
  panel.appendChild(oh);
  const grid = document.createElement('div');
  grid.className = 'chip-grid';
  Object.keys(ORGANISMS).forEach((id) => {
    const org = ORGANISMS[id];
    const box = document.createElement('div');
    box.className = `chip ${org.role}`;
    box.innerHTML = `<strong>${org.emoji} ${org.name}</strong>
      <span class="role">model count ${popOf(state.restoreState, id)}</span>`;
    const row = document.createElement('div');
    row.className = 'row-actions';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', `Decrease ${org.name}`);
    minus.addEventListener('click', () => {
      state.restoreState = setPopulation(state.restoreState, id, popOf(state.restoreState, id) - 1);
      render();
    });
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', `Increase ${org.name}`);
    plus.addEventListener('click', () => {
      state.restoreState = setPopulation(state.restoreState, id, popOf(state.restoreState, id) + 1);
      render();
    });
    row.append(minus, plus);
    box.appendChild(row);
    grid.appendChild(box);
  });
  panel.appendChild(grid);

  renderIndicators(panel, state.restoreState, 'Current model state');
  renderFoodWebList(panel, state.restoreState);

  const actions = document.createElement('div');
  actions.className = 'row-actions';
  const stepBtn = document.createElement('button');
  stepBtn.type = 'button';
  stepBtn.className = 'primary';
  stepBtn.setAttribute('data-action', 'restore-step');
  stepBtn.textContent = 'Advance 1 step';
  stepBtn.addEventListener('click', () => {
    const result = stepEcosystem(state.restoreState);
    state.restoreState = result.state;
    state.restoreNotes = result.notes;
    const d2 = diagnose(state.restoreState);
    if (d2.status === 'healthy' && d2.score >= 60) {
      state.restoreFixed = true;
      state.progress.restoreDone = true;
      state.lastFeedback = 'Model-consistent recovery: resources and food links support a healthier habitat. Real ecosystems are more complex — this is still a model.';
    } else {
      state.lastFeedback = `Stepped. Status now ${d2.status} (score ${d2.score}). Keep adjusting — recovery comes from the model rules, not a magic win animation.`;
    }
    // Completing transfer scenario also counts
    if (sc.mode === 'transfer' && d2.score >= 55) {
      state.progress.restoreDone = true;
      state.restoreFixed = true;
    }
    save();
    render();
  });
  const step3 = document.createElement('button');
  step3.type = 'button';
  step3.textContent = 'Advance 3 steps';
  step3.addEventListener('click', () => {
    const result = runSteps(state.restoreState, 3);
    state.restoreState = result.state;
    state.restoreNotes = result.notes.slice(-8);
    const d2 = diagnose(state.restoreState);
    if (d2.score >= 60) {
      state.restoreFixed = true;
      state.progress.restoreDone = true;
      state.lastFeedback = 'After a few steps, the model shows recovery from your changes.';
    } else {
      state.lastFeedback = `After 3 steps: ${d2.status} (score ${d2.score}). Try another repair.`;
    }
    if (sc.mode === 'transfer' && d2.score >= 55) {
      state.progress.restoreDone = true;
      state.restoreFixed = true;
    }
    save();
    render();
  });
  const resetSc = document.createElement('button');
  resetSc.type = 'button';
  resetSc.className = 'warn';
  resetSc.textContent = 'Reset scenario';
  resetSc.addEventListener('click', () => {
    prepareRestore(state.restoreIndex);
    state.lastFeedback = 'Scenario reset to its starting struggle.';
    render();
  });
  actions.append(stepBtn, step3, resetSc);
  panel.appendChild(actions);

  const fb = document.createElement('div');
  fb.className = 'feedback' + (state.restoreFixed ? ' good' : '');
  fb.id = 'restore-feedback';
  fb.textContent = state.lastFeedback || 'Diagnose the issue, change conditions or organisms, then step the model.';
  panel.appendChild(fb);

  if (state.restoreNotes.length) {
    const nh = document.createElement('h3');
    nh.textContent = 'What changed';
    panel.appendChild(nh);
    const ul = document.createElement('ul');
    ul.className = 'notes-list';
    state.restoreNotes.slice(-10).forEach((n) => {
      const li = document.createElement('li');
      li.textContent = n.reason || JSON.stringify(n);
      ul.appendChild(li);
    });
    panel.appendChild(ul);
  }

  if (state.progress.restoreDone) {
    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'primary';
    done.textContent = 'See completion summary';
    done.addEventListener('click', () => {
      state.screen = 'complete';
      save();
      render();
    });
    panel.appendChild(done);
  }

  main.appendChild(panel);
}

function renderComplete(main) {
  navBar(main);
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `<h2>Lab complete — well explored!</h2>
    <p>You practised identifying producers and consumers, linking sunlight/water to plants and animals, tracing food → consumer energy flow, and predicting how one change affects a <em>model</em> ecosystem.</p>
    <div class="model-note"><strong>Remember:</strong> Willowbrook Wilds is a simplified model. Real meadows and ponds have many more species, seasons, and surprises.</div>`;

  const h = document.createElement('h3');
  h.textContent = 'Next practice ideas';
  panel.appendChild(h);
  const ul = document.createElement('ul');
  ul.className = 'tips-list';
  NEXT_PRACTICE.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    ul.appendChild(li);
  });
  panel.appendChild(ul);

  const assumptions = document.createElement('div');
  assumptions.className = 'model-note';
  assumptions.innerHTML = `<strong>Model assumptions:</strong><ul class="tips-list">${MODEL_ASSUMPTIONS.map((a) => `<li>${a}</li>`).join('')}</ul>`;
  panel.appendChild(assumptions);

  const actions = document.createElement('div');
  actions.className = 'row-actions';
  const again = document.createElement('button');
  again.type = 'button';
  again.className = 'primary';
  again.textContent = 'Replay lab (keep progress flags)';
  again.addEventListener('click', () => {
    state.screen = 'build';
    state.buildResult = null;
    prepareExperiment(0);
    prepareRestore(0);
    save();
    render();
  });
  const home = document.createElement('button');
  home.type = 'button';
  home.className = 'ghost';
  home.textContent = 'Home';
  home.addEventListener('click', () => {
    state.screen = 'home';
    save();
    render();
  });
  actions.append(again, home);
  panel.appendChild(actions);
  main.appendChild(panel);
}

function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  header(root);
  const main = document.createElement('main');
  main.id = 'main';
  root.appendChild(main);

  switch (state.screen) {
    case 'onboard': renderOnboard(main); break;
    case 'build': renderBuild(main); break;
    case 'experiment': renderExperiment(main); break;
    case 'restore': renderRestore(main); break;
    case 'complete': renderComplete(main); break;
    default: renderHome(main); break;
  }
}

load();
render();
