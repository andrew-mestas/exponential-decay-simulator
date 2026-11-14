import { describe, expect, it } from "vitest";
import {
  calculateAuc,
  integrateTrapezoidal,
} from "../../engine/analysis/integration";

describe("analytical AUC", () => {
  it("integrates a single exponential contribution over two half-lives", () => {
    const expected = (100 / (Math.LN2 / 36)) * (1 - 2 ** -2);
    const actual = calculateAuc(
      [{ id: "dose", timestamp: 0, amount: 100 }],
      0,
      72,
      36,
    );
    expect(actual).toBeCloseTo(expected, 9);
  });

  it("integrates only the portion of a curve after the interval start", () => {
    const expected = (100 / (Math.LN2 / 36)) * (0.5 - 0.25);
    const actual = calculateAuc(
      [{ id: "dose", timestamp: 0, amount: 100 }],
      36,
      72,
      36,
    );
    expect(actual).toBeCloseTo(expected, 9);
  });

  it("does not include a dose that occurs at or after the interval end", () => {
    const actual = calculateAuc(
      [{ id: "future", timestamp: 72, amount: 100 }],
      0,
      72,
      36,
    );
    expect(actual).toBe(0);
  });

  it("integrates multiple and irregularly timed inputs by superposition", () => {
    const events = [
      { id: "a", timestamp: 0, amount: 100 },
      { id: "b", timestamp: 12, amount: 50 },
      { id: "c", timestamp: 48, amount: 25 },
    ];
    const total = calculateAuc(events, 0, 96, 36);
    const separate = events.reduce(
      (sum, event) => sum + calculateAuc([event], 0, 96, 36),
      0,
    );
    expect(total).toBeCloseTo(separate, 9);
  });

  it("is additive across adjacent time intervals", () => {
    const events = [
      { id: "a", timestamp: 0, amount: 100 },
      { id: "b", timestamp: 24, amount: 40 },
    ];
    const whole = calculateAuc(events, 0, 72, 36);
    const split =
      calculateAuc(events, 0, 24, 36) +
      calculateAuc(events, 24, 72, 36);
    expect(whole).toBeCloseTo(split, 9);
  });

  it("returns zero for an empty interval", () => {
    expect(calculateAuc([], 10, 10, 36)).toBe(0);
  });

  it("rejects an interval whose end precedes its start", () => {
    expect(() => calculateAuc([], 10, 0, 36)).toThrow();
  });

  it("rejects a non-positive half-life", () => {
    expect(() =>
      calculateAuc([{ id: "a", timestamp: 0, amount: 1 }], 0, 10, 0),
    ).toThrow();
  });
});

describe("trapezoidal numerical integration", () => {
  it("integrates a constant series exactly", () => {
    expect(
      integrateTrapezoidal([
        { timestamp: 0, value: 5 },
        { timestamp: 2, value: 5 },
        { timestamp: 4, value: 5 },
      ]),
    ).toBeCloseTo(20, 12);
  });

  it("integrates a straight line exactly", () => {
    expect(
      integrateTrapezoidal([
        { timestamp: 0, value: 0 },
        { timestamp: 1, value: 2 },
        { timestamp: 2, value: 4 },
      ]),
    ).toBeCloseTo(4, 12);
  });

  it("approximates the analytical AUC of a sampled exponential curve", () => {
    const points = Array.from({ length: 10_001 }, (_, index) => {
      const timestamp = (72 * index) / 10_000;
      return {
        timestamp,
        value: 100 * 2 ** (-timestamp / 36),
      };
    });

    const numerical = integrateTrapezoidal(points);
    const analytical = calculateAuc(
      [{ id: "dose", timestamp: 0, amount: 100 }],
      0,
      72,
      36,
    );

    expect(numerical).toBeCloseTo(analytical, 5);
  });

  it("returns zero for fewer than two points", () => {
    expect(integrateTrapezoidal([])).toBe(0);
    expect(integrateTrapezoidal([{ timestamp: 0, value: 10 }])).toBe(0);
  });

  it("rejects points that are not in strictly increasing time order", () => {
    expect(() =>
      integrateTrapezoidal([
        { timestamp: 1, value: 2 },
        { timestamp: 1, value: 3 },
      ]),
    ).toThrow();
    expect(() =>
      integrateTrapezoidal([
        { timestamp: 2, value: 2 },
        { timestamp: 1, value: 3 },
      ]),
    ).toThrow();
  });

  it("rejects non-finite timestamps or values", () => {
    expect(() =>
      integrateTrapezoidal([
        { timestamp: 0, value: 1 },
        { timestamp: Number.POSITIVE_INFINITY, value: 2 },
      ]),
    ).toThrow();
    expect(() =>
      integrateTrapezoidal([
        { timestamp: 0, value: 1 },
        { timestamp: 1, value: Number.NaN },
      ]),
    ).toThrow();
  });
});
