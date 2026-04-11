import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-privacy',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './privacy.component.html',
    styleUrl: './privacy.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {
    protected readonly lastUpdated = 'January 30, 2024';
}
