/**
 * Reference accumulation API based on summing individual event contributions.
 *
 * TDD scaffold: implement these functions by making the accumulation tests pass.
 */

import {
  calculateContribution,
  type Contribution,
  type InputEvent,
} from "../contribution/contribution";

export type { Contribution, InputEvent } from "../contribution/contribution";

export function calculateContributionsAt(
  _events: InputEvent[],
  _observationTime: number,
  _halfLife: number,
): Contribution[] {
  return _events.map<Contribution>((event) => {
    return {
      eventId: event.id,
      amount: calculateContribution(event, _observationTime, _halfLife),
    };
  });
}

export function calculateTotalAt(
  _events: InputEvent[],
  _observationTime: number,
  _halfLife: number,
): number {
  const seen: Record<string, boolean> = {};
  return calculateContributionsAt(_events, _observationTime, _halfLife).reduce(
    (a, b) => {
      if (b.eventId in seen) {
        throw new Error("Duplicate event ID found");
      } else {
        seen[b.eventId] = true;
      }
      return a + b.amount;
    },
    0,
  );
}
