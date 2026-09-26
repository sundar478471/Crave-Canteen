import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production' || process.argv.includes('--prod'),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  
  // SMTP Config
  smtp: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    host: (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.host.com') ? process.env.SMTP_HOST : 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
  },

  // Gemini API Key
  geminiApiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '',
};
