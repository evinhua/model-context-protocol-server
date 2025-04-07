# Model Context Protocol (MCP) Server

A server implementation of the Model Context Protocol for managing context between AI models and applications.

## What is MCP?

The Model Context Protocol (MCP) is a protocol for managing context between AI models and applications. It provides a standardized way to:

1. Create and manage sessions for user interactions
2. Store and retrieve context data
3. Process context with AI models
4. Merge and summarize contexts
5. Query models with context-aware prompts

## Features

- Session management
- Context storage and retrieval
- Context processing with AI models
- Context merging and summarization
- Model querying with context

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables in `.env`:
   ```
   PORT=3000
   API_KEY=your_api_key_here
   MODEL_ENDPOINT=http://localhost:8000/v1/completions
   CONTEXT_DB_PATH=./data/context_db.json
   MODEL_TYPE=mistral
   ```
4. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Sessions

- `POST /api/session` - Create a new session
- `GET /api/session/:sessionId` - Get a session by ID
- `PATCH /api/session/:sessionId` - Update a session
- `DELETE /api/session/:sessionId` - Delete a session
- `GET /api/session/:sessionId/contexts` - Get all contexts for a session

### Contexts

- `POST /api/context` - Create a new context
- `GET /api/context/:contextId` - Get a context by ID
- `PATCH /api/context/:contextId` - Update a context
- `DELETE /api/context/:contextId` - Delete a context
- `POST /api/context/merge` - Merge multiple contexts
- `POST /api/context/:contextId/summarize` - Summarize a context

### Models

- `POST /api/model/query` - Query the model with a prompt and context
- `POST /api/model/process` - Process context with a model

## Authentication

All API endpoints are protected with API key authentication. Include your API key in the Authorization header:

```
Authorization: Bearer your_api_key_here
```

## Data Storage

By default, context data is stored in a JSON file at `./data/context_db.json`. You can configure a different path in the `.env` file.

## Model Integration

The server is designed to work with any AI model that supports a compatible API. Configure the model endpoint in the `.env` file.

### Supported Model Types

The server supports different model types through the `MODEL_TYPE` environment variable:

- `mistral` - For Mistral AI models
- `openai` - For OpenAI models
- `anthropic` - For Anthropic models
- `generic` - For other model providers

## SSL Certificate Verification

For development purposes, SSL certificate verification is disabled by default. In production environments, you should:

1. Either provide proper certificates
2. Or remove the `rejectUnauthorized: false` option in `modelManager.js`

## Example Usage

### Create a Session

```bash
curl -X POST http://localhost:3000/api/session \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"metadata": {"user": "example_user"}}'
```

### Create a Context

```bash
curl -X POST http://localhost:3000/api/context \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_123",
    "data": {
      "conversation": [
        {"role": "user", "content": "Hello, how are you?"},
        {"role": "assistant", "content": "I'm doing well, thank you for asking!"}
      ]
    }
  }'
```

### Query a Model with Context

```bash
curl -X POST http://localhost:3000/api/model/query \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What was my last question?",
    "contextId": "ctx_123",
    "sessionId": "session_123"
  }'
```

## License

MIT
