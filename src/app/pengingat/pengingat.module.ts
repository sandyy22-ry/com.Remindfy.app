import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { PengingatPageRoutingModule } from './pengingat-routing.module';
import { PengingatPage } from './pengingat.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, PengingatPageRoutingModule],
  declarations: [PengingatPage],
})
export class PengingatPageModule {}
