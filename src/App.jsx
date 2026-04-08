import { useState, useEffect, useRef, useMemo, startTransition } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { loadPdfFonts } from "../lib/pdf/fonts.js";

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
    display: flex;
    flex-direction: column;
    background: var(--dark);
    background-image: 
      radial-gradient(ellipse 80% 40% at 50% -10%, rgba(0,230,118,0.07) 0%, transparent 60%),
      repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.02) 39px, rgba(255,255,255,0.02) 40px),
      repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.02) 39px, rgba(255,255,255,0.02) 40px);
  }

  /* HEADER */
  .header {
    padding: 16px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--border);
    background: rgba(10,10,10,0.95);
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(10px);
  }
  .rebotech-lockup {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: inherit;
    flex-shrink: 0;
    min-width: 0;
  }
  .rebotech-lockup:focus-visible {
    outline: 2px solid var(--green);
    outline-offset: 2px;
    border-radius: 6px;
  }
  .rebotech-logo-img {
    height: 36px;
    width: auto;
    max-width: 100px;
    object-fit: contain;
    flex-shrink: 0;
    display: block;
  }
  .rebotech-logo-fallback {
    font-size: 28px;
    line-height: 1;
    opacity: 0.85;
  }
  .rebotech-wordmark {
    display: flex;
    flex-direction: column;
    justify-content: center;
    line-height: 1.15;
    gap: 1px;
  }
  .rebotech-name {
    font-family: 'DM Sans', sans-serif;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--text);
  }
  .rebotech-tag {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
    letter-spacing: 0.02em;
  }
  .header-tournament-mid {
    flex: 1;
    min-width: 140px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 36px;
  }
  .header-event-logo {
    height: 32px;
    width: auto;
    max-width: 80px;
    object-fit: contain;
    border-radius: 4px;
  }
  .header-event-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    letter-spacing: 2px;
    color: var(--green);
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: min(360px, 32vw);
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
  .main {
    padding: 32px;
    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
    flex: 1;
  }

  .app-footer {
    margin-top: auto;
    padding: 20px 24px 28px;
    border-top: 1px solid var(--border);
    text-align: center;
  }
  .app-footer p {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.6;
    margin: 0;
  }
  .app-footer p + p {
    margin-top: 4px;
  }

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

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.65);
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }
  .modal-panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    max-width: 480px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 50px rgba(0,0,0,0.45);
    padding: 22px 24px;
  }
  .modal-panel h3 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    letter-spacing: 2px;
    margin-bottom: 6px;
    color: var(--text);
  }
  .modal-panel .modal-sub { font-size: 13px; color: var(--muted); margin-bottom: 18px; line-height: 1.4; }
  .modal-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 22px; justify-content: flex-end; }
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

/** Letra A–D o número 1…n según categorías activas (1 = primera categoría). */
function parseNivelFlexible(raw, activeLevels) {
  const t = String(raw ?? "").trim();
  if (!t) return activeLevels[0];
  const u = t.toUpperCase();
  if (activeLevels.includes(u)) return u;
  const n = parseInt(t, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= activeLevels.length) return activeLevels[n - 1];
  return clampPlayerLevel(t, activeLevels);
}

function rehydratePairPlayerRefs(pairs, players) {
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));
  return pairs.map((pair) => ({
    ...pair,
    p1: byId[pair.p1.id] ?? pair.p1,
    p2: pair.p2 ? (byId[pair.p2.id] ?? pair.p2) : null,
  }));
}

const MSG_NO_EDIT_GRUPOS = "No se pueden modificar parejas una vez iniciada la fase de grupos";

function hasClasificacionPlayedResults(matches) {
  return (matches || []).some((m) => m.phase === "clasificacion" && m.played);
}

const nivelOptionLabel = (lvl) => {
  if (lvl === "A") return "A — Alto";
  if (lvl === "B") return "B — Medio";
  if (lvl === "C") return "C — Iniciación";
  return "D — 4ª categoría";
};

/** Texto solo ASCII imprimible (legacy / fuentes sin UTF-8). */
function pdfSafeText(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00f1/g, "n")
    .replace(/\u00d1/g, "N")
    .replace(/[^\x20-\x7E]/g, "");
}

/**
 * Texto para PDF con fuente Roboto: conserva tildes y ñ; elimina controles y emojis amplios.
 */
function pdfUtf8Text(s) {
  return String(s ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/gu, "");
}

const levelPdfShort = { A: "Alto", B: "Medio", C: "Bajo", D: "4ª categoría" };

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

/**
 * Normaliza un marcador tipo "a-b" (cadena única o procedente de unir dos campos).
 * @param {string} score
 * @returns {string}
 */
function normalizeScore(score) {
  const raw = String(score ?? "").trim();
  if (raw === "" || raw === "-") return "0-0";

  const hyphenIdx = raw.indexOf("-");
  if (hyphenIdx === -1) {
    const l = parseInt(raw, 10);
    if (Number.isNaN(l) || l < 0) return "0-0";
    return `${l}-0`;
  }

  const left = raw.slice(0, hyphenIdx).trim();
  const right = raw.slice(hyphenIdx + 1).trim();
  const l = left === "" ? 0 : parseInt(left, 10);
  const r = right === "" ? 0 : parseInt(right, 10);
  const ln = Number.isNaN(l) || l < 0 ? 0 : l;
  const rn = Number.isNaN(r) || r < 0 ? 0 : r;
  return `${ln}-${rn}`;
}

function normalizedScoresFromFields(score1, score2) {
  const combined = `${String(score1 ?? "").trim()}-${String(score2 ?? "").trim()}`;
  const norm = normalizeScore(combined);
  const i = norm.indexOf("-");
  return { score1: norm.slice(0, i), score2: norm.slice(i + 1) };
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

const PDF_FONT = "Roboto";
const PDF_MARGIN = 17;
/**
 * Reserva inferior del área de contenido (debe alinearse con addPdfPageFooters:
 * líneas ~8–16 mm desde el borde). El contenido no debe entrar en esta franja.
 */
const PDF_BODY_BOTTOM_MM = 50;
const PDF_FOOTER_RESERVE_MM = PDF_BODY_BOTTOM_MM;
/** Espacio entre bloques inseparables en la misma página */
const PDF_BLOCK_GAP_MM = 4;
/** Tras tabla / bloque antes del siguiente */
const PDF_AFTER_TABLE_MM = 4;
/** Espacio antes del título de sección */
const PDF_SECTION_TITLE_BEFORE_MM = 3;
/** Tras la línea bajo el título de sección */
const PDF_SECTION_TITLE_AFTER_MM = 5;
/** Altura reservada al planificar salto antes de dibujar un banner de sección */
const PDF_SECTION_BANNER_PLAN_MM =
  PDF_SECTION_TITLE_BEFORE_MM + 6 + PDF_SECTION_TITLE_AFTER_MM;

/** Si no cabe `neededMm` desde `y`, abre página y devuelve Y de cabecera; si cabe, devuelve `y`. */
function pdfCheckPageBreak(y, neededMm, pageH, openPageFn) {
  const limit = pageH - PDF_BODY_BOTTOM_MM;
  if (y + neededMm <= limit + 0.25) return y;
  return openPageFn();
}
const PDF_PTS_GREEN = [0, 150, 72];
/** Cabeceras tablas (informe deportivo) */
const PDF_TABLE_HEAD_BG = [28, 35, 42];
const PDF_TABLE_HEAD_TEXT = [255, 255, 255];
/** Ganador partido en calendario PDF */
const PDF_WIN_GREEN = [0, 128, 72];
const PDF_TEXT_MUTED = [105, 105, 110];
const PDF_ROW_ALT = [247, 248, 250];
const PDF_LINE_SUBTLE = [218, 220, 224];

function pairPdfLabel(pair) {
  const a = `${pair.p1.nombre} ${pair.p1.apellidos}`.trim();
  if (pair.p2) return pdfUtf8Text(`${a} / ${pair.p2.nombre} ${pair.p2.apellidos}`.trim());
  return pdfUtf8Text(`${a} (sin pareja)`);
}

/** Marcador listo para PDF: nunca "1-" / "-1"; sin resultado → "-" */
function pdfMatchScoreComplete(m) {
  const s1 = String(m?.score1 ?? "").trim();
  const s2 = String(m?.score2 ?? "").trim();
  if (s1 === "" || s2 === "") return false;
  const n1 = parseInt(s1, 10);
  const n2 = parseInt(s2, 10);
  if (Number.isNaN(n1) || Number.isNaN(n2) || n1 < 0 || n2 < 0) return false;
  return true;
}

function pdfMatchResultLabel(m) {
  if (!pdfMatchScoreComplete(m)) return "-";
  const n1 = parseInt(String(m.score1).trim(), 10);
  const n2 = parseInt(String(m.score2).trim(), 10);
  return pdfUtf8Text(`${n1} - ${n2}`);
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
  doc.setFont(PDF_FONT, "normal");
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 125, 132);
    doc.text("Powered by ReBoTech Solutions", pageWidth / 2, pageHeight - 16, { align: "center" });
    doc.text(
      "rebotech.solutions@gmail.com | Valencia, España",
      pageWidth / 2,
      pageHeight - 12,
      { align: "center" }
    );
    doc.setFontSize(8);
    doc.setTextColor(88, 88, 88);
    doc.setFont(PDF_FONT, "normal");
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }
}

async function fetchPublicImageAsDataUrl(path) {
  try {
    const r = await fetch(path);
    if (!r.ok) return "";
    const blob = await r.blob();
    if (!blob.type || !/^image\//i.test(blob.type)) return "";
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

function paintPdfPageWhite(doc, pageW, pageH) {
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");
}

/** Cabecera: logo marca (izq), torneo y fecha centrados, logo evento (der). Devuelve Y donde empieza el cuerpo. */
function drawPdfReportHeader(doc, h) {
  const { pageW, m, displayTitle, dateLine, logoDataUrl, eventLogoBox, rebotechDataUrl, rebotechBox } = h;
  doc.setTextColor(0, 0, 0);
  let headerImgH = 11;
  if (rebotechBox && rebotechDataUrl) {
    try {
      doc.addImage(rebotechDataUrl, rebotechBox.format, m, m, rebotechBox.w, rebotechBox.h);
      headerImgH = Math.max(headerImgH, rebotechBox.h);
    } catch (_) {
      /* ignore */
    }
  }
  if (eventLogoBox && logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, eventLogoBox.format, pageW - m - eventLogoBox.w, m, eventLogoBox.w, eventLogoBox.h);
      headerImgH = Math.max(headerImgH, eventLogoBox.h);
    } catch (_) {
      /* ignore */
    }
  }
  const titleY = m + headerImgH / 2 - 1;
  let titleSize = 15;
  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(titleSize);
  const maxTw = pageW - 2 * m - 14;
  while (titleSize > 10 && doc.getTextWidth(displayTitle) > maxTw) {
    titleSize -= 0.5;
    doc.setFontSize(titleSize);
  }
  doc.setTextColor(18, 22, 28);
  doc.text(displayTitle, pageW / 2, titleY, { align: "center" });
  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(9);
  doc.setTextColor(88, 92, 98);
  doc.text(dateLine, pageW / 2, titleY + 5.2, { align: "center" });
  return m + headerImgH + 8;
}

function drawPdfSectionBanner(doc, pageW, m, y, title) {
  y += PDF_SECTION_TITLE_BEFORE_MM;
  const textY = y;
  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 24, 30);
  doc.text(pdfUtf8Text(title), pageW / 2, textY, { align: "center" });
  doc.setDrawColor(...PDF_LINE_SUBTLE);
  doc.setLineWidth(0.4);
  doc.line(m + 10, textY + 3, pageW - m - 10, textY + 3);
  return textY + 3 + PDF_SECTION_TITLE_AFTER_MM;
}

/** Altura aproximada del bloque tabla de calendario (cabecera + filas), sin título de jornada */
function estimateScheduleTableOnlyMm(rowCount, fontPt = 8.5) {
  const headMm = 6.5;
  const rowMm = Math.max(3.5, fontPt * 0.4 + 1.55);
  return headMm + rowCount * rowMm + 3;
}

function estimateJornadaBlockMm(rowCount, fontPt = 8.5) {
  const titleMm = 5.5;
  return titleMm + estimateScheduleTableOnlyMm(rowCount, fontPt);
}

/**
 * Altura pesimista del bloque indivisible de una jornada: título (1ª fila del cuerpo)
 * + cabecera de columnas + filas de partidos (nombres largos / posibles saltos de línea).
 */
function computeWholeJornadaBlockHeightMm(rowCount, fontPt = 8.5) {
  const blockSpacingTop = 4;
  const columnHeadHeight = 12;
  const jornadaTitleRowHeight = 12;
  const blockSpacingBottom = PDF_AFTER_TABLE_MM + 4;
  const safetyMm = 12;
  const dataRowHeight = Math.max(14, fontPt * 0.75 + 5);
  return (
    blockSpacingTop +
    columnHeadHeight +
    jornadaTitleRowHeight +
    rowCount * dataRowHeight +
    blockSpacingBottom +
    safetyMm
  );
}

/**
 * Antes de escribir título o tabla: garantiza que la jornada entera cabe; si no, nueva página.
 * Devuelve Y inicial del bloque y tamaño de fuente de tabla (reduce hasta 6 pt si hace falta).
 */
function ensureWholeJornadaFits({ currentY, rowCount, fontPtStart, pageHeight, openPage }) {
  const limit = pageHeight - PDF_FOOTER_RESERVE_MM;
  let fp = fontPtStart;
  let h = computeWholeJornadaBlockHeightMm(rowCount, fp);
  while (fp > 6 && currentY + h > limit) {
    fp -= 0.5;
    h = computeWholeJornadaBlockHeightMm(rowCount, fp);
  }
  let y = currentY;
  while (y + h > limit) {
    y = openPage();
    fp = fontPtStart;
    h = computeWholeJornadaBlockHeightMm(rowCount, fp);
    while (fp > 6 && y + h > limit) {
      fp -= 0.5;
      h = computeWholeJornadaBlockHeightMm(rowCount, fp);
    }
  }
  return { y, fontPt: fp };
}

/** Subtítulo nivel + tabla de clasificación */
function estimateClasifTableHeightMm(rowCount, fontPt = 8.5) {
  const subtitleMm = 5.5;
  return subtitleMm + estimateScheduleTableOnlyMm(rowCount, fontPt);
}

function estimateGroupLevelBlockMm(rowCount, fontPt = 8.5) {
  const subtitleMm = 5.5;
  return subtitleMm + estimateScheduleTableOnlyMm(rowCount, fontPt);
}

function pdfClasificacionTableBody(rows) {
  return rows.map((row, i) => [
    String(i + 1),
    pairPdfLabel(row.pair),
    pdfUtf8Text(row.pair.p1.empresa || "-"),
    String(row.played),
    String(row.won),
    String(row.drawn),
    String(row.lost),
    String(row.gf),
    String(row.ga),
    String(row.pts),
  ]);
}

function pdfScheduleDidParseForRows(rowAccessor) {
  return (data) => {
    data.cell.styles.font = PDF_FONT;
    if (data.section !== "body") return;
    const mm = rowAccessor(data.row.index);
    if (!mm) return;
    const complete = pdfMatchScoreComplete(mm);
    const s1 = complete ? parseInt(String(mm.score1).trim(), 10) : NaN;
    const s2 = complete ? parseInt(String(mm.score2).trim(), 10) : NaN;
    const defaultBody = [22, 24, 28];

    if (data.column.index === 3) {
      if (complete) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [18, 20, 24];
      } else {
        data.cell.styles.fontStyle = "normal";
        data.cell.styles.textColor = PDF_TEXT_MUTED;
      }
      return;
    }

    if (!complete || data.column.index < 1 || data.column.index > 2) return;

    if (s1 === s2) {
      data.cell.styles.fontStyle = "normal";
      data.cell.styles.textColor = defaultBody;
      return;
    }
    if (data.column.index === 1) {
      if (s1 > s2) {
        data.cell.styles.textColor = PDF_WIN_GREEN;
        data.cell.styles.fontStyle = "bold";
      } else {
        data.cell.styles.textColor = defaultBody;
        data.cell.styles.fontStyle = "normal";
      }
    } else if (data.column.index === 2) {
      if (s2 > s1) {
        data.cell.styles.textColor = PDF_WIN_GREEN;
        data.cell.styles.fontStyle = "bold";
      } else {
        data.cell.styles.textColor = defaultBody;
        data.cell.styles.fontStyle = "normal";
      }
    }
  };
}

function pdfDrawMatchScheduleTable(doc, round, startY, m, fontPt = 8.5) {
  const scheduleBody = round.rows.map((mm) => [
    pdfUtf8Text(mm.level),
    pairPdfLabel(mm.pair1),
    pairPdfLabel(mm.pair2),
    pdfMatchResultLabel(mm),
  ]);

  autoTable(doc, {
    startY,
    head: [["Cat.", "Local / Pareja A", "Visitante / Pareja B", "Marcador"]],
    body: scheduleBody,
    theme: "plain",
    styles: {
      font: PDF_FONT,
      fontStyle: "normal",
      fontSize: fontPt,
      cellPadding: { top: 1.7, bottom: 1.7, left: 1.8, right: 1.8 },
      textColor: [22, 24, 28],
      fillColor: [255, 255, 255],
      lineColor: PDF_LINE_SUBTLE,
      lineWidth: 0.08,
      valign: "middle",
    },
    headStyles: {
      font: PDF_FONT,
      fontStyle: "bold",
      fillColor: PDF_TABLE_HEAD_BG,
      textColor: PDF_TABLE_HEAD_TEXT,
      cellPadding: { top: 2.4, bottom: 2.4, left: 1.8, right: 1.8 },
    },
    alternateRowStyles: { fillColor: PDF_ROW_ALT },
    columnStyles: {
      0: { halign: "center", cellWidth: 11 },
      1: { cellWidth: 56 },
      2: { cellWidth: 56 },
      3: { halign: "center", cellWidth: 24, fontStyle: "normal" },
    },
    margin: { left: m, right: m, bottom: PDF_FOOTER_RESERVE_MM },
    tableLineColor: PDF_LINE_SUBTLE,
    tableLineWidth: 0.08,
    rowPageBreak: "avoid",
    didParseCell: pdfScheduleDidParseForRows((i) => round.rows[i]),
  });
  return doc.lastAutoTable?.finalY ?? startY;
}

/** Una sola tabla: cabecera de columnas + fila «Jornada X» + partidos. Evita cortes internos (pageBreak avoid). */
function pdfDrawJornadaUnifiedTable(doc, round, startY, m, fontPt = 8.5) {
  const scheduleRows = round.rows.map((mm) => [
    pdfUtf8Text(mm.level),
    pairPdfLabel(mm.pair1),
    pairPdfLabel(mm.pair2),
    pdfMatchResultLabel(mm),
  ]);
  const body = [
    [
      {
        content: pdfUtf8Text(`Jornada ${round.jornada}`),
        colSpan: 4,
        styles: {
          font: PDF_FONT,
          fontStyle: "bold",
          fontSize: fontPt + 0.5,
          fillColor: [245, 246, 248],
          textColor: [36, 42, 50],
          cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 },
        },
      },
    ],
    ...scheduleRows,
  ];

  autoTable(doc, {
    startY,
    head: [["Cat.", "Local / Pareja A", "Visitante / Pareja B", "Marcador"]],
    body,
    theme: "plain",
    styles: {
      font: PDF_FONT,
      fontStyle: "normal",
      fontSize: fontPt,
      cellPadding: { top: 1.7, bottom: 1.7, left: 1.8, right: 1.8 },
      textColor: [22, 24, 28],
      fillColor: [255, 255, 255],
      lineColor: PDF_LINE_SUBTLE,
      lineWidth: 0.08,
      valign: "middle",
    },
    headStyles: {
      font: PDF_FONT,
      fontStyle: "bold",
      fillColor: PDF_TABLE_HEAD_BG,
      textColor: PDF_TABLE_HEAD_TEXT,
      cellPadding: { top: 2.4, bottom: 2.4, left: 1.8, right: 1.8 },
    },
    alternateRowStyles: { fillColor: PDF_ROW_ALT },
    columnStyles: {
      0: { halign: "center", cellWidth: 11 },
      1: { cellWidth: 56 },
      2: { cellWidth: 56 },
      3: { halign: "center", cellWidth: 24, fontStyle: "normal" },
    },
    margin: { left: m, right: m, bottom: PDF_FOOTER_RESERVE_MM },
    tableLineColor: PDF_LINE_SUBTLE,
    tableLineWidth: 0.08,
    rowPageBreak: "avoid",
    didParseCell: (data) => {
      data.cell.styles.font = PDF_FONT;
      if (data.section !== "body" || data.row.index === 0) return;
      const mm = round.rows[data.row.index - 1];
      if (!mm) return;
      pdfScheduleDidParseForRows(() => mm)({ ...data, row: { ...data.row, index: 0 } });
    },
  });
  return doc.lastAutoTable?.finalY ?? startY;
}

function groupMatchesByLevelForPdf(matches, activeLevels) {
  const map = {};
  for (const lvl of activeLevels) map[lvl] = [];
  for (const mm of matches || []) {
    if (mm.phase !== "group" || !mm.pair2) continue;
    if (map[mm.level]) map[mm.level].push(mm);
  }
  for (const lvl of activeLevels) {
    map[lvl].sort(
      (a, b) =>
        pairPdfLabel(a.pair1).localeCompare(pairPdfLabel(b.pair1)) ||
        pairPdfLabel(a.pair2).localeCompare(pairPdfLabel(b.pair2))
    );
  }
  return map;
}

/**
 * Jornadas: bloque indivisible (título + tabla). Nada se pinta hasta saber que cabe; si no, nueva página.
 */
function pdfRenderJornadaRounds(doc, rounds, y0, m, pageW, pageH, openPageHeaderOnly, sectionBannerTitle = null) {
  let y = y0;
  const limit = pageH - PDF_FOOTER_RESERVE_MM;
  let bannerDrawn = !sectionBannerTitle;
  const fontPtStart = 8.5;

  for (let i = 0; i < rounds.length; i += 1) {
    const round = rounds[i];
    const n = round.rows?.length ?? 0;
    if (bannerDrawn && i > 0) y += PDF_BLOCK_GAP_MM;

    if (!bannerDrawn) {
      let fp0 = fontPtStart;
      let jH = computeWholeJornadaBlockHeightMm(n, fp0);
      let need = PDF_SECTION_BANNER_PLAN_MM + jH;
      while (fp0 > 6 && y + need > limit) {
        fp0 -= 0.5;
        jH = computeWholeJornadaBlockHeightMm(n, fp0);
        need = PDF_SECTION_BANNER_PLAN_MM + jH;
      }
      while (y + need > limit) {
        y = openPageHeaderOnly();
        fp0 = fontPtStart;
        jH = computeWholeJornadaBlockHeightMm(n, fp0);
        need = PDF_SECTION_BANNER_PLAN_MM + jH;
        while (fp0 > 6 && y + need > limit) {
          fp0 -= 0.5;
          jH = computeWholeJornadaBlockHeightMm(n, fp0);
          need = PDF_SECTION_BANNER_PLAN_MM + jH;
        }
      }
      y = drawPdfSectionBanner(doc, pageW, m, y, sectionBannerTitle);
      bannerDrawn = true;
    }

    const placed = ensureWholeJornadaFits({
      currentY: y,
      rowCount: n,
      fontPtStart,
      pageHeight: pageH,
      openPage: openPageHeaderOnly,
    });
    y = placed.y;
    const fontPt = placed.fontPt;

    y += 4;
    y = pdfDrawJornadaUnifiedTable(doc, round, y, m, fontPt);
    y += PDF_AFTER_TABLE_MM;
  }
  return y;
}

async function exportClasificacionPdf(standings, branding, activeLevels, matches = []) {
  const displayTitle = pdfUtf8Text((branding?.tournamentName ?? "").trim() || "Pádel Manager");
  const logoDataUrl = branding?.logoDataUrl ?? "";
  const rebotechDataUrl = await fetchPublicImageAsDataUrl("/ReBoTech_logo.jpg");
  const eventLogoBox = logoDataUrl ? await getPdfLogoSizeMm(logoDataUrl, 32, 17) : null;
  const rebotechBox = rebotechDataUrl ? await getPdfLogoSizeMm(rebotechDataUrl, 36, 14) : null;

  const dateLine = pdfUtf8Text(
    new Date().toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );

  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  loadPdfFonts(doc);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const m = PDF_MARGIN;

  const headerPayload = {
    pageW,
    pageH,
    m,
    displayTitle,
    dateLine,
    logoDataUrl,
    eventLogoBox,
    rebotechDataUrl,
    rebotechBox,
  };

  let pagesOpened = 0;
  const openPage = () => {
    if (pagesOpened > 0) doc.addPage();
    pagesOpened += 1;
    paintPdfPageWhite(doc, pageW, pageH);
    return drawPdfReportHeader(doc, headerPayload);
  };

  const bottomLimit = pageH - PDF_BODY_BOTTOM_MM;
  const maxPdfColH = bottomLimit - m - 26;
  const headClasif = [["Pos", "Pareja", "Empresa", "PJ", "G", "E", "P", "GF", "GC", "Pts"]];

  // --- Sección 1: Clasificación ---
  let y = openPage();
  y = drawPdfSectionBanner(doc, pageW, m, y, "Clasificación");
  const hasStandings = activeLevels.some((lvl) => standings[lvl]?.length);

  if (!hasStandings) {
    doc.setFont(PDF_FONT, "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(95, 98, 104);
    doc.text(
      "No hay datos de clasificación (sin resultados en fase de grupos o fase no iniciada).",
      m,
      y
    );
  } else {
    let firstLvlTable = true;
    for (const lvl of activeLevels) {
      const rows = standings[lvl];
      if (!rows?.length) continue;
      if (!firstLvlTable) y += PDF_BLOCK_GAP_MM;
      firstLvlTable = false;

      let tblFont = 8.5;
      let needH = estimateClasifTableHeightMm(rows.length, tblFont);
      while (needH > maxPdfColH && tblFont > 6) {
        tblFont -= 0.5;
        needH = estimateClasifTableHeightMm(rows.length, tblFont);
      }
      y = pdfCheckPageBreak(y, needH, pageH, openPage);
      while (y + needH > bottomLimit + 0.35 && tblFont > 6) {
        tblFont -= 0.5;
        needH = estimateClasifTableHeightMm(rows.length, tblFont);
      }
      while (y + needH > bottomLimit + 0.35) {
        y = openPage();
        while (y + needH > bottomLimit + 0.35 && tblFont > 6) {
          tblFont -= 0.5;
          needH = estimateClasifTableHeightMm(rows.length, tblFont);
        }
      }

      doc.setFont(PDF_FONT, "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(32, 38, 46);
      doc.text(pdfUtf8Text(`Nivel ${lvl} (${levelPdfShort[lvl] ?? lvl})`), m, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: headClasif,
        body: pdfClasificacionTableBody(rows),
        theme: "plain",
        styles: {
          font: PDF_FONT,
          fontStyle: "normal",
          fontSize: tblFont,
          cellPadding: { top: 1.7, bottom: 1.7, left: 1.4, right: 1.4 },
          textColor: [22, 24, 28],
          fillColor: [255, 255, 255],
          lineColor: PDF_LINE_SUBTLE,
          lineWidth: 0.08,
          valign: "middle",
        },
        headStyles: {
          font: PDF_FONT,
          fontStyle: "bold",
          fillColor: PDF_TABLE_HEAD_BG,
          textColor: PDF_TABLE_HEAD_TEXT,
          halign: "center",
          cellPadding: { top: 2.4, bottom: 2.4, left: 1.4, right: 1.4 },
        },
        alternateRowStyles: { fillColor: PDF_ROW_ALT },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { cellWidth: 52, fontStyle: "normal" },
          2: { cellWidth: 30 },
          3: { halign: "center", cellWidth: 9 },
          4: { halign: "center", cellWidth: 9 },
          5: { halign: "center", cellWidth: 9 },
          6: { halign: "center", cellWidth: 9 },
          7: { halign: "center", cellWidth: 9 },
          8: { halign: "center", cellWidth: 9 },
          9: { halign: "center", cellWidth: 15, textColor: PDF_PTS_GREEN, fontStyle: "bold" },
        },
        margin: { left: m, right: m, bottom: PDF_BODY_BOTTOM_MM },
        tableLineColor: PDF_LINE_SUBTLE,
        tableLineWidth: 0.08,
        rowPageBreak: "avoid",
        showHead: "everyPage",
        didParseCell: (data) => {
          data.cell.styles.font = PDF_FONT;
          if (data.section === "body") {
            if (data.column.index === 0 && data.row.index < 3) data.cell.styles.fontStyle = "bold";
            if (data.column.index === 1 && data.row.index < 3) data.cell.styles.fontStyle = "bold";
          }
        },
      });
      y = doc.lastAutoTable.finalY + PDF_AFTER_TABLE_MM;
    }
  }

  // --- Sección 2: Fase de grupos (nueva página; bloque completo por nivel) ---
  const byLvlGroup = groupMatchesByLevelForPdf(matches, activeLevels);
  const hasAnyGroup = activeLevels.some((lvl) => byLvlGroup[lvl]?.length);
  if (hasAnyGroup) {
    y = openPage();
    y = drawPdfSectionBanner(doc, pageW, m, y, "Fase de grupos");
    let levelOrdinal = 0;
    for (const lvl of activeLevels) {
      const gRows = byLvlGroup[lvl] || [];
      if (!gRows.length) continue;
      if (levelOrdinal++ > 0) y += PDF_BLOCK_GAP_MM;

      let fontPt = 8.5;
      let blockEst = estimateGroupLevelBlockMm(gRows.length, fontPt);
      while (blockEst > maxPdfColH && fontPt > 6) {
        fontPt -= 0.5;
        blockEst = estimateGroupLevelBlockMm(gRows.length, fontPt);
      }
      y = pdfCheckPageBreak(y, blockEst, pageH, openPage);
      while (y + blockEst > bottomLimit + 0.35 && fontPt > 6) {
        fontPt -= 0.5;
        blockEst = estimateGroupLevelBlockMm(gRows.length, fontPt);
      }
      while (y + blockEst > bottomLimit + 0.35) {
        y = openPage();
        while (y + blockEst > bottomLimit + 0.35 && fontPt > 6) {
          fontPt -= 0.5;
          blockEst = estimateGroupLevelBlockMm(gRows.length, fontPt);
        }
      }

      doc.setFont(PDF_FONT, "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(32, 38, 46);
      doc.text(pdfUtf8Text(`Nivel ${lvl} — Calendario completo (${gRows.length} partidos)`), m, y);
      y += 6;

      y = pdfDrawMatchScheduleTable(doc, { rows: gRows }, y, m, fontPt);
      y += PDF_AFTER_TABLE_MM;
    }
  }

  const clRounds = buildJornadaRounds(matches, "clasificacion", activeLevels).filter((r) => r.jornada > 0);
  if (clRounds.length) {
    y = openPage();
    y = pdfRenderJornadaRounds(doc, clRounds, y, m, pageW, pageH, openPage, "Jornadas - Clasificación");
  }

  const grRounds = buildJornadaRounds(matches, "group", activeLevels).filter((r) => r.jornada > 0);
  if (grRounds.length) {
    y = openPage();
    y = pdfRenderJornadaRounds(doc, grRounds, y, m, pageW, pageH, openPage, "Jornadas - Fase de grupos");
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
  const [rebotechLogoBroken, setRebotechLogoBroken] = useState(false);
  const logoFileRef = useRef(null);
  const [form, setForm] = useState({
    nombre: "", apellidos: "", telefono: "", empresa: "", email: "", nivel: "B", pairWith: "",
  });
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [groupPhaseStarted, setGroupPhaseStarted] = useState(false);
  const [manualPairs, setManualPairs] = useState(null);
  const [editingPairs, setEditingPairs] = useState(false);
  const [pairEditDraft, setPairEditDraft] = useState(null);
  /** Modal editar jugador / pareja / composición / intercambio */
  const [playerPairEditModal, setPlayerPairEditModal] = useState(null);
  const [startGruposModal, setStartGruposModal] = useState(null);
  const [resetGruposModalOpen, setResetGruposModalOpen] = useState(false);

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
    if (tournamentStarted && groupPhaseStarted) {
      showToast(MSG_NO_EDIT_GRUPOS);
      return;
    }
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

  const openStartGruposModal = () => {
    const pending = matches.filter((m) => m.phase === "clasificacion" && !m.played).length;
    setStartGruposModal({ pending });
  };

  const executeBeginGruposPhase = () => {
    setStartGruposModal(null);
    setEditingPairs(false);
    setPairEditDraft(null);
    setGroupPhaseStarted(true);
    showToast("Fase de grupos iniciada");
    setMatches((ms) => {
      const cls = ms.filter((m) => m.phase === "clasificacion");
      const grouped = assignJornadasToPhase(generateGroupMatches(pairs), config.courts);
      return [...cls, ...grouped];
    });
  };

  const executeResetGroupPhase = () => {
    setResetGruposModalOpen(false);
    setGroupPhaseStarted(false);
    setMatches((ms) => {
      const cls = ms.filter((m) => m.phase === "clasificacion");
      return assignJornadasToPhase(cls, config.courts);
    });
    showToast("Fase de grupos reiniciada. Puedes editar parejas de nuevo.");
  };

  const requestPairStructureEdit = (fn) => {
    if (tournamentStarted && groupPhaseStarted) {
      showToast(MSG_NO_EDIT_GRUPOS);
      return;
    }
    if (tournamentStarted && hasClasificacionPlayedResults(matches)) {
      if (
        !confirm(
          "Hay resultados guardados en clasificación. Modificar parejas puede alterar el calendario. ¿Continuar?"
        )
      ) {
        return;
      }
    }
    fn();
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
    if (tournamentStarted && groupPhaseStarted) {
      showToast(MSG_NO_EDIT_GRUPOS);
      return;
    }
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

  const closePlayerPairEditModal = () => setPlayerPairEditModal(null);

  const patchPlayerPairEditDraft = (patch) => {
    setPlayerPairEditModal((prev) =>
      prev ? { ...prev, draft: { ...prev.draft, ...patch } } : prev
    );
  };

  const openEditPairComposition = (pairId) => {
    requestPairStructureEdit(() => {
      const list = tournamentStarted ? pairs : previewPairsPreStart;
      const pair = list.find((p) => p.id === pairId);
      if (!pair) return;
      setPlayerPairEditModal({
        kind: "pairComposition",
        pairId,
        draft: {
          p1Id: pair.p1.id,
          p2Id: pair.p2?.id ?? "",
          level: pair.level,
        },
      });
    });
  };

  const openSwapPlayersModal = (preselectPlayerId) => {
    if (!tournamentStarted) {
      showToast("Intercambiar jugadores solo está disponible durante el torneo (fase de clasificación).");
      return;
    }
    requestPairStructureEdit(() => {
      setPlayerPairEditModal({
        kind: "swapPlayers",
        draft: { aId: preselectPlayerId || "", bId: "" },
      });
    });
  };

  const openEditPlayerModal = (playerId) => {
    if (tournamentStarted && groupPhaseStarted) {
      showToast(MSG_NO_EDIT_GRUPOS);
      return;
    }
    const p = players.find((x) => x.id === playerId);
    if (!p) return;
    setPlayerPairEditModal({
      kind: "player",
      playerId,
      draft: {
        nombre: p.nombre ?? "",
        apellidos: p.apellidos ?? "",
        nivel: clampPlayerLevel(p.nivel, activeLevels),
      },
    });
  };

  const commitPairCompositionSave = () => {
    const mod = playerPairEditModal;
    if (!mod || mod.kind !== "pairComposition") return;
    const { pairId, draft } = mod;
    const p1Id = draft.p1Id;
    const p2Id = String(draft.p2Id ?? "").trim();
    if (!p1Id) {
      showToast("⚠️ Elige jugador 1");
      return;
    }
    if (p2Id && p1Id === p2Id) {
      showToast("⚠️ Los dos jugadores no pueden ser la misma persona");
      return;
    }
    const P1 = players.find((p) => p.id === p1Id);
    const P2 = p2Id ? players.find((p) => p.id === p2Id) : null;
    if (!P1) return;
    const list = tournamentStarted ? pairs : previewPairsPreStart;
    const occupied = new Set();
    list.forEach((pr) => {
      if (pr.id === pairId) return;
      occupied.add(pr.p1.id);
      if (pr.p2) occupied.add(pr.p2.id);
    });
    if (occupied.has(p1Id) || (P2 && occupied.has(P2.id))) {
      showToast("⚠️ Un jugador no puede estar en dos parejas a la vez");
      return;
    }
    const newLevel = clampPlayerLevel(parseNivelFlexible(draft.level, activeLevels), activeLevels);

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === p1Id || (P2 && p.id === P2.id)) return { ...p, nivel: newLevel };
        return p;
      })
    );

    const nextPlayersBase = players.map((p) => {
      if (p.id === p1Id || (P2 && p.id === P2.id)) return { ...p, nivel: newLevel };
      return p;
    });
    const P1b = nextPlayersBase.find((p) => p.id === p1Id) ?? P1;
    const P2b = P2 ? nextPlayersBase.find((p) => p.id === P2.id) : null;

    if (!tournamentStarted) {
      setManualPairs((mp) => {
        const base = mp ?? previewPairsPreStart;
        return base.map((pr) =>
          pr.id === pairId ? { ...pr, p1: P1b, p2: P2b, level: newLevel } : pr
        );
      });
      closePlayerPairEditModal();
      showToast("✅ Pareja actualizada");
      return;
    }

    setPairs((prev) => {
      const next = prev.map((pr) =>
        pr.id === pairId ? { ...pr, p1: P1b, p2: P2b, level: newLevel } : pr
      );
      queueMicrotask(() => {
        setMatches(assignJornadasToPhase(generateClasificacionMatches(next), config.courts));
      });
      return next;
    });
    closePlayerPairEditModal();
    showToast("✅ Pareja actualizada");
  };

  const commitSwapPlayersSave = () => {
    const mod = playerPairEditModal;
    if (!mod || mod.kind !== "swapPlayers") return;
    const aId = mod.draft.aId;
    const bId = mod.draft.bId;
    if (!aId || !bId || aId === bId) {
      showToast("⚠️ Selecciona dos jugadores distintos");
      return;
    }
    function locate(pl, pid) {
      for (const pr of pl) {
        if (pr.p1.id === pid) return { pairId: pr.id, k: "p1" };
        if (pr.p2?.id === pid) return { pairId: pr.id, k: "p2" };
      }
      return null;
    }
    const la = locate(pairs, aId);
    const lb = locate(pairs, bId);
    if (!la || !lb) {
      showToast("⚠️ Jugadores no encontrados en las parejas");
      return;
    }
    const getP = (id) => players.find((x) => x.id === id);

    setPairs((prev) => {
      const next = prev.map((pr) => ({ ...pr }));
      if (la.pairId === lb.pairId) {
        const pr = next.find((p) => p.id === la.pairId);
        if (pr && pr.p2 && la.k !== lb.k) {
          const t = pr.p1;
          pr.p1 = pr.p2;
          pr.p2 = t;
        }
      } else {
        const pa = next.find((p) => p.id === la.pairId);
        const pb = next.find((p) => p.id === lb.pairId);
        const playerA = getP(aId);
        const playerB = getP(bId);
        pa[la.k] = playerB;
        pb[lb.k] = playerA;
      }
      queueMicrotask(() => {
        setMatches(assignJornadasToPhase(generateClasificacionMatches(next), config.courts));
      });
      return next;
    });
    closePlayerPairEditModal();
    showToast("✅ Intercambio aplicado");
  };

  const savePlayerPairEditModal = () => {
    const mod = playerPairEditModal;
    if (!mod) return;

    if (mod.kind === "player") {
      if (tournamentStarted && groupPhaseStarted) {
        showToast(MSG_NO_EDIT_GRUPOS);
        return;
      }
      const { playerId, draft } = mod;
      setPlayers((prev) => {
        const cur = prev.find((p) => p.id === playerId);
        if (!cur) {
          queueMicrotask(closePlayerPairEditModal);
          return prev;
        }
        const wantLevel = clampPlayerLevel(parseNivelFlexible(draft.nivel, activeLevels), activeLevels);
        const curLevel = clampPlayerLevel(cur.nivel, activeLevels);
        if (groupPhaseStarted && wantLevel !== curLevel) {
          showToast("No se puede cambiar el nivel una vez iniciada la fase de grupos");
          return prev;
        }
        const next = prev.map((p) =>
          p.id === playerId
            ? {
                ...p,
                nombre: draft.nombre.trim(),
                apellidos: draft.apellidos.trim(),
                ...(!groupPhaseStarted ? { nivel: wantLevel } : {}),
              }
            : p
        );

        queueMicrotask(() => {
          if (tournamentStarted) {
            setPairs((prevPairs) => {
              const nextPairs = prevPairs.map((pr) => {
                const p1 = next.find((x) => x.id === pr.p1.id) ?? pr.p1;
                const p2 = pr.p2 ? next.find((x) => x.id === pr.p2.id) ?? pr.p2 : null;
                const base = { ...pr, p1, p2 };
                if (groupPhaseStarted) return base;
                if (base.p1.id === playerId || base.p2?.id === playerId) {
                  return { ...base, level: clampPlayerLevel(base.p1.nivel, activeLevels) };
                }
                return base;
              });
              const oldPr = prevPairs.find((pr) => pr.p1.id === playerId || pr.p2?.id === playerId);
              const newPr = nextPairs.find((pr) => pr.id === oldPr?.id);
              const levelChanged =
                !groupPhaseStarted && !!oldPr && !!newPr && oldPr.level !== newPr.level;

              setMatches((prevM) => {
                if (tournamentStarted && !groupPhaseStarted && levelChanged) {
                  return assignJornadasToPhase(generateClasificacionMatches(nextPairs), config.courts);
                }
                return syncMatchPairRefs(prevM, nextPairs);
              });
              return nextPairs;
            });
          } else {
            setManualPairs((mp) => {
              const base = mp ?? previewPairsPreStart;
              return base.map((pr) => {
                const p1 = next.find((x) => x.id === pr.p1.id) ?? pr.p1;
                const p2 = pr.p2 ? next.find((x) => x.id === pr.p2.id) ?? pr.p2 : null;
                const basePr = { ...pr, p1, p2 };
                if (groupPhaseStarted) return basePr;
                if (basePr.p1.id === playerId || basePr.p2?.id === playerId) {
                  return {
                    ...basePr,
                    level: clampPlayerLevel(basePr.p1.nivel, activeLevels),
                  };
                }
                return basePr;
              });
            });
          }
          closePlayerPairEditModal();
          showToast("✅ Cambios guardados");
        });

        return next;
      });
    }
  };

  const playerOptionLabel = (p) =>
    `${String(p?.nombre ?? "")} ${String(p?.apellidos ?? "")} (${clampPlayerLevel(p?.nivel, activeLevels)})`.trim();

  const handleScoreChange = (matchId, field, val) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        const draft = { ...m, [field]: val };
        const { score1, score2 } = normalizedScoresFromFields(draft.score1, draft.score2);
        return { ...draft, score1, score2 };
      })
    );
  };

  const handleMatchScoreBlur = (matchId) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId || m.played) return m;
        const { score1, score2 } = normalizedScoresFromFields(m.score1, m.score2);
        return { ...m, score1, score2 };
      })
    );
  };

  const handleSaveScore = (matchId) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        const { score1, score2 } = normalizedScoresFromFields(m.score1, m.score2);
        return { ...m, score1, score2, played: true };
      })
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
              onBlur={() => handleMatchScoreBlur(m.id)}
            />
            <span className="score-sep">-</span>
            <input
              type="number"
              min="0"
              className="score-input"
              placeholder="0"
              value={m.score2}
              onChange={(e) => handleScoreChange(m.id, "score2", e.target.value)}
              onBlur={() => handleMatchScoreBlur(m.id)}
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
    { key: "clasificacion", label: "🏆 Ranking" },
    { key: "config", label: "⚙️ Configuración" },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <header className="header">
          <div className="rebotech-lockup" aria-label="ReBoTech Solutions">
            {!rebotechLogoBroken ? (
              <img
                src="/ReBoTech_logo.jpg"
                alt=""
                className="rebotech-logo-img"
                width={100}
                height={36}
                onError={() => setRebotechLogoBroken(true)}
              />
            ) : (
              <span className="logo-icon rebotech-logo-fallback" aria-hidden>
                🎾
              </span>
            )}
            <span className="rebotech-wordmark">
              <span className="rebotech-name">ReBoTech</span>
              <span className="rebotech-tag">Solutions</span>
            </span>
          </div>
          <div className="header-tournament-mid" title={(tournamentName || "").trim() || undefined}>
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="" className="header-event-logo" />
            ) : null}
            {(tournamentName || "").trim() ? (
              <span className="header-event-title">{(tournamentName || "").trim()}</span>
            ) : (
              <span className="header-event-title" style={{ color: "var(--muted)", letterSpacing: "0.15em", fontSize: "18px" }}>
                PÁDEL MANAGER
              </span>
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
                  {/*<div className="icon">🎾</div> */}
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
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span className={`badge badge-${clampPlayerLevel(p.nivel, activeLevels)}`}>
                            {clampPlayerLevel(p.nivel, activeLevels)}
                          </span>
                          <button
                            type="button"
                            className="btn-secondary"
                            disabled={tournamentStarted && groupPhaseStarted}
                            onClick={() => openEditPlayerModal(p.id)}
                          >
                            Editar
                          </button>
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
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div className="section-title" style={{ marginBottom: 0 }}>
                  Cruces y Partidas
                </div>
                {tournamentStarted ? (
                  <span
                    className="group-badge"
                    style={{
                      fontSize: 13,
                      padding: "6px 14px",
                      border: "1px solid var(--border)",
                      borderRadius: 20,
                      color: "var(--text)",
                      fontWeight: 600,
                    }}
                  >
                    Fase: {groupPhaseStarted ? "Grupos" : "Clasificación"}
                  </span>
                ) : null}
              </div>
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{pair.p1.nombre} {pair.p1.apellidos}</div>
                            {pair.p2 ? (
                              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--muted)" }}>{pair.p2.nombre} {pair.p2.apellidos}</div>
                            ) : (
                              <div style={{ fontSize: 12, color: "var(--muted)" }}>Sin pareja asignada</div>
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                            <span className={`badge badge-${pair.level}`}>{pair.level}</span>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: "6px 12px", fontSize: 12 }}
                              onClick={() => openEditPairComposition(pair.id)}
                            >
                              Editar pareja
                            </button>
                          </div>
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
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        if (groupPhaseStarted) {
                          showToast(MSG_NO_EDIT_GRUPOS);
                          return;
                        }
                        beginEditPairs();
                      }}
                    >
                      ✏️ Editar parejas
                    </button>
                    {!groupPhaseStarted ? (
                      <button type="button" className="btn-secondary" onClick={() => openSwapPlayersModal()}>
                        Intercambiar jugador
                      </button>
                    ) : null}
                    {groupPhaseStarted ? (
                      <button
                        type="button"
                        className="btn-danger"
                        style={{ border: "1px solid rgba(255,87,34,0.5)" }}
                        onClick={() => setResetGruposModalOpen(true)}
                      >
                        Reiniciar fase de grupos
                      </button>
                    ) : null}
                  </div>

                  {/* Pairs overview */}
                  <div className="phase-title">Parejas formadas</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10, marginBottom: 8 }}>
                    {pairs.filter(p => p.p2).map((pair) => (
                      <div className="card" key={pair.id} style={{ padding: "14px 18px", marginBottom: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{pair.p1.nombre} {pair.p1.apellidos}</div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--muted)" }}>{pair.p2.nombre} {pair.p2.apellidos}</div>
                            {pair.p1.empresa && <div style={{ fontSize: 11, color: "#444", marginTop: 3 }}>{pair.p1.empresa}</div>}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                            <span className={`badge badge-${pair.level}`}>{pair.level}</span>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: "6px 12px", fontSize: 12 }}
                              onClick={() => openEditPairComposition(pair.id)}
                            >
                              Editar pareja
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: "6px 12px", fontSize: 12 }}
                              onClick={() => openSwapPlayersModal(pair.p1.id)}
                            >
                              Intercambiar
                            </button>
                          </div>
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
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => openEditPairComposition(pair.id)}
                                  >
                                    Editar pareja
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => openSwapPlayersModal(pair.p1.id)}
                                  >
                                    Intercambiar
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
                        <button type="button" className="btn-primary" onClick={openStartGruposModal}>
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

        <footer className="app-footer">
          <p>Powered by ReBoTech Solutions</p>
          <p>
            <a href="mailto:rebotech.solutions@gmail.com" style={{ color: "inherit", textDecoration: "none" }}>
              rebotech.solutions@gmail.com
            </a>
            {" | Valencia, España"}
          </p>
        </footer>

        {startGruposModal ? (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={() => setStartGruposModal(null)}
          >
            <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
              <h3 id="start-grupos-title">Iniciar fase de grupos</h3>
              <p className="modal-sub">
                A partir de aquí no podrás modificar parejas, jugadores de pareja ni niveles hasta que reinicies esta fase.
              </p>
              {startGruposModal.pending > 0 ? (
                <div className="info-box" style={{ marginBottom: 14 }}>
                  Quedan <strong>{startGruposModal.pending}</strong> partida
                  {startGruposModal.pending !== 1 ? "s" : ""} de clasificación sin resultado.
                </div>
              ) : null}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setStartGruposModal(null)}>
                  Cancelar
                </button>
                <button type="button" className="btn-primary" onClick={executeBeginGruposPhase}>
                  Iniciar fase de grupos
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {resetGruposModalOpen ? (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={() => setResetGruposModalOpen(false)}
          >
            <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
              <h3>Reiniciar fase de grupos</h3>
              <p className="modal-sub">
                Se eliminarán todos los partidos y resultados de la fase de grupos. La clasificación previa se mantiene.
                ¿Continuar?
              </p>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setResetGruposModalOpen(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn-danger" onClick={executeResetGroupPhase}>
                  Reiniciar fase de grupos
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {playerPairEditModal && (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
            onClick={closePlayerPairEditModal}
          >
            <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
              {playerPairEditModal.kind === "player" ? (
                <>
                  <h3 id="edit-modal-title">Editar jugador</h3>
                  <p className="modal-sub">Nombre, apellidos y categoría de juego.</p>
                  {groupPhaseStarted ? (
                    <div className="info-box" style={{ marginBottom: 14 }}>
                      {MSG_NO_EDIT_GRUPOS}
                    </div>
                  ) : null}
                  <div className="form-group">
                    <label htmlFor="edit-pl-nombre">Nombre</label>
                    <input
                      id="edit-pl-nombre"
                      value={playerPairEditModal.draft.nombre}
                      onChange={(e) => patchPlayerPairEditDraft({ nombre: e.target.value })}
                      autoComplete="off"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-pl-apellidos">Apellidos</label>
                    <input
                      id="edit-pl-apellidos"
                      value={playerPairEditModal.draft.apellidos}
                      onChange={(e) => patchPlayerPairEditDraft({ apellidos: e.target.value })}
                      autoComplete="off"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-pl-nivel">Nivel (categoría)</label>
                    <select
                      id="edit-pl-nivel"
                      value={playerPairEditModal.draft.nivel}
                      disabled={groupPhaseStarted}
                      onChange={(e) => patchPlayerPairEditDraft({ nivel: e.target.value })}
                    >
                      {activeLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>{nivelOptionLabel(lvl)}</option>
                      ))}
                    </select>
                  </div>
                  {!groupPhaseStarted ? (
                    <div className="form-group">
                      <label htmlFor="edit-pl-nivel-free">O escribe letra o número (1 = categoría más alta)</label>
                      <input
                        id="edit-pl-nivel-free"
                        type="text"
                        placeholder="Ej: B o 2"
                        onBlur={(e) => {
                          const t = e.target.value.trim();
                          if (!t) return;
                          patchPlayerPairEditDraft({ nivel: parseNivelFlexible(t, activeLevels) });
                        }}
                        autoComplete="off"
                      />
                    </div>
                  ) : null}
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={closePlayerPairEditModal}>
                      Cancelar
                    </button>
                    <button type="button" className="btn-primary" onClick={savePlayerPairEditModal}>
                      Guardar
                    </button>
                  </div>
                </>
              ) : playerPairEditModal.kind === "pairComposition" ? (
                <>
                  <h3 id="edit-modal-title">Editar pareja</h3>
                  <p className="modal-sub">
                    Asigna jugadores desde la lista inscrita y la categoría de la pareja.
                  </p>
                  <div className="form-group">
                    <label htmlFor="edit-pc-p1">Jugador 1</label>
                    <select
                      id="edit-pc-p1"
                      value={playerPairEditModal.draft.p1Id}
                      onChange={(e) => patchPlayerPairEditDraft({ p1Id: e.target.value })}
                    >
                      <option value="">— Elegir —</option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>{playerOptionLabel(p)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-pc-p2">Jugador 2</label>
                    <select
                      id="edit-pc-p2"
                      value={playerPairEditModal.draft.p2Id}
                      onChange={(e) => patchPlayerPairEditDraft({ p2Id: e.target.value })}
                    >
                      <option value="">— Sin pareja —</option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>{playerOptionLabel(p)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-pc-level">Categoría (nivel de la pareja)</label>
                    <select
                      id="edit-pc-level"
                      value={playerPairEditModal.draft.level}
                      onChange={(e) => patchPlayerPairEditDraft({ level: e.target.value })}
                    >
                      {activeLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>{nivelOptionLabel(lvl)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-pc-level-free">O letra / número (1 = más alto)</label>
                    <input
                      id="edit-pc-level-free"
                      type="text"
                      placeholder="Ej: B o 2"
                      onBlur={(e) => {
                        const t = e.target.value.trim();
                        if (!t) return;
                        patchPlayerPairEditDraft({ level: parseNivelFlexible(t, activeLevels) });
                      }}
                      autoComplete="off"
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={closePlayerPairEditModal}>
                      Cancelar
                    </button>
                    <button type="button" className="btn-primary" onClick={commitPairCompositionSave}>
                      Guardar
                    </button>
                  </div>
                </>
              ) : playerPairEditModal.kind === "swapPlayers" ? (
                <>
                  <h3 id="edit-modal-title">Intercambiar jugador</h3>
                  <p className="modal-sub">
                    Elige dos jugadores distintos que estén en parejas: intercambian su posición (entre parejas o pareja 1↔2).
                  </p>
                  <div className="form-group">
                    <label htmlFor="edit-sw-a">Jugador A</label>
                    <select
                      id="edit-sw-a"
                      value={playerPairEditModal.draft.aId}
                      onChange={(e) => patchPlayerPairEditDraft({ aId: e.target.value })}
                    >
                      <option value="">— Elegir —</option>
                      {pairs.flatMap((pr) => {
                        const opts = [{ p: pr.p1, key: `${pr.id}-p1` }];
                        if (pr.p2) opts.push({ p: pr.p2, key: `${pr.id}-p2` });
                        return opts;
                      }).map(({ p, key }) => (
                        <option key={key} value={p.id}>{playerOptionLabel(p)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-sw-b">Jugador B</label>
                    <select
                      id="edit-sw-b"
                      value={playerPairEditModal.draft.bId}
                      onChange={(e) => patchPlayerPairEditDraft({ bId: e.target.value })}
                    >
                      <option value="">— Elegir —</option>
                      {pairs.flatMap((pr) => {
                        const opts = [{ p: pr.p1, key: `${pr.id}-p1b` }];
                        if (pr.p2) opts.push({ p: pr.p2, key: `${pr.id}-p2b` });
                        return opts;
                      }).map(({ p, key }) => (
                        <option key={key} value={p.id}>{playerOptionLabel(p)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={closePlayerPairEditModal}>
                      Cancelar
                    </button>
                    <button type="button" className="btn-primary" onClick={commitSwapPlayersSave}>
                      Intercambiar
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
