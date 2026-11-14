/**
 * Types and API for evaluating one timestamped input's remaining contribution.
 *
 * TDD scaffold: implement this function by making the contribution tests pass.
 */

import { decayConstant } from "../decay/decay";

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
  if (
    !Number.isFinite(_event.amount) ||
    !Number.isFinite(_observationTime) ||
    _event.amount < 0
  )
    throw new Error("Only valid numbers");
  if (_observationTime < _event.timestamp) return 0;
  return (
    _event.amount *
    Math.pow(
      Math.E,
      -decayConstant(_halfLife) * (_observationTime - _event.timestamp),
    )
  );
}
