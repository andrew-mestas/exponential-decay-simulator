/**
 * Reference accumulation API based on summing individual event contributions.
 *
 * TDD scaffold: implement these functions by making the accumulation tests pass.
 */

import type { Contribution, InputEvent } from "../contribution/contribution";

export type { Contribution, InputEvent } from "../contribution/contribution";

export function calculateContributionsAt(
  _events: InputEvent[],
  _observationTime: number,
  _halfLife: number,
): Contribution[] {
  throw new Error("Not implemented: calculateContributionsAt");
}

export function calculateTotalAt(
  _events: InputEvent[],
  _observationTime: number,
  _halfLife: number,
): number {
  throw new Error("Not implemented: calculateTotalAt");
}
