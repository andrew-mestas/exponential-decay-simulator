/**
 * Types and API for evaluating one timestamped input's remaining contribution.
 *
 * TDD scaffold: implement this function by making the contribution tests pass.
 */

export interface InputEvent {
  id: string;
  timestamp: number;
  amount: number;
}

export interface Contribution {
  eventId: string;
  amount: number;
}

export function calculateContribution(
  _event: InputEvent,
  _observationTime: number,
  _halfLife: number,
): number {
  throw new Error("Not implemented: calculateContribution");
}
