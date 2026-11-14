# Exponential Decay Simulator

An interactive React + TypeScript simulator for exploring exponential decay and accumulation from one or more timestamped inputs.

The project is being developed test-first: the mathematical engine is specified independently of the UI, with deterministic unit tests and property-based tests for important invariants.

## Project goals

- Model first-order exponential decay using a configurable half-life.
- Add multiple inputs at arbitrary elapsed-time timestamps.
- Show each input's remaining contribution and the combined system amount.
- Support elapsed-time and real-world date/time views while keeping one canonical numeric time axis internally.
- Compare input schedules using peaks, troughs, averages, and cumulative exposure (area under the curve, AUC).
- Keep the mathematical engine pure, deterministic, and independent of React.

## Mathematical model

For a single input of amount $D_i$ at time $t_i$, with half-life $T_{1/2}$, its contribution at time $t$ is:

$$
C_i(t) =
\begin{cases}
0, & t < t_i \\
D_i \cdot 2^{-\frac{t-t_i}{T_{1/2}}}, & t \ge t_i
\end{cases}
$$

The combined amount is the sum of all inputs that have occurred:

$$
A(t) = \sum_{i:t_i \le t} D_i \cdot 2^{-\frac{t-t_i}{T_{1/2}}}
$$

Equivalently, define the decay constant as:

$$
k = \frac{\ln(2)}{T_{1/2}}
$$

Then each contribution can be written in exponential form:

$$
C_i(t) = D_i e^{-k(t-t_i)}
$$

For chronologically sorted events, the same state can be computed recursively:

$$
A_n = A_{n-1}e^{-k(t_n-t_{n-1})} + D_n
$$

The direct-sum implementation will serve as the simple reference implementation; the recurrence implementation will be checked against it.

### Cumulative exposure (AUC)

The definite integral over a selected interval measures the amount accumulated over time. We denote this area under the curve by AUC:

$$
\mathrm{AUC}(a,b) = \int_a^b A(t)\,dt
$$

Its units are amount multiplied by time (for example, unit-hours), not amount.

The time-weighted average amount over the interval is:

$$
A_{\mathrm{avg}} = \frac{\mathrm{AUC}(a,b)}{b-a}
$$

AUC is useful for comparing the overall profile of two schedules, while the instantaneous value and peak describe the amount at a particular time and the maximum reached.

> **Model boundary:** This is a mathematical first-order, single-compartment decay model with instantaneous inputs. Its output is an abstract amount, not automatically a physical concentration, biological exposure, or dosing recommendation. Real systems may require absorption delays, distribution compartments, nonlinear elimination, or other domain-specific parameters.

## Initial scope (v1)

- One exponential decay process with a configurable half-life.
- Instantaneous input events with an amount and timestamp.
- Irregular and simultaneous event timestamps.
- Individual contribution curves and a combined curve.
- Direct evaluation and a chronological recurrence calculation.
- Fixed-resolution sampling initially; adaptive sampling can be considered later.
- Basic statistics and AUC, with analytical results used to validate numerical integration.
- Session-only state; no persistence requirement for v1.

Duration-based inputs, multi-compartment models, and saved simulations are outside the initial scope.

## Architecture

The mathematical engine must not import React or depend on browser/UI state.

Suggested organization as implementation grows:

```text
src/
├── engine/
│   ├── decay/
│   ├── contribution/
│   ├── accumulation/
│   └── analysis/
├── models/
├── time/
├── components/
│   ├── charts/
│   ├── controls/
│   └── statistics/
└── tests/
    ├── unit/
    ├── properties/
    └── integration/
```

Engine functions should be pure where practical. Validate inputs at public engine boundaries, keep full precision during calculations, and format/round only for display.

## Development

Requirements: Node.js and npm.

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Run tests once:

```bash
npm run test:run
```

Run tests in watch mode:

```bash
npm run test
```

Run lint and production build:

```bash
npm run lint
npm run build
```

The repository uses **Vitest** for unit/integration tests and **fast-check** for property-based testing. The Vite/Vitest configuration currently discovers `src/**/*.test.ts` files in a Node environment.

## Test-driven development workflow

For each engine capability:

1. Read the relevant test and its behavioral contract.
2. Run the focused test and confirm it fails for the expected reason (the implementation may not exist yet).
3. Implement the smallest change that makes the test pass.
4. Run the focused test, then the full test suite.
5. Refactor while keeping the tests green.

Use approximate comparisons for floating-point results; do not require exact equality for exponential calculations. Property tests should check invariants such as decay composition, non-increasing decay, superposition, scaling, event-order independence, and agreement between direct and recurrence calculations.

### Initial implementation order

1. Decay constant and remaining fraction.
2. Individual event contribution.
3. Direct accumulation over events.
4. Recurrence-based accumulation and equivalence checks.
5. Sampling and discontinuity handling at input times.
6. Analytical AUC and numerical integration checks.
7. Peaks, troughs, and time-weighted statistics.
8. React visualization and controls.

## Current status

The repository scaffold and test tooling are in place. The initial TDD suite specifies the decay-model contract; tests are intentionally expected to fail until the corresponding implementation is written.
