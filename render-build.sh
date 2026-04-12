#!/bin/bash
# ============================================
# Banque — Render Build Script
# ============================================
# This script runs BEFORE `ng build` on Render.
# It writes the environment files using Render's
# environment variables so API keys stay secret.
#
# On Render Dashboard → Environment, set:
#   FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID,
#   FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID,
#   FIREBASE_APP_ID, FIREBASE_MEASUREMENT_ID, FAST2SMS_API_KEY
# ============================================

set -e

echo "📝 Generating environment files from Render env vars..."

# Navigate to frontend
cd bank-frontend

# Write environment.ts (dev)
cat > src/environments/environment.ts << EOF
export const environment = {
    production: false,
    apiUrl: '${API_URL:-/api/v1}',
    appName: 'Banque',
    version: '1.0.0',
    features: { mfaEnabled: true, darkMode: true },
    tokenKey: 'access_token',
    refreshTokenKey: 'refresh_token',
    tokenExpiryKey: 'token_expiry',
    firebase: {
        apiKey: '${FIREBASE_API_KEY}',
        authDomain: '${FIREBASE_AUTH_DOMAIN}',
        projectId: '${FIREBASE_PROJECT_ID}',
        storageBucket: '${FIREBASE_STORAGE_BUCKET}',
        messagingSenderId: '${FIREBASE_MESSAGING_SENDER_ID}',
        appId: '${FIREBASE_APP_ID}',
        measurementId: '${FIREBASE_MEASUREMENT_ID}',
    },
    fast2smsApiKey: '${FAST2SMS_API_KEY}',
};
EOF

# Write environment.production.ts (prod)
cat > src/environments/environment.production.ts << EOF
export const environment = {
    production: true,
    apiUrl: '${API_URL:-/api/v1}',
    appName: 'Banque',
    version: '1.0.0',
    features: { mfaEnabled: true, darkMode: true },
    tokenKey: 'access_token',
    refreshTokenKey: 'refresh_token',
    tokenExpiryKey: 'token_expiry',
    firebase: {
        apiKey: '${FIREBASE_API_KEY}',
        authDomain: '${FIREBASE_AUTH_DOMAIN}',
        projectId: '${FIREBASE_PROJECT_ID}',
        storageBucket: '${FIREBASE_STORAGE_BUCKET}',
        messagingSenderId: '${FIREBASE_MESSAGING_SENDER_ID}',
        appId: '${FIREBASE_APP_ID}',
        measurementId: '${FIREBASE_MEASUREMENT_ID}',
    },
    fast2smsApiKey: '${FAST2SMS_API_KEY}',
};
EOF

# Write firebase.config.ts
cat > src/app/core/firebase/firebase.config.ts << EOF
import { environment } from '@env/environment';
export const firebaseConfig = environment.firebase;
EOF

echo "✅ Environment files generated successfully!"

# Install dependencies and build
npm install
npx ng build --configuration=production

echo "🚀 Build complete!"
