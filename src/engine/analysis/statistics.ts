/**
 * Summary statistics for a sampled time series.
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
  points: SeriesPoint[],
): SeriesStatistics {
  if (points.length < 2) {
    throw new Error("Need at least two points to calculate time-weighted statistics");
  }

  // The integrator validates finite values and strictly increasing timestamps.
  const auc = integrateTrapezoidal(points);
  const duration = points[points.length - 1].timestamp - points[0].timestamp;
  const average = auc / duration;

  let min = points[0].value;
  let max = points[0].value;
  let minTime = points[0].timestamp;
  let maxTime = points[0].timestamp;

  for (const point of points.slice(1)) {
    if (point.value < min) {
      min = point.value;
      minTime = point.timestamp;
    }
    if (point.value > max) {
      max = point.value;
      maxTime = point.timestamp;
    }
  }

  return { min, max, minTime, maxTime, auc, average };
}
