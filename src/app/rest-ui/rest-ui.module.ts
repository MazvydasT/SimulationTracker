import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatRadioModule } from '@angular/material/radio';

import { FlexLayoutModule } from '@angular/flex-layout';

import { RestUiRoutingModule } from './rest-ui-routing.module';
import { RestUiComponent } from './rest-ui.component';


@NgModule({
  declarations: [RestUiComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    RestUiRoutingModule,
    MatSidenavModule,
    MatRadioModule,
    FlexLayoutModule
  ]
})
export class RestUiModule { }
