require('dotenv').config();
const { startSlackBot } = require('./src/platforms/slack/adapter');
const { startWebServer } = require('./src/web/server');

(async () => {
  try {
    await startWebServer();
    await startSlackBot();
  } catch (error) {
    console.error('FATAL: Bot failed to start:', error);
    process.exit(1);
  }
})();
