/**
 * storage.js — SAHYOG AI
 * localStorage persistence helpers with error-safe fallback.
 */

var SAHYOG = window.SAHYOG = window.SAHYOG || {};

SAHYOG.Storage = (function () {
  const KEY = 'sahyog_ai_state';

  function save(state) {
    try {
      const data = {
        messages: state.messages,
        selectedLanguage: state.selectedLanguage,
        conversationId: state.conversationId
      };
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[SAHYOG Storage] Could not save state:', e.message);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.messages)) {
        console.warn('[SAHYOG Storage] Stored data corrupted, resetting.');
        clear();
        return null;
      }
      return data;
    } catch (e) {
      console.warn('[SAHYOG Storage] Could not parse stored data, resetting:', e.message);
      clear();
      return null;
    }
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {
      console.warn('[SAHYOG Storage] Could not clear storage:', e.message);
    }
  }

  return { save, load, clear };
})();
