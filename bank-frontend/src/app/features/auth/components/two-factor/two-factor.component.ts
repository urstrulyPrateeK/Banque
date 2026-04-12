import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { NotificationService } from '@core/services/notification.service';
import { FirestoreService } from '@core/firebase/firestore.service';
import { SmsService } from '@core/services/sms.service';

const OTP_EXPIRY_SECONDS = 300;
const MAX_PHONE_ATTEMPTS = 3;

@Component({
    selector: 'app-two-factor',
    imports: [ReactiveFormsModule],
    templateUrl: './two-factor.component.html',
    styleUrl: './two-factor.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoFactorComponent implements OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly notificationService = inject(NotificationService);
    private readonly firestoreService = inject(FirestoreService);
    private readonly smsService = inject(SmsService);
    protected readonly authStore = inject(AuthStore);

    private otpTimer: ReturnType<typeof setInterval> | null = null;
    private registeredPhone = '';

    protected readonly isLoadingContext = signal(true);
    protected readonly phoneConfirmed = signal(false);
    protected readonly isSendingOtp = signal(false);
    protected readonly isResending = signal(false);
    protected readonly resendUsed = signal(false);
    protected readonly otpExpiresIn = signal(0);
    protected readonly phoneAttempts = signal(0);
    protected readonly phoneError = signal<string | null>(null);
    protected readonly blockedMessage = signal<string | null>(null);
    protected readonly maskedPhone = signal('');

    protected readonly phoneForm = this.fb.nonNullable.group({
        phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    });

    protected readonly otpForm = this.fb.nonNullable.group({
        digit1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
        digit2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
        digit3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
        digit4: ['', [Validators.required, Validators.pattern(/^\d$/)]],
        digit5: ['', [Validators.required, Validators.pattern(/^\d$/)]],
        digit6: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    });

    protected readonly canResend = computed(
        () =>
            this.phoneConfirmed() &&
            this.otpExpiresIn() === 0 &&
            !this.resendUsed() &&
            !this.isResending() &&
            !this.isSendingOtp() &&
            !this.blockedMessage()
    );
    protected readonly maxPhoneAttempts = MAX_PHONE_ATTEMPTS;
    protected readonly remainingPhoneAttempts = computed(() =>
        Math.max(0, MAX_PHONE_ATTEMPTS - this.phoneAttempts())
    );

    ngOnInit(): void {
        this.initializeFlow();
    }

    ngOnDestroy(): void {
        this.clearOtpTimer();
    }

    private async initializeFlow(): Promise<void> {
        const sessionId = this.authStore.sessionId();
        if (!sessionId) {
            this.notificationService.error('Session expired. Please login again.');
            this.router.navigate(['/auth/login']);
            return;
        }

        try {
            const userDoc = await this.firestoreService.getDocument<any>(this.firestoreService.userPath());
            const normalizedPhone = this.normalizePhone(userDoc?.phoneNumber || '');
            const attempts = Number(userDoc?.mfaLoginNumberAttempts ?? 0);

            this.phoneAttempts.set(attempts);

            if (!normalizedPhone) {
                this.blockedMessage.set('No verified phone number is linked to this account. Please contact support.');
                return;
            }

            this.registeredPhone = normalizedPhone;
            this.maskedPhone.set(this.maskPhone(normalizedPhone));

            if (userDoc?.active === false || userDoc?.mfaLoginBlocked === true || attempts >= MAX_PHONE_ATTEMPTS) {
                this.handleBlockedAccount();
                return;
            }

            const loginOtp = await this.firestoreService.getDocument<any>(`${this.firestoreService.userPath()}/otp/login`);
            if (loginOtp?.phoneConfirmed) {
                this.phoneConfirmed.set(true);
                this.phoneForm.patchValue({ phone: normalizedPhone });
                this.resendUsed.set(Number(loginOtp?.resendCount ?? 0) >= 1);

                const expiresAt = loginOtp?.expiresAt ? new Date(loginOtp.expiresAt).getTime() : 0;
                if (expiresAt > Date.now()) {
                    this.startOtpTimer(expiresAt);
                } else {
                    this.otpExpiresIn.set(0);
                }
            }
        } catch {
            this.notificationService.error('Unable to initialize verification. Please try login again.');
            this.router.navigate(['/auth/login']);
            return;
        } finally {
            this.isLoadingContext.set(false);
        }
    }

    protected async confirmPhone(): Promise<void> {
        if (this.phoneForm.invalid || this.blockedMessage()) {
            this.phoneForm.markAllAsTouched();
            return;
        }

        const enteredPhone = this.normalizePhone(this.phoneForm.controls.phone.value);
        if (enteredPhone !== this.registeredPhone) {
            await this.handleWrongPhoneAttempt();
            return;
        }

        this.phoneError.set(null);
        this.phoneConfirmed.set(true);

        await this.firestoreService.setDocument(`${this.firestoreService.userPath()}/otp/login`, {
            sessionId: this.authStore.sessionId(),
            phoneConfirmed: true,
            numberAttempts: this.phoneAttempts(),
        });

        await this.sendOtp(false);
    }

    protected onDigitInput(event: Event, nextInput: HTMLInputElement | null): void {
        const input = event.target as HTMLInputElement;
        const value = input.value;

        if (value.length === 1 && /^\d$/.test(value) && nextInput) {
            nextInput.focus();
        }
    }

    protected onKeyDown(event: KeyboardEvent, prevInput: HTMLInputElement | null): void {
        const input = event.target as HTMLInputElement;

        if (event.key === 'Backspace' && !input.value && prevInput) {
            prevInput.focus();
        }
    }

    protected onPaste(event: ClipboardEvent): void {
        event.preventDefault();
        const pastedData = event.clipboardData?.getData('text') || '';
        const digits = pastedData.replace(/\D/g, '').slice(0, 6);

        if (digits.length === 6) {
            this.otpForm.patchValue({
                digit1: digits[0],
                digit2: digits[1],
                digit3: digits[2],
                digit4: digits[3],
                digit5: digits[4],
                digit6: digits[5],
            });
        }
    }

    protected onSubmit(): void {
        if (!this.phoneConfirmed() || this.blockedMessage()) {
            return;
        }

        if (this.otpForm.valid) {
            const { digit1, digit2, digit3, digit4, digit5, digit6 } = this.otpForm.getRawValue();
            const otp = `${digit1}${digit2}${digit3}${digit4}${digit5}${digit6}`;
            const sessionId = this.authStore.sessionId();

            if (sessionId) {
                this.authStore.verifyOtp({ sessionId, otp });
            } else {
                this.notificationService.error('Session expired. Please login again.');
                this.router.navigate(['/auth/login']);
            }
        } else {
            this.otpForm.markAllAsTouched();
        }
    }

    protected async resendOtp(): Promise<void> {
        const sessionId = this.authStore.sessionId();
        if (!sessionId || !this.canResend()) {
            return;
        }

        await this.sendOtp(true);
    }

    protected backToLogin(): void {
        this.router.navigate(['/auth/login']);
    }

    private async sendOtp(isResend: boolean): Promise<void> {
        if (!this.registeredPhone) {
            this.notificationService.error('Phone number not found for this account.');
            return;
        }

        const sessionId = this.authStore.sessionId();
        if (!sessionId) {
            this.notificationService.error('Session expired. Please login again.');
            this.router.navigate(['/auth/login']);
            return;
        }

        if (isResend) {
            this.isResending.set(true);
        } else {
            this.isSendingOtp.set(true);
        }

        this.phoneError.set(null);

        const otpCode = this.generateOtp();
        const expiresAtMs = Date.now() + OTP_EXPIRY_SECONDS * 1000;

        try {
            await this.firestoreService.setDocument(`${this.firestoreService.userPath()}/otp/login`, {
                sessionId,
                phone: `+91 ${this.registeredPhone}`,
                code: otpCode,
                expiresAt: new Date(expiresAtMs).toISOString(),
                verified: false,
                phoneConfirmed: true,
                resendCount: isResend ? 1 : 0,
                lastSentAt: new Date().toISOString(),
            });

            const smsSent = await this.smsService.sendOtp(this.registeredPhone, otpCode);
            if (this.smsService.isConfigured && !smsSent) {
                await this.firestoreService.setDocument(`${this.firestoreService.userPath()}/otp/login`, {
                    code: null,
                    expiresAt: null,
                });
                throw new Error('Unable to send OTP SMS. Please try again in a moment.');
            }

            if (isResend) {
                this.resendUsed.set(true);
                this.notificationService.success(`A new OTP was sent to ${this.maskedPhone()}.`);
            } else {
                this.notificationService.success(`OTP sent to ${this.maskedPhone()}.`);
            }

            if (!this.smsService.isConfigured) {
                this.notificationService.info(`Demo OTP: ${otpCode}`);
            }

            this.otpForm.reset();
            this.startOtpTimer(expiresAtMs);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to send OTP. Please try again.';
            this.phoneError.set(message);
            this.notificationService.error(message);
        } finally {
            if (isResend) {
                this.isResending.set(false);
            } else {
                this.isSendingOtp.set(false);
            }
        }
    }

    private async handleWrongPhoneAttempt(): Promise<void> {
        const attempts = this.phoneAttempts() + 1;
        this.phoneAttempts.set(attempts);

        await this.firestoreService.setDocument(this.firestoreService.userPath(), {
            mfaLoginNumberAttempts: attempts,
            lastMfaPhoneMismatchAt: new Date().toISOString(),
            mfaLoginBlocked: attempts >= MAX_PHONE_ATTEMPTS,
            ...(attempts >= MAX_PHONE_ATTEMPTS
                ? {
                    active: false,
                    blockedReason: 'MFA_PHONE_MISMATCH',
                    blockedAt: new Date().toISOString(),
                }
                : {}),
        });

        await this.firestoreService.setDocument(`${this.firestoreService.userPath()}/otp/login`, {
            numberAttempts: attempts,
            phoneConfirmed: false,
        });

        if (attempts >= MAX_PHONE_ATTEMPTS) {
            this.handleBlockedAccount();
            return;
        }

        const remaining = MAX_PHONE_ATTEMPTS - attempts;
        this.phoneError.set(`Phone number does not match our records. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    }

    private handleBlockedAccount(): void {
        this.blockedMessage.set('Your account has been blocked after 3 incorrect phone verification attempts. Please contact support.');
        this.notificationService.error(this.blockedMessage() || 'Your account is blocked.');
    }

    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private normalizePhone(phone: string): string {
        const digits = String(phone || '').replace(/\D/g, '');
        return digits.length > 10 ? digits.slice(-10) : digits;
    }

    private maskPhone(phone: string): string {
        if (phone.length !== 10) {
            return phone;
        }
        return `+91 ${phone.slice(0, 2)}****${phone.slice(-4)}`;
    }

    private startOtpTimer(expiresAtMs: number): void {
        this.clearOtpTimer();

        const tick = () => {
            const remaining = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
            this.otpExpiresIn.set(remaining);
            if (remaining <= 0) {
                this.clearOtpTimer();
            }
        };

        tick();
        this.otpTimer = setInterval(tick, 1000);
    }

    private clearOtpTimer(): void {
        if (this.otpTimer) {
            clearInterval(this.otpTimer);
            this.otpTimer = null;
        }
    }
}
