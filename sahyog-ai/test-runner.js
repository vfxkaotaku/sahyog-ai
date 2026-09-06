/**
 * test-runner.js
 * Verification suite for SAHYOG AI modules.
 */

// Mock browser globals
global.window = {};
global.document = {
  createElement: function (tag) {
    return {
      innerHTML: '',
      appendChild: function (node) {
        this.innerHTML = node.textContent || '';
      }
    };
  },
  createTextNode: function (text) {
    return { textContent: text };
  }
};

let store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { store = {}; }
};

// Load modules
require('./js/utils/storage.js');
require('./js/state.js');
require('./js/services/aiService.js');
require('./js/components/message.js');
require('./js/components/quickActions.js');

const SAHYOG = global.window.SAHYOG;

async function runTests() {
  console.log('--- Starting SAHYOG AI Unit Verification ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, desc) {
    if (condition) {
      console.log('✅ PASS:', desc);
      passed++;
    } else {
      console.error('❌ FAIL:', desc);
      failed++;
    }
  }

  // Test 1: Storage
  SAHYOG.Storage.save({ messages: [{ id: '1', content: 'test' }], selectedLanguage: 'hi', conversationId: 'c1' });
  const loaded = SAHYOG.Storage.load();
  assert(loaded && loaded.selectedLanguage === 'hi' && loaded.messages.length === 1, 'Storage save and load');

  // Test 2: State manager
  SAHYOG.State.init();
  const state1 = SAHYOG.State.get();
  assert(state1.selectedLanguage === 'hi' && state1.messages.length === 1, 'State restores from storage');

  // Test 3: Add message
  const newMsg = SAHYOG.State.addMessage({ role: 'user', content: 'Tell me about crop insurance' });
  assert(newMsg.id && SAHYOG.State.get().messages.length === 2, 'State adds message');

  // Test 4: Category matcher
  const catCrop = SAHYOG._matchCategory('Tell me about crop insurance');
  assert(catCrop === 'cropInsurance', 'Keyword matching: cropInsurance');

  const catSchemes = SAHYOG._matchCategory('Show me important government schemes for farmers.');
  assert(catSchemes === 'schemes', 'Keyword matching: schemes');

  const catCoop = SAHYOG._matchCategory('Explain cooperative society rules in simple language.');
  assert(catCoop === 'cooperative', 'Keyword matching: cooperative');

  const catFin = SAHYOG._matchCategory('Explain financial literacy in simple language.');
  assert(catFin === 'financial', 'Keyword matching: financial');

  const catGrievance = SAHYOG._matchCategory('How can I raise a grievance?');
  assert(catGrievance === 'grievance', 'Keyword matching: grievance');

  const catDoc = SAHYOG._matchCategory('I need help understanding a government document.');
  assert(catDoc === 'document', 'Keyword matching: document');

  // Test 5: AI Service responses in en, hi, mr
  const resEn = await SAHYOG.AIService.sendMessage('Tell me about crop insurance', 'en', []);
  assert(resEn.content && resEn.content.includes('PMFBY') && resEn.suggestions.length > 0, 'AIService English response');

  const resHi = await SAHYOG.AIService.sendMessage('फसल बीमा के बारे में बताओ', 'hi', []);
  assert(resHi.content && resHi.content.includes('प्रधानमंत्री फसल बीमा योजना'), 'AIService Hindi response');

  const resMr = await SAHYOG.AIService.sendMessage('पिक विमा माहिती सांगा', 'mr', []);
  assert(resMr.content && resMr.content.includes('प्रधानमंत्री पिक विमा योजना'), 'AIService Marathi response');

  // Test 6: Message rendering
  const userHtml = SAHYOG.Message.renderUser({ id: 'm1', content: 'Hello', timestamp: new Date().toISOString() });
  assert(userHtml.includes('message--user') && userHtml.includes('Hello'), 'Message user rendering');

  const assistantHtml = SAHYOG.Message.renderAssistant({
    id: 'm2',
    content: 'Namaste',
    timestamp: new Date().toISOString(),
    suggestions: ['More info']
  });
  assert(assistantHtml.includes('message--assistant') && assistantHtml.includes('Demo Source') && assistantHtml.includes('More info'), 'Message assistant rendering');

  const thinkingHtml = SAHYOG.Message.renderThinking();
  assert(thinkingHtml.includes('message--thinking') && thinkingHtml.includes('Thinking...'), 'Message thinking rendering');

  // Test 7: Quick Actions
  const qaHtml = SAHYOG.QuickActions.render('en');
  assert(qaHtml.includes('Government Schemes') && qaHtml.includes('Cooperative Laws'), 'QuickActions render English');

  const qaHtmlMr = SAHYOG.QuickActions.render('mr');
  assert(qaHtmlMr.includes('सरकारी योजना') && qaHtmlMr.includes('पिक विमा'), 'QuickActions render Marathi');

  // Test 8: Reset
  SAHYOG.State.reset();
  const resetState = SAHYOG.State.get();
  assert(resetState.messages.length === 0 && resetState.conversationId !== null, 'State reset');

  console.log(`\n--- Verification Complete: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
