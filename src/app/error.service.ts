import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor() { }

  getClientMessage(error: Error) {
    if (!navigator.onLine) {
      return `No internet connection`;
    }

    return error.message ? error.message : error.toString();
  }

  getClientStack(error: Error) {
    return error.stack;
  }

  getServerMessage(error: HttpErrorResponse) {
    if (error) {
      if (error.error) {
        if (error.error[`odata.error`]) {
          if (error.error[`odata.error`]) {
            if (error.error[`odata.error`].message) {
              if (error.error[`odata.error`].message.value) {
                return error.error[`odata.error`].message.value;
              }
            }
          }
        }

        if (error.error.error) {
          if (error.error.error.message) {
            return error.error.error.message;
          }
        }
      }
    }

    return null;
  }

  getServerStack(error: HttpErrorResponse) {
    if (error) {
      if (error.error) {
        if (error.error.error) {
          if (error.error.error.stack) {
            return error.error.error.stack;
          }
        }
      }

      if (error.message) {
        return error.message;
      }
    }

    return null;
  }
}
