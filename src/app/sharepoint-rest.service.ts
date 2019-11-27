import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest } from '@angular/common/http';

import { flatMap, shareReplay, switchMap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

import { v4 } from 'uuid';

interface IContextInfo {
  Expires: Date,
  FormDigestTimeoutSeconds: number,
  FormDigestValue: string,
  LibraryVersion: string,
  SiteFullUrl: string,
  SupportedSchemaVersions: string[],
  WebFullUrl: string
}

export interface IRESTRequest {
  url: string;

  bodyOrParams?: any;
  headers?: { [name: string]: string };
  method?: `DELETE` | `GET` | `PATCH` | `POST`;
}

export interface IGetRESTRequest extends IRESTRequest {
  method: `GET`;
}

export interface IPostRESTRequest extends IRESTRequest {
  method: `DELETE` | `PATCH` | `POST`;
}

@Injectable({
  providedIn: 'root'
})
export class SharepointRestService {

  private readonly contextInfoObservable = of({
    Expires: new Date()
  } as IContextInfo).pipe(
    flatMap(contextInfo => {
      if (new Date() <= contextInfo.Expires)
        return of(contextInfo);

      else
        return this.httpClient.post<IContextInfo>(`_api/contextinfo`, null)
          .pipe(
            switchMap(newContextInfo => {

              newContextInfo.Expires = new Date();
              newContextInfo.Expires.setSeconds(newContextInfo.Expires.getSeconds() + newContextInfo.FormDigestTimeoutSeconds - 60);

              Object.assign(contextInfo, newContextInfo);

              return of(contextInfo);
            })
          );
    })
  );

  private readonly siteURLObservable = this.contextInfoObservable.pipe(
    flatMap(contextInfo => of(contextInfo.WebFullUrl)),
    shareReplay(1)
  );

  constructor(private httpClient: HttpClient) { }

  batchExecute(requests: (IGetRESTRequest | IPostRESTRequest | IPostRESTRequest[])[]) {
    if (requests.length === 0)
      return of([]);

    let batchId = `batch_${v4()}`;

    let batchContents: string[] = [];

    for (let i = 0, c = requests.length; i < c; ++i) {
      let request = requests[i];

      if (!Array.isArray(request)) {

        switch (request.method) {
          case `GET`: {
            batchContents = [
              ...batchContents,
              `--${batchId}`,
              `Content-Type: application/http`,
              `Content-Transfer-Encoding: binary`,
              ``,
              `${request.method} ${request.url} HTTP/1.1`,
              `Accept: application/json; odata=minimalmetadata`,
              ``
            ]
            break;
          }

          case `DELETE`:
          case `PATCH`:
          case `POST`: {
            let changesetId = `changeset_${v4()}`;

            batchContents = [
              ...batchContents,
              `--${batchId}`,
              `Content-Type: multipart/mixed; boundary=${changesetId}`,
              ``,
              `--${changesetId}`,
              `Content-Type: application/http`,
              `Content-Transfer-Encoding: binary`,
              ``,
              `${request.method} ${request.url} HTTP/1.1`,
              `Accept: application/json; odata=minimalmetadata`
            ];

            if (request.method !== `DELETE`)
              batchContents.push(`Content-Type: application/json`);

            batchContents.push(``);

            if (request.bodyOrParams) {
              batchContents = [
                ...batchContents,
                JSON.stringify(request.bodyOrParams),
                ``
              ];
            }

            batchContents.push(`--${changesetId}--`);

            if (i + 1 < c)
              batchContents.push(``);

            break;
          }
        }
      }

      else {
        let changesetId = `changeset_${v4()}`;

        batchContents = [
          ...batchContents,
          `--${batchId}`,
          `Content-Type: multipart/mixed; boundary=${changesetId}`,
          ``
        ];

        let groupedRequestsContent = request.map(groupedRequestsItem => {
          let groupedRequestItemContent = [
            `--${changesetId}`,
            `Content-Type: application/http`,
            `Content-Transfer-Encoding: binary`,
            ``,
            `${groupedRequestsItem.method} ${groupedRequestsItem.url} HTTP/1.1`,
            `Accept: application/json; odata=minimalmetadata`
          ];

          if (groupedRequestsItem.method !== `DELETE`)
            groupedRequestItemContent.push(`Content-Type: application/json`);

          groupedRequestItemContent.push(``);

          if (groupedRequestsItem.bodyOrParams) {
            groupedRequestItemContent = [
              ...groupedRequestItemContent,
              JSON.stringify(groupedRequestsItem.bodyOrParams),
              ``
            ];
          }

          return groupedRequestItemContent.join('\r\n');
        });

        batchContents = [
          ...batchContents,
          ...groupedRequestsContent,
          `--${changesetId}--`
        ];

        if (i + 1 < c)
          batchContents.push(``);
      }
    }

    batchContents = [
      ...batchContents,
      `--${batchId}--`
    ];

    let batchBody = batchContents.join('\r\n');

    return this.siteURLObservable.pipe(
      flatMap(siteURL => this.execute({
        headers: {
          Accept: `application/json; odata=nometadata`,
          'Content-Type': `multipart/mixed; boundary=${batchId}`
        },
        bodyOrParams: batchBody,
        method: `POST`,
        url: `${siteURL}/_api/$batch`
      }, `text`)),
      flatMap(response => of(response.split(`\n`)
        .filter(line => line.startsWith(`{`))
        .map(line => JSON.parse(line))))
    );
  }


  execute(restRequest: IRESTRequest, responseType: `arraybuffer`): Observable<ArrayBuffer>;
  execute(restRequest: IRESTRequest, responseType: `blob`): Observable<Blob>;
  execute(restRequest: IRESTRequest, responseType: `text`): Observable<string>;
  execute<T>(restRequest: IRESTRequest): Observable<T>;
  execute(restRequest: IRESTRequest, responseType: `arraybuffer` | `blob` | `json` | `text` = `json`): any {

    const bodyOrParams = restRequest.bodyOrParams || {};
    const headers = restRequest.headers || {};
    const method = restRequest.method || `GET`;
    const url = restRequest.url;

    headers.Accept = headers.Accept || `application/json; odata=minimalmetadata`;

    if (~[`PATCH`, `POST`].indexOf(method))
      headers[`Content-Type`] = headers[`Content-Type`] || `application/json; odata=nometadata`;

    return (~[`DELETE`, `PATCH`, `POST`].indexOf(method) ? this.contextInfoObservable : of(null as IContextInfo))
      .pipe(
        flatMap(contextInfo => {
          if (contextInfo !== null)
            headers[`X-RequestDigest`] = contextInfo.FormDigestValue;

          const options: any = {
            headers: headers,
            responseType: responseType as `text`
          };

          switch (method) {
            case `DELETE`:
              return this.httpClient.delete(url, options);

            case `GET`:
              options.params = bodyOrParams;
              return this.httpClient.get(url, options);

            case `PATCH`:
              return this.httpClient.patch(url, bodyOrParams, options);

            case `POST`:
              return this.httpClient.post(url, bodyOrParams, options);
          }
        })
      );
  }
}