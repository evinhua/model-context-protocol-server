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
const MODEL_TYPE = process.env.MODEL_TYPE || 'mistral'; // mistral, openai, anthropic, etc.

/**
 * Send a request to the model
 * @param {Object} prompt - The prompt to send to the model
 * @param {Object} context - The context to include with the prompt
 * @param {Object} options - Additional options for the model
 * @returns {Promise<Object>} The model response
 */
async function queryModel(prompt, context = {}, options = {}) {
  try {
    // Prepare request payload based on model type
    let payload = {};
    
    switch (MODEL_TYPE.toLowerCase()) {
      case 'mistral':
        // Format for Mistral AI
        payload = {
          prompt: prompt, // This is the required field that was missing
          model: options.model || 'mistral-12b',
          // Include context if available
          context: Object.keys(context).length > 0 ? JSON.stringify(context) : undefined,
          // Other options
          max_tokens: options.max_tokens || 500,
          temperature: options.temperature || 0.7,
          ...options
        };
        break;
        
      case 'openai':
        // Format for OpenAI
        payload = {
          model: options.model || 'gpt-3.5-turbo',
          messages: [
            // Include context as system message if available
            ...(Object.keys(context).length > 0 ? 
              [{ role: "system", content: JSON.stringify(context) }] : 
              []
            ),
            // Add the user prompt
            { role: "user", content: prompt }
          ],
          max_tokens: options.max_tokens || 500,
          temperature: options.temperature || 0.7,
          ...options
        };
        break;
        
      case 'anthropic':
        // Format for Anthropic
        payload = {
          model: options.model || 'claude-2',
          prompt: `${Object.keys(context).length > 0 ? JSON.stringify(context) + "\n\n" : ""}Human: ${prompt}\n\nAssistant:`,
          max_tokens_to_sample: options.max_tokens || 500,
          temperature: options.temperature || 0.7,
          ...options
        };
        break;
        
      default:
        // Generic format - adjust based on your model's API
        payload = {
          prompt: prompt,
          context: context,
          ...options
        };
    }
    
    // Log the request for debugging
    console.log(`Sending request to ${MODEL_ENDPOINT} with payload:`, JSON.stringify(payload, null, 2));
    
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
    
    // Log the response for debugging
    console.log('Received response:', JSON.stringify(response.data, null, 2));
    
    // Extract completion based on model type
    let completion = '';
    
    switch (MODEL_TYPE.toLowerCase()) {
      case 'mistral':
        completion = response.data.response || response.data.completion || response.data.output || '';
        break;
        
      case 'openai':
        completion = response.data.choices && response.data.choices[0].message?.content || '';
        break;
        
      case 'anthropic':
        completion = response.data.completion || '';
        break;
        
      default:
        // Try to extract completion from various formats
        completion = response.data.response || 
                    response.data.completion || 
                    (response.data.choices && response.data.choices[0].message?.content) ||
                    (response.data.choices && response.data.choices[0].text) ||
                    response.data.output ||
                    JSON.stringify(response.data);
    }
    
    return { completion };
  } catch (error) {
    console.error('Error querying model:');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
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
    // Create a prompt based on the task
    const prompt = `Task: ${task}\nContext: ${JSON.stringify(context.data || context)}`;
    
    // Query the model with the task prompt
    const result = await queryModel(prompt, {}, options);
    
    return {
      result: result.completion,
      data: {
        original: context.data || context,
        processed: result.completion,
        task: task,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error processing context:', error);
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
    const contextData = contexts.map(ctx => ctx.data || ctx);
    const prompt = `Task: Merge the following contexts into a single coherent context.\nContexts: ${JSON.stringify(contextData)}`;
    
    const result = await queryModel(prompt, {}, options);
    
    return {
      data: {
        merged: result.completion,
        sources: contexts.map(ctx => ctx.id || 'unknown'),
        timestamp: new Date().toISOString()
      }
    };
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
    const prompt = `Task: Summarize the following context.\nContext: ${JSON.stringify(context.data || context)}`;
    
    const result = await queryModel(prompt, {}, options);
    
    return {
      data: {
        original: context.data || context,
        summary: result.completion,
        timestamp: new Date().toISOString()
      }
    };
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
