import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublicNavbarComponent } from '../public-navbar/public-navbar.component';

@Component({
    selector: 'app-public-layout',
    standalone: true,
    imports: [RouterOutlet, PublicNavbarComponent],
    template: `
        <app-public-navbar />
        <main class="public-main">
            <router-outlet />
        </main>
    `,
    styles: [`
    .public-main {
        padding-top: 56px;
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayoutComponent {}
