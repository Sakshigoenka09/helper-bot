const CHANNEL_IDS = (process.env.SLACK_CHANNEL_IDS || 'C0ATFALUJ95')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);

module.exports = {
  channelIds: CHANNEL_IDS,
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  topK: Number(process.env.MEMORY_TOP_K || 10),
  matchThreshold: Number(process.env.MEMORY_MATCH_THRESHOLD || 0.1),
  historyLimit: Number(process.env.HISTORY_LIMIT || 50),
};
