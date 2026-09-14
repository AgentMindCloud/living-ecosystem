# TEST_REPORT — Willowbrook Wilds / Living Ecosystem Lab

Task: TSK-CC85RST4 / `0x7ab63b173fc2c8e89fbbe596767d0c0e3d33cf8de1c958bfee4e57367efde537`

Date: 2026-09-14. Environment: Linux box, Node v20.19.2, Google Chrome headless, python3 http.server.

**Do not invent results.** Figures below are from actual runs in this session.

## Automated domain tests

Command:

```bash
node tests/test_domain.mjs
```

**Result: Passed: 71 / Failed: 0**

Coverage includes: clamp/sanitize bounds; food-web direction food→consumer; build viability (≥2 producers, ≥2 herbivores, ≥1 predator, food present); plant growth response to water/sunlight; drought vs wet multi-step plant change; consumer without food declines; predator without prey declines; resource restore → plant recovery; deterministic identical fingerprints; no negative/Inf/NaN; reset to scenario; prediction match/mismatch; diagnose/health; progress percent; availableFood/consumerDelta helpers.

## Acceptance examples → evidence

| Acceptance example | Evidence |
|---|---|
| Lowering water → explainable plant growth change across steps | `runSteps` wet vs dry plant totals; `plantGrowthDelta` tiers; UI step notes. Tests PASS. |
| Consumer without food cannot thrive indefinitely | Grasshoppers with 0 plants decline over steps; frogs with 0 prey decline. Tests PASS. |
| Restoring resources → model-consistent recovery | After drought, raise water → plant totals increase (not a win animation). Tests PASS. Screenshot `restore-1280.png`. |
| Identical starts/actions → identical results | `stateFingerprint` equality after cloned runs. Tests PASS. |
| No negative / infinite / NaN populations/resources | `assertFiniteState` / `sanitizeState` / chaos 10-step run. Tests PASS. |
| Reset returns organisms, controls, predictions, indicators to start | `resetToScenario` restores sunlight/water/pops/step/history; UI Reset scenario + global Reset. Tests PASS. |

## Manual / browser checks (Chrome headless + live local server)

| Check | Viewport | Steps | Outcome |
|---|---|---|---|
| Home loads | 1280×800 | Open `/` | Willowbrook Wilds start; 0% progress. Shot: `home-1280.png` |
| Mobile layout | 360×740 | Open `/` | No horizontal document overflow. Shot: `home-360.png` |
| Build activity | 1280 | Onboard → select viable set → Check | Relationships explained. Shot: `build-1280.png` |
| Experiment | 1280 | Predict → step | Feedback + notes. Shot: `experiment-1280.png` |
| Experiment tablet | 768 | Nav to experiment | No overflow. Shot: `experiment-768.png` |
| Restore | 1280 | Nav to restore drought | Diagnosis + controls. Shot: `restore-1280.png` |
| Keyboard | 1280 | Tab / buttons | Semantic buttons, skip link, focus-visible styles |
| Reset | — | Reset confirm | Clears `localStorage` key `willowbrook-wilds-v1` |
| Reduced motion | CSS | `prefers-reduced-motion: reduce` | Animations/transitions forced off |

## Numbered screenshot walkthrough

1. `assets/screenshots/home-1280.png` — Home + adult tips (1280)  
2. `assets/screenshots/home-360.png` — Mobile home (360)  
3. `assets/screenshots/build-1280.png` — Activity 1 Build habitat (viable check)  
4. `assets/screenshots/experiment-1280.png` — Activity 2 Predict & experiment after step  
5. `assets/screenshots/experiment-768.png` — Experiment at tablet width (768)  
6. `assets/screenshots/restore-1280.png` — Activity 3 Restore balance  

(Video omitted; numbered screenshots satisfy walkthrough requirement.)

## Known limitations observed

- Tiny discrete food web — educational model only.
- Predation represented as count changes with text notes (age-appropriate, non-graphic).
