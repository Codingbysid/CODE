const sessionsEl = document.getElementById('sessions');
const historyEl = document.getElementById('history');
const sessionSearch = document.getElementById('sessionSearch');
const forkBtn = document.getElementById('forkBtn');
const titleInput = document.getElementById('titleInput');
const tagsInput = document.getElementById('tagsInput');
const updateMetaBtn = document.getElementById('updateMetaBtn');
const exportBtn = document.getElementById('exportBtn');
const deleteBtn = document.getElementById('deleteBtn');

let selected = null; // { id, persona, model, title, tags }
let lastSessions = [];

async function loadSessions() {
  sessionsEl.innerHTML = '';
  historyEl.textContent = '';
  try {
    const res = await window.CODE['db:get-all-sessions']();
    if (!res?.ok) {
      sessionsEl.innerHTML = `<div class="muted">Error loading sessions: ${res?.error || 'unknown'}</div>`;
      return;
    }
    if (!res.sessions || res.sessions.length === 0) {
      sessionsEl.innerHTML = '<div class="muted">No saved sessions yet.</div>';
      return;
    }
    lastSessions = res.sessions || [];
    renderSessions(lastSessions);
  } catch (err) {
    sessionsEl.innerHTML = `<div class="muted">Unexpected error: ${err?.message || String(err)}</div>`;
  }
}

// Virtual scrolling implementation for large session lists
class VirtualScroller {
  constructor(container, itemHeight = 60, buffer = 5) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.buffer = buffer;
    this.items = [];
    this.scrollTop = 0;
    this.containerHeight = 0;
    this.visibleItems = [];
    this.setupContainer();
  }

  setupContainer() {
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';
    this.container.addEventListener('scroll', () => this.handleScroll());
  }

  setItems(items) {
    this.items = items;
    this.container.style.height = `${this.items.length * this.itemHeight}px`;
    this.render();
  }

  handleScroll() {
    this.scrollTop = this.container.scrollTop;
    this.render();
  }

  render() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + Math.ceil(this.container.clientHeight / this.itemHeight) + this.buffer, this.items.length);
    
    // Clear container
    this.container.innerHTML = '';
    
    // Add spacer for items above
    if (startIndex > 0) {
      const spacer = document.createElement('div');
      spacer.style.height = `${startIndex * this.itemHeight}px`;
      this.container.appendChild(spacer);
    }
    
    // Render visible items
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.items[i];
      const itemEl = this.renderItem(item, i);
      itemEl.style.position = 'absolute';
      itemEl.style.top = `${i * this.itemHeight}px`;
      itemEl.style.width = '100%';
      this.container.appendChild(itemEl);
    }
    
    // Add spacer for items below
    if (endIndex < this.items.length) {
      const spacer = document.createElement('div');
      spacer.style.height = `${(this.items.length - endIndex) * this.itemHeight}px`;
      this.container.appendChild(spacer);
    }
  }

  renderItem(item, index) {
    const div = document.createElement('div');
    div.className = 'session';
    div.dataset.index = index;
    
    const title = item.title ? ` — ${item.title}` : '';
    let tagsStr = '';
    if (item.tags) {
      if (Array.isArray(item.tags)) tagsStr = item.tags.join(', ');
      else if (typeof item.tags === 'string') {
        try {
          const parsed = JSON.parse(item.tags);
          tagsStr = Array.isArray(parsed) ? parsed.join(', ') : item.tags;
        } catch (_) {
          tagsStr = item.tags;
        }
      }
    }
    const tags = tagsStr ? ` — <span class="muted">${tagsStr}</span>` : '';
    
    div.innerHTML = `<div><strong>#${item.id}</strong>${title} — ${item.persona} — ${item.model}${tags}</div><div class="muted">${item.created_at}</div>`;
    
          div.addEventListener('click', async () => {
        document.querySelectorAll('.session.selected').forEach((el) => el.classList.remove('selected'));
        div.classList.add('selected');
        const hr = await window.CODE['db:get-session-history'](item.id);
        if (hr?.ok) {
          const text = hr.history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
          historyEl.textContent = text;
          selected = { id: item.id, persona: item.persona, model: item.model, title: item.title || '', tags: item.tags || '' };
          titleInput.value = selected.title || '';
          tagsInput.value = Array.isArray(selected.tags) ? selected.tags.join(', ') : (selected.tags || '');
          
          // Show session analytics
          const analysis = analyzeSession({ ...selected, history: hr.history });
          showSessionAnalytics(analysis);
        } else {
          historyEl.textContent = `Error loading history: ${hr?.error || 'unknown'}`;
        }
      });
    
    return div;
  }
}

let virtualScroller;

function renderSessions(sessions) {
  if (!sessions || sessions.length === 0) {
    sessionsEl.innerHTML = '<div class="muted">No saved sessions yet.</div>';
    return;
  }
  
  // Initialize virtual scroller for large lists
  if (sessions.length > 50 && !virtualScroller) {
    virtualScroller = new VirtualScroller(sessionsEl, 60, 3);
    virtualScroller.setItems(sessions);
  } else if (sessions.length <= 50) {
    // Fallback to regular rendering for small lists
    sessionsEl.innerHTML = '';
    sessions.forEach((s) => {
      const div = document.createElement('div');
      div.className = 'session';
      const title = s.title ? ` — ${s.title}` : '';
      let tagsStr = '';
      if (s.tags) {
        if (Array.isArray(s.tags)) tagsStr = s.tags.join(', ');
        else if (typeof s.tags === 'string') {
          try {
            const parsed = JSON.parse(s.tags);
            tagsStr = Array.isArray(parsed) ? parsed.join(', ') : s.tags;
          } catch (_) {
            tagsStr = s.tags;
          }
        }
      }
      const tags = tagsStr ? ` — <span class="muted">${tagsStr}</span>` : '';
      div.innerHTML = `<div><strong>#${s.id}</strong>${title} — ${s.persona} — ${s.model}${tags}</div><div class="muted">${s.created_at}</div>`;
      div.addEventListener('click', async () => {
        document.querySelectorAll('.session.selected').forEach((el) => el.classList.remove('selected'));
        div.classList.add('selected');
        const hr = await window.CODE['db:get-session-history'](s.id);
        if (hr?.ok) {
          const text = hr.history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
          historyEl.textContent = text;
          selected = { id: s.id, persona: s.persona, model: s.model, title: s.title || '', tags: s.tags || '' };
          titleInput.value = selected.title || '';
          tagsInput.value = Array.isArray(selected.tags) ? selected.tags.join(', ') : (selected.tags || '');
        } else {
          historyEl.textContent = `Error loading history: ${hr?.error || 'unknown'}`;
        }
      });
      sessionsEl.appendChild(div);
    });
  }
}

loadSessions();

// Session analytics and insights
function analyzeSession(session) {
  const history = session.history || [];
  const userMessages = history.filter(m => m.role === 'user');
  const assistantMessages = history.filter(m => m.role === 'assistant');
  
  const analysis = {
    totalTurns: history.length,
    userTurns: userMessages.length,
    assistantTurns: assistantMessages.length,
    avgUserLength: userMessages.length > 0 ? 
      Math.round(userMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / userMessages.length) : 0,
    avgAssistantLength: assistantMessages.length > 0 ? 
      Math.round(assistantMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / assistantMessages.length) : 0,
    totalTokens: history.reduce((sum, m) => sum + (m.content?.length || 0), 0),
    sessionDuration: session.created_at ? 
      Math.round((Date.now() - new Date(session.created_at).getTime()) / (1000 * 60)) : 0 // minutes
  };
  
  return analysis;
}

function showSessionAnalytics(analysis) {
  // Create analytics display if it doesn't exist
  let analyticsEl = document.getElementById('sessionAnalytics');
  if (!analyticsEl) {
    analyticsEl = document.createElement('div');
    analyticsEl.id = 'sessionAnalytics';
    analyticsEl.style.cssText = `
      margin-top: 12px;
      padding: 12px;
      background: rgba(148, 226, 213, 0.1);
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 12px;
    `;
    
    // Insert after the history element
    const historyContainer = historyEl.parentNode;
    historyContainer.insertBefore(analyticsEl, historyEl.nextSibling);
  }
  
  analyticsEl.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
      <div><strong>Turns:</strong> ${analysis.totalTurns}</div>
      <div><strong>User:</strong> ${analysis.userTurns}</div>
      <div><strong>AI:</strong> ${analysis.assistantTurns}</div>
      <div><strong>Avg User:</strong> ${analysis.avgUserLength} chars</div>
      <div><strong>Avg AI:</strong> ${analysis.avgAssistantLength} chars</div>
      <div><strong>Total:</strong> ${analysis.totalTokens} chars</div>
      <div><strong>Duration:</strong> ${analysis.sessionDuration} min</div>
    </div>
  `;
}

// Debounced search implementation for better performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedSearch = debounce((query) => {
  if (!query) { 
    renderSessions(lastSessions); 
    return; 
  }
  const filtered = lastSessions.filter((s) => {
    const title = (s.title || '').toLowerCase();
    const tags = typeof s.tags === 'string' ? s.tags.toLowerCase() : Array.isArray(s.tags) ? s.tags.join(',').toLowerCase() : '';
    return title.includes(query) || tags.includes(query);
  });
  renderSessions(filtered);
}, 300);

sessionSearch?.addEventListener('input', () => {
  const q = (sessionSearch.value || '').toLowerCase();
  debouncedSearch(q);
});

forkBtn?.addEventListener('click', async () => {
  try {
    if (!selected) return;
    const hr = await window.CODE['db:getSessionHistory'](selected.id);
    if (!hr?.ok) return;
    // Save a new session with same persona/model/history
            await window.CODE['db:save-session']({ persona: selected.persona, model: selected.model, history: hr.history, title: (selected.title ? selected.title + ' (fork)' : 'Fork'), tags: selected.tags });
    await loadSessions();
  } catch (_) {}
});

updateMetaBtn?.addEventListener('click', async () => {
  try {
    if (!selected) return;
    const tags = (tagsInput.value || '').split(',').map((s) => s.trim()).filter(Boolean);
            await window.CODE['db:update-session-meta']({ id: selected.id, title: titleInput.value || null, tags });
    updateMetaBtn.textContent = 'Saved';
    setTimeout(() => (updateMetaBtn.textContent = 'Save Meta'), 900);
    loadSessions();
  } catch (_) {}
});

exportBtn?.addEventListener('click', async () => {
  try {
    if (!selected) return;
    const hr = await window.CODE['db:get-session-history'](selected.id);
    if (hr?.ok) {
      await window.CODE['fs:export-md']({ persona: selected.persona, model: selected.model, history: hr.history });
    }
  } catch (_) {}
});

deleteBtn?.addEventListener('click', async () => {
  try {
    if (!selected) return;
    const ok = confirm('Delete this session? This cannot be undone.');
    if (!ok) return;
          await window.CODE['db:delete-session'](selected.id);
    selected = null;
    historyEl.textContent = '';
    titleInput.value = '';
    tagsInput.value = '';
    loadSessions();
  } catch (_) {}
});


