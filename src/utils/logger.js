const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../../logs/app.log');

// Ensure logs directory exists
const logDir = path.dirname(logFilePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function log(level, message) {
  const timestamp = getTimestamp();
  const formattedMessage = `[${timestamp}] [${level}] ${message}\n`;

  // Write to console
  if (level === 'ERROR') {
    console.error(formattedMessage.trim());
  } else if (level === 'WARN') {
    console.warn(formattedMessage.trim());
  } else {
    console.log(formattedMessage.trim());
  }

  // Write to log file
  try {
    fs.appendFileSync(logFilePath, formattedMessage, 'utf8');
  } catch (err) {
    console.error(`Failed to write to log file: ${err.message}`);
  }
}

module.exports = {
  info: (msg) => log('INFO', msg),
  error: (msg) => log('ERROR', msg),
  warn: (msg) => log('WARN', msg),
  debug: (msg) => log('DEBUG', msg)
};
