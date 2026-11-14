/**
 * Analytical and numerical integration APIs for amount-time (AUC).
 *
 * TDD scaffold: implement these functions by making the integration tests pass.
 */

import type { InputEvent } from "../contribution/contribution";
import { decayConstant } from "../decay/decay";

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
  if (!Number.isFinite(_startTime) || !Number.isFinite(_endTime)) {
    throw new Error("Interval boundaries must be finite");
  }

  if (_endTime < _startTime) {
    throw new Error("End time must not precede start time");
  }

  const k = decayConstant(_halfLife);

  if (_startTime === _endTime || _events.length === 0) {
    return 0;
  }

  let totalAuc = 0;

  for (const event of _events) {
    if (
      !Number.isFinite(event.timestamp) ||
      !Number.isFinite(event.amount) ||
      event.amount < 0
    ) {
      throw new Error("Invalid event");
    }

    // Events at or after the interval end contribute no area.
    if (event.timestamp >= _endTime) {
      continue;
    }

    // An event cannot contribute before it occurs.
    const effectiveStart = Math.max(_startTime, event.timestamp);

    const startDecay = Math.exp(-k * (effectiveStart - event.timestamp));

    const endDecay = Math.exp(-k * (_endTime - event.timestamp));

    totalAuc += (event.amount / k) * (startDecay - endDecay);
  }

  return totalAuc;
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
