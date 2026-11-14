# Test organization

- `unit/`: deterministic examples and input validation contracts.
- `properties/`: generated-input invariants using fast-check.
- `integration/`: cross-module and numerical-consistency checks as the engine grows.

Tests import production modules by their intended paths. It is expected that the initial decay tests fail until `src/engine/decay/decay.ts` is implemented.

Use `npm run test:run` for a one-shot test run or `npm run test` for watch mode.
