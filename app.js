const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const authenticateToken = require('./middlewares/auth'); // Updated the path to match middleware usage
const expressLayouts = require('express-ejs-layouts');

// Load environment variables
dotenv.config();

// Log JWT_SECRET to verify it is set correctly
//console.log(`JWT_SECRET: ${process.env.JWT_SECRET}`); 
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Middlewar
app.use(expressLayouts);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies before using them

app.set('view engine', 'ejs');
app.set('layout', 'layout'); 
// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection error:', err));


app.use('/activityRoutes', require('./routes/activityRoutes')); // Protect activity routes
app.use('/user', require('./routes/user')); // Protect user routes
app.use('/dashboard', require('./routes/dashboard'));
app.use('/leaderboard', require('./routes/leaderBoard')); // Protect leaderboard routes
app.use('/activityRoute2',require('./routes/activityRoute2'));
app.use('/photoProofRoutes',require('./routes/photoProofRoutes'));
app.use('/chat', require('./routes/chat'));

// Root route
app.get('/', (req, res) => res.redirect('/user/register'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
