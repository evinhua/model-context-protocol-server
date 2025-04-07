/**
 * Context routes
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const contextManager = require('../utils/contextManager');
const modelManager = require('../utils/modelManager');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * Create a new context
 * POST /api/context
 */
router.post('/', async (req, res, next) => {
  try {
    const { sessionId, data } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        error: {
          message: 'sessionId is required',
          code: 'MISSING_SESSION_ID'
        }
      });
    }
    
    const context = await contextManager.createContext(sessionId, data);
    res.status(201).json(context);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          message: `Session with ID ${req.body.sessionId} not found`,
          code: 'SESSION_NOT_FOUND'
        }
      });
    }
    next(error);
  }
});

/**
 * Get a context by ID
 * GET /api/context/:contextId
 */
router.get('/:contextId', async (req, res, next) => {
  try {
    const { contextId } = req.params;
    const context = await contextManager.getContext(contextId);
    res.json(context);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          message: `Context with ID ${req.params.contextId} not found`,
          code: 'CONTEXT_NOT_FOUND'
        }
      });
    }
    next(error);
  }
});

/**
 * Update a context
 * PATCH /api/context/:contextId
 */
router.patch('/:contextId', async (req, res, next) => {
  try {
    const { contextId } = req.params;
    const updates = req.body;
    const context = await contextManager.updateContext(contextId, updates);
    res.json(context);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          message: `Context with ID ${req.params.contextId} not found`,
          code: 'CONTEXT_NOT_FOUND'
        }
      });
    }
    next(error);
  }
});

/**
 * Delete a context
 * DELETE /api/context/:contextId
 */
router.delete('/:contextId', async (req, res, next) => {
  try {
    const { contextId } = req.params;
    await contextManager.deleteContext(contextId);
    res.status(204).end();
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          message: `Context with ID ${req.params.contextId} not found`,
          code: 'CONTEXT_NOT_FOUND'
        }
      });
    }
    next(error);
  }
});

/**
 * Merge multiple contexts
 * POST /api/context/merge
 */
router.post('/merge', async (req, res, next) => {
  try {
    const { contextIds, options } = req.body;
    
    if (!contextIds || !Array.isArray(contextIds) || contextIds.length === 0) {
      return res.status(400).json({
        error: {
          message: 'contextIds array is required and must not be empty',
          code: 'INVALID_CONTEXT_IDS'
        }
      });
    }
    
    // Get all contexts
    const contexts = [];
    for (const contextId of contextIds) {
      try {
        const context = await contextManager.getContext(contextId);
        contexts.push(context);
      } catch (error) {
        return res.status(404).json({
          error: {
            message: `Context with ID ${contextId} not found`,
            code: 'CONTEXT_NOT_FOUND'
          }
        });
      }
    }
    
    // Merge contexts
    const mergedContext = await modelManager.mergeContexts(contexts, options || {});
    
    // Create new context with merged data if sessionId is provided
    if (req.body.sessionId) {
      const newContext = await contextManager.createContext(req.body.sessionId, mergedContext.data);
      return res.status(201).json(newContext);
    }
    
    // Otherwise just return the merged data
    res.json(mergedContext);
  } catch (error) {
    next(error);
  }
});

/**
 * Summarize a context
 * POST /api/context/:contextId/summarize
 */
router.post('/:contextId/summarize', async (req, res, next) => {
  try {
    const { contextId } = req.params;
    const { options } = req.body;
    
    // Get the context
    const context = await contextManager.getContext(contextId);
    
    // Summarize the context
    const summarizedContext = await modelManager.summarizeContext(context, options || {});
    
    // Create new context with summarized data if sessionId is provided
    if (req.body.sessionId) {
      const newContext = await contextManager.createContext(req.body.sessionId, summarizedContext.data);
      return res.status(201).json(newContext);
    }
    
    // Otherwise just return the summarized data
    res.json(summarizedContext);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          message: `Context with ID ${req.params.contextId} not found`,
          code: 'CONTEXT_NOT_FOUND'
        }
      });
    }
    next(error);
  }
});

module.exports = router;
