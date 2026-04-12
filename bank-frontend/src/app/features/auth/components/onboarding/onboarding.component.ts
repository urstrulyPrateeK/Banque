import { Component, inject, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FirestoreService } from '@core/firebase/firestore.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthStore } from '../../store/auth.store';

@Component({
    selector: 'app-onboarding',
    imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
    templateUrl: './onboarding.component.html',
    styleUrl: './onboarding.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly fs = inject(FirestoreService);
    private readonly notify = inject(NotificationService);
    protected readonly authStore = inject(AuthStore);

    protected readonly currentStep = signal(1);
    protected readonly isSubmitting = signal(false);
    protected readonly avatarPreview = signal<string | null>(null);
    protected readonly totalSteps = 2;
    private selectedAvatarFile: File | null = null;
    private readonly maxAvatarSizeBytes = 5 * 1024 * 1024;
    private readonly maxAvatarFirestoreBytes = 950000;
    private readonly avatarMaxDimension = 640;

    protected readonly profileForm = this.fb.nonNullable.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: [this.authStore.user()?.email || '', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
        dateOfBirth: ['', [Validators.required]],
        address: [''],
    });

    protected readonly depositForm = this.fb.nonNullable.group({
        initialDeposit: [1000, [Validators.required, Validators.min(100), Validators.max(1000000)]],
    });

    protected readonly depositPresets = [500, 1000, 5000, 10000, 25000, 50000];

    constructor() {
        effect(() => {
            const authUser = this.authStore.user();
            const fallbackEmail = authUser?.email || `${this.fs.userId}@banque.dev`;
            if (fallbackEmail && !this.profileForm.controls.email.value) {
                this.profileForm.patchValue({ email: fallbackEmail });
            }
        });
    }

    protected setDeposit(amount: number): void {
        this.depositForm.patchValue({ initialDeposit: amount });
    }

    protected onAvatarSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.notify.error('Please select an image file.');
            input.value = '';
            return;
        }

        if (file.size > this.maxAvatarSizeBytes) {
            this.notify.error('Profile photo must be 5MB or less.');
            input.value = '';
            return;
        }

        this.selectedAvatarFile = file;
        const reader = new FileReader();
        reader.onload = () => this.avatarPreview.set(reader.result as string);
        reader.onerror = () => this.notify.error('Could not read selected image.');
        reader.readAsDataURL(file);
        input.value = '';
    }

    protected removeAvatar(): void {
        this.selectedAvatarFile = null;
        this.avatarPreview.set(null);
    }

    protected nextStep(): void {
        if (this.currentStep() === 1 && this.profileForm.valid) {
            this.currentStep.set(2);
        } else if (this.currentStep() === 1) {
            this.markFormTouched(this.profileForm);
        }
    }

    protected prevStep(): void {
        if (this.currentStep() > 1) {
            this.currentStep.update((s) => s - 1);
        }
    }

    protected async onSubmit(): Promise<void> {
        if (!this.depositForm.valid) {
            this.markFormTouched(this.depositForm);
            return;
        }

        this.isSubmitting.set(true);

        try {
            const profile = this.profileForm.getRawValue();
            const deposit = this.depositForm.getRawValue().initialDeposit;
            const username = this.fs.userId;
            const avatarUrl = this.selectedAvatarFile
                ? await this.prepareAvatarForFirestore(this.selectedAvatarFile)
                : null;

            await this.withTimeout(
                (async () => {
                    // 1. Save user profile
                    await this.fs.setDocument(this.fs.userPath(), {
                        username,
                        email: profile.email,
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        phone: profile.phone,
                        dateOfBirth: profile.dateOfBirth,
                        address: profile.address,
                        role: 'USER',
                        active: true,
                        emailVerified: true,
                        mfaEnabled: false,
                        ...(avatarUrl ? { avatarUrl } : {}),
                        seeded: true,
                    });

                    // 2. Create accounts
                    const savingsBalance = Math.round(deposit * 0.7 * 100) / 100;
                    const checkingBalance = Math.round(deposit * 0.3 * 100) / 100;

                    const savingsId = await this.fs.addDocument(this.fs.userCollection('accounts'), {
                        accountType: 'SAVINGS', nickname: 'Primary Savings',
                        currency: 'USD', balance: savingsBalance, status: 'ACTIVE',
                        isPrimary: true, accountNumber: this.generateAccountNumber(),
                    });

                    const checkingId = await this.fs.addDocument(this.fs.userCollection('accounts'), {
                        accountType: 'CHECKING', nickname: 'Daily Checking',
                        currency: 'USD', balance: checkingBalance, status: 'ACTIVE',
                        isPrimary: false, accountNumber: this.generateAccountNumber(),
                    });

                    // 3. Create initial deposit transactions
                    await this.fs.addDocument(this.fs.userCollection('transactions'), {
                        transactionType: 'DEPOSIT', amount: savingsBalance,
                        description: 'Initial deposit — Savings', accountId: savingsId,
                        status: 'COMPLETED', category: 'Deposit',
                        createdAt: new Date().toISOString(),
                    });

                    await this.fs.addDocument(this.fs.userCollection('transactions'), {
                        transactionType: 'DEPOSIT', amount: checkingBalance,
                        description: 'Initial deposit — Checking', accountId: checkingId,
                        status: 'COMPLETED', category: 'Deposit',
                        createdAt: new Date().toISOString(),
                    });

                    // 4. Create a debit card
                    await this.fs.addDocument(this.fs.userCollection('cards'), {
                        type: 'DEBIT', cardNumber: `4520 •••• •••• ${this.randomDigits(4)}`,
                        expiryDate: this.futureExpiry(), cardholderName: `${profile.firstName} ${profile.lastName}`.toUpperCase(),
                        accountId: savingsId, status: 'ACTIVE',
                        onlineEnabled: true, contactlessEnabled: true, internationalEnabled: false,
                        createdAt: new Date().toISOString(),
                    });

                    // 5. Create welcome notification
                    await this.fs.addDocument(this.fs.userCollection('notifications'), {
                        title: 'Welcome to Banque!', message: `Your accounts are ready with a ${this.formatCurrency(deposit)} deposit.`,
                        read: false, type: 'INFO', createdAt: new Date().toISOString(),
                    });

                    // 6. Activity log
                    await this.fs.addDocument(this.fs.userCollection('activity'), {
                        action: 'ACCOUNT_CREATED', description: 'Account setup completed via onboarding',
                        createdAt: new Date().toISOString(),
                    });

                    // 7. Settings
                    await this.fs.setDocument(`${this.fs.userPath()}/settings/preferences`, {
                        language: 'en', currency: 'USD', timezone: 'Asia/Kolkata',
                        emailNotifications: true, pushNotifications: true,
                        twoFactorEnabled: false, darkMode: false,
                    });
                })(),
                30000,
                'Account creation timed out. Please check your network or extension settings and try again.'
            );

            this.notify.success('Your Banque account is ready!');
            this.router.navigate(['/dashboard']);
        } catch (e) {
            console.error('Onboarding failed:', e);
            this.notify.error(this.getOnboardingErrorMessage(e));
        } finally {
            this.isSubmitting.set(false);
        }
    }

    protected getFieldError(form: any, fieldName: string): string | null {
        const control = form.get(fieldName);
        if (control?.touched && control.errors) {
            if (control.errors['required']) return 'This field is required';
            if (control.errors['minlength']) return `Must be at least ${control.errors['minlength'].requiredLength} characters`;
            if (control.errors['email']) return 'Please enter a valid email address';
            if (control.errors['pattern']) return 'Please enter a valid phone number';
            if (control.errors['min']) return `Minimum deposit is $${control.errors['min'].min}`;
            if (control.errors['max']) return `Maximum deposit is $${control.errors['max'].max.toLocaleString()}`;
        }
        return null;
    }

    private markFormTouched(form: any): void {
        Object.keys(form.controls).forEach((key: string) => {
            form.get(key)?.markAsTouched();
        });
    }

    private generateAccountNumber(): string {
        return `4520${this.randomDigits(8)}`;
    }

    private randomDigits(n: number): string {
        return Math.floor(Math.random() * Math.pow(10, n)).toString().padStart(n, '0');
    }

    private futureExpiry(): string {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 4);
        return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    private getOnboardingErrorMessage(error: unknown): string {
        const message = this.extractErrorMessage(error);

        if (/avatarurl|longer than|too large|size/i.test(message)) {
            return 'Profile photo is too large. Please upload a smaller image and try again.';
        }

        if (/blocked_by_client|network request failed|offline|failed to fetch/i.test(message)) {
            return 'Network request was blocked. Please disable ad-block/privacy extensions for this site and try again.';
        }

        if (/timed out|timeout/i.test(message)) {
            return 'Account creation timed out. Please check your network and try again.';
        }

        return 'Something went wrong. Please try again.';
    }

    private extractErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message || '';
        }

        if (typeof error === 'string') {
            return error;
        }

        if (error && typeof error === 'object' && 'message' in error) {
            const maybeMessage = (error as { message?: unknown }).message;
            return typeof maybeMessage === 'string' ? maybeMessage : String(maybeMessage ?? '');
        }

        return String(error ?? '');
    }

    private async prepareAvatarForFirestore(file: File): Promise<string> {
        const originalDataUrl = await this.fs.fileToBase64(file);
        const image = await this.loadImage(originalDataUrl);

        let width = image.naturalWidth;
        let height = image.naturalHeight;
        const largestDimension = Math.max(width, height);
        if (largestDimension > this.avatarMaxDimension) {
            const scale = this.avatarMaxDimension / largestDimension;
            width = Math.max(1, Math.round(width * scale));
            height = Math.max(1, Math.round(height * scale));
        }

        for (let pass = 0; pass < 8; pass++) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not process image. Please choose a different photo.');
            }

            ctx.drawImage(image, 0, 0, width, height);

            let quality = 0.84;
            for (let qualityPass = 0; qualityPass < 6; qualityPass++) {
                const candidate = canvas.toDataURL('image/jpeg', quality);
                if (this.getUtf8ByteLength(candidate) <= this.maxAvatarFirestoreBytes) {
                    return candidate;
                }
                quality -= 0.08;
            }

            width = Math.max(96, Math.round(width * 0.85));
            height = Math.max(96, Math.round(height * 0.85));
        }

        throw new Error('Profile photo is too large even after optimization.');
    }

    private getUtf8ByteLength(input: string): number {
        return new TextEncoder().encode(input).length;
    }

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Could not read image file.'));
            img.src = src;
        });
    }

    private withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(timeoutMessage));
            }, timeoutMs);

            promise
                .then((result) => {
                    clearTimeout(timeoutId);
                    resolve(result);
                })
                .catch((error) => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    }
}
