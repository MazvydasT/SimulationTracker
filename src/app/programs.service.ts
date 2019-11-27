import { Injectable } from '@angular/core';
import { SharepointRestService } from './sharepoint-rest.service';

@Injectable({
  providedIn: 'root'
})
export class ProgramsService {

  constructor(private restService: SharepointRestService) { }

  readonly programs = this.restService.batchExecute([
    { method: `GET`, url: `web/lists/getbytitle('Programs')/items?$select=Title,Platform/Title&$expand=Platform/Id` }
  ]).pipe();
}