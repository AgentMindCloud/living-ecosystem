# Living Ecosystem Lab — Willowbrook Wilds

Free, static educational website (~age 9) for exploring a **simplified living ecosystem model**: producers and consumers, sunlight and water, food relationships (energy from food → consumer), prediction, and restoring balance. Original **Willowbrook Wilds** meadow-pond theme. No login, ads, analytics, or wallets.

**Live preview:** https://agentmindcloud.github.io/living-ecosystem/

**TaskMarket:** TSK-CC85RST4 / `0x7ab63b173fc2c8e89fbbe596767d0c0e3d33cf8de1c958bfee4e57367efde537` (free submission path, paid=false).

## Quick start (no install)

ES modules need HTTP (not `file://`):

```bash
python3 -m http.server 8080
# open http://127.0.0.1:8080/
```

Or: `npx --yes serve -l 8080`

**No build step.** Production = these files.

## Features

1. **Build a habitat** — choose ≥2 producers, ≥2 herbivores, ≥1 predator; see explained food→consumer links.
2. **Predict & experiment** — change sunlight/water, pick a prediction, step the deterministic model, compare (≥3 scenarios including a fresh application).
3. **Restore balance** — diagnose struggling habitats; repair conditions or organisms; includes an unfamiliar transfer scenario.

Also: onboarding, nav, progress, hints, More/Less help, reset without reload, optional `localStorage` with clear Reset.

## Automated tests

```bash
node tests/test_domain.mjs
```

Requires Node 18+ (ESM). See `TEST_REPORT.md`.

## Architecture note

- `js/data.js` — learning copy, scenarios, dictionary.
- `js/domain.js` — pure deterministic ecosystem model (bounded values).
- `js/app.js` — UI state machine; progress in memory/`localStorage` only.

## Privacy & safety

- No login, wallet, email, ads, analytics, or tracking
- No learner demographics collection
- No runtime generative AI or paid APIs
- Progress stays in the browser only

## Supported browsers / viewports

- Current Chrome, Firefox, Safari, Edge; Mobile Safari / Chrome Android
- Designed for 360px, 768px, 1280px widths
- Keyboard accessible; `prefers-reduced-motion` respected

## Known limitations

- Discrete, tiny food web — not a scientific population model.
- Predation is abstract (counts change); no graphic violence.
- English UI; adult references live in `EDUCATOR_GUIDE.md`.

## License

MIT — see `LICENSE`.
