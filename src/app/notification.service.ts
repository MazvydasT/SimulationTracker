import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { scan } from 'rxjs/operators';

export enum NotificationType {
  INFO,
  WARNING,
  ERROR,
  SUCCESS
};

export interface INotification {
  type: NotificationType,
  message: string
};

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly notificationsSubject = new Subject<INotification>();
  private readonly notificationsObservable = this.notificationsSubject.pipe(
    scan<INotification, INotification[]>((notifications, notification) => {
      return [notification, ...notifications]
    }, [])
  );

  constructor() { }

  notify(type: NotificationType, message: string) {
    this.notificationsSubject.next({
      type: type,
      message: message
    });
  }

  getNotifications() {
    return this.notificationsObservable;
  }
}
