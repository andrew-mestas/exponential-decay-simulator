import { describe, expect, it } from "vitest";
import { formatHoursAsDuration, parseDurationToHours } from "../../time/duration";

describe("parseDurationToHours", () => {
  it.each([
    ["48", 48],
    ["2d", 48],
    ["1d 6h", 30],
    ["3d 4h 30m", 76.5],
    ["90m", 1.5],
    ["2h 30m", 2.5],
    ["0.5d", 12],
    ["1.25h", 1.25],
    ["1 day, 2 hours", 26],
  ])("parses %s into %s hours", (input, expected) => {
    expect(parseDurationToHours(input)).toBeCloseTo(expected, 12);
  });

  it("supports negative elapsed timestamps", () => {
    expect(parseDurationToHours("-2")).toBe(-2);
  });

  it.each(["", "abc", "2x", "1h -2m", "Infinity"])(
    "rejects invalid duration %s",
    (input) => expect(() => parseDurationToHours(input)).toThrow(),
  );
});

describe("formatHoursAsDuration", () => {
  it.each([
    [48, "2d"],
    [30, "1d 6h"],
    [76.5, "3d 4h 30m"],
    [0, "0h"],
    [-2.5, "-2h 30m"],
  ])("formats %s hours as %s", (hours, expected) => {
    expect(formatHoursAsDuration(hours)).toBe(expected);
  });
});
