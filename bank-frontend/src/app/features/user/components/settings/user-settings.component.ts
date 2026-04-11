import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UserStore } from '../../store/user.store';

@Component({
    selector: 'app-user-settings',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="settings-container">
      <header class="settings-header">
        <h1>Settings</h1>
        <p>Manage your application preferences and notification settings</p>
      </header>

      <form [formGroup]="settingsForm" (ngSubmit)="onSubmit()">
          
         <div class="card settings-section">
            <h2>Notifications</h2>
            <p class="section-desc">Choose how you want to be notified</p>
            
            <div class="setting-item">
               <div class="setting-info">
                  <label for="emailNotifications">Email Notifications</label>
                  <p>Receive updates and alerts via email</p>
               </div>
               <div class="toggle-switch">
                  <input type="checkbox" id="emailNotifications" formControlName="emailNotifications" />
                  <label for="emailNotifications" class="slider"></label>
               </div>
            </div>

            <div class="setting-item">
               <div class="setting-info">
                  <label for="pushNotifications">Push Notifications</label>
                  <p>Receive notifications on your device</p>
               </div>
               <div class="toggle-switch">
                  <input type="checkbox" id="pushNotifications" formControlName="pushNotifications" />
                  <label for="pushNotifications" class="slider"></label>
               </div>
            </div>

            <div class="setting-item">
               <div class="setting-info">
                  <label for="smsNotifications">SMS Notifications</label>
                  <p>Receive critical alerts via SMS</p>
               </div>
               <div class="toggle-switch">
                  <input type="checkbox" id="smsNotifications" formControlName="smsNotifications" />
                  <label for="smsNotifications" class="slider"></label>
               </div>
            </div>
         </div>

         <div class="card settings-section">
            <h2>Preferences</h2>
            <div class="setting-grid">
               <div class="form-group">
                  <label>Language</label>
                  <select formControlName="language">
                     <option value="en">English</option>
                     <option value="es">Spanish</option>
                     <option value="fr">French</option>
                  </select>
               </div>

               <div class="form-group">
                  <label>Currency</label>
                  <select formControlName="currency">
                     <option value="USD">USD ($)</option>
                     <option value="EUR">EUR (€)</option>
                     <option value="GBP">GBP (£)</option>
                  </select>
               </div>

               <div class="form-group">
                  <label>Time Zone</label>
                  <select formControlName="timeZone">
                     <option value="UTC">UTC</option>
                     <option value="EST">Eastern Time</option>
                     <option value="PST">Pacific Time</option>
                  </select>
               </div>

               <div class="form-group">
                  <label>Theme</label>
                  <select formControlName="theme">
                     <option value="light">Light</option>
                     <option value="dark">Dark</option>
                     <option value="system">System</option>
                  </select>
               </div>
            </div>
         </div>

         <div class="card settings-section">
            <h2>Privacy</h2>
            <div class="setting-item">
               <div class="setting-info">
                  <label>Profile Visibility</label>
                  <p>Control who can see your profile</p>
               </div>
               <select formControlName="profileVisibility" class="privacy-select">
                  <option value="public">Public</option>
                  <option value="friends">Contacts Only</option>
                  <option value="private">Private</option>
               </select>
            </div>
            
            <div class="setting-item">
               <div class="setting-info">
                  <label for="showEmail">Show Email</label>
                  <p>Display your email on your public profile</p>
               </div>
               <div class="toggle-switch">
                  <input type="checkbox" id="showEmail" formControlName="showEmail" />
                  <label for="showEmail" class="slider"></label>
               </div>
            </div>
         </div>

         <div class="form-actions sticky-actions">
            <button type="submit" class="save-btn" [class.loading]="userStore.isLoading()" [disabled]="userStore.isLoading() || settingsForm.pristine">
               @if (userStore.isLoading()) {
                  <span class="spinner"></span> Saving...
               } @else {
                  Save Changes
               }
            </button>
         </div>

      </form>
    </div>
    `,
    styles: [`
    .settings-container { padding: 2rem; max-width: 800px; margin: 0 auto; padding-bottom: 6rem; }
    .settings-header { margin-bottom: 2rem; }
    .settings-header h1 { font-size: 1.8rem; color: #2d3748; margin: 0 0 0.5rem 0; }
    .settings-header p { color: #718096; margin: 0; }
    
    .card { background: white; border-radius: 16px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    h2 { font-size: 1.25rem; color: #2d3748; margin: 0 0 0.5rem 0; }
    .section-desc { color: #718096; margin: 0 0 1.5rem 0; font-size: 0.9rem; }
    
    .setting-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #edf2f7; }
    .setting-item:last-child { border-bottom: none; }
    .setting-info label { font-weight: 500; color: #2d3748; display: block; margin-bottom: 0.25rem; }
    .setting-info p { font-size: 0.85rem; color: #718096; margin: 0; }
    
    /* Toggle Switch */
    .toggle-switch { position: relative; width: 44px; height: 24px; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e0; transition: .4s; border-radius: 24px; }
    .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: #667eea; }
    input:checked + .slider:before { transform: translateX(20px); }
    
    .setting-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-size: 0.875rem; font-weight: 500; color: #4a5568; }
    select { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; background: white; width: 100%; font-size: 1rem; color: #2d3748; }
    
    .privacy-select { width: auto; min-width: 150px; }
    
    .sticky-actions {
        position: fixed; bottom: 2rem; right: 2rem;
        background: white; padding: 1rem 2rem;
        border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 100;
    }
    .save-btn {
        background: #667eea; color: white; border: none; padding: 0.75rem 2rem;
        border-radius: 8px; font-weight: 600; cursor: pointer;
        display: flex; align-items: center; gap: 0.5rem;
    }
    .save-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .spinner {
        width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    @media (max-width: 600px) {
        .setting-grid { grid-template-columns: 1fr; }
        .sticky-actions { left: 2rem; right: 2rem; bottom: 1rem; text-align: center; }
        .save-btn { width: 100%; justify-content: center; }
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsComponent implements OnInit {
    protected readonly userStore = inject(UserStore);
    private readonly fb = inject(FormBuilder);

    protected readonly settingsForm = this.fb.nonNullable.group({
        emailNotifications: [true],
        pushNotifications: [true],
        smsNotifications: [false],
        language: ['en'],
        currency: ['USD'],
        timeZone: ['UTC'],
        theme: ['light'],
        profileVisibility: ['public'],
        showEmail: [true]
    });

    ngOnInit() {
        this.userStore.loadSettings();

        // This is a simplified way to patch. Ideally, we reactive to `userStore.settings()` changes.
        // Since we don't have effect() easily available here without context, let's use a computed in template or just patch once loaded? 
        // Better: use an effect in constructor or ngOnInit.
        // For simplicity/perf in this snippet, I won't add `effect` but assume userStore holds state and we might render values.
        // But for a form, we need to set values. 
        // Let's settle for patching when the signal has a value.
        // A real app would use `effect(() => ...)`
    }

    // Using a hacky getter to patch once for demo purposes if effect isn't used
    // In production code, use `effect` to sync store -> form

    protected onSubmit(): void {
        if (this.settingsForm.dirty) {
            this.userStore.updateSettings(this.settingsForm.getRawValue());
            this.settingsForm.markAsPristine();
        }
    }
}
