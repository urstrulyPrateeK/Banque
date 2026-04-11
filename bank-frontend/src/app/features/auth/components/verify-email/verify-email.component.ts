import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../services/auth-api.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
    selector: 'app-verify-email',
    imports: [RouterLink],
    template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="verification-content">
          <div class="icon-container" [class.success]="isSuccess()" [class.error]="isError()">
             @if (isLoading()) {
                <div class="spinner-large"></div>
             } @else if (isSuccess()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
                </svg>
             } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/>
                </svg>
             }
          </div>
          
          <h1>{{ title() }}</h1>
          <p class="message">{{ message() }}</p>

          <div class="actions">
            @if (isSuccess()) {
                <a routerLink="/auth/login" class="action-button primary">Proceed to Login</a>
            } @else if (isError()) {
                <a routerLink="/auth/login" class="action-button secondary">Back to Login</a>
            }
          </div>
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
    }
    .background-pattern { position: absolute; inset: 0; pointer-events: none; }
    .auth-card {
      background: white; border-radius: 20px; padding: 3rem 2rem;
      width: 100%; max-width: 400px; text-align: center;
      z-index: 10; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }
    .icon-container {
      width: 80px; height: 80px; margin: 0 auto 1.5rem;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: #e2e8f0; color: #718096;
    }
    .icon-container.success { background: #c6f6d5; color: #38a169; }
    .icon-container.error { background: #fed7d7; color: #e53e3e; }
    
    .icon-container svg { width: 40px; height: 40px; }
    
    h1 { margin-bottom: 0.5rem; color: #2d3748; }
    .message { color: #718096; margin-bottom: 2rem; line-height: 1.5; }
    
    .action-button {
      display: inline-block; padding: 0.75rem 2rem;
      border-radius: 10px; text-decoration: none; font-weight: 600;
      transition: transform 0.2s;
    }
    .action-button.primary {
       background: #667eea; color: white;
       box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);
    }
    .action-button.secondary {
       background: #edf2f7; color: #4a5568;
    }
    .action-button:hover { transform: translateY(-2px); }
    
    .spinner-large {
        width: 40px; height: 40px;
        border: 3px solid #cbd5e0; border-top-color: #667eea;
        border-radius: 50%; animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly authApiService = inject(AuthApiService);

    protected readonly isLoading = signal(true);
    protected readonly isSuccess = signal(false);
    protected readonly isError = signal(false);

    protected readonly title = signal('Verifying...');
    protected readonly message = signal('Please wait while we verify your email address.');

    ngOnInit() {
        const token = this.route.snapshot.queryParamMap.get('token');

        if (!token) {
            this.setStatus('error', 'Invalid Link', 'The verification link is invalid or missing.');
            return;
        }

        this.authApiService.verifyEmail({ verificationToken: token }).subscribe({
            next: (response) => {
                this.setStatus('success', 'Email Verified!', response.message || 'Your email has been successfully verified.');
            },
            error: (error) => {
                this.setStatus('error', 'Verification Failed', error.message || 'We could not verify your email. The link may have expired.');
            }
        });
    }

    private setStatus(status: 'success' | 'error', titleVal: string, msgVal: string) {
        this.isLoading.set(false);
        this.title.set(titleVal);
        this.message.set(msgVal);
        if (status === 'success') this.isSuccess.set(true);
        else this.isError.set(true);
    }
}
