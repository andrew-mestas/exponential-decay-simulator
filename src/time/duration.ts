/**
 * Parse a duration into canonical hours.
 *
 * Supported examples: "48", "2d", "1d 6h", "90m", "2h 30m", "0.5d".
 * A bare number is interpreted as hours.
 */
export function parseDurationToHours(input: string): number {
  const value = input.trim().toLowerCase();
  if (!value) throw new Error("Duration is required");

  const numberPattern = String.raw`(?:\\d+(?:\\.\\d*)?|\\.\\d+)`;
  const tokenPattern = new RegExp(`(${numberPattern})\\s*(d|day|days|h|hr|hrs|hour|hours|m|min|mins|minute|minutes)`, "gy");
  let position = 0;
  let totalHours = 0;
  let tokenCount = 0;

  while (position < value.length) {
    while (position < value.length && /[\\s,]+/.test(value[position])) position++;
    if (position >= value.length) break;

    tokenPattern.lastIndex = position;
    const match = tokenPattern.exec(value);
    if (!match) {
      if (tokenCount === 0 && /^[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)$/.test(value)) {
        const hours = Number(value);
        if (Number.isFinite(hours)) return hours;
      }
      throw new Error(`Invalid duration near "${value.slice(position)}"`);
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multiplier = unit.startsWith("d") ? 24 : unit.startsWith("h") ? 1 : 1 / 60;
    totalHours += amount * multiplier;
    tokenCount++;
    position = tokenPattern.lastIndex;
  }

  if (tokenCount === 0 || !Number.isFinite(totalHours)) {
    throw new Error("Duration must be a finite value");
  }
  return totalHours;
}

export function formatHoursAsDuration(hours: number): string {
  if (!Number.isFinite(hours)) return "—";
  const sign = hours < 0 ? "-" : "";
  let remainingMinutes = Math.round(Math.abs(hours) * 60);
  const days = Math.floor(remainingMinutes / 1440);
  remainingMinutes %= 1440;
  const wholeHours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  const parts = [
    days ? `${days}d` : "",
    wholeHours ? `${wholeHours}h` : "",
    minutes ? `${minutes}m` : "",
  ].filter(Boolean);
  return sign + (parts.join(" ") || "0h");
}
