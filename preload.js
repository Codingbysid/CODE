const { contextBridge, ipcRenderer, clipboard } = require('electron');

// Expose a minimal, secure API to the renderer.
contextBridge.exposeInMainWorld('CODE', {
  copyToClipboard: (text) => clipboard.writeText(text || ''),
  generate: (persona, userText, model, history, options, mode) => ipcRenderer.invoke('generate', { persona, userText, model, history, options, mode }),
  generateStream: (payload) => ipcRenderer.send('generate-stream', payload),
  onStreamChunk: (handler) => {
    const listener = (_evt, data) => handler(data);
    ipcRenderer.on('stream-response', listener);
    return () => ipcRenderer.removeListener('stream-response', listener);
  },
  onStreamEnd: (handler) => {
    const listener = (_evt, data) => handler(data);
    ipcRenderer.on('stream-end', listener);
    return () => ipcRenderer.removeListener('stream-end', listener);
  },
  onStreamError: (handler) => {
    const listener = (_evt, data) => handler(data);
    ipcRenderer.on('stream-error', listener);
    return () => ipcRenderer.removeListener('stream-error', listener);
  },
  // Database methods (sessions)
  'db:save-session': (session) => ipcRenderer.invoke('db:save-session', session),
  'db:get-all-sessions': () => ipcRenderer.invoke('db:get-all-sessions'),
  'db:get-session-history': (id) => ipcRenderer.invoke('db:get-session-history', id),
  'db:delete-session': (id) => ipcRenderer.invoke('db:delete-session', id),
  'db:update-session-meta': (payload) => ipcRenderer.invoke('db:update-session-meta', payload),
  // Custom Personas methods (consistent with main process)
  'db:list-personas': () => ipcRenderer.invoke('db:list-personas'),
  'db:create-persona': (persona) => ipcRenderer.invoke('db:create-persona', persona),
  'db:delete-persona': (id) => ipcRenderer.invoke('db:delete-persona', id),
  // Personas import/export
  'persona:export-all': () => ipcRenderer.invoke('persona:export-all'),
  'persona:import': (filePath) => ipcRenderer.invoke('persona:import', filePath),
  // File system export
  'fs:export-md': (session) => ipcRenderer.invoke('fs:export-md', session),
  'fs:export-pdf': (session) => ipcRenderer.invoke('fs:export-pdf', session),
  // Ollama
  'ollama:model-exists': (model) => ipcRenderer.invoke('ollama:model-exists', model),
  'ollama:pull-model': (model) => ipcRenderer.invoke('ollama:pull-model', model),
  // App lifecycle save coordination
  onSaveRequest: (handler) => {
    const listener = () => handler();
    ipcRenderer.on('save-current-session', listener);
    return () => ipcRenderer.removeListener('save-current-session', listener);
  },
  notifySaveComplete: () => ipcRenderer.send('save-complete'),
  openDashboard: () => ipcRenderer.send('open-dashboard'),
});


