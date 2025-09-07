const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Input validation utilities
function validateSession(session) {
  if (!session || typeof session !== 'object') {
    throw new Error('Session must be an object');
  }
  
  const { persona, model, history, title, tags } = session;
  
  if (!persona || typeof persona !== 'string' || persona.trim().length === 0) {
    throw new Error('Persona must be a non-empty string');
  }
  
  if (!model || typeof model !== 'string' || model.trim().length === 0) {
    throw new Error('Model must be a non-empty string');
  }
  
  if (!Array.isArray(history) || history.length === 0) {
    throw new Error('History must be a non-empty array');
  }
  
  // Validate history items
  for (const [index, item] of history.entries()) {
    if (!item || typeof item !== 'object') {
      throw new Error(`History item ${index} must be an object`);
    }
    if (!item.role || !['user', 'assistant', 'system'].includes(item.role)) {
      throw new Error(`History item ${index} must have valid role (user/assistant/system)`);
    }
    if (!item.content || typeof item.content !== 'string') {
      throw new Error(`History item ${index} must have content string`);
    }
  }
  
  // Optional fields
  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    throw new Error('Title must be undefined or a non-empty string');
  }
  
  if (tags !== undefined) {
    if (Array.isArray(tags)) {
      for (const [index, tag] of tags.entries()) {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          throw new Error(`Tag ${index} must be a non-empty string`);
        }
      }
    } else if (typeof tags !== 'string' || tags.trim().length === 0) {
      throw new Error('Tags must be undefined, a non-empty string, or an array of non-empty strings');
    }
  }
  
  return true;
}

function validatePersona(persona) {
  if (!persona || typeof persona !== 'object') {
    throw new Error('Persona must be an object');
  }
  
  const { name, prompt } = persona;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Persona name must be a non-empty string');
  }
  
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Persona prompt must be a non-empty string');
  }
  
  // Sanitize inputs
  if (name.length > 100) {
    throw new Error('Persona name must be 100 characters or less');
  }
  
  if (prompt.length > 10000) {
    throw new Error('Persona prompt must be 10,000 characters or less');
  }
  
  return true;
}

function validateId(id) {
  if (!id || typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    throw new Error('ID must be a positive integer');
  }
  return true;
}

function validateModel(model) {
  if (!model || typeof model !== 'string' || model.trim().length === 0) {
    throw new Error('Model must be a non-empty string');
  }
  
  if (model.length > 200) {
    throw new Error('Model name must be 200 characters or less');
  }
  
  return true;
}

class DatabaseManager {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.initialized = false;
  }

  initialize() {
    try {
      this.db = new Database(this.dbPath);
      
      // Create tables with proper schema
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          persona TEXT NOT NULL,
          model TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          history TEXT NOT NULL,
          title TEXT,
          tags TEXT
        );
        
        CREATE TABLE IF NOT EXISTS personas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          prompt TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Migrations: add title, tags columns if they don't exist
      try {
        const columns = this.db.prepare("PRAGMA table_info('sessions')").all();
        const columnNames = new Set(columns.map((c) => c.name));
        if (!columnNames.has('title')) {
          this.db.exec("ALTER TABLE sessions ADD COLUMN title TEXT");
        }
        if (!columnNames.has('tags')) {
          this.db.exec("ALTER TABLE sessions ADD COLUMN tags TEXT");
        }
      } catch (_) {
        // ignore migration errors
      }
      
      this.initialized = true;
      return true;
    } catch (err) {
      console.error('Failed to initialize database:', err);
      this.initialized = false;
      return false;
    }
  }

  // Session operations
  saveSession(session) {
    if (!this.initialized) throw new Error('Database not initialized');
    
    validateSession(session);
    const { persona, model, history, title, tags } = session;
    
    const stmt = this.db.prepare('INSERT INTO sessions (persona, model, history, title, tags) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(persona, model, JSON.stringify(history), title || null, Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : null));
    return { ok: true, id: info.lastInsertRowid };
  }

  getAllSessions() {
    if (!this.initialized) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT id, persona, model, title, tags, created_at, SUBSTR(history, 1, 100) AS preview FROM sessions ORDER BY created_at DESC');
    const sessions = stmt.all();
    return { ok: true, sessions };
  }

  getSessionHistory(id) {
    if (!this.initialized) throw new Error('Database not initialized');
    
    validateId(id);
    const stmt = this.db.prepare('SELECT history FROM sessions WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return { ok: false, error: 'Session not found' };
    return { ok: true, history: JSON.parse(row.history) };
  }

  deleteSession(id) {
    if (!this.initialized) throw new Error('Database not initialized');
    
    validateId(id);
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    const info = stmt.run(id);
    return { ok: true, changes: info.changes };
  }

  updateSessionMeta(payload) {
    if (!this.initialized) throw new Error('Database not initialized');
    
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload must be an object');
    }
    
    const { id, title, tags } = payload;
    validateId(id);
    
    // Validate optional fields
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      throw new Error('Title must be undefined or a non-empty string');
    }
    
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        for (const [index, tag] of tags.entries()) {
          if (typeof tag !== 'string' || tag.trim().length === 0) {
            throw new Error(`Tag ${index} must be a non-empty string`);
          }
        }
      } else if (typeof tags !== 'string' || tags.trim().length === 0) {
        throw new Error('Tags must be undefined, a non-empty string, or an array of non-empty strings');
      }
    }
    
    const stmt = this.db.prepare('UPDATE sessions SET title = ?, tags = ? WHERE id = ?');
    const info = stmt.run(title || null, Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : null), id);
    return { ok: true, changes: info.changes };
  }

  // Persona operations
  savePersona(persona) {
    if (!this.initialized) throw new Error('Database not initialized');
    
    validatePersona(persona);
    const { name, prompt } = persona;
    
    const stmt = this.db.prepare('INSERT OR REPLACE INTO personas (name, prompt) VALUES (?, ?)');
    const info = stmt.run(name.trim(), prompt.trim());
    return { ok: true, id: info.lastInsertRowid };
  }

  getCustomPersonas() {
    if (!this.initialized) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT id, name, prompt, created_at FROM personas ORDER BY created_at DESC');
    const personas = stmt.all();
    return { ok: true, personas };
  }

  deletePersona(id) {
    if (!this.initialized) throw new Error('Database not initialized');
    
    validateId(id);
    const stmt = this.db.prepare('DELETE FROM personas WHERE id = ?');
    const info = stmt.run(id);
    return { ok: true, deleted: info.changes > 0 };
  }

  listPersonas() {
    if (!this.initialized) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT id, name, prompt, created_at FROM personas ORDER BY created_at DESC');
    const personas = stmt.all();
    return { ok: true, personas };
  }

  createPersona(persona) {
    if (!this.initialized) throw new Error('Database not initialized');
    
    validatePersona(persona);
    const { name, prompt } = persona;
    
    const stmt = this.db.prepare('INSERT INTO personas (name, prompt) VALUES (?, ?)');
    const info = stmt.run(name, prompt);
    return { ok: true, id: info.lastInsertRowid };
  }

  // Import/Export operations
  exportAllPersonas() {
    if (!this.initialized) throw new Error('Database not initialized');
    
    const rows = this.db.prepare('SELECT id, name, prompt, created_at FROM personas').all();
    return { ok: true, personas: rows };
  }

  importPersonas(filePath) {
    if (!this.initialized) throw new Error('Database not initialized');
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const arr = JSON.parse(content);
    if (!Array.isArray(arr)) throw new Error('Invalid JSON');
    
    const insert = this.db.prepare('INSERT OR IGNORE INTO personas (name, prompt) VALUES (?, ?)');
    const txn = this.db.transaction((items) => {
      for (const it of items) {
        if (it?.name && it?.prompt) insert.run(it.name, it.prompt);
      }
    });
    txn(arr);
    return { ok: true, count: arr.length };
  }

  // Utility methods
  isInitialized() {
    return this.initialized;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

module.exports = { DatabaseManager, validateSession, validatePersona, validateId, validateModel };
