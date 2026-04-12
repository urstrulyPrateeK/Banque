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
    private readonly maxAvatarSizeBytes = 2 * 1024 * 1024;

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
            this.notify.error('Profile photo must be 2MB or less.');
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
            const avatarUrl = this.selectedAvatarFile ? await this.fs.fileToBase64(this.selectedAvatarFile) : null;

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

            this.notify.success('Your Banque account is ready!');
            this.router.navigate(['/dashboard']);
        } catch (e) {
            console.error('Onboarding failed:', e);
            this.notify.error('Something went wrong. Please try again.');
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
}
