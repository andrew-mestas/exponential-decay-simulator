import { useMemo, useState, type PointerEvent } from "react";
import {
  runSimulation,
  type SimulationResult,
} from "./engine/analysis/simulation";
import type { InputEvent } from "./engine/contribution/contribution";
import "./App.css";
import { formatHoursAsDuration, parseDurationToHours } from "./time/duration";

interface EventDraft {
  id: string;
  timestamp: string;
  amount: string;
}

interface Curve {
  id: string;
  label: string;
  color: string;
  points: { timestamp: number; value: number }[];
  isTotal?: boolean;
}

const CURVE_COLORS = [
  "#60a5fa",
  "#22d3ee",
  "#fbbf24",
  "#fb7185",
  "#a78bfa",
  "#4ade80",
  "#f472b6",
  "#fb923c",
];

function toInputEvents(drafts: EventDraft[]): InputEvent[] {
  return drafts.map((event) => ({
    id: event.id,
    timestamp: parseDurationToHours(event.timestamp),
    amount: Number(event.amount),
  }));
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 3,
  }).format(value);
}

function CurveChart({
  curves,
  startTime,
  endTime,
}: {
  curves: Curve[];
  startTime: number;
  endTime: number;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = 900;
  const height = 360;
  const margin = { top: 20, right: 24, bottom: 48, left: 66 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maximum = curves.reduce(
    (curveMaximum, curve) =>
      curve.points.reduce(
        (pointMaximum, point) => Math.max(pointMaximum, point.value),
        curveMaximum,
      ),
    0,
  );
  const yMaximum = maximum > 0 ? maximum * 1.1 : 1;
  const x = (time: number) =>
    margin.left + ((time - startTime) / (endTime - startTime)) * plotWidth;
  const y = (value: number) =>
    margin.top + plotHeight - (value / yMaximum) * plotHeight;
  const gridValues = Array.from({ length: 5 }, (_, index) =>
    (yMaximum * index) / 4,
  );
  const samplePoints = curves[0]?.points ?? [];
  const activePoint =
    hoverIndex === null ? null : samplePoints[hoverIndex] ?? null;
  const tooltipLeft =
    activePoint === null
      ? 0
      : Math.min(82, Math.max(4, ((activePoint.timestamp - startTime) / (endTime - startTime)) * 100));

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || samplePoints.length === 0) return;
    const viewBoxX = ((event.clientX - rect.left) / rect.width) * width;
    const fraction = Math.min(
      1,
      Math.max(0, (viewBoxX - margin.left) / plotWidth),
    );
    const targetTime = startTime + fraction * (endTime - startTime);
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    samplePoints.forEach((point, index) => {
      const distance = Math.abs(point.timestamp - targetTime);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    setHoverIndex(nearestIndex);
  }

  return (
    <div className="chart-scroll">
      <svg
        className="decay-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Interactive exponential decay chart. Move the pointer over the plot to inspect values."
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={y(value)}
              y2={y(value)}
              className="chart-grid"
            />
            <text x={margin.left - 12} y={y(value) + 4} textAnchor="end" className="chart-tick">
              {formatNumber(value)}
            </text>
          </g>
        ))}
        <line
          x1={margin.left}
          x2={margin.left}
          y1={margin.top}
          y2={margin.top + plotHeight}
          className="chart-axis"
        />
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={margin.top + plotHeight}
          y2={margin.top + plotHeight}
          className="chart-axis"
        />
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const time = startTime + (endTime - startTime) * fraction;
          return (
            <text
              key={fraction}
              x={x(time)}
              y={height - 18}
              textAnchor="middle"
              className="chart-tick"
            >
              {formatNumber(time)}
            </text>
          );
        })}
        <text
          x={width / 2}
          y={height - 2}
          textAnchor="middle"
          className="chart-axis-label"
        >
          Elapsed time
        </text>
        <text
          transform={`translate(17 ${height / 2}) rotate(-90)`}
          textAnchor="middle"
          className="chart-axis-label"
        >
          Remaining amount
        </text>
        {curves.map((curve) => {
          const path = curve.points
            .map((point, index) =>
              `${index === 0 ? "M" : "L"} ${x(point.timestamp)} ${y(point.value)}`,
            )
            .join(" ");
          return (
            <g key={curve.id}>
              <path
                d={path}
                fill="none"
                stroke={curve.color}
                strokeWidth={curve.isTotal ? 3.5 : 2.5}
                strokeDasharray={curve.isTotal ? undefined : "7 4"}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {activePoint && curve.points[hoverIndex!] && (
                <circle
                  cx={x(curve.points[hoverIndex!].timestamp)}
                  cy={y(curve.points[hoverIndex!].value)}
                  r={curve.isTotal ? 5 : 4}
                  fill={curve.color}
                  stroke="var(--surface)"
                  strokeWidth="2"
                />
              )}
            </g>
          );
        })}
        {activePoint && (
          <line
            x1={x(activePoint.timestamp)}
            x2={x(activePoint.timestamp)}
            y1={margin.top}
            y2={margin.top + plotHeight}
            className="chart-crosshair"
          />
        )}
      </svg>
      {activePoint && (
        <div className="chart-interaction-tooltip" style={{ left: `${tooltipLeft}%` }} aria-live="polite">
          <strong>t = {formatNumber(activePoint.timestamp)}</strong>
          {curves.map((curve) => {
            const point = curve.points[hoverIndex!];
            return point ? (
              <span className="tooltip-value" key={curve.id}>
                <i style={{ backgroundColor: curve.color }} />
                {curve.label}: {formatNumber(point.value)}
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

function DurationInput({ id, label, value, onChange, presets = false }: { id: string; label: string; value: string; onChange: (value: string) => void; presets?: boolean }) {
  const shortcuts = ["+1h", "+6h", "+12h", "+1d", "+2d", "+7d"];
  function addShortcut(shortcut: string) {
    let current = 0;
    try { current = parseDurationToHours(value || "0h"); } catch { current = 0; }
    onChange(formatHoursAsDuration(current + parseDurationToHours(shortcut.slice(1))));
  }
  return <div className="duration-field">
    <label className="field-label" htmlFor={id}>{label}<span className="field-unit">hours internally</span></label>
    <input id={id} type="text" placeholder="e.g. 2d 6h or 54h" value={value} onChange={(event) => onChange(event.target.value)} />
    {presets && <div className="duration-presets">{shortcuts.map((shortcut) => <button key={shortcut} type="button" onClick={() => addShortcut(shortcut)}>{shortcut}</button>)}</div>}
    <p className="duration-hint">Use d, h, m — for example, 1d 6h or 90m.</p>
  </div>;
}

function App() {
  const [events, setEvents] = useState<EventDraft[]>([]);
  const [draftAmount, setDraftAmount] = useState("");
  const [draftTimestamp, setDraftTimestamp] = useState("0h");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [halfLife, setHalfLife] = useState("24");
  const [startTime, setStartTime] = useState("0");
  const [endTime, setEndTime] = useState("72");
  const [sampleInterval, setSampleInterval] = useState("1");
  const [visibleEvents, setVisibleEvents] = useState<Record<string, boolean>>({});
  const [showTotal, setShowTotal] = useState(true);
  const [nextId, setNextId] = useState(3);

  const simulation = useMemo<{
    result: SimulationResult | null;
    error: string | null;
  }>(() => {
    const numericEvents = toInputEvents(events);
    let halfLifeValue: number;
    let startValue: number;
    let endValue: number;
    let intervalValue: number;
    try {
      halfLifeValue = parseDurationToHours(halfLife);
      startValue = parseDurationToHours(startTime);
      endValue = parseDurationToHours(endTime);
      intervalValue = parseDurationToHours(sampleInterval);
    } catch {
      return { result: null, error: "Enter valid durations such as 2d, 6h, or 1d 6h." };
    }

    if (
      !Number.isFinite(halfLifeValue) ||
      halfLifeValue <= 0 ||
      !Number.isFinite(startValue) ||
      !Number.isFinite(endValue) ||
      endValue <= startValue ||
      !Number.isFinite(intervalValue) ||
      intervalValue <= 0 ||
      events.some(
        (event) =>
          event.timestamp.trim() === "" ||
          event.amount.trim() === "" ||
          !Number.isFinite(parseDurationToHours(event.timestamp)) ||
          !Number.isFinite(Number(event.amount)) ||
          Number(event.amount) < 0,
      )
    ) {
      return { result: null, error: "Enter finite values, a positive half-life and sample interval, and an end time after the start time. Event amounts cannot be negative." };
    }

    try {
      return {
        result: runSimulation({
          events: numericEvents,
          halfLife: halfLifeValue,
          startTime: startValue,
          endTime: endValue,
          sampleInterval: intervalValue,
        }),
        error: null,
      };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : "Unable to run simulation.",
      };
    }
  }, [events, halfLife, startTime, endTime, sampleInterval]);

  const result = simulation.result;
  const curves: Curve[] = result
    ? [
        ...result.contributions
          .filter((series) => visibleEvents[series.eventId] !== false)
          .map((series) => {
            const eventIndex = result.contributions.findIndex(
              (item) => item.eventId === series.eventId,
            );
            return {
              id: series.eventId,
              label: `Event ${eventIndex + 1}`,
              color: CURVE_COLORS[eventIndex % CURVE_COLORS.length],
              points: series.points,
            };
          }),
        ...(showTotal
          ? [{
              id: "total",
              label: "Combined amount",
              color: "var(--total-curve)",
              points: result.total,
              isTotal: true,
            }]
          : []),
      ]
    : [];

  function updateEvent(id: string, field: "timestamp" | "amount", value: string) {
    setEvents((current) =>
      current.map((event) =>
        event.id === id ? { ...event, [field]: value } : event,
      ),
    );
  }

  function addEvent() {
    const amount = Number(draftAmount);
    const timestamp = Number(draftTimestamp);

    if (
      draftAmount.trim() === "" ||
      draftTimestamp.trim() === "" ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !Number.isFinite(timestamp)
    ) {
      setDraftError("Enter a valid nonnegative amount and a finite event time.");
      return;
    }

    setEvents((current) => [
      ...current,
      {
        id: `event-${nextId}`,
        timestamp: formatHoursAsDuration(timestamp),
        amount: String(amount),
      },
    ]);
    setNextId((current) => current + 1);
    setDraftAmount("");
    setDraftTimestamp("");
    setDraftError(null);
  }

  function removeEvent(id: string) {
    setEvents((current) => current.filter((event) => event.id !== id));
    setVisibleEvents((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function toggleEvent(id: string) {
    setVisibleEvents((current) => ({
      ...current,
      [id]: current[id] === false,
    }));
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">MATHEMATICAL MODEL · FIRST-ORDER DECAY</p>
          <h1>Exponential decay simulator</h1>
          <p className="subtitle">
            Explore how timestamped inputs decay individually and combine over time.
          </p>
        </div>
        <div className="model-chip">Single-compartment model</div>
      </header>

      <div className="workspace">
        <aside className="control-panel">
          <section className="panel-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">MODEL</p>
                <h2>Decay settings</h2>
              </div>
            </div>
            <DurationInput id="half-life" label="Half-life" value={halfLife} onChange={setHalfLife} />
            <p className="field-help">The amount halves after each half-life interval.</p>
          </section>

          <section className="panel-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">INPUTS</p>
                <h2>Events</h2>
              </div>
              <button className="button button-small" type="button" onClick={addEvent}>
                + Add event
              </button>
            </div>
            <div className="event-entry-form">
              <div className="event-input-grid">
                <div>
                  <label className="field-label" htmlFor="new-event-amount">Amount</label>
                  <input
                    id="new-event-amount"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 50"
                    value={draftAmount}
                    onChange={(change) => {
                      setDraftAmount(change.target.value);
                      setDraftError(null);
                    }}
                  />
                </div>
                <div>
                  <DurationInput id="new-event-time" label="Event time" value={draftTimestamp} onChange={(value) => { setDraftTimestamp(value); setDraftError(null); }} presets />
                </div>
              </div>
              {draftError && <p className="draft-error" role="alert">{draftError}</p>}
              <p className="field-help">New events appear in the breakdown below the chart, where you can edit or remove them.</p>
            </div>
          </section>

          <section className="panel-section">
            <p className="eyebrow">TIME WINDOW</p>
            <h2>Simulation range</h2>
            <div className="two-column-fields">
              <div>
                <DurationInput id="start-time" label="Start" value={startTime} onChange={setStartTime} />
              </div>
              <div>
                <DurationInput id="end-time" label="End" value={endTime} onChange={setEndTime} presets />
              </div>
            </div>
            <DurationInput id="sample-interval" label="Sample interval" value={sampleInterval} onChange={setSampleInterval} />
            <p className="field-help">The end time is included even when the interval does not divide the range evenly.</p>
          </section>
        </aside>

        <section className="results-panel">
          <div className="results-heading">
            <div>
              <p className="eyebrow">SIMULATION OUTPUT</p>
              <h2>Accumulation over time</h2>
            </div>
            {result && <span className="sample-count">{result.sampleTimes.length.toLocaleString()} samples</span>}
          </div>

          {simulation.error && (
            <div className="validation-message" role="alert">
              {simulation.error}
            </div>
          )}

          {result ? (
            <>
              <div className="chart-card">
                <div className="chart-toolbar">
                  <span>Amount vs. elapsed time</span>
                  <span>Live preview</span>
                </div>
                {curves.length > 0 ? (
                  <CurveChart
                    curves={curves}
                    startTime={parseDurationToHours(startTime)}
                    endTime={parseDurationToHours(endTime)}
                  />
                ) : (
                  <p className="empty-state chart-empty">Turn on a curve below to display it.</p>
                )}
                <div className="curve-toggles">
                  {result.contributions.map((series, index) => (
                    <label className="curve-toggle" key={series.eventId}>
                      <input
                        type="checkbox"
                        checked={visibleEvents[series.eventId] !== false}
                        onChange={() => toggleEvent(series.eventId)}
                      />
                      <span
                        className="legend-swatch"
                        style={{ backgroundColor: CURVE_COLORS[index % CURVE_COLORS.length] }}
                      />
                      Event {index + 1}
                    </label>
                  ))}
                  <label className="curve-toggle">
                    <input
                      type="checkbox"
                      checked={showTotal}
                      onChange={(event) => setShowTotal(event.target.checked)}
                    />
                    <span className="legend-swatch total-swatch" />
                    Combined amount
                  </label>
                </div>
              </div>

              <div className="metrics-grid">
                <article className="metric-card">
                  <span className="metric-label">Peak sampled amount</span>
                  <strong>{formatNumber(result.statistics.max)}</strong>
                  <span className="metric-detail">At t = {formatNumber(result.statistics.maxTime)}</span>
                </article>
                <article className="metric-card">
                  <span className="metric-label">Minimum sampled amount</span>
                  <strong>{formatNumber(result.statistics.min)}</strong>
                  <span className="metric-detail">At t = {formatNumber(result.statistics.minTime)}</span>
                </article>
                <article className="metric-card">
                  <span className="metric-label">Analytical AUC</span>
                  <strong>{formatNumber(result.auc)}</strong>
                  <span className="metric-detail">Amount × time</span>
                </article>
                <article className="metric-card">
                  <span className="metric-label">Sampled time average</span>
                  <strong>{formatNumber(result.statistics.average)}</strong>
                  <span className="metric-detail">Trapezoidal estimate</span>
                </article>
              </div>


            </>
          ) : (
            <div className="empty-results">
              <h3>Waiting for valid simulation settings</h3>
              <p>Correct the highlighted input values to generate the curves and summary statistics.</p>
            </div>
          )}

          <div className="data-table-card">
            <div className="table-heading">
              <div>
                <p className="eyebrow">EVENT BREAKDOWN</p>
                <h3>Manage events</h3>
              </div>
              <span className="event-count">{events.length} events</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Input time</th>
                    <th>Input amount</th>
                    <th>Analytical AUC</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, index) => {
                    const series = result?.contributions.find((item) => item.eventId === event.id);
                    return (
                      <tr key={event.id}>
                        <td>
                          <span className="table-dot" style={{ backgroundColor: CURVE_COLORS[index % CURVE_COLORS.length] }} />
                          Event {index + 1}
                        </td>
                        <td>
                          <input
                            className="table-edit-input"
                            aria-label={`Event ${index + 1} time`}
                            type="text"
                            placeholder="e.g. 1d 6h"
                            value={event.timestamp}
                            onChange={(change) => updateEvent(event.id, "timestamp", change.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="table-edit-input"
                            aria-label={`Event ${index + 1} amount`}
                            type="number"
                            min="0"
                            step="any"
                            value={event.amount}
                            onChange={(change) => updateEvent(event.id, "amount", change.target.value)}
                          />
                        </td>
                        <td>{series ? formatNumber(series.auc) : "—"}</td>
                        <td>
                          <button
                            className="remove-button"
                            type="button"
                            onClick={() => removeEvent(event.id)}
                            aria-label={`Delete event ${index + 1}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {events.length === 0 && (
                    <tr><td colSpan={5} className="empty-table-cell">No events added yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="model-note">
            This is a mathematical first-order decay model. AUC is amount multiplied by time;
            it is not automatically a physical concentration or clinical measurement.
          </p>
        </section>
      </div>
    </main>
  );
}

export default App;
