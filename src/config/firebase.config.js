/**
 * Firebase Admin SDK Configuration
 * 
 * Initializes Firebase Admin for sending push notifications via FCM.
 * Uses service account JSON file for authentication.
 */

const admin = require('firebase-admin');
const path = require('path');

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
    if (firebaseInitialized) {
        console.log('⚠️  Firebase already initialized');
        return admin;
    }

    try {
        // Get service account path from environment
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

        if (!serviceAccountPath) {
            console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_PATH not set in .env - Push notifications will not work');
            return null;
        }

        // Resolve absolute path
        const absolutePath = path.resolve(serviceAccountPath);

        // Check if file exists
        const fs = require('fs');
        if (!fs.existsSync(absolutePath)) {
            console.warn(`⚠️  Firebase service account file not found at: ${absolutePath}`);
            console.warn('   Push notifications will not work until you add the service account JSON file');
            return null;
        }

        // Load service account
        const serviceAccount = require(absolutePath);

        // Initialize Firebase Admin
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}.firebaseio.com`
        });

        firebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized successfully');
        console.log(`   Project ID: ${serviceAccount.project_id}`);

        return admin;
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
        console.warn('   Push notifications will not work');
        return null;
    }
}

/**
 * Get Firebase Admin instance
 * Initializes if not already initialized
 */
function getFirebaseAdmin() {
    if (!firebaseInitialized) {
        return initializeFirebase();
    }
    return admin;
}

/**
 * Check if Firebase is initialized and ready
 */
function isFirebaseReady() {
    return firebaseInitialized;
}

module.exports = {
    initializeFirebase,
    getFirebaseAdmin,
    isFirebaseReady,
    admin: getFirebaseAdmin()
};
