/**
 * Manual Test Script for Address Creation with the new DDC system
 * 
 * This script can be run directly with:
 * ts-node src/tests/test-address-creation.ts
 */

import dotenv from 'dotenv';
import { db } from '../db';
import { addresses, users } from '../db/schema';
import { generateHhgCode, parseDDC } from '../utils/addressing';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

// Test scenarios for different locations
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

// Test user ID for database operations (you can replace this with an actual ID from your database)
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Function to test address creation with DDC
 */
async function testAddressCreation() {
  try {
    console.log('🧪 Starting Address Creation Tests with DDC...\n');
    
    // 1. Check if test user exists, create if not
    const existingUser = await db.select().from(users).where(eq(users.id, TEST_USER_ID));
    
    if (existingUser.length === 0) {
      console.log('Creating test user...');
      await db.insert(users).values({
        id: TEST_USER_ID,
        email: 'test@example.com',
        phoneNumber: '1234567890',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'test_hash', // Don't do this in production!
      });
    }
    
    // 2. Clean up any existing test addresses
    console.log('Cleaning up existing test addresses...');
    await db.delete(addresses).where(eq(addresses.userId, TEST_USER_ID));
    
    // 3. Test DDC generation for each location
    for (const location of testLocations) {
      console.log(`\n📍 Testing location: ${location.name}`);
      
      // Generate DDC
      const { data } = location;
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
      
      // Insert address into database
      const newAddressData = {
        userId: TEST_USER_ID,
        street: data.street,
        city: data.city,
        houseNumber: data.houseNumber,
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
        hhgCode: ddc,
        stateCode: ddcInfo.stateCode,
        lgaCode: ddcInfo.lgaCode,
        areaType: ddcInfo.areaType,
        areaCode: ddcInfo.areaCode,
        locationNumber: ddcInfo.locationNumber,
        isSaved: true,
        label: `Test ${location.name}`,
      };
      
      const insertedResult = await db
        .insert(addresses)
        .values(newAddressData)
        .returning();
      
      console.log(`✅ Address created with ID: ${insertedResult[0].id}`);
    }
    
    // 4. Query and display all test addresses
    console.log('\n📋 All test addresses:');
    const allAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, TEST_USER_ID));
    
    allAddresses.forEach((addr, i) => {
      console.log(`\nAddress ${i+1}:`);
      console.log(`- DDC: ${addr.hhgCode}`);
      console.log(`- State: ${addr.stateCode}, LGA: ${addr.lgaCode}`);
      console.log(`- Area: ${addr.areaType}${addr.areaCode}, Location: ${addr.locationNumber}`);
      console.log(`- Street: ${addr.street}, City: ${addr.city}`);
    });
    
    console.log('\n✨ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Optional: Clean up test data
    // await db.delete(addresses).where(eq(addresses.userId, TEST_USER_ID));
    // await db.delete(users).where(eq(users.id, TEST_USER_ID));
    
    // Close database connection
    // await db.end();
  }
}

// Run the test
testAddressCreation().catch(console.error);
