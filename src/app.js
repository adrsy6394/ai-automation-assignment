const express = require('express');
const path = require('path');
require('dotenv').config();

const logger = require('./utils/logger');

const app = express();

// Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware
app.use((req, res, next) => {
  logger.info(`HTTP ${req.method} ${req.originalUrl}`);
  next();
});

const createAccountRoute = require('./routes/createAccount.route');
const joinSubredditRoute = require('./routes/joinSubreddit.route');
const createPostRoute = require('./routes/createPost.route');

// Setup placeholder response for root
app.get('/', (req, res) => {
  res.json({ message: 'Reddit Automation API is running' });
});

// Register routes
app.use(createAccountRoute);
app.use(joinSubredditRoute);
app.use(createPostRoute);

// Catch-all Route Not Found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Run server if not imported by a test script
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

module.exports = app;
