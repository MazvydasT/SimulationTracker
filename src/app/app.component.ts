import { Component, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly navigation = [
    { title: `Programs`, link: `/programs` },
    { title: `REST UI`, link: `/rest-ui` }
  ];

  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar,
    private zone: NgZone
  ) {
    this.notificationService.getNotifications().subscribe(notifications => {
      let notification = notifications[0];

      this.zone.run(() => {
        this.snackBar.open(notification.message, `X`);
      })
    });
  }
}
