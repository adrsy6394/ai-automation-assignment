const logger = require('../utils/logger');

/**
 * Handle POST /create-post
 */
async function createPost(req, res, next) {
  try {
    const { subreddit, title, content } = req.body;

    if (!subreddit || typeof subreddit !== 'string' || subreddit.trim() === '') {
      logger.warn('Create Post validation failed: missing or empty subreddit');
      return res.status(400).json({
        success: false,
        message: 'Subreddit is required and must be a non-empty string'
      });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      logger.warn('Create Post validation failed: missing or empty title');
      return res.status(400).json({
        success: false,
        message: 'Title is required and must be a non-empty string'
      });
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      logger.warn('Create Post validation failed: missing or empty content');
      return res.status(400).json({
        success: false,
        message: 'Content is required and must be a non-empty string'
      });
    }

    logger.info(`Mocking post creation in subreddit: ${subreddit} with title: "${title}"`);
    return res.status(200).json({
      status: 'success',
      postUrl: `https://www.reddit.com/r/${subreddit.trim()}/comments/mock_post_id`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPost
};
