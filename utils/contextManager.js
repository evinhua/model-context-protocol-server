/**
 * Context Manager
 * 
 * Handles storage, retrieval, and manipulation of context data
 */

const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const contextDbPath = process.env.CONTEXT_DB_PATH || path.join(__dirname, '../data/context_db.json');

/**
 * Load the context database
 * @returns {Promise<Object>} The context database
 */
async function loadContextDb() {
  try {
    const data = await fs.readFile(contextDbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading context database:', error);
    // Return empty database structure if file doesn't exist or is invalid
    return { sessions: {}, contexts: {}, models: {} };
  }
}

/**
 * Save the context database
 * @param {Object} db - The context database to save
 * @returns {Promise<void>}
 */
async function saveContextDb(db) {
  try {
    await fs.writeFile(contextDbPath, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving context database:', error);
    throw error;
  }
}

/**
 * Create a new session
 * @param {string} sessionId - Optional session ID (will be generated if not provided)
 * @param {Object} metadata - Optional metadata for the session
 * @returns {Promise<Object>} The created session
 */
async function createSession(sessionId = null, metadata = {}) {
  const db = await loadContextDb();
  
  // Generate session ID if not provided
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  // Check if session already exists
  if (db.sessions[sessionId]) {
    throw new Error(`Session with ID ${sessionId} already exists`);
  }
  
  // Create new session
  const session = {
    id: sessionId,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    contexts: [],
    metadata
  };
  
  // Save session to database
  db.sessions[sessionId] = session;
  await saveContextDb(db);
  
  return session;
}

/**
 * Get a session by ID
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} The session
 */
async function getSession(sessionId) {
  const db = await loadContextDb();
  
  const session = db.sessions[sessionId];
  if (!session) {
    throw new Error(`Session with ID ${sessionId} not found`);
  }
  
  return session;
}

/**
 * Update a session
 * @param {string} sessionId - The session ID
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} The updated session
 */
async function updateSession(sessionId, updates) {
  const db = await loadContextDb();
  
  const session = db.sessions[sessionId];
  if (!session) {
    throw new Error(`Session with ID ${sessionId} not found`);
  }
  
  // Apply updates
  const updatedSession = {
    ...session,
    ...updates,
    updated: new Date().toISOString()
  };
  
  // Save updated session
  db.sessions[sessionId] = updatedSession;
  await saveContextDb(db);
  
  return updatedSession;
}

/**
 * Delete a session
 * @param {string} sessionId - The session ID
 * @returns {Promise<void>}
 */
async function deleteSession(sessionId) {
  const db = await loadContextDb();
  
  if (!db.sessions[sessionId]) {
    throw new Error(`Session with ID ${sessionId} not found`);
  }
  
  // Delete session
  delete db.sessions[sessionId];
  await saveContextDb(db);
}

/**
 * Create a new context
 * @param {string} sessionId - The session ID
 * @param {Object} contextData - The context data
 * @returns {Promise<Object>} The created context
 */
async function createContext(sessionId, contextData) {
  const db = await loadContextDb();
  
  // Check if session exists
  if (!db.sessions[sessionId]) {
    throw new Error(`Session with ID ${sessionId} not found`);
  }
  
  // Generate context ID
  const contextId = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Create new context
  const context = {
    id: contextId,
    sessionId,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    data: contextData
  };
  
  // Save context to database
  db.contexts[contextId] = context;
  
  // Add context to session
  db.sessions[sessionId].contexts.push(contextId);
  db.sessions[sessionId].updated = new Date().toISOString();
  
  await saveContextDb(db);
  
  return context;
}

/**
 * Get a context by ID
 * @param {string} contextId - The context ID
 * @returns {Promise<Object>} The context
 */
async function getContext(contextId) {
  const db = await loadContextDb();
  
  const context = db.contexts[contextId];
  if (!context) {
    throw new Error(`Context with ID ${contextId} not found`);
  }
  
  return context;
}

/**
 * Update a context
 * @param {string} contextId - The context ID
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} The updated context
 */
async function updateContext(contextId, updates) {
  const db = await loadContextDb();
  
  const context = db.contexts[contextId];
  if (!context) {
    throw new Error(`Context with ID ${contextId} not found`);
  }
  
  // Apply updates
  const updatedContext = {
    ...context,
    data: {
      ...context.data,
      ...(updates.data || {})
    },
    updated: new Date().toISOString()
  };
  
  // Save updated context
  db.contexts[contextId] = updatedContext;
  await saveContextDb(db);
  
  return updatedContext;
}

/**
 * Delete a context
 * @param {string} contextId - The context ID
 * @returns {Promise<void>}
 */
async function deleteContext(contextId) {
  const db = await loadContextDb();
  
  const context = db.contexts[contextId];
  if (!context) {
    throw new Error(`Context with ID ${contextId} not found`);
  }
  
  // Remove context from session
  const sessionId = context.sessionId;
  if (db.sessions[sessionId]) {
    db.sessions[sessionId].contexts = db.sessions[sessionId].contexts.filter(id => id !== contextId);
    db.sessions[sessionId].updated = new Date().toISOString();
  }
  
  // Delete context
  delete db.contexts[contextId];
  await saveContextDb(db);
}

/**
 * Get all contexts for a session
 * @param {string} sessionId - The session ID
 * @returns {Promise<Array>} The contexts
 */
async function getSessionContexts(sessionId) {
  const db = await loadContextDb();
  
  const session = db.sessions[sessionId];
  if (!session) {
    throw new Error(`Session with ID ${sessionId} not found`);
  }
  
  // Get all contexts for the session
  const contexts = session.contexts.map(contextId => db.contexts[contextId]).filter(Boolean);
  
  return contexts;
}

module.exports = {
  createSession,
  getSession,
  updateSession,
  deleteSession,
  createContext,
  getContext,
  updateContext,
  deleteContext,
  getSessionContexts
};
