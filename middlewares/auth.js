const jwt = require('jsonwebtoken');


const authenticateToken = (req, res, next) => {
    const token = req.cookies.authToken; // Extract token from cookies
    // Debugging line
    if (!token) {
        return res.redirect('/user/login'); // Redirect to login if no token is found
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Attach user ID to request
        next();
    } catch (err) {
        console.error('Invalid Token:', err);
        res.status(403).send('Access Denied: Invalid Token');
    }
};

module.exports = authenticateToken;
