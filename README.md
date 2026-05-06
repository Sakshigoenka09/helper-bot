# Helper Bot

Helper Bot is a powerful, platform-independent AI community support bot. Utilizing a modern modular architecture, it acts as a dynamic assistant capable of retrieving context and answering questions intelligently using Retrieval-Augmented Generation (RAG). 

While currently implemented with a Slack adapter, the project's core logic has been decoupled from platform-specific APIs, making it extensible to multiple messaging platforms like Discord, Telegram, or Microsoft Teams.

## 🌟 Key Features

- **Platform Independent Architecture**: Built with modularity in mind. The core AI logic, database operations, and platform adapters are cleanly separated, allowing seamless integration with various front-ends.
- **Advanced RAG Implementation**: Combines real-time chat history with vector-based memory for highly contextual, intelligent responses.
- **Groq Integration**: Powered by Groq's high-performance LLMs (e.g., Llama-3.3-70b-versatile) for lightning-fast and accurate AI generation.
- **Supabase Vector Store**: Uses Supabase and `pgvector` for robust embedding storage and semantic search retrieval.
- **Local Embeddings**: Leverages `@xenova/transformers` for fast, cost-effective local embedding generation, avoiding external API rate limits.

## 🛠️ Technology Stack

- **Node.js**: Backend runtime environment.
- **Groq SDK**: Interfacing with cutting-edge Language Models.
- **Supabase**: PostgreSQL database with vector support for RAG storage.
- **Xenova Transformers**: Local embedding model execution.
- **Slack Bolt**: (Current Adapter) for seamless Slack workspace integration.

## 📂 Project Structure

```text
├── src/
│   ├── core/         # Core AI logic and RAG implementation
│   ├── db/           # Database setup and Supabase client
│   ├── platforms/    # Platform-specific adapters (e.g., Slack)
│   ├── services/     # External service integrations (Embeddings, LLMs)
│   └── config.js     # Environment and application configuration
├── supabase/         # Database migrations and schema files
├── index.js          # Application entry point
└── .env              # Environment variables (not tracked)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase account & project
- Groq API Key
- Slack App configured (if using the Slack adapter)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sakshigoenka09/helper-bot.git
   cd helper-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and populate it with your credentials:
   ```env
   # Supabase Credentials
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key

   # Groq API Key
   GROQ_API_KEY=your_groq_api_key

   # Slack Credentials
   SLACK_BOT_TOKEN=xoxb-...
   SLACK_SIGNING_SECRET=your_signing_secret
   SLACK_APP_TOKEN=xapp-...
   ```

4. **Database Setup**
   Run the SQL scripts located in the `supabase/` directory in your Supabase project's SQL editor to set up the necessary tables and vector extensions.

5. **Run the Bot**
   ```bash
   node index.js
   ```

## 🧠 How the RAG System Works

1. **Ingestion**: As messages are sent in the connected platform, they are captured by the adapter, embedded using local Xenova Transformers, and stored in Supabase with vector representations.
2. **Retrieval**: When a user asks a question or tags the bot, it embeds the query and performs a semantic search in Supabase to find relevant historical context.
3. **Generation**: The retrieved context is combined with the user's prompt and sent to Groq's LLM, which generates a comprehensive, context-aware answer.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Since the project is platform-independent, adding new adapters for platforms like Discord or Telegram is highly encouraged.
