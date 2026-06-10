import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { HariIniPageRoutingModule } from './hari-ini-routing.module';
import { HariIniPage } from './hari-ini.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, HariIniPageRoutingModule],
  declarations: [HariIniPage],
})
export class HariIniPageModule {}
