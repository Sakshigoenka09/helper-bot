require('dotenv').config();
const { startSlackBot } = require('./src/platforms/slack/adapter');

(async () => {
  try {
    await startSlackBot();
  } catch (error) {
    console.error('FATAL: Bot failed to start:', error);
    process.exit(1);
  }
})();
