import { Component, inject, OnInit, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserStore } from '../../store/user.store';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="profile-container">
      <header class="profile-header">
        <div class="avatar-section">
          <div class="avatar-wrapper">
             @if (userStore.profile()?.avatarUrl) {
                <img 
                    [src]="userStore.profile()?.avatarUrl + '?t=' + Date.now()" 
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
                  <h3>Two-Factor Authentication</h3>
                  <p>Add an extra layer of security to your account</p>
               </div>
               <span class="badge" [class.success]="userStore.profile()?.mfaEnabled" [class.warning]="!userStore.profile()?.mfaEnabled">
                 {{ userStore.profile()?.mfaEnabled ? 'Enabled' : 'Disabled' }}
               </span>
            </div>
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
        background: linear-gradient(135deg, #667eea, #764ba2);
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
        border: 1px solid #e2e8f0;
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
        background: #f7fafc;
        transform: scale(1.1);
    }
    
    .avatar-upload-label svg {
        width: 16px;
        height: 16px;
        color: #4a5568;
    }
    
    .hidden-input { display: none; }
    
    .user-info h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.8rem;
        color: #2d3748;
    }
    
    .email {
        color: #718096;
        margin-bottom: 1rem;
    }
    
    .role-badge {
        padding: 0.25rem 0.75rem;
        background: #edf2f7;
        color: #4a5568;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .role-badge.admin {
        background: #fed7d7;
        color: #c53030;
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
        color: #2d3748;
        margin: 0;
    }
    
    .edit-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #e2e8f0;
        background: white;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }
    
    .edit-btn:hover { background: #f7fafc; }
    .edit-btn.active { background: #e2e8f0; }
    
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
        color: #718096;
        font-weight: 500;
    }
    
    .static-value {
        padding: 0.75rem 0;
        border-bottom: 1px solid #e2e8f0;
        color: #2d3748;
        margin: 0;
    }
    
    .form-group input {
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
        width: 100%;
    }
    
    .form-divider {
        font-size: 0.875rem;
        font-weight: 600;
        color: #a0aec0;
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
        background: #667eea;
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
        border-bottom: 1px solid #e2e8f0;
    }
    
    .security-item:last-child { border-bottom: none; }
    
    .security-item h3 {
        font-size: 1rem;
        color: #2d3748;
        margin: 0 0 0.25rem 0;
    }
    
    .security-item p {
        font-size: 0.875rem;
        color: #718096;
        margin: 0;
    }
    
    .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
        background: #e2e8f0;
        color: #4a5568;
    }
    
    .badge.success { background: #c6f6d5; color: #38a169; }
    .badge.warning { background: #feebc8; color: #dd6b20; }
    
    .action-link {
        background: none;
        border: none;
        color: #667eea;
        font-weight: 500;
        cursor: pointer;
        padding: 0;
    }
    
    @media (max-width: 768px) {
        .profile-content { grid-template-columns: 1fr; }
        .avatar-section { flex-direction: column; text-align: center; }
        .form-grid { grid-template-columns: 1fr; }
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
    protected readonly userStore = inject(UserStore);
    private readonly fb = inject(FormBuilder);

    protected readonly isEditing = signal(false);

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

    protected readonly Date = Date;

    ngOnInit() {
        this.userStore.loadProfile();
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
            // Sanitize payload: convert empty strings to undefined for optional fields
            const payload = Object.entries(rawValue).reduce((acc, [key, value]) => {
                if (value === '' || value === null) {
                    return acc;
                }
                return { ...acc, [key]: value };
            }, {} as any);

            // Ensure required fields are present
            if (!payload.firstName) payload.firstName = rawValue.firstName;
            if (!payload.lastName) payload.lastName = rawValue.lastName;

            this.userStore.updateProfile(payload);
            this.isEditing.set(false);
        }
    }

    protected onAvatarSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.userStore.uploadAvatar(input.files[0]);
        }
    }

    protected onAvatarError(event: Event): void {
        console.error('Failed to load avatar image:', event);
        console.error('Attempted source:', (event.target as HTMLImageElement).src);
        // Fallback or additional handling could go here
    }

    protected logAvatarUrl(url: string | undefined | null): string {
        console.log('Current avatar URL from store:', url);
        return '';
    }
}
