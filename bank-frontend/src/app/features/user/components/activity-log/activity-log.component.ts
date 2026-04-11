import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore } from '../../store/user.store';

@Component({
    selector: 'app-activity-log',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="activity-container">
      <header class="activity-header">
         <h1>Activity Log</h1>
         <p>Recent actions and security events on your account</p>
      </header>

      <div class="card">
         <div class="activity-list">
            @for (activity of userStore.activities(); track activity.id) {
               <div class="activity-item">
                  <div class="activity-icon" [ngClass]="getActivityType(activity.action)">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        @switch (getActivityType(activity.action)) {
                           @case ('login') { <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/> }
                           @case ('security') { <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> }
                           @default { <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/> }
                        }
                     </svg>
                  </div>
                  <div class="activity-details">
                     <div class="activity-main">
                        <span class="action">{{ activity.action }}</span>
                        <span class="date">{{ activity.createdAt | date:'medium' }}</span>
                     </div>
                     <p class="description">{{ activity.description }}</p>
                     <div class="meta">
                        <span class="ip" title="IP Address">{{ activity.ipAddress }}</span>
                        <span class="separator">•</span>
                        <span class="device" title="Device">{{ activity.userAgent }}</span>
                     </div>
                  </div>
               </div>
            } @empty {
               <div class="empty-state">
                  <p>No recent activity found.</p>
               </div>
            }
         </div>
         
         <div class="pagination">
            <button class="page-btn" disabled>Previous</button>  <!-- Add pagination logic later -->
            <button class="page-btn">Next</button>
         </div>
      </div>
    </div>
    `,
    styles: [`
    .activity-container { padding: 2rem; max-width: 800px; margin: 0 auto; }
    .activity-header h1 { font-size: 1.8rem; color: #2d3748; margin: 0 0 0.5rem 0; }
    .activity-header p { color: #718096; margin-bottom: 2rem; }
    
    .card { background: white; border-radius: 16px; padding: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    
    .activity-item {
        display: flex; gap: 1rem; padding: 1.5rem;
        border-bottom: 1px solid #edf2f7;
        transition: background 0.2s;
    }
    .activity-item:last-child { border-bottom: none; }
    .activity-item:hover { background: #f7fafc; }
    
    .activity-icon {
        width: 40px; height: 40px; border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
    }
    .activity-icon svg { width: 20px; height: 20px; }
    
    .activity-icon.login { background: #ebf8ff; color: #4299e1; }
    .activity-icon.security { background: #fff5f5; color: #f56565; }
    .activity-icon.general { background: #edf2f7; color: #718096; }
    
    .activity-details { flex: 1; }
    
    .activity-main {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 0.25rem;
    }
    
    .action { font-weight: 600; color: #2d3748; }
    .date { font-size: 0.85rem; color: #a0aec0; }
    
    .description { color: #4a5568; margin: 0 0 0.5rem 0; }
    
    .meta { font-size: 0.75rem; color: #718096; display: flex; align-items: center; gap: 0.5rem; }
    .separator { color: #cbd5e0; }
    
    .empty-state { padding: 3rem; text-align: center; color: #a0aec0; }
    
    .pagination {
        display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem;
        border-top: 1px solid #edf2f7;
    }
    .page-btn {
        padding: 0.5rem 1rem; border: 1px solid #e2e8f0; background: white;
        border-radius: 6px; color: #4a5568; cursor: pointer;
    }
    .page-btn:disabled { opacity: 0.5; cursor: default; }
    .page-btn:hover:not(:disabled) { background: #f7fafc; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogComponent implements OnInit {
    protected readonly userStore = inject(UserStore);

    ngOnInit() {
        this.userStore.loadActivities({ page: 0 });
    }

    protected getActivityType(action: string): string {
        const lower = action.toLowerCase();
        if (lower.includes('login') || lower.includes('logout')) return 'login';
        if (lower.includes('password') || lower.includes('mfa') || lower.includes('security')) return 'security';
        return 'general';
    }
}
