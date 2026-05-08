const CHANNEL_IDS = (process.env.SLACK_CHANNEL_IDS || '')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);

const websitePort = Number(process.env.PORT || process.env.WEBSITE_PORT || 4000);
const appBaseUrl =
  process.env.APP_BASE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${websitePort}`;

module.exports = {
  appBaseUrl,
  channelIds: CHANNEL_IDS,
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  topK: Number(process.env.MEMORY_TOP_K || 10),
  matchThreshold: Number(process.env.MEMORY_MATCH_THRESHOLD || 0.1),
  historyLimit: Number(process.env.HISTORY_LIMIT || 50),
  websitePort,
};
