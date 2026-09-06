/**
 * message.js — SAHYOG AI
 * Pure rendering functions for chat messages.
 * No business logic — just HTML generation.
 */

var SAHYOG = window.SAHYOG = window.SAHYOG || {};

SAHYOG.Message = (function () {

  function _escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str || '')));
    return div.innerHTML;
  }

  function _formatContent(content) {
    // Escape HTML, then restore newlines as <br>
    return _escapeHtml(content).replace(/\n/g, '<br>');
  }

  function _formatTime(isoString) {
    try {
      var date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  function _escapeAttr(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  // ── Render user message ──────────────────────────────────
  function renderUser(message) {
    return [
      '<div class="message message--user" data-id="', _escapeHtml(message.id), '"',
      ' role="article" aria-label="Your message">',
        '<div class="message__body">',
          '<div class="message__content">', _formatContent(message.content), '</div>',
          '<div class="message__meta">',
            '<span class="message__label">You</span>',
            '<span class="message__time">', _formatTime(message.timestamp), '</span>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');
  }

  // ── Render assistant message ─────────────────────────────
  function renderAssistant(message) {
    var sourcesHtml = '<div class="message__source"><span class="source-icon">📋</span> Demo Source</div>';

    var suggestionsHtml = '';
    if (message.suggestions && message.suggestions.length > 0) {
      var btns = message.suggestions.map(function (s) {
        return '<button class="suggestion-btn" data-suggestion="' + _escapeHtml(s) + '">' + _escapeHtml(s) + '</button>';
      }).join('');
      suggestionsHtml = '<div class="message__suggestions"><p class="suggestions-label">You may also ask:</p>' + btns + '</div>';
    }

    return [
      '<div class="message message--assistant" data-id="', _escapeHtml(message.id), '"',
      ' role="article" aria-label="SAHYOG AI response">',
        '<div class="message__avatar" aria-hidden="true">🤖</div>',
        '<div class="message__body">',
          '<div class="message__sender">SAHYOG AI</div>',
          '<div class="message__content">', _formatContent(message.content), '</div>',
          sourcesHtml,
          suggestionsHtml,
          '<div class="message__meta">',
            '<span class="message__time">', _formatTime(message.timestamp), '</span>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');
  }

  // ── Thinking indicator ───────────────────────────────────
  function renderThinking() {
    return [
      '<div class="message message--thinking" id="thinking-indicator"',
      ' role="status" aria-live="polite" aria-label="SAHYOG AI is thinking">',
        '<div class="message__avatar" aria-hidden="true">🤖</div>',
        '<div class="message__body">',
          '<div class="message__sender">SAHYOG AI</div>',
          '<div class="thinking-dots" aria-hidden="true">',
            '<span></span><span></span><span></span>',
          '</div>',
          '<div class="thinking-label">Thinking...</div>',
        '</div>',
      '</div>'
    ].join('');
  }

  // ── System / info message ────────────────────────────────
  function renderSystem(message) {
    return '<div class="message message--system" role="note">' + _escapeHtml(message.content) + '</div>';
  }

  return {
    renderUser: renderUser,
    renderAssistant: renderAssistant,
    renderThinking: renderThinking,
    renderSystem: renderSystem
  };
})();
