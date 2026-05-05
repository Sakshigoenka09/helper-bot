const { matchThreshold, topK } = require('../config');
const { storeMemory, searchMemories } = require('../services/memoryService');
const { generateContextualAnswer } = require('../services/llmService');

const greetings = new Set(['hi', 'hello', 'hey', 'hwlow', 'namaste', 'wasup']);

function isGreeting(text) {
  const normalized = (text || '').toLowerCase().trim();
  return greetings.has(normalized) || normalized.length < 3;
}

async function learnFromMessage(message) {
  return storeMemory(message);
}

async function answerQuestion({ assistantLabel, userQuery, recentHistoryText }) {
  const searchQuery = `${recentHistoryText}\n${userQuery}`.trim();
  console.log(`[Assistant] Searching memory for: "${searchQuery.substring(0, 60)}..."`);

  const similarMemories = await searchMemories(searchQuery || userQuery, {
    topK,
    threshold: matchThreshold,
  });

  return generateContextualAnswer({
    assistantLabel,
    userQuery,
    recentHistory: recentHistoryText,
    similarMemories,
  });
}

module.exports = {
  isGreeting,
  learnFromMessage,
  answerQuestion,
};
