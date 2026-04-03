import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  /** Demo config for local dev; map to `[config]` when wiring a backend token. */
  demoConfig: string | null = null;
}
