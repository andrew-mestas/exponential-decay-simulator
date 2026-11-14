/**
 * First-order exponential decay primitives.
 *
 * TDD scaffold: implement these functions by making the decay tests pass.
 */

export function decayConstant(_halfLife: number): number {
  if (!Number.isFinite(_halfLife) || _halfLife <= 0) {
    throw new Error("Only valid numbers");
  }
  return Math.LN2 / _halfLife;
}

export function remainingFraction(_elapsed: number, _halfLife: number): number {
  if (
    !Number.isFinite(_elapsed) ||
    !Number.isFinite(_halfLife) ||
    _halfLife <= 0 ||
    _elapsed < 0
  ) {
    throw new Error("Only valid numbers");
  }
  return Math.pow(0.5, _elapsed / _halfLife);
}
