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
  let total = 0;
  let previousTime = 0;
  const sortedEvents = [..._events].sort((a, b) => a.timestamp - b.timestamp);
  const seen: Record<string, boolean> = {};
  const k = decayConstant(_halfLife);

  if (sortedEvents.length == 0 || _observationTime < sortedEvents[0].timestamp)
    return 0.0;

  for (const event of sortedEvents) {
    if (event.timestamp > _observationTime) break;
    if (event.id in seen) {
      throw new Error("Duplicate event ID found");
    } else {
      seen[event.id] = true;
    }
    const elapsed = event.timestamp - previousTime;
    total = total * Math.exp(-k * elapsed);
    total += event.amount;
    previousTime = event.timestamp;
  }

  return total * Math.exp(-k * (_observationTime - previousTime));
}
