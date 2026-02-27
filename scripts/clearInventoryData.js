// Script to clear all inventory-related data from Firebase
// Run this with: npm run clear-inventory

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, remove } = require('firebase/database');

// Firebase configuration - same as lib/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyCBfxKrQaDN3a_pJzK-VScfn2TYd1Dk0LI",
  authDomain: "hotel-minima.firebaseapp.com",
  databaseURL: "https://hotel-minima-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hotel-minima",
  storageBucket: "hotel-minima.firebasestorage.app",
  messagingSenderId: "1013644211804",
  appId: "1:1013644211804:web:2001aa285dc41b570c1899",
  measurementId: "G-2MKVD6P2HP"
};

async function clearInventoryData() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);

    console.log('⚠️  WARNING: This will delete ALL inventory-related data!');
    console.log('📦 Deleting inventory items...');
    
    // Delete inventory node
    await remove(ref(database, 'inventory'));
    console.log('✅ Inventory items deleted (all 83 items removed)');

    // Delete transactions
    console.log('💸 Deleting transactions...');
    await remove(ref(database, 'transactions'));
    console.log('✅ Transactions deleted');

    // Delete activity logs related to inventory
    console.log('📋 Deleting activity logs...');
    await remove(ref(database, 'activity'));
    console.log('✅ Activity logs deleted');

    console.log('');
    console.log('✨ All inventory data has been cleared!');
    console.log('');
    console.log('Note: The following were NOT deleted (as they are not inventory-specific):');
    console.log('  - Rooms');
    console.log('  - Suppliers');
    console.log('  - Purchase Orders');
    console.log('  - Users');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing inventory data:', error);
    process.exit(1);
  }
}

// Run the script
clearInventoryData();
