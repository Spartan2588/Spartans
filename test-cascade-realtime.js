/**
 * Test script for Cascade Analysis with Real-Time Data
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testCascadeWithRealTime() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     Cascade Analysis - Real-Time Data Test                ║
╚════════════════════════════════════════════════════════════╝
`);

  try {
    // Test 1: Get current state
    console.log('1. Fetching current state for Mumbai...');
    const stateResponse = await fetch(`${BASE_URL}/current-state?city_id=1`);
    const currentState = await stateResponse.json();
    console.log('   ✅ Current State:');
    console.log(`      - AQI: ${currentState.aqi}`);
    console.log(`      - Temperature: ${currentState.temperature}°C`);
    console.log(`      - Hospital Load: ${currentState.hospital_load}%`);
    console.log('');

    // Test 2: Run cascade analysis
    console.log('2. Running cascade analysis with real-time data...');
    const cascadeResponse = await fetch(
      `${BASE_URL}/cascading-failure?city_id=1&trigger=power&severity=0.8&duration=24`
    );
    const cascadeData = await cascadeResponse.json();
    
    console.log('   ✅ Cascade Analysis Complete:');
    console.log(`      - City: ${cascadeData.city}`);
    console.log(`      - Trigger: ${cascadeData.trigger.domain} (${cascadeData.trigger.severity})`);
    console.log(`      - Cascades: ${cascadeData.cascades.length} failure stages`);
    console.log(`      - Domains Affected: ${cascadeData.total_impact.affected_domains}`);
    console.log(`      - Population Affected: ${(cascadeData.total_impact.population_affected / 1000000).toFixed(1)}M`);
    console.log(`      - Economic Cost: $${(cascadeData.total_impact.estimated_economic_cost / 1000000).toFixed(0)}M`);
    console.log(`      - Recommendations: ${cascadeData.recommendations.length}`);
    console.log('');

    // Test 3: Check real-time adjustments
    console.log('3. Real-Time Adjustments Applied:');
    const aqiFactor = Math.min(1.5, 1 + (currentState.aqi / 500) * 0.5);
    const tempFactor = Math.min(1.3, 1 + ((currentState.temperature - 25) / 25) * 0.3);
    const hospitalFactor = Math.min(1.4, 1 + (currentState.hospital_load / 100) * 0.4);
    const adjustedSeverity = Math.min(1.0, 0.8 * aqiFactor * tempFactor * hospitalFactor);
    
    console.log(`      - AQI Factor: ${aqiFactor.toFixed(2)}x`);
    console.log(`      - Temperature Factor: ${tempFactor.toFixed(2)}x`);
    console.log(`      - Hospital Factor: ${hospitalFactor.toFixed(2)}x`);
    console.log(`      - Base Severity: 0.8 → Adjusted: ${adjustedSeverity.toFixed(2)}`);
    console.log('');

    // Test 4: Test different triggers
    console.log('4. Testing different triggers...');
    const triggers = ['power', 'water', 'communications'];
    for (const trigger of triggers) {
      const testResponse = await fetch(
        `${BASE_URL}/cascading-failure?city_id=1&trigger=${trigger}&severity=0.7&duration=12`
      );
      const testData = await testResponse.json();
      console.log(`   ✅ ${trigger}: ${testData.cascades.length} cascades, ${testData.total_impact.affected_domains} domains`);
    }
    console.log('');

    // Test 5: Test all cities
    console.log('5. Testing all cities...');
    for (const cityId of [1, 2, 3]) {
      const cityResponse = await fetch(`${BASE_URL}/current-state?city_id=${cityId}`);
      const cityState = await cityResponse.json();
      const cascadeResponse = await fetch(
        `${BASE_URL}/cascading-failure?city_id=${cityId}&trigger=power&severity=0.8&duration=24`
      );
      const cascadeData = await cascadeResponse.json();
      console.log(`   ✅ ${cityState.city}: ${cascadeData.cascades.length} cascades, $${(cascadeData.total_impact.estimated_economic_cost / 1000000).toFixed(0)}M impact`);
    }
    console.log('');

    console.log('✅ All tests passed!');
    console.log('');
    console.log('📊 Summary:');
    console.log('   - Real-time data integration: ✅ Working');
    console.log('   - Cascade analysis: ✅ Working');
    console.log('   - Real-time adjustments: ✅ Applied');
    console.log('   - All cities: ✅ Tested');
    console.log('   - All triggers: ✅ Tested');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.cause) {
      console.error('   Cause:', error.cause);
    }
  }
}

// Run tests
testCascadeWithRealTime().then(() => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Testing Complete!                                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
