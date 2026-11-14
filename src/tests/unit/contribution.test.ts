import { describe, expect, it } from "vitest";
import { calculateContribution } from "../../engine/contribution/contribution";

const dose = { id: "dose-1", timestamp: 12, amount: 100 };

describe("calculateContribution", () => {
  it("returns the full input amount at its timestamp", () => {
    expect(calculateContribution(dose, 12, 36)).toBeCloseTo(100, 12);
  });

  it("decays an input by one half-life", () => {
    expect(calculateContribution(dose, 48, 36)).toBeCloseTo(50, 12);
  });

  it("decays an input by two half-lives", () => {
    expect(calculateContribution(dose, 84, 36)).toBeCloseTo(25, 12);
  });

  it("returns zero before the input timestamp", () => {
    expect(calculateContribution(dose, 11.999, 36)).toBe(0);
  });

  it("returns zero for a zero-amount input", () => {
    expect(calculateContribution({ ...dose, amount: 0 }, 48, 36)).toBe(0);
  });

  it("supports fractional timestamps", () => {
    expect(calculateContribution(dose, 30, 36)).toBeCloseTo(
      100 * Math.SQRT1_2,
      12,
    );
  });

  it("rejects a negative amount", () => {
    expect(() =>
      calculateContribution({ ...dose, amount: -1 }, 48, 36),
    ).toThrow();
  });

  it("rejects non-finite event values or observation time", () => {
    expect(() =>
      calculateContribution({ ...dose, amount: Number.NaN }, 48, 36),
    ).toThrow();
    expect(() => calculateContribution(dose, Number.POSITIVE_INFINITY, 36)).toThrow();
  });

  it("rejects a non-positive half-life", () => {
    expect(() => calculateContribution(dose, 48, 0)).toThrow();
  });
});
