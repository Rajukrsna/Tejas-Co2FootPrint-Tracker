// routes/photoRoutes.js
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const PhotoProof = require('../models/PhotoProof');
//const auth = require('../routes/auth');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const rekognition = new AWS.Rekognition();

// Upload photo
router.post('/upload',upload.single('photo'), async (req, res) => {
    try {
        const photo = req.file;
        const fileContent = require('fs').readFileSync(photo.path);

        const params = {
            Image: { Bytes: fileContent },
            MaxLabels: 10,
            MinConfidence: 80,
        };

        rekognition.detectLabels(params, async (err, data) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error recognizing image');
            }

            const recognizedLabels = data.Labels.map(label => label.Name).join(', ');
            const newPhotoProof = new PhotoProof({
                userId: req.user.userId,
                photoUrl: photo.path,
                activityRecognized: recognizedLabels,
                pointsAwarded: 50, // Assume 50 points for each proof
            });

            await newPhotoProof.save();

            // Update user points
            const user = await User.findById(req.user.userId);
            user.points += 50;
            await user.save();

            res.status(201).json({ message: 'Photo uploaded and points awarded', recognizedLabels });
        });
    } catch (err) {
        res.status(500).send('Error uploading photo');
    }
});

module.exports = router;
