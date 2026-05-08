const admin = require('firebase-admin');
const path = require('path');

// You need to download your service account JSON from Firebase Console:
// Project Settings > Service Accounts > Generate new private key
// Save it as 'firebase-service-account.json' in the backend root directory.

const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

try {
    admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath))
    });
    console.log('✅ [FIREBASE] Firebase Admin initialized successfully');
} catch (error) {
    console.error('❌ [FIREBASE] Firebase Admin initialization failed:', error.message);
}

module.exports = admin;
