/**
 * chat.js — SAHYOG AI
 * Chat controller & view renderer.
 * Manages message input, send flow, quick actions, suggestions, and auto-scrolling.
 */

var SAHYOG = window.SAHYOG = window.SAHYOG || {};

SAHYOG.Chat = (function () {
  var _container = null;
  var _messagesEl = null;
  var _inputEl = null;
  var _sendBtn = null;
  var _charCountEl = null;

  var GREETINGS = {
    en: {
      salutation: 'Namaste 👋',
      title: 'I am SAHYOG AI.',
      subtitle: 'I can help you understand:',
      capabilities: [
        'Government schemes',
        'Cooperative services',
        'Agriculture support',
        'Financial literacy',
        'Grievance procedures',
        'Government documents'
      ],
      inputPlaceholder: 'Ask anything about schemes, crop insurance, cooperative laws...',
      quickTitle: 'Popular Topics & Quick Guidance'
    },
    hi: {
      salutation: 'नमस्ते 👋',
      title: 'मैं सहयोग AI हूँ।',
      subtitle: 'मैं इन विषयों को समझने में आपकी सहायता कर सकता हूँ:',
      capabilities: [
        'सरकारी योजनाएं',
        'सहकारी सेवाएं',
        'कृषि सहायता',
        'वित्तीय साक्षरता',
        'शिकायत निवारण प्रक्रिया',
        'सरकारी दस्तावेज़'
      ],
      inputPlaceholder: 'योजनाओं, फसल बीमा या सहकारी नियमों के बारे में पूछें...',
      quickTitle: 'लोकप्रिय विषय और त्वरित मार्गदर्शन'
    },
    mr: {
      salutation: 'नमस्कार 👋',
      title: 'मी सहयोग AI आहे.',
      subtitle: 'मी खालील बाबी समजून घेण्यास मदत करू शकतो:',
      capabilities: [
        'शासकीय योजना',
        'सहकारी सेवा',
        'शेती सहाय्य',
        'आर्थिक साक्षरता',
        'तक्रार निवारण पद्धती',
        'सरकारी कागदपत्रे'
      ],
      inputPlaceholder: 'योजना, पीक विमा किंवा सहकारी नियमांविषयी विचारा...',
      quickTitle: 'लोकप्रिय विषय आणि त्वरित मार्गदर्शन'
    }
  };

  /**
   * Render the outer chat frame HTML structure.
   */
  function renderFrame() {
    return [
      '<div class="chat-container">',
        '<!-- Chat Header -->',
        '<header class="chat-header">',
          '<div class="chat-header__left">',
            '<button class="sidebar-toggle-btn" id="mobileMenuBtn" aria-label="Open navigation menu">',
              '☰',
            '</button>',
            '<div class="chat-header__avatar">🌾</div>',
            '<div class="chat-header__info">',
              '<div class="chat-header__title-row">',
                '<h1 class="chat-header__title">SAHYOG AI Assistant</h1>',
                '<span class="badge badge--demo" title="Mock local knowledge base">DEMO MODE</span>',
              '</div>',
              '<p class="chat-header__status">',
                '<span class="status-indicator status-indicator--online"></span>',
                'Ready to assist &bull; Multilingual Assistant',
              '</p>',
            '</div>',
          '</div>',
          '<div class="chat-header__actions">',
            '<button class="btn-icon" id="clearChatBtn" title="New Conversation" aria-label="Start new conversation">',
              '✨ <span class="btn-text">New Conversation</span>',
            '</button>',
          '</div>',
        '</header>',

        '<!-- Messages Scroll Area -->',
        '<main class="chat-messages" id="chatMessages" role="log" aria-live="polite" aria-label="Chat messages history">',
          '<!-- Dynamic message content inserted here -->',
        '</main>',

        '<!-- Toast Notification Banner -->',
        '<div id="chatToast" class="chat-toast" role="alert" aria-live="assertive" hidden></div>',

        '<!-- Chat Input Area -->',
        '<footer class="chat-input-wrapper">',
          '<div class="chat-input-bar">',
            '<textarea ',
              'id="chatInput" ',
              'class="chat-input" ',
              'rows="1" ',
              'placeholder="Ask anything about schemes, crop insurance, cooperative laws..." ',
              'aria-label="Type your question"></textarea>',
            '<div class="chat-input-actions">',
              '<button class="btn-icon-subtle" id="cameraBtn" title="Visual Assistance" aria-label="Visual assistance">',
                '📷',
              '</button>',
              '<button class="btn-icon-subtle" id="micBtn" title="Voice Input" aria-label="Voice input">',
                '🎙️',
              '</button>',
              '<button class="btn-send" id="sendBtn" aria-label="Send message" disabled>',
                '<span class="send-icon">➤</span>',
              '</button>',
            '</div>',
          '</div>',
          '<div class="chat-input-hint">',
            '<span id="inputHint">Press Enter to send &bull; Shift+Enter for new line</span>',
            '<span id="charCounter" class="char-counter">0/1000</span>',
          '</div>',
        '</footer>',
      '</div>'
    ].join('');
  }

  function showToast(message) {
    var toast = document.getElementById('chatToast');
    if (!toast) return;
    toast.textContent = message;
    toast.removeAttribute('hidden');
    toast.classList.add('chat-toast--visible');
    setTimeout(function () {
      toast.classList.remove('chat-toast--visible');
      setTimeout(function () {
        toast.setAttribute('hidden', 'true');
      }, 300);
    }, 3500);
  }

  /**
   * Render welcome banner when no messages exist.
   */
  function renderWelcome(lang) {
    var g = GREETINGS[lang] || GREETINGS.en;
    var listItems = g.capabilities.map(function (cap) {
      return '<li>' + cap + '</li>';
    }).join('');

    return [
      '<div class="welcome-screen" id="welcomeScreen">',
        '<div class="welcome-badge">🌱 Central Cooperative & Farmer Portal</div>',
        '<h2 class="welcome-salutation">', g.salutation, '</h2>',
        '<h3 class="welcome-title">', g.title, '</h3>',
        '<div class="welcome-guide">',
          '<p class="welcome-subtitle">', g.subtitle, '</p>',
          '<ul class="welcome-list">', listItems, '</ul>',
        '</div>',
        '<div class="welcome-quick-section">',
          '<p class="welcome-quick-heading">', g.quickTitle, '</p>',
          SAHYOG.QuickActions.render(lang),
        '</div>',
      '</div>'
    ].join('');
  }

  /**
   * Re-render the message list based on current state.
   */
  function updateMessages(state) {
    if (!_messagesEl) return;

    var messages = state.messages || [];
    var lang = state.selectedLanguage || 'en';

    if (messages.length === 0) {
      _messagesEl.innerHTML = renderWelcome(lang);
      SAHYOG.QuickActions.attachEvents(function (msgText) {
        sendMessage(msgText);
      });
      return;
    }

    var html = '';
    messages.forEach(function (msg) {
      if (msg.role === 'user') {
        html += SAHYOG.Message.renderUser(msg);
      } else if (msg.role === 'assistant') {
        html += SAHYOG.Message.renderAssistant(msg);
      } else if (msg.role === 'system') {
        html += SAHYOG.Message.renderSystem(msg);
      }
    });

    if (state.isThinking) {
      html += SAHYOG.Message.renderThinking();
    }

    _messagesEl.innerHTML = html;

    // Attach click listeners to suggestion pills
    _messagesEl.querySelectorAll('.suggestion-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var suggestion = btn.getAttribute('data-suggestion');
        if (suggestion) {
          sendMessage(suggestion);
        }
      });
    });

    scrollToBottom();
  }

  function scrollToBottom() {
    if (!_messagesEl) return;
    setTimeout(function () {
      _messagesEl.scrollTop = _messagesEl.scrollHeight;
    }, 50);
  }

  /**
   * Send a message to the AI assistant.
   */
  function sendMessage(text) {
    var rawText = (typeof text === 'string' ? text : (_inputEl ? _inputEl.value : '')).trim();
    if (!rawText) return;

    var state = SAHYOG.State.get();
    if (state.isThinking) return;

    // Clear input
    if (_inputEl) {
      _inputEl.value = '';
      _inputEl.style.height = 'auto';
      updateInputState();
    }

    // Add user message
    SAHYOG.State.addMessage({
      role: 'user',
      content: rawText,
      language: state.selectedLanguage
    });

    // Set thinking state
    SAHYOG.State.set({ isThinking: true });

    // Call AI Service
    SAHYOG.AIService.sendMessage(rawText, state.selectedLanguage, state.messages)
      .then(function (res) {
        SAHYOG.State.addMessage({
          role: 'assistant',
          content: res.content,
          suggestions: res.suggestions,
          sources: res.source,
          language: state.selectedLanguage
        });
      })
      .catch(function (err) {
        SAHYOG.State.addMessage({
          role: 'assistant',
          content: 'I apologize, but I encountered a momentary error. Please ask your question again or choose one of the quick actions below.',
          language: state.selectedLanguage,
          suggestions: ['Show me important government schemes for farmers.', 'Tell me about crop insurance.']
        });
      })
      .finally(function () {
        SAHYOG.State.set({ isThinking: false });
        if (_inputEl) _inputEl.focus();
      });
  }

  function updateInputState() {
    if (!_inputEl || !_sendBtn) return;
    var len = _inputEl.value.trim().length;
    var state = SAHYOG.State.get();
    _sendBtn.disabled = len === 0 || state.isThinking;

    if (_charCountEl) {
      _charCountEl.textContent = _inputEl.value.length + '/1000';
    }
  }

  function newConversation() {
    var state = SAHYOG.State.get();
    if (state.messages && state.messages.length > 1) {
      if (!confirm('Start a new conversation? Current chat history will be cleared.')) {
        return;
      }
    }
    SAHYOG.State.reset();
  }

  /**
   * Mount and initialize the chat component into a container DOM element.
   */
  function init(containerEl) {
    _container = containerEl;
    _container.innerHTML = renderFrame();

    _messagesEl = document.getElementById('chatMessages');
    _inputEl = document.getElementById('chatInput');
    _sendBtn = document.getElementById('sendBtn');
    _charCountEl = document.getElementById('charCounter');

    var clearBtn = document.getElementById('clearChatBtn');
    var mobileMenuBtn = document.getElementById('mobileMenuBtn');
    var micBtn = document.getElementById('micBtn');
    var cameraBtn = document.getElementById('cameraBtn');

    // Subscribe to state updates
    SAHYOG.State.subscribe(function (state) {
      updateMessages(state);
      updateInputState();

      // Update input placeholder based on language
      if (_inputEl) {
        var g = GREETINGS[state.selectedLanguage] || GREETINGS.en;
        _inputEl.placeholder = g.inputPlaceholder;
      }
    });

    // Send button click
    _sendBtn.addEventListener('click', function () {
      sendMessage();
    });

    // Input keyboard events
    _inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-resize textarea & character counter
    _inputEl.addEventListener('input', function () {
      _inputEl.style.height = 'auto';
      var newHeight = Math.min(_inputEl.scrollHeight, 140);
      _inputEl.style.height = newHeight + 'px';
      updateInputState();
    });

    // Clear / New Conversation button
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        newConversation();
      });
    }

    // Mobile sidebar toggle
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', function () {
        SAHYOG.Sidebar.open();
      });
    }

    // Camera button hint
    if (cameraBtn) {
      cameraBtn.addEventListener('click', function () {
        showToast('Visual assistance will be connected in a later step.');
      });
    }

    // Mic button hint
    if (micBtn) {
      micBtn.addEventListener('click', function () {
        showToast('Voice input will be connected in the next integration step.');
      });
    }

    // Initial render
    updateMessages(SAHYOG.State.get());
    updateInputState();
  }

  return {
    init: init,
    sendMessage: sendMessage,
    newConversation: newConversation
  };
})();
