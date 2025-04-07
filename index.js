/**
 * Model Context Protocol (MCP) Server
 * 
 * This server implements the Model Context Protocol for managing context
 * between AI models and applications.
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Import routes
const contextRoutes = require('./routes/context');
const modelRoutes = require('./routes/model');
const sessionRoutes = require('./routes/session');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize context database if it doesn't exist
const contextDbPath = process.env.CONTEXT_DB_PATH || path.join(dataDir, 'context_db.json');
if (!fs.existsSync(contextDbPath)) {
  fs.writeFileSync(contextDbPath, JSON.stringify({
    sessions: {},
    contexts: {},
    models: {}
  }, null, 2));
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Model Context Protocol Server',
    version: '1.0.0',
    status: 'running'
  });
});

// Use routes
app.use('/api/context', contextRoutes);
app.use('/api/model', modelRoutes);
app.use('/api/session', sessionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
