/**
 * quickActions.js — SAHYOG AI
 * Quick action cards rendered in the welcome state.
 * Clicking a card auto-sends a preset message to the chat.
 */

var SAHYOG = window.SAHYOG = window.SAHYOG || {};

SAHYOG.QuickActions = (function () {

  var ACTIONS = [
    {
      id: 'schemes',
      icon: '📋',
      label: { en: 'Government Schemes', hi: 'सरकारी योजनाएं', mr: 'सरकारी योजना' },
      message: 'Show me important government schemes for farmers.'
    },
    {
      id: 'cooperative',
      icon: '🤝',
      label: { en: 'Cooperative Laws', hi: 'सहकारी नियम', mr: 'सहकारी नियम' },
      message: 'Explain cooperative society rules in simple language.'
    },
    {
      id: 'insurance',
      icon: '🌾',
      label: { en: 'Crop Insurance', hi: 'फसल बीमा', mr: 'पिक विमा' },
      message: 'Tell me about crop insurance.'
    },
    {
      id: 'financial',
      icon: '💰',
      label: { en: 'Financial Literacy', hi: 'वित्तीय साक्षरता', mr: 'आर्थिक साक्षरता' },
      message: 'Explain financial literacy in simple language.'
    },
    {
      id: 'grievance',
      icon: '📢',
      label: { en: 'Grievance Assistance', hi: 'शिकायत सहायता', mr: 'तक्रार मदत' },
      message: 'How can I raise a grievance?'
    },
    {
      id: 'document',
      icon: '📄',
      label: { en: 'Document Help', hi: 'दस्तावेज़ सहायता', mr: 'कागदपत्र मदत' },
      message: 'I need help understanding a government document.'
    }
  ];

  function render(lang) {
    var cards = ACTIONS.map(function (action) {
      var label = action.label[lang] || action.label.en;
      return [
        '<button class="quick-action-card" ',
        'data-message="', action.message.replace(/"/g, '&quot;'), '"',
        ' aria-label="', label, '" title="', label, '">',
          '<span class="quick-action-icon" aria-hidden="true">', action.icon, '</span>',
          '<span class="quick-action-label">', label, '</span>',
        '</button>'
      ].join('');
    }).join('');

    return '<div class="quick-actions" role="list" aria-label="Quick action topics">' + cards + '</div>';
  }

  function attachEvents(onSend) {
    document.querySelectorAll('.quick-action-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var msg = card.getAttribute('data-message');
        if (msg && onSend) onSend(msg);
      });
    });
  }

  return { render: render, attachEvents: attachEvents, ACTIONS: ACTIONS };
})();
