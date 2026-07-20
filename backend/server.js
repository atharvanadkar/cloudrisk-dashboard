require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
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
    createAdminUser();
  })
  .catch(err => {
    console.log('❌ MongoDB Connection Error:', err.message);
  });

// --- MIDDLEWARE: Verify JWT Token ---
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role
    };
    next();
  });
};

// --- ROLE CHECK MIDDLEWARE ---
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// --- LOGIN ENDPOINT ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`🔐 Login attempt for: ${email}`);
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log(`❌ Invalid password for: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email,
        department: user.department,
        role: user.role
      } 
    });

  } catch (error) {
    console.log('❌ Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- SIGNUP ENDPOINT ---
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  // ========== STRICT EMAIL VALIDATION ==========
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|io|co|in|uk|us|ca|au|de|fr|jp|br|it|nl|ru|za|mx|es|kr)$/i;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address with a valid domain (e.g., user@gmail.com)'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
    });
  }

  if (username.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Username must be at least 3 characters'
    });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      department: 'New User',
      login_attempts: 0,
      last_location: 'Unknown',
      mfa_enabled: false,
      issue_fixed: true,
      risk_level: 'LOW',
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        department: newUser.department,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup'
    });
  }
});

// --- SEED DUMMY USERS ---
app.post('/api/seed-users', async (req, res) => {
  console.log('🌱 Seeding dummy users...');
  
  try {
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
        risk_level: 'HIGH'
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
        risk_level: 'LOW'
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
        risk_level: 'MEDIUM'
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
        risk_level: 'LOW'
      }
    ];

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

// --- GET ALL USERS (Role-Based) ---
app.get('/api/users', authenticateToken, async (req, res) => {
  console.log('📋 Fetching users...');
  console.log('👤 User role:', req.user.role);
  console.log('🆔 User ID:', req.user.id);
  
  try {
    let users;
    if (req.user.role === 'admin') {
      users = await User.find({}).select('-password');
      console.log(`📋 Admin: Found ${users.length} users`);
    } else {
      users = await User.find({ _id: req.user.id }).select('-password');
      console.log(`📋 User: Found ${users.length} user(s)`);
    }
    res.json(users);
  } catch (error) {
    console.log('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '🚀 Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// --- AI RISK ANALYSIS ---
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
      risk_level: aiResult.alert,
      reason: aiResult.reason,
      issue_fixed: user.issue_fixed
    });

  } catch (error) {
    console.log('❌ Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// --- MARK AS FIXED ---
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

// --- CREATE ADMIN USER ---
const createAdminUser = async () => {
  try {
    const adminEmail = 'admin@cloudrisk.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      const admin = new User({
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        department: 'Administration',
        login_attempts: 0,
        last_location: 'Unknown',
        mfa_enabled: true,
        issue_fixed: true,
        risk_level: 'LOW'
      });
      await admin.save();
      console.log('✅ Admin user created: admin@cloudrisk.com / Admin@123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } catch (error) {
    console.log('⚠️ Admin creation error:', error.message);
  }
};

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
});