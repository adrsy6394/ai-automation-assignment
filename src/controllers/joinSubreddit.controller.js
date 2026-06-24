const logger = require('../utils/logger');

/**
 * Handle POST /join-subreddit
 */
async function joinSubreddit(req, res, next) {
  try {
    const { subreddit } = req.body;

    if (!subreddit || typeof subreddit !== 'string' || subreddit.trim() === '') {
      logger.warn('Join Subreddit validation failed: missing or empty subreddit');
      return res.status(400).json({
        success: false,
        message: 'Subreddit is required and must be a non-empty string'
      });
    }

    logger.info(`Mocking joining subreddit: ${subreddit}`);
    return res.status(200).json({
      joined: true
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  joinSubreddit
};
