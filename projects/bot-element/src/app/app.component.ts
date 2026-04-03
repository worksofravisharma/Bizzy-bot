import { Component } from '@angular/core';

/**
 * Root shell for the element app (matches registration-widget: index.html has &lt;app-root&gt;).
 * The embeddable UI is upgraded via {@link AppModule}'s custom element registration on
 * &lt;lib-bizzy-bot&gt;; this component is not bootstrapped when using DoBootstrap + bootstrap: [].
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {}
