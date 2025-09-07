const state = {
  selectedPersona: 'logician',
  isGenerating: false,
  history: [], // array of { role: 'user'|'assistant', content: string }
  activeRequestId: null,
  streamedBuffer: '',
  customPersonas: [], // array of { id, name, prompt }
  responseCache: new Map(), // Cache for responses to avoid duplicate API calls
  draftAutoSave: null, // Auto-save timer for drafts
  conversationBranches: [], // Array of conversation branches
  currentBranch: 0, // Current branch index
  branchComparison: false, // Whether we're in comparison mode
};

// Performance metrics tracking
const performanceMetrics = {
  generationCount: 0,
  firstTokenTime: 0,
  averageTTFT: 0,
  averageTokensPerSecond: 0,
  totalTokens: 0,
  totalTime: 0
};

// Helper function to update performance metrics
function updatePerformanceMetrics(ttft, tokens, totalTime) {
  performanceMetrics.generationCount++;
  performanceMetrics.firstTokenTime = ttft;
  performanceMetrics.totalTokens += tokens;
  performanceMetrics.totalTime += totalTime;
  
  // Calculate averages
  performanceMetrics.averageTTFT = performanceMetrics.totalTime / performanceMetrics.generationCount;
  performanceMetrics.averageTokensPerSecond = performanceMetrics.totalTokens / (performanceMetrics.totalTime / 1000);
}

const personaButtons = document.querySelectorAll('.persona');
const userInputEl = document.getElementById('userInput');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const outputEl = document.getElementById('output');
const modelInputEl = document.getElementById('modelInput');
const tempInputEl = document.getElementById('tempInput');
const maxTokensInputEl = document.getElementById('maxTokensInput');
const newSessionBtn = document.getElementById('newSessionBtn');
const saveSessionBtn = document.getElementById('saveSessionBtn');
const exportSessionBtn = document.getElementById('exportSessionBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const streamMetaEl = document.getElementById('streamMeta');
const devilsBtn = document.getElementById('devilsBtn');
const modelPresetButtons = document.querySelectorAll('.model-presets button[data-model]');
const modelBannerEl = document.getElementById('modelBanner');
const modelBannerTextEl = document.getElementById('modelBannerText');
const modelBannerBtn = document.getElementById('modelBannerBtn');
const managePersonasBtn = document.getElementById('managePersonasBtn');
const personasModal = document.getElementById('personasModal');
const closePersonasBtn = document.getElementById('closePersonasBtn');
const personasListEl = document.getElementById('personasList');
const personaNameInput = document.getElementById('personaNameInput');
const personaPromptInput = document.getElementById('personaPromptInput');
const addPersonaBtn = document.getElementById('addPersonaBtn');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const toggleCodeBtn = document.getElementById('toggleCodeBtn');
const showDiffBtn = document.getElementById('showDiffBtn');
const sessionTitleInput = document.getElementById('sessionTitleInput');
const sessionTagsInput = document.getElementById('sessionTagsInput');
const toastContainer = document.getElementById('toastContainer');
const sessionTemplatesBtn = document.getElementById('sessionTemplatesBtn');
const templatesModal = document.getElementById('templatesModal');
const closeTemplatesBtn = document.getElementById('closeTemplatesBtn');

personaButtons.forEach((btn) => {
  if (btn.dataset.persona === state.selectedPersona) btn.classList.add('active');
  btn.addEventListener('click', () => {
    personaButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedPersona = btn.dataset.persona;
    state.customPrompt = undefined;
  });
});

modelPresetButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const model = btn.getAttribute('data-model');
    if (modelInputEl) modelInputEl.value = model;
  });
});

function setGenerating(isGenerating) {
  state.isGenerating = isGenerating;
  generateBtn.disabled = isGenerating;
  generateBtn.textContent = isGenerating ? 'Challenging…' : 'Challenge';
  
  // Add loading state to all action buttons
  const actionButtons = [saveSessionBtn, exportSessionBtn, exportPdfBtn, newSessionBtn];
  actionButtons.forEach(btn => {
    if (btn) {
      btn.disabled = isGenerating;
      btn.style.opacity = isGenerating ? '0.6' : '1';
    }
  });
  
  outputEl.classList.toggle('loading', isGenerating);
  if (!isGenerating) outputEl.removeAttribute('aria-busy');
  else outputEl.setAttribute('aria-busy', 'true');
  
  if (isGenerating && streamMetaEl) {
    streamMetaEl.style.display = 'none';
    streamMetaEl.textContent = '';
  }
}

function buildPrompt(persona, userText) {
  // MVP: Stub responses for UI testing; will be replaced by local model invocation next.
  const personaPreambles = {
    logician: 'Persona: The Logician. Expose logical fallacies, unstated assumptions, and reasoning gaps. Be precise and grounded.',
    market_cynic: 'Persona: The Market Cynic. Attack market viability, competition, distribution, and willingness-to-pay. Be ruthless.',
    lateral_thinker: 'Persona: The Lateral Thinker. Upend assumptions with unexpected "What if...?" scenarios. Offer contrarian angles.',
    five_whys: 'Persona: The "Five Whys" Toddler. Ask iterative whys to force first principles. Be relentless yet concise.'
  };
  return `${personaPreambles[persona]}\n\nUser text:\n${userText}`;
}

// Toast notification system
function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${type === 'error' ? 'var(--danger)' : type === 'success' ? 'var(--accent-2)' : 'var(--panel)'};
    color: var(--text);
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid var(--border);
    margin-bottom: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    pointer-events: auto;
    max-width: 300px;
    word-wrap: break-word;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration);
  
  // Click to dismiss
  toast.addEventListener('click', () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  });
}

function clearError() { 
  outputEl.classList.remove('error'); 
  outputEl.removeAttribute('role'); 
}

function setError(message, recoverySuggestions = []) {
  outputEl.classList.add('error');
  outputEl.setAttribute('role', 'alert');
  
  let errorContent = message;
  if (recoverySuggestions.length > 0) {
    errorContent += '\n\n💡 Recovery suggestions:\n';
    recoverySuggestions.forEach((suggestion, index) => {
      errorContent += `${index + 1}. ${suggestion}\n`;
    });
  }
  
  outputEl.textContent = errorContent;
  showToast(message, 'error');
}

function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Enhanced error handling with recovery suggestions
function getRecoverySuggestions(error, context = {}) {
  const suggestions = [];
  
  if (error.includes('Ollama') || error.includes('connection') || error.includes('fetch')) {
    suggestions.push('Check if Ollama is running: `ollama serve` or `brew services start ollama`');
    suggestions.push('Verify the model is installed: `ollama pull llama3:8b`');
    suggestions.push('Try restarting Ollama service');
    suggestions.push('Check if port 11434 is available');
  }
  
  if (error.includes('model') && error.includes('not found')) {
    suggestions.push('Install the model: `ollama pull ' + (context.model || 'llama3:8b') + '`');
    suggestions.push('Check available models: `ollama list`');
    suggestions.push('Try a different model from the presets');
  }
  
  if (error.includes('timeout') || error.includes('abort')) {
    suggestions.push('Try reducing the max tokens limit');
    suggestions.push('Lower the temperature setting');
    suggestions.push('Check your internet connection');
    suggestions.push('Try a smaller model like llama3:8b');
  }
  
  if (error.includes('database') || error.includes('SQLite')) {
    suggestions.push('The app will work without database features');
    suggestions.push('Try restarting the application');
    suggestions.push('Check if the app has write permissions');
  }
  
  if (error.includes('EMPTY_INPUT')) {
    suggestions.push('Enter some text in the input field');
    suggestions.push('Try a different question or prompt');
  }
  
  if (error.includes('temperature') || error.includes('tokens')) {
    suggestions.push('Temperature must be between 0 and 2');
    suggestions.push('Max tokens must be a positive number');
    suggestions.push('Try using the default values');
  }
  
  // Default suggestions if no specific error type matched
  if (suggestions.length === 0) {
    suggestions.push('Try refreshing the page');
    suggestions.push('Check the console for more details');
    suggestions.push('Restart the application');
  }
  
  return suggestions;
}

async function generate(mode) {
  const text = (userInputEl.value || '').trim();
  if (!text) {
    setError('Enter some text first.', getRecoverySuggestions('EMPTY_INPUT'));
    return;
  }
  setGenerating(true);
  clearError();
  outputEl.textContent = '';

  try {
    const model = (modelInputEl?.value || 'llama3:8b').trim();
    const temperature = Number.parseFloat(tempInputEl?.value);
    const maxTokens = Number.parseInt(maxTokensInputEl?.value, 10);
    
    // Validate inputs
    if (tempInputEl && (isNaN(temperature) || temperature < 0 || temperature > 2)) {
      setError('Temperature must be between 0 and 2', getRecoverySuggestions('temperature'));
      setGenerating(false);
      return;
    }
    
    if (maxTokensInputEl && maxTokensInputEl.value && (isNaN(maxTokens) || maxTokens < 1)) {
      setError('Max tokens must be a positive number', getRecoverySuggestions('tokens'));
      setGenerating(false);
      return;
    }

    // Check cache first
    const cacheKey = `${text}|${state.selectedPersona}|${model}|${temperature}|${maxTokens}|${mode || 'normal'}`;
    const cachedResponse = state.responseCache.get(cacheKey);
    
    if (cachedResponse) {
      // Use cached response
      outputEl.textContent = cachedResponse;
      state.history.push({ role: 'user', content: text });
      state.history.push({ role: 'assistant', content: cachedResponse });
      setGenerating(false);
      showToast('Response loaded from cache', 'info', 2000);
      return;
    }

    // Prefer streaming if available
    if (window.CODE?.generateStream && window.CODE?.onStreamChunk && window.CODE?.onStreamEnd) {
      const requestId = generateRequestId();
      state.activeRequestId = requestId;
      state.streamedBuffer = '';

      const startedAt = performance.now();
      let firstTokenTime = null;
      const offChunk = window.CODE.onStreamChunk(({ requestId: rid, chunk }) => {
        if (rid !== state.activeRequestId) return;
        if (!firstTokenTime) firstTokenTime = performance.now();
        state.streamedBuffer += chunk;
        outputEl.textContent += chunk;
        outputEl.scrollTop = outputEl.scrollHeight;
        // Show TTFT once
        if (firstTokenTime && streamMetaEl && streamMetaEl.style.display !== 'block') {
          const ttftMs = firstTokenTime - startedAt;
          streamMetaEl.style.display = 'block';
          streamMetaEl.textContent = `TTFT: ${ttftMs.toFixed(0)} ms`;
          
          // Update performance metrics
          performanceMetrics.firstTokenTime = ttftMs;
        }
      });
      const offError = window.CODE.onStreamError(({ requestId: rid, error, hint }) => {
        if (rid !== state.activeRequestId) return;
        const errorMessage = `Generation failed: ${error}`;
        const suggestions = getRecoverySuggestions(error, { model, temperature, maxTokens });
        setError(errorMessage, suggestions);
        showToast(errorMessage, 'error');
      });
      const offEnd = window.CODE.onStreamEnd(({ requestId: rid, stats }) => {
        if (rid !== state.activeRequestId) return;
        // Push to history: user then assistant
        state.history.push({ role: 'user', content: text });
        state.history.push({ role: 'assistant', content: state.streamedBuffer });
        
        // Cache the response
        if (state.streamedBuffer && state.streamedBuffer.length > 0) {
          state.responseCache.set(cacheKey, state.streamedBuffer);
          // Limit cache size to prevent memory issues
          if (state.responseCache.size > 100) {
            const firstKey = state.responseCache.keys().next().value;
            state.responseCache.delete(firstKey);
          }

          // Store in conversation memory
          try {
            window.CODE?.['memory:store-conversation']?.({
              sessionId: `session_${Date.now()}`,
              persona: state.selectedPersona,
              model: model,
              userInput: text,
              aiResponse: state.streamedBuffer
            }).catch(e => {
              // Silently handle memory errors
            });
          } catch (e) {
            // Silently handle memory errors
          }
        }
        
        // Streaming UX: token count and TTFT
        try {
          if (stats) {
            const totalTokens = Number(stats.evalCount || 0);
            const promptTokens = Number(stats.promptEvalCount || 0);
            const totalMs = Number(stats.totalDuration || 0) / 1_000_000; // ns -> ms
            const ttftMs = firstTokenTime ? (firstTokenTime - startedAt) : undefined;
            
            // Update performance metrics
            if (ttftMs !== undefined && totalTokens > 0) {
              updatePerformanceMetrics(ttftMs, totalTokens, totalMs);
            }
            
            streamMetaEl.style.display = 'block';
            const parts = [];
            if (!Number.isNaN(totalTokens)) parts.push(`Tokens: ${totalTokens}`);
            if (!Number.isNaN(promptTokens)) parts.push(`Prompt tokens: ${promptTokens}`);
            if (!Number.isNaN(totalMs)) parts.push(`Total: ${totalMs.toFixed(0)} ms`);
            if (ttftMs !== undefined) parts.push(`TTFT: ${ttftMs.toFixed(0)} ms`);
            
            // Add performance insights
            if (performanceMetrics.generationCount > 1) {
              parts.push(`Avg TTFT: ${performanceMetrics.averageTTFT.toFixed(0)} ms`);
              parts.push(`Avg Speed: ${performanceMetrics.averageTokensPerSecond.toFixed(1)} t/s`);
            }
            
            streamMetaEl.textContent = parts.join(' • ');
          } else {
            streamMetaEl.style.display = 'none';
            streamMetaEl.textContent = '';
          }
        } catch (_) {}
        setGenerating(false);
        
        // Show success feedback
        if (state.streamedBuffer && state.streamedBuffer.length > 0) {
          showToast('Generation completed successfully!', 'success', 3000);
        }
        
        offChunk && offChunk();
        offError && offError();
        offEnd && offEnd();
      });

      window.CODE.generateStream({
        requestId,
        persona: state.selectedPersona,
        userText: text,
        model,
        history: state.history,
        mode: mode || undefined,
        customPrompt: state.customPrompt,
        options: {
          temperature: Number.isFinite(temperature) ? temperature : undefined,
          maxTokens: Number.isFinite(maxTokens) ? maxTokens : undefined,
        }
      });
      return; // exit to let stream handlers manage lifecycle
    }

    // Fallback non-streaming
    if (window.CODE?.generate) {
      const res = await window.CODE.generate(
        state.selectedPersona,
        text,
        model,
        state.history,
        {
          temperature: Number.isFinite(temperature) ? temperature : undefined,
          maxTokens: Number.isFinite(maxTokens) ? maxTokens : undefined,
        },
        mode || undefined,
        state.customPrompt,
      );
      if (res?.ok) {
        outputEl.textContent = res.response;
        state.history.push({ role: 'user', content: text });
        state.history.push({ role: 'assistant', content: res.response });
        
        // Cache the response
        if (res.response && res.response.length > 0) {
          state.responseCache.set(cacheKey, res.response);
          // Limit cache size to prevent memory issues
          if (state.responseCache.size > 100) {
            const firstKey = state.responseCache.keys().next().value;
            state.responseCache.delete(firstKey);
          }
        }
      } else {
        const suggestions = getRecoverySuggestions(res?.error || 'Unknown error', { model, temperature, maxTokens });
        setError(`Error: ${res?.error || 'Unknown error.'}`, suggestions);
      }
    } else {
      setError('Bridge not available. Ensure preload is loaded.', getRecoverySuggestions('bridge'));
    }
  } catch (err) {
    const suggestions = getRecoverySuggestions(err?.message || String(err));
    setError(`Unexpected error: ${err?.message || String(err)}`, suggestions);
  }
  setGenerating(false);
}

/**
 * Handles the copy functionality
 */
function handleCopy() {
  const text = outputEl?.textContent || '';
  if (window.CODE && typeof window.CODE.copyToClipboard === 'function') {
    window.CODE.copyToClipboard(text);
    if (copyBtn) {
    copyBtn.textContent = 'Copied';
    setTimeout(() => (copyBtn.textContent = 'Copy'), 900);
    }
  } else {
    // Fallback for any environment issues
    navigator.clipboard?.writeText(text).then(() => {
      if (copyBtn) {
      copyBtn.textContent = 'Copied';
      setTimeout(() => (copyBtn.textContent = 'Copy'), 900);
      }
    });
  }
}

/**
 * Handles the new session functionality
 */
async function handleNewSession() {
  // Save the old session before clearing it, if it has content
  try {
    if (state.history.length > 0 && window.CODE?.['db:save-session']) {
      await window.CODE['db:save-session']({
        persona: state.selectedPersona,
        model: (modelInputEl?.value || 'llama3:8b').trim(),
        history: state.history,
      });
    }
  } catch (error) {
    console.warn('Failed to save session before clearing:', error);
  }

  // Clear state for the new session
  state.history = [];
  state.streamedBuffer = '';
  state.activeRequestId = null;
  
  if (outputEl) {
  outputEl.textContent = '';
  }
  if (userInputEl) {
  userInputEl.value = '';
  }
  
  clearError();
  
  if (streamMetaEl) {
    streamMetaEl.style.display = 'none';
    streamMetaEl.textContent = '';
  }
  
  showToast('New session started', 'info', 2000);
}

/**
 * Handles the open dashboard functionality
 */
function handleOpenDashboard() {
  if (window.CODE?.openDashboard) {
    window.CODE.openDashboard();
  }
}

/**
 * Handles the devils advocate functionality
 */
async function handleDevilsAdvocate() {
  if (!state.isGenerating) {
    await generate('devils_advocate');
  }
}

/**
 * Handles the manage personas functionality
 */
async function handleManagePersonas() {
  if (personasModal) {
    personasModal.style.display = 'flex';
    await refreshPersonasUI();
  }
}

/**
 * Closes the personas modal
 */
function closePersonasModal() {
  if (personasModal) {
    personasModal.style.display = 'none';
  }
}

/**
 * Handles the add persona functionality
 */
async function handleAddPersona() {
  const name = (personaNameInput?.value || '').trim();
  const prompt = (personaPromptInput?.value || '').trim();
  
  // Visual validation feedback
  if (personaNameInput) {
    personaNameInput.style.borderColor = name ? 'var(--border)' : 'var(--danger)';
  }
  if (personaPromptInput) {
    personaPromptInput.style.borderColor = prompt ? 'var(--border)' : 'var(--danger)';
  }
  
  if (!name || !prompt) {
    showToast('Name and prompt are required', 'error');
    return;
  }
  
  // Show loading state
  const originalText = addPersonaBtn?.textContent || 'Add Persona';
  if (addPersonaBtn) {
    addPersonaBtn.disabled = true;
    addPersonaBtn.innerHTML = '<span class="loading-spinner"></span>Adding...';
  }
  
  try {
    if (window.CODE?.['db:savePersona']) {
      const res = await window.CODE['db:save-persona']({ name, prompt });
      if (res?.ok) {
        // Show success state briefly
        if (personaNameInput) personaNameInput.style.borderColor = 'var(--accent-2)';
        if (personaPromptInput) personaPromptInput.style.borderColor = 'var(--accent-2)';
        
        // Reset after success
        setTimeout(() => {
          if (personaNameInput) personaNameInput.style.borderColor = 'var(--border)';
          if (personaPromptInput) personaPromptInput.style.borderColor = 'var(--border)';
        }, 2000);
        
        personaNameInput.value = '';
        personaPromptInput.value = '';
        await loadCustomPersonas();
        showToast('Persona added successfully!', 'success');
      } else {
        showToast(`Failed to save persona: ${res?.error || 'Unknown error'}`, 'error');
      }
    }
  } catch (error) {
    showToast(`Error: ${error?.message || String(error)}`, 'error');
  } finally {
    // Restore button state
    if (addPersonaBtn) {
      addPersonaBtn.disabled = false;
      addPersonaBtn.textContent = originalText;
    }
  }
}

/**
 * Handles the toggle theme functionality
 */
function handleToggleTheme() {
  const curr = document.documentElement.getAttribute('data-theme');
  const next = curr === 'light' ? null : 'light';
  if (next) document.documentElement.setAttribute('data-theme', next);
  else document.documentElement.removeAttribute('data-theme');
}

/**
 * Detects the programming language from text content
 */
function detectLanguage(text) {
  const lower = text.toLowerCase();
  
  // JavaScript/TypeScript patterns
  if (lower.includes('function') && (lower.includes('=>') || lower.includes('const ') || lower.includes('let '))) {
    return 'javascript';
  }
  if (lower.includes('interface ') || lower.includes('type ') || lower.includes('enum ')) {
    return 'typescript';
  }
  
  // Python patterns
  if (lower.includes('def ') || lower.includes('import ') || lower.includes('from ') || lower.includes('if __name__')) {
    return 'python';
  }
  
  // JSON patterns
  if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
    try {
      JSON.parse(text);
      return 'json';
    } catch (e) {
      // Not valid JSON, continue
    }
  }
  
  // HTML patterns
  if (lower.includes('<html') || lower.includes('<div') || lower.includes('<span')) {
    return 'html';
  }
  
  // CSS patterns
  if (lower.includes('{') && lower.includes('}') && (lower.includes('color:') || lower.includes('margin:') || lower.includes('padding:'))) {
    return 'css';
  }
  
  // SQL patterns
  if (lower.includes('select ') || lower.includes('insert ') || lower.includes('update ') || lower.includes('delete ')) {
    return 'sql';
  }
  
  // Shell/Bash patterns
  if (lower.includes('#!/') || lower.includes('$') || lower.includes('cd ') || lower.includes('ls ')) {
    return 'bash';
  }
  
  // Default to plain text
  return 'text';
}

/**
 * Handles the toggle code view functionality with improved language detection
 */
function handleToggleCode() {
  const raw = outputEl?.textContent || '';
  if (!raw) return;
  
  if (outputEl?.dataset.mode === 'code') {
    // Switch back to text mode
    outputEl.dataset.mode = 'text';
    outputEl.textContent = raw;
    toggleCodeBtn.textContent = 'Code';
  } else {
    // Switch to code mode
    outputEl.dataset.mode = 'code';
    const language = detectLanguage(raw);
    const escaped = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    if (language === 'text') {
      // Plain text, just show in a code block without highlighting
      outputEl.innerHTML = `<pre class="code-block"><code>${escaped}</code></pre>`;
    } else {
      // Use Prism.js for syntax highlighting
      outputEl.innerHTML = `<pre class="code-block"><code class="language-${language}">${escaped}</code></pre>`;
      
      if (window.Prism && window.Prism.highlightAllUnder) {
        window.Prism.highlightAllUnder(outputEl);
      }
    }
    
    toggleCodeBtn.textContent = 'Text';
  }
}

/**
 * Handles the show diff functionality
 */
function handleShowDiff() {
  const lastUser = [...state.history].reverse().find((m) => m.role === 'user')?.content || '';
  const lastAssistant = [...state.history].reverse().find((m) => m.role === 'assistant')?.content || '';
  
  if (!lastUser || !lastAssistant) {
    showToast('No conversation history to compare', 'info');
    return;
  }
  
  const html = computeDiff(lastUser, lastAssistant);
  outputEl.dataset.mode = 'diff';
  outputEl.innerHTML = `<div class="diff">${html}</div>`;
}

/**
 * Handles the session templates functionality
 */
function handleSessionTemplates() {
  if (templatesModal) {
    templatesModal.style.display = 'flex';
  }
}

/**
 * Closes the templates modal
 */
function closeTemplatesModal() {
  if (templatesModal) {
    templatesModal.style.display = 'none';
  }
}

/**
 * Clears the current session's history and output
 */
function clearCurrentSession() {
  if (outputEl) {
    outputEl.textContent = '';
  }
  if (userInputEl) {
    userInputEl.value = '';
  }
  state.history = [];
  state.streamedBuffer = '';
  state.activeRequestId = null;
  
  // Clear draft as well
  clearDraft();
  
  if (streamMetaEl) {
    streamMetaEl.style.display = 'none';
    streamMetaEl.textContent = '';
  }
  
  showToast('Session cleared', 'info', 2000);
}

// Add event listeners for the buttons
generateBtn?.addEventListener('click', generate);
copyBtn?.addEventListener('click', handleCopy);
newSessionBtn?.addEventListener('click', handleNewSession);
saveSessionBtn?.addEventListener('click', saveCurrentSession);
exportSessionBtn?.addEventListener('click', () => exportSession('md'));
exportPdfBtn?.addEventListener('click', () => exportSession('pdf'));
dashboardBtn?.addEventListener('click', handleOpenDashboard);
devilsBtn?.addEventListener('click', handleDevilsAdvocate);
managePersonasBtn?.addEventListener('click', handleManagePersonas);
closePersonasBtn?.addEventListener('click', closePersonasModal);
addPersonaBtn?.addEventListener('click', handleAddPersona);
toggleThemeBtn?.addEventListener('click', handleToggleTheme);
toggleCodeBtn?.addEventListener('click', handleToggleCode);
showDiffBtn?.addEventListener('click', handleShowDiff);
sessionTemplatesBtn?.addEventListener('click', handleSessionTemplates);
closeTemplatesBtn?.addEventListener('click', closeTemplatesModal);

// Template button click handlers
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('template-btn')) {
    const templateId = e.target.dataset.template;
    const template = sessionTemplates[templateId];
    
    if (template) {
      // Apply template settings
      if (sessionTitleInput) sessionTitleInput.value = template.title;
      if (sessionTagsInput) sessionTagsInput.value = template.tags.join(', ');
      
      // Set persona
      const personaBtn = document.querySelector(`[data-persona="${template.persona}"]`);
      if (personaBtn) {
        personaButtons.forEach(btn => btn.classList.remove('active'));
        personaBtn.classList.add('active');
        state.selectedPersona = template.persona;
      }
      
      // Set temperature
      if (tempInputEl) tempInputEl.value = template.temperature;
      
      // Set custom prompt
      state.customPrompt = template.prompt;
      
      // Close modal
      templatesModal.style.display = 'none';
      
      // Show success feedback
      showToast(`Template "${template.title}" applied!`, 'success');
      
      // Focus on input
      if (userInputEl) userInputEl.focus();
    }
  }
});

// Session templates configuration
const sessionTemplates = {
  'startup-pitch': {
    title: 'Startup Pitch Review',
    tags: ['startup', 'pitch', 'business'],
    persona: 'market_cynic',
    prompt: 'Analyze this startup pitch for market viability, competition, scalability, and investor appeal. Focus on concrete risks and opportunities.',
    temperature: 0.8
  },
  'market-analysis': {
    title: 'Market Analysis',
    tags: ['market', 'analysis', 'strategy'],
    persona: 'logician',
    prompt: 'Evaluate this market analysis for logical consistency, data quality, assumptions, and strategic implications.',
    temperature: 0.7
  },
  'business-plan': {
    title: 'Business Plan Critique',
    tags: ['business', 'plan', 'strategy'],
    persona: 'market_cynic',
    prompt: 'Critically assess this business plan for feasibility, market fit, financial projections, and execution risks.',
    temperature: 0.8
  },
  'research-paper': {
    title: 'Research Paper Review',
    tags: ['research', 'academic', 'analysis'],
    persona: 'logician',
    prompt: 'Review this research paper for methodological rigor, logical flow, evidence quality, and potential biases.',
    temperature: 0.6
  },
  'thesis-defense': {
    title: 'Thesis Defense',
    tags: ['academic', 'thesis', 'defense'],
    persona: 'five_whys',
    prompt: 'Challenge this thesis by asking iterative "why" questions to expose assumptions and test logical foundations.',
    temperature: 0.7
  },
  'hypothesis': {
    title: 'Hypothesis Testing',
    tags: ['hypothesis', 'scientific', 'testing'],
    persona: 'logician',
    prompt: 'Evaluate this hypothesis for testability, falsifiability, logical consistency, and alternative explanations.',
    temperature: 0.6
  },
  'product-design': {
    title: 'Product Design Review',
    tags: ['design', 'product', 'ux'],
    persona: 'lateral_thinker',
    prompt: 'Challenge this product design with unexpected scenarios, edge cases, and alternative approaches.',
    temperature: 0.8
  },
  'creative-concept': {
    title: 'Creative Concept',
    tags: ['creative', 'concept', 'innovation'],
    persona: 'lateral_thinker',
    prompt: 'Push this creative concept further by exploring unconventional angles and challenging creative assumptions.',
    temperature: 0.9
  },
  'user-experience': {
    title: 'UX/UI Critique',
    tags: ['ux', 'ui', 'design'],
    persona: 'five_whys',
    prompt: 'Question this UX/UI design by exploring user motivations, edge cases, and accessibility concerns.',
    temperature: 0.7
  }
};

// Auto-save drafts functionality
function startAutoSave() {
  if (state.draftAutoSave) {
    clearInterval(state.draftAutoSave);
  }
  
  state.draftAutoSave = setInterval(() => {
    const text = (userInputEl?.value || '').trim();
    if (text && text.length > 10) { // Only save if there's substantial content
      try {
        localStorage.setItem('code_draft', JSON.stringify({
          text: text,
          persona: state.selectedPersona,
          model: (modelInputEl?.value || 'llama3:8b').trim(),
          temperature: tempInputEl?.value || '0.7',
          maxTokens: maxTokensInputEl?.value || '',
          timestamp: Date.now()
        }));
      } catch (e) {
        // Silently handle storage errors
      }
    }
  }, 30000); // Auto-save every 30 seconds
}

function loadDraft() {
  try {
    const draft = localStorage.getItem('code_draft');
    if (draft) {
      const data = JSON.parse(draft);
      const age = Date.now() - data.timestamp;
      
      // Only load drafts that are less than 24 hours old
      if (age < 24 * 60 * 60 * 1000) {
        if (userInputEl && data.text) {
          userInputEl.value = data.text;
        }
        if (data.persona) {
          selectPersona(data.persona);
        }
        if (modelInputEl && data.model) {
          modelInputEl.value = data.model;
        }
        if (tempInputEl && data.temperature) {
          tempInputEl.value = data.temperature;
        }
        if (maxTokensInputEl && data.maxTokens) {
          maxTokensInputEl.value = data.maxTokens;
        }
        
        showToast('Draft restored from auto-save', 'info', 3000);
        return true;
      } else {
        // Clear old draft
        localStorage.removeItem('code_draft');
      }
    }
  } catch (e) {
    // Silently handle errors
  }
  return false;
}

function clearDraft() {
  try {
    localStorage.removeItem('code_draft');
  } catch (e) {
    // Silently handle errors
  }
}

// Load custom personas function
async function loadCustomPersonas() {
  try {
    const res = await window.CODE?.['db:list-personas']?.();
    if (res?.ok && Array.isArray(res.personas)) {
      state.customPersonas = res.personas;
    }
  } catch (e) {
    // Silently handle errors - app works without database
  }
}

// Load custom personas on startup
loadCustomPersonas();

// Conversation branching functionality
function createConversationBranch() {
  const branch = {
    id: Date.now(),
    name: `Branch ${state.conversationBranches.length + 1}`,
    persona: state.selectedPersona,
    model: (modelInputEl?.value || 'llama3:8b').trim(),
    history: [...state.history],
    createdAt: new Date().toISOString()
  };
  
  state.conversationBranches.push(branch);
  state.currentBranch = state.conversationBranches.length - 1;
  
  showToast(`Created branch: ${branch.name}`, 'info', 2000);
  updateBranchUI();
}

function switchToBranch(branchIndex) {
  if (branchIndex >= 0 && branchIndex < state.conversationBranches.length) {
    const branch = state.conversationBranches[branchIndex];
    state.currentBranch = branchIndex;
    state.history = [...branch.history];
    state.selectedPersona = branch.persona;
    
    // Update UI
    if (modelInputEl) modelInputEl.value = branch.model;
    selectPersona(branch.persona);
    
    // Update output display
    if (outputEl) {
      const lastResponse = branch.history.filter(h => h.role === 'assistant').pop();
      outputEl.textContent = lastResponse ? lastResponse.content : '';
    }
    
    showToast(`Switched to ${branch.name}`, 'info', 2000);
    updateBranchUI();
  }
}

function deleteBranch(branchIndex) {
  if (state.conversationBranches.length <= 1) {
    showToast('Cannot delete the last branch', 'error');
    return;
  }
  
  const branch = state.conversationBranches[branchIndex];
  state.conversationBranches.splice(branchIndex, 1);
  
  // Adjust current branch index
  if (state.currentBranch >= branchIndex) {
    state.currentBranch = Math.max(0, state.currentBranch - 1);
  }
  
  showToast(`Deleted branch: ${branch.name}`, 'info', 2000);
  updateBranchUI();
}

function toggleBranchComparison() {
  state.branchComparison = !state.branchComparison;
  updateBranchUI();
  
  if (state.branchComparison) {
    showToast('Branch comparison mode enabled', 'info', 2000);
  } else {
    showToast('Branch comparison mode disabled', 'info', 2000);
  }
}

function updateBranchUI() {
  // This will be called to update the branch management UI
  // For now, we'll add it to the command palette
}

// Model comparison functionality
async function compareModels() {
  const text = (userInputEl?.value || '').trim();
  if (!text) {
    setError('Enter some text first to compare models.', getRecoverySuggestions('EMPTY_INPUT'));
    return;
  }
  
  const models = ['llama3:8b', 'gpt-oss-20b', 'gpt-oss-120b'];
  const results = [];
  
  showToast('Starting model comparison...', 'info', 3000);
  
  for (const model of models) {
    try {
      showToast(`Testing ${model}...`, 'info', 2000);
      
      const startTime = performance.now();
      const res = await window.CODE?.generate(
        state.selectedPersona,
        text,
        model,
        state.history,
        {
          temperature: Number.parseFloat(tempInputEl?.value) || 0.7,
          maxTokens: Number.parseInt(maxTokensInputEl?.value, 10) || undefined,
        }
      );
      const endTime = performance.now();
      
      if (res?.ok) {
        results.push({
          model,
          response: res.response,
          responseTime: endTime - startTime,
          success: true
        });
      } else {
        results.push({
          model,
          error: res?.error || 'Unknown error',
          success: false
        });
      }
    } catch (err) {
      results.push({
        model,
        error: err?.message || String(err),
        success: false
      });
    }
  }
  
  // Display comparison results
  displayModelComparison(results, text);
}

function displayModelComparison(results, originalText) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.8); 
    display: flex; align-items: center; justify-content: center; z-index: 10000;
  `;
  
  const comparison = document.createElement('div');
  comparison.style.cssText = `
    width: 90vw; max-width: 1200px; height: 80vh; background: var(--panel); 
    border: 1px solid var(--border); border-radius: 12px; 
    padding: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    display: flex; flex-direction: column;
  `;
  
  const header = document.createElement('div');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;';
  header.innerHTML = `
    <h2 style="margin: 0; color: var(--text);">Model Comparison Results</h2>
    <button id="closeComparison" style="padding: 8px 16px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
  `;
  
  const content = document.createElement('div');
  content.style.cssText = 'flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;';
  
  results.forEach((result, index) => {
    const card = document.createElement('div');
    card.style.cssText = `
      background: var(--bg); border: 1px solid var(--border); 
      border-radius: 8px; padding: 16px; display: flex; flex-direction: column;
    `;
    
    const modelHeader = document.createElement('div');
    modelHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;';
    modelHeader.innerHTML = `
      <h3 style="margin: 0; color: var(--text); font-size: 16px;">${result.model}</h3>
      ${result.success ? `<span style="color: var(--accent-2); font-size: 12px;">${result.responseTime?.toFixed(0)}ms</span>` : '<span style="color: var(--danger); font-size: 12px;">Failed</span>'}
    `;
    
    const responseContent = document.createElement('div');
    responseContent.style.cssText = `
      flex: 1; background: #0b0d12; border: 1px solid var(--border); 
      border-radius: 6px; padding: 12px; color: var(--text); 
      white-space: pre-wrap; font-size: 13px; line-height: 1.4;
      max-height: 300px; overflow-y: auto;
    `;
    
    if (result.success) {
      responseContent.textContent = result.response;
    } else {
      responseContent.textContent = `Error: ${result.error}`;
      responseContent.style.color = 'var(--danger)';
    }
    
    card.appendChild(modelHeader);
    card.appendChild(responseContent);
    content.appendChild(card);
  });
  
  comparison.appendChild(header);
  comparison.appendChild(content);
  modal.appendChild(comparison);
  document.body.appendChild(modal);
  
  // Close functionality
  const closeBtn = comparison.querySelector('#closeComparison');
  const closeComparison = () => modal.remove();
  
  closeBtn.addEventListener('click', closeComparison);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeComparison();
  });
  
  showToast('Model comparison completed!', 'success', 3000);
}

// Context-aware conversation features
async function getContextSuggestions() {
  const text = (userInputEl?.value || '').trim();
  if (!text) {
    showToast('Enter some text first to get context suggestions', 'info');
    return;
  }

  try {
    const res = await window.CODE?.['memory:get-context']?.({
      currentInput: text,
      currentPersona: state.selectedPersona
    });

    if (res?.ok && res.context) {
      displayContextSuggestions(res.context, text);
    } else {
      showToast('No relevant context found', 'info');
    }
  } catch (error) {
    showToast('Failed to get context suggestions', 'error');
  }
}

function displayContextSuggestions(context, originalText) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.8); 
    display: flex; align-items: center; justify-content: center; z-index: 10000;
  `;
  
  const suggestions = document.createElement('div');
  suggestions.style.cssText = `
    width: 600px; max-width: 90vw; background: var(--panel); 
    border: 1px solid var(--border); border-radius: 12px; 
    padding: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    max-height: 80vh; overflow-y: auto;
  `;
  
  const header = document.createElement('div');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;';
  header.innerHTML = `
    <h2 style="margin: 0; color: var(--text);">Context-Aware Suggestions</h2>
    <button id="closeSuggestions" style="padding: 8px 16px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
  `;
  
  const content = document.createElement('div');
  content.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
  
  // Context summary
  if (context.contextSummary) {
    const summaryDiv = document.createElement('div');
    summaryDiv.style.cssText = 'background: var(--bg); padding: 12px; border-radius: 8px; border: 1px solid var(--border);';
    summaryDiv.innerHTML = `
      <h3 style="margin: 0 0 8px 0; color: var(--accent); font-size: 14px;">Context Summary</h3>
      <p style="margin: 0; color: var(--text); font-size: 13px;">${context.contextSummary}</p>
    `;
    content.appendChild(summaryDiv);
  }
  
  // Suggestions
  if (context.suggestions && context.suggestions.length > 0) {
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.style.cssText = 'background: var(--bg); padding: 12px; border-radius: 8px; border: 1px solid var(--border);';
    suggestionsDiv.innerHTML = `
      <h3 style="margin: 0 0 8px 0; color: var(--accent-2); font-size: 14px;">AI Suggestions</h3>
      <ul style="margin: 0; padding-left: 16px; color: var(--text); font-size: 13px;">
        ${context.suggestions.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
      </ul>
    `;
    content.appendChild(suggestionsDiv);
  }
  
  // Relevant memories
  if (context.relevantMemories && context.relevantMemories.length > 0) {
    const memoriesDiv = document.createElement('div');
    memoriesDiv.style.cssText = 'background: var(--bg); padding: 12px; border-radius: 8px; border: 1px solid var(--border);';
    memoriesDiv.innerHTML = `
      <h3 style="margin: 0 0 8px 0; color: var(--accent); font-size: 14px;">Related Conversations</h3>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${context.relevantMemories.slice(0, 3).map(memory => `
          <div style="padding: 8px; background: rgba(122, 162, 247, 0.1); border-radius: 6px; font-size: 12px;">
            <div style="color: var(--muted); margin-bottom: 4px;">
              ${memory.persona} • ${new Date(memory.timestamp).toLocaleDateString()}
            </div>
            <div style="color: var(--text);">${memory.userInput.slice(0, 100)}${memory.userInput.length > 100 ? '...' : ''}</div>
          </div>
        `).join('')}
      </div>
    `;
    content.appendChild(memoriesDiv);
  }
  
  suggestions.appendChild(header);
  suggestions.appendChild(content);
  modal.appendChild(suggestions);
  document.body.appendChild(modal);
  
  // Close functionality
  const closeBtn = suggestions.querySelector('#closeSuggestions');
  const closeSuggestions = () => modal.remove();
  
  closeBtn.addEventListener('click', closeSuggestions);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSuggestions();
  });
}

async function showMemoryStats() {
  try {
    const res = await window.CODE?.['memory:get-stats']?.();
    
    if (res?.ok && res.stats) {
      const stats = res.stats;
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.8); 
        display: flex; align-items: center; justify-content: center; z-index: 10000;
      `;
      
      const statsDiv = document.createElement('div');
      statsDiv.style.cssText = `
        width: 400px; max-width: 90vw; background: var(--panel); 
        border: 1px solid var(--border); border-radius: 12px; 
        padding: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      `;
      
      statsDiv.innerHTML = `
        <h2 style="margin: 0 0 16px 0; color: var(--text);">Conversation Memory Stats</h2>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--muted);">Total Memories:</span>
            <span style="color: var(--text);">${stats.totalMemories}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--muted);">Most Common Domain:</span>
            <span style="color: var(--text);">${stats.mostCommonDomain || 'N/A'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--muted);">Most Used Persona:</span>
            <span style="color: var(--text);">${stats.mostUsedPersona || 'N/A'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--muted);">Average Quality:</span>
            <span style="color: var(--text);">${stats.averageQuality ? stats.averageQuality.toFixed(1) : 'N/A'}</span>
          </div>
        </div>
        <button id="closeStats" style="margin-top: 16px; padding: 8px 16px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; width: 100%;">Close</button>
      `;
      
      modal.appendChild(statsDiv);
      document.body.appendChild(modal);
      
      const closeBtn = statsDiv.querySelector('#closeStats');
      const closeStats = () => modal.remove();
      
      closeBtn.addEventListener('click', closeStats);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeStats();
      });
    } else {
      showToast('Failed to get memory stats', 'error');
    }
  } catch (error) {
    showToast('Failed to get memory stats', 'error');
  }
}

async function clearConversationMemory() {
  try {
    const res = await window.CODE?.['memory:clear']?.();
    
    if (res?.ok) {
      showToast('Conversation memory cleared', 'success');
    } else {
      showToast('Failed to clear memory', 'error');
    }
  } catch (error) {
    showToast('Failed to clear memory', 'error');
  }
}

// Load draft on startup
window.addEventListener('DOMContentLoaded', () => {
  loadDraft();
  startAutoSave();
});

// Reset validation styling on input focus
[sessionTitleInput, sessionTagsInput, personaNameInput, personaPromptInput].forEach(input => {
  if (input) {
    input.addEventListener('focus', () => {
      input.style.borderColor = 'var(--border)';
    });
  }
});

// Onboarding setup
function setupOnboarding() {
  const onboardingModal = document.getElementById('onboardingModal');
  const closeOnboardingBtn = document.getElementById('closeOnboardingBtn');
  const onboardingNext = document.getElementById('onboardingNext');
  const onboardingPrev = document.getElementById('onboardingPrev');
  const onboardingDots = document.querySelectorAll('.dot');
  const onboardingSteps = document.querySelectorAll('.onboarding-step');
  
  if (!onboardingModal) return;
  
  let currentStep = 1;
  const totalSteps = 3;
  
  // Check if user has seen onboarding before
  const hasSeenOnboarding = localStorage.getItem('code-onboarding-seen');
  
  if (!hasSeenOnboarding) {
    // Show onboarding modal after a short delay
    setTimeout(() => {
      onboardingModal.style.display = 'flex';
      showOnboardingStep(1);
    }, 1000);
  }
  
  function showOnboardingStep(step) {
    // Hide all steps
    onboardingSteps.forEach(s => s.style.display = 'none');
    
    // Show current step
    const currentStepEl = document.querySelector(`[data-step="${step}"]`);
    if (currentStepEl) {
      currentStepEl.style.display = 'block';
    }
    
    // Update dots
    onboardingDots.forEach((dot, index) => {
      dot.classList.toggle('active', index + 1 === step);
    });
    
    // Update navigation buttons
    if (onboardingPrev) {
      onboardingPrev.disabled = step === 1;
    }
    if (onboardingNext) {
      onboardingNext.textContent = step === totalSteps ? 'Get Started' : 'Next';
    }
  }
  
  function nextStep() {
    if (currentStep < totalSteps) {
      currentStep++;
      showOnboardingStep(currentStep);
    } else {
      // Finish onboarding
      finishOnboarding();
    }
  }
  
  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      showOnboardingStep(currentStep);
    }
  }
  
  function finishOnboarding() {
    localStorage.setItem('code-onboarding-seen', 'true');
    onboardingModal.style.display = 'none';
    showToast('Welcome to CODE! Start by typing your idea in the left panel.', 'success');
  }
  
  // Event listeners
  if (closeOnboardingBtn) {
    closeOnboardingBtn.addEventListener('click', finishOnboarding);
  }
  
  if (onboardingNext) {
    onboardingNext.addEventListener('click', nextStep);
  }
  
  if (onboardingPrev) {
    onboardingPrev.addEventListener('click', prevStep);
  }
  
  // Dot navigation
  onboardingDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      currentStep = index + 1;
      showOnboardingStep(currentStep);
    });
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (onboardingModal.style.display === 'flex') {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finishOnboarding();
      }
    }
  });
}

// Session management functions
async function saveCurrentSession() {
  if (state.history.length === 0) {
    showToast('No session to save. Generate some responses first.', 'error');
    return;
  }
  
  // Show loading state
  const originalText = saveSessionBtn?.textContent || 'Save Session';
  if (saveSessionBtn) {
    saveSessionBtn.disabled = true;
    saveSessionBtn.innerHTML = '<span class="loading-spinner"></span>Saving...';
  }
  
  try {
    const title = (sessionTitleInput?.value || '').trim();
    const tagsText = (sessionTagsInput?.value || '').trim();
    const tags = tagsText ? tagsText.split(',').map(t => t.trim()).filter(t => t) : [];
    
    // Visual validation feedback
    if (sessionTitleInput) {
      sessionTitleInput.style.borderColor = title ? 'var(--border)' : 'var(--danger)';
    }
    if (sessionTagsInput) {
      sessionTagsInput.style.borderColor = tagsText ? 'var(--border)' : 'var(--danger)';
    }
    
    if (!title) {
      showToast('Session title is required', 'error');
      return;
    }
    
    if (window.CODE?.['db:save-session']) {
      const res = await window.CODE['db:save-session']({
        persona: state.selectedPersona,
        model: (modelInputEl?.value || 'llama3:8b').trim(),
        history: state.history,
        title: title || null,
        tags: tags.length > 0 ? tags : null
      });
      
      if (res?.ok) {
        // Show success state briefly
        if (sessionTitleInput) sessionTitleInput.style.borderColor = 'var(--accent-2)';
        if (sessionTagsInput) sessionTagsInput.style.borderColor = 'var(--accent-2)';
        
        // Reset after success
        setTimeout(() => {
          if (sessionTitleInput) sessionTitleInput.style.borderColor = 'var(--border)';
          if (sessionTagsInput) sessionTagsInput.style.borderColor = 'var(--border)';
        }, 2000);
        
        showToast('Session saved successfully!', 'success');
        // Clear the title and tags inputs
        if (sessionTitleInput) sessionTitleInput.value = '';
        if (sessionTagsInput) sessionTagsInput.value = '';
      } else {
        showToast(`Failed to save session: ${res?.error || 'Unknown error'}`, 'error');
      }
    }
      } catch (err) {
      showToast(`Error saving session: ${err?.message || String(err)}`, 'error');
    } finally {
      // Restore button state
      if (saveSessionBtn) {
        saveSessionBtn.disabled = false;
        saveSessionBtn.textContent = originalText;
      }
    }
  }

async function exportSession(format = 'md') {
  if (state.history.length === 0) {
    showToast('No session to export. Generate some responses first.', 'error');
    return;
  }
  
  // Show loading state
  const btn = format === 'md' ? exportSessionBtn : exportPdfBtn;
  const originalText = btn?.textContent || 'Export';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner"></span>Exporting...`;
  }
  
  try {
    const title = (sessionTitleInput?.value || '').trim();
    const tagsText = (sessionTagsInput?.value || '').trim();
    const tags = tagsText ? tagsText.split(',').map(t => t.trim()).filter(t => t) : [];
    
    const sessionData = {
      persona: state.selectedPersona,
      model: (modelInputEl?.value || 'llama3:8b').trim(),
      history: state.history,
      title: title || null,
      tags: tags.length > 0 ? tags : null
    };
    
    let res;
    if (format === 'md' && window.CODE?.['fs:export-md']) {
      res = await window.CODE['fs:export-md'](sessionData);
    } else if (format === 'pdf' && window.CODE?.['fs:export-pdf']) {
      res = await window.CODE['fs:export-pdf'](sessionData);
    } else if (format === 'json' && window.CODE?.['fs:export-json']) {
      res = await window.CODE['fs:export-json'](sessionData);
    } else if (format === 'html' && window.CODE?.['fs:export-html']) {
      res = await window.CODE['fs:export-html'](sessionData);
    }
    
      if (res?.ok) {
      const formatNames = { md: 'Markdown', pdf: 'PDF', json: 'JSON', html: 'HTML' };
      showToast(`Session exported to ${formatNames[format]}!`, 'success');
      } else if (!res?.canceled) {
        showToast(`Export failed: ${res?.error || 'Unknown error'}`, 'error');
    }
  } catch (err) {
    showToast(`Export error: ${err?.message || String(err)}`, 'error');
  } finally {
    // Restore button state
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}

// Event listeners for session management
saveSessionBtn?.addEventListener('click', saveCurrentSession);
exportSessionBtn?.addEventListener('click', () => exportSession('md'));
exportPdfBtn?.addEventListener('click', () => exportSession('pdf'));
devilsBtn?.addEventListener('click', () => {
  if (!state.isGenerating) generate('devils_advocate');
});

// On startup, check model presence and suggest pull if missing
window.addEventListener('DOMContentLoaded', async () => {
  // Set up onboarding
  setupOnboarding();
  
  try {
    const model = (modelInputEl?.value || 'llama3:8b').trim();
          const exists = await window.CODE?.['ollama:model-exists']?.(model);
    if (exists && exists.ok && !exists.exists && modelBannerEl && modelBannerBtn && modelBannerTextEl) {
      modelBannerEl.style.display = 'block';
      modelBannerTextEl.textContent = `Model ${model} is not installed.`;
      modelBannerBtn.textContent = `Pull ${model}`;
      modelBannerBtn.onclick = async () => {
        try {
          const originalText = modelBannerBtn.textContent;
          modelBannerBtn.disabled = true;
          modelBannerBtn.innerHTML = '<span class="loading-spinner"></span>Pulling...';
          modelBannerTextEl.textContent = `Pulling ${model}... this may take a while.`;
          
          await window.CODE?.['ollama:pull-model']?.(model);
          
          modelBannerTextEl.textContent = `Model ${model} pulled successfully.`;
          showToast(`Model ${model} installed successfully!`, 'success');
          setTimeout(() => { modelBannerEl.style.display = 'none'; }, 2000);
        } catch (e) {
          modelBannerTextEl.textContent = `Failed to pull ${model}: ${e?.message || e}`;
          showToast(`Failed to install model: ${e?.message || e}`, 'error');
          modelBannerBtn.disabled = false;
          modelBannerBtn.textContent = originalText;
        }
      };
    }
  } catch (_) {}
});

// Theme toggle
toggleThemeBtn?.addEventListener('click', handleToggleTheme);

// Code view toggle for output (simple heuristic: if it looks like code, render highlighted)
toggleCodeBtn?.addEventListener('click', handleToggleCode);

// Diff vs last input (simple word diff)
function computeDiff(a, b) {
  const aw = a.split(/(\s+)/);
  const bw = b.split(/(\s+)/);
  const max = Math.max(aw.length, bw.length);
  const out = [];
  for (let i = 0; i < max; i++) {
    const x = aw[i] || '';
    const y = bw[i] || '';
    if (x === y) { out.push(x); continue; }
    if (x && !y) { out.push(`<span class="diff-del">${x}</span>`); continue; }
    if (!x && y) { out.push(`<span class="diff-add">${y}</span>`); continue; }
    out.push(`<span class="diff-del">${x}</span><span class="diff-add">${y}</span>`);
  }
  return out.join('');
}

showDiffBtn?.addEventListener('click', handleShowDiff);

// Enhanced Keyboard shortcuts with command palette
const keyboardShortcuts = {
  '⌘+Enter': () => generate(),
  '⌘+Shift+Enter': () => generate('devils_advocate'),
  '⌘+S': () => saveSessionBtn?.click(),
  '⌘+E': () => exportSessionBtn?.click(),
  '⌘+D': () => dashboardBtn?.click(),
  '⌘+K': () => openCommandPalette(),
  '⌘+T': () => handleToggleTheme(),
  '⌘+N': () => handleNewSession(),
  '⌘+1': () => selectPersona('logician'),
  '⌘+2': () => selectPersona('market_cynic'),
  '⌘+3': () => selectPersona('lateral_thinker'),
  '⌘+4': () => selectPersona('five_whys'),
  'Escape': () => {
    if (state.isGenerating) {
      // Cancel generation if possible
      if (state.activeRequestId) {
        // Note: Ollama doesn't support cancellation, but we can stop processing
        state.activeRequestId = null;
        setGenerating(false);
        showToast('Generation cancelled', 'info');
      }
    } else {
      // Clear current session
      clearCurrentSession();
    }
  }
};

// Command palette functionality
function openCommandPalette() {
  const commands = [
    { key: '⌘+Enter', label: 'Generate Response', action: () => generate() },
    { key: '⌘+Shift+Enter', label: 'Devil\'s Advocate', action: () => generate('devils_advocate') },
    { key: '⌘+S', label: 'Save Session', action: () => saveSessionBtn?.click() },
    { key: '⌘+E', label: 'Export Session (Markdown)', action: () => exportSessionBtn?.click() },
    { key: '', label: 'Export as PDF', action: () => exportSession('pdf') },
    { key: '', label: 'Export as JSON', action: () => exportSession('json') },
    { key: '', label: 'Export as HTML', action: () => exportSession('html') },
    { key: '⌘+D', label: 'Open Dashboard', action: () => dashboardBtn?.click() },
    { key: '⌘+T', label: 'Toggle Theme', action: () => handleToggleTheme() },
    { key: '⌘+N', label: 'New Session', action: () => handleNewSession() },
    { key: '⌘+1', label: 'The Logician', action: () => selectPersona('logician') },
    { key: '⌘+2', label: 'The Market Cynic', action: () => selectPersona('market_cynic') },
    { key: '⌘+3', label: 'The Lateral Thinker', action: () => selectPersona('lateral_thinker') },
    { key: '⌘+4', label: 'The Five Whys Toddler', action: () => selectPersona('five_whys') },
    { key: '⌘+C', label: 'Copy Response', action: () => copyBtn?.click() },
    { key: '⌘+M', label: 'Toggle Code View', action: () => toggleCodeBtn?.click() },
    { key: '⌘+F', label: 'Focus Input', action: () => userInputEl?.focus() },
    { key: '⌘+P', label: 'Manage Personas', action: () => managePersonasBtn?.click() },
    { key: '⌘+G', label: 'Toggle Diff View', action: () => showDiffBtn?.click() },
    { key: 'Escape', label: 'Clear Session', action: () => clearCurrentSession() },
    { key: '', label: 'Clear Response Cache', action: () => {
      state.responseCache.clear();
      showToast('Response cache cleared', 'info');
      closeCommandPalette();
    }},
    { key: '', label: 'Clear Draft', action: () => {
      clearDraft();
      showToast('Draft cleared', 'info');
      closeCommandPalette();
    }},
    { key: '', label: 'Create Branch', action: () => {
      createConversationBranch();
      closeCommandPalette();
    }},
    { key: '', label: 'Toggle Branch Comparison', action: () => {
      toggleBranchComparison();
      closeCommandPalette();
    }},
    { key: '', label: 'Compare Models', action: () => {
      compareModels();
      closeCommandPalette();
    }},
    { key: '', label: 'Get Context Suggestions', action: () => {
      getContextSuggestions();
      closeCommandPalette();
    }},
    { key: '', label: 'View Memory Stats', action: () => {
      showMemoryStats();
      closeCommandPalette();
    }},
    { key: '', label: 'Clear Conversation Memory', action: () => {
      clearConversationMemory();
      closeCommandPalette();
    }}
  ];

  // Create command palette modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.7); 
    display: flex; align-items: center; justify-content: center; z-index: 10000;
  `;
  
  const palette = document.createElement('div');
  palette.style.cssText = `
    width: 500px; max-width: 90vw; background: var(--panel); 
    border: 1px solid var(--border); border-radius: 12px; 
    padding: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'Command Palette';
  title.style.cssText = 'margin: 0 0 16px 0; color: var(--text); font-size: 18px;';
  
  const searchInput = document.createElement('input');
  searchInput.placeholder = 'Search commands...';
  searchInput.style.cssText = `
    width: 100%; padding: 12px; margin-bottom: 16px; 
    background: var(--bg); border: 1px solid var(--border); 
    border-radius: 8px; color: var(--text); font-size: 14px;
  `;
  
  const commandsList = document.createElement('div');
  commandsList.style.cssText = 'max-height: 300px; overflow-y: auto;';
  
  function renderCommands(filter = '') {
    commandsList.innerHTML = '';
    const filtered = commands.filter(cmd => 
      cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.key.toLowerCase().includes(filter.toLowerCase())
    );
    
    filtered.forEach(cmd => {
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        padding: 12px; margin-bottom: 4px; border-radius: 8px;
        cursor: pointer; transition: background 0.2s;
      `;
      item.innerHTML = `
        <span style="color: var(--text);">${cmd.label}</span>
        <span style="color: var(--muted); font-size: 12px; font-family: monospace;">${cmd.key}</span>
      `;
      
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(122, 162, 247, 0.1)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });
      
      item.addEventListener('click', () => {
        cmd.action();
        closeCommandPalette();
      });
      
      commandsList.appendChild(item);
    });
  }
  
  searchInput.addEventListener('input', (e) => {
    renderCommands(e.target.value);
  });
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.cssText = `
    margin-top: 16px; padding: 8px 16px; background: var(--accent);
    color: white; border: none; border-radius: 6px; cursor: pointer;
  `;
  closeBtn.addEventListener('click', closeCommandPalette);
  
  function closeCommandPalette() {
    modal.remove();
  }
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCommandPalette();
  });
  
  palette.appendChild(title);
  palette.appendChild(searchInput);
  palette.appendChild(commandsList);
  palette.appendChild(closeBtn);
  modal.appendChild(palette);
  document.body.appendChild(modal);
  
  // Focus search input
  searchInput.focus();
  renderCommands();
}

// Helper function to select persona
function selectPersona(persona) {
  const btn = document.querySelector(`[data-persona="${persona}"]`);
  if (btn) {
    personaButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedPersona = persona;
    state.customPrompt = undefined;
    showToast(`Switched to ${btn.textContent}`, 'info', 2000);
  }
}

// Enhanced keyboard event handler
window.addEventListener('keydown', (e) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
  const shiftKey = e.shiftKey;
  
  // Handle modifier combinations
  if (ctrlKey && !shiftKey && e.key.toLowerCase() === 'enter') {
    e.preventDefault();
    generate();
  } else if (ctrlKey && shiftKey && e.key.toLowerCase() === 'enter') {
    e.preventDefault();
    generate('devils_advocate');
  } else if (ctrlKey && e.key.toLowerCase() === 's') {
    e.preventDefault();
    saveSessionBtn?.click();
  } else if (ctrlKey && e.key.toLowerCase() === 'e') {
    e.preventDefault();
    exportSessionBtn?.click();
  } else if (ctrlKey && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    dashboardBtn?.click();
  } else if (ctrlKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openCommandPalette();
  } else if (ctrlKey && e.key.toLowerCase() === 't') {
    e.preventDefault();
    handleToggleTheme();
  } else if (ctrlKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    handleNewSession();
  } else if (ctrlKey && e.key >= '1' && e.key <= '4') {
    e.preventDefault();
    const personas = ['logician', 'market_cynic', 'lateral_thinker', 'five_whys'];
    selectPersona(personas[parseInt(e.key) - 1]);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    if (state.isGenerating) {
      // Cancel generation if possible
      if (state.activeRequestId) {
        state.activeRequestId = null;
        setGenerating(false);
        showToast('Generation cancelled', 'info');
      }
    } else {
      clearCurrentSession();
    }
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const buttons = Array.from(document.querySelectorAll('.persona'));
    const idx = buttons.findIndex((b) => b.classList.contains('active'));
    if (idx >= 0) {
      const nextIdx = e.key === 'ArrowRight' ? (idx + 1) % buttons.length : (idx - 1 + buttons.length) % buttons.length;
      buttons[nextIdx]?.click();
    }
  } else if (ctrlKey && e.key.toLowerCase() === 'c') {
    // Copy current response
    e.preventDefault();
    copyBtn?.click();
  } else if (ctrlKey && e.key.toLowerCase() === 'm') {
    // Toggle code view
    e.preventDefault();
    toggleCodeBtn?.click();
  } else if (ctrlKey && e.key.toLowerCase() === 'f') {
    // Focus on input
    e.preventDefault();
    userInputEl?.focus();
  } else if (ctrlKey && e.key.toLowerCase() === 'p') {
    // Open personas modal
    e.preventDefault();
    managePersonasBtn?.click();
  } else if (ctrlKey && e.key.toLowerCase() === 'g') {
    // Toggle diff view
    e.preventDefault();
    showDiffBtn?.click();
  }
});

// --- Custom Personas UI ---
async function refreshPersonasUI() {
  if (!personasListEl) return;
  personasListEl.innerHTML = '';
  try {
    const res = await window.CODE?.['db:list-personas']?.();
    if (!res?.ok) {
      personasListEl.innerHTML = `<div class="muted">Failed to load personas: ${res?.error || 'unknown'}</div>`;
      return;
    }
    const { personas } = res;
    if (!Array.isArray(personas) || personas.length === 0) {
      personasListEl.innerHTML = '<div class="muted">No custom personas yet.</div>';
      return;
    }
    personas.forEach((p) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '8px';
      row.style.alignItems = 'center';
      row.style.marginBottom = '6px';
      const btn = document.createElement('button');
      btn.className = 'persona';
      btn.textContent = p.name;
      btn.onclick = () => {
        // Switch to custom prompt mode
        state.customPrompt = p.prompt;
        state.selectedPersona = 'logician'; // base persona fallback, not used when customPrompt is set
        personaButtons.forEach((b) => b.classList.remove('active'));
        personasModal.style.display = 'none';
      };
      const del = document.createElement('button');
      del.className = 'ghost';
      del.textContent = 'Delete';
      del.onclick = async () => {
        try { await window.CODE?.['db:delete-persona']?.(p.id); refreshPersonasUI(); } catch (_) {}
      };
      row.appendChild(btn);
      row.appendChild(del);
      personasListEl.appendChild(row);
    });
  } catch (e) {
    personasListEl.innerHTML = `<div class="muted">Unexpected error: ${e?.message || e}</div>`;
  }
}

managePersonasBtn?.addEventListener('click', async () => {
  if (personasModal) {
    personasModal.style.display = 'flex';
    await refreshPersonasUI();
  }
});
closePersonasBtn?.addEventListener('click', () => { if (personasModal) personasModal.style.display = 'none'; });

// Export personas
document.getElementById('exportPersonasBtn')?.addEventListener('click', async () => {
  try {
    const result = await window.CODE?.['persona:export-all']?.();
    if (result?.ok && result.data) {
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `code-personas-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Personas exported successfully', 'success');
    } else {
      showToast(result?.error || 'Failed to export personas', 'error');
    }
  } catch (err) {
    showToast('Failed to export personas', 'error');
  }
});

// Import personas
document.getElementById('importPersonasBtn')?.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate the data structure
      if (!Array.isArray(data) || !data.every(p => p.name && p.prompt)) {
        showToast('Invalid personas file format', 'error');
        return;
      }
      
      // Import each persona
      let imported = 0;
      for (const persona of data) {
        const result = await window.CODE?.['db:create-persona']?.({
          name: persona.name,
          prompt: persona.prompt
        });
        if (result?.ok) imported++;
      }
      
      if (imported > 0) {
        showToast(`Imported ${imported} personas successfully`, 'success');
        await refreshPersonasUI();
      } else {
        showToast('No personas were imported', 'error');
      }
    } catch (err) {
      showToast('Failed to import personas file', 'error');
    }
  };
  input.click();
});

addPersonaBtn?.addEventListener('click', async () => {
  try {
    const name = (personaNameInput?.value || '').trim();
    const prompt = (personaPromptInput?.value || '').trim();
    if (!name || !prompt) return;
    await window.CODE?.['db:create-persona']?.({ name, prompt });
    personaNameInput.value = '';
    personaPromptInput.value = '';
    await refreshPersonasUI();
  } catch (_) {}
});

