import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { SemuaPageRoutingModule } from './semua-routing.module';
import { SemuaPage } from './semua.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, SemuaPageRoutingModule],
  declarations: [SemuaPage],
})
export class SemuaPageModule {}
