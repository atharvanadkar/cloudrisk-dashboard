const OpenAI = require('openai');

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyzes user data using OpenAI to determine risk level
 * @param {Object} user - User object from database
 * @returns {Object} { alert: 'HIGH/MEDIUM/LOW', reason: 'explanation' }
 */
async function analyzeRiskWithAI(user) {
  console.log(`🤖 Analyzing risk for user: ${user.username}`);
  
  try {
    // Build the prompt for OpenAI
    const prompt = `
      You are a cybersecurity risk analyst. Analyze this user's data and classify their risk level.

      User Data:
      - Username: ${user.username}
      - Department: ${user.department}
      - Failed Login Attempts: ${user.login_attempts}
      - Last Login Location: ${user.last_location}
      - MFA Enabled: ${user.mfa_enabled}
      - Issue Already Fixed: ${user.issue_fixed}

      Instructions:
      1. If 'Issue Already Fixed' is true, ALWAYS return LOW risk.
      2. Otherwise, classify as HIGH, MEDIUM, or LOW based on:
         - HIGH: > 10 failed attempts OR location is suspicious (Russia, Nigeria, China)
         - MEDIUM: 5-10 failed attempts OR MFA is disabled
         - LOW: < 5 failed attempts AND MFA is enabled
      3. Return ONLY valid JSON in this exact format:
         { "alert": "HIGH", "reason": "One sentence explaining the risk." }
      
      Important: Return ONLY the JSON. No other text.
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // Using latest model
      messages: [
        { role: "system", content: "You are a cybersecurity expert. You output only valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,  // Low temperature for consistent results
      max_tokens: 100
    });

    // Parse the response
    const aiResponse = JSON.parse(response.choices[0].message.content);
    console.log(`✅ AI Analysis complete: ${aiResponse.alert} risk`);
    return aiResponse;

  } catch (error) {
    console.log('❌ AI Service Error:', error.message);
    
    // FALLBACK: If AI fails, use rule-based logic
    console.log('🔄 Using fallback rule-based analysis...');
    return fallbackRiskAnalysis(user);
  }
}

/**
 * FALLBACK: Rule-based risk analysis if AI fails
 */
function fallbackRiskAnalysis(user) {
  console.log('📊 Running rule-based analysis...');
  
  // If issue is fixed, always LOW
  if (user.issue_fixed) {
    return { alert: 'LOW', reason: 'Issue has been resolved.' };
  }

  // Check for HIGH risk conditions
  if (user.login_attempts > 10) {
    return { 
      alert: 'HIGH', 
      reason: `Multiple failed login attempts (${user.login_attempts}) indicate potential brute force attack.` 
    };
  }

  if (['Russia', 'Nigeria', 'China', 'North Korea'].includes(user.last_location)) {
    return { 
      alert: 'HIGH', 
      reason: `Login from ${user.last_location} - a high-risk location.` 
    };
  }

  // Check for MEDIUM risk conditions
  if (user.login_attempts >= 5 && user.login_attempts <= 10) {
    return { 
      alert: 'MEDIUM', 
      reason: `Moderate failed login attempts (${user.login_attempts}). Investigate further.` 
    };
  }

  if (!user.mfa_enabled) {
    return { 
      alert: 'MEDIUM', 
      reason: 'Multi-Factor Authentication (MFA) is disabled. Enable MFA for better security.' 
    };
  }

  // Default: LOW risk
  return { 
    alert: 'LOW', 
    reason: 'No suspicious activity detected. User appears secure.' 
  };
}

module.exports = { analyzeRiskWithAI };