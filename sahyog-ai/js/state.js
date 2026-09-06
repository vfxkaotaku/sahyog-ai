/**
 * state.js — SAHYOG AI
 * Centralized reactive state manager using observer pattern.
 * All chat state lives here — no state scattered in UI components.
 */

var SAHYOG = window.SAHYOG = window.SAHYOG || {};

SAHYOG.State = (function () {
  // ── Private ─────────────────────────────────────────────────
  let _state = {
    messages: [],           // Message[]
    selectedLanguage: 'en', // 'en' | 'hi' | 'mr'
    isThinking: false,      // AI generating response
    isListening: false,     // STT active (future)
    isSpeaking: false,      // TTS active (future)
    isDemoMode: true,       // Always true until real backend
    conversationId: null    // UUID for current conversation
  };

  const _listeners = [];

  // ── Helpers ─────────────────────────────────────────────────
  function _uid(prefix) {
    return (prefix || 'id') + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function _emit() {
    _listeners.forEach(function (fn) {
      try { fn(Object.assign({}, _state, { messages: _state.messages.slice() })); }
      catch (e) { console.error('[SAHYOG State] Listener error:', e); }
    });
  }

  function _persist() {
    // Don't persist transient flags
    if (!_state.isThinking && !_state.isListening) {
      SAHYOG.Storage.save(_state);
    }
  }

  // ── Public API ───────────────────────────────────────────────
  function get() {
    return Object.assign({}, _state, { messages: _state.messages.slice() });
  }

  function set(updates) {
    _state = Object.assign({}, _state, updates);
    _emit();
    _persist();
  }

  /**
   * Subscribe to state changes.
   * @param {function} fn - Called with the current state snapshot on every change.
   * @returns {function} Unsubscribe function.
   */
  function subscribe(fn) {
    _listeners.push(fn);
    return function unsubscribe() {
      var idx = _listeners.indexOf(fn);
      if (idx !== -1) _listeners.splice(idx, 1);
    };
  }

  /**
   * Add a message to the conversation.
   * @param {object} partial - { role, content, type?, language?, sources?, suggestions? }
   * @returns {object} The complete message object.
   */
  function addMessage(partial) {
    var msg = {
      id: _uid('msg'),
      role: partial.role || 'user',
      content: partial.content || '',
      timestamp: new Date().toISOString(),
      language: partial.language || _state.selectedLanguage,
      type: partial.type || 'text',
      sources: partial.sources || null,
      suggestions: partial.suggestions || null
    };
    _state = Object.assign({}, _state, {
      messages: _state.messages.concat(msg)
    });
    _emit();
    SAHYOG.Storage.save(_state);
    return msg;
  }

  /**
   * Reset conversation — clear messages, generate new conversationId.
   */
  function reset() {
    _state = Object.assign({}, _state, {
      messages: [],
      isThinking: false,
      isListening: false,
      isSpeaking: false,
      conversationId: _uid('conv')
    });
    SAHYOG.Storage.clear();
    _emit();
  }

  /**
   * Initialize state — restore from localStorage or create fresh.
   */
  function init() {
    var saved = SAHYOG.Storage.load();
    if (saved && Array.isArray(saved.messages) && saved.messages.length > 0) {
      _state = Object.assign({}, _state, {
        messages: saved.messages,
        selectedLanguage: saved.selectedLanguage || 'en',
        conversationId: saved.conversationId || _uid('conv')
      });
    } else {
      _state = Object.assign({}, _state, {
        conversationId: _uid('conv')
      });
    }
    // Always start transient flags as false
    _state.isThinking = false;
    _state.isListening = false;
    _state.isSpeaking = false;
  }

  return { get, set, subscribe, addMessage, reset, init };
})();
