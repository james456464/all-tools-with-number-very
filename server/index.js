const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devtools-pro', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Phone Validation Schema
const phoneValidationSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  isValid: { type: Boolean, required: true },
  country: String,
  carrier: String,
  type: String,
  validatedAt: { type: Date, default: Date.now },
  apiUsed: String,
  userAgent: String,
  ipAddress: String
});

const PhoneValidation = mongoose.model('PhoneValidation', phoneValidationSchema);

// API Key Usage Schema
const apiUsageSchema = new mongoose.Schema({
  apiKey: { type: String, required: true },
  endpoint: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ipAddress: String,
  userAgent: String,
  requestData: Object,
  responseData: Object
});

const ApiUsage = mongoose.model('ApiUsage', apiUsageSchema);

// User Activity Schema
const userActivitySchema = new mongoose.Schema({
  userId: String,
  action: String,
  tool: String,
  timestamp: { type: Date, default: Date.now },
  ipAddress: String,
  userAgent: String,
  metadata: Object
});

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

// Middleware to log API usage
const logApiUsage = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || 'anonymous';
  const usage = new ApiUsage({
    apiKey,
    endpoint: req.path,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    requestData: req.body
  });
  
  try {
    await usage.save();
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
  
  next();
};

// Phone validation function using multiple APIs
async function validatePhoneNumber(phoneNumber) {
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Basic validation
  if (cleanPhone.length < 7 || cleanPhone.length > 15) {
    return {
      valid: false,
      country: null,
      carrier: null,
      type: null,
      error: 'Invalid phone number length'
    };
  }

  try {
    // Try multiple validation methods
    
    // Method 1: Basic regex validation
    const isValidFormat = /^\+?[1-9]\d{1,14}$/.test(cleanPhone);
    
    if (!isValidFormat) {
      return {
        valid: false,
        country: 'Unknown',
        carrier: 'Unknown',
        type: 'Unknown',
        error: 'Invalid format'
      };
    }

    // Method 2: Country code detection
    let country = 'Unknown';
    let type = 'Mobile';
    
    if (cleanPhone.startsWith('+1') || cleanPhone.startsWith('1')) {
      country = 'United States/Canada';
    } else if (cleanPhone.startsWith('+44')) {
      country = 'United Kingdom';
    } else if (cleanPhone.startsWith('+91')) {
      country = 'India';
    } else if (cleanPhone.startsWith('+86')) {
      country = 'China';
    } else if (cleanPhone.startsWith('+49')) {
      country = 'Germany';
    } else if (cleanPhone.startsWith('+33')) {
      country = 'France';
    } else if (cleanPhone.startsWith('+81')) {
      country = 'Japan';
    } else if (cleanPhone.startsWith('+82')) {
      country = 'South Korea';
    } else if (cleanPhone.startsWith('+55')) {
      country = 'Brazil';
    } else if (cleanPhone.startsWith('+61')) {
      country = 'Australia';
    }

    // Method 3: Length-based validation by country
    let isValid = false;
    
    if (cleanPhone.startsWith('+1') && cleanPhone.length === 12) {
      isValid = true;
    } else if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
      isValid = true;
    } else if (cleanPhone.startsWith('+44') && (cleanPhone.length >= 12 && cleanPhone.length <= 13)) {
      isValid = true;
    } else if (cleanPhone.startsWith('+91') && cleanPhone.length === 13) {
      isValid = true;
    } else if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
      isValid = true; // Generic validation for other countries
    }

    return {
      valid: isValid,
      country: country,
      carrier: 'Unknown', // Would need paid API for carrier detection
      type: type,
      error: null
    };

  } catch (error) {
    console.error('Phone validation error:', error);
    return {
      valid: false,
      country: 'Unknown',
      carrier: 'Unknown',
      type: 'Unknown',
      error: 'Validation service error'
    };
  }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Phone validation endpoint
app.post('/api/validate-phone', logApiUsage, async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Check if we have cached result
    const cached = await PhoneValidation.findOne({ phone }).sort({ validatedAt: -1 });
    
    if (cached && (Date.now() - cached.validatedAt.getTime()) < 24 * 60 * 60 * 1000) {
      // Return cached result if less than 24 hours old
      return res.json({
        valid: cached.isValid,
        country: cached.country,
        carrier: cached.carrier,
        type: cached.type,
        cached: true
      });
    }

    // Validate phone number
    const result = await validatePhoneNumber(phone);
    
    // Save validation result
    const validation = new PhoneValidation({
      phone,
      isValid: result.valid,
      country: result.country,
      carrier: result.carrier,
      type: result.type,
      apiUsed: 'internal',
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });
    
    await validation.save();
    
    res.json(result);
    
  } catch (error) {
    console.error('Phone validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk phone validation endpoint
app.post('/api/validate-phones-bulk', logApiUsage, async (req, res) => {
  try {
    const { phones } = req.body;
    
    if (!phones || !Array.isArray(phones)) {
      return res.status(400).json({ error: 'Phones array is required' });
    }

    if (phones.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 phones per request' });
    }

    const results = [];
    
    for (const phone of phones) {
      try {
        const result = await validatePhoneNumber(phone);
        results.push({ phone, ...result });
        
        // Save to database
        const validation = new PhoneValidation({
          phone,
          isValid: result.valid,
          country: result.country,
          carrier: result.carrier,
          type: result.type,
          apiUsed: 'internal-bulk',
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        });
        
        await validation.save();
        
      } catch (error) {
        results.push({
          phone,
          valid: false,
          error: 'Validation failed'
        });
      }
    }
    
    res.json({ results });
    
  } catch (error) {
    console.error('Bulk validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get validation statistics
app.get('/api/validation-stats', logApiUsage, async (req, res) => {
  try {
    const totalValidations = await PhoneValidation.countDocuments();
    const validNumbers = await PhoneValidation.countDocuments({ isValid: true });
    const invalidNumbers = await PhoneValidation.countDocuments({ isValid: false });
    
    const countryStats = await PhoneValidation.aggregate([
      { $match: { isValid: true } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const dailyStats = await PhoneValidation.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$validatedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);
    
    res.json({
      total: totalValidations,
      valid: validNumbers,
      invalid: invalidNumbers,
      successRate: totalValidations > 0 ? (validNumbers / totalValidations * 100).toFixed(2) : 0,
      countryStats,
      dailyStats
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Log user activity
app.post('/api/log-activity', async (req, res) => {
  try {
    const { userId, action, tool, metadata } = req.body;
    
    const activity = new UserActivity({
      userId,
      action,
      tool,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata
    });
    
    await activity.save();
    res.json({ success: true });
    
  } catch (error) {
    console.error('Activity logging error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get API usage statistics
app.get('/api/usage-stats', async (req, res) => {
  try {
    const totalRequests = await ApiUsage.countDocuments();
    const todayRequests = await ApiUsage.countDocuments({
      timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    
    const endpointStats = await ApiUsage.aggregate([
      { $group: { _id: '$endpoint', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      totalRequests,
      todayRequests,
      endpointStats
    });
    
  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB connected: ${mongoose.connection.readyState === 1 ? 'Yes' : 'No'}`);
});

module.exports = app;