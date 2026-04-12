export const environment = {
    production: false,
    apiUrl: 'http://localhost:8080/api/v1',
    appName: 'Banque',
    version: '1.0.0',
    features: {
        mfaEnabled: true,
        darkMode: true,
    },
    tokenKey: 'access_token',
    refreshTokenKey: 'refresh_token',
    tokenExpiryKey: 'token_expiry',

    // Firebase — placeholders replaced at build time via Dockerfile sed
    firebase: {
        apiKey: '__FIREBASE_API_KEY__',
        authDomain: '__FIREBASE_AUTH_DOMAIN__',
        projectId: '__FIREBASE_PROJECT_ID__',
        storageBucket: '__FIREBASE_STORAGE_BUCKET__',
        messagingSenderId: '__FIREBASE_MESSAGING_SENDER_ID__',
        appId: '__FIREBASE_APP_ID__',
        measurementId: '__FIREBASE_MEASUREMENT_ID__',
    },

    // Fast2SMS (OTP)
    fast2smsApiKey: '__FAST2SMS_API_KEY__',
};
