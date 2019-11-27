import { Injectable, ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { ErrorService } from './error.service';
import { LoggingService } from './logging.service';
import { NotificationService, NotificationType } from './notification.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

    constructor(
        private errorService: ErrorService,
        private loggingService: LoggingService,
        private notificationService: NotificationService
    ) { }

    handleError(error: Error | HttpErrorResponse) {
//debugger;
        let message: string;
        let stackTrace: string;

        if (error instanceof HttpErrorResponse) {
            message = this.errorService.getServerMessage(error);
            stackTrace = this.errorService.getServerStack(error);
        }

        else {
            message = this.errorService.getClientMessage(error);
            stackTrace = this.errorService.getClientStack(error);
        }

        this.notificationService.notify(NotificationType.ERROR, message);
        this.loggingService.logError(message, stackTrace);
    }
}