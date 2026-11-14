import { describe, expect, it } from "vitest";
import { runSimulation } from "../../engine/analysis/simulation";
import type { InputEvent } from "../../engine/contribution/contribution";

function expectValuesToBeCloseTo(actual: number[], expected: number[]): void {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, index) => {
    expect(value).toBeCloseTo(expected[index], 12);
  });
}

describe("runSimulation", () => {
  const events: InputEvent[] = [
    { id: "first", timestamp: 0, amount: 100 },
    { id: "second", timestamp: 1, amount: 40 },
  ];

  it("returns contribution and combined curves at each sample time", () => {
    const result = runSimulation({
      events,
      halfLife: 1,
      startTime: 0,
      endTime: 2,
      sampleInterval: 1,
    });

    expect(result.sampleTimes).toEqual([0, 1, 2]);
    expect(result.contributions.map((series) => series.eventId)).toEqual([
      "first",
      "second",
    ]);
    expectValuesToBeCloseTo(
      result.contributions[0].points.map((point) => point.value),
      [100, 50, 25],
    );
    expectValuesToBeCloseTo(
      result.contributions[1].points.map((point) => point.value),
      [0, 40, 20],
    );
    expectValuesToBeCloseTo(
      result.total.map((point) => point.value),
      [100, 90, 45],
    );
  });

  it("always includes the exact end time when the interval is not divisible by the sample interval", () => {
    const result = runSimulation({
      events: [],
      halfLife: 2,
      startTime: 0,
      endTime: 2.5,
      sampleInterval: 1,
    });

    expect(result.sampleTimes).toEqual([0, 1, 2, 2.5]);
    expect(result.total.map((point) => point.value)).toEqual([0, 0, 0, 0]);
    expect(result.auc).toBe(0);
    expect(result.statistics.average).toBe(0);
  });

  it("returns analytical AUC for each event and for the combined curve", () => {
    const result = runSimulation({
      events,
      halfLife: 1,
      startTime: 0,
      endTime: 2,
      sampleInterval: 0.25,
    });

    const individualAuc = result.contributions.reduce(
      (sum, contribution) => sum + contribution.auc,
      0,
    );
    expect(result.auc).toBeCloseTo(individualAuc, 12);
    expect(result.statistics.auc).toBeGreaterThan(0);
    expect(result.statistics.average).toBeCloseTo(result.statistics.auc / 2, 12);
  });

  it("preserves input order and does not mutate the supplied events", () => {
    const unsorted = [events[1], events[0]];
    const original = structuredClone(unsorted);

    const result = runSimulation({
      events: unsorted,
      halfLife: 1,
      startTime: 0,
      endTime: 2,
      sampleInterval: 1,
    });

    expect(result.contributions.map((series) => series.eventId)).toEqual([
      "second",
      "first",
    ]);
    expect(unsorted).toEqual(original);
  });

  it("handles events before and after the simulation interval", () => {
    const result = runSimulation({
      events: [
        { id: "past", timestamp: -1, amount: 8 },
        { id: "future", timestamp: 5, amount: 20 },
      ],
      halfLife: 1,
      startTime: 0,
      endTime: 2,
      sampleInterval: 1,
    });

    expect(result.contributions[0].points[0].value).toBeCloseTo(4, 12);
    expect(result.contributions[1].points.every((point) => point.value === 0)).toBe(
      true,
    );
    expect(result.contributions[1].auc).toBe(0);
  });

  it("rejects invalid simulation bounds and sample intervals", () => {
    const base = {
      events,
      halfLife: 1,
      startTime: 0,
      endTime: 2,
      sampleInterval: 1,
    };

    expect(() => runSimulation({ ...base, endTime: 0 })).toThrow();
    expect(() => runSimulation({ ...base, endTime: Number.NaN })).toThrow();
    expect(() => runSimulation({ ...base, sampleInterval: 0 })).toThrow();
    expect(() =>
      runSimulation({ ...base, sampleInterval: Number.POSITIVE_INFINITY }),
    ).toThrow();
  });

  it("rejects invalid events, duplicate IDs, and invalid half-life", () => {
    const base = {
      events,
      halfLife: 1,
      startTime: 0,
      endTime: 2,
      sampleInterval: 1,
    };

    expect(() =>
      runSimulation({
        ...base,
        events: [{ id: "bad", timestamp: Number.NaN, amount: 1 }],
      }),
    ).toThrow();
    expect(() =>
      runSimulation({
        ...base,
        events: [
          { id: "duplicate", timestamp: 0, amount: 1 },
          { id: "duplicate", timestamp: 1, amount: 2 },
        ],
      }),
    ).toThrow();
    expect(() => runSimulation({ ...base, halfLife: 0 })).toThrow();
  });

  it("rejects a simulation that would generate too many sample points", () => {
    expect(() =>
      runSimulation({
        events: [],
        halfLife: 1,
        startTime: 0,
        endTime: 100_001,
        sampleInterval: 1,
      }),
    ).toThrow(/maximum/);
  });
});
