/**
 * Session routes
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const contextManager = require('../utils/contextManager');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * Create a new session
 * POST /api/session
 */
router.post('/', async (req, res, next) => {
  try {
    const { sessionId, metadata } = req.body;
    const session = await contextManager.createSession(sessionId, metadata);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

/**
 * Get a session by ID
 * GET /api/session/:sessionId
 */
router.get('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await contextManager.getSession(sessionId);
    res.json(session);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          message: `Session with ID ${req.params.sessionId} not found`,
          code: 'SESSION_NOT_FOUND'
        }
      });
    }
    next(error);
  }
});

/**
 * Update a session
 * PATCH /api/session/:sessionId
 */
router.patch('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const updates = req.body;
    const session = await contextManager.updateSession(sessionId, updates);
    res.json(session);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          message: `Session with ID ${req.params.sessionId} not found`,
          code: 'SESSION_NOT_FOUND'
        }
      });
    }
    next(error);
  }
});

/**
 * Delete a session
 * DELETE /api/session/:sessionId
 */
router.delete('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    await contextManager.deleteSession(sessionId);
    res.status(204).end();
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          message: `Session with ID ${req.params.sessionId} not found`,
          code: 'SESSION_NOT_FOUND'
        }
      });
    }
    next(error);
  }
});

/**
 * Get all contexts for a session
 * GET /api/session/:sessionId/contexts
 */
router.get('/:sessionId/contexts', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const contexts = await contextManager.getSessionContexts(sessionId);
    res.json(contexts);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          message: `Session with ID ${req.params.sessionId} not found`,
          code: 'SESSION_NOT_FOUND'
        }
      });
    }
    next(error);
  }
});

module.exports = router;
