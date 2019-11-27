import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: `programs`, loadChildren: () => import('./programs/programs.module').then(module => module.ProgramsModule) },
  { path: 'rest-ui', loadChildren: () => import('./rest-ui/rest-ui.module').then(m => m.RestUiModule) },
  { path: `**`, redirectTo: `` }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
