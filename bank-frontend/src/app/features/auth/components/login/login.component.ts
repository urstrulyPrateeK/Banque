import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../store/auth.store';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    protected readonly authStore = inject(AuthStore);

    protected readonly showPassword = signal(false);

    protected readonly loginForm = this.fb.nonNullable.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        rememberMe: [false],
    });

    protected togglePasswordVisibility(): void {
        this.showPassword.update((value) => !value);
    }

    protected onSubmit(): void {
        if (this.loginForm.valid) {
            const { username, password } = this.loginForm.getRawValue();
            this.authStore.login({ username, password });
        } else {
            this.markFormTouched();
        }
    }

    private markFormTouched(): void {
        Object.keys(this.loginForm.controls).forEach((key) => {
            const control = this.loginForm.get(key);
            control?.markAsTouched();
        });
    }

    protected getFieldError(fieldName: 'username' | 'password'): string | null {
        const control = this.loginForm.get(fieldName);
        if (control?.touched && control.errors) {
            if (control.errors['required']) {
                return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
            }
            if (control.errors['minlength']) {
                const min = control.errors['minlength'].requiredLength;
                return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${min} characters`;
            }
        }
        return null;
    }
}
