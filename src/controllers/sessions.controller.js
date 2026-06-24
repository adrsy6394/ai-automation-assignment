const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const cookiesDir = path.join(__dirname, '../../cookies');

/**
 * Handle GET /sessions
 */
async function getSessions(req, res, next) {
  try {
    if (!fs.existsSync(cookiesDir)) {
      return res.status(200).json({ success: true, sessions: [] });
    }

    const files = fs.readdirSync(cookiesDir);
    const sessions = [];

    files.forEach(file => {
      if (file.endsWith('_session.json')) {
        const username = file.replace('_session.json', '');
        sessions.push(username);
      }
    });

    return res.status(200).json({
      success: true,
      sessions
    });
  } catch (error) {
    logger.error(`Failed to scan stored session files: ${error.message}`);
    next(error);
  }
}

module.exports = {
  getSessions
};
