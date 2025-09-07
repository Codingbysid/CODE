// Common constants for main/preload
module.exports = {
  DEFAULT_MODEL: 'llama3:8b',
  PERSONA_TITLES: {
    logician: 'The Logician',
    market_cynic: 'The Market Cynic',
    lateral_thinker: 'The Lateral Thinker',
    five_whys: 'The "Five Whys" Toddler',
  },
  IPC: {
    GENERATE: 'generate',
    GENERATE_STREAM: 'generate-stream',
    DB_SAVE_SESSION: 'db:save-session',
    DB_GET_ALL: 'db:get-all-sessions',
    DB_GET_HISTORY: 'db:get-session-history',
    DB_DELETE_SESSION: 'db:delete-session',
    DB_UPDATE_META: 'db:update-session-meta',
    DB_LIST_PERSONAS: 'db:list-personas',
    DB_CREATE_PERSONA: 'db:create-persona',
    DB_DELETE_PERSONA: 'db:delete-persona',
    PERSONA_EXPORT_ALL: 'persona:export-all',
    PERSONA_IMPORT: 'persona:import',
    FS_EXPORT_MD: 'fs:export-md',
    FS_EXPORT_PDF: 'fs:export-pdf',
    OLLAMA_MODEL_EXISTS: 'ollama:model-exists',
    OLLAMA_PULL_MODEL: 'ollama:pull-model',
  }
};


