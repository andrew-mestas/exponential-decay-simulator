/**
 * Summary statistics for a sampled time series.
 *
 * TDD scaffold: implement this function by making the statistics tests pass.
 */

import { integrateTrapezoidal, type SeriesPoint } from "./integration";

export interface SeriesStatistics {
  min: number;
  max: number;
  minTime: number;
  maxTime: number;
  auc: number;
  average: number;
}

export function calculateSeriesStatistics(
  _points: SeriesPoint[],
): SeriesStatistics {
  if (_points.length === 1) throw new Error("Need more than one point");
  let min = Number.MAX_VALUE;
  let max = Number.MIN_VALUE;
  let minTime = Number.MAX_VALUE;
  let maxTime = Number.MIN_VALUE;
  const auc = integrateTrapezoidal(_points);
  const average =
    auc / (_points[_points.length - 1].timestamp - _points[0].timestamp);
  for (const point of _points) {
    if (point.value < min) {
      min = point.value;
      minTime = point.timestamp;
    }
    if (point.value > max) {
      max = point.value;
      maxTime = point.timestamp;
    }
  }
  return {
    min,
    max,
    minTime,
    maxTime,
    auc,
    average,
  };
}
