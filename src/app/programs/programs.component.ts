import { Component } from '@angular/core';
import { SharepointRestService } from '../sharepoint-rest.service';

@Component({
  selector: 'app-programs',
  templateUrl: './programs.component.html',
  styleUrls: ['./programs.component.scss']
})
export class ProgramsComponent {

  constructor(private restService: SharepointRestService) {
    this.restService.batchExecute([
      {
        method: `GET`,
        url: `web/lists/getbytitle('Programs')/items`
      },
      {
        method: `GET`,
        url: `web/lists/getbytitle('Gateway Titles')/items?$select=ID,Title,Active`
      },
      [
        {
          method: `POST`,
          url: `web/lists/getbytitle('Programs')/items`,
          bodyOrParams: { Title: `L465 25MY`, Code: `L465`, ModelYear: 25 }
        },
        {
          method: `POST`,
          url: `web/lists/getbytitle('Programs')/items`,
          bodyOrParams: { Title: `ASD 25.5MY`, Code: `ASD`, ModelYear: 25.5 }
        }
      ],
      {
        method: `GET`,
        url: `web/lists/getbytitle('Programs')/items`
      }
    ])/*.pipe(catchError(e => of(e)))*/.subscribe(val => {
      console.log(val);
    });
  }


}
