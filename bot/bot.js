const { Telegraf, Markup } = require('telegraf');
const mongoose = require('mongoose');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devtools-pro', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: String,
  firstName: String,
  lastName: String,
  isAdmin: { type: Boolean, default: false },
  apiKey: String,
  keyExpiry: Date,
  isActive: { type: Boolean, default: true },
  joinedAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// API Request Schema
const apiRequestSchema = new mongoose.Schema({
  telegramId: String,
  requestType: String,
  phoneNumber: String,
  result: Object,
  timestamp: { type: Date, default: Date.now }
});

const ApiRequest = mongoose.model('ApiRequest', apiRequestSchema);

// Admin user IDs (replace with actual admin Telegram IDs)
const ADMIN_IDS = ['123456789', '987654321']; // Add your admin Telegram IDs here

// Helper functions
const isAdmin = (ctx) => {
  return ADMIN_IDS.includes(ctx.from.id.toString());
};

const generateApiKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'DEV-';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const validatePhoneNumber = async (phoneNumber) => {
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  if (cleanPhone.length < 7 || cleanPhone.length > 15) {
    return {
      valid: false,
      country: null,
      carrier: null,
      type: null,
      error: 'Invalid phone number length'
    };
  }

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
    isValid = true;
  }

  return {
    valid: isValid,
    country: country,
    carrier: 'Unknown',
    type: type,
    error: null
  };
};

// Bot commands

// Start command
bot.start(async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  try {
    let user = await User.findOne({ telegramId });
    
    if (!user) {
      // Create new user
      const apiKey = generateApiKey();
      const keyExpiry = new Date();
      keyExpiry.setDate(keyExpiry.getDate() + 30); // 30 days from now
      
      user = new User({
        telegramId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        apiKey,
        keyExpiry,
        isAdmin: ADMIN_IDS.includes(telegramId)
      });
      
      await user.save();
      
      await ctx.reply(
        `🎉 Welcome to DevTools Pro Bot!\n\n` +
        `✅ Your account has been created successfully!\n` +
        `🔑 Your API Key: \`${apiKey}\`\n` +
        `📅 Expires: ${keyExpiry.toDateString()}\n\n` +
        `Use this key to access our web tools at: https://your-website.com\n\n` +
        `Type /help to see available commands.`,
        { parse_mode: 'Markdown' }
      );
    } else {
      // Update last activity
      user.lastActivity = new Date();
      await user.save();
      
      await ctx.reply(
        `👋 Welcome back, ${user.firstName}!\n\n` +
        `🔑 Your API Key: \`${user.apiKey}\`\n` +
        `📅 Expires: ${user.keyExpiry.toDateString()}\n` +
        `Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}\n\n` +
        `Type /help to see available commands.`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    console.error('Start command error:', error);
    await ctx.reply('❌ An error occurred. Please try again later.');
  }
});

// Help command
bot.help((ctx) => {
  const helpText = `
🤖 *DevTools Pro Bot Commands*

*User Commands:*
/start - Get your API key and account info
/validate <phone> - Validate a phone number
/mykey - Get your current API key
/stats - View your usage statistics

*Admin Commands:*
/admin - Admin panel
/users - List all users
/broadcast <message> - Send message to all users
/addkey <user_id> - Generate new key for user

*Examples:*
\`/validate +1234567890\`
\`/validate 1234567890\`

Need help? Contact @muthassimbilla
  `;
  
  ctx.reply(helpText, { parse_mode: 'Markdown' });
});

// Validate phone command
bot.command('validate', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const phoneNumber = ctx.message.text.split(' ').slice(1).join(' ').trim();
  
  if (!phoneNumber) {
    return ctx.reply(
      '❌ Please provide a phone number to validate.\n\n' +
      'Example: `/validate +1234567890`',
      { parse_mode: 'Markdown' }
    );
  }
  
  try {
    // Check if user exists and is active
    const user = await User.findOne({ telegramId });
    
    if (!user) {
      return ctx.reply('❌ Please use /start first to create your account.');
    }
    
    if (!user.isActive) {
      return ctx.reply('❌ Your account is inactive. Please contact support.');
    }
    
    if (new Date() > user.keyExpiry) {
      return ctx.reply('❌ Your API key has expired. Please contact support for renewal.');
    }
    
    // Validate the phone number
    const result = await validatePhoneNumber(phoneNumber);
    
    // Log the request
    const apiRequest = new ApiRequest({
      telegramId,
      requestType: 'phone_validation',
      phoneNumber,
      result
    });
    await apiRequest.save();
    
    // Update user activity
    user.lastActivity = new Date();
    await user.save();
    
    // Format response
    const statusIcon = result.valid ? '✅' : '❌';
    const status = result.valid ? 'Valid' : 'Invalid';
    
    const responseText = `
📱 *Phone Validation Result*

📞 Number: \`${phoneNumber}\`
${statusIcon} Status: *${status}*
🌍 Country: ${result.country || 'Unknown'}
📡 Carrier: ${result.carrier || 'Unknown'}
📱 Type: ${result.type || 'Unknown'}
${result.error ? `❌ Error: ${result.error}` : ''}

Validated at: ${new Date().toLocaleString()}
    `;
    
    await ctx.reply(responseText, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Validate command error:', error);
    await ctx.reply('❌ An error occurred during validation. Please try again.');
  }
});

// My key command
bot.command('mykey', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  try {
    const user = await User.findOne({ telegramId });
    
    if (!user) {
      return ctx.reply('❌ Please use /start first to create your account.');
    }
    
    const daysLeft = Math.ceil((user.keyExpiry - new Date()) / (1000 * 60 * 60 * 24));
    const statusIcon = user.isActive ? '✅' : '❌';
    const expiryStatus = daysLeft > 0 ? `${daysLeft} days left` : 'Expired';
    
    const keyInfo = `
🔑 *Your API Key Information*

Key: \`${user.apiKey}\`
${statusIcon} Status: ${user.isActive ? 'Active' : 'Inactive'}
📅 Expires: ${user.keyExpiry.toDateString()}
⏰ Time left: ${expiryStatus}

Use this key at: https://your-website.com
    `;
    
    await ctx.reply(keyInfo, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('My key command error:', error);
    await ctx.reply('❌ An error occurred. Please try again.');
  }
});

// Stats command
bot.command('stats', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  try {
    const user = await User.findOne({ telegramId });
    
    if (!user) {
      return ctx.reply('❌ Please use /start first to create your account.');
    }
    
    const totalRequests = await ApiRequest.countDocuments({ telegramId });
    const todayRequests = await ApiRequest.countDocuments({
      telegramId,
      timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    
    const validValidations = await ApiRequest.countDocuments({
      telegramId,
      'result.valid': true
    });
    
    const statsText = `
📊 *Your Usage Statistics*

👤 User: ${user.firstName} ${user.lastName || ''}
📅 Joined: ${user.joinedAt.toDateString()}
🔄 Last Activity: ${user.lastActivity.toDateString()}

📱 *Phone Validations:*
📈 Total Requests: ${totalRequests}
📅 Today: ${todayRequests}
✅ Valid Numbers: ${validValidations}
❌ Invalid Numbers: ${totalRequests - validValidations}
📊 Success Rate: ${totalRequests > 0 ? ((validValidations / totalRequests) * 100).toFixed(1) : 0}%
    `;
    
    await ctx.reply(statsText, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Stats command error:', error);
    await ctx.reply('❌ An error occurred. Please try again.');
  }
});

// Admin commands
bot.command('admin', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('❌ You are not authorized to use admin commands.');
  }
  
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalRequests = await ApiRequest.countDocuments();
    const todayRequests = await ApiRequest.countDocuments({
      timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    
    const adminText = `
👑 *Admin Panel*

👥 *Users:*
Total: ${totalUsers}
Active: ${activeUsers}
Inactive: ${totalUsers - activeUsers}

📊 *API Requests:*
Total: ${totalRequests}
Today: ${todayRequests}

*Available Commands:*
/users - List all users
/broadcast <message> - Broadcast message
/addkey <user_id> - Generate new key
    `;
    
    await ctx.reply(adminText, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Admin command error:', error);
    await ctx.reply('❌ An error occurred. Please try again.');
  }
});

// List users command (admin only)
bot.command('users', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('❌ You are not authorized to use admin commands.');
  }
  
  try {
    const users = await User.find().sort({ joinedAt: -1 }).limit(20);
    
    let usersList = '👥 *Recent Users (Last 20):*\n\n';
    
    users.forEach((user, index) => {
      const status = user.isActive ? '✅' : '❌';
      const expiry = new Date() > user.keyExpiry ? '⚠️ Expired' : '✅ Valid';
      
      usersList += `${index + 1}. ${status} ${user.firstName} ${user.lastName || ''}\n`;
      usersList += `   ID: \`${user.telegramId}\`\n`;
      usersList += `   Key: \`${user.apiKey}\`\n`;
      usersList += `   Status: ${expiry}\n`;
      usersList += `   Joined: ${user.joinedAt.toDateString()}\n\n`;
    });
    
    await ctx.reply(usersList, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Users command error:', error);
    await ctx.reply('❌ An error occurred. Please try again.');
  }
});

// Broadcast command (admin only)
bot.command('broadcast', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('❌ You are not authorized to use admin commands.');
  }
  
  const message = ctx.message.text.split(' ').slice(1).join(' ').trim();
  
  if (!message) {
    return ctx.reply('❌ Please provide a message to broadcast.\n\nExample: `/broadcast Hello everyone!`', { parse_mode: 'Markdown' });
  }
  
  try {
    const users = await User.find({ isActive: true });
    let successCount = 0;
    let failCount = 0;
    
    for (const user of users) {
      try {
        await ctx.telegram.sendMessage(
          user.telegramId,
          `📢 *Broadcast Message*\n\n${message}`,
          { parse_mode: 'Markdown' }
        );
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to send to ${user.telegramId}:`, error);
      }
    }
    
    await ctx.reply(
      `📢 Broadcast completed!\n\n✅ Sent: ${successCount}\n❌ Failed: ${failCount}`,
      { parse_mode: 'Markdown' }
    );
    
  } catch (error) {
    console.error('Broadcast command error:', error);
    await ctx.reply('❌ An error occurred during broadcast.');
  }
});

// Add key command (admin only)
bot.command('addkey', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('❌ You are not authorized to use admin commands.');
  }
  
  const userId = ctx.message.text.split(' ')[1];
  
  if (!userId) {
    return ctx.reply('❌ Please provide a user ID.\n\nExample: `/addkey 123456789`', { parse_mode: 'Markdown' });
  }
  
  try {
    const user = await User.findOne({ telegramId: userId });
    
    if (!user) {
      return ctx.reply('❌ User not found.');
    }
    
    // Generate new key and extend expiry
    const newApiKey = generateApiKey();
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30);
    
    user.apiKey = newApiKey;
    user.keyExpiry = newExpiry;
    user.isActive = true;
    
    await user.save();
    
    // Notify the user
    try {
      await ctx.telegram.sendMessage(
        userId,
        `🎉 *New API Key Generated!*\n\n🔑 Key: \`${newApiKey}\`\n📅 Expires: ${newExpiry.toDateString()}\n\nYour account has been renewed!`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Failed to notify user:', error);
    }
    
    await ctx.reply(
      `✅ New API key generated for user ${user.firstName}!\n\n🔑 Key: \`${newApiKey}\`\n📅 Expires: ${newExpiry.toDateString()}`,
      { parse_mode: 'Markdown' }
    );
    
  } catch (error) {
    console.error('Add key command error:', error);
    await ctx.reply('❌ An error occurred. Please try again.');
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An unexpected error occurred. Please try again later.');
});

// Start the bot
bot.launch().then(() => {
  console.log('🤖 Telegram bot started successfully!');
}).catch((error) => {
  console.error('Failed to start bot:', error);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;