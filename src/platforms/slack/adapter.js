const { App, LogLevel } = require('@slack/bolt');
const { channelIds, historyLimit } = require('../../config');
const { learnFromMessage, answerQuestion, isGreeting } = require('../../core/assistantEngine');
const { getSlackInstallationByTeamId } = require('../../services/installationService');
const { getUserName, resolveMentions } = require('./slackUtils');

const assistantLabel = 'community assistant';

function createSlackApp() {
  return new App({
    authorize: async ({ teamId }) => {
      const installation = teamId ? await getSlackInstallationByTeamId(teamId) : null;
      const botToken = installation?.bot_token || process.env.SLACK_BOT_TOKEN;
      const botUserId = installation?.bot_user_id || null;

      if (!botToken) {
        throw new Error(`No Slack bot token found for team ${teamId || 'unknown'}`);
      }

      return {
        botToken,
        botUserId,
      };
    },
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
    port: process.env.PORT || 3000,
    logLevel: LogLevel.DEBUG
  });
}

async function normalizeSlackMessage(client, rawMessage, hostBotId) {
  const userName = rawMessage.user ? await getUserName(client, rawMessage.user) : 'Someone';
  const resolvedText = await resolveMentions(client, rawMessage.text || '');

  return {
    id: rawMessage.ts,
    platform: 'slack',
    workspaceId: rawMessage.team || null,
    conversationId: rawMessage.channel,
    threadId: rawMessage.thread_ts || rawMessage.ts,
    userId: rawMessage.user || null,
    userName,
    text: resolvedText,
    rawText: rawMessage.text || '',
    timestamp: rawMessage.ts,
    isBot: !!rawMessage.bot_id || rawMessage.user === hostBotId,
  };
}

function shouldTrackChannel(channelId) {
  if (channelIds.length === 0) {
    return true;
  }

  return channelIds.includes(channelId);
}

async function buildHistoryText(client, messages, hostBotId, currentEventTs) {
  const filtered = (messages || [])
    .filter(message => {
      const isCurrentEvent = currentEventTs && message.ts === currentEventTs;
      const isBot = !!message.bot_id || message.user === hostBotId;
      return message.text && !isBot && !isCurrentEvent;
    })
    .reverse()
    .slice(-20);

  const historyLines = [];
  for (const message of filtered) {
    const normalized = await normalizeSlackMessage(client, message, hostBotId);
    historyLines.push(`${normalized.userName}: ${normalized.text}`);
  }

  return historyLines.join('\n');
}

async function fetchRecentHistory(client, event, hostBotId) {
  if (event.thread_ts) {
    const threadHistory = await client.conversations.replies({
      channel: event.channel,
      ts: event.thread_ts,
      limit: historyLimit
    }).catch(err => {
      console.error('[Slack] Thread replies fetch error:', err.message);
      return { messages: [] };
    });

    return buildHistoryText(client, threadHistory.messages, hostBotId, event.ts);
  }

  const channelHistory = await client.conversations.history({
    channel: event.channel,
    latest: event.ts,
    inclusive: false,
    limit: historyLimit
  }).catch(err => {
    console.error('[Slack] History fetch error:', err.message);
    return { messages: [] };
  });

  return buildHistoryText(client, channelHistory.messages, hostBotId, event.ts);
}

async function ingestChannelMessages(client, channelId, hostBotId, token) {
  const oldest = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
  const result = await client.conversations.history({
    token,
    channel: channelId,
    oldest: oldest.toString(),
    limit: 200,
  });

  for (const rawMessage of result.messages || []) {
    const normalized = await normalizeSlackMessage(client, { ...rawMessage, channel: channelId }, hostBotId);
    await learnFromMessage(normalized);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function runIngestion(app, hostBotId, token) {
  if (channelIds.length === 0) {
    console.log('[Slack] No SLACK_CHANNEL_IDS configured, skipping startup ingestion.');
    return;
  }

  console.log(`[Slack] Starting message ingestion for ${channelIds.length} channel(s)...`);
  for (const channelId of channelIds) {
    await ingestChannelMessages(app.client, channelId, hostBotId, token);
  }
  console.log('[Slack] Ingestion complete.');
}

async function startSlackBot() {
  const app = createSlackApp();

  app.use(async ({ event, next }) => {
    if (event) {
      console.log(`\nIncoming Event: ${event.type} in ${event.channel || 'N/A'}`);
    }
    await next();
  });

  app.event('app_mention', async ({ event, client, say, context }) => {
    try {
      let hostBotId = context.botUserId;
      if (!hostBotId) {
        const auth = await client.auth.test();
        hostBotId = auth.user_id;
      }

      const cleanUserText = (event.text || '').replace(new RegExp(`<@${hostBotId}>`, 'g'), '').trim();
      const userQuery = await resolveMentions(client, cleanUserText);
      const recentHistoryText = await fetchRecentHistory(client, event, hostBotId);

      if (isGreeting(userQuery)) {
        return say('Hello! How can I help you today? I can answer questions based on our past conversations!');
      }

      const loadingMessage = await say('_Looking into it..._');
      let finalOutput = '';

      try {
        finalOutput = await answerQuestion({
          assistantLabel,
          userQuery,
          recentHistoryText,
        });
      } catch (apiError) {
        console.error('[Slack] Error generating answer:', apiError);
        if (apiError.status === 429) {
          finalOutput = 'Groq API limit hit. Please try again in a minute.';
        } else {
          finalOutput = 'Sorry, I ran into an error while processing your question. Please try again.';
        }
      }

      await client.chat.update({
        channel: loadingMessage.channel,
        ts: loadingMessage.ts,
        text: finalOutput
      });
    } catch (error) {
      console.error('[Slack] Error in app_mention event:', error);
    }
  });

  app.message(async ({ message, client, context }) => {
    console.log(`\n[Slack] NEW MESSAGE IN ${message.channel}: "${message.text?.substring(0, 50)}..."`);

    if (!shouldTrackChannel(message.channel)) {
      console.log(`[Slack] Channel ${message.channel} is NOT monitored.`);
      return;
    }

    let hostBotId = context.botUserId;
    if (!hostBotId) {
      const auth = await client.auth.test();
      hostBotId = auth.user_id;
    }

    const normalized = await normalizeSlackMessage(client, message, hostBotId);
    await learnFromMessage(normalized);
  });

  await app.start();
  console.log('Slack bot is running.');

  if (process.env.SLACK_BOT_TOKEN) {
    const auth = await app.client.auth.test({ token: process.env.SLACK_BOT_TOKEN });
    console.log(`Primary Bot User ID: ${auth.user_id}`);
    console.log(`Primary Bot Name: ${auth.user}`);

    if (channelIds.length > 0) {
      await runIngestion(app, auth.user_id, process.env.SLACK_BOT_TOKEN);
    }
  } else {
    console.log('Primary workspace token not configured. Waiting for installed workspaces to interact.');
  }
}

module.exports = {
  startSlackBot,
  normalizeSlackMessage,
  fetchRecentHistory,
};
