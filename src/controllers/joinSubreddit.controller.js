const logger = require('../utils/logger');
const redditAutomation = require('../services/redditAutomation.service');

/**
 * Handle POST /join-subreddit
 */
async function joinSubreddit(req, res, next) {
  try {
    const { subreddit, username } = req.body;

    if (!subreddit || typeof subreddit !== 'string' || subreddit.trim() === '') {
      logger.warn('Join Subreddit validation failed: missing or empty subreddit');
      return res.status(400).json({
        success: false,
        message: 'Subreddit is required and must be a non-empty string'
      });
    }

    // Default username fallback
    const targetUser = username ? username.trim() : null;

    logger.info(`Initiating automated Join Subreddit for r/${subreddit}`);
    const result = await redditAutomation.joinSubreddit(targetUser, subreddit.trim());

    if (result.success) {
      return res.status(200).json({
        joined: true
      });
    } else {
      if (result.message && (result.message.includes('Session') || result.message.includes('session'))) {
        logger.warn(`Join Subreddit failed: session expired or missing for user: ${targetUser || 'default'}`);
        return res.status(401).json({
          success: false,
          message: result.message
        });
      }
      
      logger.error(`Join Subreddit failed: ${result.message}`);
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to join subreddit.'
      });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  joinSubreddit
};
