const logger = require('../utils/logger');
const redditAutomation = require('../services/redditAutomation.service');

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

    logger.info(`Initiating automated account creation for user: ${username}`);
    const result = await redditAutomation.createAccount(username.trim(), email.trim(), password);

    if (result.success) {
      return res.status(200).json({
        success: true,
        username: result.username
      });
    } else {
      if (result.captchaDetected) {
        logger.warn(`CAPTCHA blocked account creation for user: ${username}`);
        return res.status(400).json({
          success: false,
          message: 'Account creation failed: CAPTCHA block encountered. CAPTCHA solving must be completed.',
          captchaDetected: true
        });
      }
      logger.error(`Account creation automation failed for user: ${username} - ${result.message}`);
      return res.status(500).json({
        success: false,
        message: result.message || 'Account creation automation failed.'
      });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAccount
};
