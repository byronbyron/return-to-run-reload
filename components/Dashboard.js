"use client";
import { useEffect, useMemo, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import plan from "../plan-data.json";

const PROGRESS_KEY = "rtr.progress";

function readProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
}

function isRestW(w) {
  return w.sport === "rest" || w.type === "rest";
}
function isConditional(w) {
  return /conditional/i.test(w.name || "") || /conditional/i.test(w.description || "");
}
function typeKey(w) {
  const t = (w.type || w.sport || "").toLowerCase();
  if (["threshold", "interval", "vo2max", "test"].includes(t)) return "sess";
  if (t === "long") return "long";
  if (t === "strength") return "strength";
  if (t === "recovery") return "recovery";
  return "easy";
}
function sportChip(w) {
  const k = typeKey(w);
  const labels = { sess: w.type === "test" ? "test" : "session", long: "long", strength: "strength", recovery: "recovery", easy: "easy" };
  return { cls: k, label: labels[k] };
}
function shortLabel(w) {
  let n = w.name || "Session";
  n = n
    .replace(/\brun\b/gi, "")
    .replace(/\(conditional\)/gi, "")
    .replace(/\bsession\b/gi, "")
    .replace(/Strength \(([A-C])\)/i, "Strength $1")
    .replace(/\s{2,}/g, " ")
    .trim();
  return n;
}
function dateLabel(iso) {
  const d = new Date(iso + "T00:00:00Z");
  const day = d.getUTCDate();
  if (day === 1) return day + " " + d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return String(day);
}
function fmtRange(a, b) {
  const f = (iso) => new Date(iso + "T00:00:00Z").toLocaleString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return f(a) + " – " + f(b) + " " + new Date(b + "T00:00:00Z").getUTCFullYear();
}

export default function Dashboard() {
  const [progress, setProgress] = useState({});
  const [openDay, setOpenDay] = useState(null);

  // Progress lives in localStorage; read it after mount so the server-rendered
  // HTML (which can't know it) matches the first client render.
  useEffect(() => {
    setProgress(readProgress());

    function onStorage(e) {
      if (e.key === PROGRESS_KEY) setProgress(readProgress());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function toggle(id, on) {
    setProgress((prev) => {
      const next = { ...prev };
      if (on) next[id] = true;
      else delete next[id];
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const counts = useMemo(() => {
    if (!plan) return { total: 0, done: 0 };
    let total = 0,
      done = 0;
    plan.weeks.forEach((wk) =>
      (wk.days || []).forEach((d) =>
        (d.workouts || []).forEach((w) => {
          if (isRestW(w)) return;
          total++;
          if (progress[w.id]) done++;
        })
      )
    );
    return { total, done };
  }, [plan, progress]);

  const gov = plan.raceStrategy?.governanceRules || {};
  const govOrder = [
    ["painRule", "The 24-hour rule"],
    ["progression", "Progression"],
    ["surfaces", "Surfaces"],
    ["football", "Football"],
    ["redFlags", "Stop &amp; get it checked"],
  ];
  const zones = plan.zones?.run || {};
  const start = plan.weeks[0]?.startDate;
  const end = plan.weeks[plan.weeks.length - 1]?.endDate;

  return (
    <div>
      <div className="thesis">
        <div className="wrap">
          <div className="thesis-main">
            <strong>Advance on silence, not dates.</strong>{" "}
            <span className="sub">a quiet week earns the next step; a reactive week repeats</span>
          </div>
          <div className="thesis-right">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="wrap">
        <header className="top">
          <div className="eyebrow">{(plan.meta?.totalWeeks || plan.weeks.length) + "-week block"}</div>
          <h1>{plan.meta?.event || "Training log"}</h1>
          <div className="meta-line">{start && end ? fmtRange(start, end) : ""}</div>
          <div className="progress">
            <div className="bar">
              <i style={{ width: counts.total ? Math.round((counts.done / counts.total) * 100) + "%" : "0%" }} />
            </div>
            <div className="label">
              {counts.done} of {counts.total} sessions logged
            </div>
          </div>
        </header>

        <div className="panels">
          {Object.values(gov).length ? (
            <details className="panel">
              <summary>Governing rules</summary>
              <div className="body">
                {govOrder
                  .filter(([k]) => gov[k])
                  .map(([k, lab]) => (
                    <div className="rule" key={k}>
                      <div className="k" dangerouslySetInnerHTML={{ __html: lab }} />
                      <p>{gov[k]}</p>
                    </div>
                  ))}
                {plan.raceStrategy?.nextSteps ? (
                  <div className="rule">
                    <div className="k">After the block</div>
                    <p>{plan.raceStrategy.nextSteps}</p>
                  </div>
                ) : null}
              </div>
            </details>
          ) : null}

          {zones.hr?.zones?.length || zones.pace ? (
            <details className="panel">
              <summary>Zones &amp; paces</summary>
              <div className="body">
                {zones.hr?.zones?.length ? (
                  <>
                    {zones.hr.lthr ? (
                      <p style={{ fontFamily: "var(--mono)", fontSize: 12 }}>LTHR ≈ {zones.hr.lthr} bpm</p>
                    ) : null}
                    <table className="zones">
                      <thead>
                        <tr>
                          <th>Z</th>
                          <th>Name</th>
                          <th>HR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zones.hr.zones.map((z) => (
                          <tr key={z.zone}>
                            <td className="n">{z.zone}</td>
                            <td>{z.name}</td>
                            <td className="n">
                              {z.hrLow}–{z.hrHigh}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : null}
                {zones.pace ? (
                  <p style={{ fontSize: 13 }}>
                    <strong>Paces</strong>
                    <br />
                    {["easy", "marathon", "threshold", "interval", "repetition"]
                      .filter((k) => zones.pace[k])
                      .map((k) => `${k}: ${zones.pace[k]}`)
                      .join("  ·  ")}
                    {zones.pace.note ? (
                      <>
                        <br />
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>{zones.pace.note}</span>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>

        <div className="calhead-wrap">
          <div id="cal-head">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span className="chd" key={d}>
                {d}
              </span>
            ))}
          </div>
        </div>

        {plan.weeks.map((wk) => {
          const km = wk.summary?.bySport?.run;
          return (
            <section className={"wk" + (wk.isRecoveryWeek ? " ease" : "")} key={wk.weekNumber}>
              <div className="wkband">
                <div className="wkleft">
                  <span className="wknum">W{String(wk.weekNumber).padStart(2, "0")}</span>
                  <span className="wkphase">{wk.phase}</span>
                </div>
                <div className="wkright">
                  {wk.isRecoveryWeek ? <span className="easepill">ease week</span> : null}
                  {km ? (
                    <span className="wkkm">
                      {km.km} km · {km.sessions} runs
                    </span>
                  ) : null}
                </div>
              </div>
              {wk.focus ? <div className="wkfocus">{wk.focus}</div> : null}
              <div className="daygrid">
                {(wk.days || []).map((day) => {
                  const nonRest = (day.workouts || []).filter((w) => !isRestW(w));
                  const allDone = nonRest.length && nonRest.every((w) => progress[w.id]);
                  return (
                    <div
                      key={day.date}
                      className={"cell" + (!nonRest.length ? " restday" : "") + (allDone ? " celldone" : "")}
                      tabIndex={0}
                      role="button"
                      aria-label={`Open ${day.dayOfWeek} ${day.date}`}
                      onClick={() => setOpenDay(day)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setOpenDay(day);
                        }
                      }}
                    >
                      <div className="chead">
                        <span className="cdow">{(day.dayOfWeek || "").slice(0, 3)}</span>
                        <span className="cnum">{dateLabel(day.date)}</span>
                      </div>
                      <div className="cbody">
                        {!nonRest.length ? (
                          <div className="restlabel">Rest</div>
                        ) : (
                          (day.workouts || [])
                            .filter((w) => !isRestW(w))
                            .map((w) => (
                              <div
                                key={w.id}
                                className={
                                  "pill t-" + typeKey(w) + (progress[w.id] ? " done" : "") + (isConditional(w) ? " cond" : "")
                                }
                              >
                                <label className="cb" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={!!progress[w.id]}
                                    onChange={(e) => toggle(w.id, e.target.checked)}
                                    aria-label={`Mark ${w.name} complete`}
                                  />
                                </label>
                                <span className="plabel">{shortLabel(w)}</span>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <footer>
          <div>Progress is saved in this browser. Ticks don&rsquo;t sync between devices.</div>
        </footer>
      </div>

      {openDay ? (
        <div className="modal show" onClick={(e) => e.target.classList.contains("modal") && setOpenDay(null)}>
          <div className="modal-card">
            <div className="modal-head">
              <div className="modal-date">
                {new Date(openDay.date + "T00:00:00Z").toLocaleString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "UTC",
                })}
              </div>
              <button className="modal-close" aria-label="Close" onClick={() => setOpenDay(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {(openDay.workouts || []).map((w) => {
                const rest = isRestW(w);
                const chip = !rest ? sportChip(w) : null;
                return (
                  <div key={w.id} className={"dmw" + (rest ? " rest" : "") + (progress[w.id] ? " done" : "")}>
                    <div className="dmw-top">
                      {!rest ? (
                        <label className="cb">
                          <input
                            type="checkbox"
                            checked={!!progress[w.id]}
                            onChange={(e) => toggle(w.id, e.target.checked)}
                            aria-label={`Mark ${w.name} complete`}
                          />
                        </label>
                      ) : null}
                      <div className="dmw-title">
                        <span>{w.name || "Session"}</span>
                        {chip ? <span className={"chip " + chip.cls}>{chip.label}</span> : null}
                        {isConditional(w) ? <span className="chip cond">conditional</span> : null}
                      </div>
                    </div>
                    {rest ? (
                      <div className="dmw-iso">{w.description || "Rest."}</div>
                    ) : (
                      <>
                        {w.humanReadable ? <div className="dmw-hr">{w.humanReadable}</div> : null}
                        {(() => {
                          const dist = w.distanceMeters ? w.distanceMeters / 1000 + " km" : null;
                          const meta = [dist, w.durationMinutes ? w.durationMinutes + " min" : null, w.primaryZone]
                            .filter(Boolean)
                            .join("  ·  ");
                          return meta ? <div className="dmw-zone">{meta}</div> : null;
                        })()}
                        {w.description ? <div className="dmw-desc">{w.description}</div> : null}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
