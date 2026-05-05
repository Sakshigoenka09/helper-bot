require('dotenv').config();
const Groq = require('groq-sdk');
const { groqModel } = require('../config');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateContextualAnswer({ assistantLabel, userQuery, recentHistory, similarMemories }) {
  const contextText = (similarMemories || [])
    .map((memory, index) => `Past Memory ${index + 1}: ${memory.text}`)
    .join('\n\n');

  const systemPrompt = `You are a helpful ${assistantLabel}. Use the following context to answer the user's question.

RECENT CHAT HISTORY:
${recentHistory || 'No recent history.'}

PAST COMMUNITY KNOWLEDGE:
${contextText || 'No relevant past messages found.'}

INSTRUCTIONS:
1. Prioritize RECENT CHAT HISTORY if the answer is there.
2. If the context contains the answer, be direct and helpful.
3. If not found in either, use general knowledge but clearly state it was not found in records.
4. Never expose raw platform user IDs. Use names when available, otherwise say "someone" or "that person".
5. Keep answers concise and friendly.`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuery }
    ],
    model: groqModel,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || "Sorry, I couldn't generate an answer.";
}

module.exports = { generateContextualAnswer };
