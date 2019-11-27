import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { retry, catchError, flatMap } from 'rxjs/operators';
import { throwError, of } from 'rxjs';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {

    intercept(request: HttpRequest<any>, next: HttpHandler) {
        return next.handle(request);
    }
}