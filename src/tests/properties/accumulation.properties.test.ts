import { describe, it } from "vitest";
import fc from "fast-check";
import { calculateTotalAt } from "../../engine/accumulation/direct";
import { calculateTotalAtByRecurrence } from "../../engine/accumulation/recurrence";

const eventValuesArbitrary = fc.array(
  fc.record({
    timestamp: fc.double({ min: 0, max: 10_000, noNaN: true, noDefaultInfinity: true }),
    amount: fc.double({ min: 0, max: 10_000, noNaN: true, noDefaultInfinity: true }),
  }),
  { maxLength: 20 },
);

const withUniqueIds = (
  values: Array<{ timestamp: number; amount: number }>,
) => values.map((event, index) => ({ ...event, id: `event-${index}` }));

describe("accumulation properties", () => {
  it("is independent of the order of input events", () => {
    fc.assert(
      fc.property(
        eventValuesArbitrary,
        fc.double({ min: 0, max: 20_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.01, max: 10_000, noNaN: true, noDefaultInfinity: true }),
        (values, observationTime, halfLife) => {
          const events = withUniqueIds(values);
          const first = calculateTotalAt(events, observationTime, halfLife);
          const second = calculateTotalAt([...events].reverse(), observationTime, halfLife);
          return Math.abs(first - second) <= 1e-9 * Math.max(1, Math.abs(first));
        },
      ),
    );
  });

  it("obeys superposition: total equals the sum of individual event contributions", () => {
    fc.assert(
      fc.property(
        eventValuesArbitrary,
        fc.double({ min: 0, max: 20_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.01, max: 10_000, noNaN: true, noDefaultInfinity: true }),
        (values, observationTime, halfLife) => {
          const events = withUniqueIds(values);
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
        eventValuesArbitrary,
        fc.double({ min: 0, max: 20_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.01, max: 10_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
        (values, observationTime, halfLife, factor) => {
          const events = withUniqueIds(values);
          const original = calculateTotalAt(events, observationTime, halfLife);
          const scaledEvents = events.map((event) => ({
            ...event,
            amount: event.amount * factor,
          }));
          const scaled = calculateTotalAt(scaledEvents, observationTime, halfLife);
          return Math.abs(scaled - original * factor) <=
            1e-9 * Math.max(1, Math.abs(scaled));
        },
      ),
    );
  });

  it("matches direct evaluation with recurrence evaluation", () => {
    fc.assert(
      fc.property(
        eventValuesArbitrary,
        fc.double({ min: 0, max: 20_000, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.01, max: 10_000, noNaN: true, noDefaultInfinity: true }),
        (values, observationTime, halfLife) => {
          const events = withUniqueIds(values);
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
