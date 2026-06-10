import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HariIniPage } from './hari-ini.page';

const routes: Routes = [
  {
    path: '',
    component: HariIniPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HariIniPageRoutingModule {}
