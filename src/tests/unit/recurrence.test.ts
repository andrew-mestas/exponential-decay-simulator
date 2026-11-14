import { describe, expect, it } from "vitest";
import { calculateTotalAt } from "../../engine/accumulation/direct";
import { calculateTotalAtByRecurrence } from "../../engine/accumulation/recurrence";

describe("recurrence accumulation", () => {
  const events = [
    { id: "late", timestamp: 48, amount: 60 },
    { id: "early", timestamp: 0, amount: 100 },
    { id: "middle", timestamp: 17.5, amount: 35 },
    { id: "same-time", timestamp: 17.5, amount: 15 },
  ];

  it("matches direct evaluation for an observation after all events", () => {
    expect(calculateTotalAtByRecurrence(events, 72, 36)).toBeCloseTo(
      calculateTotalAt(events, 72, 36),
      10,
    );
  });

  it("matches direct evaluation when observation time falls between events", () => {
    expect(calculateTotalAtByRecurrence(events, 30, 36)).toBeCloseTo(
      calculateTotalAt(events, 30, 36),
      10,
    );
  });

  it("matches direct evaluation before the first event", () => {
    expect(calculateTotalAtByRecurrence(events, -1, 36)).toBe(0);
  });

  it("handles unsorted input events", () => {
    expect(calculateTotalAtByRecurrence(events, 80, 36)).toBeCloseTo(
      calculateTotalAt(events, 80, 36),
      10,
    );
  });

  it("handles simultaneous events", () => {
    const simultaneous = [
      { id: "a", timestamp: 5, amount: 20 },
      { id: "b", timestamp: 5, amount: 30 },
    ];
    expect(calculateTotalAtByRecurrence(simultaneous, 5, 36)).toBeCloseTo(50, 12);
  });

  it("returns zero for an empty event list", () => {
    expect(calculateTotalAtByRecurrence([], 100, 36)).toBe(0);
  });
});
