import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { SelesaiPageRoutingModule } from './selesai-routing.module';
import { SelesaiPage } from './selesai.page';
import { PhotoViewerComponent } from './photo-viewer/photo-viewer.component';

@NgModule({
  imports: [CommonModule, IonicModule, SelesaiPageRoutingModule],
  declarations: [SelesaiPage, PhotoViewerComponent],
})
export class SelesaiPageModule {}
