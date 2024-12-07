const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth');
const User = require('../models/User');
const Activity = require('../models/Activity'); // Fixed typo in path
const Daily = require('../models/daily')
// Routes
router.get("/",authenticateToken, (req, res) => {
    res.render("calculate");
});

router.post("/log", authenticateToken, async (req, res) => { // Added async for asynchronous operations
    try {
        const { monthlyFootprint, transport, energy , food } = req.body; // Extract data from request body
        const userId = req.user.userId; // Ensure req.userId is populated by authenticateToken middleware
     
        // Find the user's activity or create a new one if none exists
        let activity = await Activity.findOne({ userId });
        
        if (!activity) {
            activity = new Activity({ userId }); // Create a new activity document
        }
        // Update the co2 values
        activity.co2 = monthlyFootprint;
        // Save the updated activity
        await activity.save();

        const user = await User.findById(req.user.userId);

   const dailyact = new Daily({
    userId:user._id,
    co2_transportation:transport,
    co2_energy:energy,
    co2_diet: food,

});
console.log(dailyact)
    await dailyact.save()

        res.status(200).json({ message: "Activity logged successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while logging activity." });
    }
});

module.exports = router;
