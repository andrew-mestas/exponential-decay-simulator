import { useMemo, useState } from "react";
import {
  runSimulation,
  type SimulationResult,
} from "./engine/analysis/simulation";
import type { InputEvent } from "./engine/contribution/contribution";
import "./App.css";

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
  "#4f46e5",
  "#0891b2",
  "#d97706",
  "#db2777",
  "#16a34a",
  "#7c3aed",
  "#ea580c",
  "#0f766e",
];

const INITIAL_EVENTS: EventDraft[] = [
  { id: "event-1", timestamp: "0", amount: "100" },
  { id: "event-2", timestamp: "12", amount: "50" },
];

function toInputEvents(drafts: EventDraft[]): InputEvent[] {
  return drafts.map((event) => ({
    id: event.id,
    timestamp: Number(event.timestamp),
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
  const width = 900;
  const height = 360;
  const margin = { top: 20, right: 24, bottom: 48, left: 66 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maximum = Math.max(0, ...curves.flatMap((curve) =>
    curve.points.map((point) => point.value),
  ));
  const yMaximum = maximum > 0 ? maximum * 1.1 : 1;
  const x = (time: number) =>
    margin.left + ((time - startTime) / (endTime - startTime)) * plotWidth;
  const y = (value: number) =>
    margin.top + plotHeight - (value / yMaximum) * plotHeight;
  const gridValues = Array.from({ length: 5 }, (_, index) =>
    (yMaximum * index) / 4,
  );

  return (
    <div className="chart-scroll">
      <svg
        className="decay-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Exponential decay curves over simulation time"
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
            <path
              key={curve.id}
              d={path}
              fill="none"
              stroke={curve.color}
              strokeWidth={curve.isTotal ? 3.5 : 2}
              strokeDasharray={curve.isTotal ? undefined : "6 4"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
    </div>
  );
}

function App() {
  const [events, setEvents] = useState<EventDraft[]>(INITIAL_EVENTS);
  const [halfLife, setHalfLife] = useState("24");
  const [startTime, setStartTime] = useState("0");
  const [endTime, setEndTime] = useState("72");
  const [sampleInterval, setSampleInterval] = useState("1");
  const [visibleEvents, setVisibleEvents] = useState<Record<string, boolean>>({});
  const [showTotal, setShowTotal] = useState(true);
  const [nextId, setNextId] = useState(3);

  const numericEvents = toInputEvents(events);
  const simulation = useMemo<{
    result: SimulationResult | null;
    error: string | null;
  }>(() => {
    const halfLifeValue = Number(halfLife);
    const startValue = Number(startTime);
    const endValue = Number(endTime);
    const intervalValue = Number(sampleInterval);

    if (
      !Number.isFinite(halfLifeValue) ||
      halfLifeValue <= 0 ||
      !Number.isFinite(startValue) ||
      !Number.isFinite(endValue) ||
      endValue <= startValue ||
      !Number.isFinite(intervalValue) ||
      intervalValue <= 0 ||
      numericEvents.some(
        (event) =>
          !Number.isFinite(event.timestamp) ||
          !Number.isFinite(event.amount) ||
          event.amount < 0,
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
          .map((series, index) => ({
            id: series.eventId,
            label: events.find((event) => event.id === series.eventId)?.id ?? series.eventId,
            color: CURVE_COLORS[index % CURVE_COLORS.length],
            points: series.points,
          })),
        ...(showTotal
          ? [{
              id: "total",
              label: "Combined amount",
              color: "#111827",
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
    setEvents((current) => [
      ...current,
      { id: `event-${nextId}`, timestamp: startTime, amount: "25" },
    ]);
    setNextId((current) => current + 1);
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
            <label className="field-label" htmlFor="half-life">
              Half-life
              <span className="field-unit">time units</span>
            </label>
            <input
              id="half-life"
              type="number"
              min="0"
              step="any"
              value={halfLife}
              onChange={(event) => setHalfLife(event.target.value)}
            />
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
            <div className="event-list">
              {events.map((event, index) => (
                <div className="event-card" key={event.id}>
                  <div className="event-card-heading">
                    <span className="event-number">EVENT {index + 1}</span>
                    <button
                      className="remove-button"
                      type="button"
                      onClick={() => removeEvent(event.id)}
                      aria-label={`Remove event ${index + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                  <label className="field-label" htmlFor={`amount-${event.id}`}>
                    Amount
                  </label>
                  <input
                    id={`amount-${event.id}`}
                    type="number"
                    min="0"
                    step="any"
                    value={event.amount}
                    onChange={(change) => updateEvent(event.id, "amount", change.target.value)}
                  />
                  <label className="field-label" htmlFor={`time-${event.id}`}>
                    Event time
                    <span className="field-unit">elapsed time</span>
                  </label>
                  <input
                    id={`time-${event.id}`}
                    type="number"
                    step="any"
                    value={event.timestamp}
                    onChange={(change) => updateEvent(event.id, "timestamp", change.target.value)}
                  />
                </div>
              ))}
              {events.length === 0 && (
                <p className="empty-state">No events yet. Add an event to begin.</p>
              )}
            </div>
          </section>

          <section className="panel-section">
            <p className="eyebrow">TIME WINDOW</p>
            <h2>Simulation range</h2>
            <div className="two-column-fields">
              <div>
                <label className="field-label" htmlFor="start-time">Start</label>
                <input
                  id="start-time"
                  type="number"
                  step="any"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="end-time">End</label>
                <input
                  id="end-time"
                  type="number"
                  step="any"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </div>
            </div>
            <label className="field-label" htmlFor="sample-interval">
              Sample interval
              <span className="field-unit">time units</span>
            </label>
            <input
              id="sample-interval"
              type="number"
              min="0"
              step="any"
              value={sampleInterval}
              onChange={(event) => setSampleInterval(event.target.value)}
            />
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
                    startTime={Number(startTime)}
                    endTime={Number(endTime)}
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

              <div className="data-table-card">
                <div className="table-heading">
                  <div>
                    <p className="eyebrow">EVENT BREAKDOWN</p>
                    <h3>Individual exposure</h3>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Input time</th>
                        <th>Input amount</th>
                        <th>Analytical AUC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.contributions.map((series, index) => {
                        const event = events.find((item) => item.id === series.eventId);
                        return (
                          <tr key={series.eventId}>
                            <td><span className="table-dot" style={{ backgroundColor: CURVE_COLORS[index % CURVE_COLORS.length] }} />Event {index + 1}</td>
                            <td>{event?.timestamp ?? "—"}</td>
                            <td>{event?.amount ?? "—"}</td>
                            <td>{formatNumber(series.auc)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-results">
              <h3>Waiting for valid simulation settings</h3>
              <p>Correct the highlighted input values to generate the curves and summary statistics.</p>
            </div>
          )}
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
