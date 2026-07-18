const mongoose = require('mongoose');

const uri = 'mongodb+srv://nadkaratharva:Atharva%402004@ath.w93xw.mongodb.net/interview_project';

mongoose.connect(uri)
  .then(() => {
    console.log('🔌 Connected to MongoDB');
    return mongoose.connection.db.collection('users').updateOne(
      { username: 'johndoe' },
      { $set: { issue_fixed: false, risk_level: 'HIGH' } }
    );
  })
  .then((result) => {
    if (result.modifiedCount > 0) {
      console.log('✅ Reset johndoe to HIGH risk');
    } else {
      console.log('ℹ️ No changes made - johndoe may already be HIGH risk or not found');
    }
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Error:', err.message);
    process.exit(1);
  });