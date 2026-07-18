require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { analyzeRiskWithAI } = require('./aiService');
const { sendHighRiskEmail, sendThankYouEmail } = require('./emailService');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONNECT TO MONGODB ATLAS ---
console.log('🔌 Attempting to connect to MongoDB Atlas...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  })
  .catch(err => {
    console.log('❌ MongoDB Connection Error:', err.message);
    console.log('💡 Make sure:');
    console.log('   1. Your IP is whitelisted in MongoDB Atlas');
    console.log('   2. Username/password are correct');
    console.log('   3. Connection string is correct');
  });

// --- MIDDLEWARE: Verify JWT Token ---
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// --- LOGIN ENDPOINT ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`🔐 Login attempt for: ${email}`);
  
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Check password (using bcrypt)
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log(`❌ Invalid password for: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    console.log(`✅ Login successful for: ${email}`);
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email,
        department: user.department
      } 
    });
  } catch (error) {
    console.log('❌ Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- SEED DUMMY USERS (For testing) ---
app.post('/api/seed-users', async (req, res) => {
  console.log('🌱 Seeding dummy users...');
  
  try {
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const dummyUsers = [
  { 
    username: 'johndoe', 
    email: 'atharvanadkar2004@gmail.com', 
    password: hashedPassword, 
    department: 'Finance', 
    login_attempts: 15, 
    last_location: 'Russia', 
    mfa_enabled: false, 
    issue_fixed: false,
    risk_level: 'HIGH'  // ← ADD THIS
  },
  { 
    username: 'janedoe', 
    email: 'jane@company.com', 
    password: hashedPassword, 
    department: 'HR', 
    login_attempts: 2, 
    last_location: 'USA', 
    mfa_enabled: true, 
    issue_fixed: true,
    risk_level: 'LOW'  // ← ADD THIS
  },
  { 
    username: 'bobsmith', 
    email: 'bob@company.com', 
    password: hashedPassword, 
    department: 'IT', 
    login_attempts: 8, 
    last_location: 'Nigeria', 
    mfa_enabled: false, 
    issue_fixed: false,
    risk_level: 'MEDIUM'  // ← ADD THIS
  },
  { 
    username: 'alicewonder', 
    email: 'alice@company.com', 
    password: hashedPassword, 
    department: 'Marketing', 
    login_attempts: 1, 
    last_location: 'USA', 
    mfa_enabled: true, 
    issue_fixed: true,
    risk_level: 'LOW'  // ← ADD THIS
  }
];

    // Clear old data and insert new
    await User.deleteMany({});
    console.log('🗑️ Cleared existing users');
    
    const result = await User.insertMany(dummyUsers);
    console.log(`✅ Inserted ${result.length} dummy users`);
    
    res.json({ 
      success: true, 
      message: `Inserted ${result.length} dummy users!`,
      users: result.map(u => ({ username: u.username, email: u.email }))
    });
  } catch (error) {
    console.log('❌ Seeding error:', error);
    res.status(500).json({ success: false, message: 'Seeding failed' });
  }
});

// --- GET ALL USERS ---
app.get('/api/users', authenticateToken, async (req, res) => {
  console.log('📋 Fetching all users...');
  
  try {
    const users = await User.find({}).select('-password'); // Exclude password
    console.log(`📋 Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.log('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// --- HEALTH CHECK (To test if server is running) ---
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '🚀 Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// --- AI RISK ANALYSIS ENDPOINT ---
app.get('/api/analyze/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;
  console.log(`🤖 AI Risk Analysis requested for: ${username}`);
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const aiResult = await analyzeRiskWithAI(user);
    
    user.risk_level = aiResult.alert;
    await user.save();
    console.log(`✅ Updated ${username} risk level to: ${aiResult.alert}`);

    if (aiResult.alert === 'HIGH') {
      await sendHighRiskEmail(user.email, username, aiResult.reason);
    }

  res.json({
  success: true,
  username: user.username,
  email: user.email,
  risk_level: aiResult.alert,   // ✅ 'aiResult' is correct
  reason: aiResult.reason,       // ✅ 'aiResult' is correct
  issue_fixed: user.issue_fixed
});

  } catch (error) {
    console.log('❌ Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// --- "MARK AS FIXED" ENDPOINT ---
app.post('/api/fix/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;
  console.log(`🔧 Marking ${username} as fixed...`);
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.issue_fixed = true;
    user.risk_level = 'LOW';
    await user.save();
    console.log(`✅ ${username} marked as fixed. Risk level: LOW`);

    await sendThankYouEmail(user.email, username);

    res.json({
      success: true,
      message: `✅ ${username} marked as fixed. Thank you email sent!`,
      user: {
        username: user.username,
        email: user.email,
        risk_level: user.risk_level,
        issue_fixed: user.issue_fixed
      }
    });

  } catch (error) {
    console.log('❌ Fix error:', error);
    res.status(500).json({ error: 'Failed to mark as fixed' });
  }
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
});