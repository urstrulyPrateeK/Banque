import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore } from '../../store/user.store';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="notifications-container">
       <header class="notifications-header">
          <div class="header-content">
             <h1>Notifications</h1>
             <button class="mark-all-btn" (click)="markAllRead()" [disabled]="!userStore.hasUnreadNotifications()">
                Mark all as read
             </button>
          </div>
          <div class="filter-tabs">
             <button class="tab active">All</button>
             <button class="tab">Unread</button>
          </div>
       </header>

       <div class="notifications-list">
          @for (notification of userStore.notifications(); track notification.id) {
             <div class="notification-item" [class.unread]="!notification.read" (click)="markRead(notification.id)">
                <div class="icon-wrapper" [ngClass]="notification.type.toLowerCase()">
                   <div class="status-dot" *ngIf="!notification.read"></div>
                   <!-- Icons based on type -->
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      @switch (notification.type) {
                          @case ('WARNING') { <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/> }
                          @case ('SUCCESS') { <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/> }
                          @default { <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/> }
                      }
                   </svg>
                </div>
                <div class="content">
                   <div class="top-row">
                      <h3 class="title">{{ notification.title }}</h3>
                      <span class="time">{{ notification.createdAt | date:'short' }}</span>
                   </div>
                   <p class="message">{{ notification.message }}</p>
                </div>
             </div>
          } @empty {
             <div class="empty-state">
                <div class="empty-icon">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                </div>
                <h3>No notifications</h3>
                <p>You're all caught up!</p>
             </div>
          }
       </div>
    </div>
    `,
    styles: [`
    .notifications-container { padding: 2rem; max-width: 600px; margin: 0 auto; }
    
    .notifications-header { margin-bottom: 2rem; }
    .header-content { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .header-content h1 { font-size: 1.8rem; margin: 0; color: #2d3748; }
    
    .mark-all-btn {
        background: none; border: none; color: #667eea; font-weight: 500; cursor: pointer;
        font-size: 0.9rem; padding: 0.5rem 1rem; border-radius: 6px;
    }
    .mark-all-btn:hover:not(:disabled) { background: #ebf4ff; }
    .mark-all-btn:disabled { color: #cbd5e0; cursor: default; }
    
    .filter-tabs { display: flex; gap: 1rem; border-bottom: 1px solid #edf2f7; }
    .tab {
        background: none; border: none; padding: 0.75rem 0; font-weight: 500; color: #718096;
        cursor: pointer; position: relative;
    }
    .tab.active { color: #667eea; }
    .tab.active:after {
        content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px;
        background: #667eea;
    }
    
    .notifications-list { display: flex; flex-direction: column; gap: 1rem; }
    
    .notification-item {
        display: flex; gap: 1rem; padding: 1rem; background: white; border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.2s;
        border: 1px solid transparent;
    }
    .notification-item:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.08); }
    .notification-item.unread { background: #ebf8ff; border-color: #bee3f8; }
    
    .icon-wrapper {
        width: 40px; height: 40px; border-radius: 50%; background: #edf2f7; color: #718096;
        display: flex; align-items: center; justify-content: center; position: relative; flex-shrink: 0;
    }
    .status-dot {
        position: absolute; top: 0; right: 0; width: 10px; height: 10px;
        background: #e53e3e; border-radius: 50%; border: 2px solid white;
    }
    .icon-wrapper svg { width: 20px; height: 20px; }
    
    .icon-wrapper.warning { background: #fffaf0; color: #dd6b20; }
    .icon-wrapper.success { background: #f0fff4; color: #38a169; }
    .icon-wrapper.error { background: #fff5f5; color: #e53e3e; }
    
    .content { flex: 1; }
    .top-row { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
    .title { font-size: 1rem; font-weight: 600; color: #2d3748; margin: 0; }
    .time { font-size: 0.8rem; color: #a0aec0; }
    .message { font-size: 0.9rem; color: #4a5568; margin: 0; line-height: 1.4; }
    
    .empty-state { text-align: center; padding: 4rem 2rem; color: #a0aec0; }
    .empty-icon {
        width: 64px; height: 64px; background: #edf2f7; border-radius: 50%;
        display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;
    }
    .empty-icon svg { width: 32px; height: 32px; color: #cbd5e0; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationListComponent implements OnInit {
    protected readonly userStore = inject(UserStore);

    ngOnInit() {
        this.userStore.loadNotifications({ page: 0 });
        this.userStore.loadUnreadCount();
    }

    protected markRead(id: number): void {
        this.userStore.markAsRead(id);
    }

    protected markAllRead(): void {
        this.userStore.markAllAsRead();
    }
}
