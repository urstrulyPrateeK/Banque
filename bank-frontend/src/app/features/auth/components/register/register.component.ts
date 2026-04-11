import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../store/auth.store';

@Component({
    selector: 'app-register',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
    private readonly fb = inject(FormBuilder);
    protected readonly authStore = inject(AuthStore);

    protected readonly showPassword = signal(false);
    protected readonly showConfirmPassword = signal(false);

    protected readonly registerForm = this.fb.nonNullable.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
        acceptTerms: [false, [Validators.requiredTrue]],
    });

    protected passwordsMatch(): boolean {
        const { password, confirmPassword } = this.registerForm.getRawValue();
        return password === confirmPassword || !confirmPassword;
    }

    protected togglePasswordVisibility(field: 'password' | 'confirm'): void {
        if (field === 'password') {
            this.showPassword.update((v) => !v);
        } else {
            this.showConfirmPassword.update((v) => !v);
        }
    }

    protected onSubmit(): void {
        const { password, confirmPassword } = this.registerForm.getRawValue();

        if (this.registerForm.valid && password === confirmPassword) {
            const { username, email } = this.registerForm.getRawValue();
            this.authStore.register({ username, email, password });
        } else {
            this.markFormTouched();
        }
    }

    private markFormTouched(): void {
        Object.keys(this.registerForm.controls).forEach((key) => {
            const control = this.registerForm.get(key);
            control?.markAsTouched();
        });
    }

    protected getFieldError(fieldName: string): string | null {
        const control = this.registerForm.get(fieldName);
        if (control?.touched && control.errors) {
            if (control.errors['required']) {
                return `This field is required`;
            }
            if (control.errors['minlength']) {
                const min = control.errors['minlength'].requiredLength;
                return `Must be at least ${min} characters`;
            }
            if (control.errors['email']) {
                return 'Please enter a valid email';
            }
        }
        return null;
    }
}
