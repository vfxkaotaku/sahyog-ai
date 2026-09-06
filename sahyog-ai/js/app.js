/**
 * app.js — SAHYOG AI
 * Application bootstrap, router, view management, and lifecycle events.
 */

var SAHYOG = window.SAHYOG = window.SAHYOG || {};

SAHYOG.App = (function () {

  var VIEWS = {
    chat: { title: 'AI Assistant', elId: 'view-chat' },
    schemes: { title: 'Government Schemes', elId: 'view-schemes' },
    cooperative: { title: 'Cooperative Regulations', elId: 'view-cooperative' },
    knowledge: { title: 'Knowledge Hub', elId: 'view-knowledge' },
    settings: { title: 'Settings', elId: 'view-settings' }
  };

  var _currentView = 'chat';

  /**
   * Router: Parse hash and switch views
   */
  function handleRoute() {
    var rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    var route = rawHash.split('/')[0] || 'chat';

    if (!VIEWS[route]) {
      route = 'chat';
    }

    _currentView = route;

    // Show/hide view containers
    Object.keys(VIEWS).forEach(function (key) {
      var el = document.getElementById(VIEWS[key].elId);
      if (el) {
        if (key === route) {
          el.classList.add('view--active');
          el.removeAttribute('hidden');
        } else {
          el.classList.remove('view--active');
          el.setAttribute('hidden', 'true');
        }
      }
    });

    // Update sidebar navigation active indicator
    if (SAHYOG.Sidebar && SAHYOG.Sidebar.setActiveNav) {
      SAHYOG.Sidebar.setActiveNav(route);
    }
  }

  /**
   * Programmatic navigation
   */
  function navigateTo(route) {
    window.location.hash = '#' + route;
  }

  /**
   * Render placeholder pages for secondary views
   */
  function renderSecondaryViews() {
    // Schemes View
    var schemesEl = document.getElementById('view-schemes');
    if (schemesEl) {
      schemesEl.innerHTML = [
        '<div class="page-view">',
          '<div class="page-header">',
            '<h1>📋 Government Schemes for Farmers & Cooperatives</h1>',
            '<p class="page-subtitle">Central & State government agricultural subsidies, income support, and credit schemes.</p>',
          '</div>',
          '<div class="card-grid">',
            '<div class="info-card">',
              '<div class="info-card__badge">Income Support</div>',
              '<h3>PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)</h3>',
              '<p>Direct income benefit of ₹6,000 per year in three equal instalments of ₹2,000 to eligible farmer families.</p>',
              '<button class="btn-ask-ai" data-ask="Tell me everything about PM-KISAN scheme, eligibility, and documents.">Ask SAHYOG AI about this ➔</button>',
            '</div>',
            '<div class="info-card">',
              '<div class="info-card__badge">Risk & Safety</div>',
              '<h3>PMFBY (Pradhan Mantri Fasal Bima Yojana)</h3>',
              '<p>Comprehensive crop insurance covering non-preventable natural risks from pre-sowing to post-harvest.</p>',
              '<button class="btn-ask-ai" data-ask="How can I apply for PMFBY crop insurance and what is the premium?">Ask SAHYOG AI about this ➔</button>',
            '</div>',
            '<div class="info-card">',
              '<div class="info-card__badge">Infrastructure</div>',
              '<h3>AIF (Agriculture Infrastructure Fund)</h3>',
              '<p>Medium-long term debt financing for post-harvest management infrastructure and community farming assets.</p>',
              '<button class="btn-ask-ai" data-ask="What is the Agriculture Infrastructure Fund (AIF) and how can PACS benefit?">Ask SAHYOG AI about this ➔</button>',
            '</div>',
            '<div class="info-card">',
              '<div class="info-card__badge">Credit Support</div>',
              '<h3>Kisan Credit Card (KCC)</h3>',
              '<p>Concessional institutional credit for farmers for crop cultivation, post-harvest expenses, and animal husbandry.</p>',
              '<button class="btn-ask-ai" data-ask="Explain Kisan Credit Card loan limit, interest subvention, and application process.">Ask SAHYOG AI about this ➔</button>',
            '</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    // Cooperative View
    var coopEl = document.getElementById('view-cooperative');
    if (coopEl) {
      coopEl.innerHTML = [
        '<div class="page-view">',
          '<div class="page-header">',
            '<h1>🤝 Cooperative Societies & PACS Regulations</h1>',
            '<p class="page-subtitle">Guidelines for Primary Agricultural Credit Societies, Multi-State Cooperatives, and Bye-laws.</p>',
          '</div>',
          '<div class="card-grid">',
            '<div class="info-card">',
              '<div class="info-card__badge">Digitization</div>',
              '<h3>PACS Computerization Project</h3>',
              '<p>Centrally sponsored project to digitize 63,000 active PACS with cloud ERP, ERP-based audit, and transparent member records.</p>',
              '<button class="btn-ask-ai" data-ask="Explain the PACS computerization project and how audit transparency works.">Ask SAHYOG AI about this ➔</button>',
            '</div>',
            '<div class="info-card">',
              '<div class="info-card__badge">Governance</div>',
              '<h3>Model Bye-Laws for PACS</h3>',
              '<p>Enables PACS to diversify into over 25 business activities including warehousing, fertilizer retail, and common service centers.</p>',
              '<button class="btn-ask-ai" data-ask="What are the Model Bye-Laws for PACS and how can a society adopt them?">Ask SAHYOG AI about this ➔</button>',
            '</div>',
            '<div class="info-card">',
              '<div class="info-card__badge">Compliance</div>',
              '<h3>Multi-State Cooperative Societies (MSCS) Act</h3>',
              '<p>Democratic governance, mandatory electoral authority, and enhanced financial reporting standards for multi-state societies.</p>',
              '<button class="btn-ask-ai" data-ask="What are the main provisions of the Multi-State Cooperative Societies Act?">Ask SAHYOG AI about this ➔</button>',
            '</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    // Knowledge Hub
    var knowEl = document.getElementById('view-knowledge');
    if (knowEl) {
      knowEl.innerHTML = [
        '<div class="page-view">',
          '<div class="page-header">',
            '<h1>📚 Knowledge Hub & Agricultural Learning</h1>',
            '<p class="page-subtitle">Curated guides, agronomy best practices, financial literacy, and grievance redressal portals.</p>',
          '</div>',
          '<div class="card-grid">',
            '<div class="info-card">',
              '<h3>🌾 Crop Health & Soil Management</h3>',
              '<p>Soil Health Card guidelines, balanced NPK fertilization, organic manure, and micro-nutrient diagnostics.</p>',
              '<button class="btn-ask-ai" data-ask="How do I read a Soil Health Card and calculate fertilizer requirements?">Ask SAHYOG AI about this ➔</button>',
            '</div>',
            '<div class="info-card">',
              '<h3>💰 Financial Literacy for Rural Communities</h3>',
              '<p>Understanding bank interest calculations, preventing debt traps, digital payments via UPI, and micro-insurance.</p>',
              '<button class="btn-ask-ai" data-ask="Explain financial literacy in simple language.">Ask SAHYOG AI about this ➔</button>',
            '</div>',
            '<div class="info-card">',
              '<h3>📢 Grievance Escalation Procedures</h3>',
              '<p>Step-by-step guides for filing complaints regarding insurance non-settlement, banking delays, or seed defects.</p>',
              '<button class="btn-ask-ai" data-ask="How can I raise a grievance for crop insurance non-payment?">Ask SAHYOG AI about this ➔</button>',
            '</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    // Settings View
    var setEl = document.getElementById('view-settings');
    if (setEl) {
      setEl.innerHTML = [
        '<div class="page-view">',
          '<div class="page-header">',
            '<h1>⚙️ System Settings</h1>',
            '<p class="page-subtitle">Configure language, session preferences, and demo diagnostics.</p>',
          '</div>',
          '<div class="settings-card">',
            '<div class="setting-item">',
              '<div>',
                '<h4>Response Language</h4>',
                '<p class="setting-desc">Choose default language for responses and voice prompts.</p>',
              '</div>',
              '<select id="settingsLangSelect" class="form-select">',
                '<option value="en">English (EN)</option>',
                '<option value="hi">हिंदी (Hindi)</option>',
                '<option value="mr">मराठी (Marathi)</option>',
              '</select>',
            '</div>',
            '<div class="setting-item">',
              '<div>',
                '<h4>AI Engine Mode</h4>',
                '<p class="setting-desc">Current running model connection.</p>',
              '</div>',
              '<span class="badge badge--success">Demo Knowledge Engine (Offline Mode)</span>',
            '</div>',
            '<div class="setting-item">',
              '<div>',
                '<h4>Conversation Storage</h4>',
                '<p class="setting-desc">Clear local session data stored in your browser.</p>',
              '</div>',
              '<button class="btn-danger" id="clearStorageBtn">Clear Local Storage</button>',
            '</div>',
          '</div>',
        '</div>'
      ].join('');

      // Wire settings handlers
      var langSelect = document.getElementById('settingsLangSelect');
      if (langSelect) {
        langSelect.value = SAHYOG.State.get().selectedLanguage;
        langSelect.addEventListener('change', function () {
          SAHYOG.State.set({ selectedLanguage: langSelect.value });
        });
      }

      var clearStorageBtn = document.getElementById('clearStorageBtn');
      if (clearStorageBtn) {
        clearStorageBtn.addEventListener('click', function () {
          if (confirm('Clear all chat data and stored preferences?')) {
            SAHYOG.State.reset();
            alert('Storage cleared successfully.');
          }
        });
      }
    }

    // Bind "Ask SAHYOG AI" buttons to jump to chat and send message
    document.querySelectorAll('.btn-ask-ai').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var query = btn.getAttribute('data-ask');
        if (query) {
          navigateTo('chat');
          setTimeout(function () {
            SAHYOG.Chat.sendMessage(query);
          }, 150);
        }
      });
    });
  }

  /**
   * Application entrypoint
   */
  function init() {
    // 1. Initialize State (loads from localStorage)
    SAHYOG.State.init();

    // 2. Render Sidebar
    var sidebarRoot = document.getElementById('sidebar-root');
    if (sidebarRoot) {
      sidebarRoot.innerHTML = SAHYOG.Sidebar.render();
      SAHYOG.Sidebar.init();
    }

    // 3. Render Secondary Views
    renderSecondaryViews();

    // 4. Initialize Chat Component
    var chatRoot = document.getElementById('view-chat');
    if (chatRoot) {
      SAHYOG.Chat.init(chatRoot);
    }

    // 5. Setup Router
    window.addEventListener('hashchange', handleRoute);
    handleRoute();

    console.log('[SAHYOG AI] Application initialized successfully.');
  }

  return {
    init: init,
    navigateTo: navigateTo
  };
})();

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', function () {
  SAHYOG.App.init();
});
