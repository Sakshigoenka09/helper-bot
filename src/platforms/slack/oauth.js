const crypto = require('crypto');
const { appBaseUrl } = require('../../config');
const { saveSlackInstallation } = require('../../services/installationService');

const slackOauthState = new Map();
const slackScopes = [
  'app_mentions:read',
  'channels:history',
  'chat:write',
  'users:read',
];

function getSlackRedirectUri() {
  return `${appBaseUrl}/auth/slack/callback`;
}

function createSlackState() {
  const state = crypto.randomBytes(16).toString('hex');
  slackOauthState.set(state, Date.now());
  return state;
}

function validateSlackState(state) {
  if (!state || !slackOauthState.has(state)) {
    return false;
  }

  slackOauthState.delete(state);
  return true;
}

function buildSlackAuthorizeUrl() {
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID || '',
    scope: slackScopes.join(','),
    redirect_uri: getSlackRedirectUri(),
    state: createSlackState(),
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

async function exchangeSlackCodeForToken(code) {
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID || '',
    client_secret: process.env.SLACK_CLIENT_SECRET || '',
    code,
    redirect_uri: getSlackRedirectUri(),
  });

  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || 'Slack OAuth token exchange failed');
  }

  return data;
}

async function handleSlackOAuthCallback({ code, state }) {
  if (!validateSlackState(state)) {
    throw new Error('Invalid or expired Slack OAuth state');
  }

  const tokenData = await exchangeSlackCodeForToken(code);
  const installation = await saveSlackInstallation({
    teamId: tokenData.team?.id || null,
    teamName: tokenData.team?.name || 'Unknown workspace',
    botToken: tokenData.access_token,
    botUserId: tokenData.bot_user_id || null,
    scope: tokenData.scope || slackScopes.join(','),
    authedUserId: tokenData.authed_user?.id || null,
    rawResponse: tokenData,
  });

  return {
    installation,
    tokenData,
  };
}

module.exports = {
  buildSlackAuthorizeUrl,
  handleSlackOAuthCallback,
  getSlackRedirectUri,
  slackScopes,
};
