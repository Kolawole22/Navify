/**
 * Manual Test Script for Address Creation with the new DDC system
 * 
 * This script can be run directly with:
 * ts-node src/tests/manual-address-test.ts
 */

import dotenv from 'dotenv';
import { generateHhgCode, parseDDC } from '../utils/addressing';

// Load environment variables
dotenv.config();

// Test locations with different scenarios
const testLocations = [
  {
    name: 'Lagos (No state/LGA provided)',
    data: {
      latitude: 6.5,
      longitude: 3.3,
      street: '123 Victoria Island',
      city: 'Lagos',
      houseNumber: '45',
    }
  },
  {
    name: 'Abuja (With state/LGA provided)',
    data: {
      latitude: 9.0,
      longitude: 7.5,
      street: '456 Maitama District',
      city: 'Abuja',
      houseNumber: '78',
      stateCode: 'FC',
      lgaCode: '01',
    }
  },
  {
    name: 'Kano',
    data: {
      latitude: 12.0,
      longitude: 8.5,
      street: '789 Kano Road',
      city: 'Kano',
      houseNumber: '90',
    }
  }
];

/**
 * Test DDC generation without database operations
 */
async function testDDCGeneration() {
  console.log('🧪 Testing DDC Generation...\n');
  
  for (const location of testLocations) {
    console.log(`\n📍 Testing location: ${location.name}`);
    
    const { data } = location;
    try {
      // Generate DDC
      const ddc = await generateHhgCode(
        data.latitude,
        data.longitude,
        data.stateCode,
        data.lgaCode
      );
      
      if (!ddc) {
        console.error(`❌ Failed to generate DDC for ${location.name}`);
        continue;
      }
      
      console.log(`✅ Generated DDC: ${ddc}`);
      
      // Parse DDC to verify format
      const ddcInfo = parseDDC(ddc);
      if (!ddcInfo) {
        console.error(`❌ Failed to parse DDC: ${ddc}`);
        continue;
      }
      
      console.log('✅ Parsed DDC Components:');
      console.log(JSON.stringify(ddcInfo, null, 2));
      
    } catch (error) {
      console.error(`❌ Error for ${location.name}:`, error);
    }
  }
}

/**
 * Main test function
 */
async function runTest() {
  try {
    console.log('🚀 Starting Address DDC Test...\n');
    
    // Test DDC generation only (no database operations)
    await testDDCGeneration();
    
    console.log('\n✨ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
runTest().catch(console.error);
