const express = require('express');
const Activity = require('../models/Activity');
const User = require('../models/User');
const authenticateToken = require('../middlewares/auth');
const router = express.Router();
// Dashboard route
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Fetch user data
      
        const user = await User.findById(req.user.userId);
         // Fetch activity data
         const activities = await Activity.find({ userId: user._id });
        if (!user) {
            console.warn('User not found');
            return res.status(404).send('User not found');
        }
        const maxCo2Footprint=3000;
        const contribution=10;
         // Calculate total CO2 emissions and reduced emissions
         const co2Emitted = activities.reduce((total, activity) => total + activity.co2, 0);
         const co2Percentage = Math.min((co2Emitted / maxCo2Footprint) * 100, 100); // Cap percentage at 100%
        const suggestionsArray = activities
        .map(activity => activity.suggestions)
        .join("\n")
        .split("\n")
        .filter(suggestion => suggestion.trim() !== "");
        // Pass data to the dashboard view
        res.render('dashboard', {
            user:user,
            username: user.username,
            points: user.points,
            co2Percentage,
            co2Emitted,
            maxCo2Footprint,
           
            contribution,
            suggestions:suggestionsArray
        });
    } catch (err) {
        console.error('Error loading dashboard:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
