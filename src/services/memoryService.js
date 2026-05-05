const { supabase } = require('../db/supabase');
const { embedText } = require('./embeddingService');
const { searchByEmbedding } = require('./searchService');

function buildMemoryContent(message) {
  return `${message.userName}: ${message.text}`;
}

async function storeMemory(message) {
  if (!message.text || message.text.trim().length < 5 || message.isBot) {
    return { skipped: true };
  }

  const { data: existing, error: fetchError } = await supabase
    .from('slack_messages')
    .select('id')
    .eq('id', message.id)
    .single();

  if (existing) {
    return { skipped: true, reason: 'duplicate' };
  }

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error(`[Memory] Check error for msg ${message.id}:`, fetchError.message);
  }

  const memoryContent = buildMemoryContent(message);
  console.log(`[Memory] Storing: "${memoryContent.substring(0, 50)}..."`);

  const embedding = await embedText(memoryContent);
  const { error } = await supabase.from('slack_messages').upsert({
    id: message.id,
    channel_id: message.conversationId,
    user_id: message.userId || 'unknown',
    content: memoryContent,
    embedding,
  });

  if (error) {
    console.error(`[Memory] Upsert error for msg ${message.id}:`, error.message);
    return { skipped: false, error };
  }

  return { skipped: false, content: memoryContent };
}

async function searchMemories(queryText, options = {}) {
  const queryEmbedding = await embedText(queryText);
  return searchByEmbedding(queryEmbedding, options);
}

module.exports = {
  buildMemoryContent,
  storeMemory,
  searchMemories,
};
