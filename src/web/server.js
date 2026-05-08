const http = require('http');
const { appBaseUrl, websitePort } = require('../config');
const { buildSlackAuthorizeUrl, handleSlackOAuthCallback, getSlackRedirectUri, slackScopes } = require('../platforms/slack/oauth');

function renderPage({ title, body }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      :root {
        --bg: #f4efe6;
        --card: #fffaf1;
        --ink: #1f1f1f;
        --muted: #6f675d;
        --line: #d7c8b3;
        --accent: #18604f;
        --accent-2: #0f8b6d;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        background:
          radial-gradient(circle at top left, rgba(24,96,79,0.14), transparent 28%),
          linear-gradient(180deg, #f8f1e7 0%, var(--bg) 100%);
        color: var(--ink);
      }
      .wrap {
        max-width: 980px;
        margin: 0 auto;
        padding: 48px 20px 72px;
      }
      .hero {
        display: grid;
        grid-template-columns: 1.3fr 0.9fr;
        gap: 24px;
      }
      .card {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 28px;
        box-shadow: 0 14px 40px rgba(58, 46, 31, 0.08);
      }
      h1, h2, h3 { margin: 0 0 12px; }
      h1 { font-size: 3rem; line-height: 1; }
      h2 { font-size: 1.5rem; }
      p { color: var(--muted); line-height: 1.6; }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 0.74rem;
        color: var(--accent);
        margin-bottom: 14px;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 24px;
      }
      .btn {
        display: inline-block;
        text-decoration: none;
        padding: 14px 18px;
        border-radius: 999px;
        border: 1px solid var(--accent);
        color: white;
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        font-weight: 700;
      }
      .btn.secondary {
        background: transparent;
        color: var(--accent);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-top: 24px;
      }
      .pill {
        display: inline-block;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 6px 10px;
        margin: 4px 6px 0 0;
        color: var(--muted);
        font-size: 0.92rem;
      }
      code {
        background: #f0e5d6;
        padding: 2px 6px;
        border-radius: 6px;
      }
      @media (max-width: 860px) {
        .hero, .grid { grid-template-columns: 1fr; }
        h1 { font-size: 2.3rem; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      ${body}
    </div>
  </body>
</html>`;
}

function renderHomePage() {
  const slackReady = Boolean(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET);
  const slackAction = slackReady ? '/auth/slack/start' : '#setup-needed';
  const slackStatusMessage = slackReady
    ? 'Slack connection is ready. You can start the setup in one click.'
    : 'Slack setup is almost ready. Add the client credentials to turn this button on.';

  return renderPage({
    title: 'Helper Install Hub',
    body: `
      <section class="hero">
        <div class="card">
          <div class="eyebrow">Meet Helper</div>
          <h1>Bring one smart teammate into every conversation your team cares about.</h1>
          <p>
            Helper remembers the context, picks up ongoing discussions, and helps teams move faster
            without making everyone repeat themselves. Start with Slack today, then grow into more
            platforms as your workspace expands.
          </p>
          <div class="actions">
            <a class="btn" href="${slackAction}">Add to Slack</a>
            <a class="btn secondary" href="#coming-soon">Add to Discord</a>
            <a class="btn secondary" href="#coming-soon">Connect WhatsApp</a>
          </div>
        </div>
        <div class="card">
          <h2>What Helper Brings</h2>
          <p>
            Add Helper once, and your team gets a shared assistant that can follow conversations,
            surface useful context, and make old discussions feel instantly accessible.
          </p>
          <p><strong>First launch:</strong> Slack</p>
          <p><strong>Coming next:</strong> Discord, WhatsApp, and more</p>
          <p><strong>Good for:</strong></p>
          <span class="pill">Team Q&amp;A</span>
          <span class="pill">Shared memory</span>
          <span class="pill">Faster onboarding</span>
          <span class="pill">Follow-up answers</span>
          <p style="margin-top: 18px;">
            ${slackStatusMessage}
          </p>
        </div>
      </section>
      <section class="grid" id="coming-soon">
        <div class="card">
          <h3>Slack</h3>
          <p>Drop Helper into your workspace and let it turn scattered messages into usable team memory.</p>
        </div>
        <div class="card">
          <h3>Discord</h3>
          <p>Bring the same assistant experience into community chats, private spaces, and active servers.</p>
        </div>
        <div class="card">
          <h3>WhatsApp</h3>
          <p>Keep conversations flowing even in fast-moving groups where important details usually disappear.</p>
        </div>
      </section>
    `
  });
}

function renderSlackResultPage({ title, message, details = [] }) {
  return renderPage({
    title,
    body: `
      <section class="card">
        <div class="eyebrow">Slack OAuth</div>
        <h1 style="font-size: 2.2rem;">${title}</h1>
        <p>${message}</p>
        ${details.length ? `<div>${details.map(item => `<p><strong>${item.label}:</strong> <code>${item.value}</code></p>`).join('')}</div>` : ''}
        <div class="actions">
          <a class="btn" href="/">Back to install hub</a>
        </div>
      </section>
    `
  });
}

async function requestHandler(req, res) {
  const url = new URL(req.url, appBaseUrl);

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderHomePage());
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/auth/slack/start') {
    if (!process.env.SLACK_CLIENT_ID || !process.env.SLACK_CLIENT_SECRET) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderSlackResultPage({
        title: 'Slack OAuth Not Configured',
        message: 'Add SLACK_CLIENT_ID and SLACK_CLIENT_SECRET to your .env before using Add to Slack.',
      }));
      return;
    }

    res.writeHead(302, { Location: buildSlackAuthorizeUrl() });
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/auth/slack/callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderSlackResultPage({
        title: 'Slack Install Cancelled',
        message: `Slack returned: ${error}`,
      }));
      return;
    }

    if (!code || !state) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderSlackResultPage({
        title: 'Missing OAuth Data',
        message: 'Slack callback did not include the code/state pair we need.',
      }));
      return;
    }

    try {
      const { installation } = await handleSlackOAuthCallback({ code, state });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderSlackResultPage({
        title: 'Slack Connected',
        message: 'The workspace installation was saved successfully.',
        details: [
          { label: 'Team ID', value: installation.team_id || 'n/a' },
          { label: 'Team Name', value: installation.team_name || 'n/a' },
          { label: 'Bot User ID', value: installation.bot_user_id || 'n/a' },
        ],
      }));
      return;
    } catch (oauthError) {
      console.error('[Web] Slack OAuth callback error:', oauthError);
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderSlackResultPage({
        title: 'Slack Connection Failed',
        message: oauthError.message,
      }));
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(renderPage({
    title: 'Not Found',
    body: `
      <section class="card">
        <h1 style="font-size: 2rem;">404</h1>
        <p>This route does not exist.</p>
        <div class="actions"><a class="btn" href="/">Back home</a></div>
      </section>
    `
  }));
}

async function startWebServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      requestHandler(req, res).catch(error => {
        console.error('[Web] Request handling failed:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Internal Server Error');
      });
    });

    server.on('error', reject);
    server.listen(websitePort, () => {
      console.log(`[Web] Install hub listening on ${appBaseUrl}`);
      resolve(server);
    });
  });
}

module.exports = {
  startWebServer,
};
