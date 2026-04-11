import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthApiService } from '../../services/auth-api.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
    selector: 'app-reset-password',
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo-container">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h1>Reset Password</h1>
          <p class="subtitle">Create a new secure password</p>
        </div>

        @if (!token) {
           <div class="alert alert-error">
             Invalid or missing reset token. Please request a new link.
           </div>
           <div class="auth-link">
             <a routerLink="/auth/forgot-password">Request Reset Link</a>
           </div>
        } @else {
          <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="auth-form">
            <div class="form-group">
                <label for="password" class="form-label">New Password <span class="required">*</span></label>
                <div class="input-wrapper">
                <input
                    id="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    class="form-input"
                    placeholder="Min 8 characters"
                    [class.error]="getFieldError('password')"
                />
                <button type="button" class="password-toggle" (click)="toggleVisibility('password')">
                    @if(showPassword()) { <span>Hide</span> } @else { <span>Show</span> }
                </button>
                </div>
                @if (getFieldError('password'); as error) {
                <span class="error-message">{{ error }}</span>
                }
            </div>

            <div class="form-group">
                <label for="confirmPassword" class="form-label">Confirm Password <span class="required">*</span></label>
                <div class="input-wrapper">
                <input
                    id="confirmPassword"
                    [type]="showConfirmPassword() ? 'text' : 'password'"
                    formControlName="confirmPassword"
                    class="form-input"
                    placeholder="Repeat password"
                    [class.error]="!passwordsMatch()"
                />
                <button type="button" class="password-toggle" (click)="toggleVisibility('confirm')">
                   @if(showConfirmPassword()) { <span>Hide</span> } @else { <span>Show</span> }
                </button>
                </div>
                @if (!passwordsMatch()) {
                <span class="error-message">Passwords do not match</span>
                }
            </div>

            <button
                type="submit"
                class="submit-button"
                [class.loading]="isLoading()"
            >
                @if (isLoading()) {
                <span class="spinner"></span>
                <span>Resetting...</span>
                } @else {
                <span>Reset Password</span>
                }
            </button>
          </form>
        }
      </div>
      <div class="background-pattern"></div>
    </div>
  `,
    styles: [`
    /* Reusing styles from forgot-password for consistency. 
       In a real app, these should be shared. */
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
    }
    .background-pattern {
      position: absolute;
      inset: 0;
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
    .auth-header { text-align: center; margin-bottom: 2rem; }
    .logo-container {
      width: 60px; height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem;
      color: white;
    }
    .logo-icon { width: 32px; height: 32px; }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; color: #1a1f2e; }
    .subtitle { color: #718096; }
    .auth-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-label { font-weight: 600; color: #4a5568; }
    .required { color: #e53e3e; }
    .input-wrapper { position: relative; }
    .form-input {
      width: 100%; padding: 0.75rem 1rem;
      border: 2px solid #e2e8f0; border-radius: 10px;
      padding-right: 4rem; /* space for toggle */
    }
    .form-input.error { border-color: #e53e3e; }
    .password-toggle {
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        background: none; border: none; cursor: pointer; color: #718096; font-size: 0.8rem;
    }
    .error-message { color: #e53e3e; font-size: 0.85rem; }
    .submit-button {
      width: 100%; padding: 0.875rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; border: none; border-radius: 10px;
      font-weight: 600; cursor: pointer;
      display: flex; justify-content: center; gap: 0.5rem;
    }
    .submit-button:disabled { opacity: 0.7; }
    .spinner {
      width: 20px; height: 20px;
      border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .auth-link { margin-top: 1.5rem; text-align: center; }
    .auth-link a { color: #667eea; text-decoration: none; font-weight: 600; }
    .alert-error { 
        color: #e53e3e; background: #fff5f5; padding: 1rem; 
        border-radius: 8px; margin-bottom: 1rem; text-align: center;
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly authApiService = inject(AuthApiService);
    private readonly notificationService = inject(NotificationService);

    protected readonly isLoading = signal(false);
    protected readonly showPassword = signal(false);
    protected readonly showConfirmPassword = signal(false);

    protected token: string | null = null;

    protected readonly resetForm = this.fb.nonNullable.group({
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]]
    });

    ngOnInit() {
        this.token = this.route.snapshot.queryParamMap.get('token');
    }

    protected toggleVisibility(field: 'password' | 'confirm') {
        if (field === 'password') this.showPassword.update(v => !v);
        else this.showConfirmPassword.update(v => !v);
    }

    protected passwordsMatch(): boolean {
        const { password, confirmPassword } = this.resetForm.getRawValue();
        return password === confirmPassword || !confirmPassword;
    }

    protected onSubmit(): void {
        const { password, confirmPassword } = this.resetForm.getRawValue();

        if (this.resetForm.valid && password === confirmPassword && this.token) {
            this.isLoading.set(true);

            this.authApiService.resetPassword(this.token, password).subscribe({
                next: (response) => {
                    this.isLoading.set(false);
                    this.notificationService.success(response.message || 'Password reset successfully');
                    this.router.navigate(['/auth/login']);
                },
                error: (error) => {
                    this.isLoading.set(false);
                    this.notificationService.error(error.message || 'Failed to reset password');
                }
            });
        } else {
            this.resetForm.markAllAsTouched();
        }
    }

    protected getFieldError(fieldName: string): string | null {
        const control = this.resetForm.get(fieldName);
        if (control?.touched && control.errors) {
            if (control.errors['required']) return 'Required';
            if (control.errors['minlength']) return 'Min 8 characters';
        }
        return null;
    }
}
