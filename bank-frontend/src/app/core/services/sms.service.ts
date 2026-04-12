// Banque — SMS Service
// Uses Fast2SMS API for OTP delivery (India)
// API key is read from environment config

import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class SmsService {
    private readonly apiUrl = 'https://www.fast2sms.com/dev/bulkV2';
    private readonly apiKey = (environment.fast2smsApiKey || '').trim();
    private readonly knownPlaceholders = new Set([
        '__FAST2SMS_API_KEY__',
        'your_fast2sms_api_key',
    ]);

    get isConfigured(): boolean {
        return this.apiKey.length > 0 && !this.knownPlaceholders.has(this.apiKey);
    }

    async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
        // Strip country code if present
        const cleanNumber = phoneNumber.replace(/^\+91\s?/, '').replace(/\D/g, '');

        if (!this.isConfigured) {
            console.warn('📱 SMS API key not configured. OTP shown in notification for demo.');
            console.log(`📱 Demo OTP for ${cleanNumber}: ${otp}`);
            return true;
        }

        try {
            const body = new URLSearchParams({
                route: 'otp',
                variables_values: otp,
                numbers: cleanNumber,
                flash: '0',
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    authorization: this.apiKey,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body.toString(),
            });
            const data = await response.json();

            if (response.ok && data.return === true) {
                console.log('✅ OTP sent successfully via Fast2SMS');
                return true;
            } else {
                console.error('❌ Fast2SMS error:', data?.message || data);
                return false;
            }
        } catch (error) {
            console.error('❌ SMS sending failed:', error);
            return false;
        }
    }
}
