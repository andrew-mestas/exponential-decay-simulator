/**
 * Chronological recurrence-based accumulation API.
 *
 * TDD scaffold: implement this function and verify it against direct evaluation.
 */

import { type InputEvent } from "../contribution/contribution";
import { decayConstant } from "../decay/decay";

export function calculateTotalAtByRecurrence(
  _events: InputEvent[],
  _observationTime: number,
  _halfLife: number,
): number {
  const sortedEvents = [..._events].sort((a, b) => a.timestamp - b.timestamp);
  const seen: Record<string, boolean> = {};
  const k = decayConstant(_halfLife);

  // Match the direct implementation's duplicate-ID contract across all inputs,
  // including events that occur after the observation time.
  for (const event of sortedEvents) {
    if (event.id in seen) {
      throw new Error("Duplicate event ID found");
    }
    seen[event.id] = true;
  }

  const eligibleEvents = sortedEvents.filter(
    (event) => event.timestamp <= _observationTime,
  );

  if (eligibleEvents.length === 0) {
    return 0;
  }

  // The first eligible event establishes the initial state. Starting the clock
  // at an arbitrary zero can create a negative elapsed interval for earlier
  // timestamps and can cause 0 * Infinity to become NaN.
  let total = eligibleEvents[0].amount;
  let previousTime = eligibleEvents[0].timestamp;

  for (let i = 1; i < eligibleEvents.length; i++) {
    const event = eligibleEvents[i];
    const elapsed = event.timestamp - previousTime;

    total = total * Math.exp(-k * elapsed);
    total += event.amount;
    previousTime = event.timestamp;
  }

  return total * Math.exp(-k * (_observationTime - previousTime));
}
