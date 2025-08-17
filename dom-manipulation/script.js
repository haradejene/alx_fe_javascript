
const LS_QUOTES_KEY = "dqg_quotes_v3";
const LS_LAST_FILTER_KEY = "dqg_last_filter_v1";
const SS_LAST_QUOTE_KEY = "dqg_last_quote_v1";
const SS_LAST_CATEGORY_KEY = "dqg_last_category_v1";
const POSTS_URL = "https://jsonplaceholder.typicode.com/posts";

let quotes = [];
let conflicts = [];

const quoteTextEl = document.getElementById("quoteText");
const quoteCategoryEl = document.getElementById("quoteCategory");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const categorySelect = document.getElementById("categorySelect");
const newQuoteTextInput = document.getElementById("newQuoteText");
const newQuoteCategoryInput = document.getElementById("newQuoteCategory");
const exportBtn = document.getElementById("exportBtn");
const importFileInput = document.getElementById("importFile");
const importBtn = document.getElementById("importBtn");
const clearLocalBtn = document.getElementById("clearLocal");
const resetDefaultsBtn = document.getElementById("resetDefaults");
const categoryFilter = document.getElementById("categoryFilter");
const filteredQuotesContainer = document.getElementById("filteredQuotes");

function uid() {
  return "local-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function now() {
  return Date.now();
}

function normalizeQuote(q) {
  return {
    id: q.id || uid(),
    text: String(q.text || "").trim().replace(/\s+/g, " "),
    category: String(q.category || "General").trim().replace(/\s+/g, " ") || "General",
    updatedAt: typeof q.updatedAt === "number" ? q.updatedAt : now(),
    pending: !!q.pending
  };
}

function isValidQuote(q) {
  return q && typeof q.text === "string" && q.text.trim() && typeof q.category === "string" && q.category.trim();
}

function saveQuotes() {
  localStorage.setItem(LS_QUOTES_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  try {
    const raw = localStorage.getItem(LS_QUOTES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map(normalizeQuote).filter(isValidQuote);
  } catch {
    return null;
  }
}

function seedDefaults() {
  return [
    { id: uid(), text: "The best way to get started is to quit talking and begin doing.", category: "Motivation", updatedAt: now() - 10000, pending: false },
    { id: uid(), text: "Life is what happens when you're busy making other plans.", category: "Life", updatedAt: now() - 9000, pending: false },
    { id: uid(), text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming", updatedAt: now() - 8000, pending: false }
  ];
}

function updateCategoryOptions() {
  if (!categorySelect) return;
  categorySelect.innerHTML = `<option value="all">All</option>`;
  const cats = [...new Set(quotes.map(q => q.category))].sort();
  cats.forEach(cat => {
    const o = document.createElement("option");
    o.value = cat;
    o.textContent = cat;
    categorySelect.appendChild(o);
  });
  const lastCat = sessionStorage.getItem(SS_LAST_CATEGORY_KEY);
  if (lastCat && [...categorySelect.options].some(o => o.value === lastCat)) categorySelect.value = lastCat;
}

function displayQuote(q) {
  if (quoteTextEl) quoteTextEl.textContent = `“${q.text}”`;
  if (quoteCategoryEl) quoteCategoryEl.textContent = `— ${q.category}`;
  sessionStorage.setItem(SS_LAST_QUOTE_KEY, JSON.stringify(q));
}

function showRandomQuote() {
  const selectedCategory = categorySelect ? categorySelect.value : "all";
  const pool = selectedCategory === "all" ? quotes : quotes.filter(q => q.category === selectedCategory);
  if (pool.length === 0) {
    if (quoteTextEl) quoteTextEl.textContent = "No quotes available for this category.";
    if (quoteCategoryEl) quoteCategoryEl.textContent = "";
    return;
  }
  const q = pool[Math.floor(Math.random() * pool.length)];
  displayQuote(q);
}

function populateCategories() {
  if (!categoryFilter) return;
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  const cats = [...new Set(quotes.map(q => q.category))].sort();
  cats.forEach(cat => {
    const o = document.createElement("option");
    o.value = cat;
    o.textContent = cat;
    categoryFilter.appendChild(o);
  });
  const saved = localStorage.getItem(LS_LAST_FILTER_KEY) || "all";
  if ([...categoryFilter.options].some(o => o.value === saved)) categoryFilter.value = saved;
}

function renderFilteredList(items) {
  if (!filteredQuotesContainer) return;
  filteredQuotesContainer.innerHTML = "";
  items.forEach(q => {
    const div = document.createElement("div");
    div.className = "quote-item";
    div.innerHTML = `<p>"${q.text}"</p><small>— ${q.category}${q.pending ? " (pending sync)" : ""}</small>`;
    filteredQuotesContainer.appendChild(div);
  });
}

function filterQuote() {
  if (!categoryFilter) return;
  const val = categoryFilter.value;
  localStorage.setItem(LS_LAST_FILTER_KEY, val);
  const filtered = val === "all" ? quotes : quotes.filter(q => q.category === val);
  if (filtered.length === 0) {
    if (filteredQuotesContainer) filteredQuotesContainer.textContent = "No quotes found for this category.";
    return;
  }
  renderFilteredList(filtered);
}

function addQuote() {
  const text = newQuoteTextInput ? newQuoteTextInput.value.trim() : "";
  const category = newQuoteCategoryInput ? newQuoteCategoryInput.value.trim() : "";
  if (!text || !category) {
    alert("Please enter both a quote and a category.");
    return;
  }
  const q = normalizeQuote({ text, category, pending: true, updatedAt: now() });
  quotes.push(q);
  saveQuotes();
  updateCategoryOptions();
  populateCategories();
  filterQuote();
  if (newQuoteTextInput) newQuoteTextInput.value = "";
  if (newQuoteCategoryInput) newQuoteCategoryInput.value = "";
  displayQuote(q);
}

function createAddQuoteForm() {
  if (!addQuoteBtn) return;
  addQuoteBtn.addEventListener("click", addQuote);
}

function quoteDisplay() {
  filterQuote();
}

function exportToJson() {
  const data = JSON.stringify(quotes, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quotes-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(fileOrEvent) {
  const file = fileOrEvent?.target?.files?.[0] || fileOrEvent;
  if (!file) {
    alert("Choose a JSON file first.");
    return;
  }
  const r = new FileReader();
  r.onload = () => {
    try {
      const parsed = JSON.parse(r.result);
      if (!Array.isArray(parsed)) throw new Error();
      const incoming = parsed.map(x => (x.id || x.updatedAt ? x : { ...x, id: uid(), updatedAt: now(), pending: true })).map(normalizeQuote).filter(isValidQuote);
      const seen = new Set(quotes.map(q => (q.text.trim().toLowerCase() + "::" + q.category.trim().toLowerCase())));
      let added = 0;
      incoming.forEach(q => {
        const key = q.text.trim().toLowerCase() + "::" + q.category.trim().toLowerCase();
        if (!seen.has(key)) {
          quotes.push(q);
          seen.add(key);
          added++;
        }
      });
      saveQuotes();
      updateCategoryOptions();
      populateCategories();
      filterQuote();
      alert(`Imported ${added} quote(s).`);
      if (importFileInput) importFileInput.value = "";
    } catch {
      alert("Invalid JSON file.");
    }
  };
  r.readAsText(file);
}

function ensureSyncUI() {
  if (document.getElementById("syncBar")) return;
  const bar = document.createElement("div");
  bar.id = "syncBar";
  bar.style.cssText = "position:fixed;bottom:16px;right:16px;display:flex;gap:8px;align-items:center;background:#111;color:#fff;padding:10px 12px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.2);font:14px system-ui";
  const status = document.createElement("span");
  status.id = "syncStatus";
  status.textContent = "Idle";
  const syncBtn = document.createElement("button");
  syncBtn.textContent = "Sync Now";
  syncBtn.style.cssText = "border:none;border-radius:8px;padding:6px 10px;cursor:pointer";
  syncBtn.onclick = () => syncNow();
  const resolveBtn = document.createElement("button");
  resolveBtn.id = "resolveConflictsBtn";
  resolveBtn.textContent = "Resolve Conflicts";
  resolveBtn.style.cssText = "border:none;border-radius:8px;padding:6px 10px;cursor:pointer;display:none";
  resolveBtn.onclick = () => openConflictResolver();
  bar.appendChild(status);
  bar.appendChild(syncBtn);
  bar.appendChild(resolveBtn);
  document.body.appendChild(bar);
}

function setStatus(t) {
  const el = document.getElementById("syncStatus");
  if (el) el.textContent = t;
}

async function fetchServerQuotes() {
  const res = await fetch(POSTS_URL + "?_limit=20");
  const posts = await res.json();
  const nowTs = now();
  return posts.map((p, i) => normalizeQuote({ id: "server-" + p.id, text: (p.body || p.title || "").toString(), category: "Server", updatedAt: nowTs - i * 1000, pending: false }));
}

async function fetchQuotesFromServer() {
  return await fetchServerQuotes();
}

async function pushPendingToServer() {
  const pending = quotes.filter(q => q.pending);
  if (pending.length === 0) return [];
  const results = [];
  for (const q of pending) {
    try {
      const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: q.category, body: q.text, updatedAt: q.updatedAt })
      });
      const data = await res.json();
      const newId = typeof data.id === "number" ? "server-" + data.id + "-" + Math.random().toString(36).slice(2) : "server-" + Math.random().toString(36).slice(2);
      const idx = quotes.findIndex(x => x.id === q.id);
      if (idx !== -1) {
        quotes[idx] = { ...q, id: newId, pending: false, updatedAt: now() };
        results.push(quotes[idx]);
      }
    } catch {}
  }
  if (results.length) saveQuotes();
  return results;
}

function mergeServerData(serverQuotes) {
  const byId = new Map(quotes.map(q => [q.id, q]));
  const merged = [...quotes];
  const localKey = q => (q.text.trim().toLowerCase() + "::" + q.category.trim().toLowerCase());
  const localDupeKeys = new Set(merged.map(localKey));
  const foundConflicts = [];
  serverQuotes.forEach(s => {
    if (byId.has(s.id)) {
      const local = byId.get(s.id);
      const diff = local.text !== s.text || local.category !== s.category || local.updatedAt !== s.updatedAt || local.pending !== s.pending;
      if (diff) {
        const idx = merged.findIndex(x => x.id === s.id);
        if (idx !== -1) {
          merged[idx] = s;
          foundConflicts.push({ id: s.id, local, server: s, resolution: "server" });
        }
      }
    } else {
      const key = localKey(s);
      if (!localDupeKeys.has(key)) {
        merged.push(s);
        localDupeKeys.add(key);
      }
    }
  });
  conflicts = foundConflicts;
  quotes = merged.map(normalizeQuote);
  saveQuotes();
  if (conflicts.length) {
    const btn = document.getElementById("resolveConflictsBtn");
    if (btn) btn.style.display = "inline-block";
  }
}

function openConflictResolver() {
  if (!conflicts.length) {
    alert("No conflicts to resolve.");
    return;
  }
  let keptLocal = 0;
  const total = conflicts.length;
  conflicts.forEach(c => {
    const keepLocal = confirm(`Conflict on ${c.id}\n\nLocal:\n"${c.local.text}" — ${c.local.category}\n\nServer:\n"${c.server.text}" — ${c.server.category}\n\nClick OK to keep LOCAL, Cancel to keep SERVER`);
    if (keepLocal) {
      const idx = quotes.findIndex(q => q.id === c.id);
      if (idx !== -1) quotes[idx] = { ...c.local, updatedAt: now(), pending: true };
      keptLocal++;
    } else {
      const idx = quotes.findIndex(q => q.id === c.id);
      if (idx !== -1) quotes[idx] = { ...c.server, pending: false };
    }
  });
  saveQuotes();
  populateCategories();
  filterQuote();
  const btn = document.getElementById("resolveConflictsBtn");
  if (btn) btn.style.display = "none";
  conflicts = [];
  alert(`Conflicts resolved. Kept local: ${keptLocal}, accepted server: ${total - keptLocal}`);
}

async function syncNow() {
  try {
    setStatus("Syncing…");
    await pushPendingToServer();
    const serverQuotes = await fetchServerQuotes();
    mergeServerData(serverQuotes);
    populateCategories();
    filterQuote();
    updateCategoryOptions();
    setStatus(conflicts.length ? `Synced with ${conflicts.length} conflict(s)` : "Synced");
  } catch {
    setStatus("Sync failed");
  }
}

function startSync(ms) {
  setInterval(syncNow, ms);
}

function clearLocal() {
  localStorage.removeItem(LS_QUOTES_KEY);
  localStorage.removeItem(LS_LAST_FILTER_KEY);
  alert("Local storage cleared. Reload the page.");
}

function resetToDefaults() {
  quotes = seedDefaults();
  saveQuotes();
  updateCategoryOptions();
  populateCategories();
  filterQuote();
  displayQuote(quotes[0]);
  alert("Defaults restored.");
}

function init() {
  const stored = loadQuotes();
  quotes = stored && stored.length ? stored : seedDefaults();
  saveQuotes();
  ensureSyncUI();
  updateCategoryOptions();
  populateCategories();
  filterQuote();
  try {
    const last = sessionStorage.getItem(SS_LAST_QUOTE_KEY);
    if (last) {
      const q = JSON.parse(last);
      if (isValidQuote(q)) displayQuote(q);
      else showRandomQuote();
    } else {
      showRandomQuote();
    }
  } catch {
    showRandomQuote();
  }
  createAddQuoteForm();
  quoteDisplay();
  if (newQuoteBtn) newQuoteBtn.addEventListener("click", () => {
    if (categorySelect) sessionStorage.setItem(SS_LAST_CATEGORY_KEY, categorySelect.value);
    showRandomQuote();
  });
  if (exportBtn) exportBtn.addEventListener("click", exportToJson);
  if (importBtn) importBtn.addEventListener("click", () => {
    if (importFileInput && importFileInput.files && importFileInput.files[0]) importFromJsonFile(importFileInput.files[0]);
    else alert("Choose a JSON file first.");
  });
  if (importFileInput) importFileInput.addEventListener("change", importFromJsonFile);
  if (clearLocalBtn) clearLocalBtn.addEventListener("click", clearLocal);
  if (resetDefaultsBtn) resetDefaultsBtn.addEventListener("click", resetToDefaults);
  if (categoryFilter) categoryFilter.addEventListener("change", filterQuote);
  syncNow();
  startSync(30000);
}

init();

