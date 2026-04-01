// ── State ──────────────────────────────────────────────
let currentReport = null;
let activeTab = "bugs";

// ── DOM refs ───────────────────────────────────────────
const codeInput      = document.getElementById("codeInput");
const analyzeBtn     = document.getElementById("analyzeBtn");
const loading        = document.getElementById("loadingIndicator");
const loadingText    = document.getElementById("loadingText");
const resultsSection = document.getElementById("resultsSection");
const errorBox       = document.getElementById("errorBox");
const langSelect     = document.getElementById("langSelect");
const editorLabel    = document.getElementById("editorLabel");
const lineCount      = document.getElementById("lineCount");
const charCount      = document.getElementById("charCount");

// ── Editor utilities ───────────────────────────────────
codeInput.addEventListener("input", updateEditorMeta);
codeInput.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const s = codeInput.selectionStart;
    codeInput.value = codeInput.value.substring(0, s) + "  " + codeInput.value.substring(codeInput.selectionEnd);
    codeInput.selectionStart = codeInput.selectionEnd = s + 2;
    updateEditorMeta();
  }
});

langSelect.addEventListener("change", () => {
  const l = langSelect.value;
  editorLabel.textContent = l === "auto" ? "untitled" : `untitled.${extFor(l)}`;
});

function extFor(lang) {
  const m = { JavaScript:"js", TypeScript:"ts", Python:"py", Java:"java",
    "C++":"cpp", Go:"go", Rust:"rs", PHP:"php", Ruby:"rb", SQL:"sql" };
  return m[lang] || "txt";
}

function updateEditorMeta() {
  const val = codeInput.value;
  const lines = val ? val.split("\n").length : 0;
  lineCount.textContent = `${lines} line${lines !== 1 ? "s" : ""}`;
  charCount.textContent = `${val.length} chars`;
}

document.getElementById("clearBtn").addEventListener("click", () => {
  codeInput.value = "";
  updateEditorMeta();
  hideResults();
});

document.getElementById("copyInputBtn").addEventListener("click", () => {
  navigator.clipboard.writeText(codeInput.value);
});

// ── Tabs ───────────────────────────────────────────────
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeTab = tab.dataset.tab;
    if (currentReport) renderTabContent(currentReport, activeTab);
  });
});

// ── Main review function ───────────────────────────────
async function reviewCode() {
  const code = codeInput.value.trim();
  if (!code) {
    showError("Please paste some code before analyzing.");
    return;
  }

  hideResults();
  hideError();
  setLoading(true);

  const loadingMessages = [
    "Parsing structure...",
    "Checking for bugs...",
    "Scanning for security risks...",
    "Evaluating performance...",
    "Scoring code quality..."
  ];
  let msgIdx = 0;
  const msgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % loadingMessages.length;
    loadingText.textContent = loadingMessages[msgIdx];
  }, 1800);

  try {
    const res = await fetch("/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language: langSelect.value })
    });

    clearInterval(msgInterval);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error (${res.status})`);
    }

    const json = await res.json();

    if (!json.success) throw new Error(json.error || "Analysis failed.");

    currentReport = json.data;
    renderResults(currentReport);

  } catch (err) {
    clearInterval(msgInterval);
    showError(err.message || "Could not connect to server. Is it running?");
  } finally {
    setLoading(false);
  }
}

// ── Render results ─────────────────────────────────────
function renderResults(data) {
  // Score ring
  const score = Math.min(100, Math.max(0, data.score || 0));
  const circ = 163.4;
  const offset = circ - (circ * score / 100);
  const ring = document.getElementById("scoreRing");
  ring.style.strokeDashoffset = circ;
  setTimeout(() => { ring.style.strokeDashoffset = offset; }, 50);

  const scoreColor = score >= 75 ? "#22c55e" : score >= 55 ? "#f59e0b" : "#ef4444";
  ring.style.stroke = scoreColor;

  document.getElementById("scoreNum").textContent = score;
  document.getElementById("scoreLabel").textContent = data.scoreLabel || "";
  document.getElementById("detectedLang").textContent = data.language || "";
  document.getElementById("summaryText").textContent = data.summary || "";

  // Pill counts
  const bugs  = (data.bugs || []).length;
  const sec   = (data.security || []).length;
  const perf  = (data.performance || []).length;
  const imps  = (data.improvements || []).length;
  const pos   = (data.positives || []).length;

  document.getElementById("bugsBadge").textContent  = bugs;
  document.getElementById("secBadge").textContent   = sec;
  document.getElementById("perfBadge").textContent  = perf;
  document.getElementById("impBadge").textContent   = imps;
  document.getElementById("posBadge").textContent   = pos;

  const pillsEl = document.getElementById("pillCounts");
  pillsEl.innerHTML = [
    bugs  ? `<span class="pill red">&#9679; ${bugs} bug${bugs !== 1 ? "s" : ""}</span>` : "",
    sec   ? `<span class="pill amber">&#9679; ${sec} security</span>` : "",
    perf  ? `<span class="pill blue">&#9679; ${perf} performance</span>` : "",
    imps  ? `<span class="pill purple">&#9679; ${imps} improvements</span>` : "",
    pos   ? `<span class="pill green">&#9679; ${pos} positives</span>` : "",
  ].join("");

  // Render first tab
  renderTabContent(data, activeTab);

  resultsSection.classList.remove("hidden");
}

function renderTabContent(data, tab) {
  const container = document.getElementById("tabContent");
  container.innerHTML = "";

  if (tab === "bugs") renderIssueList(container, data.bugs, "bug");
  else if (tab === "security") renderIssueList(container, data.security, "security");
  else if (tab === "performance") renderIssueList(container, data.performance, "performance");
  else if (tab === "improvements") renderImprovements(container, data.improvements);
  else if (tab === "positives") renderPositives(container, data.positives);
}

function renderIssueList(container, items, type) {
  if (!items || items.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="check">✓</div>No ${type} issues found.</div>`;
    return;
  }
  items.forEach(item => {
    const card = document.createElement("div");
    const sev = (item.severity || "low").toLowerCase();
    card.className = `issue-card ${sev}`;
    card.innerHTML = `
      <div class="issue-top">
        <span class="sev-badge ${sev}">${sev}</span>
        ${item.line ? `<span class="issue-line">Line ${item.line}</span>` : ""}
      </div>
      <div class="issue-desc">${escHtml(item.description || "")}</div>
      ${item.fix ? `<div class="issue-fix">${escHtml(item.fix)}</div>` : ""}
    `;
    container.appendChild(card);
  });
}

function renderImprovements(container, items) {
  if (!items || items.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="check">✓</div>No improvement suggestions.</div>`;
    return;
  }
  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "issue-card improvement";
    card.innerHTML = `
      <div class="issue-top">
        <span class="cat-badge">${escHtml(item.category || "general")}</span>
      </div>
      <div class="issue-desc">${escHtml(item.description || "")}</div>
      ${item.example ? `<div class="issue-example">${escHtml(item.example)}</div>` : ""}
    `;
    container.appendChild(card);
  });
}

function renderPositives(container, items) {
  if (!items || items.length === 0) {
    container.innerHTML = `<div class="empty-state">No positives listed.</div>`;
    return;
  }
  items.forEach(text => {
    const card = document.createElement("div");
    card.className = "issue-card positive";
    card.innerHTML = `<div class="issue-desc">&#10003; ${escHtml(text)}</div>`;
    container.appendChild(card);
  });
}

// ── Copy report ────────────────────────────────────────
document.getElementById("copyReportBtn").addEventListener("click", () => {
  if (!currentReport) return;
  const d = currentReport;
  let txt = `CODE REVIEW REPORT\nScore: ${d.score}/100 (${d.scoreLabel})\nLanguage: ${d.language}\n\n${d.summary}\n`;
  const section = (title, arr, fields) => {
    if (!arr || !arr.length) return "";
    let s = `\n── ${title} (${arr.length}) ──\n`;
    arr.forEach((item, i) => {
      s += `\n${i+1}. `;
      fields.forEach(f => { if (item[f]) s += `[${f.toUpperCase()}] ${item[f]} `; });
      s += "\n";
    });
    return s;
  };
  txt += section("BUGS", d.bugs, ["severity","line","description","fix"]);
  txt += section("SECURITY", d.security, ["severity","description","fix"]);
  txt += section("PERFORMANCE", d.performance, ["severity","description","fix"]);
  txt += section("IMPROVEMENTS", d.improvements, ["category","description","example"]);
  if (d.positives?.length) {
    txt += `\n── POSITIVES ──\n${d.positives.map((p,i) => `${i+1}. ${p}`).join("\n")}\n`;
  }
  navigator.clipboard.writeText(txt);
  const btn = document.getElementById("copyReportBtn");
  btn.textContent = "Copied!";
  setTimeout(() => { btn.textContent = "Copy Report"; }, 2000);
});

document.getElementById("newReviewBtn").addEventListener("click", () => {
  codeInput.value = "";
  updateEditorMeta();
  hideResults();
  codeInput.focus();
});

// ── Helpers ────────────────────────────────────────────
function setLoading(on) {
  analyzeBtn.disabled = on;
  loading.classList.toggle("hidden", !on);
  if (on) loadingText.textContent = "Analyzing with AI...";
}

function hideResults() {
  resultsSection.classList.add("hidden");
  currentReport = null;
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Init ───────────────────────────────────────────────
updateEditorMeta();
