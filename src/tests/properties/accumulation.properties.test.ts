import { describe, it } from "vitest";
import fc from "fast-check";
import { calculateTotalAt } from "../../engine/accumulation/direct";
import { calculateTotalAtByRecurrence } from "../../engine/accumulation/recurrence";

const eventArbitrary = fc.record({
  id: fc.uuid(),
  timestamp: fc.double({ min: 0, max: 10_000, noNaN: true, noDefaultInfinity: true }),
  amount: fc.double({ min: 0, max: 10_000, noNaN: true, noDefaultInfinity: true }),
});

describe("accumulation properties", () => {
  it("is independent of the order of input events", () => {
    fc.assert(
      fc.property(
        fc.array(eventArbitrary, { maxLength: 20 }),
        fc.double({ min: 0, max: 20_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.01, max: 10_000, noNaN: true, noDefaultInfinity: true }),
        (events, observationTime, halfLife) => {
          const reversed = [...events].reverse();
          const first = calculateTotalAt(events, observationTime, halfLife);
          const second = calculateTotalAt(reversed, observationTime, halfLife);
          return Math.abs(first - second) <= 1e-9 * Math.max(1, Math.abs(first));
        },
      ),
    );
  });

  it("obeys superposition: total equals the sum of individual event contributions", () => {
    fc.assert(
      fc.property(
        fc.array(eventArbitrary, { maxLength: 20 }),
        fc.double({ min: 0, max: 20_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.01, max: 10_000, noNaN: true, noDefaultInfinity: true }),
        (events, observationTime, halfLife) => {
          const total = calculateTotalAt(events, observationTime, halfLife);
          const separate = events.reduce(
            (sum, event) =>
              sum + calculateTotalAt([event], observationTime, halfLife),
            0,
          );
          return Math.abs(total - separate) <= 1e-9 * Math.max(1, Math.abs(total));
        },
      ),
    );
  });

  it("scales linearly when every input amount is multiplied by the same factor", () => {
    fc.assert(
      fc.property(
        fc.array(eventArbitrary, { maxLength: 20 }),
        fc.double({ min: 0, max: 20_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.01, max: 10_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
        (events, observationTime, halfLife, factor) => {
          const original = calculateTotalAt(events, observationTime, halfLife);
          const scaledEvents = events.map((event) => ({
            ...event,
            amount: event.amount * factor,
          }));
          const scaled = calculateTotalAt(
            scaledEvents,
            observationTime,
            halfLife,
          );
          return Math.abs(scaled - original * factor) <=
            1e-9 * Math.max(1, Math.abs(scaled));
        },
      ),
    );
  });

  it("matches direct evaluation with recurrence evaluation", () => {
    fc.assert(
      fc.property(
        fc.array(eventArbitrary, { maxLength: 20 }),
        fc.double({ min: 0, max: 20_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.01, max: 10_000, noNaN: true, noDefaultInfinity: true }),
        (events, observationTime, halfLife) => {
          const direct = calculateTotalAt(events, observationTime, halfLife);
          const recurrence = calculateTotalAtByRecurrence(
            events,
            observationTime,
            halfLife,
          );
          return Math.abs(direct - recurrence) <=
            1e-9 * Math.max(1, Math.abs(direct));
        },
      ),
    );
  });
});
