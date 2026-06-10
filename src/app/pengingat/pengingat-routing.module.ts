import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PengingatPage } from './pengingat.page';

const routes: Routes = [
  {
    path: '',
    component: PengingatPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PengingatPageRoutingModule {}
