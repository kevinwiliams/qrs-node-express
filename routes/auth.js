const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Query the database to find the user by username
    const result = await sql.query`SELECT * FROM [dbo].[AspNetUsers] WHERE [UserName] = ${username}`;
    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    // Compare the password hash
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    // Set user session
    req.session.user = user;
    res.json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset password route
router.post('/reset-password', async (req, res) => {
  // Implement password reset logic here
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  // Implement forgot password logic here
});

module.exports = router;
