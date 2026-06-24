const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const cookiesDir = path.join(__dirname, '../../cookies');

// Ensure cookies directory exists
if (!fs.existsSync(cookiesDir)) {
  fs.mkdirSync(cookiesDir, { recursive: true });
}

/**
 * Resolves the path to the cookie file for a given username.
 * @param {string} [username] 
 * @returns {string}
 */
function getCookieFilePath(username) {
  const fileName = username ? `${username.replace(/[^a-zA-Z0-9_-]/g, '_')}_session.json` : 'session.json';
  return path.join(cookiesDir, fileName);
}

/**
 * Saves cookies array to a JSON file.
 * @param {string} username 
 * @param {Array} cookies 
 * @returns {boolean} Success status
 */
function saveCookies(username, cookies) {
  if (!cookies || !Array.isArray(cookies)) {
    logger.error(`Invalid cookies format provided for user: ${username || 'default'}`);
    return false;
  }

  const filePath = getCookieFilePath(username);
  try {
    const data = JSON.stringify({ cookies }, null, 2);
    fs.writeFileSync(filePath, data, 'utf8');
    logger.info(`Successfully saved cookies for user: ${username || 'default'}`);
    return true;
  } catch (err) {
    logger.error(`Failed to save cookies for user ${username || 'default'}: ${err.message}`);
    return false;
  }
}

/**
 * Loads cookies array from a JSON file.
 * @param {string} username 
 * @returns {Array|null} Cookies array or null if failed/not found
 */
function loadCookies(username) {
  const filePath = getCookieFilePath(username);

  if (!fs.existsSync(filePath)) {
    logger.warn(`Cookie session file not found for user: ${username || 'default'}`);
    return null;
  }

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(data);
    
    if (parsed && Array.isArray(parsed.cookies)) {
      logger.info(`Successfully loaded cookies for user: ${username || 'default'}`);
      return parsed.cookies;
    } else {
      logger.error(`Cookie file format invalid for user: ${username || 'default'}`);
      return null;
    }
  } catch (err) {
    logger.error(`Failed to load cookies for user ${username || 'default'}: ${err.message}`);
    return null;
  }
}

module.exports = {
  saveCookies,
  loadCookies
};
