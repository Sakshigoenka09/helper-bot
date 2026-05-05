const { supabase } = require('../db/supabase');

async function searchByEmbedding(queryEmbedding, options = {}) {
  const topK = options.topK ?? 5;
  const threshold = options.threshold ?? 0.5;

  const { data, error } = await supabase.rpc('match_slack_messages', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: topK,
  });

  if (error) {
    console.error('[Search] Supabase RPC error:', error.message);
    return [];
  }

  if (data && data.length > 0) {
    console.log(`[Search] Top match similarity: ${data[0].similarity.toFixed(3)}`);
  } else {
    console.log('[Search] No matches found above threshold.');
  }

  return (data || []).map(row => ({ ...row, text: row.content }));
}

module.exports = { searchByEmbedding };
