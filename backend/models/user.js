const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  department: { 
    type: String, 
    default: 'General' 
  },
  login_attempts: { 
    type: Number, 
    default: 0 
  },
  last_location: { 
    type: String, 
    default: 'Unknown' 
  },
  mfa_enabled: { 
    type: Boolean, 
    default: false 
  },
  issue_fixed: { 
    type: Boolean, 
    default: true 
  },
  risk_level: { 
    type: String, 
    default: 'LOW' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', UserSchema);