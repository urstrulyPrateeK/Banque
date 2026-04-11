export const environment = {
    production: true,
    apiUrl: 'https://api.securebank.com/api',
    appName: 'SecureBank',
    version: '1.0.0',
    features: {
        mfaEnabled: true,
        darkMode: true,
    },
    tokenKey: 'access_token',
    refreshTokenKey: 'refresh_token',
    tokenExpiryKey: 'token_expiry',
};
