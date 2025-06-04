// testCronJobs.js
require('dotenv').config();
const { Sequelize, Op } = require('sequelize');
const { Evenement } = require('../models');
const evenementService = require('../services/evenementService');

// Database configuration
const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'inventory',
  username: process.env.DB_USER || 'Yosr',
port: process.env.DB_PORT || 2103, // Default PostgreSQL port
  password: process.env.DB_PASSWORD || 'Yosr123', // Ensure this is a string
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Initialize database connection
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync models if needed
    await Evenement.sync({ alter: true });
    console.log('✅ Database models synchronized');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}

// Test functions
async function testYearlyUpdate(year) {
  console.log(`\nTesting yearly update for ${year}...`);
  
  try {
    // Count existing events
    const beforeCount = await Evenement.count({ where: { annee: year } });
    console.log(`Events in DB before test: ${beforeCount}`);
    
    // Run initialization
    const results = await evenementService.initialiserEvenementsAnnuel(year);
    console.log(`Initialized ${results.length} events for ${year}`);
    
    // Verify results
    const afterCount = await Evenement.count({ where: { annee: year } });
    console.log(`Events in DB after test: ${afterCount}`);
    
    if (afterCount <= beforeCount) {
      throw new Error("Yearly update didn't create new events");
    }
    
    // Show sample events
    const sampleEvents = await Evenement.findAll({ 
      where: { annee: year },
      limit: 3,
      order: [['date_debut', 'ASC']]
    });
    
    console.log("\nSample events created:");
    sampleEvents.forEach(event => {
      console.log(`- ${event.nom}: ${event.date_debut} to ${event.date_fin} (${event.type_evenement})`);
    });
    
    return true;
  } catch (error) {
    console.error('Yearly update test failed:', error);
    return false;
  }
}

async function testDailyStatusUpdate() {
  console.log("\nTesting daily event status update...");
  
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Create test events
    const testEvents = [
      {
        nom: 'TEST Past Event',
        date_debut: '2020-01-01',
        date_fin: '2020-01-05',
        type_evenement: 'Test',
        recurrence: 'fixe',
        annee: 2020,
        est_actif: true
      },
      {
        nom: 'TEST Current Event',
        date_debut: todayStr,
        date_fin: todayStr,
        type_evenement: 'Test',
        recurrence: 'fixe',
        annee: today.getFullYear(),
        est_actif: false
      },
      {
        nom: 'TEST Future Event',
        date_debut: '2030-01-01',
        date_fin: '2030-01-05',
        type_evenement: 'Test',
        recurrence: 'fixe',
        annee: 2030,
        est_actif: false
      }
    ];
    
    await Evenement.bulkCreate(testEvents);
    console.log("✅ Created test events");
    
    // Run daily update
    await evenementService.scheduleDailyEventStatusUpdate();
    console.log("✅ Daily status update executed");
    
    // Verify changes
    const updatedEvents = await Evenement.findAll({
      where: { nom: { [Op.like]: 'TEST %' } },
      order: [['date_debut', 'ASC']]
    });
    
    console.log("\nEvent status changes:");
    updatedEvents.forEach(event => {
      console.log(`- ${event.nom}: ${event.est_actif ? 'ACTIVE' : 'INACTIVE'}`);
    });
    
    // Cleanup
    await Evenement.destroy({ where: { nom: { [Op.like]: 'TEST %' } } });
    console.log("✅ Cleaned up test events");
    
    return true;
  } catch (error) {
    console.error('Daily status update test failed:', error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log("Starting cron job tests...");
  
  // Initialize database
  const dbReady = await initializeDatabase();
  if (!dbReady) {
    console.error("Cannot proceed with tests - database connection failed");
    process.exit(1);
  }
  
  // Run tests
  const yearlyResult = await testYearlyUpdate(2025);
  const dailyResult = await testDailyStatusUpdate();
  
  // Summary
  console.log("\n=== Test Summary ===");
  console.log(`Yearly Update Test: ${yearlyResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Daily Status Test: ${dailyResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  // Close connection
  await sequelize.close();
  process.exit(yearlyResult && dailyResult ? 0 : 1);
}

// Run tests
runTests().catch(err => {
  console.error("Unhandled error in test suite:", err);
  process.exit(1);
});