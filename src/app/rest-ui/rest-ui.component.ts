import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HttpRequest, HttpParams } from '@angular/common/http';
import { FormControl } from '@angular/forms';

import { startWith, shareReplay, withLatestFrom, scan, first, flatMap, tap, skip } from 'rxjs/operators';
import { combineLatest, Subject, Observable, of } from 'rxjs';

import { SharepointRestService, IRESTRequest } from '../sharepoint-rest.service';
import { ErrorStateMatcher } from '@angular/material/core';

interface Query {
  request: string,
  response: Observable<string>
}

@Component({
  selector: 'app-rest-ui',
  templateUrl: './rest-ui.component.html',
  styleUrls: ['./rest-ui.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RestUiComponent {

  readonly sendMethods = [`GET`, `POST`, `PATCH`, `DELETE`];
  readonly headerValues = [
    { value: `application/json; odata=nometadata`, text: `JSON (no meta data)` },
    { value: `application/json; odata=minimalmetadata`, text: `JSON (minimal meta data)` },
    { value: `application/json; odata=verbose`, text: `JSON (verbose)` }/*,
    { value: `application/atom+xml`, text: `XML` }*/
  ];

  readonly baseURLControl = new FormControl(`../../`);
  readonly restQueryControl = new FormControl(`_api/web/lists/getbytitle('Programs')/items`);
  readonly sendMethodControl = new FormControl(this.sendMethods[0]);
  readonly acceptHeaderControl = new FormControl(this.headerValues[0].value);
  readonly contentTypeHeaderControl = new FormControl(this.headerValues[0].value);
  readonly postDataControl = new FormControl(`{
    $select: "Title,Platform/Title",
    $expand: "Platform/Id",
    $filter: "(substringof('mid',Platform/Title) and substringof('ml',Platform/Title))"
  }`);

  readonly baseURLObservable: Observable<string> = this.baseURLControl.valueChanges.pipe(startWith(this.baseURLControl.value), shareReplay(1));
  readonly restQueryObservable: Observable<string> = this.restQueryControl.valueChanges.pipe(startWith(this.restQueryControl.value), shareReplay(1));
  readonly sendMethodObservable: Observable<'DELETE' | 'GET' | 'PATCH' | 'POST'> = this.sendMethodControl.valueChanges.pipe(startWith(this.sendMethodControl.value), shareReplay(1));
  readonly acceptHeaderObservable: Observable<string> = this.acceptHeaderControl.valueChanges.pipe(startWith(this.acceptHeaderControl.value), shareReplay(1));
  readonly contentTypeObservable: Observable<string> = this.contentTypeHeaderControl.valueChanges.pipe(startWith(this.contentTypeHeaderControl.value), shareReplay(1));
  readonly postDataObservable: Observable<string> = this.postDataControl.valueChanges.pipe(startWith(this.postDataControl.value), shareReplay(1));
  readonly sendObservable = new Subject<void>();

  readonly postDataObjectObservable = this.postDataObservable.pipe(
    flatMap(text => {
      text = text.trim();
      try {
        let postDataObject: {} = eval(`() => {return ${text}}`)();

        return of(postDataObject);
      }

      catch (e) {
        return of(e.message);
      }
    }),
    shareReplay(1)
  );

  readonly requestObjectObservable = combineLatest(
    combineLatest(this.baseURLObservable, this.restQueryObservable)
      .pipe(flatMap(values => of(values[0] + values[1]))),
    this.sendMethodObservable,
    this.acceptHeaderObservable,
    this.contentTypeObservable,
    this.postDataObjectObservable
  ).pipe(
    flatMap(values => {
      let sendMethod = values[1];
      let acceptHeaderValue = values[2];
      let postData = values[4];

      postData = typeof postData === `string` ? null : postData;

      let requestObject: IRESTRequest = {
        headers: {
          Accept: acceptHeaderValue
        },
        url: values[0],
        method: sendMethod
      };

      if (postData) {
        if ((sendMethod === `POST` || sendMethod === `PATCH`)) {
          requestObject.headers[`Content-Type`] = values[3];
          requestObject.bodyOrParams = postData;
        }

        else if (sendMethod === `GET`) {
          let indexOfQuestionMark = requestObject.url.indexOf(`?`);

          let params = (indexOfQuestionMark > -1 ? requestObject.url.substring(indexOfQuestionMark + 1) : ``)
            .split(`#`)[0]
            .split(`&`)
            .filter(value => value.length > 0)
            .map(pair => pair.split(`=`))
            .reduce((params, param) => {
              params[param[0]] = param[1];
              return params;
            }, {} as any);

          Object.assign(params, postData);

          const httpRequest = new HttpRequest("GET", requestObject.url.split(`?`)[0].split(`#`)[0], { params: new HttpParams({ fromObject: params }) });
          requestObject.url = httpRequest.urlWithParams;
        }
      }

      return of(requestObject);
    }),
    shareReplay(1)
  );

  readonly queriesObservable = this.sendObservable.pipe(
    withLatestFrom(this.requestObjectObservable),
    flatMap(dataArray => of(dataArray[1])),
    scan<IRESTRequest, Query[]>((queries, request) => {
      let query = {
        request: JSON.stringify(request, null, 2),
        response: this.restService.execute<Object>(request).pipe(
          flatMap(response => of(JSON.stringify(response, null, 2)))
        )
      };

      return [query, ...queries];
    }, [])
  );

  readonly postDataControlErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: control => control.invalid
  };

  constructor(private restService: SharepointRestService) {
    this.postDataControl.setAsyncValidators(() => {
      return this.postDataObjectObservable.pipe(
        skip(1),
        flatMap(postDataObject => of(this.isString(postDataObject) ? { dataObjectError: postDataObject } : null)),
        first()
      );
    });
  }

  isString(value: any) {
    return typeof value === `string` || value instanceof String;
  }
}