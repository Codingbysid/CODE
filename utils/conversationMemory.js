/**
 * Conversation memory and context awareness utilities
 */

class ConversationMemory {
  constructor() {
    this.memory = new Map();
    this.maxMemorySize = 50;
    this.contextWindow = 10; // Number of recent conversations to consider
  }

  /**
   * Stores a conversation in memory
   * @param {string} sessionId - Unique session identifier
   * @param {Object} conversation - Conversation data
   */
  storeConversation(sessionId, conversation) {
    const memoryEntry = {
      id: sessionId,
      timestamp: Date.now(),
      persona: conversation.persona,
      model: conversation.model,
      userInput: conversation.userInput,
      aiResponse: conversation.aiResponse,
      context: this.extractContext(conversation.userInput),
      sentiment: this.analyzeSentiment(conversation.userInput),
      topics: this.extractTopics(conversation.userInput),
      quality: this.assessResponseQuality(conversation.aiResponse)
    };

    this.memory.set(sessionId, memoryEntry);
    this.cleanupMemory();
  }

  /**
   * Retrieves relevant context for current conversation
   * @param {string} currentInput - Current user input
   * @param {string} currentPersona - Current persona
   * @returns {Object} Relevant context
   */
  getRelevantContext(currentInput, currentPersona) {
    const currentContext = this.extractContext(currentInput);
    const currentTopics = this.extractTopics(currentInput);
    const currentSentiment = this.analyzeSentiment(currentInput);

    const relevantMemories = [];
    
    for (const [sessionId, memory] of this.memory) {
      let relevanceScore = 0;

      // Topic similarity
      const topicOverlap = this.calculateTopicOverlap(currentTopics, memory.topics);
      relevanceScore += topicOverlap * 0.4;

      // Context similarity
      const contextSimilarity = this.calculateContextSimilarity(currentContext, memory.context);
      relevanceScore += contextSimilarity * 0.3;

      // Persona consistency
      if (memory.persona === currentPersona) {
        relevanceScore += 0.2;
      }

      // Sentiment consistency
      if (memory.sentiment === currentSentiment) {
        relevanceScore += 0.1;
      }

      if (relevanceScore > 0.3) {
        relevantMemories.push({
          ...memory,
          relevanceScore
        });
      }
    }

    // Sort by relevance and recency
    relevantMemories.sort((a, b) => {
      const scoreDiff = b.relevanceScore - a.relevanceScore;
      if (Math.abs(scoreDiff) < 0.1) {
        return b.timestamp - a.timestamp; // More recent first
      }
      return scoreDiff;
    });

    return {
      relevantMemories: relevantMemories.slice(0, 5),
      contextSummary: this.generateContextSummary(relevantMemories),
      suggestions: this.generateSuggestions(currentInput, relevantMemories)
    };
  }

  /**
   * Extracts context from user input
   * @param {string} input - User input text
   * @returns {Object} Extracted context
   */
  extractContext(input) {
    const context = {
      domain: this.identifyDomain(input),
      intent: this.identifyIntent(input),
      complexity: this.assessComplexity(input),
      questionType: this.identifyQuestionType(input)
    };

    return context;
  }

  /**
   * Identifies the domain of the input
   * @param {string} input - User input
   * @returns {string} Domain category
   */
  identifyDomain(input) {
    const domains = {
      business: ['business', 'company', 'startup', 'market', 'revenue', 'profit', 'investment', 'funding'],
      technology: ['tech', 'software', 'app', 'code', 'programming', 'development', 'AI', 'machine learning'],
      academic: ['research', 'study', 'thesis', 'paper', 'hypothesis', 'theory', 'analysis'],
      personal: ['personal', 'life', 'career', 'relationship', 'health', 'family'],
      creative: ['creative', 'design', 'art', 'writing', 'story', 'idea', 'concept']
    };

    const lowerInput = input.toLowerCase();
    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        return domain;
      }
    }

    return 'general';
  }

  /**
   * Identifies the intent of the input
   * @param {string} input - User input
   * @returns {string} Intent category
   */
  identifyIntent(input) {
    const intents = {
      question: ['?', 'what', 'how', 'why', 'when', 'where', 'who'],
      request: ['please', 'can you', 'could you', 'help me', 'analyze'],
      statement: ['.', '!', 'i think', 'i believe', 'my opinion'],
      challenge: ['challenge', 'critique', 'disagree', 'wrong', 'flawed']
    };

    const lowerInput = input.toLowerCase();
    for (const [intent, indicators] of Object.entries(intents)) {
      if (indicators.some(indicator => lowerInput.includes(indicator))) {
        return intent;
      }
    }

    return 'statement';
  }

  /**
   * Assesses the complexity of the input
   * @param {string} input - User input
   * @returns {string} Complexity level
   */
  assessComplexity(input) {
    const wordCount = input.split(' ').length;
    const sentenceCount = input.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentenceCount;

    if (wordCount < 20 || avgWordsPerSentence < 8) {
      return 'simple';
    } else if (wordCount < 100 || avgWordsPerSentence < 15) {
      return 'moderate';
    } else {
      return 'complex';
    }
  }

  /**
   * Identifies the type of question
   * @param {string} input - User input
   * @returns {string} Question type
   */
  identifyQuestionType(input) {
    if (!input.includes('?')) return 'statement';

    const questionTypes = {
      yes_no: ['is', 'are', 'was', 'were', 'do', 'does', 'did', 'can', 'could', 'will', 'would'],
      what: ['what'],
      how: ['how'],
      why: ['why'],
      when: ['when'],
      where: ['where'],
      who: ['who']
    };

    const lowerInput = input.toLowerCase();
    for (const [type, keywords] of Object.entries(questionTypes)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        return type;
      }
    }

    return 'open';
  }

  /**
   * Extracts topics from input
   * @param {string} input - User input
   * @returns {Array} Extracted topics
   */
  extractTopics(input) {
    // Simple keyword extraction - in a real implementation, you'd use NLP
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
    
    const words = input.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));

    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Return top topics
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Analyzes sentiment of input
   * @param {string} input - User input
   * @returns {string} Sentiment
   */
  analyzeSentiment(input) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'enjoy', 'happy', 'excited', 'optimistic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'sad', 'disappointed', 'worried', 'concerned', 'pessimistic'];

    const lowerInput = input.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerInput.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerInput.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Assesses the quality of AI response
   * @param {string} response - AI response
   * @returns {string} Quality assessment
   */
  assessResponseQuality(response) {
    const length = response.length;
    const hasStructure = response.includes('##') || response.includes('•') || response.includes('-');
    const hasQuestions = response.includes('?');
    const hasExamples = response.includes('for example') || response.includes('such as');

    let qualityScore = 0;
    if (length > 100) qualityScore += 1;
    if (hasStructure) qualityScore += 1;
    if (hasQuestions) qualityScore += 1;
    if (hasExamples) qualityScore += 1;

    if (qualityScore >= 3) return 'high';
    if (qualityScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Calculates topic overlap between two topic arrays
   * @param {Array} topics1 - First topic array
   * @param {Array} topics2 - Second topic array
   * @returns {number} Overlap score (0-1)
   */
  calculateTopicOverlap(topics1, topics2) {
    if (topics1.length === 0 || topics2.length === 0) return 0;
    
    const set1 = new Set(topics1);
    const set2 = new Set(topics2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    return intersection.size / Math.max(set1.size, set2.size);
  }

  /**
   * Calculates context similarity
   * @param {Object} context1 - First context
   * @param {Object} context2 - Second context
   * @returns {number} Similarity score (0-1)
   */
  calculateContextSimilarity(context1, context2) {
    let similarity = 0;
    const factors = ['domain', 'intent', 'complexity', 'questionType'];
    
    factors.forEach(factor => {
      if (context1[factor] === context2[factor]) {
        similarity += 0.25;
      }
    });

    return similarity;
  }

  /**
   * Generates a context summary
   * @param {Array} memories - Relevant memories
   * @returns {string} Context summary
   */
  generateContextSummary(memories) {
    if (memories.length === 0) return '';

    const domains = memories.map(m => m.context.domain);
    const mostCommonDomain = domains.sort((a,b) =>
      domains.filter(v => v === a).length - domains.filter(v => v === b).length
    ).pop();

    const recentTopics = memories.slice(0, 3).flatMap(m => m.topics);
    const uniqueTopics = [...new Set(recentTopics)].slice(0, 3);

    return `Previous discussions focused on ${mostCommonDomain} topics including ${uniqueTopics.join(', ')}.`;
  }

  /**
   * Generates suggestions based on context
   * @param {string} currentInput - Current input
   * @param {Array} memories - Relevant memories
   * @returns {Array} Suggestions
   */
  generateSuggestions(currentInput, memories) {
    const suggestions = [];

    if (memories.length > 0) {
      const recentMemory = memories[0];
      
      if (recentMemory.context.domain === 'business') {
        suggestions.push('Consider market competition and customer acquisition costs');
        suggestions.push('Think about scalability and operational challenges');
      } else if (recentMemory.context.domain === 'technology') {
        suggestions.push('Consider technical debt and maintenance costs');
        suggestions.push('Think about security and performance implications');
      }
    }

    if (currentInput.toLowerCase().includes('startup') || currentInput.toLowerCase().includes('business')) {
      suggestions.push('What problem does this solve for customers?');
      suggestions.push('How will you acquire your first 100 customers?');
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Cleans up old memories to prevent memory bloat
   */
  cleanupMemory() {
    if (this.memory.size > this.maxMemorySize) {
      const entries = Array.from(this.memory.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, entries.length - this.maxMemorySize);
      toDelete.forEach(([sessionId]) => {
        this.memory.delete(sessionId);
      });
    }
  }

  /**
   * Gets memory statistics
   * @returns {Object} Memory statistics
   */
  getMemoryStats() {
    const memories = Array.from(this.memory.values());
    const domains = memories.map(m => m.context.domain);
    const personas = memories.map(m => m.persona);
    
    return {
      totalMemories: this.memory.size,
      mostCommonDomain: domains.sort((a,b) =>
        domains.filter(v => v === a).length - domains.filter(v => v === b).length
      ).pop(),
      mostUsedPersona: personas.sort((a,b) =>
        personas.filter(v => v === a).length - personas.filter(v => v === b).length
      ).pop(),
      averageQuality: memories.reduce((sum, m) => {
        const qualityScores = { low: 1, medium: 2, high: 3 };
        return sum + qualityScores[m.quality];
      }, 0) / memories.length
    };
  }

  /**
   * Clears all memory
   */
  clearMemory() {
    this.memory.clear();
  }
}

module.exports = ConversationMemory;
