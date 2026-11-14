import { describe, expect, it } from "vitest";
import {
  calculateContributionsAt,
  calculateTotalAt,
} from "../../engine/accumulation/direct";

const doses = [
  { id: "a", timestamp: 0, amount: 100 },
  { id: "b", timestamp: 24, amount: 100 },
  { id: "c", timestamp: 48, amount: 100 },
];

describe("direct accumulation", () => {
  it("returns zero when there are no input events", () => {
    expect(calculateTotalAt([], 24, 36)).toBe(0);
  });

  it("returns the amount of a single input at its timestamp", () => {
    expect(calculateTotalAt([doses[0]], 0, 36)).toBeCloseTo(100, 12);
  });

  it("sums contributions from all inputs that have occurred", () => {
    const expected = 100 + 100 * 2 ** (-24 / 36) + 100 * 2 ** (-48 / 36);
    expect(calculateTotalAt(doses, 48, 36)).toBeCloseTo(expected, 10);
  });

  it("does not include future input events", () => {
    expect(calculateTotalAt(doses, 12, 36)).toBeCloseTo(
      100 * 2 ** (-12 / 36),
      12,
    );
  });

  it("handles irregular event intervals and different amounts", () => {
    const events = [
      { id: "x", timestamp: 0, amount: 40 },
      { id: "y", timestamp: 12, amount: 50 },
      { id: "z", timestamp: 37, amount: 65 },
    ];
    const expected =
      40 * 2 ** (-37 / 36) +
      50 * 2 ** (-25 / 36) +
      65;
    expect(calculateTotalAt(events, 37, 36)).toBeCloseTo(expected, 10);
  });

  it("handles simultaneous events by adding their amounts", () => {
    const events = [
      { id: "first", timestamp: 10, amount: 25 },
      { id: "second", timestamp: 10, amount: 75 },
    ];
    expect(calculateTotalAt(events, 10, 36)).toBeCloseTo(100, 12);
  });

  it("is independent of input event ordering", () => {
    expect(calculateTotalAt(doses, 60, 36)).toBeCloseTo(
      calculateTotalAt([...doses].reverse(), 60, 36),
      12,
    );
  });

  it("returns each event contribution with its event id", () => {
    const contributions = calculateContributionsAt(doses, 48, 36);
    expect(contributions).toHaveLength(3);
    expect(contributions.map((item) => item.eventId)).toEqual(["a", "b", "c"]);
    expect(contributions[2].amount).toBeCloseTo(100, 12);
    expect(contributions.reduce((sum, item) => sum + item.amount, 0)).toBeCloseTo(
      calculateTotalAt(doses, 48, 36),
      12,
    );
  });

  it("rejects duplicate event ids", () => {
    const events = [
      { id: "duplicate", timestamp: 0, amount: 10 },
      { id: "duplicate", timestamp: 1, amount: 10 },
    ];
    expect(() => calculateTotalAt(events, 2, 36)).toThrow();
  });

  it("rejects negative event amounts", () => {
    expect(() =>
      calculateTotalAt([{ id: "bad", timestamp: 0, amount: -1 }], 1, 36),
    ).toThrow();
  });
});
