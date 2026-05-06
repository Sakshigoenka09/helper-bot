# Helper Bot 🤖

Hey there! Welcome to **Helper Bot**. 

I originally built this as a Slack bot to help answer community questions, but it's grown into something much cooler. It's now a fully platform-independent AI assistant. That means the brain of the bot is completely separated from the chat platform—right now it connects to Slack, but you could easily hook it up to Discord, Telegram, or anywhere else.

The coolest part about this project is how it remembers things. It uses RAG (Retrieval-Augmented Generation) to actually look back at the conversation history before it answers, so it always has the right context.

## What makes it tick?

- **Platform Independent:** The core logic, database, and chat integrations are all decoupled. Swap out the front-end whenever you want.
- **Smart Memory (RAG):** It doesn't just hallucinate answers. It pulls real context from past chats using vector search.
- **Lightning Fast AI:** Powered by Groq (using Llama-3.3-70b-versatile), so it responds almost instantly.
- **Supabase & pgvector:** All the chat history and embeddings are safely stored in Supabase.
- **Local Embeddings:** To save on API costs and keep things fast, it generates embeddings locally using Xenova Transformers instead of hitting an external API.

## Built With

- Node.js
- Groq SDK
- Supabase (PostgreSQL + pgvector)
- @xenova/transformers
- Slack Bolt (for the current Slack integration)

## How it works under the hood

1. **Reading messages:** As people chat, the bot listens in, creates local embeddings of the messages, and saves them to Supabase.
2. **Finding context:** When someone asks a question, the bot searches Supabase to find the most relevant past conversations.
3. **Answering:** It takes that context, bundles it up with the user's question, and sends it to Groq to generate a smart, helpful response.

## Want to run it yourself?

### What you'll need
- Node.js installed (v18 or higher)
- A Supabase project
- A Groq API key
- A Slack App (if you want to use the Slack adapter)

### Setup steps

1. **Grab the code**
   ```bash
   git clone https://github.com/Sakshigoenka09/helper-bot.git
   cd helper-bot
   ```

2. **Install the packages**
   ```bash
   npm install
   ```

3. **Set up your environment variables**
   Create a `.env` file in the root folder and drop in your keys:
   ```env
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key

   # Groq
   GROQ_API_KEY=your_groq_api_key

   # Slack (optional, if using the Slack adapter)
   SLACK_BOT_TOKEN=xoxb-...
   SLACK_SIGNING_SECRET=your_signing_secret
   SLACK_APP_TOKEN=xapp-...
   ```

4. **Database setup**
   Head over to your Supabase SQL editor and run the scripts in the `supabase/` folder. This will set up the tables and turn on the vector extension.

5. **Fire it up!**
   ```bash
   node index.js
   ```

## Contributing

Feel free to open an issue or submit a pull request! I'd especially love to see adapters built for other platforms like Discord.
