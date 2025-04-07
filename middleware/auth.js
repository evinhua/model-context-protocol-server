/**
 * Authentication middleware
 */

const dotenv = require('dotenv');

dotenv.config();

const API_KEY = process.env.API_KEY;

/**
 * Authenticate API requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticate(req, res, next) {
  // Skip authentication if no API key is configured
  if (!API_KEY) {
    console.warn('Warning: No API key configured. Authentication is disabled.');
    return next();
  }
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      error: {
        message: 'Authorization header is required',
        code: 'UNAUTHORIZED'
      }
    });
  }
  
  // Check if using Bearer token format
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    if (token === API_KEY) {
      next();
    } else {
      res.status(403).json({
        error: {
          message: 'Invalid API key',
          code: 'FORBIDDEN'
        }
      });
    }
  } else {
    res.status(401).json({
      error: {
        message: 'Authorization header must be Bearer token',
        code: 'UNAUTHORIZED'
      }
    });
  }
}

module.exports = {
  authenticate
};
