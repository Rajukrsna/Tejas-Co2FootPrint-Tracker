const express = require('express');
const multer = require('multer'); // For handling file uploads
const Tesseract = require('tesseract.js'); // OCR library

const authenticateToken = require('../middlewares/auth');

const router = express.Router();

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });





/**
 * OCR-based bill processing
 */
router.post('/process-bill', authenticateToken, upload.single('bill'), async (req, res) => {
  const userId = req.user.userId;

  // Check if a file was uploaded
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Perform OCR on the uploaded file
    const { data } = await Tesseract.recognize(req.file.path, 'eng');
    console.log('OCR Result:', data.text);
   res.json({ message : `Bill processed successfully. ${data.text}`});
  } catch (error) {
    console.error('Error processing bill:', error);
    res.status(500).json({ message: 'Error processing bill', error: error.message });
  }
});

module.exports = router;
