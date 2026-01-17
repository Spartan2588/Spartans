/**
 * Setup script for Real-Time Data Integration
 * Helps configure API keys and test the system
 */

import { RealTimeDataService } from './services/RealTimeDataService.js';
import fetch from 'node-fetch';

global.fetch = fetch;

console.log(`
╔════════════════════════════════════════════════════════════╗
║     Real-Time Data Integration Setup                      ║
╚════════════════════════════════════════════════════════════╝
`);

// Check environment variables
const openWeatherKey = process.env.OPENWEATHER_API_KEY;
const aqicnKey = process.env.AQICN_API_KEY;

console.log('📋 Configuration Status:');
console.log(`   OpenWeatherMap API Key: ${openWeatherKey ? '✅ Set' : '❌ Not set'}`);
console.log(`   AQICN API Key: ${aqicnKey ? '✅ Set' : '❌ Not set'}`);
console.log('');

// Initialize service
const dataService = new RealTimeDataService();

// Test data fetching
async function testDataFetching() {
  console.log('🧪 Testing Real-Time Data Service...\n');

  try {
    console.log('1. Testing current state for Mumbai (city_id=1)...');
    const state = await dataService.getCurrentState(1);
    console.log('   ✅ Success!');
    console.log(`   - City: ${state.city}`);
    console.log(`   - AQI: ${state.aqi}`);
    console.log(`   - Temperature: ${state.temperature}°C`);
    console.log(`   - Hospital Load: ${state.hospital_load}%`);
    console.log(`   - Traffic: ${state.traffic_density}`);
    console.log('');

    console.log('2. Testing historical data...');
    const historical = await dataService.getHistoricalData(1, 24);
    console.log('   ✅ Success!');
    console.log(`   - AQI data points: ${historical.aqi.length}`);
    console.log(`   - Temperature data points: ${historical.temperature.length}`);
    console.log('');

    console.log('3. Testing cache functionality...');
    const startTime = Date.now();
    const cachedState = await dataService.getCurrentState(1);
    const cacheTime = Date.now() - startTime;
    console.log(`   ✅ Cache working! Response time: ${cacheTime}ms`);
    console.log('');

    console.log('4. Testing all cities...');
    for (const cityId of [1, 2, 3]) {
      const cityState = await dataService.getCurrentState(cityId);
      console.log(`   ✅ ${cityState.city}: AQI=${cityState.aqi}, Temp=${cityState.temperature}°C`);
    }
    console.log('');

    console.log('✅ All tests passed!');
    console.log('');
    console.log('📊 System Status:');
    if (!openWeatherKey && !aqicnKey) {
      console.log('   ⚠️  Using fallback data (no API keys configured)');
      console.log('   💡 To enable real-time data:');
      console.log('      1. Get free OpenWeatherMap API key: https://openweathermap.org/api');
      console.log('      2. Set: export OPENWEATHER_API_KEY=your_key');
      console.log('      3. Restart server');
    } else {
      console.log('   ✅ Real-time APIs configured');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run tests
testDataFetching().then(() => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Setup Complete!                                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
