import { describe, expect, it } from "vitest";
import { calculateSeriesStatistics } from "../../engine/analysis/statistics";

describe("calculateSeriesStatistics", () => {
  it("returns min, max, AUC, and time-weighted average", () => {
    const result = calculateSeriesStatistics([
      { timestamp: 0, value: 0 },
      { timestamp: 1, value: 2 },
      { timestamp: 2, value: 0 },
    ]);

    expect(result.min).toBe(0);
    expect(result.max).toBe(2);
    expect(result.auc).toBeCloseTo(2, 12);
    expect(result.average).toBeCloseTo(1, 12);
    expect(result.minTime).toBe(0);
    expect(result.maxTime).toBe(1);
  });

  it("handles a constant series", () => {
    const result = calculateSeriesStatistics([
      { timestamp: 0, value: 7 },
      { timestamp: 3, value: 7 },
    ]);
    expect(result.min).toBe(7);
    expect(result.max).toBe(7);
    expect(result.auc).toBeCloseTo(21, 12);
    expect(result.average).toBeCloseTo(7, 12);
  });

  it("rejects an empty series", () => {
    expect(() => calculateSeriesStatistics([])).toThrow();
  });

  it("rejects a series with only one point because its time average is undefined", () => {
    expect(() =>
      calculateSeriesStatistics([{ timestamp: 0, value: 5 }]),
    ).toThrow();
  });
});
