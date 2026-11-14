/**
 * Analytical and numerical integration APIs for amount-time (AUC).
 *
 * TDD scaffold: implement these functions by making the integration tests pass.
 */

import type { InputEvent } from "../contribution/contribution";

export interface SeriesPoint {
  timestamp: number;
  value: number;
}

export function calculateAuc(
  _events: InputEvent[],
  _startTime: number,
  _endTime: number,
  _halfLife: number,
): number {
  throw new Error("Not implemented: calculateAuc");
}

export function integrateTrapezoidal(_points: SeriesPoint[]): number {
  throw new Error("Not implemented: integrateTrapezoidal");
}
