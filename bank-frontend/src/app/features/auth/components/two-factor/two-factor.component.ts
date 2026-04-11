import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStore } from '../../store/auth.store';
import { AuthApiService } from '../../services/auth-api.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
    selector: 'app-two-factor',
    imports: [ReactiveFormsModule],
    templateUrl: './two-factor.component.html',
    styleUrl: './two-factor.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoFactorComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authApiService = inject(AuthApiService);
    private readonly notificationService = inject(NotificationService);
    protected readonly authStore = inject(AuthStore);

    protected readonly isResending = signal(false);
    protected readonly resendCooldown = signal(0);

    protected readonly otpForm = this.fb.nonNullable.group({
        digit1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
        digit2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
        digit3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
        digit4: ['', [Validators.required, Validators.pattern(/^\d$/)]],
        digit5: ['', [Validators.required, Validators.pattern(/^\d$/)]],
        digit6: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    });

    protected readonly canResend = computed(() => this.resendCooldown() === 0 && !this.isResending());

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
        if (this.otpForm.valid) {
            const { digit1, digit2, digit3, digit4, digit5, digit6 } = this.otpForm.getRawValue();
            const otp = `${digit1}${digit2}${digit3}${digit4}${digit5}${digit6}`;
            const sessionId = this.authStore.sessionId();

            console.log('Submitting OTP', { otp, sessionId });

            if (sessionId) {
                this.authStore.verifyOtp({ sessionId, otp });
            } else {
                console.error('Session ID missing in store');
                this.notificationService.error('Session expired. Please login again.');
            }
        } else {
            this.otpForm.markAllAsTouched();
        }
    }

    protected resendOtp(): void {
        const sessionId = this.authStore.sessionId();
        if (!sessionId || !this.canResend()) return;

        this.isResending.set(true);
        this.authApiService.resendOtp(sessionId).subscribe({
            next: () => {
                this.notificationService.success('OTP resent successfully');
                this.isResending.set(false);
                this.startCooldown();
            },
            error: () => {
                this.isResending.set(false);
            },
        });
    }

    private startCooldown(): void {
        this.resendCooldown.set(60);
        const interval = setInterval(() => {
            this.resendCooldown.update((v) => {
                if (v <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return v - 1;
            });
        }, 1000);
    }
}
import { computed } from '@angular/core';
