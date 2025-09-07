/**
 * Centralized configuration for CODE application
 */

const CONFIG = {
  // Application settings
  APP_NAME: 'CODE — Cognitive Dissonance Engine',
  VERSION: '0.1.0',
  
  // Window settings
  WINDOW: {
    WIDTH: 980,
    HEIGHT: 720,
    MIN_WIDTH: 880,
    MIN_HEIGHT: 640
  },
  
  // Ollama settings
  OLLAMA: {
    BASE_URL: 'http://127.0.0.1:11434',
    DEFAULT_MODEL: 'llama3:8b',
    TIMEOUT: 120000, // 2 minutes
    HEALTH_CHECK_INTERVAL: 30000 // 30 seconds
  },
  
  // Database settings
  DATABASE: {
    FILENAME: 'code_sessions.db',
    BACKUP_INTERVAL: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Performance settings
  PERFORMANCE: {
    CACHE_SIZE_LIMIT: 100,
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_BASE_DELAY: 1000,
    RETRY_MAX_DELAY: 10000
  },
  
  // UI settings
  UI: {
    TOAST_DURATION: 4000,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    DRAFT_EXPIRY: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Built-in persona system prompts
const PERSONA_SYSTEM_PROMPTS = {
  logician: 'You are The Logician. Identify logical fallacies, unstated assumptions, and reasoning gaps. Be precise and grounded. Challenge, do not agree.',
  market_cynic: 'You are The Market Cynic. Provide ruthless market-based criticism: viability, competition, distribution, margins, and willingness-to-pay. Be terse and unsentimental.',
  lateral_thinker: 'You are The Lateral Thinker. Derail assumptions with unexpected "What if...?" scenarios, contrarian angles, and adjacent possibilities. Prioritize novelty that forces reconsideration.',
  five_whys: 'You are The "Five Whys" Toddler. Ask iterative whys to push towards first principles. Be relentless yet concise. Prefer numbered sequences of why-questions with brief rationales.'
};

// Devil's Advocate mode prompt
const DEVILS_ADVOCATE_PROMPT = `
Mode: Devil's Advocate. Produce the strongest possible counterargument to the user's text. Be incisive, evidence-seeking, and assume the user is wrong unless justified. Use concise section headers and bulleted lists. Structure strictly as:

## Steelman
- One to two lines summarizing the user's best-case argument.

## Vulnerabilities
- Bullet key flaws, contradictions, and missing premises.
- Prioritize the highest-impact risks first.

## Counterevidence
- Bullet concrete counterexamples, data points, or citations to seek.

## Next Probes
- Two sharp questions that would most change the conclusion if answered.

Do not offer solutions. Do not hedge.`;

module.exports = {
  CONFIG,
  PERSONA_SYSTEM_PROMPTS,
  DEVILS_ADVOCATE_PROMPT
};
