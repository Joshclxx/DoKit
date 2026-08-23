"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type TimerMode = "work" | "short-break" | "long-break";

interface Task {
  id: string;
  text: string;
  done: boolean;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.stop(ctx.currentTime + 0.8);
  } catch { /* Audio not supported */ }
}

let taskIdCounter = 0;

export default function FocusFlow() {
  const [workMin, setWorkMin] = useState(25);
  const [shortBreakMin, setShortBreakMin] = useState(5);
  const [longBreakMin, setLongBreakMin] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);

  const [mode, setMode] = useState<TimerMode>("work");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = mode === "work" ? workMin * 60 : mode === "short-break" ? shortBreakMin * 60 : longBreakMin * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setRunning(false);
    const mins = newMode === "work" ? workMin : newMode === "short-break" ? shortBreakMin : longBreakMin;
    setSecondsLeft(mins * 60);
  }, [workMin, shortBreakMin, longBreakMin]);

  // Timer tick
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          playBeep();
          // Auto-switch
          if (mode === "work") {
            const newSessions = sessions + 1;
            setSessions(newSessions);
            if (newSessions % longBreakInterval === 0) {
              switchMode("long-break");
            } else {
              switchMode("short-break");
            }
          } else {
            switchMode("work");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, sessions, longBreakInterval, switchMode]);

  // Update title with timer
  useEffect(() => {
    document.title = running ? `${formatTime(secondsLeft)} — FocusFlow | DoKit` : "FocusFlow | DoKit";
    return () => { document.title = "FocusFlow | DoKit"; };
  }, [secondsLeft, running]);

  const reset = () => {
    setRunning(false);
    const mins = mode === "work" ? workMin : mode === "short-break" ? shortBreakMin : longBreakMin;
    setSecondsLeft(mins * 60);
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [...prev, { id: `t-${++taskIdCounter}`, text: newTask.trim(), done: false }]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const modeColors: Record<TimerMode, string> = {
    work: "text-accent",
    "short-break": "text-success",
    "long-break": "text-emerald-400",
  };

  const modeLabels: Record<TimerMode, string> = {
    work: "Focus",
    "short-break": "Short Break",
    "long-break": "Long Break",
  };

  const completedTasks = tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-8">
      {/* Timer section */}
      <div className="flex flex-col items-center">
        {/* Mode tabs */}
        <div className="mb-6 flex rounded-lg border border-border bg-surface p-1">
          {(["work", "short-break", "long-break"] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                mode === m ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>

        {/* Circular progress + time */}
        <div className="relative mb-6">
          <svg width="220" height="220" viewBox="0 0 220 220" className="rotate-[-90deg]">
            <circle cx="110" cy="110" r="100" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="110" cy="110" r="100" fill="none"
              stroke="var(--accent)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 100}`}
              strokeDashoffset={`${2 * Math.PI * 100 * (1 - progress / 100)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold font-mono tracking-wider ${modeColors[mode]}`}>
              {formatTime(secondsLeft)}
            </span>
            <span className="mt-1 text-sm text-muted">{modeLabels[mode]}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRunning(!running)}
            className="flex h-12 w-32 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-accent-fg shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:-translate-y-0.5 active:translate-y-0"
          >
            {running ? "⏸ Pause" : "▶ Start"}
          </button>
          <button
            onClick={reset}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            title="Reset"
          >
            ↺
          </button>
        </div>

        {/* Session counter */}
        <div className="mt-4 text-sm text-muted">
          Session <span className="font-semibold text-foreground">{sessions}</span> · Next long break in{" "}
          <span className="font-semibold text-foreground">{longBreakInterval - (sessions % longBreakInterval)}</span>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Timer Settings</div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-muted">Focus (min)</label>
            <input type="number" min={1} max={120} value={workMin}
              onChange={(e) => { setWorkMin(Number(e.target.value)); if (mode === "work" && !running) setSecondsLeft(Number(e.target.value) * 60); }}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Short Break (min)</label>
            <input type="number" min={1} max={30} value={shortBreakMin}
              onChange={(e) => { setShortBreakMin(Number(e.target.value)); if (mode === "short-break" && !running) setSecondsLeft(Number(e.target.value) * 60); }}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Long Break (min)</label>
            <input type="number" min={1} max={60} value={longBreakMin}
              onChange={(e) => { setLongBreakMin(Number(e.target.value)); if (mode === "long-break" && !running) setSecondsLeft(Number(e.target.value) * 60); }}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Long Break Every</label>
            <input type="number" min={2} max={10} value={longBreakInterval}
              onChange={(e) => setLongBreakInterval(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Tasks</span>
          {tasks.length > 0 && (
            <span className="text-xs text-muted">{completedTasks}/{tasks.length} done</span>
          )}
        </div>

        {/* Add task */}
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add a task…"
            className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none"
          />
          <button onClick={addTask}
            className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover">
            Add
          </button>
        </div>

        {/* Task items */}
        {tasks.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">No tasks yet. Add one above to get started.</p>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-hover transition-colors">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    task.done ? "border-success bg-success text-white" : "border-border hover:border-accent"
                  }`}
                >
                  {task.done && <span className="text-xs">✓</span>}
                </button>
                <span className={`flex-1 text-sm ${task.done ? "line-through text-muted" : ""}`}>
                  {task.text}
                </span>
                <button onClick={() => removeTask(task.id)}
                  className="text-xs text-muted hover:text-danger transition-colors">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
