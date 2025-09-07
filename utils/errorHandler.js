/**
 * Centralized error handling utilities
 */

const { CONFIG } = require('../config');

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  /**
   * Logs an error with context
   * @param {Error} error - The error object
   * @param {Object} context - Additional context information
   * @param {string} severity - Error severity level
   */
  logError(error, context = {}, severity = 'error') {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      severity
    };

    this.errorLog.push(errorEntry);
    
    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${severity.toUpperCase()}]`, errorEntry);
    }
  }

  /**
   * Handles database errors gracefully
   * @param {Error} error - Database error
   * @param {string} operation - Database operation being performed
   * @returns {Object} User-friendly error response
   */
  handleDatabaseError(error, operation) {
    this.logError(error, { operation }, 'warn');
    
    return {
      ok: false,
      error: 'Database operation failed',
      hint: 'The app will work without database features. Try restarting the application.',
      graceful: true
    };
  }

  /**
   * Handles Ollama connection errors
   * @param {Error} error - Ollama error
   * @param {string} operation - Operation being performed
   * @returns {Object} User-friendly error response
   */
  handleOllamaError(error, operation) {
    this.logError(error, { operation }, 'error');
    
    const suggestions = [
      'Check if Ollama is running: `ollama serve` or `brew services start ollama`',
      'Verify the model is installed: `ollama pull llama3:8b`',
      'Try restarting Ollama service',
      'Check if port 11434 is available'
    ];

    return {
      ok: false,
      error: `Ollama connection failed: ${error.message}`,
      hint: suggestions.join('\n'),
      suggestions
    };
  }

  /**
   * Handles validation errors
   * @param {string} field - Field that failed validation
   * @param {string} value - Invalid value
   * @param {string} rule - Validation rule that failed
   * @returns {Object} User-friendly error response
   */
  handleValidationError(field, value, rule) {
    const error = new Error(`Validation failed for ${field}: ${rule}`);
    this.logError(error, { field, value, rule }, 'warn');

    return {
      ok: false,
      error: `Invalid ${field}`,
      hint: this.getValidationHint(field, rule),
      field,
      value
    };
  }

  /**
   * Gets validation hints for specific fields and rules
   * @param {string} field - Field name
   * @param {string} rule - Validation rule
   * @returns {string} Helpful hint
   */
  getValidationHint(field, rule) {
    const hints = {
      temperature: 'Temperature must be between 0 and 2',
      maxTokens: 'Max tokens must be a positive number',
      model: 'Model name cannot be empty',
      persona: 'Please select a valid persona',
      userText: 'Please enter some text to analyze'
    };

    return hints[field] || 'Please check your input and try again';
  }

  /**
   * Creates a safe error boundary for async operations
   * @param {Function} operation - Async operation to wrap
   * @param {Object} context - Context for error logging
   * @returns {Function} Wrapped function with error handling
   */
  createErrorBoundary(operation, context = {}) {
    return async (...args) => {
      try {
        return await operation(...args);
      } catch (error) {
        this.logError(error, context, 'error');
        return {
          ok: false,
          error: error.message || 'An unexpected error occurred',
          hint: 'Please try again or restart the application'
        };
      }
    };
  }

  /**
   * Gets recent error log
   * @param {number} limit - Number of recent errors to return
   * @returns {Array} Recent error entries
   */
  getRecentErrors(limit = 10) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clears error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

module.exports = errorHandler;
