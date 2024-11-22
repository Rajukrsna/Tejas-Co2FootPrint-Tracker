const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const multer = require("multer");
const sharp = require("sharp"); // Image processing library
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

dotenv.config(); // Load environment variables

const router = express.Router();
const app = express();


// Configure Multer for file upload
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

router.get('/', (req,res)=> {
    res.render('analyzeimg',{wasteType:"Yet to Analyse any Image"});
})
// Route for waste classification
router.post("/waste", upload.single("image"), async (req, res) => {
    const { file } = req;

    if (!file) {
        return res.status(400).json({ error: "No image file uploaded." });
    }

    const apiKey = process.env.SAMBANOVA_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "Missing Sambanova API key. Ensure it's set in the environment variables." });
    }

    let compressedFilePath;

    try {
        // Compress the uploaded image using Sharp
        compressedFilePath = `./uploads/compressed_${file.filename}`;
        await sharp(file.path)
            .resize(400, 400, { fit: "inside" }) // Resize to a max of 400x400 while preserving aspect ratio
            .toFormat("jpeg")
            .jpeg({ quality: 30 }) // Compress to 30% quality
            .toFile(compressedFilePath);

        // Read the compressed image file and convert it to Base64
        const imageBuffer = fs.readFileSync(compressedFilePath);
        const imageBase64 = imageBuffer.toString("base64");

        // Call Sambanova AI for analysis
        const response = await analyzeImageWithAI(imageBase64);

        // Extract waste type from AI response
        const wasteType = response.toLowerCase();
       console.log(wasteType);

           res.render('analyzeimg',{wasteType:wasteType})
        
    } catch (error) {
        console.error("Error processing image:", error.message);
        return res.status(500).json({ error: error.message || "Failed to process the image." });
    } 
});

// Function to call Sambanova AI API for image recognition
const analyzeImageWithAI = async (imageBase64) => {
    const apiKey = process.env.SAMBANOVA_API_KEY;
    const url = "https://api.sambanova.ai/v1/chat/completions";

    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
    };

    const data = {
        model: "Llama-3.2-90B-Vision-Instruct",
        messages: [
            { role: "user", content: `1. What type of waste do you see in the image?The possible types of waste are plastic, glass, paper, rubber ` },
            { role: "user", content: "2. What is the estimated CO2 footprint (in kg) for that object that you saw?" },
            { role: "user", content: `data:image/jpeg;base64,${imageBase64}` },
           
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

// Export the router
module.exports = router;
