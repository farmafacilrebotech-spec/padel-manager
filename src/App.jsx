import { useState, useEffect, useRef, useMemo, startTransition } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green: #00E676;
    --dark: #0a0a0a;
    --surface: #111111;
    --card: #181818;
    --border: #2a2a2a;
    --muted: #555;
    --text: #e8e8e8;
    --accent: #FF5722;
    --gold: #FFD600;
    --silver: #B0BEC5;
    --bronze: #A1887F;
  }

  body { background: var(--dark); color: var(--text); font-family: 'DM Sans', sans-serif; }

  .app {
    min-height: 100vh;
    background: var(--dark);
    background-image: 
      radial-gradient(ellipse 80% 40% at 50% -10%, rgba(0,230,118,0.07) 0%, transparent 60%),
      repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.02) 39px, rgba(255,255,255,0.02) 40px),
      repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.02) 39px, rgba(255,255,255,0.02) 40px);
  }

  /* HEADER */
  .header {
    padding: 20px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    background: rgba(10,10,10,0.95);
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(10px);
  }
  .logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 26px;
    letter-spacing: 3px;
    color: var(--green);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo span { color: var(--text); }
  .logo-icon { font-size: 22px; }
  .header-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .header-logo-img {
    height: 40px;
    width: auto;
    max-width: 140px;
    object-fit: contain;
    flex-shrink: 0;
    display: block;
  }
  .logo-title-custom {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 26px;
    letter-spacing: 2px;
    color: var(--green);
    line-height: 1.05;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: min(420px, 38vw);
  }
  .config-logo-preview {
    margin-top: 10px;
    max-height: 72px;
    max-width: 180px;
    object-fit: contain;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    padding: 6px;
    display: block;
  }

  /* NAV TABS */
  .nav {
    display: flex;
    gap: 4px;
    background: var(--surface);
    padding: 4px;
    border-radius: 10px;
    border: 1px solid var(--border);
  }
  .nav-btn {
    padding: 8px 18px;
    border: none;
    border-radius: 7px;
    background: transparent;
    color: var(--muted);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .nav-btn:hover { color: var(--text); background: rgba(255,255,255,0.05); }
  .nav-btn.active { background: var(--green); color: #000; font-weight: 600; }

  /* MAIN */
  .main { padding: 32px; max-width: 1100px; margin: 0 auto; }

  /* SECTION TITLE */
  .section-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 36px;
    letter-spacing: 2px;
    color: var(--text);
    margin-bottom: 6px;
  }
  .section-sub { color: var(--muted); font-size: 14px; margin-bottom: 28px; }

  /* FORM */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group.full { grid-column: 1 / -1; }
  label { font-size: 12px; font-weight: 600; color: var(--muted); letter-spacing: 0.8px; text-transform: uppercase; }
  input, select {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 11px 14px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  input:focus, select:focus { border-color: var(--green); }
  input::placeholder { color: #333; }
  select option { background: var(--card); }

  .btn-primary {
    background: var(--green);
    color: #000;
    border: none;
    border-radius: 9px;
    padding: 13px 28px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.3px;
  }
  .btn-primary:hover { background: #33ff99; transform: translateY(-1px); }
  .btn-danger {
    background: transparent;
    color: #ef5350;
    border: 1px solid #ef5350;
    border-radius: 7px;
    padding: 5px 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-danger:hover { background: #ef535015; }
  .btn-secondary {
    background: transparent;
    color: var(--green);
    border: 1px solid var(--green);
    border-radius: 9px;
    padding: 11px 22px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-secondary:hover { background: rgba(0,230,118,0.08); }

  /* CARDS */
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 22px;
    margin-bottom: 16px;
  }
  .card-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .player-info { display: flex; flex-direction: column; gap: 2px; }
  .player-name { font-weight: 600; font-size: 15px; }
  .player-meta { font-size: 12px; color: var(--muted); }

  .badge {
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .badge-A { background: rgba(255,87,34,0.15); color: #FF5722; border: 1px solid #FF572233; }
  .badge-B { background: rgba(0,230,118,0.12); color: var(--green); border: 1px solid rgba(0,230,118,0.2); }
  .badge-C { background: rgba(176,190,197,0.12); color: var(--silver); border: 1px solid rgba(176,190,197,0.2); }
  .badge-D { background: rgba(156,39,176,0.12); color: #CE93D8; border: 1px solid rgba(156,39,176,0.25); }

  /* SETUP PANEL */
  .setup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .setup-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 22px;
  }
  .setup-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-weight: 600; }
  .setup-value { font-family: 'Bebas Neue', sans-serif; font-size: 42px; color: var(--green); line-height: 1; }

  /* MATCHES */
  .phase-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    letter-spacing: 2px;
    color: var(--muted);
    margin: 28px 0 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .phase-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .match-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 18px 22px;
    margin-bottom: 10px;
    transition: border-color 0.2s;
  }
  .match-card:hover { border-color: var(--green); }
  .match-card.played { border-color: #2a2a2a; opacity: 0.8; }
  .match-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .match-num { font-size: 11px; color: var(--muted); font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
  .match-level-badge { font-size: 11px; }

  .match-teams {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
  }
  .match-team { display: flex; flex-direction: column; gap: 3px; }
  .match-team.right { text-align: right; }
  .team-name { font-weight: 600; font-size: 14px; }
  .team-company { font-size: 11px; color: var(--muted); }
  .vs-badge {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px;
    color: var(--muted);
    padding: 6px 14px;
    background: rgba(255,255,255,0.04);
    border-radius: 8px;
    text-align: center;
  }
  .score-display {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    color: var(--green);
    letter-spacing: 2px;
  }

  .score-inputs {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
  }
  .score-input {
    width: 60px;
    text-align: center;
    padding: 8px;
    font-size: 18px;
    font-family: 'Bebas Neue', sans-serif;
  }
  .score-sep { color: var(--muted); font-family: 'Bebas Neue', sans-serif; font-size: 22px; }
  .btn-save {
    background: var(--green);
    color: #000;
    border: none;
    border-radius: 7px;
    padding: 9px 16px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    margin-left: auto;
    transition: all 0.2s;
  }
  .btn-save:hover { background: #33ff99; }

  /* STANDINGS */
  .level-section { margin-bottom: 36px; }
  .level-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }
  .level-icon { font-size: 28px; }
  .level-name { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 2px; }
  .level-A .level-name { color: #FF5722; }
  .level-B .level-name { color: var(--green); }
  .level-C .level-name { color: var(--silver); }
  .level-D .level-name { color: #CE93D8; }
  .pair-edit-grid { display: grid; gap: 12px; margin-top: 16px; }
  .pair-edit-row {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 10px;
    align-items: end;
    padding: 12px;
    background: var(--surface);
    border-radius: 10px;
    border: 1px solid var(--border);
  }
  @media (max-width: 720px) {
    .pair-edit-row { grid-template-columns: 1fr; }
  }

  .standings-table { width: 100%; border-collapse: collapse; }
  .standings-table th {
    text-align: left;
    font-size: 11px;
    color: var(--muted);
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
  }
  .standings-table td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 14px; }
  .standings-table tr:last-child td { border-bottom: none; }
  .standings-table tr:hover td { background: rgba(255,255,255,0.02); }
  .pos-badge {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
  }
  .pos-1 { background: var(--gold); color: #000; }
  .pos-2 { background: var(--silver); color: #000; }
  .pos-3 { background: var(--bronze); color: #fff; }
  .pos-other { background: var(--border); color: var(--muted); }
  .pts-badge {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px;
    color: var(--green);
  }
  .stat-cell { color: var(--muted); font-size: 13px; }

  /* CONFIG PANEL */
  .config-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
  .config-item { display: flex; flex-direction: column; gap: 6px; }

  /* TOAST */
  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--green);
    color: #000;
    padding: 12px 20px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 14px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  }
  @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--muted);
  }
  .empty-state .icon { font-size: 48px; margin-bottom: 12px; }
  .empty-state h3 { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 2px; color: #333; }

  .pair-tag { font-size: 11px; color: #FF9800; background: rgba(255,152,0,0.1); border: 1px solid rgba(255,152,0,0.2); border-radius: 12px; padding: 2px 8px; margin-left: 6px; }

  .actions-row { display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap; align-items: center; }
  
  .info-box {
    background: rgba(0,230,118,0.06);
    border: 1px solid rgba(0,230,118,0.15);
    border-radius: 10px;
    padding: 14px 18px;
    font-size: 13px;
    color: #aaa;
    margin-bottom: 20px;
  }
  .info-box strong { color: var(--green); }

  .group-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 12px;
    background: rgba(255,255,255,0.08);
    color: #aaa;
  }
  
  .tab-content { animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

  .counter-btn {
    background: var(--border);
    border: none;
    color: var(--text);
    width: 32px;
    height: 32px;
    border-radius: 6px;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  .counter-btn:hover { background: var(--green); color: #000; }
  .counter-val { font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: var(--green); min-width: 36px; text-align: center; }
  .counter-row { display: flex; align-items: center; gap: 8px; }

  .highlight-row td { background: rgba(0,230,118,0.04) !important; }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const LEVEL_ORDER = ["A", "B", "C", "D"];

function getActiveLevels(levelCount) {
  const n = Math.min(4, Math.max(2, Number(levelCount) || 3));
  return LEVEL_ORDER.slice(0, n);
}

const levelLabel = {
  A: "Nivel Alto",
  B: "Nivel Medio",
  C: "Nivel Bajo",
  D: "4ª categoría",
};
const levelEmoji = { A: "🔥", B: "⚡", C: "🎾", D: "💎" };

function clampPlayerLevel(nivel, activeLevels) {
  if (activeLevels.includes(nivel)) return nivel;
  if (activeLevels.includes("B")) return "B";
  return activeLevels[activeLevels.length - 1] || activeLevels[0];
}

const nivelOptionLabel = (lvl) => {
  if (lvl === "A") return "A — Alto";
  if (lvl === "B") return "B — Medio";
  if (lvl === "C") return "C — Iniciación";
  return "D — 4ª categoría";
};

/** Texto solo ASCII imprimible para jsPDF (sin emojis ni fuera de Latin basico) */
function pdfSafeText(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00f1/g, "n")
    .replace(/\u00d1/g, "N")
    .replace(/[^\x20-\x7E]/g, "");
}

const levelPdfShort = { A: "Alto", B: "Medio", C: "Bajo", D: "4a categoria" };

const MATCH_FORMAT_LABELS = {
  "1set": "1 set",
  "2sets": "2 sets",
  "11pts": "11 puntos",
  "21pts": "21 puntos",
};

const MATCH_FORMAT_MINUTES = {
  "1set": 30,
  "2sets": 50,
  "11pts": 20,
  "21pts": 35,
};

function matchPhaseLabel(phase) {
  if (phase === "clasificacion") return "Fase de Clasificacion";
  if (phase === "group") return "Fase de grupos";
  return String(phase || "");
}

function syncMatchPairRefs(matches, pairs) {
  const map = new Map(pairs.map((p) => [p.id, p]));
  return matches.map((m) => ({
    ...m,
    pair1: map.get(m.pair1.id) ?? m.pair1,
    pair2: map.get(m.pair2.id) ?? m.pair2,
  }));
}

function makeMatch(phase, level, pair1, pair2) {
  return {
    id: uid(),
    phase,
    level,
    pair1,
    pair2,
    score1: "",
    score2: "",
    played: false,
    jornada: 0,
  };
}

function generateClasificacionMatches(pairs) {
  const byLevel = {};
  pairs.forEach((p) => {
    if (!p.p2) return;
    if (!byLevel[p.level]) byLevel[p.level] = [];
    byLevel[p.level].push(p);
  });
  const matches = [];
  Object.entries(byLevel).forEach(([level, lvlPairs]) => {
    const n = lvlPairs.length;
    if (n < 2) return;
    const deg = new Array(n).fill(0);
    const maxDeg = Math.min(2, n - 1);
    const edges = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) edges.push([i, j]);
    for (const [i, j] of edges) {
      if (deg[i] >= maxDeg || deg[j] >= maxDeg) continue;
      if (deg[i] < 1 || deg[j] < 1) {
        matches.push(makeMatch("clasificacion", level, lvlPairs[i], lvlPairs[j]));
        deg[i]++;
        deg[j]++;
      }
    }
    for (const [i, j] of edges) {
      if (deg[i] >= maxDeg || deg[j] >= maxDeg) continue;
      if (deg[i] < maxDeg && deg[j] < maxDeg) {
        matches.push(makeMatch("clasificacion", level, lvlPairs[i], lvlPairs[j]));
        deg[i]++;
        deg[j]++;
      }
    }
  });
  return matches;
}

/** Reparte partidos en jornadas: como mucho `numCourts` por jornada, sin repetir pareja en la misma jornada, priorizando descanso tras jugar. */
function assignJornadasToPhase(matches, numCourts) {
  const C = Math.max(1, Number(numCourts) || 1);
  if (!matches.length) return [];
  const pending = matches.map((m) => ({ ...m }));
  const pairLastJornada = new Map();
  const out = [];
  let jornada = 1;

  while (pending.length > 0) {
    const scored = pending.map((m) => {
      const l1 = pairLastJornada.get(m.pair1.id) || 0;
      const l2 = pairLastJornada.get(m.pair2.id) || 0;
      const rested = (l1 !== jornada - 1 ? 1 : 0) + (l2 !== jornada - 1 ? 1 : 0);
      const fatigue = Math.max(l1, l2);
      return { m, rested, fatigue };
    });
    scored.sort((a, b) => b.rested - a.rested || a.fatigue - b.fatigue);

    const usedPairs = new Set();
    const roundPick = [];

    const pickFrom = (candidates) => {
      for (const { m } of candidates) {
        if (roundPick.length >= C) break;
        const a = m.pair1.id;
        const b = m.pair2.id;
        if (usedPairs.has(a) || usedPairs.has(b)) continue;
        roundPick.push(m);
        usedPairs.add(a);
        usedPairs.add(b);
      }
    };

    pickFrom(scored);

    if (roundPick.length === 0) {
      for (const m of pending) {
        if (roundPick.length >= C) break;
        const a = m.pair1.id;
        const b = m.pair2.id;
        if (usedPairs.has(a) || usedPairs.has(b)) continue;
        roundPick.push(m);
        usedPairs.add(a);
        usedPairs.add(b);
      }
    }

    if (roundPick.length === 0) {
      const m0 = pending[0];
      out.push({ ...m0, jornada });
      pairLastJornada.set(m0.pair1.id, jornada);
      pairLastJornada.set(m0.pair2.id, jornada);
      pending.splice(0, 1);
      jornada++;
      continue;
    }

    for (const m of roundPick) {
      out.push({ ...m, jornada });
      pairLastJornada.set(m.pair1.id, jornada);
      pairLastJornada.set(m.pair2.id, jornada);
      const idx = pending.findIndex((x) => x.id === m.id);
      if (idx >= 0) pending.splice(idx, 1);
    }
    jornada++;
  }

  return out;
}

function buildJornadaRounds(matches, phase, activeLevels) {
  const list = matches.filter((m) => m.phase === phase);
  const byJ = {};
  for (const m of list) {
    const jn = m.jornada ?? 0;
    if (!byJ[jn]) byJ[jn] = [];
    byJ[jn].push(m);
  }
  return Object.keys(byJ)
    .map(Number)
    .sort((a, b) => a - b)
    .map((jn) => ({
      jornada: jn,
      rows: (byJ[jn] || []).sort(
        (a, b) => activeLevels.indexOf(a.level) - activeLevels.indexOf(b.level)
      ),
    }));
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function normalizeImportHeader(h) {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

function buildImportKeyMap(headers) {
  const map = {};
  for (const key of headers) {
    const n = normalizeImportHeader(key);
    if (n === "nombre") map.nombre = key;
    else if (n === "apellidos") map.apellidos = key;
    else if (n === "telefono") map.telefono = key;
    else if (n === "empresa") map.empresa = key;
    else if (n === "email") map.email = key;
    else if (n === "nivel") map.nivel = key;
    else if (n === "pairwith") map.pairWith = key;
  }
  return map;
}

function normalizeImportLevel(val, activeLevels = getActiveLevels(3)) {
  const v = String(val ?? "").trim().toUpperCase();
  if (activeLevels.includes(v)) return v;
  if (activeLevels.includes("B")) return "B";
  return activeLevels[0];
}

function importCell(row, keyMap, field) {
  const k = keyMap[field];
  if (!k) return "";
  const v = row[k];
  if (v == null) return "";
  return String(v).trim();
}

function downloadPlayerTemplateXlsx() {
  const rows = [
    ["nombre", "apellidos", "telefono", "empresa", "email", "nivel", "pairWith"],
    ["Ana", "López Ruiz", "600111222", "Acme S.L.", "ana@ejemplo.com", "B", "García"],
    ["Carlos", "García Pérez", "600333444", "Acme S.L.", "carlos@ejemplo.com", "A", ""],
    ["María", "Fernández León", "600555666", "Beta Coop", "maria@ejemplo.com", "C", "López"],
    [
      "",
      "",
      "",
      "",
      "",
      "Valores válidos: A, B, C o D (según categorías del torneo). Vacío o inválido → nivel por defecto.",
      "",
    ],
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Jugadores");
  XLSX.writeFile(wb, "plantilla-jugadores.xlsx");
}

function buildPairs(players, activeLevels) {
  const used = new Set();
  const pairs = [];
  const solo = [];

  // First pass: explicit pairs
  players.forEach((p) => {
    if (!used.has(p.id) && p.pairWith) {
      const needle = String(p.pairWith ?? "").toLowerCase();
      const partner = players.find((x) => {
        if (used.has(x.id) || x.id === p.id) return false;
        const nx = String(x.nombre ?? "").toLowerCase();
        const ax = String(x.apellidos ?? "").toLowerCase();
        return nx.includes(needle) || ax.includes(needle);
      });
      if (partner) {
        const lvl = clampPlayerLevel(p.nivel, activeLevels);
        pairs.push({ id: uid(), p1: p, p2: partner, level: lvl });
        used.add(p.id);
        used.add(partner.id);
      }
    }
  });

  // Second pass: unmatched
  players.forEach((p) => {
    if (!used.has(p.id)) solo.push(p);
  });

  // Pair solos by level (clamp level to active categories)
  const byLevel = {};
  solo.forEach((p) => {
    const lvl = clampPlayerLevel(p.nivel, activeLevels);
    if (!byLevel[lvl]) byLevel[lvl] = [];
    byLevel[lvl].push(p);
  });

  activeLevels.forEach((lvl) => {
    const pls = byLevel[lvl];
    if (!pls?.length) return;
    for (let i = 0; i + 1 < pls.length; i += 2) {
      pairs.push({ id: uid(), p1: pls[i], p2: pls[i + 1], level: lvl });
    }
    if (pls.length % 2 !== 0) {
      const leftover = pls[pls.length - 1];
      pairs.push({ id: uid(), p1: leftover, p2: null, level: lvl });
    }
  });

  return pairs;
}

function pairsToDraft(pairs) {
  return pairs.map((pair) => ({
    rowId: pair.id,
    p1Id: pair.p1.id,
    p2Id: pair.p2 ? pair.p2.id : "",
  }));
}

function draftToPairs(draft, players, activeLevels) {
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  const result = [];
  const used = new Set();
  for (const row of draft) {
    if (!row.p1Id) return { error: "missing" };
    const p1 = byId[row.p1Id];
    if (!p1) return { error: "missing" };
    if (row.p2Id && row.p1Id === row.p2Id) return { error: "same" };
    if (used.has(row.p1Id)) return { error: "dup" };
    used.add(row.p1Id);
    if (row.p2Id) {
      const p2 = byId[row.p2Id];
      if (!p2) return { error: "missing" };
      if (used.has(row.p2Id)) return { error: "dup" };
      used.add(row.p2Id);
      const lvl = clampPlayerLevel(p1.nivel, activeLevels);
      result.push({ id: row.rowId || uid(), p1, p2, level: lvl });
    } else {
      const lvl = clampPlayerLevel(p1.nivel, activeLevels);
      result.push({ id: row.rowId || uid(), p1, p2: null, level: lvl });
    }
  }
  return { pairs: result };
}

function generateGroupMatches(pairs) {
  const byLevel = {};
  pairs.forEach((p) => {
    if (!p.p2) return;
    if (!byLevel[p.level]) byLevel[p.level] = [];
    byLevel[p.level].push(p);
  });

  const matches = [];
  Object.entries(byLevel).forEach(([level, lvlPairs]) => {
    // Round robin
    for (let i = 0; i < lvlPairs.length; i++) {
      for (let j = i + 1; j < lvlPairs.length; j++) {
        matches.push({
          id: uid(),
          phase: "group",
          level,
          pair1: lvlPairs[i],
          pair2: lvlPairs[j],
          score1: "",
          score2: "",
          played: false,
          jornada: 0,
        });
      }
    }
  });
  return matches;
}

function calcStandings(pairs, matches) {
  const stats = {};
  pairs.forEach((p) => {
    if (!p.p2) return;
    stats[p.id] = { pair: p, pts: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 };
  });

  matches.forEach((m) => {
    if (!m.played || m.phase !== "group") return;
    const s1 = parseInt(m.score1) || 0;
    const s2 = parseInt(m.score2) || 0;
    const id1 = m.pair1.id;
    const id2 = m.pair2.id;
    if (!stats[id1] || !stats[id2]) return;

    stats[id1].played++;
    stats[id2].played++;
    stats[id1].gf += s1;
    stats[id1].ga += s2;
    stats[id2].gf += s2;
    stats[id2].ga += s1;

    if (s1 > s2) {
      stats[id1].pts += 2; stats[id1].won++;
      stats[id2].lost++;
    } else if (s2 > s1) {
      stats[id2].pts += 2; stats[id2].won++;
      stats[id1].lost++;
    } else {
      stats[id1].pts += 1; stats[id1].drawn++;
      stats[id2].pts += 1; stats[id2].drawn++;
    }
  });

  const byLevel = {};
  Object.values(stats).forEach((s) => {
    const lvl = s.pair.level;
    if (!byLevel[lvl]) byLevel[lvl] = [];
    byLevel[lvl].push(s);
  });

  Object.keys(byLevel).forEach((lvl) => {
    byLevel[lvl].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
  });

  return byLevel;
}

const PDF_MARGIN = 14;
const PDF_PTS_GREEN = [0, 150, 72];

function pairPdfLabel(pair) {
  const a = `${pair.p1.nombre} ${pair.p1.apellidos}`.trim();
  if (pair.p2) return pdfSafeText(`${a} / ${pair.p2.nombre} ${pair.p2.apellidos}`.trim());
  return pdfSafeText(`${a} (sin pareja)`);
}

function pdfImageFormat(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  if (/^data:image\/png/i.test(dataUrl)) return "PNG";
  if (/^data:image\/jpe?g/i.test(dataUrl)) return "JPEG";
  return null;
}

function getPdfLogoSizeMm(dataUrl, maxW, maxH) {
  return new Promise((resolve) => {
    const fmt = pdfImageFormat(dataUrl);
    if (!fmt) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      if (!nw || !nh) {
        resolve(null);
        return;
      }
      const r = nw / nh;
      let w = maxW;
      let h = w / r;
      if (h > maxH) {
        h = maxH;
        w = h * r;
      }
      resolve({ w, h, format: fmt });
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function addPdfPageFooters(doc, margin = PDF_MARGIN) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(8);
  doc.setTextColor(88, 88, 88);
  doc.setFont("helvetica", "normal");
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Pagina ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 9, { align: "right" });
  }
}

function buildPdfScheduleSections(matches, activeLevels) {
  const cl = (matches || []).filter((m) => m.phase === "clasificacion" && (m.jornada ?? 0) > 0);
  const gr = (matches || []).filter((m) => m.phase === "group" && (m.jornada ?? 0) > 0);
  const byRound = (arr) => {
    const map = {};
    for (const m of arr) {
      const jr = m.jornada ?? 0;
      if (!map[jr]) map[jr] = [];
      map[jr].push(m);
    }
    return Object.keys(map)
      .map(Number)
      .sort((a, b) => a - b)
      .map((jr) => ({
        jornada: jr,
        rows: map[jr].sort(
          (a, b) =>
            activeLevels.indexOf(a.level) - activeLevels.indexOf(b.level) ||
            pairPdfLabel(a.pair1).localeCompare(pairPdfLabel(b.pair1))
        ),
      }));
  };
  const out = [];
  if (cl.length) out.push({ title: "Fase de clasificacion", rounds: byRound(cl) });
  if (gr.length) out.push({ title: "Fase de grupos", rounds: byRound(gr) });
  return out;
}

async function exportClasificacionPdf(standings, branding, activeLevels, matches = []) {
  const displayTitle = pdfSafeText((branding?.tournamentName ?? "").trim() || "PADEL MANAGER");
  const logoDataUrl = branding?.logoDataUrl ?? "";

  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const m = PDF_MARGIN;

  const paintWhitePage = () => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, "F");
  };

  paintWhitePage();
  doc.setTextColor(0, 0, 0);

  let y = m;
  const logoBox = logoDataUrl ? await getPdfLogoSizeMm(logoDataUrl, 38, 22) : null;
  if (logoBox) {
    try {
      doc.addImage(logoDataUrl, logoBox.format, pageW - m - logoBox.w, m, logoBox.w, logoBox.h);
    } catch {
      /* PNG/JPEG en PDF; SVG se omite */
    }
  }

  const titleText = `${displayTitle} - Clasificacion`;
  doc.setFont("helvetica", "bold");
  let titleSize = 15;
  doc.setFontSize(titleSize);
  const maxTitleW = pageW - 2 * m - (logoBox ? logoBox.w + 4 : 0);
  while (titleSize > 9 && doc.getTextWidth(titleText) > maxTitleW) {
    titleSize -= 0.5;
    doc.setFontSize(titleSize);
  }
  doc.text(titleText, m, y + 4);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    pdfSafeText(
      new Date().toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    ),
    m,
    y
  );
  y += 12;

  const head = [["Pos", "Pareja", "Empresa", "PJ", "G", "E", "P", "GF", "GC", "Pts"]];
  const hasRows = activeLevels.some((lvl) => standings[lvl]?.length);

  if (!hasRows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("No hay parejas clasificadas.", m, y);
    y += 14;
  } else {
    let startedAnyTable = false;
    for (const lvl of activeLevels) {
      const rows = standings[lvl];
      if (!rows?.length) continue;

      if (startedAnyTable) {
        y = doc.lastAutoTable.finalY + 12;
      }
      startedAnyTable = true;

      if (y > pageH - 55) {
        doc.addPage();
        paintWhitePage();
        doc.setTextColor(0, 0, 0);
        y = m;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`Nivel ${lvl} - ${levelPdfShort[lvl] ?? lvl}`, m, y);
      y += 7;

      autoTable(doc, {
        startY: y,
        head,
        body: rows.map((row, i) => [
          String(i + 1),
          pairPdfLabel(row.pair),
          pdfSafeText(row.pair.p1.empresa || "-"),
          String(row.played),
          String(row.won),
          String(row.drawn),
          String(row.lost),
          String(row.gf),
          String(row.ga),
          String(row.pts),
        ]),
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 1.5,
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          lineColor: [190, 190, 190],
          lineWidth: 0.05,
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { cellWidth: 52 },
          2: { cellWidth: 30 },
          3: { halign: "center", cellWidth: 9 },
          4: { halign: "center", cellWidth: 9 },
          5: { halign: "center", cellWidth: 9 },
          6: { halign: "center", cellWidth: 9 },
          7: { halign: "center", cellWidth: 9 },
          8: { halign: "center", cellWidth: 9 },
          9: { halign: "center", cellWidth: 15, textColor: PDF_PTS_GREEN, fontStyle: "bold" },
        },
        margin: { left: m, right: m },
      });
    }
    y = doc.lastAutoTable?.finalY != null ? doc.lastAutoTable.finalY + 14 : y;
  }

  const schedSections = buildPdfScheduleSections(matches, activeLevels);
  if (schedSections.length) {
    let ySch = y;
    const bumpPage = () => {
      if (ySch > pageH - 42) {
        doc.addPage();
        paintWhitePage();
        doc.setTextColor(0, 0, 0);
        ySch = m;
      }
    };
    bumpPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Partidos por jornada", m, ySch);
    ySch += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    for (const sec of schedSections) {
      bumpPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(pdfSafeText(sec.title), m, ySch);
      ySch += 7;
      doc.setFont("helvetica", "normal");

      for (const round of sec.rounds) {
        bumpPage();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(pdfSafeText(`Jornada ${round.jornada}`), m, ySch);
        ySch += 6;
        doc.setFont("helvetica", "normal");

        autoTable(doc, {
          startY: ySch,
          head: [["Nivel", "Pareja A", "Pareja B", "Marcador"]],
          body: round.rows.map((mm) => [
            pdfSafeText(mm.level),
            pairPdfLabel(mm.pair1),
            pairPdfLabel(mm.pair2),
            mm.played ? pdfSafeText(`${mm.score1} - ${mm.score2}`) : "-",
          ]),
          theme: "grid",
          styles: {
            fontSize: 8,
            cellPadding: 1.2,
            textColor: [0, 0, 0],
            fillColor: [255, 255, 255],
            lineColor: [190, 190, 190],
            lineWidth: 0.05,
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: "bold",
          },
          columnStyles: {
            0: { halign: "center", cellWidth: 12 },
            1: { cellWidth: 58 },
            2: { cellWidth: 58 },
            3: { halign: "center", cellWidth: 22 },
          },
          margin: { left: m, right: m },
        });
        ySch = doc.lastAutoTable.finalY + 10;
      }
    }
  }

  addPdfPageFooters(doc);
  doc.save("clasificacion-padel.pdf");
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const importFileRef = useRef(null);
  const [tab, setTab] = useState("inscripcion");
  const [players, setPlayers] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [toast, setToast] = useState(null);
  const [config, setConfig] = useState({
    courts: 1,
    matchDuration: MATCH_FORMAT_MINUTES["1set"],
    matchFormat: "1set",
    format: "group+liga",
    levelCount: 3,
  });
  const [tournamentName, setTournamentName] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const logoFileRef = useRef(null);
  const [form, setForm] = useState({
    nombre: "", apellidos: "", telefono: "", empresa: "", email: "", nivel: "B", pairWith: "",
  });
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [groupPhaseStarted, setGroupPhaseStarted] = useState(false);
  const [manualPairs, setManualPairs] = useState(null);
  const [editingPairs, setEditingPairs] = useState(false);
  const [pairEditDraft, setPairEditDraft] = useState(null);

  const activeLevels = getActiveLevels(config.levelCount);

  const playersKey = useMemo(() => [...players.map((p) => p.id)].sort().join(","), [players]);

  const autoSuggestedPairs = useMemo(() => {
    try {
      return buildPairs(players, activeLevels);
    } catch {
      return [];
    }
  }, [players, activeLevels.join("")]);

  const previewPairsPreStart = manualPairs ?? autoSuggestedPairs;

  const fullPairCount = useMemo(
    () => (tournamentStarted ? pairs : previewPairsPreStart).filter((p) => p.p2).length,
    [tournamentStarted, pairs, previewPairsPreStart]
  );
  const recommendedCourts = useMemo(() => Math.max(1, Math.ceil(fullPairCount / 4)), [fullPairCount]);

  useEffect(() => {
    if (tournamentStarted) return;
    setConfig((c) => ({ ...c, courts: recommendedCourts }));
  }, [recommendedCourts, tournamentStarted]);

  useEffect(() => {
    setMatches((ms) => {
      if (!ms.length) return ms;
      const cl = ms.filter((m) => m.phase === "clasificacion");
      const gr = ms.filter((m) => m.phase === "group");
      return [
        ...(cl.length ? assignJornadasToPhase(cl, config.courts) : []),
        ...(gr.length ? assignJornadasToPhase(gr, config.courts) : []),
      ];
    });
  }, [config.courts]);

  useEffect(() => {
    setManualPairs(null);
  }, [playersKey]);

  useEffect(() => {
    const L = getActiveLevels(config.levelCount);
    setForm((f) =>
      L.includes(f.nivel) ? f : { ...f, nivel: L.includes("B") ? "B" : L[0] }
    );
  }, [config.levelCount]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleTournamentNameChange = (e) => {
    const v = e.target?.value;
    setTournamentName(typeof v === "string" ? v : String(v ?? ""));
  };

  const handleLogoFileChange = (e) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const okMime = /^image\/(png|jpeg|svg\+xml)$/i.test(file.type);
    const okExt = /\.(png|jpe?g|svg)$/i.test(file.name);
    if (!okMime && !okExt) {
      showToast("⚠️ Usa PNG, JPG o SVG");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      if (typeof url !== "string") return;
      startTransition(() => {
        setLogoDataUrl(url);
      });
    };
    reader.onerror = () => showToast("⚠️ No se pudo leer la imagen");
    reader.readAsDataURL(file);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = () => {
    if (!form.nombre || !form.apellidos || !form.email) {
      showToast("⚠️ Rellena los campos obligatorios");
      return;
    }
    const L = getActiveLevels(config.levelCount);
    const defNivel = L.includes("B") ? "B" : L[0];
    const newPlayer = { ...form, id: uid(), nivel: clampPlayerLevel(form.nivel, L) };
    setPlayers((prev) => [...prev, newPlayer]);
    setForm({
      nombre: "",
      apellidos: "",
      telefono: "",
      empresa: "",
      email: "",
      nivel: defNivel,
      pairWith: "",
    });
    showToast("✅ Jugador inscrito");
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        if (!(data instanceof ArrayBuffer)) {
          showToast("⚠️ No se pudo leer el archivo");
          return;
        }
        const wb = XLSX.read(data, { type: "array" });
        const sheetName = wb.SheetNames[0];
        if (!sheetName) {
          showToast("⚠️ El archivo no contiene hojas");
          return;
        }
        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
        if (!rows.length) {
          showToast("⚠️ No hay filas de datos en el archivo");
          return;
        }
        const keyMap = buildImportKeyMap(Object.keys(rows[0]));
        const importLevels = getActiveLevels(config.levelCount);
        let skipped = 0;
        const newPlayers = [];
        for (const row of rows) {
          const nombre = importCell(row, keyMap, "nombre");
          const apellidos = importCell(row, keyMap, "apellidos");
          const email = importCell(row, keyMap, "email");
          if (!nombre || !apellidos || !email) {
            skipped++;
            continue;
          }
          newPlayers.push({
            id: uid(),
            nombre,
            apellidos,
            telefono: importCell(row, keyMap, "telefono"),
            empresa: importCell(row, keyMap, "empresa"),
            email,
            nivel: normalizeImportLevel(importCell(row, keyMap, "nivel"), importLevels),
            pairWith: importCell(row, keyMap, "pairWith"),
          });
        }
        if (!newPlayers.length) {
          showToast(
            skipped
              ? `⚠️ Ninguna fila válida (${skipped} omitida${skipped !== 1 ? "s" : ""})`
              : "⚠️ No se importó ningún jugador"
          );
          return;
        }
        setPlayers((prev) => [...prev, ...newPlayers]);
        let msg = `✅ ${newPlayers.length} jugador${newPlayers.length !== 1 ? "es" : ""} importado${newPlayers.length !== 1 ? "s" : ""}`;
        if (skipped) {
          msg += `. ⚠️ ${skipped} fila${skipped !== 1 ? "s" : ""} omitida${skipped !== 1 ? "s" : ""} (nombre, apellidos o email vacíos)`;
        }
        showToast(msg);
      } catch (err) {
        console.error(err);
        showToast("⚠️ No se pudo leer el archivo");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDeletePlayer = (id) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const getPairsForGeneration = () => manualPairs ?? buildPairs(players, activeLevels);

  const handleStartTournament = () => {
    if (players.length < 2) { showToast("⚠️ Necesitas al menos 2 jugadores"); return; }
    const newPairs = getPairsForGeneration();
    const newMatches = assignJornadasToPhase(
      generateClasificacionMatches(newPairs),
      config.courts
    );
    setPairs(newPairs);
    setMatches(newMatches);
    setGroupPhaseStarted(false);
    setManualPairs(null);
    setEditingPairs(false);
    setPairEditDraft(null);
    setTournamentStarted(true);
    showToast("🏆 Fase de clasificación generada");
    setTab("cruces");
  };

  const beginGruposPhase = () => {
    const pending = matches.filter((m) => m.phase === "clasificacion" && !m.played).length;
    if (pending > 0 && !confirm(`Quedan ${pending} partida(s) de clasificación sin resultado. ¿Iniciar la fase de grupos?`)) return;
    setGroupPhaseStarted(true);
    showToast("Fase de grupos iniciada");
    setMatches((ms) => {
      const cls = ms.filter((m) => m.phase === "clasificacion");
      const grouped = assignJornadasToPhase(generateGroupMatches(pairs), config.courts);
      return [...cls, ...grouped];
    });
  };

  const movePairLevel = (pairId, delta) => {
    if (!tournamentStarted || groupPhaseStarted) {
      showToast("⚠️ Reclasifica solo antes de iniciar grupos");
      return;
    }
    if (matches.some((m) => m.phase === "clasificacion" && m.played)) {
      if (!confirm("Reclasificar reiniciará las partidas de clasificación (se pierden resultados de esta fase). ¿Continuar?")) return;
    }
    setPairs((prev) => {
      const pi = prev.findIndex((p) => p.id === pairId);
      if (pi < 0) return prev;
      const p = prev[pi];
      const li = activeLevels.indexOf(p.level);
      if (li < 0) return prev;
      const ni = Math.max(0, Math.min(activeLevels.length - 1, li + delta));
      if (ni === li) return prev;
      const nl = activeLevels[ni];
      const next = prev.map((x, i) => (i === pi ? { ...x, level: nl } : x));
      queueMicrotask(() =>
        setMatches(assignJornadasToPhase(generateClasificacionMatches(next), config.courts))
      );
      return next;
    });
    showToast("Nivel de pareja actualizado");
  };

  const beginEditPairs = () => {
    if (tournamentStarted) {
      if (!confirm("Se regenerarán todos los partidos y se perderán los resultados guardados. ¿Continuar?")) return;
    }
    const source = tournamentStarted ? pairs : previewPairsPreStart;
    setPairEditDraft(pairsToDraft(source));
    setEditingPairs(true);
  };

  const cancelPairEdit = () => {
    setEditingPairs(false);
    setPairEditDraft(null);
  };

  const updatePairDraftRow = (index, field, value) => {
    setPairEditDraft((prev) => {
      if (!prev) return prev;
      const next = prev.map((row, i) => (i === index ? { ...row, [field]: value } : row));
      return next;
    });
  };

  const confirmPairEdit = () => {
    if (!pairEditDraft) return;
    const seen = new Set();
    for (const row of pairEditDraft) {
      if (!row.p1Id) {
        showToast("⚠️ Cada fila debe tener un jugador principal");
        return;
      }
      if (row.p2Id && row.p1Id === row.p2Id) {
        showToast("⚠️ Los dos jugadores de una pareja no pueden ser la misma persona");
        return;
      }
      if (seen.has(row.p1Id)) {
        showToast("⚠️ Un jugador no puede estar en dos parejas a la vez");
        return;
      }
      seen.add(row.p1Id);
      if (row.p2Id) {
        if (seen.has(row.p2Id)) {
          showToast("⚠️ Un jugador no puede estar en dos parejas a la vez");
          return;
        }
        seen.add(row.p2Id);
      }
    }
    const built = draftToPairs(pairEditDraft, players, activeLevels);
    if (built.error) {
      showToast("⚠️ Un jugador no puede estar en dos parejas a la vez");
      return;
    }
    if (!tournamentStarted) {
      setManualPairs(built.pairs);
    } else {
      setPairs(built.pairs);
      if (!groupPhaseStarted) {
        setMatches(assignJornadasToPhase(generateClasificacionMatches(built.pairs), config.courts));
      } else {
        setMatches((ms) => {
          const cls = ms.filter((m) => m.phase === "clasificacion");
          const grouped = assignJornadasToPhase(generateGroupMatches(built.pairs), config.courts);
          return [...cls, ...grouped];
        });
      }
    }
    setEditingPairs(false);
    setPairEditDraft(null);
    showToast("✅ Parejas confirmadas");
  };

  const playerOptionLabel = (p) =>
    `${String(p?.nombre ?? "")} ${String(p?.apellidos ?? "")} (${clampPlayerLevel(p?.nivel, activeLevels)})`.trim();

  const handleScoreChange = (matchId, field, val) => {
    setMatches((prev) =>
      prev.map((m) => m.id === matchId ? { ...m, [field]: val } : m)
    );
  };

  const handleSaveScore = (matchId) => {
    setMatches((prev) =>
      prev.map((m) => m.id === matchId ? { ...m, played: true } : m)
    );
    showToast("💾 Resultado guardado");
  };

  const clasificacionJornadas = useMemo(
    () => buildJornadaRounds(matches, "clasificacion", activeLevels),
    [matches, activeLevels.join("")]
  );
  const gruposJornadas = useMemo(
    () => buildJornadaRounds(matches, "group", activeLevels),
    [matches, activeLevels.join("")]
  );
  const jornadasClasificacion = clasificacionJornadas.length
    ? Math.max(...clasificacionJornadas.map((x) => x.jornada))
    : 0;
  const jornadasGrupos = gruposJornadas.length
    ? Math.max(...gruposJornadas.map((x) => x.jornada))
    : 0;
  const totalJornadas = jornadasClasificacion + jornadasGrupos;
  const totalEstimMin = totalJornadas * (Number(config.matchDuration) || 30);

  const renderMatchCard = (m) => {
    const lvl = m.level;
    return (
      <div key={m.id} className={`match-card ${m.played ? "played" : ""}`}>
        <div className="match-header">
          <span className="match-num">
            {matchPhaseLabel(m.phase)} · {lvl}
          </span>
          {m.played && <span style={{ color: "var(--green)", fontSize: 12, fontWeight: 700 }}>✓ Jugado</span>}
        </div>
        <div className="match-teams">
          <div className="match-team">
            <div className="team-name">{m.pair1.p1.nombre} {m.pair1.p1.apellidos}</div>
            <div className="team-company">{m.pair1.p2?.nombre} {m.pair1.p2?.apellidos}</div>
          </div>
          <div className="vs-badge">
            {m.played ? (
              <span className="score-display">{m.score1} - {m.score2}</span>
            ) : "VS"}
          </div>
          <div className="match-team right">
            <div className="team-name">{m.pair2.p1.nombre} {m.pair2.p1.apellidos}</div>
            <div className="team-company">{m.pair2.p2?.nombre} {m.pair2.p2?.apellidos}</div>
          </div>
        </div>
        {!m.played && (
          <div className="score-inputs">
            <input
              type="number"
              min="0"
              className="score-input"
              placeholder="0"
              value={m.score1}
              onChange={(e) => handleScoreChange(m.id, "score1", e.target.value)}
            />
            <span className="score-sep">-</span>
            <input
              type="number"
              min="0"
              className="score-input"
              placeholder="0"
              value={m.score2}
              onChange={(e) => handleScoreChange(m.id, "score2", e.target.value)}
            />
            <button type="button" className="btn-save" onClick={() => handleSaveScore(m.id)}>
              Guardar resultado
            </button>
          </div>
        )}
        {m.played && (
          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}
              onClick={() => setMatches((prev) => prev.map((x) => x.id === m.id ? { ...x, played: false } : x))}
            >
              ✏️ Editar
            </button>
          </div>
        )}
      </div>
    );
  };

  const standings = calcStandings(pairs, matches);

  const pairLabel = (pair) =>
    pair.p2
      ? `${pair.p1.nombre} ${pair.p1.apellidos} / ${pair.p2.nombre} ${pair.p2.apellidos}`
      : `${pair.p1.nombre} ${pair.p1.apellidos} (sin pareja)`;

  const TABS = [
    { key: "inscripcion", label: "📋 Inscripción" },
    { key: "cruces", label: "⚔️ Cruces" },
    { key: "clasificacion", label: "🏆 Clasificación" },
    { key: "config", label: "⚙️ Configuración" },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <header className="header">
          <div className="logo header-brand">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="" className="header-logo-img" />
            ) : (
              <span className="logo-icon">🎾</span>
            )}
            {(tournamentName || "").trim() ? (
              <span className="logo-title-custom" title={(tournamentName || "").trim()}>
                {(tournamentName || "").trim()}
              </span>
            ) : (
              <>
                PÁDEL<span>MANAGER</span>
              </>
            )}
          </div>
          <nav className="nav">
            {TABS.map((t) => (
              <button
                type="button"
                key={t.key}
                className={`nav-btn ${tab === t.key ? "active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="main">
          {/* ── INSCRIPCIÓN ─────────────────────────────────────────── */}
          {tab === "inscripcion" && (
            <div className="tab-content">
              <div className="section-title">Inscripción</div>
              <div className="section-sub">Registra a los jugadores del torneo</div>

              <div className="card" style={{ marginBottom: 28 }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input name="nombre" placeholder="Carlos" value={form.nombre} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Apellidos *</label>
                    <input name="apellidos" placeholder="García López" value={form.apellidos} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input name="telefono" placeholder="612 345 678" value={form.telefono} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Empresa</label>
                    <input name="empresa" placeholder="Mi Empresa S.L." value={form.empresa} onChange={handleFormChange} />
                  </div>
                  <div className="form-group full">
                    <label>Email *</label>
                    <input name="email" type="email" placeholder="carlos@empresa.com" value={form.email} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Nivel de juego</label>
                    <select name="nivel" value={form.nivel} onChange={handleFormChange}>
                      {activeLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>{nivelOptionLabel(lvl)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>¿Ya tiene pareja? (nombre o apellido)</label>
                    <input name="pairWith" placeholder="Apellido de tu pareja" value={form.pairWith} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="actions-row">
                  <button type="button" className="btn-primary" onClick={handleRegister}>+ Inscribir jugador</button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => importFileRef.current?.click()}
                  >
                    📂 Importar Excel
                  </button>
                  <button type="button" className="btn-secondary" onClick={downloadPlayerTemplateXlsx}>
                    📥 Descargar plantilla Excel
                  </button>
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    style={{ display: "none" }}
                    onChange={handleImportFile}
                  />
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>{players.length} jugadores inscritos</span>
                </div>
              </div>

              {/* Player list */}
              {players.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">🎾</div>
                  <h3>Sin jugadores aún</h3>
                  <p style={{ marginTop: 8, fontSize: 14 }}>Añade jugadores usando el formulario de arriba</p>
                </div>
              ) : (
                <>
                  {players.map((p) => (
                    <div className="card" key={p.id}>
                      <div className="card-row">
                        <div className="player-info">
                          <div className="player-name">
                            {p.nombre} {p.apellidos}
                            {p.pairWith && <span className="pair-tag">🤝 {p.pairWith}</span>}
                          </div>
                          <div className="player-meta">
                            {p.empresa && <span>{p.empresa} · </span>}
                            {p.email}
                            {p.telefono && <span> · {p.telefono}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span className={`badge badge-${clampPlayerLevel(p.nivel, activeLevels)}`}>
                            {clampPlayerLevel(p.nivel, activeLevels)}
                          </span>
                          <button type="button" className="btn-danger" onClick={() => handleDeletePlayer(p.id)}>✕</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!tournamentStarted && (
                    <div className="actions-row">
                      <button type="button" className="btn-primary" onClick={handleStartTournament}>
                        🏆 Generar torneo ({players.length} jugadores)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── CRUCES ──────────────────────────────────────────────── */}
          {tab === "cruces" && (
            <div className="tab-content">
              <div className="section-title">Cruces y Partidas</div>
              <div className="section-sub">Introduce los resultados de cada partida</div>

              {!tournamentStarted && players.length < 2 ? (
                <div className="empty-state">
                  <div className="icon">⚔️</div>
                  <h3>Torneo no iniciado</h3>
                  <p style={{ marginTop: 8, fontSize: 14 }}>Inscribe al menos 2 jugadores y revisa las parejas sugeridas aquí antes de generar el torneo.</p>
                </div>
              ) : !tournamentStarted && editingPairs && pairEditDraft ? (
                <div className="card">
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Editar parejas</div>
                  <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
                    Elige dos jugadores por fila. Deja el segundo vacío si la pareja está incompleta.
                  </p>
                  <div className="pair-edit-grid">
                    {pairEditDraft.map((row, idx) => (
                      <div className="pair-edit-row" key={row.rowId}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Jugador 1</label>
                          <select
                            value={row.p1Id}
                            onChange={(e) => updatePairDraftRow(idx, "p1Id", e.target.value)}
                          >
                            <option value="">— Elegir —</option>
                            {players.map((p) => (
                              <option key={p.id} value={p.id}>{playerOptionLabel(p)}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Jugador 2</label>
                          <select
                            value={row.p2Id}
                            onChange={(e) => updatePairDraftRow(idx, "p2Id", e.target.value)}
                          >
                            <option value="">— Sin pareja —</option>
                            {players.map((p) => (
                              <option key={p.id} value={p.id}>{playerOptionLabel(p)}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="actions-row" style={{ marginTop: 20 }}>
                    <button type="button" className="btn-primary" onClick={confirmPairEdit}>
                      ✅ Confirmar parejas
                    </button>
                    <button type="button" className="btn-secondary" onClick={cancelPairEdit}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : !tournamentStarted ? (
                <>
                  <div className="info-box" style={{ marginBottom: 16 }}>
                    <strong>Parejas sugeridas:</strong> revisa la composición y, si quieres, edítala antes de generar el torneo desde Inscripción o desde el botón de abajo.
                  </div>
                  <div className="phase-title">Vista previa de parejas</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10, marginBottom: 16 }}>
                    {previewPairsPreStart.map((pair) => (
                      <div className="card" key={pair.id} style={{ padding: "14px 18px", marginBottom: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{pair.p1.nombre} {pair.p1.apellidos}</div>
                            {pair.p2 ? (
                              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--muted)" }}>{pair.p2.nombre} {pair.p2.apellidos}</div>
                            ) : (
                              <div style={{ fontSize: 12, color: "var(--muted)" }}>Sin pareja asignada</div>
                            )}
                          </div>
                          <span className={`badge badge-${pair.level}`}>{pair.level}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="actions-row">
                    <button type="button" className="btn-secondary" onClick={beginEditPairs}>
                      ✏️ Editar parejas
                    </button>
                    <button type="button" className="btn-primary" onClick={handleStartTournament}>
                      🏆 Generar torneo ({players.length} jugadores)
                    </button>
                  </div>
                </>
              ) : editingPairs && pairEditDraft ? (
                <div className="card">
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Editar parejas</div>
                  <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
                    Al confirmar se regenerarán todos los partidos y se perderán los resultados actuales.
                  </p>
                  <div className="pair-edit-grid">
                    {pairEditDraft.map((row, idx) => (
                      <div className="pair-edit-row" key={row.rowId}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Jugador 1</label>
                          <select
                            value={row.p1Id}
                            onChange={(e) => updatePairDraftRow(idx, "p1Id", e.target.value)}
                          >
                            <option value="">— Elegir —</option>
                            {players.map((p) => (
                              <option key={p.id} value={p.id}>{playerOptionLabel(p)}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Jugador 2</label>
                          <select
                            value={row.p2Id}
                            onChange={(e) => updatePairDraftRow(idx, "p2Id", e.target.value)}
                          >
                            <option value="">— Sin pareja —</option>
                            {players.map((p) => (
                              <option key={p.id} value={p.id}>{playerOptionLabel(p)}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="actions-row" style={{ marginTop: 20 }}>
                    <button type="button" className="btn-primary" onClick={confirmPairEdit}>
                      ✅ Confirmar parejas
                    </button>
                    <button type="button" className="btn-secondary" onClick={cancelPairEdit}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="info-box">
                    <strong>Puntuación:</strong> Partida ganada <strong style={{ color: "var(--text)" }}>2 pts</strong> · Empate <strong style={{ color: "var(--text)" }}>1 pt</strong> · Derrota <strong style={{ color: "var(--text)" }}>0 pts</strong>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    <strong>{matches.filter(m => m.played).length}</strong> / {matches.length} partidas jugadas
                  </div>

                  <div className="actions-row" style={{ marginBottom: 8 }}>
                    <button type="button" className="btn-secondary" onClick={beginEditPairs}>
                      ✏️ Editar parejas
                    </button>
                  </div>

                  {/* Pairs overview */}
                  <div className="phase-title">Parejas formadas</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10, marginBottom: 8 }}>
                    {pairs.filter(p => p.p2).map((pair) => (
                      <div className="card" key={pair.id} style={{ padding: "14px 18px", marginBottom: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{pair.p1.nombre} {pair.p1.apellidos}</div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--muted)" }}>{pair.p2.nombre} {pair.p2.apellidos}</div>
                            {pair.p1.empresa && <div style={{ fontSize: 11, color: "#444", marginTop: 3 }}>{pair.p1.empresa}</div>}
                          </div>
                          <span className={`badge badge-${pair.level}`}>{pair.level}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!groupPhaseStarted && (
                    <>
                      <div className="phase-title">Reclasificar parejas</div>
                      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
                        Ajusta el nivel antes de iniciar grupos (A = más alto). Al cambiar de nivel se regeneran las partidas de esta fase.
                      </p>
                      <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
                        {pairs.filter((p) => p.p2).map((pair) => {
                          const idx = activeLevels.indexOf(pair.level);
                          return (
                            <div className="card" key={pair.id} style={{ padding: "14px 18px", marginBottom: 0 }}>
                              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                                    {pair.p1.nombre} {pair.p1.apellidos} / {pair.p2.nombre} {pair.p2.apellidos}
                                  </div>
                                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                                    Nivel: <span className={`badge badge-${pair.level}`}>{pair.level}</span>
                                    {idx >= 0 && <span style={{ marginLeft: 8 }}>({nivelOptionLabel(pair.level)})</span>}
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    disabled={idx <= 0}
                                    onClick={() => movePairLevel(pair.id, -1)}
                                  >
                                    Subir nivel
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    disabled={idx < 0 || idx >= activeLevels.length - 1}
                                    onClick={() => movePairLevel(pair.id, 1)}
                                  >
                                    Bajar nivel
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <div className="phase-title">Fase de clasificación</div>
                  {!groupPhaseStarted && (
                    <div className="info-box" style={{ marginBottom: 16 }}>
                      Calentamiento: cada pareja disputa 1 o 2 partidas de prueba contra rivales del mismo nivel. Luego puedes reclasificar e iniciar grupos.
                      <div className="actions-row" style={{ marginTop: 12, marginBottom: 0 }}>
                        <button type="button" className="btn-primary" onClick={beginGruposPhase}>
                          Iniciar fase de grupos
                        </button>
                      </div>
                    </div>
                  )}
                  {clasificacionJornadas.map(({ jornada: jn, rows }) => (
                    <div key={`cl-j-${jn}`}>
                      <div className="phase-title">
                        Jornada {jn > 0 ? jn : "—"}
                        <span style={{ marginLeft: 10, fontWeight: 400, fontSize: 14, color: "var(--muted)" }}>
                          {rows.length} partida{rows.length !== 1 ? "s" : ""} · hasta {config.courts} pista{config.courts !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {rows.map((m) => renderMatchCard(m))}
                    </div>
                  ))}

                  {groupPhaseStarted && (
                    <>
                      <div className="phase-title" style={{ marginTop: 28 }}>Fase de grupos</div>
                      {gruposJornadas.map(({ jornada: jn, rows }) => (
                        <div key={`gr-j-${jn}`}>
                          <div className="phase-title">
                            Jornada {jn > 0 ? jn : "—"}
                            <span style={{ marginLeft: 10, fontWeight: 400, fontSize: 14, color: "var(--muted)" }}>
                              {rows.length} partida{rows.length !== 1 ? "s" : ""} · hasta {config.courts} pista{config.courts !== 1 ? "s" : ""}
                            </span>
                          </div>
                          {rows.map((m) => renderMatchCard(m))}
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── CLASIFICACIÓN ───────────────────────────────────────── */}
          {tab === "clasificacion" && (
            <div className="tab-content">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 16,
                  flexWrap: "wrap",
                  marginBottom: 6,
                }}
              >
                <div className="section-title" style={{ marginBottom: 0 }}>
                  Clasificación
                </div>
                {tournamentStarted && groupPhaseStarted && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                      await exportClasificacionPdf(
                        standings,
                        { tournamentName, logoDataUrl },
                        activeLevels,
                        matches
                      );
                      showToast("📄 PDF descargado");
                    }}
                  >
                    📄 Exportar PDF
                  </button>
                )}
              </div>
              <div className="section-sub">Tabla de posiciones por nivel</div>

              {!tournamentStarted ? (
                <div className="empty-state">
                  <div className="icon">🏆</div>
                  <h3>Torneo no iniciado</h3>
                  <p style={{ marginTop: 8, fontSize: 14 }}>Inicia el torneo desde la pestaña de Inscripción</p>
                </div>
              ) : tournamentStarted && !groupPhaseStarted ? (
                <div className="info-box">
                  La clasificación por puntos se calculará al <strong style={{ color: "var(--text)" }}>iniciar la fase de grupos</strong> (pestaña Cruces). Mientras tanto puedes usar la fase de clasificación como calentamiento.
                </div>
              ) : (
                activeLevels.map((lvl) => {
                  const rows = standings[lvl];
                  if (!rows || rows.length === 0) return null;
                  return (
                    <div key={lvl} className={`level-section level-${lvl}`}>
                      <div className="level-header">
                        <span className="level-icon">{levelEmoji[lvl]}</span>
                        <span className="level-name">Nivel {lvl} — {levelLabel[lvl]}</span>
                        <span style={{ color: "var(--muted)", fontSize: 13 }}>{rows.length} parejas</span>
                      </div>
                      <table className="standings-table">
                        <thead>
                          <tr>
                            <th style={{ width: 40 }}>#</th>
                            <th>Pareja</th>
                            <th>Empresa</th>
                            <th style={{ textAlign: "center" }}>PJ</th>
                            <th style={{ textAlign: "center" }}>G</th>
                            <th style={{ textAlign: "center" }}>E</th>
                            <th style={{ textAlign: "center" }}>P</th>
                            <th style={{ textAlign: "center" }}>GF</th>
                            <th style={{ textAlign: "center" }}>GC</th>
                            <th style={{ textAlign: "center" }}>Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => (
                            <tr key={row.pair.id} className={i === 0 ? "highlight-row" : ""}>
                              <td>
                                <div className={`pos-badge pos-${i < 3 ? i + 1 : "other"}`}>{i + 1}</div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{row.pair.p1.nombre} {row.pair.p1.apellidos}</div>
                                {row.pair.p2 && <div style={{ fontSize: 12, color: "var(--muted)" }}>{row.pair.p2.nombre} {row.pair.p2.apellidos}</div>}
                              </td>
                              <td className="stat-cell">{row.pair.p1.empresa || "—"}</td>
                              <td className="stat-cell" style={{ textAlign: "center" }}>{row.played}</td>
                              <td className="stat-cell" style={{ textAlign: "center" }}>{row.won}</td>
                              <td className="stat-cell" style={{ textAlign: "center" }}>{row.drawn}</td>
                              <td className="stat-cell" style={{ textAlign: "center" }}>{row.lost}</td>
                              <td className="stat-cell" style={{ textAlign: "center" }}>{row.gf}</td>
                              <td className="stat-cell" style={{ textAlign: "center" }}>{row.ga}</td>
                              <td style={{ textAlign: "center" }}><span className="pts-badge">{row.pts}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── CONFIGURACIÓN ───────────────────────────────────────── */}
          {tab === "config" && (
            <div className="tab-content">
              <div className="section-title">Configuración del Torneo</div>
              <div className="section-sub">Ajusta los parámetros del evento</div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div className="form-group full" style={{ marginBottom: 16 }}>
                  <label htmlFor="config-tournament-name">Nombre del torneo</label>
                  <input
                    id="config-tournament-name"
                    name="branding-event-title"
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    placeholder="Torneo Empresa Acme 2025"
                    value={tournamentName}
                    onChange={handleTournamentNameChange}
                  />
                </div>
                <div className="form-group full">
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>
                    Logo
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => logoFileRef.current?.click()}
                    >
                      Subir imagen
                    </button>
                    {logoDataUrl ? (
                      <button type="button" className="btn-danger" onClick={() => setLogoDataUrl("")}>
                        Quitar logo
                      </button>
                    ) : null}
                  </div>
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                    style={{ display: "none" }}
                    aria-hidden
                    tabIndex={-1}
                    onChange={handleLogoFileChange}
                  />
                  {logoDataUrl ? (
                    <img src={logoDataUrl} alt="" className="config-logo-preview" />
                  ) : null}
                </div>
              </div>

              <div className="card">
                <div style={{ marginBottom: 20 }}>
                  <div className="setup-label">Número de niveles</div>
                  <select
                    value={config.levelCount}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (tournamentStarted) {
                        showToast("⚠️ Cambiar los niveles reiniciará el torneo");
                        setTournamentStarted(false);
                        setGroupPhaseStarted(false);
                        setPairs([]);
                        setMatches([]);
                      }
                      setManualPairs(null);
                      setEditingPairs(false);
                      setPairEditDraft(null);
                      setConfig((c) => ({ ...c, levelCount: n }));
                    }}
                    style={{ width: "100%", marginTop: 6 }}
                  >
                    <option value={2}>2 niveles (A, B)</option>
                    <option value={3}>3 niveles (A, B, C)</option>
                    <option value={4}>4 niveles (A, B, C, D)</option>
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div className="setup-label">Pistas recomendadas</div>
                  <div
                    style={{
                      marginTop: 6,
                      padding: "10px 12px",
                      background: "rgba(0,0,0,0.04)",
                      borderRadius: 8,
                      color: "var(--muted)",
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: "var(--text)", fontWeight: 700 }}>{recommendedCourts}</span>
                    {" "}(ceil de parejas completas / 4). Sugerencia; no editable.
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="setup-label" htmlFor="config-courts-rent">Pistas que se alquilarán</label>
                  <input
                    id="config-courts-rent"
                    type="number"
                    min={1}
                    value={config.courts}
                    onChange={(e) => {
                      const v = Math.max(1, parseInt(e.target.value, 10) || 1);
                      setConfig((c) => ({ ...c, courts: v }));
                    }}
                    style={{ width: "100%", marginTop: 6, padding: "10px 12px", fontSize: 16, borderRadius: 8, border: "1px solid var(--border, #ddd)" }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div className="setup-label">Formato de partida</div>
                  <select
                    value={config.matchFormat ?? "1set"}
                    onChange={(e) => {
                      const v = e.target.value;
                      setConfig((c) => ({
                        ...c,
                        matchFormat: v,
                        matchDuration: MATCH_FORMAT_MINUTES[v] ?? c.matchDuration,
                      }));
                    }}
                    style={{ width: "100%", marginTop: 6 }}
                  >
                    {Object.entries(MATCH_FORMAT_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div className="setup-label">Tiempo estimado por partida (minutos)</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, marginBottom: 6 }}>
                    Sugerencia según formato: {MATCH_FORMAT_MINUTES[config.matchFormat ?? "1set"]} min (puedes ajustar)
                  </div>
                  <div className="counter-row">
                    <button type="button" className="counter-btn" onClick={() => setConfig((c) => ({ ...c, matchDuration: Math.max(10, (Number(c.matchDuration) || 30) - 5) }))}>−</button>
                    <span className="counter-val">{config.matchDuration}</span>
                    <button type="button" className="counter-btn" onClick={() => setConfig((c) => ({ ...c, matchDuration: (Number(c.matchDuration) || 30) + 5 }))}>+</button>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div className="setup-label">Formato del torneo</div>
                  <select
                    value={config.format}
                    onChange={(e) => setConfig((c) => ({ ...c, format: e.target.value }))}
                    style={{ width: "100%", marginTop: 6 }}
                  >
                    <option value="group+liga">Fase de grupos + Liguilla + Finales</option>
                    <option value="liga">Solo Liguilla</option>
                    <option value="groups">Solo Fase de grupos</option>
                  </select>
                </div>

                {tournamentStarted && totalJornadas > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div className="setup-label" style={{ marginBottom: 8 }}>Resumen calendario (jornadas × min/partida)</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border, #ccc)" }}>
                          <th style={{ textAlign: "left", padding: "8px 6px" }}>Fase</th>
                          <th style={{ textAlign: "center", padding: "8px 6px" }}>Jornadas</th>
                          <th style={{ textAlign: "center", padding: "8px 6px" }}>Min/partida</th>
                          <th style={{ textAlign: "center", padding: "8px 6px" }}>Pistas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jornadasClasificacion > 0 && (
                          <tr style={{ borderBottom: "1px solid var(--border, #eee)" }}>
                            <td style={{ padding: "8px 6px" }}>Clasificación</td>
                            <td style={{ textAlign: "center", padding: "8px 6px" }}>{jornadasClasificacion}</td>
                            <td style={{ textAlign: "center", padding: "8px 6px" }}>{config.matchDuration}</td>
                            <td style={{ textAlign: "center", padding: "8px 6px" }}>{config.courts}</td>
                          </tr>
                        )}
                        {jornadasGrupos > 0 && (
                          <tr style={{ borderBottom: "1px solid var(--border, #eee)" }}>
                            <td style={{ padding: "8px 6px" }}>Grupos</td>
                            <td style={{ textAlign: "center", padding: "8px 6px" }}>{jornadasGrupos}</td>
                            <td style={{ textAlign: "center", padding: "8px 6px" }}>{config.matchDuration}</td>
                            <td style={{ textAlign: "center", padding: "8px 6px" }}>{config.courts}</td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan={2} style={{ padding: "10px 6px", fontWeight: 700 }}>
                            Total jornadas: {totalJornadas}
                          </td>
                          <td colSpan={2} style={{ padding: "10px 6px", textAlign: "right", fontWeight: 700 }}>
                            Tiempo estimado: {Math.floor(totalEstimMin / 60)}h {totalEstimMin % 60}min
                            <span style={{ fontWeight: 400, color: "var(--muted)", marginLeft: 8 }}>
                              ({totalEstimMin} min)
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                      Se asume una ronda por jornada y todas las pistas en paralelo: {totalJornadas} jornadas × {config.matchDuration} min.
                    </div>
                  </div>
                )}

                {tournamentStarted && (
                  <div className="info-box" style={{ marginBottom: 0 }}>
                    <strong>Estimación:</strong>{" "}
                    {matches.length} partidas · {config.courts} pista{config.courts !== 1 ? "s" : ""} ·{" "}
                    <strong style={{ color: "var(--text)" }}>
                      {totalJornadas > 0
                        ? `~${totalEstimMin} min (${Math.floor(totalEstimMin / 60)}h ${totalEstimMin % 60}min)`
                        : `~${Math.ceil((matches.length / config.courts) * config.matchDuration)} min (sin calendario)`}
                    </strong>
                  </div>
                )}
              </div>

              {/* Stats */}
              {tournamentStarted && (
                <>
                  <div style={{ marginTop: 24, marginBottom: 14, fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: "var(--muted)" }}>
                    RESUMEN DEL TORNEO
                  </div>
                  <div className="setup-grid">
                    {[
                      { label: "Jugadores", val: players.length },
                      { label: "Parejas", val: pairs.filter(p => p.p2).length },
                      { label: "Partidas totales", val: matches.length },
                      { label: "Jugadas", val: matches.filter(m => m.played).length },
                    ].map((s) => (
                      <div className="setup-card" key={s.label}>
                        <div className="setup-label">{s.label}</div>
                        <div className="setup-value">{s.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <button
                      type="button"
                      className="btn-danger"
                      style={{ padding: "10px 20px", fontSize: 14 }}
                      onClick={() => {
                        if (confirm("¿Reiniciar el torneo? Se perderán todos los datos.")) {
                          setPlayers([]);
                          setPairs([]);
                          setMatches([]);
                          setTournamentStarted(false);
                          setGroupPhaseStarted(false);
                          setManualPairs(null);
                          setEditingPairs(false);
                          setPairEditDraft(null);
                          setTab("inscripcion");
                        }
                      }}
                    >
                      🗑️ Reiniciar torneo
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </main>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
