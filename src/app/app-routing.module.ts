import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'pengingat',
    loadChildren: () => import('./pengingat/pengingat.module').then((m) => m.PengingatPageModule),
  },
  {
    path: 'selesai',
    loadChildren: () => import('./selesai/selesai.module').then((m) => m.SelesaiPageModule),
  },
  {
    path: 'semua',
    loadChildren: () => import('./semua/semua.module').then((m) => m.SemuaPageModule),
  },
  {
    path: 'terjadwal',
    loadChildren: () => import('./terjadwal/terjadwal.module').then((m) => m.TerjadwalPageModule),
  },
  {
    path: 'hari-ini',
    loadChildren: () => import('./hari-ini/hari-ini.module').then((m) => m.HariIniPageModule),
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
