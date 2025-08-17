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

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

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
    { id: uid(), text: "Code is like humor. When you have to explain it, it's bad.", category: "Programming", updatedAt: now() - 8000, pending: false }
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
  if (quoteTextEl) quoteTextEl.textContent = `"${q.text}"`;
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

function quoteDisplay() {
  filterQuote();
}

function createAddQuoteForm() {
  if (!addQuoteBtn) return;
  addQuoteBtn.addEventListener("click", addQuote);
}

function addQuote() {
  const text = newQuoteTextInput ? newQuoteTextInput.value.trim() : "";
  const category = newQuoteCategoryInput ? newQuoteCategoryInput.value.trim() : "";
  if (!text || !category) {
    showNotification("Please enter both a quote and a category.", "error");
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
  showNotification("Quote added successfully! Will sync with server soon.", "success");
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
  showNotification("Quotes exported successfully!", "success");
}

function importFromJsonFile(fileOrEvent) {
  const file = fileOrEvent?.target?.files?.[0] || fileOrEvent;
  if (!file) {
    showNotification("Choose a JSON file first.", "error");
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
      showNotification(`Successfully imported ${added} quote(s)!`, "success");
      if (importFileInput) importFileInput.value = "";
    } catch {
      showNotification("Invalid JSON file format.", "error");
    }
  };
  r.readAsText(file);
}

function ensureSyncUI() {
  if (document.getElementById("syncBar")) return;
  
  const style = document.createElement('style');
  style.textContent = `
    .notification {
      position: fixed;
      bottom: 80px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      background: #333;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      transition: opacity 0.5s;
      max-width: 300px;
    }
    .notification.success { background: #4CAF50; }
    .notification.error { background: #F44336; }
    .notification.warning { background: #FF9800; }
    .notification.info { background: #2196F3; }
    .fade-out { opacity: 0; }
  `;
  document.head.appendChild(style);

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
    showNotification(`${conflicts.length} conflict(s) detected! Please resolve them.`, "warning");
  }
}

function createConflictDialog(conflict) {
  const dialog = document.createElement('div');
  dialog.className = 'conflict-dialog';
  dialog.innerHTML = `
    <div class="conflict-content">
      <h3>Conflict Resolution</h3>
      <p>ID: ${conflict.id}</p>
      <div class="conflict-option">
        <h4>Local Version</h4>
        <p>"${conflict.local.text}"</p>
        <small>— ${conflict.local.category}</small>
        <button class="keep-local">Keep Local</button>
      </div>
      <div class="conflict-option">
        <h4>Server Version</h4>
        <p>"${conflict.server.text}"</p>
        <small>— ${conflict.server.category}</small>
        <button class="keep-server">Keep Server</button>
      </div>
    </div>
  `;
  
  dialog.querySelector('.keep-local').addEventListener('click', () => {
    resolveConflict(conflict.id, 'local');
    dialog.remove();
  });
  
  dialog.querySelector('.keep-server').addEventListener('click', () => {
    resolveConflict(conflict.id, 'server');
    dialog.remove();
  });
  
  document.body.appendChild(dialog);
  return dialog;
}

function resolveConflict(id, resolution) {
  const conflict = conflicts.find(c => c.id === id);
  if (!conflict) return;

  const idx = quotes.findIndex(q => q.id === id);
  if (idx !== -1) {
    if (resolution === 'local') {
      quotes[idx] = { ...conflict.local, updatedAt: now(), pending: true };
    } else {
      quotes[idx] = { ...conflict.server, pending: false };
    }
    saveQuotes();
  }
}

function openConflictResolver() {
  if (!conflicts.length) {
    showNotification("No conflicts to resolve.", "info");
    return;
  }

  const conflict = conflicts[0];
  const dialog = createConflictDialog(conflict);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      dialog.remove();
      document.removeEventListener('keydown', handleKeyDown);
    }
  };

  document.addEventListener('keydown', handleKeyDown);
}

async function syncQuotes() {
  try {
    setStatus("Syncing...");
    const pushedQuotes = await pushPendingToServer();
    const serverQuotes = await fetchQuotesFromServer();
    mergeServerData(serverQuotes);
    populateCategories();
    filterQuote();
    updateCategoryOptions();
    
    if (conflicts.length) {
      setStatus(`Synced with ${conflicts.length} conflict(s)`);
      showNotification(`Quotes synced with server! ${conflicts.length} conflict(s) found.`, "warning");
      openConflictResolver();
    } else {
      setStatus("Synced successfully");
      showNotification("Quotes synced with server successfully!", "success");
    }
    
    return { 
      success: true, 
      pushedCount: pushedQuotes.length, 
      serverCount: serverQuotes.length, 
      conflicts: conflicts.length 
    };
  } catch (error) {
    setStatus("Sync failed");
    showNotification("Failed to sync with server. Please try again.", "error");
    return { success: false, error: error.message };
  }
}

async function syncNow() {
  return await syncQuotes();
}

function startSync(ms) {
  setInterval(syncQuotes, ms);
}

function clearLocal() {
  localStorage.removeItem(LS_QUOTES_KEY);
  localStorage.removeItem(LS_LAST_FILTER_KEY);
  showNotification("Local storage cleared. Reloading page...", "info");
  setTimeout(() => location.reload(), 1000);
}

function resetToDefaults() {
  quotes = seedDefaults();
  saveQuotes();
  updateCategoryOptions();
  populateCategories();
  filterQuote();
  displayQuote(quotes[0]);
  showNotification("Default quotes restored successfully!", "success");
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
    else showNotification("Choose a JSON file first.", "error");
  });
  if (importFileInput) importFileInput.addEventListener("change", importFromJsonFile);
  if (clearLocalBtn) clearLocalBtn.addEventListener("click", clearLocal);
  if (resetDefaultsBtn) resetDefaultsBtn.addEventListener("click", resetToDefaults);
  if (categoryFilter) categoryFilter.addEventListener("change", filterQuote);
  syncNow();
  startSync(30000);
}

init();