const logger = require('../utils/logger');

/**
 * Handle POST /create-account
 */
async function createAccount(req, res, next) {
  try {
    const { username, email, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      logger.warn('Create Account validation failed: missing or empty username');
      return res.status(400).json({
        success: false,
        message: 'Username is required and must be a non-empty string'
      });
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      logger.warn('Create Account validation failed: missing or empty email');
      return res.status(400).json({
        success: false,
        message: 'Email is required and must be a non-empty string'
      });
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
      logger.warn('Create Account validation failed: missing or empty password');
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be a non-empty string'
      });
    }

    logger.info(`Mocking account creation for user: ${username}`);
    return res.status(200).json({
      success: true,
      username: username.trim()
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAccount
};
