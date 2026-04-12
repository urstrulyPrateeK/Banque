import { Component, inject, OnInit, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserStore } from '../../store/user.store';
import { FirestoreService } from '@core/firebase/firestore.service';
import { NotificationService } from '@core/services/notification.service';
import { SmsService } from '@core/services/sms.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    template: `
    <div class="profile-container">
      <header class="profile-header">
        <div class="avatar-section">
          <div class="avatar-wrapper">
             @if (avatarPreview() || userStore.profile()?.avatarUrl) {
                <img 
                    [src]="avatarPreview() || userStore.profile()?.avatarUrl" 
                    alt="Profile Avatar" 
                    class="avatar-image" 
                    (error)="onAvatarError($event)"
                />
              } @else {
                <div class="avatar-placeholder">{{ userStore.userInitials() }}</div>
             }
             <label for="avatar-upload" class="avatar-upload-label" [class.loading]="userStore.isLoading()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
             </label>
             <input type="file" id="avatar-upload" (change)="onAvatarSelected($event)" accept="image/*" class="hidden-input"/>
          </div>
          <div class="user-info">
             <h1>{{ userStore.fullName() }}</h1>
             <p class="email">{{ userStore.profile()?.email }}</p>
             <span class="role-badge" [class.admin]="userStore.profile()?.role === 'ADMIN'">{{ userStore.profile()?.role }}</span>
          </div>
        </div>
      </header>

      <div class="profile-content">
         <div class="card">
            <div class="card-header">
               <h2>Personal Information</h2>
               <button class="edit-btn" (click)="toggleEdit()" [class.active]="isEditing()">
                  {{ isEditing() ? 'Cancel' : 'Edit' }}
               </button>
            </div>
            
            <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
               <div class="form-grid">
                  <div class="form-group">
                     <label>First Name</label>
                     @if (isEditing()) {
                        <input formControlName="firstName" type="text" />
                     } @else {
                        <p class="static-value">{{ userStore.profile()?.firstName }}</p>
                     }
                  </div>
                  
                  <div class="form-group">
                     <label>Last Name</label>
                     @if (isEditing()) {
                        <input formControlName="lastName" type="text" />
                     } @else {
                        <p class="static-value">{{ userStore.profile()?.lastName }}</p>
                     }
                  </div>

                  <div class="form-group">
                     <label>Phone Number</label>
                     @if (isEditing()) {
                        <input formControlName="phoneNumber" type="tel" />
                     } @else {
                        <p class="static-value">{{ userStore.profile()?.phoneNumber || '-' }}</p>
                     }
                  </div>

                  <div class="form-group">
                     <label>Date of Birth</label>
                     @if (isEditing()) {
                        <input formControlName="dateOfBirth" type="date" />
                     } @else {
                        <p class="static-value">{{ userStore.profile()?.dateOfBirth || '-' }}</p>
                     }
                  </div>
               </div>

               <div class="form-divider">Address</div>
               
               <div class="form-grid">
                   <div class="form-group full-width">
                     <label>Address</label>
                     @if (isEditing()) {
                        <input formControlName="address" type="text" />
                     } @else {
                        <p class="static-value">{{ userStore.profile()?.address || '-' }}</p>
                     }
                   </div>
                   
                   <div class="form-group">
                     <label>City</label>
                     @if (isEditing()) {
                        <input formControlName="city" type="text" />
                     } @else {
                        <p class="static-value">{{ userStore.profile()?.city || '-' }}</p>
                     }
                   </div>
                   
                   <div class="form-group">
                     <label>State</label>
                     @if (isEditing()) {
                        <input formControlName="state" type="text" />
                     } @else {
                        <p class="static-value">{{ userStore.profile()?.state || '-' }}</p>
                     }
                   </div>
                   
                   <div class="form-group">
                     <label>Country</label>
                     @if (isEditing()) {
                        <input formControlName="country" type="text" />
                     } @else {
                        <p class="static-value">{{ userStore.profile()?.country || '-' }}</p>
                     }
                   </div>
                   
                   <div class="form-group">
                     <label>Postal Code</label>
                     @if (isEditing()) {
                        <input formControlName="postalCode" type="text" />
                     } @else {
                        <p class="static-value">{{ userStore.profile()?.postalCode || '-' }}</p>
                     }
                   </div>
               </div>

               @if (isEditing()) {
                  <div class="form-actions">
                     <button type="submit" class="save-btn" [disabled]="!profileForm.valid || userStore.isLoading()">
                        {{ userStore.isLoading() ? 'Saving...' : 'Save Changes' }}
                     </button>
                  </div>
               }
            </form>
         </div>
         
          <div class="card security-card">
             <h2>Account Security</h2>
             <div class="security-item">
                <div class="info">
                   <h3>Email Verification</h3>
                   <p>Your email is {{ userStore.profile()?.emailVerified ? 'verified' : 'not verified' }}</p>
                </div>
                @if (userStore.profile()?.emailVerified) {
                   <span class="badge success">Verified</span>
                } @else {
                   <button class="action-link">Resend Verification</button>
                }
             </div>
             
             <div class="security-item">
                <div class="info">
                   <h3>Two-Factor Authentication (SMS)</h3>
                   <p>Protect your account with phone-based OTP verification</p>
                </div>
                @if (otpVerified()) {
                   <span class="badge success">Verified</span>
                } @else {
                         <button class="action-link otp-enable-pill" (click)="showOtpSetup.set(true)">Enable</button>
                }
             </div>

             @if (showOtpSetup()) {
             <div class="otp-setup-section">
                <h3>Phone Verification</h3>
                <p class="otp-desc">Enter your phone number to receive a verification code via SMS</p>
                
                @if (!otpSent()) {
                <div class="otp-phone-input">
                   <div class="phone-field">
                      <span class="country-code">+91</span>
                      <input type="tel" [(ngModel)]="phoneNumber" placeholder="Enter 10-digit phone number" maxlength="10" class="phone-input" />
                   </div>
                         <button type="button" class="otp-send-btn" (click)="sendOtp()" [disabled]="otpSending() || !isPhoneReadyForOtp()">
                      @if (otpSending()) {
                        <span class="mini-spinner"></span> Sending...
                      } @else {
                        Send OTP
                      }
                   </button>
                </div>
                     @if (otpError()) {
                     <p class="otp-error otp-error-inline">{{ otpError() }}</p>
                     }
                } @else {
                <div class="otp-verify-section">
                   <p class="otp-sent-msg">A 6-digit OTP has been sent to +91 {{ phoneNumber }}</p>
                   <div class="otp-digits">
                      @for (i of [0,1,2,3,4,5]; track i) {
                        <input type="text" maxlength="1" class="otp-digit-input" 
                               [id]="'otp-' + i"
                               (input)="onOtpDigitInput($event, i)" 
                               (keydown)="onOtpKeydown($event, i)"
                               (paste)="onOtpPaste($event)" />
                      }
                   </div>
                   <div class="otp-actions">
                             <button type="button" class="otp-verify-btn" (click)="verifyOtp()" [disabled]="otpVerifying() || enteredOtp().length < 6">
                         @if (otpVerifying()) {
                           <span class="mini-spinner"></span> Verifying...
                         } @else {
                           Verify OTP
                         }
                      </button>
                             <button type="button" class="otp-resend-link" (click)="sendOtp()" [disabled]="resendCooldown() > 0 || otpSending()">
                         {{ resendCooldown() > 0 ? 'Resend in ' + resendCooldown() + 's' : 'Resend OTP' }}
                      </button>
                   </div>
                   @if (otpError()) {
                   <p class="otp-error">{{ otpError() }}</p>
                   }
                </div>
                }
             </div>
             }
          </div>
      </div>
    </div>
    `,
    styles: [`
    .profile-container {
        padding: 2rem;
        max-width: 1000px;
        margin: 0 auto;
    }
    
    .profile-header {
        margin-bottom: 3rem;
        background: white;
        padding: 2rem;
        border-radius: 20px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    
    .avatar-section {
        display: flex;
        align-items: center;
        gap: 2rem;
    }
    
    .avatar-wrapper {
        position: relative;
        width: 100px;
        height: 100px;
    }
    
    .avatar-image, .avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
    }
    
    .avatar-placeholder {
        background: linear-gradient(135deg, var(--bq-teal, #0d9488), var(--bq-cyan, #0284c7));
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        font-weight: 600;
    }
    
    .avatar-upload-label {
        position: absolute;
        bottom: 0;
        right: 0;
        background: white;
        border: 1px solid var(--bq-mist, #e2e8f0);
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .avatar-upload-label:hover {
        background: var(--bq-cloud, #f8fafc);
        transform: scale(1.1);
    }
    
    .avatar-upload-label svg {
        width: 16px;
        height: 16px;
        color: var(--bq-slate, #64748b);
    }
    
    .hidden-input { display: none; }
    
    .user-info h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.8rem;
        color: var(--bq-navy, #0a1628);
    }
    
    .email {
        color: var(--bq-slate, #64748b);
        margin-bottom: 1rem;
    }
    
    .role-badge {
        padding: 0.25rem 0.75rem;
        background: var(--bq-cloud, #f8fafc);
        color: var(--bq-slate, #64748b);
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .role-badge.admin {
        background: rgba(220,38,38,0.08);
        color: var(--bq-danger, #dc2626);
    }
    
    .profile-content {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 2rem;
    }
    
    .card {
        background: white;
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    
    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }
    
    .card-header h2 {
        font-size: 1.25rem;
        color: var(--bq-navy, #0a1628);
        margin: 0;
    }
    
    .edit-btn {
        padding: 0.5rem 1rem;
        border: 1px solid var(--bq-mist, #e2e8f0);
        background: white;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }
    
    .edit-btn:hover { background: var(--bq-cloud, #f8fafc); }
    .edit-btn.active { background: var(--bq-mist, #e2e8f0); }
    
    .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .full-width { grid-column: 1 / -1; }
    
    .form-group label {
        font-size: 0.875rem;
        color: var(--bq-slate, #64748b);
        font-weight: 500;
    }
    
    .static-value {
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--bq-border);
        color: var(--bq-navy, #0a1628);
        margin: 0;
    }
    
    .form-group input {
        padding: 0.75rem;
        border: 1px solid var(--bq-mist, #e2e8f0);
        border-radius: 8px;
        font-size: 1rem;
        width: 100%;
    }
    
    .form-divider {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--bq-slate, #94a3b8);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 2rem 0 1.5rem;
    }
    
    .form-actions {
        margin-top: 2rem;
        display: flex;
        justify-content: flex-end;
    }
    
    .save-btn {
        padding: 0.75rem 2rem;
        background: var(--bq-teal, #0d9488);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
    }
    
    .save-btn:disabled { opacity: 0.7; }
    
    .security-card .security-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 0;
        border-bottom: 1px solid var(--bq-border);
    }
    
    .security-item:last-child { border-bottom: none; }
    
    .security-item h3 {
        font-size: 1rem;
        color: var(--bq-navy, #0a1628);
        margin: 0 0 0.25rem 0;
    }
    
    .security-item p {
        font-size: 0.875rem;
        color: var(--bq-slate, #64748b);
        margin: 0;
    }
    
    .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
        background: var(--bq-mist, #e2e8f0);
        color: var(--bq-slate, #64748b);
    }
    
    .badge.success { background: rgba(5,150,105,0.1); color: var(--bq-success, #059669); }
    .badge.warning { background: rgba(217,119,6,0.08); color: var(--bq-warning, #d97706); }
    
    .action-link {
        background: none;
        border: none;
        color: var(--bq-teal, #0d9488);
        font-weight: 500;
        cursor: pointer;
        padding: 0;
    }

    .otp-enable-pill {
        padding: 0.4rem 1rem;
        border: 1px solid rgba(13, 148, 136, 0.32);
        border-radius: 9999px;
        background: linear-gradient(180deg, rgba(13, 148, 136, 0.08), rgba(13, 148, 136, 0.02));
        color: var(--bq-teal, #0d9488);
        font-weight: 600;
        transition: all 0.2s ease;
    }

    .otp-enable-pill:hover {
        background: rgba(13, 148, 136, 0.12);
        border-color: rgba(13, 148, 136, 0.5);
        transform: translateY(-1px);
    }
    
    @media (max-width: 768px) {
        .profile-content { grid-template-columns: 1fr; }
        .avatar-section { flex-direction: column; text-align: center; }
        .form-grid { grid-template-columns: 1fr; }
    }

    /* OTP Styles */
    .otp-setup-section {
        margin-top: 1.5rem; padding: 1.5rem;
        background: var(--bq-cloud, #f8fafc); border-radius: 12px;
        border: 1px solid var(--bq-mist, #e2e8f0);
    }
    .otp-setup-section h3 { margin: 0 0 0.5rem; color: var(--bq-navy, #0a1628); font-size: 1.1rem; }
    .otp-desc { color: var(--bq-slate, #64748b); font-size: 0.9rem; margin-bottom: 1rem; }
    .otp-phone-input { display: flex; gap: 0.75rem; align-items: stretch; }
    .phone-field {
        display: flex; align-items: center; flex: 1;
        background: white; border: 1.5px solid var(--bq-mist, #e2e8f0); border-radius: 10px;
        overflow: hidden; transition: border-color 0.2s;
    }
    .phone-field:focus-within { border-color: var(--bq-teal, #0d9488); }
    .country-code {
        padding: 0.75rem; background: var(--bq-cloud, #f8fafc); color: var(--bq-slate, #64748b);
        font-weight: 600; border-right: 1px solid var(--bq-border); white-space: nowrap;
    }
    .phone-input {
        flex: 1; border: none; padding: 0.75rem; font-size: 1rem;
        outline: none; background: transparent;
    }
    .otp-send-btn {
        padding: 0.75rem 1.5rem; background: linear-gradient(135deg, var(--bq-teal, #0d9488), var(--bq-cyan, #0284c7));
        color: white; border: none; border-radius: 10px; font-weight: 600;
        cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
        white-space: nowrap; transition: all 0.2s;
    }
    .otp-send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(13,148,136,0.3); }
    .otp-send-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .otp-sent-msg { color: var(--bq-success, #059669); font-weight: 500; margin-bottom: 1rem; }
    .otp-digits { display: flex; gap: 0.5rem; margin-bottom: 1rem; justify-content: center; }
    .otp-digit-input {
        width: 48px; height: 56px; text-align: center; font-size: 1.5rem;
        font-weight: 700; border: 1.5px solid var(--bq-mist, #e2e8f0); border-radius: 10px;
        outline: none; transition: all 0.2s; color: var(--bq-navy, #0a1628);
    }
    .otp-digit-input:focus { border-color: var(--bq-teal, #0d9488); box-shadow: 0 0 0 3px rgba(13,148,136,0.15); }
    .otp-actions { display: flex; justify-content: center; gap: 1rem; align-items: center; }
    .otp-verify-btn {
        padding: 0.75rem 2rem; background: linear-gradient(135deg, var(--bq-success, #059669), #047857);
        color: white; border: none; border-radius: 10px; font-weight: 600;
        cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;
    }
    .otp-verify-btn:hover:not(:disabled) { transform: translateY(-1px); }
    .otp-verify-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .otp-resend-link {
        background: none; border: none; color: var(--bq-teal, #0d9488); font-weight: 500;
        cursor: pointer; font-size: 0.9rem;
    }
    .otp-resend-link:disabled { color: var(--bq-slate, #94a3b8); cursor: not-allowed; }
    .otp-error { color: var(--bq-danger, #dc2626); font-size: 0.9rem; margin-top: 0.5rem; text-align: center; }
    .otp-error-inline { text-align: left; margin-top: 0.75rem; }
    .mini-spinner {
        display: inline-block; width: 16px; height: 16px;
        border: 2px solid rgba(255,255,255,0.3); border-radius: 50%;
        border-top-color: white; animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
    protected readonly userStore = inject(UserStore);
    private readonly fb = inject(FormBuilder);
    private readonly fs = inject(FirestoreService);
    private readonly notify = inject(NotificationService);
    private readonly sms = inject(SmsService);

    protected readonly isEditing = signal(false);
    protected readonly avatarPreview = signal<string | null>(null);

    // OTP signals
    protected readonly showOtpSetup = signal(false);
    protected readonly otpSent = signal(false);
    protected readonly otpSending = signal(false);
    protected readonly otpVerifying = signal(false);
    protected readonly otpVerified = signal(false);
    protected readonly otpError = signal<string | null>(null);
    protected readonly enteredOtp = signal('');
    protected readonly resendCooldown = signal(0);
    protected phoneNumber = '';
    private generatedOtp = '';
    private otpDigits: string[] = ['', '', '', '', '', ''];

    constructor() {
        effect(() => {
            const avatarUrl = this.userStore.profile()?.avatarUrl;
            if (avatarUrl) {
                // Use persisted avatar from store after upload succeeds.
                this.avatarPreview.set(null);
            }
        });
    }

    protected readonly profileForm = this.fb.nonNullable.group({
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        phoneNumber: [''],
        dateOfBirth: [''],
        address: [''],
        city: [''],
        state: [''],
        country: [''],
        postalCode: ['']
    });

    ngOnInit() {
        this.userStore.loadProfile();
        // Check if OTP was already verified
        this.fs.getDocument<any>(this.fs.userPath()).then((user) => {
            if (user?.otpVerified) this.otpVerified.set(true);
            if (user?.phoneNumber) this.phoneNumber = this.normalizePhone(user.phoneNumber);
        });
    }

    protected toggleEdit(): void {
        this.isEditing.update(v => !v);
        if (this.isEditing()) {
            const profile = this.userStore.profile();
            if (profile) {
                this.profileForm.patchValue({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    phoneNumber: profile.phoneNumber || '',
                    dateOfBirth: profile.dateOfBirth || '',
                    address: profile.address || '',
                    city: profile.city || '',
                    state: profile.state || '',
                    country: profile.country || '',
                    postalCode: profile.postalCode || ''
                });
            }
        }
    }

    protected onSubmit(): void {
        if (this.profileForm.valid) {
            const rawValue = this.profileForm.getRawValue();
            const payload = Object.entries(rawValue).reduce((acc, [key, value]) => {
                if (value === '' || value === null) return acc;
                return { ...acc, [key]: value };
            }, {} as any);
            if (!payload.firstName) payload.firstName = rawValue.firstName;
            if (!payload.lastName) payload.lastName = rawValue.lastName;
            this.userStore.updateProfile(payload);
            this.isEditing.set(false);
        }
    }

    protected onAvatarSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            const file = input.files[0];
            // Show instant preview
            const reader = new FileReader();
            reader.onload = () => {
                this.avatarPreview.set(reader.result as string);
            };
            reader.readAsDataURL(file);
            // Upload to Firestore
            this.userStore.uploadAvatar(file);
            input.value = '';
        }
    }

    protected onAvatarError(event: Event): void {
        this.avatarPreview.set(null);
    }

    // ─── OTP Methods ───

    protected isPhoneReadyForOtp(): boolean {
        return this.normalizePhone(this.phoneNumber).length === 10;
    }

    protected async sendOtp(): Promise<void> {
        const cleanPhone = this.normalizePhone(this.phoneNumber);
        if (cleanPhone.length !== 10) {
            this.otpError.set('Please enter a valid 10-digit phone number.');
            this.notify.error('Please enter a valid 10-digit phone number.');
            return;
        }

        this.phoneNumber = cleanPhone;
        this.otpSending.set(true);
        this.otpError.set(null);

        // Generate a 6-digit OTP
        this.generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

        try {
            // Store OTP in Firestore for verification
            await this.fs.setDocument(`${this.fs.userPath()}/otp/current`, {
                code: this.generatedOtp,
                phone: `+91 ${cleanPhone}`,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                verified: false,
            });

            // Try sending via SMS gateway
            const sent = await this.sms.sendOtp(cleanPhone, this.generatedOtp);
            if (this.sms.isConfigured && !sent) {
                throw new Error('Failed to send OTP via SMS. Please verify your SMS configuration and try again.');
            }

            this.otpSent.set(true);
            this.startResendCooldown();
            this.notify.success(`OTP sent to +91 ${cleanPhone}`);

            if (!this.sms.isConfigured) {
                // Demo mode — show OTP as notification
                setTimeout(() => {
                    this.notify.info(`Demo OTP: ${this.generatedOtp}`);
                }, 800);
            }
        } catch (error) {
            this.otpSent.set(false);
            const message = error instanceof Error ? error.message : 'Failed to send OTP. Please try again.';
            this.otpError.set(message);
            this.notify.error(message);
        } finally {
            this.otpSending.set(false);
        }
    }

    protected verifyOtp(): void {
        const entered = this.enteredOtp();
        if (entered.length < 6) return;

        this.otpVerifying.set(true);
        this.otpError.set(null);

        // Verify against stored OTP
        this.fs.getDocument<any>(`${this.fs.userPath()}/otp/current`).then((otpDoc) => {
            if (!otpDoc) {
                this.otpVerifying.set(false);
                this.otpError.set('OTP expired. Please request a new one.');
                return;
            }

            const expiresAt = new Date(otpDoc.expiresAt).getTime();
            if (Date.now() > expiresAt) {
                this.otpVerifying.set(false);
                this.otpError.set('OTP expired. Please request a new one.');
                return;
            }

            if (otpDoc.code === entered) {
                // OTP matches — mark as verified
                Promise.all([
                    this.fs.setDocument(this.fs.userPath(), {
                        otpVerified: true,
                        mfaEnabled: true,
                        phoneNumber: `+91 ${this.phoneNumber}`,
                    }),
                    this.fs.setDocument(`${this.fs.userPath()}/otp/current`, {
                        verified: true,
                    }),
                ]).then(() => {
                    this.otpVerifying.set(false);
                    this.otpVerified.set(true);
                    this.showOtpSetup.set(false);
                    this.notify.success('Phone verified! Two-factor authentication enabled.');
                    this.userStore.loadProfile();
                });
            } else {
                this.otpVerifying.set(false);
                this.otpError.set('Invalid OTP. Please check and try again.');
            }
        }).catch(() => {
            this.otpVerifying.set(false);
            this.otpError.set('Verification failed. Please try again.');
        });
    }

    protected onOtpDigitInput(event: Event, index: number): void {
        const input = event.target as HTMLInputElement;
        const value = input.value;
        if (value.length === 1 && /^\d$/.test(value)) {
            this.otpDigits[index] = value;
            this.enteredOtp.set(this.otpDigits.join(''));
            // Auto-focus next input
            if (index < 5) {
                const next = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
                next?.focus();
            }
        } else {
            input.value = '';
            this.otpDigits[index] = '';
            this.enteredOtp.set(this.otpDigits.join(''));
        }
    }

    protected onOtpKeydown(event: KeyboardEvent, index: number): void {
        if (event.key === 'Backspace') {
            const input = event.target as HTMLInputElement;
            if (!input.value && index > 0) {
                const prev = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
                prev?.focus();
            }
            this.otpDigits[index] = '';
            this.enteredOtp.set(this.otpDigits.join(''));
        }
    }

    protected onOtpPaste(event: ClipboardEvent): void {
        event.preventDefault();
        const paste = event.clipboardData?.getData('text') || '';
        const digits = paste.replace(/\D/g, '').slice(0, 6);
        if (digits.length === 6) {
            for (let i = 0; i < 6; i++) {
                this.otpDigits[i] = digits[i];
                const el = document.getElementById(`otp-${i}`) as HTMLInputElement;
                if (el) el.value = digits[i];
            }
            this.enteredOtp.set(digits);
        }
    }

    private startResendCooldown(): void {
        this.resendCooldown.set(30);
        const interval = setInterval(() => {
            this.resendCooldown.update(v => {
                if (v <= 1) { clearInterval(interval); return 0; }
                return v - 1;
            });
        }, 1000);
    }

    private normalizePhone(phone: string): string {
        const digits = String(phone || '').replace(/\D/g, '');
        return digits.length > 10 ? digits.slice(-10) : digits;
    }
}
