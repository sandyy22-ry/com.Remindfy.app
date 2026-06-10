import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SemuaPage } from './semua.page';

const routes: Routes = [
  {
    path: '',
    component: SemuaPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SemuaPageRoutingModule {}
