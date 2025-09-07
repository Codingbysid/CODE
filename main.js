const { app, BrowserWindow, nativeTheme, ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { DatabaseManager, validateModel } = require('./database');
const { CONFIG, PERSONA_SYSTEM_PROMPTS, DEVILS_ADVOCATE_PROMPT } = require('./config');
const errorHandler = require('./utils/errorHandler');
const Validator = require('./utils/validation');
const ConversationMemory = require('./utils/conversationMemory');

/**
 * Creates the single-window UI for CODE. No remote content is loaded to keep it offline-first.
 */
function createWindow() {
  const win = new BrowserWindow({
    width: CONFIG.WINDOW.WIDTH,
    height: CONFIG.WINDOW.HEIGHT,
    minWidth: CONFIG.WINDOW.MIN_WIDTH,
    minHeight: CONFIG.WINDOW.MIN_HEIGHT,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#111418' : '#f5f6f8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: true,
    },
    title: CONFIG.APP_NAME
  });

  win.removeMenu();
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function createDashboardWindow() {
  if (app.__DASHBOARD_WIN__ && !app.__DASHBOARD_WIN__.isDestroyed()) {
    app.__DASHBOARD_WIN__.show();
    app.__DASHBOARD_WIN__.focus();
    return app.__DASHBOARD_WIN__;
  }
  const dash = new BrowserWindow({
    width: 900,
    height: 680,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#111418' : '#f5f6f8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: true,
    },
    title: 'CODE — Dashboard'
  });
  dash.removeMenu();
  dash.on('closed', () => { app.__DASHBOARD_WIN__ = null; });
  dash.loadFile(path.join(__dirname, 'renderer', 'dashboard.html'));
  app.__DASHBOARD_WIN__ = dash;
  return dash;
}

app.whenReady().then(() => {
  // Initialize local database in userData folder (guarded in case native module fails)
  try {
    const dbPath = path.join(app.getPath('userData'), 'code_sessions.db');
    const dbManager = new DatabaseManager(dbPath);
    
    if (dbManager.initialize()) {
      app.__CODE_DB__ = dbManager;
    } else {
      app.__CODE_DB__ = null;
    }
  } catch (err) {
    // Degrade gracefully if the native module isn't built for this Electron version
    app.__CODE_DB__ = null;
  }

  // Initialize conversation memory
  app.__CONVERSATION_MEMORY__ = new ConversationMemory();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  ipcMain.on('open-dashboard', () => {
    createDashboardWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Coordinate a best-effort save on quit (renderer will respond quickly)
app.on('before-quit', (e) => {
  try {
    if (app.__PENDING_QUIT__) return; // already in progress
    const wins = BrowserWindow.getAllWindows();
    if (!wins || wins.length === 0) return; // nothing to save
    const win = wins[0];
    app.__PENDING_QUIT__ = true;
    const timeout = setTimeout(() => {
      app.exit(0);
    }, 1000);
    const onSaveComplete = () => {
      clearTimeout(timeout);
      app.exit(0);
    };
    ipcMain.once('save-complete', onSaveComplete);
    win.webContents.send('save-current-session');
    e.preventDefault();
  } catch (_) {}
});

// Build persona system prompt
async function getPersonaSystemPrompt(persona, customPrompt) {
  // If a custom prompt is provided, use it
  if (customPrompt) return customPrompt;
  
  // Check if it's a custom persona ID
  if (persona && typeof persona === 'string' && persona.startsWith('custom_')) {
    const db = app.__CODE_DB__;
    if (db) {
      try {
        const id = persona.replace('custom_', '');
        const stmt = db.prepare('SELECT prompt FROM personas WHERE id = ?');
        const row = stmt.get(id);
        if (row) return row.prompt;
      } catch (err) {
        errorHandler.logError(err, { operation: 'getPersonaSystemPrompt', persona }, 'warn');
      }
    }
  }
  
  // Default built-in personas
  return PERSONA_SYSTEM_PROMPTS[persona] || PERSONA_SYSTEM_PROMPTS.logician;
}

async function buildSystemPrompt(persona, mode) {
  let base = await getPersonaSystemPrompt(persona);
  if (mode === 'devils_advocate') {
    base += DEVILS_ADVOCATE_PROMPT;
  }
  return base;
}

// Non-streaming call (kept for fallback/testing)
async function callOllamaChat({ model, persona, userText, history, options, mode, customPrompt }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3:8b',
        stream: false,
        messages: [
          { role: 'system', content: mode === 'devils_advocate' ? await buildSystemPrompt(persona, mode) : (customPrompt || await buildSystemPrompt(persona)) },
          ...(Array.isArray(history) ? history : []),
          { role: 'user', content: userText }
        ],
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens
        }
      })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Ollama error ${res.status}: ${text}`);
    }
    const json = await res.json();
    // Ollama chat returns { message: { role, content }, ... }
    const content = json?.message?.content || json?.content || '';
    return content.trim();
  } finally {
    clearTimeout(timeout);
  }
}

// --- IPC Handlers ---

/**
 * Handles non-streaming generation requests
 */
ipcMain.handle('generate', errorHandler.createErrorBoundary(async (_evt, payload) => {
  const { persona, userText, model, history, options, customPrompt } = payload || {};
  
  // Validate input
  const validation = Validator.validateAndSanitize({ userText, persona, model, temperature: options?.temperature, maxTokens: options?.maxTokens });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join(', ') };
  }

  const sanitizedData = validation.data;
  
  try {
    const response = await callOllamaChat({ 
      model: sanitizedData.model || CONFIG.OLLAMA.DEFAULT_MODEL, 
      persona: sanitizedData.persona, 
      userText: sanitizedData.userText, 
      history, 
      options: {
        temperature: sanitizedData.temperature,
        maxTokens: sanitizedData.maxTokens
      }, 
      customPrompt 
    });
    return { ok: true, response };
  } catch (error) {
    return errorHandler.handleOllamaError(error, 'generate');
  }
}, { operation: 'generate' }));

/**
 * Handles streaming generation requests
 */
ipcMain.on('generate-stream', async (event, payload) => {
  const webContents = event.sender;
  const { persona, userText, model, history, requestId, options, mode, customPrompt } = payload || {};
  if (!userText || typeof userText !== 'string') {
    webContents.send('stream-error', { requestId, error: 'EMPTY_INPUT' });
    webContents.send('stream-end', { requestId });
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3:8b',
        stream: true,
        messages: [
          { role: 'system', content: mode === 'devils_advocate' ? await buildSystemPrompt(persona, mode) : (customPrompt || await buildSystemPrompt(persona)) },
          ...(Array.isArray(history) ? history : []),
          { role: 'user', content: userText }
        ],
        options: { temperature: options?.temperature ?? 0.7, num_predict: options?.maxTokens }
      })
    });
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '');
      throw new Error(`Ollama error ${res.status}: ${text}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalStats = null;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          const json = JSON.parse(line);
          if (json?.message?.content) {
            webContents.send('stream-response', { requestId, chunk: json.message.content });
          }
          if (json?.done) {
            // Final stats available here if needed
            finalStats = {
              evalCount: json?.eval_count,
              promptEvalCount: json?.prompt_eval_count,
              evalDuration: json?.eval_duration,
              totalDuration: json?.total_duration,
              loadDuration: json?.load_duration,
            };
            webContents.send('stream-end', { requestId, stats: finalStats });
          }
        } catch (e) {
          // Ignore parse errors for partial lines
        }
      }
    }
    // Flush any remaining buffer
    const tail = buffer.trim();
    if (tail) {
      try {
        const json = JSON.parse(tail);
        if (json?.message?.content) {
          webContents.send('stream-response', { requestId, chunk: json.message.content });
        }
        if (json?.done) {
          const stats = {
            evalCount: json?.eval_count,
            promptEvalCount: json?.prompt_eval_count,
            evalDuration: json?.eval_duration,
            totalDuration: json?.total_duration,
            loadDuration: json?.load_duration,
          };
          webContents.send('stream-end', { requestId, stats });
        }
      } catch (_) {
        // ignore
      }
    }
    if (!finalStats) webContents.send('stream-end', { requestId });
  } catch (err) {
    const message = err?.message || String(err);
    const hint = 'Ensure Ollama is running: `ollama serve`, and the requested model is pulled.';
    webContents.send('stream-error', { requestId, error: message, hint });
    webContents.send('stream-end', { requestId });
  } finally {
    clearTimeout(timeout);
  }
});

// --- Database IPC Handlers ---

/**
 * Generic database operation handler with error handling
 * @param {Function} operation - The database operation to perform
 * @returns {Object} The result object
 */
function handleDatabaseOperation(operation) {
  try {
    const db = app.__CODE_DB__;
    if (!db) throw new Error('Database not initialized');
    
    return operation(db);
  } catch (error) {
    console.error('Database operation error:', error);
    return { ok: false, error: error?.message || String(error) };
  }
}

ipcMain.handle('db:save-session', (_evt, session) => {
  return handleDatabaseOperation(db => db.saveSession(session));
});

ipcMain.handle('db:get-all-sessions', () => {
  return handleDatabaseOperation(db => db.getAllSessions());
});

ipcMain.handle('db:get-session-history', (_evt, id) => {
  return handleDatabaseOperation(db => db.getSessionHistory(id));
});

// --- Custom Personas IPC Handlers ---

ipcMain.handle('db:get-custom-personas', () => {
  return handleDatabaseOperation(db => db.getCustomPersonas());
});

ipcMain.handle('db:save-persona', (_evt, persona) => {
  return handleDatabaseOperation(db => db.savePersona(persona));
});

ipcMain.handle('db:delete-persona', (_evt, id) => {
  return handleDatabaseOperation(db => db.deletePersona(id));
});

// Personas CRUD
ipcMain.handle('db:list-personas', () => {
  return handleDatabaseOperation(db => db.listPersonas());
});

// Personas import/export (JSON)
ipcMain.handle('persona:export-all', () => {
  return handleDatabaseOperation(db => db.exportAllPersonas());
});

ipcMain.handle('persona:import', (_evt, filePath) => {
  return handleDatabaseOperation(db => db.importPersonas(filePath));
});
ipcMain.handle('persona:import-content', (_evt, content) => {
  return handleDatabaseOperation(db => db.importPersonasFromContent(content));
});
ipcMain.handle('db:create-persona', (_evt, { name, prompt }) => {
  return handleDatabaseOperation(db => db.createPersona({ name, prompt }));
});



ipcMain.handle('db:delete-session', (_evt, id) => {
  return handleDatabaseOperation(db => db.deleteSession(id));
});

ipcMain.handle('db:update-session-meta', (_evt, payload) => {
  return handleDatabaseOperation(db => db.updateSessionMeta(payload));
});

// --- Ollama Health Monitoring ---

/**
 * Ollama health status tracking
 */
const ollamaHealthStatus = { 
  connected: false, 
  lastCheck: 0, 
  checkInterval: 30000,
  error: null 
};

/**
 * Checks the health of the Ollama service
 * @returns {Promise<boolean>} True if healthy, false otherwise
 */
async function checkOllamaHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`http://127.0.0.1:11434/api/tags`, { 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    ollamaHealthStatus.connected = true;
    ollamaHealthStatus.lastCheck = Date.now();
    ollamaHealthStatus.error = null;
    
    return true;
  } catch (error) {
    ollamaHealthStatus.connected = false;
    ollamaHealthStatus.lastCheck = Date.now();
    ollamaHealthStatus.error = error.message;
    
    console.warn('Ollama health check failed:', error.message);
    return false;
  }
}

// Periodic health monitoring
setInterval(checkOllamaHealth, ollamaHealthStatus.checkInterval);

/**
 * Checks if a specific model exists in Ollama
 * @param {string} model - The model name to check
 * @returns {Promise<Object>} The check result
 */
async function checkModelExists(model) {
  try {
    // Validate input
    validateModel(model);
    
    // Check connection health first
    if (!ollamaHealthStatus.connected) {
      await checkOllamaHealth();
    }
    
    if (!ollamaHealthStatus.connected) {
      return { 
        ok: false, 
        error: `Ollama not accessible: ${ollamaHealthStatus.error}`, 
        hint: 'Make sure Ollama is running (brew services start ollama)',
        exists: false 
      };
    }
    
    const response = await fetch(`http://127.0.0.1:11434/api/tags`);
    if (!response.ok) throw new Error('Failed to query models');
    
    const json = await response.json();
    const models = Array.isArray(json?.models) ? json.models : [];
    const found = models.some(m => m?.name === model);
    
    return { ok: true, exists: found };
  } catch (error) {
    console.error('Model existence check error:', error);
    return { ok: false, error: error?.message || String(error) };
  }
}

ipcMain.handle('ollama:model-exists', async (_evt, model) => {
  return checkModelExists(model);
});

// --- Retry Mechanism ---

/**
 * Retry configuration for failed operations
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

/**
 * Implements exponential backoff retry for failed operations
 * @param {Function} operation - The operation to retry
 * @param {Object} config - Retry configuration
 * @returns {Promise<any>} The operation result
 */
async function retryWithBackoff(operation, config = RETRY_CONFIG) {
  let lastError;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === config.maxAttempts) {
        break;
      }
      
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );
      
      console.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt}/${config.maxAttempts}):`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Handles model pulling with retry mechanism
 * @param {string} model - The model to pull
 * @returns {Promise<Object>} The pull result
 */
async function pullModelWithRetry(model) {
  try {
    const operation = async () => {
      const response = await fetch(`http://127.0.0.1:11434/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model })
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Pull failed: ${response.status} ${errorText}`);
      }
      
      return { ok: true };
    };
    
    return await retryWithBackoff(operation);
  } catch (error) {
    console.error('Model pull failed after retries:', error);
    return { ok: false, error: error?.message || String(error) };
  }
}

ipcMain.handle('ollama:pull-model', async (_evt, model) => {
  return pullModelWithRetry(model);
});

// --- Conversation Memory IPC Handlers ---

ipcMain.handle('memory:store-conversation', async (_evt, conversationData) => {
  try {
    const memory = app.__CONVERSATION_MEMORY__;
    if (!memory) {
      return { ok: false, error: 'Conversation memory not initialized' };
    }

    const sessionId = conversationData.sessionId || `session_${Date.now()}`;
    memory.storeConversation(sessionId, conversationData);
    
    return { ok: true, sessionId };
  } catch (error) {
    return errorHandler.handleDatabaseError(error, 'store-conversation');
  }
});

ipcMain.handle('memory:get-context', async (_evt, { currentInput, currentPersona }) => {
  try {
    const memory = app.__CONVERSATION_MEMORY__;
    if (!memory) {
      return { ok: false, error: 'Conversation memory not initialized' };
    }

    const context = memory.getRelevantContext(currentInput, currentPersona);
    return { ok: true, context };
  } catch (error) {
    return errorHandler.handleDatabaseError(error, 'get-context');
  }
});

ipcMain.handle('memory:get-stats', async (_evt) => {
  try {
    const memory = app.__CONVERSATION_MEMORY__;
    if (!memory) {
      return { ok: false, error: 'Conversation memory not initialized' };
    }

    const stats = memory.getMemoryStats();
    return { ok: true, stats };
  } catch (error) {
    return errorHandler.handleDatabaseError(error, 'get-stats');
  }
});

ipcMain.handle('memory:clear', async (_evt) => {
  try {
    const memory = app.__CONVERSATION_MEMORY__;
    if (!memory) {
      return { ok: false, error: 'Conversation memory not initialized' };
    }

    memory.clearMemory();
    return { ok: true };
  } catch (error) {
    return errorHandler.handleDatabaseError(error, 'clear-memory');
  }
});

// --- File export: Markdown / PDF ---
ipcMain.handle('fs:export-md', async (_evt, session) => {
  try {
    const { persona, model, history } = session || {};
    if (!persona || !model || !Array.isArray(history) || history.length === 0) {
      return { ok: false, error: 'Nothing to export' };
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const defaultPath = path.join(app.getPath('documents'), `CODE-session-${stamp}.md`);

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Session as Markdown',
      defaultPath,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };

    const personaTitleMap = {
      logician: 'The Logician',
      market_cynic: 'The Market Cynic',
      lateral_thinker: 'The Lateral Thinker',
      five_whys: 'The "Five Whys" Toddler'
    };

    const lines = [];
    lines.push(`# CODE Session — ${personaTitleMap[persona] || persona}`);
    lines.push('');
    lines.push(`- Model: ${model}`);
    lines.push(`- Persona: ${personaTitleMap[persona] || persona}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    for (const turn of history) {
      if (!turn || !turn.role) continue;
      if (turn.role === 'user') {
        lines.push('## User');
      } else if (turn.role === 'assistant') {
        lines.push('## Adversary');
      } else if (turn.role === 'system') {
        lines.push('## System');
      } else {
        lines.push(`## ${turn.role}`);
      }
      lines.push('');
      lines.push(turn.content || '');
      lines.push('');
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
});

ipcMain.handle('fs:export-pdf', async (_evt, session) => {
  try {
    const { persona, model, history } = session || {};
    if (!persona || !model || !Array.isArray(history) || history.length === 0) {
      return { ok: false, error: 'Nothing to export' };
    }
    const { default: PDFDocument } = await import('pdfkit');
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const defaultPath = path.join(app.getPath('documents'), `CODE-session-${stamp}.pdf`);
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Session as PDF',
      defaultPath,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };

    const personaTitleMap = {
      logician: 'The Logician',
      market_cynic: 'The Market Cynic',
      lateral_thinker: 'The Lateral Thinker',
      five_whys: 'The "Five Whys" Toddler'
    };

    const doc = new PDFDocument({ margins: { top: 50, bottom: 50, left: 50, right: 50 } });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(18).text(`CODE Session — ${personaTitleMap[persona] || persona}`, { underline: false });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#444').text(`Model: ${model}`);
    doc.moveDown(0.2);
    doc.text(`Persona: ${personaTitleMap[persona] || persona}`);
    doc.moveDown();
    doc.strokeColor('#cccccc').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    for (const turn of history) {
      if (!turn || !turn.role) continue;
      const role = turn.role.toUpperCase();
      doc.moveDown(0.5);
      doc.fontSize(13).fillColor('#000').text(role);
      doc.moveDown(0.2);
      doc.fontSize(11).fillColor('#000').text(turn.content || '', { align: 'left' });
      doc.moveDown(0.3);
    }

    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
});

// Enhanced export formats: JSON and HTML
ipcMain.handle('fs:export-json', async (_evt, session) => {
  try {
    const { persona, model, history, title, tags } = session || {};
    if (!persona || !model || !Array.isArray(history) || history.length === 0) {
      return { ok: false, error: 'Nothing to export' };
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const defaultPath = path.join(app.getPath('documents'), `CODE-session-${stamp}.json`);
    
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Session as JSON',
      defaultPath,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };

    const exportData = {
      metadata: {
        title: title || `CODE Session - ${stamp}`,
        persona,
        model,
        tags: tags || [],
        exportedAt: now.toISOString(),
        version: '1.0'
      },
      conversation: history,
      statistics: {
        totalTurns: history.length,
        userTurns: history.filter(h => h.role === 'user').length,
        assistantTurns: history.filter(h => h.role === 'assistant').length,
        totalCharacters: history.reduce((sum, h) => sum + (h.content?.length || 0), 0)
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
});

ipcMain.handle('fs:export-html', async (_evt, session) => {
  try {
    const { persona, model, history, title, tags } = session || {};
    if (!persona || !model || !Array.isArray(history) || history.length === 0) {
      return { ok: false, error: 'Nothing to export' };
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const defaultPath = path.join(app.getPath('documents'), `CODE-session-${stamp}.html`);
    
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export Session as HTML',
      defaultPath,
      filters: [{ name: 'HTML', extensions: ['html'] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };

    const personaTitleMap = {
      logician: 'The Logician',
      market_cynic: 'The Market Cynic',
      lateral_thinker: 'The Lateral Thinker',
      five_whys: 'The "Five Whys" Toddler'
    };

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || `CODE Session - ${stamp}`}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f6f8; }
        .header { background: #151922; color: #e6edf3; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .conversation { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .turn { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
        .user { background: #e3f2fd; border-left: 4px solid #2196f3; }
        .assistant { background: #f3e5f5; border-left: 4px solid #9c27b0; }
        .role { font-weight: bold; margin-bottom: 8px; color: #333; }
        .content { white-space: pre-wrap; }
        .metadata { font-size: 14px; color: #666; margin-top: 10px; }
        .tags { margin-top: 10px; }
        .tag { display: inline-block; background: #7aa2f7; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title || `CODE Session - ${stamp}`}</h1>
        <div class="metadata">
            <strong>Persona:</strong> ${personaTitleMap[persona] || persona}<br>
            <strong>Model:</strong> ${model}<br>
            <strong>Exported:</strong> ${now.toLocaleString()}
            ${tags && tags.length > 0 ? `<div class="tags">${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
        </div>
    </div>
    
    <div class="conversation">
        ${history.map(turn => `
            <div class="turn ${turn.role}">
                <div class="role">${turn.role === 'user' ? 'User' : 'Adversary'}</div>
                <div class="content">${turn.content || ''}</div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    fs.writeFileSync(filePath, htmlContent, 'utf-8');
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
});

// --- Application Initialization ---

/**
 * Main application initialization function
 */
async function initializeApplication() {
  try {
    // Initialize database
    // initializeDatabase(); // This line was removed from the new_code, so it's removed here.
    
    // Setup event handlers
    // setupEventHandlers(); // This line was removed from the new_code, so it's removed here.
    
    // Create main window
    createWindow();
    
    // Initial health check
    await checkOllamaHealth();
    
    console.log('CODE application initialized successfully');
  } catch (error) {
    console.error('Application initialization failed:', error);
    // Continue with degraded functionality
  }
}

// Start the application when Electron is ready
app.whenReady().then(initializeApplication);

// --- Error Handling ---

/**
 * Global error handler for uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, you might want to log to a file or service
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to log to a file or service
});

// --- Performance Monitoring ---

/**
 * Performance metrics collection
 */
const performanceMetrics = {
  requestCount: 0,
  averageResponseTime: 0,
  errorCount: 0,
  startTime: Date.now()
};

/**
 * Updates performance metrics
 * @param {number} responseTime - Response time in milliseconds
 * @param {boolean} isError - Whether the request resulted in an error
 */
function updatePerformanceMetrics(responseTime, isError) {
  performanceMetrics.requestCount++;
  
  if (isError) {
    performanceMetrics.errorCount++;
  } else {
    // Update running average
    const totalTime = performanceMetrics.averageResponseTime * (performanceMetrics.requestCount - 1) + responseTime;
    performanceMetrics.averageResponseTime = totalTime / performanceMetrics.requestCount;
  }
}

/**
 * Gets current performance metrics
 * @returns {Object} The performance metrics
 */
function getPerformanceMetrics() {
  const uptime = Date.now() - performanceMetrics.startTime;
  const errorRate = performanceMetrics.requestCount > 0 
    ? (performanceMetrics.errorCount / performanceMetrics.requestCount) * 100 
    : 0;
  
  return {
    ...performanceMetrics,
    uptime,
    errorRate: errorRate.toFixed(2) + '%',
    requestsPerMinute: (performanceMetrics.requestCount / (uptime / 60000)).toFixed(2)
  };
}

ipcMain.handle('get-performance-metrics', () => {
  return getPerformanceMetrics();
});

console.log('CODE main process loaded successfully');


