import { describe, it } from "vitest";
import fc from "fast-check";
import { remainingFraction } from "../../engine/decay/decay";

describe("remainingFraction properties", () => {
  it("is non-increasing as elapsed time increases", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.001, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (firstTime, secondTime, halfLife) => {
          const earlier = Math.min(firstTime, secondTime);
          const later = Math.max(firstTime, secondTime);
          return remainingFraction(later, halfLife) <=
            remainingFraction(earlier, halfLife) + 1e-12;
        },
      ),
    );
  });

  it("obeys the decay composition law f(a + b) = f(a) * f(b)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.001, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (a, b, halfLife) => {
          const combined = remainingFraction(a + b, halfLife);
          const sequential =
            remainingFraction(a, halfLife) * remainingFraction(b, halfLife);
          return Math.abs(combined - sequential) <=
            1e-10 * Math.max(1, Math.abs(combined));
        },
      ),
    );
  });

  it("returns a fraction between zero and one for nonnegative elapsed time", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.001, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
        (elapsed, halfLife) => {
          const fraction = remainingFraction(elapsed, halfLife);
          return fraction >= 0 && fraction <= 1;
        },
      ),
    );
  });
});
