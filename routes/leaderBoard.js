// routes/leaderboardRoutes.js
const express = require('express');
const User = require('../models/User');
const authenticateToken = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticateToken ,async (req, res) => {
    try {
     
        const users = await User.find().sort({ points: -1 }).limit(10).select('username points');
        const user = await User.findById(req.user.userId);
        res.render('leaderboard', { user :user,users });
    } catch (err) {
        res.status(500).send('Error fetching leaderboard');
    }
});

module.exports = router;
