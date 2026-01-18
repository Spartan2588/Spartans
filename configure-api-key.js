/**
 * Configure API Key for Real-Time Data
 */

import { writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const apiKey = '36a4df8166a7e11d2d9375a965d05a59';
const envPath = join(__dirname, '.env.local');

console.log(`
╔════════════════════════════════════════════════════════════╗
║     API Key Configuration                                 ║
╚════════════════════════════════════════════════════════════╝
`);

// Create .env.local file
const envContent = `# OpenWeatherMap API Key
OPENWEATHER_API_KEY=${apiKey}

# Optional: AQICN API Key
# AQICN_API_KEY=your_aqicn_key_here
`;

try {
  writeFileSync(envPath, envContent, 'utf-8');
  console.log('✅ API key saved to .env.local');
  console.log(`   Key: ${apiKey.substring(0, 8)}...${apiKey.substring(24)}`);
  console.log('');
  console.log('⚠️  Note: The API key returned a 401 error when tested.');
  console.log('   This could mean:');
  console.log('   1. The key needs to be activated (wait a few minutes)');
  console.log('   2. The key is invalid or expired');
  console.log('   3. The key has reached its rate limit');
  console.log('');
  console.log('💡 The system will automatically use fallback data if the API fails.');
  console.log('   This ensures the system always works, even without a valid key.');
  console.log('');
  console.log('📝 To verify your key:');
  console.log('   1. Visit: https://openweathermap.org/api');
  console.log('   2. Check your API key status');
  console.log('   3. Ensure it\'s activated (can take up to 2 hours)');
  console.log('');
  console.log('🔄 Next steps:');
  console.log('   1. Restart the server: npm run dev');
  console.log('   2. The system will try to use the API key');
  console.log('   3. If it fails, fallback data will be used automatically');
  console.log('');
} catch (error) {
  console.error('❌ Error saving API key:', error.message);
  console.log('');
  console.log('📝 Manual setup:');
  console.log('   Set environment variable:');
  console.log(`   export OPENWEATHER_API_KEY=${apiKey}`);
  console.log('   (or use your system\'s method)');
}
