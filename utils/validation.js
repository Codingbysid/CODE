/**
 * Input validation utilities
 */

const { CONFIG } = require('../config');

class Validator {
  /**
   * Validates model name
   * @param {string} model - Model name to validate
   * @returns {Object} Validation result
   */
  static validateModel(model) {
    if (!model || typeof model !== 'string') {
      return { valid: false, error: 'Model name is required' };
    }

    if (model.trim().length === 0) {
      return { valid: false, error: 'Model name cannot be empty' };
    }

    // Check for potentially dangerous characters
    if (/[<>:"/\\|?*]/.test(model)) {
      return { valid: false, error: 'Model name contains invalid characters' };
    }

    return { valid: true };
  }

  /**
   * Validates temperature value
   * @param {number} temperature - Temperature to validate
   * @returns {Object} Validation result
   */
  static validateTemperature(temperature) {
    if (temperature === undefined || temperature === null) {
      return { valid: true }; // Optional parameter
    }

    const num = Number(temperature);
    if (isNaN(num)) {
      return { valid: false, error: 'Temperature must be a number' };
    }

    if (num < 0 || num > 2) {
      return { valid: false, error: 'Temperature must be between 0 and 2' };
    }

    return { valid: true };
  }

  /**
   * Validates max tokens value
   * @param {number} maxTokens - Max tokens to validate
   * @returns {Object} Validation result
   */
  static validateMaxTokens(maxTokens) {
    if (maxTokens === undefined || maxTokens === null || maxTokens === '') {
      return { valid: true }; // Optional parameter
    }

    const num = Number(maxTokens);
    if (isNaN(num)) {
      return { valid: false, error: 'Max tokens must be a number' };
    }

    if (num < 1) {
      return { valid: false, error: 'Max tokens must be a positive number' };
    }

    if (num > 100000) {
      return { valid: false, error: 'Max tokens cannot exceed 100,000' };
    }

    return { valid: true };
  }

  /**
   * Validates persona selection
   * @param {string} persona - Persona to validate
   * @returns {Object} Validation result
   */
  static validatePersona(persona) {
    if (!persona || typeof persona !== 'string') {
      return { valid: false, error: 'Persona is required' };
    }

    const validPersonas = ['logician', 'market_cynic', 'lateral_thinker', 'five_whys'];
    if (!validPersonas.includes(persona) && !persona.startsWith('custom_')) {
      return { valid: false, error: 'Invalid persona selection' };
    }

    return { valid: true };
  }

  /**
   * Validates user input text
   * @param {string} text - Text to validate
   * @returns {Object} Validation result
   */
  static validateUserText(text) {
    if (!text || typeof text !== 'string') {
      return { valid: false, error: 'Text input is required' };
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Please enter some text to analyze' };
    }

    if (trimmed.length > 10000) {
      return { valid: false, error: 'Text input is too long (max 10,000 characters)' };
    }

    return { valid: true };
  }

  /**
   * Validates session data
   * @param {Object} session - Session data to validate
   * @returns {Object} Validation result
   */
  static validateSession(session) {
    if (!session || typeof session !== 'object') {
      return { valid: false, error: 'Session data is required' };
    }

    const { persona, model, history } = session;

    // Validate persona
    const personaValidation = this.validatePersona(persona);
    if (!personaValidation.valid) {
      return personaValidation;
    }

    // Validate model
    const modelValidation = this.validateModel(model);
    if (!modelValidation.valid) {
      return modelValidation;
    }

    // Validate history
    if (!Array.isArray(history)) {
      return { valid: false, error: 'History must be an array' };
    }

    for (const [index, turn] of history.entries()) {
      if (!turn || typeof turn !== 'object') {
        return { valid: false, error: `Invalid history entry at index ${index}` };
      }

      if (!turn.role || !['user', 'assistant', 'system'].includes(turn.role)) {
        return { valid: false, error: `Invalid role in history entry at index ${index}` };
      }

      if (typeof turn.content !== 'string') {
        return { valid: false, error: `Invalid content in history entry at index ${index}` };
      }
    }

    return { valid: true };
  }

  /**
   * Validates persona data
   * @param {Object} persona - Persona data to validate
   * @returns {Object} Validation result
   */
  static validatePersonaData(persona) {
    if (!persona || typeof persona !== 'object') {
      return { valid: false, error: 'Persona data is required' };
    }

    const { name, prompt } = persona;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return { valid: false, error: 'Persona name is required' };
    }

    if (name.length > 100) {
      return { valid: false, error: 'Persona name is too long (max 100 characters)' };
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return { valid: false, error: 'Persona prompt is required' };
    }

    if (prompt.length > 5000) {
      return { valid: false, error: 'Persona prompt is too long (max 5,000 characters)' };
    }

    return { valid: true };
  }

  /**
   * Sanitizes user input
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .slice(0, 10000); // Limit length
  }

  /**
   * Validates and sanitizes all input parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result with sanitized data
   */
  static validateAndSanitize(params) {
    const errors = [];
    const sanitized = {};

    // Validate and sanitize each parameter
    if (params.userText !== undefined) {
      const validation = this.validateUserText(params.userText);
      if (!validation.valid) {
        errors.push(validation.error);
      } else {
        sanitized.userText = this.sanitizeInput(params.userText);
      }
    }

    if (params.model !== undefined) {
      const validation = this.validateModel(params.model);
      if (!validation.valid) {
        errors.push(validation.error);
      } else {
        sanitized.model = params.model.trim();
      }
    }

    if (params.persona !== undefined) {
      const validation = this.validatePersona(params.persona);
      if (!validation.valid) {
        errors.push(validation.error);
      } else {
        sanitized.persona = params.persona;
      }
    }

    if (params.temperature !== undefined) {
      const validation = this.validateTemperature(params.temperature);
      if (!validation.valid) {
        errors.push(validation.error);
      } else {
        sanitized.temperature = Number(params.temperature);
      }
    }

    if (params.maxTokens !== undefined) {
      const validation = this.validateMaxTokens(params.maxTokens);
      if (!validation.valid) {
        errors.push(validation.error);
      } else {
        sanitized.maxTokens = Number(params.maxTokens);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data: sanitized
    };
  }
}

module.exports = Validator;
