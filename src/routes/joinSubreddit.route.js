const express = require('express');
const { joinSubreddit } = require('../controllers/joinSubreddit.controller');

const router = express.Router();

router.post('/join-subreddit', joinSubreddit);

module.exports = router;
