const express = require('express');
const Activity = require('../models/Activity');
const User = require('../models/User');
const authenticateToken = require('../middlewares/auth');
const router = express.Router();
const dotenv = require("dotenv");
const multer = require("multer");
const sharp = require("sharp"); // Image processing library
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const axios = require('axios');
dotenv.config(); // Load environment variables
// Dashboard route
// Configure Multer for file upload
const badgeThresholds = [
    { id: 1, name: "Bronze", pointsRequired: 20 },
    { id: 2, name: "Silver", pointsRequired: 50 },
    { id: 3, name: "Gold", pointsRequired: 100 },
];






const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads"); // Folder where files will be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with timestamp
    },
});
const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.json({ limit: "10mb" })); // For JSON payloads
app.use(express.urlencoded({ extended: true })); // For form data

// Route for waste classification
router.post("/waste",authenticateToken, upload.single("image"), async (req, res) => {
    const { file } = req;

    if (!file) {
        return res.status(400).json({ error: "No image file uploaded." });
    }

    const compressedFilePath = `./uploads/compressed_${file.filename}`;

    try {
        // Compress the uploaded image using Sharp
        await sharp(file.path)
            .resize({ width: 800 }) // Resize the image to a maximum width of 800px
            .toFormat("jpeg") // Ensure the output format is JPEG
            .jpeg({ quality: 80 }) // Set JPEG quality
            .toFile(compressedFilePath); // Save the compressed file

        // Read the compressed image file and convert it to Base64
        const imageBuffer = fs.readFileSync(compressedFilePath);
        const imageBase64 = imageBuffer.toString("base64");
        // Call Sambanova AI for analysis
        const response = await analyzeImageWithAI(imageBase64);
        // Extract waste type from AI response
        const wasteType = response.toLowerCase();
        console.log(wasteType)
        return res.json({ wasteType });

    } catch (error) {
        console.error("Error processing image:", error.message);
        return res.status(500).json({ error: error.message || "Failed to process the image." });
    } 
});

// Function to call Sambanova AI API for image recognition
const analyzeImageWithAI = async (imageUrl) => {
    const apiKey = process.env.SAMBANOVA_API_KEY;
    const url = "https://api.sambanova.ai/v1/chat/completions";

    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
    };

    const data = {
        model: "Llama-3.2-11B-Vision-Instruct",
        
        messages: [
           
            {
                "role": "user",
                "content": [
                    {
                "type": "text",
                "text": "Calculate approximately the amount of co2 footprint the thing in the image would emit. Summarise your content in just 2 lines"
            },
            {
                "type": "image_url",
                "image_url": {
                   url: `data:image/jpeg;base64,${imageUrl}`}
            }]
        }
        ],
        temperature: 0.1,
        top_p: 0.1,
    };

    try {
        const response = await axios.post(url, data, { headers });
        const message = response.data.choices[0].message.content;
        return message.trim(); // Return recognized waste type
    } catch (error) {
        console.error("Error calling Sambanova API:", error.response?.data || error.message);
        throw new Error("Error with the AI API request.");
    }
};





router.get('/', authenticateToken, async (req, res) => {
    try {
        // Fetch user data
        const user = await User.findById(req.user.userId);

        // Fetch activity data
        const activities = await Activity.find({ userId: user._id });

        // Badge thresholds and logic to add earned badges
        const badgeThresholds = [
            { name: 'Bronze', pointsRequired: 20, imageUrl: "/public/Badge1.png" },
            { name: 'Silver', pointsRequired: 50 ,imageUrl: "/public/Badge2.png"},
            { name: 'Gold', pointsRequired: 100 ,imageUrl: "/public/Badge3.png"},
        ];

                // Find newly earned badges
            const newBadges = badgeThresholds
            .filter(badge => badge.pointsRequired <= user.points)
            .map(badge => ({ name: badge.name, imageUrl: badge.imageUrl }));

            // Merge with existing badges, ensuring no duplicates
            user.earned_badges = [
            ...user.earned_badges,
            ...newBadges.filter(newBadge =>
                !user.earned_badges.some(existingBadge => existingBadge.name === newBadge.name)
            )
            ];

        await user.save();

        const maxCo2Footprint = 3000;
        const contribution = 10;

        // Calculate total CO2 emissions and reduced emissions
        const co2Emitted = activities.reduce((total, activity) => total + activity.co2, 0);
        const co2Percentage = Math.min((co2Emitted / maxCo2Footprint) * 100, 100);

        // Collect suggestions from activities
        const suggestionsArray = activities
            .map(activity => activity.suggestions)
            .join("\n")
            .split("\n")
            .filter(suggestion => suggestion.trim() !== "");

        // Pass data to the dashboard view
        res.render('dashboard', {
            user,
            username: user.username,
            points: user.points,
            co2Percentage,
            co2Emitted,
            maxCo2Footprint,
            contribution,
            suggestions: suggestionsArray,
        });
    } catch (err) {
        console.error('Error loading dashboard:', err);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        // Fetch user data
        const user = await User.findById(req.user.userId).select('earned_badges');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ earned_badges: user.earned_badges });
    } catch (error) {
        console.error('Error fetching badges:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

  


module.exports = router;