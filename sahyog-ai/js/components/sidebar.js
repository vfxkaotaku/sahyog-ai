/**
 * sidebar.js — SAHYOG AI
 * Sidebar navigation, language selector, demo badge.
 */

var SAHYOG = window.SAHYOG = window.SAHYOG || {};

SAHYOG.Sidebar = (function () {

  var NAV_ITEMS = [
    { id: 'chat',        icon: '💬', label: 'AI Assistant',       active: true },
    { id: 'schemes',     icon: '📋', label: 'Government Schemes'               },
    { id: 'cooperative', icon: '🤝', label: 'Cooperative'                      },
    { id: 'knowledge',   icon: '📚', label: 'Knowledge Hub'                    },
    { id: 'settings',    icon: '⚙️', label: 'Settings'                        }
  ];

  function render() {
    var navHtml = NAV_ITEMS.map(function (item) {
      return [
        '<a href="#', item.id, '" class="nav-item', (item.active ? ' active' : ''), '"',
        ' data-view="', item.id, '"',
        ' aria-label="Navigate to ', item.label, '">',
          '<span class="nav-icon" aria-hidden="true">', item.icon, '</span>',
          '<span class="nav-label">', item.label, '</span>',
        '</a>'
      ].join('');
    }).join('');

    return [
      '<aside class="sidebar" id="sidebar" aria-label="Navigation sidebar">',
        '<div class="sidebar-header">',
          '<div class="logo" aria-label="SAHYOG AI">',
            '<span class="logo-icon" aria-hidden="true">🌾</span>',
            '<div class="logo-text">',
              '<span class="logo-name">SAHYOG AI</span>',
              '<span class="logo-tagline">Agriculture Assistant</span>',
            '</div>',
          '</div>',
          '<button class="sidebar-close" id="sidebarClose" aria-label="Close sidebar">✕</button>',
        '</div>',

        '<button class="new-chat-btn" id="newChatBtn" aria-label="Start a new conversation">',
          '<span aria-hidden="true">+</span> New Conversation',
        '</button>',

        '<nav class="sidebar-nav" role="navigation" aria-label="Main navigation">',
          navHtml,
        '</nav>',

        '<div class="sidebar-footer">',
          '<div class="language-selector" role="group" aria-label="Select language">',
            '<span class="lang-label">Language</span>',
            '<div class="lang-buttons">',
              '<button class="lang-btn active" data-lang="en" aria-label="English" aria-pressed="true">EN</button>',
              '<button class="lang-btn" data-lang="hi" aria-label="Hindi" aria-pressed="false">हिं</button>',
              '<button class="lang-btn" data-lang="mr" aria-label="Marathi" aria-pressed="false">मर</button>',
            '</div>',
          '</div>',
          '<div class="demo-mode-badge" aria-label="Running in demo mode">',
            '<span class="demo-dot" aria-hidden="true"></span>',
            '<span>DEMO MODE</span>',
          '</div>',
        '</div>',
      '</aside>',
      '<div class="sidebar-overlay" id="sidebarOverlay" aria-hidden="true"></div>'
    ].join('');
  }

  function init() {
    var sidebar = document.getElementById('sidebar');
    var closeBtn = document.getElementById('sidebarClose');
    var overlay = document.getElementById('sidebarOverlay');
    var newChatBtn = document.getElementById('newChatBtn');

    if (closeBtn) {
      closeBtn.addEventListener('click', function () { close(); });
    }
    if (overlay) {
      overlay.addEventListener('click', function () { close(); });
    }
    if (newChatBtn) {
      newChatBtn.addEventListener('click', function () {
        SAHYOG.Chat.newConversation();
        close();
      });
    }

    // Language buttons
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.lang-btn').forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        SAHYOG.State.set({ selectedLanguage: btn.getAttribute('data-lang') });
      });
    });

    // Nav items
    document.querySelectorAll('.nav-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var view = item.getAttribute('data-view');
        SAHYOG.App.navigateTo(view);
        document.querySelectorAll('.nav-item').forEach(function (i) {
          i.classList.remove('active');
        });
        item.classList.add('active');
        close();
      });
    });
  }

  function open() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) { overlay.classList.add('visible'); overlay.removeAttribute('aria-hidden'); }
  }

  function close() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) { overlay.classList.remove('visible'); overlay.setAttribute('aria-hidden', 'true'); }
  }

  function setActiveNav(viewId) {
    document.querySelectorAll('.nav-item').forEach(function (item) {
      item.classList.toggle('active', item.getAttribute('data-view') === viewId);
    });
  }

  return { render: render, init: init, open: open, close: close, setActiveNav: setActiveNav };
})();
