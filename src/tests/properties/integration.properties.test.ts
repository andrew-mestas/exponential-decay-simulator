import { describe, it } from "vitest";
import fc from "fast-check";
import { calculateTotalAt } from "../../engine/accumulation/direct";
import { calculateTotalAtByRecurrence } from "../../engine/accumulation/recurrence";
import { calculateAuc } from "../../engine/analysis/integration";

const eventValuesArbitrary = fc.array(
  fc.record({
    timestamp: fc.double({
      min: -10_000,
      max: 20_000,
      noNaN: true,
      noDefaultInfinity: true,
    }),
    amount: fc.double({
      min: 0,
      max: 10_000,
      noNaN: true,
      noDefaultInfinity: true,
    }),
  }),
  { maxLength: 20 },
);

const withUniqueIds = (
  values: Array<{ timestamp: number; amount: number }>,
) => values.map((event, index) => ({ ...event, id: `event-${index}` }));

const approximatelyEqual = (left: number, right: number): boolean =>
  Math.abs(left - right) <=
  1e-9 * Math.max(1, Math.abs(left), Math.abs(right));

describe("integration and historical-result properties", () => {
  it("is additive across adjacent AUC intervals", () => {
    fc.assert(
      fc.property(
        eventValuesArbitrary,
        fc.double({
          min: -10_000,
          max: 10_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({
          min: 0.001,
          max: 10_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({
          min: 0.01,
          max: 10_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (values, startTime, duration, halfLife) => {
          const events = withUniqueIds(values);
          const splitTime = startTime + duration / 2;
          const endTime = startTime + duration;

          const whole = calculateAuc(events, startTime, endTime, halfLife);
          const split =
            calculateAuc(events, startTime, splitTime, halfLife) +
            calculateAuc(events, splitTime, endTime, halfLife);

          return approximatelyEqual(whole, split);
        },
      ),
    );
  });

  it("scales AUC linearly when every event amount is scaled", () => {
    fc.assert(
      fc.property(
        eventValuesArbitrary,
        fc.double({
          min: -10_000,
          max: 10_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({
          min: 0.001,
          max: 10_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({
          min: 0.01,
          max: 10_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({
          min: 0,
          max: 100,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (values, startTime, duration, halfLife, factor) => {
          const events = withUniqueIds(values);
          const endTime = startTime + duration;
          const original = calculateAuc(events, startTime, endTime, halfLife);
          const scaledEvents = events.map((event) => ({
            ...event,
            amount: event.amount * factor,
          }));
          const scaled = calculateAuc(
            scaledEvents,
            startTime,
            endTime,
            halfLife,
          );

          return approximatelyEqual(scaled, original * factor);
        },
      ),
    );
  });

  it("does not let future events change historical accumulated amounts", () => {
    fc.assert(
      fc.property(
        eventValuesArbitrary,
        fc.double({
          min: 0,
          max: 20_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({
          min: 0.01,
          max: 10_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({
          min: 0.001,
          max: 10_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (values, observationTime, halfLife, futureOffset) => {
          const events = withUniqueIds(values);
          const historicalTotal = calculateTotalAt(
            events,
            observationTime,
            halfLife,
          );
          const historicalRecurrence = calculateTotalAtByRecurrence(
            events,
            observationTime,
            halfLife,
          );
          const withFutureEvent = [
            ...events,
            {
              id: "future-event",
              timestamp: observationTime + futureOffset,
              amount: 123,
            },
          ];

          return (
            approximatelyEqual(
              calculateTotalAt(withFutureEvent, observationTime, halfLife),
              historicalTotal,
            ) &&
            approximatelyEqual(
              calculateTotalAtByRecurrence(
                withFutureEvent,
                observationTime,
                halfLife,
              ),
              historicalRecurrence,
            )
          );
        },
      ),
    );
  });

  it("does not let events after an AUC interval change that interval's area", () => {
    fc.assert(
      fc.property(
        eventValuesArbitrary,
        fc.double({
          min: -10_000,
          max: 10_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({
          min: 0.001,
          max: 10_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({
          min: 0.01,
          max: 10_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({
          min: 0.001,
          max: 10_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (values, startTime, duration, halfLife, futureOffset) => {
          const events = withUniqueIds(values);
          const endTime = startTime + duration;
          const historicalAuc = calculateAuc(
            events,
            startTime,
            endTime,
            halfLife,
          );
          const withFutureEvent = [
            ...events,
            {
              id: "future-event",
              timestamp: endTime + futureOffset,
              amount: 123,
            },
          ];

          return approximatelyEqual(
            calculateAuc(withFutureEvent, startTime, endTime, halfLife),
            historicalAuc,
          );
        },
      ),
    );
  });
});
