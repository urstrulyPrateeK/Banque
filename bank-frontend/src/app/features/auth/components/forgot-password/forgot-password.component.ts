import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../store/auth.store';
import { AuthApiService } from '../../services/auth-api.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
    selector: 'app-forgot-password',
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo-container">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
            </svg>
          </div>
          <h1>Forgot Password</h1>
          <p class="subtitle">Enter your email to reset your password</p>
        </div>

        <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="email" class="form-label">Email <span class="required">*</span></label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="form-input"
              placeholder="john.doe@email.com"
              [class.error]="getFieldError('email')"
            />
            @if (getFieldError('email'); as error) {
              <span class="error-message">{{ error }}</span>
            }
          </div>

          <button
            type="submit"
            class="submit-button"
            [class.loading]="isLoading()"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
              <span>Sending...</span>
            } @else {
              <span>Send Reset Link</span>
            }
          </button>
        </form>

        <div class="auth-link">
          <a routerLink="/auth/login">Back to Login</a>
        </div>
      </div>
      <div class="background-pattern"></div>
    </div>
  `,
    styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow: hidden;
    }

    .background-pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 20%),
                        radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 20%);
      pointer-events: none;
    }

    .auth-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      position: relative;
      z-index: 10;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo-container {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      color: white;
    }

    h1 {
      color: #1a1f2e;
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #718096;
      font-size: 0.95rem;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      color: #4a5568;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .required {
      color: #e53e3e;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-size: 1rem;
      transition: all 0.2s;
      background: white;
      color: #2d3748;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-input.error {
      border-color: #e53e3e;
    }

    .error-message {
      color: #e53e3e;
      font-size: 0.85rem;
    }

    .submit-button {
      width: 100%;
      padding: 0.875rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .submit-button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .submit-button:active:not(:disabled) {
      transform: translateY(0);
    }

    .submit-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-link {
      margin-top: 1.5rem;
      text-align: center;
    }

    .auth-link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      transition: color 0.2s;
    }

    .auth-link a:hover {
      color: #764ba2;
      text-decoration: underline;
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authApiService = inject(AuthApiService);
    private readonly notificationService = inject(NotificationService);

    protected readonly isLoading = signal(false);

    protected readonly forgotPasswordForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
    });

    protected onSubmit(): void {
        if (this.forgotPasswordForm.valid) {
            this.isLoading.set(true);
            const { email } = this.forgotPasswordForm.getRawValue();

            this.authApiService.forgotPassword(email).subscribe({
                next: (response) => {
                    this.isLoading.set(false);
                    this.notificationService.success(response.message || 'If an account exists, a reset link has been sent.');
                    this.forgotPasswordForm.reset();
                },
                error: (error) => {
                    this.isLoading.set(false);
                    // Just show generic message for security, or error if specifically requested
                    this.notificationService.error(error.message || 'Failed to process request');
                }
            });
        } else {
            this.forgotPasswordForm.markAllAsTouched();
        }
    }

    protected getFieldError(fieldName: string): string | null {
        const control = this.forgotPasswordForm.get(fieldName);
        if (control?.touched && control.errors) {
            if (control.errors['required']) {
                return 'Email is required';
            }
            if (control.errors['email']) {
                return 'Please enter a valid email';
            }
        }
        return null;
    }
}
