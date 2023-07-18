import { Component } from '@angular/core'
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { DataService } from './services/data.service';
import { ThemeService } from './services/theme.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  ready = false;
  dataLoss = false;

  constructor(
    private readonly _dataService: DataService,
    private readonly _themeService: ThemeService,
    private readonly _domSanitizer: DomSanitizer,
    private readonly _matIconRegistry: MatIconRegistry,
    private readonly _router: Router
  ) {
    this._dataService.onData.subscribe(() => { this.onData(); });
    this._themeService.init();

    _matIconRegistry.addSvgIconSet(_domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/icons.svg'));

    window.addEventListener('storage', () => {
      this.dataLoss = true;
    });
  }

  onData(): void {
    this.ready = true;

    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key.toUpperCase() === 'F') {
        event.preventDefault();
        void this._router.navigate(['/'], { skipLocationChange: true }).then(() => {
          void this._router.navigate(['/search']);
        });
      }
    });
  }
}
