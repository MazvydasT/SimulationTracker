import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RestUiComponent } from './rest-ui.component';

const routes: Routes = [{ path: '', component: RestUiComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RestUiRoutingModule { }
