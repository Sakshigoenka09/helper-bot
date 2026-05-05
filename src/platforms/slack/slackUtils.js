const userCache = new Map();

async function getUserName(client, userId) {
  if (!userId) return 'Someone';
  if (userCache.has(userId)) return userCache.get(userId);

  try {
    const response = await client.users.info({ user: userId });
    const name = response.user?.profile?.real_name || response.user?.name || userId;
    userCache.set(userId, name);
    return name;
  } catch (error) {
    console.error(`[SlackUtils] Error fetching user ${userId}:`, error.message);
    const fallbackName = 'Someone';
    userCache.set(userId, fallbackName);
    return fallbackName;
  }
}

async function resolveMentions(client, text) {
  if (!text) return '';
  const mentionRegex = /<@([A-Z0-9]+)>/g;
  const matches = [...text.matchAll(mentionRegex)];

  let resolvedText = text;
  for (const match of matches) {
    const userId = match[1];
    const name = await getUserName(client, userId);
    resolvedText = resolvedText.replace(match[0], `@${name}`);
  }

  return resolvedText;
}

module.exports = { getUserName, resolveMentions };
