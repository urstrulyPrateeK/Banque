import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './about.component.html',
    styleUrl: './about.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
    protected readonly values = [
        {
            icon: '🎯',
            title: 'Customer First',
            description: 'We put our customers at the heart of everything we do, ensuring their financial success is our top priority.'
        },
        {
            icon: '🔒',
            title: 'Security & Trust',
            description: 'Your financial data is protected with bank-level encryption and industry-leading security measures.'
        },
        {
            icon: '💡',
            title: 'Innovation',
            description: 'We continuously innovate to provide cutting-edge banking solutions that make your life easier.'
        },
        {
            icon: '🤝',
            title: 'Transparency',
            description: 'Clear communication, no hidden fees, and complete transparency in all our services.'
        }
    ];

    protected readonly milestones = [
        { year: '2020', event: 'Founded with a vision to revolutionize digital banking' },
        { year: '2021', event: 'Reached 100,000 active users' },
        { year: '2022', event: 'Launched mobile banking app' },
        { year: '2023', event: 'Expanded to international markets' },
        { year: '2024', event: 'Reached 2 million users milestone' }
    ];
}
