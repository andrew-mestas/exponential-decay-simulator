import { describe, expect, it } from "vitest";
import { decayConstant, remainingFraction } from "../../engine/decay/decay";

describe("decayConstant", () => {
  it("converts half-life to a first-order decay constant", () => {
    expect(decayConstant(36)).toBeCloseTo(Math.LN2 / 36, 12);
  });

  it("rejects a zero half-life", () => {
    expect(() => decayConstant(0)).toThrow();
  });

  it("rejects a negative half-life", () => {
    expect(() => decayConstant(-36)).toThrow();
  });

  it("rejects a non-finite half-life", () => {
    expect(() => decayConstant(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => decayConstant(Number.NaN)).toThrow();
  });
});

describe("remainingFraction", () => {
  it("returns 1 at zero elapsed time", () => {
    expect(remainingFraction(0, 36)).toBeCloseTo(1, 12);
  });

  it("returns one half after one half-life", () => {
    expect(remainingFraction(36, 36)).toBeCloseTo(0.5, 12);
  });

  it("returns one quarter after two half-lives", () => {
    expect(remainingFraction(72, 36)).toBeCloseTo(0.25, 12);
  });

  it("returns one eighth after three half-lives", () => {
    expect(remainingFraction(108, 36)).toBeCloseTo(0.125, 12);
  });

  it("supports fractional half-life intervals", () => {
    expect(remainingFraction(18, 36)).toBeCloseTo(Math.SQRT1_2, 12);
  });

  it("is independent of the chosen time unit when inputs use the same unit", () => {
    expect(remainingFraction(36, 36)).toBeCloseTo(
      remainingFraction(2160, 2160),
      12,
    );
  });

  it("rejects negative elapsed time", () => {
    expect(() => remainingFraction(-1, 36)).toThrow();
  });

  it("rejects a zero or negative half-life", () => {
    expect(() => remainingFraction(1, 0)).toThrow();
    expect(() => remainingFraction(1, -36)).toThrow();
  });

  it("rejects non-finite inputs", () => {
    expect(() => remainingFraction(Number.NaN, 36)).toThrow();
    expect(() => remainingFraction(1, Number.POSITIVE_INFINITY)).toThrow();
  });
});
