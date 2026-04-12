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

    // Firebase
    firebase: {
        apiKey: '__FIREBASE_API_KEY__',
        authDomain: 'banque-smart-banking.firebaseapp.com',
        projectId: 'banque-smart-banking',
        storageBucket: 'banque-smart-banking.firebasestorage.app',
        messagingSenderId: '807836746111',
        appId: '1:807836746111:web:b05b32d59739ae9a74da4a',
        measurementId: 'G-R9F6BX5ZLP',
    },

    // Fast2SMS (OTP)
    fast2smsApiKey: '__FAST2SMS_API_KEY__',
};
