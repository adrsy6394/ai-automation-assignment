const logger = require('../utils/logger');
const redditAutomation = require('../services/redditAutomation.service');

/**
 * Handle POST /create-post
 */
async function createPost(req, res, next) {
  try {
    const { subreddit, title, content, username } = req.body;

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

    // Default username fallback
    const targetUser = username ? username.trim() : null;

    logger.info(`Initiating automated post creation in r/${subreddit} with title: "${title}"`);
    const result = await redditAutomation.createPost(targetUser, subreddit.trim(), title.trim(), content.trim());

    if (result.success) {
      return res.status(200).json({
        status: 'success',
        postUrl: result.postUrl
      });
    } else {
      if (result.message && (result.message.includes('Session') || result.message.includes('session'))) {
        logger.warn(`Create Post failed: session expired or missing for user: ${targetUser || 'default'}`);
        return res.status(401).json({
          success: false,
          message: result.message
        });
      }
      
      logger.error(`Create Post failed: ${result.message}`);
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to create post.'
      });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPost
};
