/**
 * Model routes
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const contextManager = require('../utils/contextManager');
const modelManager = require('../utils/modelManager');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * Query the model with a prompt and context
 * POST /api/model/query
 */
router.post('/query', async (req, res, next) => {
  try {
    const { prompt, contextId, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        error: {
          message: 'prompt is required',
          code: 'MISSING_PROMPT'
        }
      });
    }
    
    let context = {};
    
    // If contextId is provided, get the context
    if (contextId) {
      try {
        const contextObj = await contextManager.getContext(contextId);
        context = contextObj.data || {};
      } catch (error) {
        return res.status(404).json({
          error: {
            message: `Context with ID ${contextId} not found`,
            code: 'CONTEXT_NOT_FOUND'
          }
        });
      }
    }
    
    // Query the model
    const response = await modelManager.queryModel(prompt, context, options || {});
    
    // Create a new context with the response if sessionId is provided
    if (req.body.sessionId) {
      const responseContext = {
        prompt,
        response: response.completion,
        timestamp: new Date().toISOString()
      };
      
      const newContext = await contextManager.createContext(req.body.sessionId, responseContext);
      
      return res.json({
        completion: response.completion,
        context: newContext
      });
    }
    
    // Otherwise just return the response
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * Process context with a model
 * POST /api/model/process
 */
router.post('/process', async (req, res, next) => {
  try {
    const { contextId, task, options } = req.body;
    
    if (!contextId) {
      return res.status(400).json({
        error: {
          message: 'contextId is required',
          code: 'MISSING_CONTEXT_ID'
        }
      });
    }
    
    if (!task) {
      return res.status(400).json({
        error: {
          message: 'task is required',
          code: 'MISSING_TASK'
        }
      });
    }
    
    // Get the context
    let context;
    try {
      context = await contextManager.getContext(contextId);
    } catch (error) {
      return res.status(404).json({
        error: {
          message: `Context with ID ${contextId} not found`,
          code: 'CONTEXT_NOT_FOUND'
        }
      });
    }
    
    // Process the context
    const processedContext = await modelManager.processContext(context, task, options || {});
    
    // Create a new context with the processed data if sessionId is provided
    if (req.body.sessionId) {
      const newContext = await contextManager.createContext(req.body.sessionId, processedContext.data);
      return res.json({
        result: processedContext.result,
        context: newContext
      });
    }
    
    // Otherwise just return the processed data
    res.json(processedContext);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
