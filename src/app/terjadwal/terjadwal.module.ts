import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { TerjadwalPageRoutingModule } from './terjadwal-routing.module';
import { TerjadwalPage } from './terjadwal.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TerjadwalPageRoutingModule],
  declarations: [TerjadwalPage],
})
export class TerjadwalPageModule {}
