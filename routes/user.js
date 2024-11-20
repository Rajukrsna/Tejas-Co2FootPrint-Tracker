const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middlewares/auth'); // Corrected path

const router = express.Router();

// GET Register Page (Sign Up)
router.get('/register', (req, res) => {
    res.render('register',{user:null}); // Render the registration form view
});

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User with this email already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save the new user to the database
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.redirect('/activityRoute2'); // Redirect to login page after registration
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).send('Internal Server Error');
    }
});

// GET Login Page
router.get('/login', async(req, res) => {
  
   
    res.render('login'); // Render the login form view
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).send('Invalid credentials');
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send('Invalid credentials');
        }
        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Set token as a cookie
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });

       
        res.redirect('/dashboard'
        );

    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('Internal Server Error');
    }
});



module.exports = router;
