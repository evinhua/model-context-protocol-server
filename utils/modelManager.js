/**
 * Model Manager
 * 
 * Handles interactions with AI models
 */

const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const MODEL_ENDPOINT = process.env.MODEL_ENDPOINT || 'http://localhost:8000/v1/completions';
const API_KEY = process.env.API_KEY;

/**
 * Send a request to the model
 * @param {Object} prompt - The prompt to send to the model
 * @param {Object} context - The context to include with the prompt
 * @param {Object} options - Additional options for the model
 * @returns {Promise<Object>} The model response
 */
async function queryModel(prompt, context = {}, options = {}) {
  try {
    // Prepare request payload
    const payload = {
      prompt,
      context,
      ...options
    };
    
    // Set up request headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add API key if available
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }
    
    // Send request to model endpoint
    const response = await axios.post(MODEL_ENDPOINT, payload, { headers });
    
    return response.data;
  } catch (error) {
    console.error('Error querying model:', error.response?.data || error.message);
    throw new Error(`Model query failed: ${error.message}`);
  }
}

/**
 * Process context with a model
 * @param {Object} context - The context to process
 * @param {string} task - The task to perform on the context
 * @param {Object} options - Additional options for processing
 * @returns {Promise<Object>} The processed context
 */
async function processContext(context, task, options = {}) {
  try {
    // Prepare request payload
    const payload = {
      context,
      task,
      options
    };
    
    // Set up request headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add API key if available
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }
    
    // Send request to model endpoint
    const processEndpoint = `${MODEL_ENDPOINT.replace('/completions', '/process')}`;
    const response = await axios.post(processEndpoint, payload, { headers });
    
    return response.data;
  } catch (error) {
    console.error('Error processing context:', error.response?.data || error.message);
    throw new Error(`Context processing failed: ${error.message}`);
  }
}

/**
 * Merge multiple contexts
 * @param {Array<Object>} contexts - The contexts to merge
 * @param {Object} options - Options for merging
 * @returns {Promise<Object>} The merged context
 */
async function mergeContexts(contexts, options = {}) {
  try {
    // Simple merge for basic contexts
    if (!options.useModel) {
      // Combine all context data
      const mergedData = contexts.reduce((merged, context) => {
        return {
          ...merged,
          ...(context.data || {})
        };
      }, {});
      
      return { data: mergedData };
    }
    
    // For complex merges, use the model
    return await processContext(contexts, 'merge', options);
  } catch (error) {
    console.error('Error merging contexts:', error);
    throw new Error(`Context merge failed: ${error.message}`);
  }
}

/**
 * Summarize context
 * @param {Object} context - The context to summarize
 * @param {Object} options - Options for summarization
 * @returns {Promise<Object>} The summarized context
 */
async function summarizeContext(context, options = {}) {
  try {
    return await processContext(context, 'summarize', options);
  } catch (error) {
    console.error('Error summarizing context:', error);
    throw new Error(`Context summarization failed: ${error.message}`);
  }
}

module.exports = {
  queryModel,
  processContext,
  mergeContexts,
  summarizeContext
};
