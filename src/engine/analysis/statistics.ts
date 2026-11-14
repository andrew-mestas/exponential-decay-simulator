/**
 * Summary statistics for a sampled time series.
 *
 * TDD scaffold: implement this function by making the statistics tests pass.
 */

import type { SeriesPoint } from "./integration";

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
  throw new Error("Not implemented: calculateSeriesStatistics");
}
