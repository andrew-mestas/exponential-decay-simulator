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
  if (_points.length < 2) {
    return 0;
  }

  for (let i = 0; i < _points.length; i++) {
    const point = _points[i];

    if (!Number.isFinite(point.timestamp)) {
      throw new Error("Point timestamps must be finite");
    }

    if (!Number.isFinite(point.value)) {
      throw new Error("Point values must be finite");
    }

    if (i > 0 && point.timestamp <= _points[i - 1].timestamp) {
      throw new Error("Point timestamps must be strictly increasing");
    }
  }

  let total = 0;

  for (let i = 0; i < _points.length - 1; i++) {
    const current = _points[i];
    const next = _points[i + 1];
    const width = next.timestamp - current.timestamp;
    const averageHeight = (current.value + next.value) / 2;

    total += averageHeight * width;
  }

  return total;
}
