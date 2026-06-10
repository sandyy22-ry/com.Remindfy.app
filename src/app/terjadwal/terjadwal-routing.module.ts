import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TerjadwalPage } from './terjadwal.page';

const routes: Routes = [
  {
    path: '',
    component: TerjadwalPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TerjadwalPageRoutingModule {}
