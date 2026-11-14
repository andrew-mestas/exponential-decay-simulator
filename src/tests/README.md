# Test organization and contracts

The suite is organized around the mathematical engine. Tests intentionally import production modules at their planned paths; implementation files are added as the TDD work progresses.

## Unit tests

- `unit/decay.test.ts`: half-life conversion, remaining fractions, and invalid parameter handling.
- `unit/contribution.test.ts`: one event's contribution at, before, and after its timestamp.
- `unit/accumulation.test.ts`: direct summation, future events, irregular intervals, simultaneous events, event ordering, and validation.
- `unit/recurrence.test.ts`: chronological state-transition calculation and equivalence with direct summation.
- `unit/integration.test.ts`: analytical AUC, interval additivity, and trapezoidal numerical integration.
- `unit/statistics.test.ts`: extrema, extrema timestamps, AUC, and time-weighted average.

## Property-based tests

- `properties/decay.properties.test.ts`: monotonicity, composition, and remaining-fraction bounds.
- `properties/accumulation.properties.test.ts`: event-order independence, superposition, linear scaling, and direct/recurrence equivalence.

## Behavioral contracts

The tests establish these initial engine interfaces:

- `decayConstant(halfLife)` and `remainingFraction(elapsed, halfLife)`
- `calculateContribution(event, observationTime, halfLife)`
- `calculateContributionsAt(events, observationTime, halfLife)` and `calculateTotalAt(events, observationTime, halfLife)`
- `calculateTotalAtByRecurrence(events, observationTime, halfLife)`
- `calculateAuc(events, startTime, endTime, halfLife)`
- `integrateTrapezoidal(points)`
- `calculateSeriesStatistics(points)`

An event has `{ id, timestamp, amount }`. A contribution result has `{ eventId, amount }`. A sampled point has `{ timestamp, value }`. Statistics return `{ min, max, minTime, maxTime, auc, average }`.

All timestamps and half-lives must use the same time unit. The initial model accepts nonnegative input amounts, positive finite half-lives, and finite timestamps. Observation times before the first event are valid and produce zero contribution. AUC is zero for an empty interval and rejects an end time earlier than its start.

Use `npm run test:run` for a one-shot run or `npm run test` for watch mode. Tests are expected to fail until their corresponding engine modules are implemented.
