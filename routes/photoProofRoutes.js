const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authenticateToken = require('../middlewares/auth');
const axios = require('axios');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client();
const dotenv = require('dotenv');
const User = require('../models/User');
const Activity = require('../models/Activity');

dotenv.config();
// Define categories and their sub-categories
const categories = {
    "recycled plastic": ["recycling symbol", "plastic", "recyclable material", "plastic waste"],
    "used bicycle": [
        "pre-owned bicycle",
        "second-hand bike",
        "recycled bicycle",
        "bicycle",
        "eco-friendly transport",
        "sustainable cycling",
        "bike sharing",
        "refurbished cycle",
        "green commuting",
        "low-carbon transport",
        "bicycle reuse"
    ],
    "ate veg full day": [
        "vegetarian diet",
        "plant-based meal",
        "meatless day",
        "vegan diet",
        "sustainable eating",
        "low-carbon food",
        "ethical eating",
        "green meals",
        "meat-free meals",
        "plant-forward eating"
    ],
    "carpooling": [
        "ride sharing",
        "shared commute",
        "car-sharing service",
        "eco-friendly travel",
        "reduced emissions",
        "green transportation",
        "fuel-saving commute",
        "low-carbon travel",
        "group travel",
        "sustainable transport"
    ],
    "zero waste shopping": [
        "plastic-free shopping",
        "bulk buying",
        "reuse containers",
        "eco-friendly shopping",
        "sustainable shopping",
        "minimal waste purchase",
        "recyclable packaging",
        "refill station",
        "waste-free groceries",
        "low-waste products"
    ],
    "planted tree": [
        "tree plantation",
        "reforestation",
        "forest restoration",
        "tree sapling",
         "gardening",
         "garden",
         "Nature",
        "eco-friendly activity",
        "carbon offset",
        "environmental conservation",
        "green initiative",
        "native tree planting",
        "afforestation effort"
    ],
    "switch to LED bulbs": [
        "energy-efficient lighting",
        "LED replacement",
        "low-energy bulbs",
        "eco-friendly lights",
        "sustainable lighting",
        "green energy saving",
        "carbon footprint reduction",
        "long-lasting bulbs",
        "LED retrofit",
        "energy-saving solutions"
    ],
    "plastic-free packaging": [
        "biodegradable packaging",
        "compostable packaging",
        "recyclable materials",
        "zero plastic wraps",
        "Package Delivery",
        " Cardboard",
        "Box",
        "Disposable Cup",
        "Carton",
        "eco-friendly packaging",
        "sustainable packaging",
        "waste-free packaging",
        "natural materials",
        "paper-based packaging",
        "green product packaging"
    ],
};


// Set up AWS S3 client
const s3 = new S3Client({
  region: 'us-east-1', // replace with your S3 bucket region
});

const REKOG_API_URL = process.env.awsrec;

// Configure Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // Path where the file should be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Filename with timestamp
  },
});

const upload = multer({ storage: storage });

// Middleware to parse form data (userId, category, etc.) before file upload
router.use(express.urlencoded({ extended: true })); // Ensure form data is parsed
router.use(express.json()); // Optional, if you also expect JSON payloads

router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  if (req.fileValidationError) {
    console.error('File validation error:', req.fileValidationError);
    return res.status(400).send('File validation error');
  }
  
  const { file, body } = req;
  const { category } = body; // Extract userId and category from the body
 console.log(category);
 
  

  try {
    const fileStream = fs.createReadStream(file.path);
    const bucketName = 'recbuck';
    const objectKey = file.originalname;

    const uploadParams = {
      Bucket: bucketName, // replace with your S3 bucket name
      Key: file.originalname, // unique key for the file in S3
      Body: fileStream,
      ContentType: file.mimetype, // optional: set the file's MIME type
    };

    // Upload file to S3 using PutObjectCommand
    await s3.send(new PutObjectCommand(uploadParams));


    const labels = await analyzeImage(bucketName, objectKey);

  console.log(labels);
    // Ensure labels is an array
    if (!Array.isArray(labels)) {
        return res.status(500).json({ message: 'Error: Labels are not an array' });
      }
 // Normalize the category input to lowercase
 const normalizedCategory = category.toLowerCase();
 if (!categories[normalizedCategory]) {
  console.error(`Category "${normalizedCategory}" does not exist.`);
  return res.status(400).json({ message: 'Invalid category provided' });
}

 // Check if any label matches a subcategory of the given category
const matchedLabel = labels.some(label => {
    const normalizedLabelName = label.Name.toLowerCase();
    console.log(normalizedLabelName);
    console.log(categories[normalizedCategory])
    // Check if the label matches any subcategory of the given category
    return categories[normalizedCategory]
    s?.includes(normalizedLabelName);
  });

if (matchedLabel) {
  
  const user = await User.findById(req.user.userId);
    user.points += 5; // Add 50 points
    await user.save();


  const activity = await Activity.findOne({ userId: req.user.userId });

  if (activity) {
      // Increment the reduction value by 50kg of c02 per co2footprint reduction activity(Approx);
      activity.reduction += 50;
      await activity.save();
      console.log("Activity reduction value updated successfully.");
  } else {
      // If no activity exists, create a new activity
      const newActivity = new Activity({
          userId: req.user.userId,
          suggestions: "New activity for this user",
          co2: 0, // Set appropriate co2 value
          reduction: 100, // Initialize reduction value
          date: new Date()
      });
  
      await newActivity.save();
      console.log("New activity created for the user.");
  }

    res.json({ message: 'Points awarded successfully!' });
   
  } else {
    // Respond with wrong category message if no match is found
    res.json({ message: 'Wrong category, no points awarded.' });
  }

   
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    // Cleanup local file
    fs.unlinkSync(file.path);
  }
});



async function analyzeImage(bucketName, objectKey) {
  const response = await axios.post(
    REKOG_API_URL,
    {
      imageKey: objectKey,
      bucketName: bucketName,
    },
    // Send input as a JSON object
    {
      headers: {
        'Content-Type': 'application/json', // Set Content-Type to application/json
        'Accept': 'application/json',
      },
    }
  );

  // Parse Lambda response
  let suggestions;
  if (response.data && response.data.body) {
    const lambdaBody = JSON.parse(response.data.body); // Parse JSON string in `body`
    suggestions = lambdaBody.Labels || 'Unexpected response format from Lambda.';
  } else {
    suggestions = 'Unexpected response format from Lambda.';
  }
  return suggestions;
}

module.exports = router;
