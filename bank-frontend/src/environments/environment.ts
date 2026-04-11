export const environment = {
    production: false,
    apiUrl: 'http://localhost:8080/api/v1',
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
