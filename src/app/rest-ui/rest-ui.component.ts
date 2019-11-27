import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';

import { flatMap, startWith, shareReplay, withLatestFrom, scan, take } from 'rxjs/operators';
import { combineLatest, of, Subject, Observable } from 'rxjs';

import { SharepointRestService, IRESTRequest } from '../sharepoint-rest.service';

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

  baseURLControl = new FormControl(`../../`);
  restQueryControl = new FormControl(`_api/web/lists/getbytitle('Programs')/items?$select=Title,Platform/Title&$expand=Platform/Id&$filter=(substringof('mid',Platform/Title) and substringof('ml',Platform/Title))`);
  sendMethodControl = new FormControl(this.sendMethods[0]);
  acceptHeaderControl = new FormControl(this.headerValues[0].value);
  contentTypeHeaderControl = new FormControl(this.headerValues[0].value);
  postDataControl = new FormControl(``);

  baseURLObservable: Observable<string> = this.baseURLControl.valueChanges.pipe(startWith(this.baseURLControl.value), shareReplay(1));
  restQueryObservable: Observable<string> = this.restQueryControl.valueChanges.pipe(startWith(this.restQueryControl.value), shareReplay(1));
  sendMethodObservable: Observable<'DELETE' | 'GET' | 'PATCH' | 'POST'> = this.sendMethodControl.valueChanges.pipe(startWith(this.sendMethodControl.value), shareReplay(1));
  acceptHeaderObservable: Observable<string> = this.acceptHeaderControl.valueChanges.pipe(startWith(this.acceptHeaderControl.value), shareReplay(1));
  contentTypeObservable: Observable<string> = this.contentTypeHeaderControl.valueChanges.pipe(startWith(this.contentTypeHeaderControl.value), shareReplay(1));
  postDataObservable: Observable<string> = this.postDataControl.valueChanges.pipe(startWith(this.postDataControl.value), shareReplay(1));
  sendObservable = new Subject<void>();

  postDataObjectObservable = this.postDataObservable.pipe(
    flatMap(text => {
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

  requestObjectObservable = combineLatest(
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

      if ((sendMethod === `POST` || sendMethod === `PATCH`) && postData) {
        requestObject.headers[`Content-Type`] = values[3];
        requestObject.bodyOrParams = postData;
      }

      return of(requestObject);
    }),
    shareReplay(1)
  );

  queriesObservable = this.sendObservable.pipe(
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

  constructor(private restService: SharepointRestService) { }

  isString(value: any) {
    return typeof value === `string` || value instanceof String;
  }
}