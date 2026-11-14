/**
 * Pure orchestration for a complete single-compartment decay simulation.
 *
 * Timestamps and sampleInterval must use the same time unit as halfLife.
 */

import {
  calculateTotalAt,
  type InputEvent,
} from "../accumulation/direct";
import { calculateContribution } from "../contribution/contribution";
import { decayConstant } from "../decay/decay";
import { calculateAuc } from "./integration";
import type { SeriesPoint } from "./integration";
import {
  calculateSeriesStatistics,
  type SeriesStatistics,
} from "./statistics";

const MAX_SAMPLE_POINTS = 100_000;

export interface SimulationConfig {
  events: InputEvent[];
  halfLife: number;
  startTime: number;
  endTime: number;
  sampleInterval: number;
}

export interface SimulationContributionSeries {
  eventId: string;
  points: SeriesPoint[];
  auc: number;
}

export interface SimulationResult {
  /** Sampled curve for each input event, preserving the caller's event order. */
  contributions: SimulationContributionSeries[];
  /** Sum of all event contributions at each sample timestamp. */
  total: SeriesPoint[];
  /** Exact analytical area under the combined curve over the requested interval. */
  auc: number;
  /** Sample-derived min, max, extrema times, and trapezoidal AUC/average. */
  statistics: SeriesStatistics;
  /** Actual timestamps used, including the exact end time. */
  sampleTimes: number[];
}

function validateConfig(config: SimulationConfig): void {
  if (
    !Number.isFinite(config.startTime) ||
    !Number.isFinite(config.endTime) ||
    config.endTime <= config.startTime
  ) {
    throw new Error("Simulation endTime must be finite and after startTime");
  }

  if (!Number.isFinite(config.sampleInterval) || config.sampleInterval <= 0) {
    throw new Error("sampleInterval must be a finite positive number");
  }

  // Validate half-life even when there are no input events.
  decayConstant(config.halfLife);

  const seen = new Set<string>();
  for (const event of config.events) {
    if (
      typeof event.id !== "string" ||
      event.id.trim().length === 0 ||
      !Number.isFinite(event.timestamp) ||
      !Number.isFinite(event.amount) ||
      event.amount < 0
    ) {
      throw new Error("Each event must have an ID, finite timestamp, and nonnegative finite amount");
    }

    if (seen.has(event.id)) {
      throw new Error("Duplicate event ID found");
    }
    seen.add(event.id);
  }

  const intervalCount = (config.endTime - config.startTime) / config.sampleInterval;
  if (!Number.isFinite(intervalCount) || intervalCount + 2 > MAX_SAMPLE_POINTS) {
    throw new Error(`Simulation exceeds the maximum of ${MAX_SAMPLE_POINTS} sample points`);
  }
}

function createSampleTimes(
  startTime: number,
  endTime: number,
  sampleInterval: number,
): number[] {
  const intervalCount = Math.floor((endTime - startTime) / sampleInterval);
  const times = Array.from(
    { length: intervalCount + 1 },
    (_, index) => startTime + index * sampleInterval,
  );

  // Always include the requested endpoint, even when the interval is not
  // evenly divisible by sampleInterval.
  if (times[times.length - 1] !== endTime) {
    times.push(endTime);
  }

  return times;
}

/**
 * Runs a deterministic simulation without mutating the supplied events.
 * The analytical AUC is kept separate from the sampled trapezoidal AUC in
 * statistics because the latter is an approximation at the chosen resolution.
 */
export function runSimulation(config: SimulationConfig): SimulationResult {
  validateConfig(config);

  const sampleTimes = createSampleTimes(
    config.startTime,
    config.endTime,
    config.sampleInterval,
  );

  const contributions = config.events.map((event) => ({
    eventId: event.id,
    points: sampleTimes.map((timestamp) => ({
      timestamp,
      value: calculateContribution(event, timestamp, config.halfLife),
    })),
    auc: calculateAuc(
      [event],
      config.startTime,
      config.endTime,
      config.halfLife,
    ),
  }));

  const total = sampleTimes.map((timestamp) => ({
    timestamp,
    value: calculateTotalAt(
      config.events,
      timestamp,
      config.halfLife,
    ),
  }));

  const auc = calculateAuc(
    config.events,
    config.startTime,
    config.endTime,
    config.halfLife,
  );

  return {
    contributions,
    total,
    auc,
    statistics: calculateSeriesStatistics(total),
    sampleTimes,
  };
}
